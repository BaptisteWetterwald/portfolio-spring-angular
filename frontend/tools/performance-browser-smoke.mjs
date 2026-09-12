import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const serverEntry = resolve('dist/frontend/server/server.mjs');
const chromePath = resolveChromePath();

assert(existsSync(serverEntry), 'build the frontend before running the performance smoke test');

const backendCounts = { github: 0, projects: { en: 0, fr: 0 } };
const backend = createServer((request, response) => {
  response.setHeader('Content-Type', 'application/json');

  const url = new URL(request.url ?? '/', 'http://backend.test');

  if (url.pathname === '/api/v1/github/activity') {
    backendCounts.github += 1;
    response.end(JSON.stringify(githubActivity()));
    return;
  }

  if (url.pathname === '/api/v1/projects') {
    const locale = url.searchParams.get('locale');

    if (locale === 'en' || locale === 'fr') {
      backendCounts.projects[locale] += 1;
      response.end(JSON.stringify([project(locale)]));
      return;
    }
  }

  response.statusCode = 404;
  response.end('{}');
});
let frontend;
let frontendOutput = '';

async function runPerformanceSmoke() {
  await listen(backend);

  const backendAddress = backend.address();
  const backendPort =
    typeof backendAddress === 'object' && backendAddress ? backendAddress.port : 0;
  const frontendPort = await availablePort();
  const frontendOrigin = `http://127.0.0.1:${frontendPort}`;
  const internalOrigin = `http://127.0.0.1:${backendPort}`;
  frontend = spawn(process.execPath, [serverEntry], {
    env: {
      ...process.env,
      BACKEND_INTERNAL_ORIGIN: `${internalOrigin}/`,
      PORT: String(frontendPort),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  frontend.stdout.on('data', (chunk) => (frontendOutput += chunk));
  frontend.stderr.on('data', (chunk) => (frontendOutput += chunk));

  try {
    await waitForHttp(`${frontendOrigin}/robots.txt`);
    console.log('Performance smoke SSR server ready');
    await verifyTransferredSsrState(frontendOrigin, internalOrigin);
    console.log('Performance smoke transfer state verified');
    resetBackendCounts();
    await verifyHydrationAndPortraitSelection(frontendOrigin);
  } finally {
    frontend.kill();
    backend.closeAllConnections();
    await close(backend);
  }
}

async function verifyTransferredSsrState(publicOrigin, privateOrigin) {
  resetBackendCounts();

  const response = await fetch(`${publicOrigin}/en`);
  const html = await response.text();

  assert(response.status === 200, `SSR /en returned ${response.status}`);
  assert(backendCounts.projects.en === 1, 'SSR must make exactly one English Projects GET');
  assert(backendCounts.github === 1, 'SSR must make exactly one GitHub GET');
  assert(!html.includes(privateOrigin), 'SSR HTML exposes the plain internal backend origin');
  assert(
    !html.includes(privateOrigin.replaceAll('/', '\\u002F')),
    'SSR HTML exposes the escaped internal backend origin',
  );

  const stateMatch = html.match(/<script id="ng-state"[^>]*>(.*?)<\/script>/su);

  assert(stateMatch, 'SSR HTML is missing Angular transfer state');

  const state = JSON.parse(stateMatch[1]);
  const transferredApiResponses = Object.values(state).filter(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      'u' in entry &&
      typeof entry.u === 'string' &&
      entry.u.includes('/api/v1/'),
  );
  const responseUrls = transferredApiResponses.map((entry) => entry.u).sort();

  assert(responseUrls.length === 2, 'SSR must transfer Projects and GitHub responses');
  assert(
    responseUrls.every((url) => url.startsWith(`${publicOrigin}/api/v1/`)),
    `transferred response URLs must use the public origin: ${responseUrls.join(', ')}`,
  );
}

async function verifyHydrationAndPortraitSelection(origin) {
  const debuggingPort = await availablePort();
  const profileDirectory = mkdtempSync(join(tmpdir(), 'portfolio-performance-smoke-'));
  const browser = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-gpu',
      '--disable-sync',
      '--no-default-browser-check',
      '--no-first-run',
      `--remote-debugging-port=${debuggingPort}`,
      '--remote-allow-origins=*',
      `--user-data-dir=${profileDirectory}`,
      'about:blank',
    ],
    { stdio: 'ignore', windowsHide: true },
  );
  let cdp;

  try {
    await waitForChrome(debuggingPort);
    const tab = await createTab(debuggingPort);
    cdp = await CdpClient.connect(tab.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });

    const browserRequests = [];
    cdp.on('Network.requestWillBeSent', ({ request }) => browserRequests.push(request.url));

    const reviews = [
      { width: 1440, height: 900, dpr: 1, expectedWidth: 240 },
      { width: 1440, height: 900, dpr: 2, expectedWidth: 480 },
      { width: 390, height: 844, dpr: 3, expectedWidth: 480 },
      { width: 360, height: 800, dpr: 3, expectedWidth: 480 },
    ];
    const portraitSelections = [];

    for (const review of reviews) {
      browserRequests.length = 0;
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: review.width,
        height: review.height,
        deviceScaleFactor: review.dpr,
        mobile: false,
      });
      await cdp.send('Page.navigate', { url: `${origin}/en` });
      await waitFor(
        cdp,
        `document.readyState === 'complete' && document.querySelector('.home-page__portrait')?.complete === true`,
      );
      await delay(500);

      const immediateApiRequests = browserRequests.filter((url) => url.includes('/api/v1/'));
      const portrait = await value(
        cdp,
        `(() => {
          const image = document.querySelector('.home-page__portrait');
          const frame = document.querySelector('.home-page__portrait-photo-frame');
          const imageStyle = getComputedStyle(image);
          const frameStyle = getComputedStyle(frame);
          const bounds = image.getBoundingClientRect();
          return {
            currentSrc: image.currentSrc,
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            renderedWidth: bounds.width,
            renderedHeight: bounds.height,
            objectFit: imageStyle.objectFit,
            objectPosition: imageStyle.objectPosition,
            frameOverflow: frameStyle.overflow,
            frameBorderRadius: frameStyle.borderRadius
          };
        })()`,
      );

      assert(
        immediateApiRequests.length === 0,
        `hydration duplicated API GETs at ${review.width}x${review.height}/DPR${review.dpr}: ${immediateApiRequests.join(', ')}`,
      );
      assert(
        portrait.currentSrc.endsWith(
          `baptiste-wetterwald-portrait-v1-${review.expectedWidth}w.avif`,
        ),
        `unexpected portrait at ${review.width}x${review.height}/DPR${review.dpr}: ${portrait.currentSrc}`,
      );
      assert(
        portrait.objectFit === 'cover' &&
          portrait.objectPosition === '50% 50%' &&
          portrait.frameOverflow === 'hidden',
        'portrait porthole composition changed',
      );
      assert(portrait.frameBorderRadius !== '0px', 'portrait porthole lost its round clipping');

      portraitSelections.push({ ...review, ...portrait });
      console.log(
        `Verified ${review.width}x${review.height}/DPR${review.dpr}: ${portrait.currentSrc}`,
      );
    }

    assert(
      backendCounts.projects.en === reviews.length,
      `expected ${reviews.length} SSR English Projects GETs, got ${backendCounts.projects.en}`,
    );
    assert(
      backendCounts.github === reviews.length,
      `expected ${reviews.length} SSR GitHub GETs, got ${backendCounts.github}`,
    );

    browserRequests.length = 0;
    const projectsBeforeLocaleSwitch = backendCounts.projects.fr;
    const githubBeforeLocaleSwitch = backendCounts.github;
    await evaluate(cdp, `document.querySelector('.locale-switcher__link[lang="fr"]').click()`);
    await waitFor(cdp, `location.pathname === '/fr'`);
    await delay(500);

    const localeSwitchApiRequests = browserRequests.filter((url) => url.includes('/api/v1/'));

    assert(
      localeSwitchApiRequests.some(
        (url) => url.includes('/api/v1/projects') && url.includes('locale=fr'),
      ),
      'post-stability locale navigation did not request French projects',
    );
    assert(
      localeSwitchApiRequests.some((url) => url.includes('/api/v1/github/activity')),
      'post-stability locale navigation did not request GitHub activity',
    );
    assert(
      backendCounts.projects.fr === projectsBeforeLocaleSwitch + 1 &&
        backendCounts.github === githubBeforeLocaleSwitch + 1,
      'post-stability browser requests did not reach the backend exactly once',
    );

    console.log(
      JSON.stringify(
        {
          initialHydrationBrowserApiRequests: 0,
          localeSwitchBrowserApiRequests: localeSwitchApiRequests.length,
          portraitSelections,
          ssrRequestsPerNavigation: { github: 1, projects: 1 },
        },
        null,
        2,
      ),
    );
  } finally {
    cdp?.close();
    browser.kill();

    try {
      rmSync(profileDirectory, { force: true, recursive: true });
    } catch {
      // Chrome can briefly retain its temporary profile on Windows.
    }
  }
}

