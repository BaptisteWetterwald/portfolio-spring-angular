import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const origin = process.env['BROWSER_SMOKE_ORIGIN'] ?? 'http://127.0.0.1:4000';
const screenshotDirectory = process.env['BROWSER_SMOKE_SCREENSHOT_DIR'];
const chromePath = resolveChromePath();

async function runBrowserSmoke() {
  const debuggingPort = await availablePort();
  const profileDirectory = mkdtempSync(join(tmpdir(), 'portfolio-browser-smoke-'));
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
    const tab = await createTab(debuggingPort, `${origin}/en`);
    cdp = await CdpClient.connect(tab.webSocketDebuggerUrl);

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');

    const browserErrors = [];

    cdp.on('Runtime.consoleAPICalled', (event) => {
      if (event.type === 'error') {
        browserErrors.push(
          event.args.map((argument) => argument.value ?? argument.description).join(' '),
        );
      }
    });
    cdp.on('Log.entryAdded', (event) => {
      if (event.entry.level === 'error') {
        browserErrors.push(`${event.entry.url ?? ''} ${event.entry.text}`.trim());
      }
    });

    await verifyDesktop(cdp);
    await verifyMobile(cdp, 390, 844, true);
    await verifyMobile(cdp, 360, 800, false);

    const relevantErrors = browserErrors.filter(
      (message) => !message.includes('favicon.ico') && !message.includes('net::ERR_ABORTED'),
    );

    assert(relevantErrors.length === 0, `browser console errors: ${relevantErrors.join(' | ')}`);
    console.log('Headless Chrome single-page browser checks passed');
  } finally {
    cdp?.close();
    browser.kill();

    try {
      rmSync(profileDirectory, { force: true, recursive: true });
    } catch {
      // Chrome may briefly retain a profile handle on Windows; the OS temp directory can clean it.
    }
  }
}

