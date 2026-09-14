import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const origin = process.env['BROWSER_SMOKE_ORIGIN'] ?? 'http://127.0.0.1:4000';
const screenshotDirectory = process.env['BROWSER_SMOKE_SCREENSHOT_DIR'];
const smokeScope = process.env['BROWSER_SMOKE_SCOPE'] ?? 'full';
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

    if (smokeScope === 'github-calendar') {
      await verifyGitHubCalendarOnly(cdp);
    } else {
      await verifyDesktop(cdp);
      await verifyMobile(cdp, 390, 844, true);
      await verifyMobile(cdp, 360, 800, false);
      await verifyRecruitment(cdp);
    }

    const relevantErrors = browserErrors.filter(
      (message) => !message.includes('favicon.ico') && !message.includes('net::ERR_ABORTED'),
    );

    assert(relevantErrors.length === 0, `browser console errors: ${relevantErrors.join(' | ')}`);
    console.log(
      smokeScope === 'github-calendar'
        ? 'Headless Chrome GitHub calendar checks passed'
        : 'Headless Chrome single-page browser checks passed',
    );
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

async function verifyGitHubCalendarOnly(client) {
  const reviews = [
    { width: 1440, height: 900, locale: 'en', theme: 'light' },
    { width: 1440, height: 900, locale: 'en', theme: 'dark' },
    { width: 390, height: 844, locale: 'en', theme: 'dark' },
    { width: 360, height: 800, locale: 'fr', theme: 'dark' },
  ];

  await setReducedMotion(client, false);

  for (const review of reviews) {
    await setViewport(client, review.width, review.height);
    await goto(client, `/${review.locale}`);
    await waitFor(client, `document.querySelector('[data-github-contribution-calendar]') !== null`);
    await evaluate(client, `document.documentElement.dataset.theme = '${review.theme}'`);
    await assertGitHubCalendarPresentation(
      client,
      review.width,
      review.height,
      review.locale,
      review.theme,
    );
  }

  await setReducedMotion(client, true);
  await setViewport(client, 390, 844);
  await goto(client, '/en');
  await waitFor(client, `document.querySelector('[data-github-contribution-calendar]') !== null`);
  await evaluate(client, `document.documentElement.dataset.theme = 'dark'`);
  await assertGitHubCalendarPresentation(client, 390, 844, 'en', 'dark');
  const reducedMotionTooltip = await value(
    client,
    `(() => {
      const style = getComputedStyle(document.querySelector('[data-browser-smoke-tooltip-target]'), '::before');
      return {
        matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
        duration: style.transitionDuration,
        property: style.transitionProperty,
      };
    })()`,
  );
  assert(
    reducedMotionTooltip.matches &&
      (reducedMotionTooltip.property === 'none' || reducedMotionTooltip.duration === '0s'),
    `GitHub calendar tooltip transition ignored reduced-motion preference: ${JSON.stringify(reducedMotionTooltip)}`,
  );
}

async function verifyRecruitment(client) {
  for (const locale of ['fr', 'en', 'hu']) {
    for (const width of [320, 390, 1024, 1440]) {
      await setViewport(client, width, 900);
      await goto(client, '/' + locale);
      await waitFor(client, `document.querySelector('a[download]') !== null`);
      const layout = await value(
        client,
        `(() => {
        const button = document.querySelector('a[download]').getBoundingClientRect();
        const intro = document.querySelector('.home-page__intro').getBoundingClientRect();
        return {width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, bottom: button.bottom, intro: intro.bottom};
      })()`,
      );
      assert(
        layout.scroll <= layout.width,
        'Recruitment page overflows at ' + locale + ' ' + width,
      );
      assert(
        layout.bottom > layout.intro,
        'CV action must follow the introduction: ' + JSON.stringify(layout),
      );
      for (const theme of ['light', 'dark']) {
        await evaluate(client, `document.documentElement.dataset.theme = '${theme}'`);
        await new Promise((resolve) => setTimeout(resolve, 300));
        const ratio = await value(
          client,
          `(() => {
          const style = getComputedStyle(document.querySelector('.contact-page__submit'));
          const luminance = (color) => {
            const channels = color.match(/[\\d.]+/g).slice(0, 3).map((channel) => {
              const value = Number(channel) / 255;
              return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
            });
            return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
          };
          const foreground = luminance(style.color), background = luminance(style.backgroundColor);
          return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
        })()`,
        );
        assert(ratio >= 4.5, 'Submit text contrast below 4.5:1 for ' + theme + ': ' + ratio);
      }
    }
  }
  console.log('OK recruitment links, Hungarian reflow and submit contrast');
}

