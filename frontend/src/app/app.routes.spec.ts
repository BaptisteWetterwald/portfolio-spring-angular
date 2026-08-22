import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { localeCookieName, localeStorageKey } from './core/i18n/locales';
import { routes } from './app.routes';

describe('localized app routes', () => {
  afterEach(() => {
    try {
      globalThis.localStorage?.removeItem(localeStorageKey);
    } catch {
      // Browser storage is optional in tests.
    }

    document.cookie = `${localeCookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
  });

  it('resolves /fr to the French home placeholder', async () => {
    const harness = await createHarness('/fr');

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Accueil');
  });

  it('resolves /en to the English home placeholder', async () => {
    const harness = await createHarness('/en');

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Home');
  });

  it('resolves localized aliases to the shared page component', async () => {
    const harness = await createHarness('/fr/formation');

    expect(
      harness.routeNativeElement?.querySelector('app-localized-page h1')?.textContent,
    ).toContain('Formation');

    await harness.navigateByUrl('/en/education');

    expect(
      harness.routeNativeElement?.querySelector('app-localized-page h1')?.textContent,
    ).toContain('Education');
  });

  it('does not silently render supported content for unsupported locale prefixes', async () => {
    const harness = await createHarness('/de');

    expect(
      harness.routeNativeElement?.querySelector('app-not-found-page h1')?.textContent,
    ).toContain('Page not found');
    expect(TestBed.inject(Router).url).toBe('/de');
  });

  it('redirects / to the stored explicit browser locale preference', async () => {
    globalThis.localStorage?.setItem(localeStorageKey, 'fr');
    const harness = await createHarness('/');

    expect(TestBed.inject(Router).url).toBe('/fr');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Accueil');
  });

  it('renders the public shell landmarks around localized pages', async () => {
    const harness = await createHarness('/en');
    const root = harness.routeNativeElement;

    expect(root?.querySelector('header')).not.toBeNull();
    expect(root?.querySelector('footer')).not.toBeNull();
    expect(root?.querySelector('a[href="#main-content"]')?.textContent).toContain(
      'Skip to content',
    );
    expect(root?.querySelector('main#main-content')).not.toBeNull();
    expect(root?.querySelector('nav[data-primary-nav]')).not.toBeNull();
  });

  it('renders localized primary navigation links from the shared route model', async () => {
    const harness = await createHarness('/fr');
    const links = primaryNavLinks(harness);

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Accueil',
      'Formation',
      'Expérience',
      'Projets',
      'Contact',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/fr',
      '/fr/formation',
      '/fr/experience',
      '/fr/projets',
      '/fr/contact',
    ]);
  });

  it('uses exact aria-current page semantics for static navigation links', async () => {
    const harness = await createHarness('/fr/projets');

    await settleHarness(harness);
    expect(navLink(harness, 'Projets')?.getAttribute('aria-current')).toBe('page');

    await harness.navigateByUrl('/fr/projets/inconnu');

    await settleHarness(harness);
    expect(
      harness.routeNativeElement?.querySelector('app-not-found-page h1')?.textContent,
    ).toContain('Page introuvable');
    expect(navLink(harness, 'Projets')?.getAttribute('aria-current')).toBeNull();
  });
});

async function createHarness(initialUrl: string): Promise<RouterTestingHarness> {
  TestBed.configureTestingModule({
    providers: [provideRouter(routes)],
  });

  return RouterTestingHarness.create(initialUrl);
}

function navLink(harness: RouterTestingHarness, label: string): HTMLAnchorElement | undefined {
  return primaryNavLinks(harness).find(
    (link): link is HTMLAnchorElement =>
      link instanceof HTMLAnchorElement && link.textContent?.trim() === label,
  );
}

function primaryNavLinks(harness: RouterTestingHarness): HTMLAnchorElement[] {
  return Array.from(
    harness.routeNativeElement?.querySelectorAll('nav[data-primary-nav] a') ?? [],
  ).filter((link): link is HTMLAnchorElement => link instanceof HTMLAnchorElement);
}

async function settleHarness(harness: RouterTestingHarness): Promise<void> {
  harness.detectChanges();
  await harness.fixture.whenStable();
  harness.detectChanges();
}