async function verifyDesktop(client) {
  await setViewport(client, 1440, 900);
  await setReducedMotion(client, false);
  await goto(client, '/en');
  await waitFor(
    client,
    `document.querySelector('.public-shell')?.dataset.navigationHandoffState === 'header'`,
  );

  assert(
    await value(
      client,
      `(() => {
        const header = document.querySelector('.site-header');
        const navigation = header?.querySelector('[data-primary-nav]');
        const shell = document.querySelector('.public-shell');
        const sonarHost = document.querySelector('.maritime-floating-controls__sonar');
        const sonarButton = document.querySelector('.maritime-floating-controls .sonar-nav__compact-button');
        const lighthouse = document.querySelector('.maritime-floating-controls__lighthouse');
        const heroHeading = document.querySelector('#home h1');
        if (!header || !navigation || !shell || !sonarHost || !sonarButton || !lighthouse || !heroHeading) return false;
        const lighthouseBounds = lighthouse.getBoundingClientRect();
        const sonarStyles = getComputedStyle(sonarHost);
        const shellStyles = getComputedStyle(shell);
        return getComputedStyle(navigation).display !== 'none' &&
          shell.dataset.navigationHandoffState === 'header' &&
          navigation.getAttribute('aria-hidden') === null &&
          !navigation.hasAttribute('inert') &&
          sonarHost.getAttribute('aria-hidden') === 'true' &&
          sonarHost.hasAttribute('inert') &&
          sonarStyles.visibility === 'hidden' &&
          Number(sonarStyles.opacity) === 0 &&
          shellStyles.getPropertyValue('--navigation-handoff-duration').trim() === '.42s' &&
          shellStyles.getPropertyValue('--navigation-handoff-easing').trim() === 'cubic-bezier(.22, 1, .36, 1)' &&
          !document.querySelector('.site-header__sonar') &&
          !document.querySelector('nav[data-sonar-nav-variant="primary"]') &&
          !document.querySelector('.site-header app-lighthouse-theme-toggle') &&
          document.querySelectorAll('app-lighthouse-theme-toggle').length === 1 &&
          lighthouseBounds.left > innerWidth / 2 &&
          heroHeading.getBoundingClientRect().top < 420;
      })()`,
    ),
    'desktop top shell did not expose header navigation with a non-interactive hidden sonar',
  );
  assert(
    !(await value(
      client,
      `(() => {
        const button = document.querySelector('.sonar-nav__compact-button');
        button.focus();
        return document.activeElement === button;
      })()`,
    )),
    'inert top-state sonar accepted programmatic focus',
  );

  if ((await value(client, `document.documentElement.dataset.theme`)) !== 'dark') {
    await clickElement(client, '.maritime-floating-controls .theme-toggle');
  }

  await waitFor(
    client,
    `document.querySelector('.lighthouse-beam--ready[data-lighthouse-beam-state="active"]')?.getAnimations().length === 1`,
  );
  assert(
    await value(
      client,
      `(() => {
        const beam = document.querySelector('.lighthouse-beam');
        const lantern = document.querySelector('[data-lighthouse-lantern="floating"]');
        const lanternBounds = lantern.getBoundingClientRect();
        const styles = getComputedStyle(beam);
        const originX = parseFloat(styles.getPropertyValue('--lighthouse-beam-origin-x'));
        const originY = parseFloat(styles.getPropertyValue('--lighthouse-beam-origin-y'));
        const width = parseFloat(styles.height);
        const duration = parseFloat(styles.animationDuration);
        window.__portfolioPersistentLighthouse = lantern;
        window.__portfolioPersistentBeamAnimation = beam.getAnimations()[0];
        window.__portfolioPersistentBeamStartTime = beam.getAnimations()[0].startTime;
        return beam.dataset.lighthouseBeamSource === 'floating' &&
          Math.abs(originX - (lanternBounds.left + lanternBounds.width / 2)) < 2 &&
          Math.abs(originY - (lanternBounds.top + lanternBounds.height / 2)) < 2 &&
          duration === 24 && width >= 400 && width <= 430;
      })()`,
    ),
    'beam did not use the single floating lantern with the tuned duration and width',
  );
  await captureScreenshot(client, 'desktop-1440x900-header-navigation-state.png');

  await evaluate(
    client,
    `(() => {
      window.__navigationHandoffStates = [document.querySelector('.public-shell').dataset.navigationHandoffState];
      window.__navigationHandoffObserver = new MutationObserver(() => {
        window.__navigationHandoffStates.push(document.querySelector('.public-shell').dataset.navigationHandoffState);
      });
      window.__navigationHandoffObserver.observe(document.querySelector('.public-shell'), {
        attributes: true,
        attributeFilter: ['data-navigation-handoff-state'],
      });
    })()`,
  );

  await setNavigationHandoffState(client, 'sonar', true);
  await captureScreenshot(client, 'desktop-1440x900-navigation-handoff.png');
  await delay(470);
  assert(
    await value(
      client,
      `(() => {
        const shell = document.querySelector('.public-shell');
        const navigation = document.querySelector('.site-header__nav');
        const sonarHost = document.querySelector('.maritime-floating-controls__sonar');
        const sonarButton = document.querySelector('.sonar-nav__compact-button');
        const sonarBounds = sonarButton.getBoundingClientRect();
        const sonarStyles = getComputedStyle(sonarHost);
        const headerStyles = getComputedStyle(navigation);
        const activeHeader = navigation.querySelector('[aria-current="location"]');
        const activeSonar = document.querySelector('nav[data-sonar-nav-variant="floating"] [aria-current="location"]');
        return shell.dataset.navigationHandoffState === 'sonar' &&
          sonarHost.getAttribute('aria-hidden') === null &&
          !sonarHost.hasAttribute('inert') &&
          sonarStyles.visibility === 'visible' &&
          Number(sonarStyles.opacity) === 1 &&
          (sonarStyles.transform === 'none' || sonarStyles.transform === 'matrix(1, 0, 0, 1, 0, 0)') &&
          navigation.getAttribute('aria-hidden') === 'true' &&
          navigation.hasAttribute('inert') &&
          Number(headerStyles.opacity) === 0 &&
          Math.abs(sonarBounds.width - 68) < 1 &&
          Math.abs(sonarBounds.height - 68) < 1 &&
          sonarBounds.left < innerWidth / 2 &&
          activeHeader?.getAttribute('href') === '/en#home' &&
          activeSonar?.getAttribute('href') === '/en#home';
      })()`,
    ),
    'desktop header-to-sonar handoff did not finish in the approved compact state',
  );
  await captureScreenshot(client, 'desktop-1440x900-floating-sonar-state.png');

  const sonarButtonBounds = await rect(client, '.sonar-nav__compact-button');
  await moveMouse(client, ...center(sonarButtonBounds));
  await waitFor(
    client,
    `document.querySelector('.sonar-nav__frame').getBoundingClientRect().width > 300`,
  );
  await moveMouse(client, 720, 100);
  await waitFor(
    client,
    `document.querySelector('.sonar-nav__frame').getBoundingClientRect().width < 80`,
  );

  await setNavigationHandoffState(client, 'header', true);
  await delay(470);
  assert(
    await value(
      client,
      `document.querySelector('.maritime-floating-controls__sonar').hasAttribute('inert') &&
        document.querySelector('.site-header__nav').getAttribute('aria-hidden') === null`,
    ),
    'reverse handoff did not restore header navigation cleanly',
  );

  for (let crossing = 0; crossing < 3; crossing += 1) {
    await setNavigationHandoffState(client, 'sonar');
    await setNavigationHandoffState(client, 'header');
  }
  assert(
    await value(
      client,
      `window.__navigationHandoffStates.join(',') === 'header,sonar,header,sonar,header,sonar,header,sonar,header'`,
    ),
    'repeated threshold crossings flickered or produced unstable handoff states',
  );

  await evaluate(
    client,
    `document.querySelector('.site-header__nav [aria-current="location"]').focus()`,
  );
  await setNavigationHandoffState(client, 'sonar');
  const focusedHeaderState = await value(
    client,
    `(() => {
      const navigation = document.querySelector('.site-header__nav');
      return {
        containsFocus: navigation.contains(document.activeElement),
        inert: navigation.hasAttribute('inert'),
        ariaHidden: navigation.getAttribute('aria-hidden'),
        opacity: Number(getComputedStyle(navigation).opacity),
      };
    })()`,
  );
  assert(
    focusedHeaderState.containsFocus &&
      !focusedHeaderState.inert &&
      focusedHeaderState.ariaHidden === null &&
      focusedHeaderState.opacity > 0.99,
    `focused header navigation was hidden during passive handoff: ${JSON.stringify(focusedHeaderState)}`,
  );
  await evaluate(client, `document.querySelector('app-locale-switcher a').focus()`);
  await waitFor(client, `document.querySelector('.site-header__nav').hasAttribute('inert')`);
  await evaluate(client, `document.querySelector('.sonar-nav__compact-button').focus()`);
  assert(
    await value(
      client,
      `document.activeElement === document.querySelector('.sonar-nav__compact-button')`,
    ),
    'active floating sonar was not keyboard focusable after handoff',
  );
  await evaluate(client, `document.activeElement.blur()`);

  const startingHistoryLength = await value(client, 'history.length');

  for (const sectionId of ['home', 'education', 'experience', 'projects', 'contact']) {
    await ensureFloatingSonarActive(client);
    if (
      (await value(
        client,
        `document.querySelector('.maritime-floating-controls .sonar-nav__compact-button').getAttribute('aria-expanded')`,
      )) !== 'true'
    ) {
      await clickElement(client, '.maritime-floating-controls .sonar-nav__compact-button');
      await waitFor(
        client,
        `document.querySelector('.maritime-floating-controls .sonar-nav__compact-button').getAttribute('aria-expanded') === 'true'`,
      );
    }
    await waitFor(
      client,
      `document.querySelector('.sonar-nav__frame').getBoundingClientRect().width > 300`,
    );

    await clickElement(client, `nav[data-sonar-nav-variant="floating"] a[href="/en#${sectionId}"]`);
    await waitFor(
      client,
      `location.hash === '#${sectionId}' && document.querySelector('nav[data-sonar-nav-variant="floating"] a[href="/en#${sectionId}"]').getAttribute('aria-current') === 'location'`,
    );
    assert(
      (await value(
        client,
        `document.querySelector('nav[data-sonar-nav-variant="floating"] a[href="/en#${sectionId}"]').getAttribute('aria-current')`,
      )) === 'location',
      `desktop ${sectionId} waypoint did not become active`,
    );
    assert(
      await value(
        client,
        `(() => {
          const beamAnimation = document.querySelector('.lighthouse-beam').getAnimations()[0];
          return document.querySelector('[data-lighthouse-lantern="floating"]') === window.__portfolioPersistentLighthouse &&
            beamAnimation === window.__portfolioPersistentBeamAnimation &&
            beamAnimation.startTime === window.__portfolioPersistentBeamStartTime;
        })()`,
      ),
      `desktop ${sectionId} navigation replaced the lighthouse or restarted its beam`,
    );
  }

  assert(
    (await value(client, 'history.length')) === startingHistoryLength + 5,
    'explicit waypoint navigation did not create exactly one history entry per click',
  );
  await captureBeamAcrossSections(client);

  await evaluate(client, 'history.back()');
  await waitFor(
    client,
    `location.hash === '#projects' && document.querySelector('a[href="/en#projects"][aria-current="location"]') && document.querySelector('#projects').getBoundingClientRect().top < innerHeight / 2`,
  );
  await evaluate(client, 'history.forward()');
  await waitFor(
    client,
    `location.hash === '#contact' && document.querySelector('a[href="/en#contact"][aria-current="location"]') && document.querySelector('#contact').getBoundingClientRect().top < innerHeight / 2`,
  );

  const passiveHistoryLength = await value(client, 'history.length');
  const passiveFragment = await value(client, 'location.hash');

  await evaluate(
    client,
    `document.querySelector('#education').scrollIntoView({ behavior: 'instant', block: 'start' })`,
  );
  await waitFor(
    client,
    `document.querySelector('nav[data-sonar-nav-variant="floating"] a[href="/en#education"]').getAttribute('aria-current') === 'location'`,
  );
  assert(
    (await value(client, 'history.length')) === passiveHistoryLength &&
      (await value(client, 'location.hash')) === passiveFragment,
    'passive scroll-spy changes polluted browser history or rewrote the fragment',
  );

  await evaluate(
    client,
    `document.querySelector('#projects').scrollIntoView({ behavior: 'instant', block: 'start' })`,
  );
  await waitFor(
    client,
    `document.querySelector('#projects .project-card__action--detail') !== null`,
  );
  await clickAnchor(client, '#projects .project-card__action--detail');
  await waitFor(client, `location.pathname.includes('/projects/')`);
  assert(
    (await value(
      client,
      `document.querySelector('.project-detail__back-link').getAttribute('href')`,
    )) === '/en#projects',
    'project detail did not expose a direct return to #projects',
  );
  await clickAnchor(client, '.project-detail__back-link');
  await waitFor(
    client,
    `location.pathname === '/en' && location.hash === '#projects' && document.querySelector('#projects')`,
  );

  await goto(client, '/fr#experience');
  await waitFor(
    client,
    `document.querySelector('#experience').getBoundingClientRect().top < 80 &&
      document.querySelector('.public-shell').dataset.navigationHandoffState === 'sonar'`,
  );
  await clickAnchor(client, 'app-locale-switcher a[lang="en"]');
  await waitFor(
    client,
    `location.pathname === '/en' && location.hash === '#experience' &&
      document.querySelector('.public-shell').dataset.navigationHandoffState === 'sonar'`,
  );

  await goto(client, '/en#contact');
  await waitFor(
    client,
    `(() => {
      const bounds = document.querySelector('#contact').getBoundingClientRect();
      return bounds.top < innerHeight && bounds.bottom > 0 && document.querySelector('a[href="/en#contact"][aria-current="location"]');
    })()`,
  );

  await setReducedMotion(client, true);
  await goto(client, '/en');
  await setNavigationHandoffState(client, 'sonar');
  const reducedHandoffDurations = await value(
    client,
    `[
      getComputedStyle(document.querySelector('.maritime-floating-controls__sonar')).transitionDuration,
      getComputedStyle(document.querySelector('.site-header__nav')).transitionDuration,
    ]`,
  );
  assert(
    reducedHandoffDurations
      .flatMap((duration) => duration.split(','))
      .every((duration) => parseFloat(duration) <= 0.001),
    `reduced motion did not make the header-to-sonar handoff immediate: ${JSON.stringify(reducedHandoffDurations)}`,
  );
  await evaluate(
    client,
    `(() => {
      const original = Element.prototype.scrollIntoView;
      window.__portfolioLastScrollBehavior = null;
      Element.prototype.scrollIntoView = function(options) {
        window.__portfolioLastScrollBehavior = options?.behavior ?? null;
        return original.call(this, options);
      };
    })()`,
  );
  await clickElement(client, '.maritime-floating-controls .sonar-nav__compact-button');
  await waitFor(
    client,
    `document.querySelector('.maritime-floating-controls .sonar-nav__compact-button').getAttribute('aria-expanded') === 'true'`,
  );
  const reducedBeamTransform = await value(
    client,
    `getComputedStyle(document.querySelector('.lighthouse-beam')).transform`,
  );
  await delay(160);
  assert(
    (await value(
      client,
      `getComputedStyle(document.querySelector('.lighthouse-beam')).transform`,
    )) === reducedBeamTransform &&
      (await value(client, `document.querySelector('.lighthouse-beam').getAnimations().length`)) ===
        0,
    'reduced motion did not keep the lighthouse beam static',
  );
  await clickElement(client, 'nav[data-sonar-nav-variant="floating"] a[href="/en#experience"]');
  await waitFor(client, `window.__portfolioLastScrollBehavior !== null`);
  assert(
    (await value(client, 'window.__portfolioLastScrollBehavior')) === 'instant',
    'reduced motion did not disable smooth section scrolling',
  );

  await setReducedMotion(client, false);
  await goto(client, '/en#projects');
  await waitFor(
    client,
    `document.querySelector('.public-shell').dataset.navigationHandoffState === 'sonar'`,
  );
  await captureScreenshot(client, 'desktop-1440x900-projects.png');
  assert(
    !(await value(client, 'document.documentElement.scrollWidth > innerWidth')),
    'desktop overflow',
  );
  console.log('OK desktop 1440x900 navigation, history, deep links, locale switch, and details');
}

