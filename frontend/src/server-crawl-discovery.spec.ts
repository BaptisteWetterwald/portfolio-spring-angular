import {
  createSitemapXml,
  loadSitemapXml,
  SitemapUnavailableError,
} from './server-crawl-discovery';

describe('server crawl discovery', () => {
  it('includes only safe public detail project URLs', () => {
    const xml = createSitemapXml(
      new Map([
        [
          'fr',
          [
            projectCandidate('published-detail', 'PUBLISHED', 'DETAIL'),
            projectCandidate('archived-detail', 'ARCHIVED', 'DETAIL'),
            projectCandidate('draft-detail', 'DRAFT', 'DETAIL'),
            projectCandidate('published-card-only', 'PUBLISHED', 'CARD_ONLY'),
            projectCandidate('archived-card-only', 'ARCHIVED', 'CARD_ONLY'),
            projectCandidate('../unsafe', 'PUBLISHED', 'DETAIL'),
          ],
        ],
        ['en', []],
      ]),
    );

    expect(sitemapLocations(xml)).toEqual([
      'https://bwetterwald.fr/fr',
      'https://bwetterwald.fr/en',
      'https://bwetterwald.fr/hu',
      'https://bwetterwald.fr/fr/projets/published-detail',
      'https://bwetterwald.fr/fr/projets/archived-detail',
    ]);
    expect(xml).not.toContain('draft-detail');
    expect(xml).not.toContain('card-only');
    expect(xml).not.toContain('unsafe');
  });

  it('emits reciprocal bilingual alternates and localized single-language entries', () => {
    const xml = createSitemapXml(
      new Map([
        ['fr', [detailProject('bilingual-project'), detailProject('french-only-project')]],
        ['en', [detailProject('bilingual-project'), detailProject('english-only-project')]],
      ]),
    );
    const frenchBilingual = sitemapUrlBlock(
      xml,
      'https://bwetterwald.fr/fr/projets/bilingual-project',
    );
    const englishBilingual = sitemapUrlBlock(
      xml,
      'https://bwetterwald.fr/en/projects/bilingual-project',
    );
    const frenchOnly = sitemapUrlBlock(
      xml,
      'https://bwetterwald.fr/fr/projets/french-only-project',
    );
    const englishOnly = sitemapUrlBlock(
      xml,
      'https://bwetterwald.fr/en/projects/english-only-project',
    );

    for (const bilingualEntry of [frenchBilingual, englishBilingual]) {
      expect(bilingualEntry).toContain(
        'hreflang="fr" href="https://bwetterwald.fr/fr/projets/bilingual-project"',
      );
      expect(bilingualEntry).toContain(
        'hreflang="en" href="https://bwetterwald.fr/en/projects/bilingual-project"',
      );
    }

    expect(frenchOnly).toContain(
      'hreflang="fr" href="https://bwetterwald.fr/fr/projets/french-only-project"',
    );
    expect(frenchOnly).not.toContain('hreflang="en"');
    expect(englishOnly).toContain(
      'hreflang="en" href="https://bwetterwald.fr/en/projects/english-only-project"',
    );
    expect(englishOnly).not.toContain('hreflang="fr"');

    for (const projectEntry of [frenchBilingual, englishBilingual, frenchOnly, englishOnly]) {
      expect(projectEntry).not.toContain('hreflang="x-default"');
    }

    expect(sitemapUrlBlock(xml, 'https://bwetterwald.fr/fr')).toContain(
      'hreflang="x-default" href="https://bwetterwald.fr/"',
    );
    expect(sitemapUrlBlock(xml, 'https://bwetterwald.fr/en')).toContain(
      'hreflang="x-default" href="https://bwetterwald.fr/"',
    );
  });

  it('deduplicates repeated localized project summaries', () => {
    const repeatedProject = detailProject('repeated-project');
    const xml = createSitemapXml(
      new Map([
        ['fr', [repeatedProject, repeatedProject]],
        ['en', [repeatedProject, repeatedProject]],
      ]),
    );
    const locations = sitemapLocations(xml);

    expect(locations).toEqual([
      'https://bwetterwald.fr/fr',
      'https://bwetterwald.fr/en',
      'https://bwetterwald.fr/hu',
      'https://bwetterwald.fr/fr/projets/repeated-project',
      'https://bwetterwald.fr/en/projects/repeated-project',
    ]);
    expect(new Set(locations).size).toBe(locations.length);
  });

  it('loads each localized public project index from the configured backend', async () => {
    const requestedUrls: string[] = [];
    const xml = await loadSitemapXml('http://backend:8080', async (url) => {
      requestedUrls.push(url.href);

      return Response.json([
        detailProject('blaze4'),
        projectCandidate('not-crawlable', 'PUBLISHED', 'CARD_ONLY'),
        projectCandidate('also-not-crawlable', 'DRAFT', 'DETAIL'),
        { ...detailProject('also-not-crawlable'), slug: '../unsafe' },
      ]);
    });

    expect(requestedUrls).toEqual([
      'http://backend:8080/api/v1/projects?locale=fr',
      'http://backend:8080/api/v1/projects?locale=en',
      'http://backend:8080/api/v1/projects?locale=hu',
    ]);
    expect(xml).toContain('<loc>https://bwetterwald.fr/fr/projets/blaze4</loc>');
    expect(xml).toContain('<loc>https://bwetterwald.fr/en/projects/blaze4</loc>');
    expect(xml).not.toContain('not-crawlable');
    expect(xml).not.toContain('unsafe');
  });

  it('fails closed when the backend origin is not configured', async () => {
    await expect(loadSitemapXml(undefined)).rejects.toBeInstanceOf(SitemapUnavailableError);
  });

  it('fails closed when a localized public index returns an error', async () => {
    await expect(
      loadSitemapXml('http://backend:8080', async () => new Response(null, { status: 503 })),
    ).rejects.toBeInstanceOf(SitemapUnavailableError);
  });

  it('fails closed when a localized public index returns invalid JSON', async () => {
    await expect(
      loadSitemapXml(
        'http://backend:8080',
        async () => new Response('{invalid-json', { status: 200 }),
      ),
    ).rejects.toBeInstanceOf(SitemapUnavailableError);
  });

  it('fails closed when a localized public index returns a non-array payload', async () => {
    await expect(
      loadSitemapXml('http://backend:8080', async () => Response.json({ projects: [] })),
    ).rejects.toBeInstanceOf(SitemapUnavailableError);
  });

  it('fails closed when a localized public index request rejects', async () => {
    await expect(
      loadSitemapXml('http://backend:8080', async () => {
        throw new Error('Network unavailable.');
      }),
    ).rejects.toBeInstanceOf(SitemapUnavailableError);
  });

  it('aborts localized public index requests after the configured timeout', async () => {
    await expect(
      loadSitemapXml('http://backend:8080', pendingUntilAborted, 20),
    ).rejects.toBeInstanceOf(SitemapUnavailableError);
  });
});

function projectCandidate(
  slug: string,
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
  presentationMode: 'CARD_ONLY' | 'DETAIL',
) {
  return {
    slug,
    status,
    presentationMode,
  };
}

function detailProject(slug: string, status: 'PUBLISHED' | 'ARCHIVED' = 'PUBLISHED') {
  return projectCandidate(slug, status, 'DETAIL');
}

function sitemapLocations(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => match[1]);
}

function sitemapUrlBlock(xml: string, location: string): string {
  const block = [...xml.matchAll(/<url>[\s\S]*?<\/url>/gu)]
    .map((match) => match[0])
    .find((candidate) => candidate.includes(`<loc>${location}</loc>`));

  expect(block).toBeDefined();

  return block ?? '';
}

function pendingUntilAborted(_input: URL, init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    const signal = init?.signal;

    if (!signal) {
      reject(new Error('Expected a request timeout signal.'));
      return;
    }

    const rejectAsAborted = () => reject(signal.reason ?? new Error('Request aborted.'));

    if (signal.aborted) {
      rejectAsAborted();
      return;
    }

    signal.addEventListener('abort', rejectAsAborted, { once: true });
  });
}