async function verifyDesktop(client) {
  await setViewport(client, 1440, 900);
  await setReducedMotion(client, false);
  await goto(client, '/en');
  await waitFor(
    client,
    `document.querySelector('.public-shell')?.dataset.navigationHandoffState === 'header'`,
  );
  await assertMajorSectionPresentation(client, 'en');

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
  await assertGitHubCalendarPresentation(client, 1440, 900, 'en', 'light');

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
          duration === 48 && width >= 400 && width <= 430;
      })()`,
    ),
    'beam did not use the single floating lantern with the tuned duration and width',
  );
  await captureScreenshot(client, 'desktop-1440x900-header-navigation-state.png');
  await assertGitHubCalendarPresentation(client, 1440, 900, 'en', 'dark');

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

  for (const sectionId of ['home', 'experience', 'education', 'projects', 'contact']) {
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

  const educationPermalink = '#education [data-section-permalink]';
  const permalinkColor = await value(
    client,
    `getComputedStyle(document.querySelector('${educationPermalink}')).color`,
  );
  await moveMouse(client, ...center(await rect(client, educationPermalink)));
  await delay(180);
  assert(
    await value(
      client,
      `(() => {
        const link = document.querySelector('${educationPermalink}');
        return link.matches(':hover') && getComputedStyle(link).color !== ${JSON.stringify(permalinkColor)};
      })()`,
    ),
    'section permalink did not expose its restrained hover accent',
  );
  await moveMouse(client, 720, 100);

  await evaluate(
    client,
    `(() => {
      const target = document.querySelector('${educationPermalink}');
      const focusable = [...document.querySelectorAll('a[href], button:not([disabled])')];
      const previous = focusable[focusable.indexOf(target) - 1];
      if (!previous) throw new Error('Missing focusable element before Education permalink');
      previous.focus();
    })()`,
  );
  await pressTab(client);
  assert(
    await value(
      client,
      `(() => {
        const link = document.querySelector('${educationPermalink}');
        return document.activeElement === link && link.matches(':focus-visible') &&
          parseFloat(getComputedStyle(link).outlineWidth) >= 2;
      })()`,
    ),
    'section permalink did not expose a visible keyboard focus state',
  );

  const permalinkHistoryLength = await value(client, 'history.length');
  await clickAnchor(client, educationPermalink);
  await waitFor(
    client,
    `location.pathname === '/en' && location.hash === '#education' &&
      document.querySelector('nav[data-sonar-nav-variant="floating"] a[href="/en#education"]').getAttribute('aria-current') === 'location'`,
  );
  await waitFor(
    client,
    `(() => {
      const top = document.querySelector('#education').getBoundingClientRect().top;
      return top >= 0 && top < 60;
    })()`,
  );
  assert(
    await value(
      client,
      `(() => {
        const sectionBounds = document.querySelector('#education').getBoundingClientRect();
        const headingBounds = document.querySelector('#education-title').getBoundingClientRect();
        return sectionBounds.top >= 0 && sectionBounds.top < 60 &&
          headingBounds.top >= 40 && headingBounds.top < 180;
      })()`,
    ),
    'Education permalink did not land with clear heading breathing room',
  );
  assert(
    (await value(client, 'history.length')) === permalinkHistoryLength + 1,
    'section permalink did not create exactly one explicit history entry',
  );
  await evaluate(client, 'history.back()');
  await waitFor(client, `location.hash === '#contact'`);
  await evaluate(client, 'history.forward()');
  await waitFor(
    client,
    `location.hash === '#education' && document.querySelector('#education').getBoundingClientRect().top < 60`,
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
  await assertMajorSectionPresentation(client, 'fr');
  await captureScreenshot(client, 'desktop-1440x900-fr-experience-permalink.png');
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
  await assertContactPresentation(client, 1440, 900, 'en');

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
  await assertMajorSectionPresentation(client, 'en');
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
  await assertGitHubCalendarPresentation(client, width, height, 'en', 'dark');
  if (width === 360) {
    await goto(client, '/fr');
    await assertGitHubCalendarPresentation(client, width, height, 'fr', 'dark');
  }
  await goto(client, '/fr#experience');
  await waitFor(client, `document.querySelector('#experience').getBoundingClientRect().top < 80`);
  await assertMajorSectionPresentation(client, 'fr');
  await captureScreenshot(client, `mobile-${width}x${height}-fr-experience-permalink.png`);
  await goto(client, '/en#education');
  await waitFor(client, `document.querySelector('.maritime-floating-controls') !== null`);

  const buttonSelector = '.maritime-floating-controls .sonar-nav__compact-button';
  const initialButton = await rect(client, buttonSelector);

  await drag(client, center(initialButton), [34, height - 45]);
  await delay(450);
  const bottomButton = await rect(client, buttonSelector);
  assert(center(bottomButton)[1] > height - 100, 'mobile sonar could not reach the bottom');
  await clickElement(client, buttonSelector);
  await waitFor(
    client,
    `document.querySelector('${buttonSelector}').getAttribute('aria-expanded') === 'true'`,
  );
  await assertExpandedSonarSafe(client, width, height);
  const previousHash = await value(client, 'location.hash');
  for (const type of ['mousePressed', 'mouseReleased']) {
    await client.send('Input.dispatchMouseEvent', {
      type,
      x: width / 2,
      y: 10,
      button: 'left',
      clickCount: 1,
    });
  }
  await waitFor(
    client,
    `document.querySelector('${buttonSelector}').getAttribute('aria-expanded') === 'false'`,
  );
  assert(
    (await value(client, 'location.hash')) === previousHash,
    'outside dismissal navigated to a section',
  );
  await delay(450);

  await drag(client, center(await rect(client, buttonSelector)), [
    width - 34,
    Math.round(height * 0.5),
  ]);
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
  const contactLocale = width === 360 ? 'fr' : 'en';
  await goto(client, `/${contactLocale}#contact`);
  await assertContactPresentation(client, width, height, contactLocale);
  console.log(`OK mobile ${width}x${height} drag, viewport safety, navigation, and overflow`);
}