function githubActivity() {
  return {
    available: true,
    profileUrl: 'https://github.com/BaptisteWetterwald',
    repositories: [],
    contributionCalendar: null,
    lastRefreshedAt: '2026-09-12T00:00:00Z',
    stale: false,
  };
}

function project(locale) {
  return {
    slug: 'portfolio-spring-angular',
    title: locale === 'fr' ? 'Portfolio Spring Angular FR' : 'Portfolio Spring Angular EN',
    shortDescription: 'Deterministic performance smoke fixture.',
    logoMediaRef: null,
    githubUrl: null,
    demoUrl: null,
    featured: true,
    status: 'PUBLISHED',
    presentationMode: 'DETAIL',
    displayOrder: 1,
    technologies: [],
  };
}

function resetBackendCounts() {
  backendCounts.github = 0;
  backendCounts.projects.en = 0;
  backendCounts.projects.fr = 0;
}

async function evaluate(client, expression) {
  await client.send('Runtime.evaluate', { awaitPromise: true, expression });
}

async function value(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    awaitPromise: true,
    expression,
    returnByValue: true,
  });

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text);
  }

  return result.result.value;
}

async function waitFor(client, expression) {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    if (await value(client, `Boolean(${expression})`)) {
      return;
    }

    await delay(50);
  }

  throw new Error(`Timed out waiting for: ${expression}`);
}