async function verifyMobile(client, width, height, navigateAllSections) {
  await setViewport(client, width, height);
  await setReducedMotion(client, false);
  await goto(client, '/en');
  assert(
    await value(
      client,
      `(() => {
        const lighthouse = document.querySelector('.maritime-floating-controls__lighthouse');
        const sonar = document.querySelector('.maritime-floating-controls__sonar');
        const sonarButton = document.querySelector('.sonar-nav__compact-button');
        const bounds = lighthouse?.getBoundingClientRect();
        const sonarBounds = sonarButton?.getBoundingClientRect();
        return document.querySelectorAll('app-lighthouse-theme-toggle').length === 1 &&
          !document.querySelector('.site-header app-lighthouse-theme-toggle') &&
          document.querySelector('.public-shell').dataset.navigationHandoffState === 'sonar' &&
          sonar && !sonar.hasAttribute('inert') && sonar.getAttribute('aria-hidden') === null &&
          sonarBounds && sonarBounds.width > 56 && sonarBounds.width < 70 &&
          Math.abs(sonarBounds.width - sonarBounds.height) < 1 &&
          bounds && bounds.left >= 0 && bounds.top >= 0 && bounds.right <= innerWidth && bounds.bottom <= innerHeight;
      })()`,
    ),
    `persistent lighthouse was not safely visible at the top at ${width}x${height}`,
  );
  await captureScreenshot(client, `mobile-${width}x${height}-home-persistent-controls.png`);
  await goto(client, '/en#education');
  await waitFor(client, `document.querySelector('.maritime-floating-controls') !== null`);

  const buttonSelector = '.maritime-floating-controls .sonar-nav__compact-button';
  const initialButton = await rect(client, buttonSelector);

  await drag(client, center(initialButton), [width - 34, Math.round(height * 0.5)]);
  await waitFor(
    client,
    `document.querySelector('.maritime-floating-controls .sonar-nav').dataset.sonarMobileDock === 'right'`,
  );
  await delay(420);
  await clickElement(client, buttonSelector);
  await waitFor(
    client,
    `document.querySelector('${buttonSelector}').getAttribute('aria-expanded') === 'true'`,
  );
  await assertExpandedSonarSafe(client, width, height);
  await captureScreenshot(client, `mobile-${width}x${height}-expanded.png`);

  if (navigateAllSections) {
    for (const sectionId of ['education', 'experience', 'projects', 'contact', 'home']) {
      if (
        (await value(
          client,
          `document.querySelector('${buttonSelector}').getAttribute('aria-expanded')`,
        )) !== 'true'
      ) {
        await clickElement(client, buttonSelector);
        await waitFor(
          client,
          `document.querySelector('${buttonSelector}').getAttribute('aria-expanded') === 'true'`,
        );
      }

      await clickElement(client, `.maritime-floating-controls a[href="/en#${sectionId}"]`);
      await waitFor(
        client,
        `location.hash === '#${sectionId}' && document.querySelector('a[href="/en#${sectionId}"][aria-current="location"]')`,
      );
    }
  } else {
    await clickElement(client, buttonSelector);
    await waitFor(
      client,
      `document.querySelector('${buttonSelector}').getAttribute('aria-expanded') === 'false'`,
    );
    await delay(420);
    const rightButton = await rect(client, buttonSelector);

    await drag(client, center(rightButton), [34, Math.round(height * 0.42)]);
    await waitFor(
      client,
      `document.querySelector('.maritime-floating-controls .sonar-nav').dataset.sonarMobileDock === 'left'`,
    );
  }

  assert(
    !(await value(
      client,
      'document.documentElement.scrollWidth > document.documentElement.clientWidth',
    )),
    `horizontal overflow at ${width}x${height}`,
  );
  console.log(`OK mobile ${width}x${height} drag, viewport safety, navigation, and overflow`);
}