async function assertContactPresentation(client, width, height, locale) {
  await waitFor(
    client,
    `document.querySelector('#contact form') && document.querySelector('#contact button[type="submit"]')`,
  );
  await evaluate(
    client,
    `(() => {
      const button = document.querySelector('#contact button[type="submit"]');
      button.scrollIntoView({ behavior: 'instant', block: 'end' });
      // Both floating controls are intentionally centered; keep the submit action below them.
      window.scrollBy({ top: button.getBoundingClientRect().top - innerHeight * 0.72, behavior: 'instant' });
    })()`,
  );
  await delay(80);

  const expectedLabels =
    locale === 'fr'
      ? ['Nom', 'E-mail', 'Sujet', 'Message']
      : ['Name', 'Email', 'Subject', 'Message'];
  const presentation = await value(
    client,
    `(() => {
      const form = document.querySelector('#contact form');
      const visibleControls = [...form.querySelectorAll('#contact-name, #contact-email, #contact-subject, #contact-message')];
      const labels = visibleControls.map((control) =>
        form.querySelector('label[for="' + control.id + '"]')?.textContent.trim(),
      );
      const button = form.querySelector('button[type="submit"]');
      const decoy = form.querySelector('#contact-organization-website');
      const decoyContainer = decoy.closest('[aria-hidden="true"]');
      const sonar = document.querySelector('.sonar-nav__compact-button');
      const lighthouse = document.querySelector('.maritime-floating-controls__lighthouse');
      const overlaps = (first, second) => first && second &&
        first.left < second.right && first.right > second.left &&
        first.top < second.bottom && first.bottom > second.top;
      const buttonBounds = button.getBoundingClientRect();
      return {
        labels,
        fieldsetCount: form.querySelectorAll('.fieldset').length,
        daisyInputs: form.querySelectorAll('.input.validator').length,
        daisyTextareas: form.querySelectorAll('.textarea.validator').length,
        buttonText: button.textContent.trim(),
        buttonVisible: buttonBounds.top >= 0 && buttonBounds.bottom <= innerHeight,
        controlsWithinViewport: visibleControls.every((control) => {
          const bounds = control.getBoundingClientRect();
          return bounds.left >= 0 && bounds.right <= innerWidth && bounds.width >= 220;
        }),
        decoySafe: decoy.tabIndex === -1 && decoy.autocomplete === 'off' && decoyContainer !== null,
        overlapsSonar: overlaps(buttonBounds, sonar?.getBoundingClientRect()),
        overlapsLighthouse: overlaps(buttonBounds, lighthouse?.getBoundingClientRect()),
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    })()`,
  );

  assert(
    JSON.stringify(presentation.labels) === JSON.stringify(expectedLabels),
    `${locale} Contact labels were missing or reordered: ${JSON.stringify(presentation)}`,
  );
  assert(
    presentation.fieldsetCount === 4 &&
      presentation.daisyInputs === 3 &&
      presentation.daisyTextareas === 1,
    `Contact did not retain its daisyUI field structure at ${width}x${height}`,
  );
  assert(
    presentation.buttonText === (locale === 'fr' ? 'Envoyer le message' : 'Send message') &&
      presentation.buttonVisible &&
      presentation.controlsWithinViewport &&
      presentation.decoySafe &&
      !presentation.overlapsSonar &&
      !presentation.overlapsLighthouse &&
      !presentation.horizontalOverflow,
    `Contact layout or floating-control safety failed at ${width}x${height}: ${JSON.stringify(presentation)}`,
  );

  await clickElement(client, '#contact button[type="submit"]');
  await waitFor(client, `document.querySelector('#contact [role="alert"]') !== null`);
  const validation = await value(
    client,
    `(() => ({
      alertText: document.querySelector('#contact [role="alert"]')?.textContent.trim(),
      invalidCount: document.querySelectorAll('#contact [aria-invalid="true"]').length,
      describedCount: document.querySelectorAll('#contact [aria-describedby]').length,
      visibleErrors: document.querySelectorAll('#contact .validator-hint').length,
    }))()`,
  );

  assert(
    validation.invalidCount === 4 &&
      validation.describedCount === 4 &&
      validation.visibleErrors === 4 &&
      validation.alertText,
    `Contact validation semantics failed at ${width}x${height}: ${JSON.stringify(validation)}`,
  );
  await captureScreenshot(client, `contact-${width}x${height}-${locale}-validation.png`);
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
  // Hover can expand the sonar or move a link while the header hands off navigation.
  // Resolve the click point after those transitions, as a user would see it.
  const initialRect = await rect(client, selector);
  await moveMouse(client, ...center(initialRect));
  await delay(450);
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
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      document.activeElement?.blur();
    })()`,
  );
  await moveMouse(client, 720, 100);
  await waitFor(
    client,
    `document.querySelector('.sonar-nav__frame').getBoundingClientRect().width < 80`,
  );

  await evaluate(
    client,
    `(() => {
      const animation = document.querySelector('.lighthouse-beam').getAnimations()[0];
      animation.pause();
      animation.currentTime = Number(animation.effect.getTiming().duration) * 0.55;
    })()`,
  );

  for (const sectionId of ['home', 'experience', 'education', 'projects', 'contact']) {
    await evaluate(
      client,
      `document.querySelector('#${sectionId}').scrollIntoView({ behavior: 'instant', block: 'start' })`,
    );
    await delay(100);
    await captureScreenshot(client, `desktop-1440x900-${sectionId}-beam-across-content.png`);
  }

  await evaluate(client, `document.querySelector('.lighthouse-beam').getAnimations()[0].play()`);
}

async function assertGitHubCalendarPresentation(client, width, height, locale, theme) {
  const calendarExists = await value(
    client,
    `document.querySelector('[data-github-contribution-calendar]') !== null`,
  );

  if (!calendarExists) {
    console.log(
      `SKIP ${locale} ${theme} GitHub calendar at ${width}x${height}: no contribution data`,
    );
    return;
  }

  await evaluate(
    client,
    `document.querySelector('[data-github-contribution-calendar]').scrollIntoView({ behavior: 'instant', block: 'start' })`,
  );
  await delay(100);

  await evaluate(
    client,
    `(() => {
      const calendar = document.querySelector('[data-github-contribution-calendar]');
      const region = calendar.querySelector('[role="region"]');
      calendar.querySelectorAll('[data-browser-smoke-tooltip-target]').forEach((day) => day.removeAttribute('data-browser-smoke-tooltip-target'));
      const visibleDays = [...calendar.querySelectorAll('[data-contribution-count]')]
        .filter((day) => {
          const bounds = day.getBoundingClientRect();
          const regionBounds = region.getBoundingClientRect();
          return bounds.left >= regionBounds.left && bounds.right <= regionBounds.right;
        })
        .sort((first, second) => second.getBoundingClientRect().right - first.getBoundingClientRect().right);
      visibleDays[0]?.setAttribute('data-browser-smoke-tooltip-target', 'true');
    })()`,
  );
  const tooltipTargetBounds = await rect(client, '[data-browser-smoke-tooltip-target]');
  await moveMouse(client, ...center(tooltipTargetBounds));
  await delay(240);
  const settledTooltipBounds = await rect(client, '[data-browser-smoke-tooltip-target]');
  await moveMouse(client, 0, 0);
  await moveMouse(client, ...center(settledTooltipBounds));
  await delay(240);

  const presentation = await value(
    client,
    `(() => {
      const calendar = document.querySelector('[data-github-contribution-calendar]');
      const region = calendar.querySelector('[role="region"]');
      const days = [...calendar.querySelectorAll('[data-contribution-count]')];
      const tooltipTarget = calendar.querySelector('[data-browser-smoke-tooltip-target]');
      const levels = [...new Set(days.map((day) => day.dataset.contributionLevel))].sort();
      const levelColors = [0, 1, 2, 3, 4].map((level) =>
        getComputedStyle(calendar.querySelector('.github-contribution-calendar__day--level-' + level)).backgroundColor,
      );
      const cells = days.map((day) => day.getBoundingClientRect());
      const github = document.querySelector('[data-github-activity]');
      const projects = document.querySelector('#projects');
      const contact = document.querySelector('#contact');
      const repositories = github?.querySelector('.home-page__github-grid');
      const calendarBounds = calendar.getBoundingClientRect();
      const calendarDataBounds = calendar.querySelector('.github-contribution-calendar__weeks').getBoundingClientRect();
      const regionBounds = region.getBoundingClientRect();
      const tooltipTargetBounds = tooltipTarget.getBoundingClientRect();
      const tooltipEdgeRange = Math.min(120, regionBounds.width / 3);
      const visibleDays = days.filter((day) => {
        const bounds = day.getBoundingClientRect();
        return bounds.left >= regionBounds.left && bounds.right <= regionBounds.right;
      });
      const leftEdgeDay = visibleDays.reduce((leftmost, day) =>
        day.getBoundingClientRect().left < leftmost.getBoundingClientRect().left ? day : leftmost
      );
      const rightEdgeDay = visibleDays.reduce((rightmost, day) =>
        day.getBoundingClientRect().right > rightmost.getBoundingClientRect().right ? day : rightmost
      );
      const expectedAlignment = (day) => {
        const bounds = day.getBoundingClientRect();
        return bounds.left - regionBounds.left < tooltipEdgeRange
          ? 'tooltip-start'
          : regionBounds.right - bounds.right < tooltipEdgeRange
            ? 'tooltip-end'
            : 'tooltip-center';
      };
      leftEdgeDay.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
      rightEdgeDay.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
      const expectedTooltipAlignment = tooltipTargetBounds.left - regionBounds.left < tooltipEdgeRange
        ? 'tooltip-start'
        : regionBounds.right - tooltipTargetBounds.right < tooltipEdgeRange
          ? 'tooltip-end'
          : 'tooltip-center';
      const sonarBounds = document.querySelector('.sonar-nav__compact-button')?.getBoundingClientRect();
      const lighthouseBounds = document.querySelector('.maritime-floating-controls__lighthouse')?.getBoundingClientRect();
      const overlaps = (first, second) => first && second &&
        first.left < second.right && first.right > second.left &&
        first.top < second.bottom && first.bottom > second.top;

      region.focus({ preventScroll: true });

      return {
        theme: document.documentElement.dataset.theme,
        cellCount: days.length,
        levels,
        distinctLevelColors: new Set(levelColors).size,
        cellSizesReadable: cells.every((cell) => cell.width >= 10 && cell.height >= 10),
        monthCount: calendar.querySelectorAll('.github-contribution-calendar__months span').length,
        regionFocused: document.activeElement === region,
        regionTabIndex: region.getAttribute('tabindex'),
        focusableCells: days.filter((day) => day.hasAttribute('tabindex')).length,
        labelledCells: days.every((day) => day.getAttribute('aria-label')),
        daisyTooltips: days.every((day) => day.classList.contains('tooltip')),
        nativeTitles: days.filter((day) => day.hasAttribute('title')).length,
        multilineTooltips: days.every((day) => day.dataset.tip?.includes('\\n')),
        zeroContributionTooltip: days.find((day) => day.dataset.contributionCount === '0')?.dataset.tip,
        edgePlacements: days.every((day) => day.classList.contains('tooltip-top') || day.classList.contains('tooltip-bottom')),
        verticalEdgePlacements: days.every((day) => {
          const weekday = [...day.parentElement.children].indexOf(day);
          return weekday < 3 ? day.classList.contains('tooltip-bottom') : day.classList.contains('tooltip-top');
        }),
        horizontalEdgeAlignments:
          leftEdgeDay.classList.contains(expectedAlignment(leftEdgeDay)) &&
          rightEdgeDay.classList.contains(expectedAlignment(rightEdgeDay)),
        hoveredTooltipVisible: Number(getComputedStyle(tooltipTarget, '::before').opacity) > .9,
        hoverSupported: matchMedia('(hover: hover)').matches,
        hoveredTooltipAlignedForViewport: tooltipTarget?.classList.contains(expectedTooltipAlignment),
        calendarScrolls: region.scrollWidth > region.clientWidth,
        recentWeeksInitiallyVisible: region.scrollWidth <= region.clientWidth ||
          Math.abs(region.scrollWidth - region.clientWidth - region.scrollLeft) < 2,
        documentOverflows: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        followsProjects: projects?.compareDocumentPosition(github) === Node.DOCUMENT_POSITION_FOLLOWING,
        precedesContact: github?.compareDocumentPosition(contact) === Node.DOCUMENT_POSITION_FOLLOWING,
        followsRepositories: Boolean(repositories?.compareDocumentPosition(document.querySelector('app-github-contribution-calendar')) & Node.DOCUMENT_POSITION_FOLLOWING),
        githubNavigationLinks: document.querySelectorAll('nav a[href*="#github"], footer a[href*="#github"]').length,
        calendarBounds: calendarBounds.toJSON(),
        calendarDataBounds: calendarDataBounds.toJSON(),
        sonarBounds: sonarBounds?.toJSON(),
        lighthouseBounds: lighthouseBounds?.toJSON(),
        overlapsSonar: overlaps(calendarDataBounds, sonarBounds),
        overlapsLighthouse: overlaps(calendarDataBounds, lighthouseBounds),
      };
    })()`,
  );

  assert(
    presentation.theme === theme &&
      presentation.cellCount >= 350 &&
      JSON.stringify(presentation.levels) === JSON.stringify(['0', '1', '2', '3', '4']) &&
      presentation.distinctLevelColors === 5 &&
      presentation.cellSizesReadable &&
      presentation.monthCount >= 12,
    `${locale} ${theme} GitHub calendar cells or theme were invalid at ${width}x${height}: ${JSON.stringify(presentation)}`,
  );
  assert(
    presentation.regionFocused &&
      presentation.regionTabIndex === '0' &&
      presentation.focusableCells === 0 &&
      presentation.labelledCells &&
      presentation.daisyTooltips &&
      presentation.nativeTitles === 0 &&
      presentation.multilineTooltips &&
      /\n0 contributions?$/.test(presentation.zeroContributionTooltip) &&
      presentation.edgePlacements &&
      presentation.verticalEdgePlacements &&
      presentation.horizontalEdgeAlignments &&
      (!presentation.hoverSupported || presentation.hoveredTooltipVisible) &&
      presentation.hoveredTooltipAlignedForViewport,
    `${locale} GitHub calendar accessibility was invalid: ${JSON.stringify(presentation)}`,
  );
  assert(
    presentation.followsProjects &&
      presentation.precedesContact &&
      presentation.followsRepositories &&
      presentation.githubNavigationLinks === 0,
    `${locale} GitHub calendar must follow public repositories between Projects and Contact: ${JSON.stringify(presentation)}`,
  );
  assert(
    !presentation.documentOverflows &&
      presentation.calendarScrolls === width <= 640 &&
      presentation.recentWeeksInitiallyVisible &&
      !presentation.overlapsSonar &&
      !presentation.overlapsLighthouse,
    `${locale} GitHub calendar containment or floating-control safety failed at ${width}x${height}: ${JSON.stringify(presentation)}`,
  );

  await captureScreenshot(client, `github-calendar-${locale}-${theme}-${width}x${height}.png`);
  await evaluate(client, `window.scrollTo({ top: 0, behavior: 'instant' })`);
  await delay(100);
  if (width > 640) {
    await waitFor(
      client,
      `document.querySelector('.public-shell').dataset.navigationHandoffState === 'header'`,
    );
  }
}

async function assertMajorSectionPresentation(client, locale) {
  const labels =
    locale === 'fr'
      ? {
          home: 'Lien vers la section Accueil',
          education: 'Lien vers la section Formation',
          experience: 'Lien vers la section Expérience',
          projects: 'Lien vers la section Projets',
          contact: 'Lien vers la section Contact',
        }
      : {
          home: 'Link to Home section',
          education: 'Link to Education section',
          experience: 'Link to Experience section',
          projects: 'Link to Projects section',
          contact: 'Link to Contact section',
        };
  const presentation = await value(
    client,
    `(() => {
      const ids = ['home', 'experience', 'education', 'projects', 'contact'];
      const labels = ${JSON.stringify(labels)};
      const portfolio = document.querySelector('.portfolio-page');
      const sections = [...document.querySelectorAll('[data-portfolio-section]')];
      const links = [...document.querySelectorAll('[data-section-permalink]')];
      const directDividers = portfolio ? [...portfolio.querySelectorAll(':scope > .divider[data-portfolio-divider]')] : [];
      const expectedSequence = [
        'APP-HOME-PAGE', 'DIV', 'APP-EXPERIENCE-PAGE', 'DIV', 'APP-EDUCATION-PAGE',
        'DIV', 'APP-PROJECTS-PAGE', 'DIV', 'APP-GITHUB-ACTIVITY', 'APP-CONTACT-PAGE',
      ];
      return {
        sectionIds: sections.map((section) => section.id),
        uniqueSectionIds: new Set(sections.map((section) => section.id)).size,
        linkDetails: links.map((link) => {
          const id = link.dataset.sectionId;
          const bounds = link.getBoundingClientRect();
          const host = link.closest('app-section-permalink');
          const wrapper = host?.parentElement;
          const heading = id === 'home'
            ? document.querySelector('#home-title')
            : document.querySelector('#' + id + '-title');
          const headingBounds = heading?.getBoundingClientRect();
          return {
            id,
            href: link.getAttribute('href'),
            label: link.getAttribute('aria-label'),
            title: link.getAttribute('title'),
            svgHidden: link.querySelector('svg')?.getAttribute('aria-hidden'),
            svgFocusable: link.querySelector('svg')?.getAttribute('focusable'),
            width: bounds.width,
            height: bounds.height,
            isInsideHeading: Boolean(link.closest('h1, h2')),
            correctPlacement: id === 'home'
              ? wrapper?.classList.contains('home-page__eyebrow-row') && !link.closest('h1')
              : wrapper?.querySelector('h2') === heading && host === wrapper?.firstElementChild,
            overlapsHeading: headingBounds
              ? !(bounds.right <= headingBounds.left || bounds.left >= headingBounds.right ||
                  bounds.bottom <= headingBounds.top || bounds.top >= headingBounds.bottom)
              : true,
            expectedLabel: labels[id],
          };
        }),
        directDividerCount: directDividers.length,
        nestedDividerCount: sections.reduce(
          (count, section) => count + section.querySelectorAll('[data-portfolio-divider]').length,
          0,
        ),
        dividerHeights: directDividers.map((divider) => divider.getBoundingClientRect().height),
        sequence: portfolio ? [...portfolio.children].map((child) => child.tagName) : [],
        expectedSequence,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    })()`,
  );

  assert(
    JSON.stringify(presentation.sectionIds) ===
      JSON.stringify(['home', 'experience', 'education', 'projects', 'contact']) &&
      presentation.uniqueSectionIds === 5,
    `${locale} major section IDs were missing, duplicated, or reordered: ${JSON.stringify(presentation.sectionIds)}`,
  );
  assert(
    presentation.linkDetails.length === 5 &&
      presentation.linkDetails.every(
        (link) =>
          link.href === `/${locale}#${link.id}` &&
          link.label === link.expectedLabel &&
          link.title === link.expectedLabel &&
          link.svgHidden === 'true' &&
          link.svgFocusable === 'false' &&
          Math.abs(link.width - 40) < 1 &&
          Math.abs(link.height - 40) < 1 &&
          !link.isInsideHeading &&
          link.correctPlacement &&
          !link.overlapsHeading,
      ),
    `${locale} section permalink presentation was invalid: ${JSON.stringify(presentation.linkDetails)}`,
  );
  assert(
    presentation.directDividerCount === 4 &&
      presentation.nestedDividerCount === 0 &&
      presentation.dividerHeights.every((height) => height <= 12) &&
      JSON.stringify(presentation.sequence) === JSON.stringify(presentation.expectedSequence),
    `${locale} major-section dividers were not restrained or correctly placed: ${JSON.stringify(presentation)}`,
  );
  assert(!presentation.horizontalOverflow, `${locale} section headings caused horizontal overflow`);
}

async function pressTab(client) {
  await client.send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown',
    key: 'Tab',
    code: 'Tab',
    windowsVirtualKeyCode: 9,
  });
  await client.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Tab',
    code: 'Tab',
    windowsVirtualKeyCode: 9,
  });
  await delay(80);
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