function resolveChromePath() {
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
    throw new Error('Chrome was not found. Set CHROME_PATH to run the performance smoke test.');
  }

  return path;
}

async function availablePort() {
  const server = createServer();
  await listen(server);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  await close(server);
  return port;
}

async function listen(server) {
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
}

async function close(server) {
  await new Promise((resolveClose, reject) =>
    server.close((error) => (error ? reject(error) : resolveClose())),
  );
}

async function waitForHttp(url) {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    if (frontend.exitCode !== null) {
      throw new Error(`SSR server exited early:\n${frontendOutput}`);
    }

    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // The SSR server is still starting.
    }

    await delay(80);
  }

  throw new Error(`SSR server did not start:\n${frontendOutput}`);
}

async function waitForChrome(port) {
  const deadline = Date.now() + 8_000;

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

async function createTab(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?about%3Ablank`, {
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error(`Could not create a Chrome tab: ${response.status}`);
  }

  return response.json();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

class CdpClient {
  #handlers = new Map();
  #id = 0;
  #listeners = new Map();

  static async connect(url) {
    const socket = new WebSocket(url);

    await new Promise((resolveOpen, reject) => {
      socket.addEventListener('open', resolveOpen, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });

    return new CdpClient(socket);
  }

  constructor(socket) {
    this.socket = socket;
    socket.addEventListener('message', (message) => {
      const payload = JSON.parse(message.data);

      if (payload.id) {
        const handler = this.#handlers.get(payload.id);

        if (!handler) {
          return;
        }

        this.#handlers.delete(payload.id);
        payload.error
          ? handler.reject(new Error(payload.error.message))
          : handler.resolve(payload.result);
        return;
      }

      for (const listener of this.#listeners.get(payload.method) ?? []) {
        listener(payload.params);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.#id;

    return new Promise((resolveSend, reject) => {
      this.#handlers.set(id, { reject, resolve: resolveSend });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    const listeners = this.#listeners.get(method) ?? [];

    listeners.push(listener);
    this.#listeners.set(method, listeners);
  }

  close() {
    this.socket.close();
  }
}

await runPerformanceSmoke();
