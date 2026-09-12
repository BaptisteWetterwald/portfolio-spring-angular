import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origin = process.env['A11Y_SMOKE_ORIGIN'] ?? 'http://127.0.0.1:4000';
const viewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
  { width: 320, height: 800 },
];

async function run() {
  const port = await availablePort();
  const profileDirectory = mkdtempSync(join(tmpdir(), 'portfolio-a11y-smoke-'));
  const browser = spawn(
    chromePath(),
    [
      '--headless=new',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-gpu',
      '--disable-sync',
      '--no-default-browser-check',
      '--no-first-run',
      `--remote-debugging-port=${port}`,
      '--remote-allow-origins=*',
      `--user-data-dir=${profileDirectory}`,
      'about:blank',
    ],
    { stdio: 'ignore', windowsHide: true },
  );

  let client;

  try {
    await waitForChrome(port);
    const tab = await createTab(port, `${origin}/en`);
    client = await CdpClient.connect(tab.webSocketDebuggerUrl);
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Accessibility.enable');

    for (const viewport of viewports) {
      await setViewport(client, viewport.width, viewport.height);
      await setReducedMotion(client, false);
      await verifyRouteFocus(client);
      await assertNoDocumentOverflow(client);

      if (viewport.width <= 390) {
        await verifySonarEscape(client);
      }

      console.log(`OK focus and reflow ${viewport.width}x${viewport.height}`);
    }

    await setViewport(client, 1440, 900);
    await verifyLocaleAndErrorFocus(client);
    await verifyPassiveScrollFocus(client);

    const contrast = await measureContrast(client);
    assert(
      contrast.light.contact.current >= 3 && contrast.dark.contact.current >= 3,
      `Contact field boundary contrast is below 3:1: ${JSON.stringify(contrast)}`,
    );
    assert(
      contrast.light.calendar.currentBorders.every((ratio) => ratio >= 3) &&
        contrast.dark.calendar.currentBorders.every((ratio) => ratio >= 3),
      `Positive calendar boundaries are below 3:1: ${JSON.stringify(contrast)}`,
    );
    console.log(`CONTRAST ${JSON.stringify(contrast)}`);

    await goto(client, '/en');
    const accessibilityTree = await client.send('Accessibility.getFullAXTree');
    const landmarkCounts = countLandmarks(accessibilityTree.nodes ?? []);

    assert(
      landmarkCounts.navigation === 3 && landmarkCounts.complementary === 0,
      `Unexpected main-page landmark counts: ${JSON.stringify(landmarkCounts)}`,
    );
    console.log(`LANDMARKS ${JSON.stringify(landmarkCounts)}`);

    await setReducedMotion(client, true);
    await setViewport(client, 390, 844);
    await goto(client, '/en');
    const reducedMotion = await value(
      client,
      `(() => {
        const sonar = getComputedStyle(document.querySelector('.sonar-nav--floating'));
        const beam = getComputedStyle(document.querySelector('.lighthouse-beam'));
        return {
          matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
          sonarTransitionDuration: sonar.transitionDuration,
          beamAnimationDuration: beam.animationDuration,
        };
      })()`,
    );

    assert(
      reducedMotion.matches &&
        allDurationsAreReduced(reducedMotion.sonarTransitionDuration) &&
        allDurationsAreReduced(reducedMotion.beamAnimationDuration),
      `Reduced-motion regression: ${JSON.stringify(reducedMotion)}`,
    );
    console.log(`REDUCED_MOTION ${JSON.stringify(reducedMotion)}`);
    console.log('Headless Chrome accessibility interaction checks passed');
  } finally {
    client?.close();
    browser.kill();

    try {
      rmSync(profileDirectory, { force: true, recursive: true });
    } catch {
      // Chrome can briefly retain a profile handle on Windows.
    }
  }
}

async function verifyRouteFocus(client) {
  await goto(client, '/en');
  await waitFor(client, `document.querySelector('a[href="/en/projects/blaze4"]') !== null`);
  await evaluate(client, `document.querySelector('a[href="/en/projects/blaze4"]').click()`);
  await waitFor(
    client,
    `location.pathname === '/en/projects/blaze4' && document.activeElement?.id === 'project-title'`,
  );
  await evaluate(client, `document.querySelector('.project-detail__back-link').click()`);
  await waitFor(
    client,
    `location.pathname === '/en' && location.hash === '#projects' && document.activeElement?.id === 'projects'`,
  );
}