async function assertExpandedSonarSafe(client, width, height) {
  const frame = await rect(client, '.maritime-floating-controls .sonar-nav__frame');
  const lighthouse = await rect(client, '.maritime-floating-controls__lighthouse');

  assert(
    frame.left >= 0 && frame.top >= 0 && frame.right <= width && frame.bottom <= height,
    'expanded sonar left the mobile viewport',
  );
  assert(
    !rectanglesOverlap(frame, lighthouse),
    'expanded sonar overlapped the lighthouse safe zone',
  );
}

async function goto(client, path) {
  await client.send('Page.navigate', { url: 'about:blank' });
  await waitFor(client, `document.readyState === 'complete'`);
  await client.send('Page.navigate', { url: `${origin}${path}` });
  await waitFor(
    client,
    `document.readyState === 'complete' && document.querySelector('app-root') !== null`,
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

async function ensureFloatingSonarActive(client) {
  if (
    (await value(
      client,
      `document.querySelector('.public-shell').dataset.navigationHandoffState`,
    )) === 'header'
  ) {
    await setNavigationHandoffState(client, 'sonar');
  }
}

async function setNavigationHandoffState(client, targetState, slow = false) {
  const currentState = await value(
    client,
    `document.querySelector('.public-shell').dataset.navigationHandoffState`,
  );

  if (currentState === targetState) {
    return;
  }

  const destination =
    targetState === 'header'
      ? 0
      : await value(
          client,
          `Math.ceil(document.querySelector('app-site-header').getBoundingClientRect().height * 0.5)`,
        );
  const start = await value(client, 'scrollY');
  const steps = slow ? 8 : 1;

  for (let step = 1; step <= steps; step += 1) {
    const next = Math.round(start + ((destination - start) * step) / steps);
    await evaluate(client, `window.scrollTo({ top: ${next}, behavior: 'instant' })`);
    await delay(slow ? 55 : 30);
  }

  await waitFor(
    client,
    `document.querySelector('.public-shell').dataset.navigationHandoffState === '${targetState}'`,
  );
}

async function clickAnchor(client, selector) {
  await evaluate(
    client,
    `(() => {
      const anchor = document.querySelector(${JSON.stringify(selector)});
      if (!anchor) throw new Error('Missing anchor: ${selector}');
      anchor.click();
    })()`,
  );
}

async function clickElement(client, selector) {
  const elementRect = await rect(client, selector);
  const [x, y] = center(elementRect);

  await client.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x,
    y,
    button: 'left',
    clickCount: 1,
  });
  await client.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x,
    y,
    button: 'left',
    clickCount: 1,
  });
  await delay(80);
}