async function verifyLocaleAndErrorFocus(client) {
  await goto(client, '/fr');
  await evaluate(client, `document.querySelector('.locale-switcher a[href="/en"]').click()`);
  await waitFor(
    client,
    `location.pathname === '/en' && document.activeElement?.id === 'home-title'`,
  );

  await evaluate(
    client,
    `history.pushState({}, '', '/en/projects/missing-project'); dispatchEvent(new PopStateEvent('popstate'))`,
  );
  await waitFor(
    client,
    `location.pathname === '/en/projects/missing-project' && document.querySelector('app-not-found-page') && document.activeElement?.matches('[data-route-focus-target]')`,
  );
  await evaluate(client, `document.querySelector('app-not-found-page a').click()`);
  await waitFor(
    client,
    `location.pathname === '/en' && location.hash === '#projects' && document.activeElement?.id === 'projects'`,
  );
  console.log('OK locale, project 404, and recovery focus');
}

async function verifyPassiveScrollFocus(client) {
  await goto(client, '/en');
  const retained = await value(
    client,
    `(() => {
      const button = document.querySelector('.theme-toggle');
      button.focus();
      document.querySelector('#contact').scrollIntoView({ behavior: 'instant' });
      return document.activeElement === button;
    })()`,
  );

  await delay(250);
  assert(
    retained && (await value(client, `document.activeElement?.matches('.theme-toggle')`)),
    'Passive section scrolling stole keyboard focus',
  );
  console.log('OK passive section scrolling retains focus');
}

async function verifySonarEscape(client) {
  await goto(client, '/en');
  await evaluate(client, `document.querySelector('.sonar-nav__compact-button').focus()`);
  await waitFor(
    client,
    `document.querySelector('.sonar-nav__compact-button')?.getAttribute('aria-expanded') === 'true'`,
  );
  await pressKey(client, 'Tab', 9);
  assert(
    await value(client, `document.activeElement?.matches('.sonar-nav__link')`),
    'Tab did not enter the expanded sonar links',
  );
  await pressKey(client, 'Escape', 27);
  await waitFor(
    client,
    `document.querySelector('.sonar-nav__compact-button')?.getAttribute('aria-expanded') === 'false'`,
  );
  assert(
    await value(
      client,
      `document.activeElement?.matches('.sonar-nav__compact-button') && [...document.querySelectorAll('.sonar-nav--floating .sonar-nav__link')].every((link) => link.tabIndex === -1)`,
    ),
    'Escape did not collapse the focused sonar and retain sensible focus',
  );
  await pressKey(client, 'Tab', 9);
  assert(
    await value(client, `document.activeElement?.matches('.theme-toggle')`),
    'Tab did not continue from the collapsed sonar to the next global control',
  );
}

async function assertNoDocumentOverflow(client) {
  const layout = await value(
    client,
    `(() => {
      const controls = document.querySelector('.maritime-floating-controls').getBoundingClientRect();
      return {
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        controlsInsideViewport: controls.left >= 0 && controls.right <= innerWidth && controls.top >= 0 && controls.bottom <= innerHeight,
      };
    })()`,
  );

  assert(
    !layout.horizontalOverflow,
    `Document-level horizontal overflow: ${JSON.stringify(layout)}`,
  );
  assert(
    layout.controlsInsideViewport,
    `Floating controls left the viewport: ${JSON.stringify(layout)}`,
  );
}