async function moveMouse(client, x, y) {
  await client.send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x,
    y,
  });
}

async function drag(client, [startX, startY], [endX, endY]) {
  await client.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: startX,
    y: startY,
    button: 'left',
    clickCount: 1,
  });
  await client.send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: endX,
    y: endY,
    button: 'left',
    buttons: 1,
  });
  await client.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: endX,
    y: endY,
    button: 'left',
    clickCount: 1,
  });
}

async function rect(client, selector) {
  return value(
    client,
    `(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) throw new Error('Missing element: ${selector}');
      const { left, top, right, bottom, width, height } = element.getBoundingClientRect();
      return { left, top, right, bottom, width, height };
    })()`,
  );
}

async function waitFor(client, expression, timeoutMs = 3500) {
  const deadline = Date.now() + timeoutMs;

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
  const response = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });

  if (response.exceptionDetails) {
    throw new Error(
      response.exceptionDetails.exception?.description ?? 'Browser evaluation failed',
    );
  }

  return response;
}

async function captureScreenshot(client, filename) {
  if (!screenshotDirectory) {
    return;
  }

  const outputDirectory = resolve(screenshotDirectory);
  const { data } = await client.send('Page.captureScreenshot', { format: 'png' });

  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(join(outputDirectory, filename), Buffer.from(data, 'base64'));
}