async function measureContrast(client) {
  await goto(client, '/en');
  await waitFor(
    client,
    `document.querySelector('.github-contribution-calendar__day--level-4') !== null`,
  );

  return value(
    client,
    `(async () => {
      const parse = (color) => {
        const channels = color.match(/[\\d.]+/g).slice(0, 3).map(Number);
        return color.startsWith('color(srgb')
          ? channels.map((channel) => channel * 255)
          : channels;
      };
      const luminance = (color) => {
        const channels = parse(color).map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
      };
      const contrast = (first, second) => {
        const a = luminance(first);
        const b = luminance(second);
        return Number(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2));
      };
      const adjacentContrast = (colors) =>
        colors.slice(0, -1).map((color, index) => contrast(color, colors[index + 1]));
      const resolveColor = (value) => {
        const probe = document.createElement('span');
        probe.style.color = value;
        document.body.append(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      };
      const result = {};

      for (const theme of ['light', 'dark']) {
        document.documentElement.dataset.theme = theme;
        await new Promise((resolve) => requestAnimationFrame(() => resolve()));
        const inputStyle = getComputedStyle(document.querySelector('#contact-name'));
        const calendarStyle = getComputedStyle(document.querySelector('.github-contribution-calendar'));
        const calendarBackground = calendarStyle.backgroundColor;
        const currentFills = [1, 2, 3, 4].map((level) =>
          getComputedStyle(document.querySelector('.github-contribution-calendar__day--level-' + level)).backgroundColor,
        );
        const currentBorders = [1, 2, 3, 4].map((level) =>
          getComputedStyle(document.querySelector('.github-contribution-calendar__day--level-' + level)).borderTopColor,
        );
        const oldFills = [
          resolveColor('color-mix(in srgb, var(--color-accent-maritime) 24%, var(--color-surface))'),
          resolveColor('color-mix(in srgb, var(--color-accent-maritime) 46%, var(--color-surface))'),
          resolveColor('color-mix(in srgb, var(--color-accent-maritime) 72%, var(--color-surface))'),
          resolveColor('var(--color-accent-maritime)'),
        ];
        const oldContactBorder = resolveColor(
          'color-mix(in srgb, var(--color-accent-maritime) 24%, var(--color-border))',
        );

        result[theme] = {
          contact: {
            before: contrast(oldContactBorder, inputStyle.backgroundColor),
            current: contrast(inputStyle.borderTopColor, inputStyle.backgroundColor),
          },
          calendar: {
            beforeFills: oldFills.map((fill) => contrast(fill, calendarBackground)),
            beforePositiveAdjacent: adjacentContrast(oldFills),
            currentFills: currentFills.map((fill) => contrast(fill, calendarBackground)),
            currentPositiveAdjacent: adjacentContrast(currentFills),
            currentBorders: currentBorders.map((border) => contrast(border, calendarBackground)),
          },
        };
      }

      return result;
    })()`,
  );
}

function countLandmarks(nodes) {
  const counts = { navigation: 0, complementary: 0 };

  for (const node of nodes) {
    const role = node.role?.value;

    if (!node.ignored && role in counts) {
      counts[role] += 1;
    }
  }

  return counts;
}

async function goto(client, path) {
  await client.send('Page.navigate', { url: `${origin}${path}` });
  await waitFor(
    client,
    `document.readyState === 'complete' && location.href === ${JSON.stringify(`${origin}${path}`)}`,
  );
  await delay(120);
}

async function setViewport(client, width, height) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width <= 640,
  });
}

async function setReducedMotion(client, reduce) {
  await client.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
}

async function pressKey(client, key, windowsVirtualKeyCode) {
  await client.send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown',
    key,
    code: key,
    windowsVirtualKeyCode,
  });
  await client.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key,
    code: key,
    windowsVirtualKeyCode,
  });
  await delay(80);
}

async function waitFor(client, expression, timeout = 8000) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    if (await value(client, expression)) {
      return;
    }

    await delay(50);
  }

  throw new Error(`Timed out waiting for: ${expression}`);
}

async function value(client, expression) {
  const result = await evaluate(client, expression);

  return result.result.value;
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? 'Browser evaluation failed');
  }

  return result;
}

function allDurationsAreReduced(value) {
  return value.split(',').every((duration) => Number.parseFloat(duration) <= 0.001);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function chromePath() {
  const candidates = [
    process.env['CHROME_PATH'],
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  const path = candidates.find((candidate) => existsSync(candidate));

  if (!path) {
    throw new Error('Chrome was not found. Set CHROME_PATH to run the accessibility smoke test.');
  }

  return path;
}

async function availablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : undefined;

      server.close((error) => {
        if (error || !port) {
          reject(error ?? new Error('Could not reserve a CDP port'));
          return;
        }

        resolve(port);
      });
    });
  });
}

async function waitForChrome(port) {
  const deadline = Date.now() + 8000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);

      if (response.ok) {
        return;
      }
    } catch {
      // Chrome is still starting.
    }

    await delay(80);
  }

  throw new Error('Chrome DevTools Protocol did not become available');
}

async function createTab(port, url) {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, {
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error(`Could not create a Chrome tab: ${response.status}`);
  }

  return response.json();
}

class CdpClient {
  #handlers = new Map();
  #id = 0;

  static async connect(url) {
    const socket = new WebSocket(url);

    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });

    return new CdpClient(socket);
  }

  constructor(socket) {
    this.socket = socket;
    socket.addEventListener('message', (message) => {
      const payload = JSON.parse(message.data);
      const handler = this.#handlers.get(payload.id);

      if (!handler) {
        return;
      }

      this.#handlers.delete(payload.id);

      if (payload.error) {
        handler.reject(new Error(payload.error.message));
      } else {
        handler.resolve(payload.result);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.#id;

    return new Promise((resolve, reject) => {
      this.#handlers.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

await run();