async function captureBeamAcrossSections(client) {
  if (!screenshotDirectory) {
    return;
  }

  await evaluate(
    client,
    `(() => {
      const animation = document.querySelector('.lighthouse-beam').getAnimations()[0];
      animation.pause();
      animation.currentTime = Number(animation.effect.getTiming().duration) * 0.55;
    })()`,
  );

  for (const sectionId of ['home', 'education', 'experience', 'projects', 'contact']) {
    await evaluate(
      client,
      `document.querySelector('#${sectionId}').scrollIntoView({ behavior: 'instant', block: 'start' })`,
    );
    await delay(100);
    await captureScreenshot(client, `desktop-1440x900-${sectionId}-beam-across-content.png`);
  }

  await evaluate(client, `document.querySelector('.lighthouse-beam').getAnimations()[0].play()`);
}

function center(elementRect) {
  return [
    Math.round(elementRect.left + elementRect.width / 2),
    Math.round(elementRect.top + elementRect.height / 2),
  ];
}

function rectanglesOverlap(first, second) {
  return !(
    first.right <= second.left ||
    first.left >= second.right ||
    first.bottom <= second.top ||
    first.top >= second.bottom
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
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
    throw new Error('Chrome was not found. Set CHROME_PATH to run the browser smoke test.');
  }

  return path;
}

async function availablePort() {
  return new Promise((resolvePort, reject) => {
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

        resolvePort(port);
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

        if (payload.error) {
          handler.reject(new Error(payload.error.message));
        } else {
          handler.resolve(payload.result);
        }

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
      this.#handlers.set(id, { reject: reject, resolve: resolveSend });
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

await runBrowserSmoke();
