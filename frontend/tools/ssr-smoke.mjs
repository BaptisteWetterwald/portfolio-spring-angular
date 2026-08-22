const origin = process.env['SSR_SMOKE_ORIGIN'] ?? 'http://127.0.0.1:4000';

const checks = [
  {
    name: 'root fallback redirects to English',
    path: '/',
    expectedStatus: 302,
    expectedLocation: '/en',
  },
  {
    name: 'root Accept-Language redirects to French',
    path: '/',
    headers: {
      'accept-language': 'fr-FR,fr;q=0.9',
    },
    expectedStatus: 302,
    expectedLocation: '/fr',
  },
  {
    name: 'root stored preference cookie wins',
    path: '/',
    headers: {
      cookie: 'portfolio_locale=fr',
      'accept-language': 'en-US,en;q=0.9',
    },
    expectedStatus: 302,
    expectedLocation: '/fr',
  },
  {
    name: 'French home SSR',
    path: '/fr',
    expectedStatus: 200,
    expectedBody: ['<html lang="fr"', '>Accueil</h1>', 'https://bwetterwald.fr/fr'],
  },
  {
    name: 'English home SSR',
    path: '/en',
    expectedStatus: 200,
    expectedBody: ['<html lang="en"', '>Home</h1>', 'https://bwetterwald.fr/en'],
  },
  {
    name: 'French education metadata',
    path: '/fr/formation',
    expectedStatus: 200,
    expectedBody: [
      '<title>Formation | Baptiste Wetterwald</title>',
      'hreflang="en" href="https://bwetterwald.fr/en/education"',
    ],
  },
  {
    name: 'English projects metadata',
    path: '/en/projects',
    expectedStatus: 200,
    expectedBody: [
      '<title>Projects | Baptiste Wetterwald</title>',
      'hreflang="fr" href="https://bwetterwald.fr/fr/projets"',
    ],
  },
  {
    name: 'unsupported locale returns 404',
    path: '/de',
    expectedStatus: 404,
    expectedBody: ['Page not found'],
  },
  {
    name: 'localized unknown route returns 404',
    path: '/fr/inconnu',
    expectedStatus: 404,
    expectedBody: ['Page introuvable', 'noindex,follow'],
  },
];

for (const check of checks) {
  const url = `${origin}${check.path}`;
  const response = await fetchSmokeTarget(url, check);
  const body = await response.text();

  assert(
    response.status === check.expectedStatus,
    `${check.name}: expected status ${check.expectedStatus}, received ${response.status}`,
  );

  if (check.expectedLocation) {
    assert(
      response.headers.get('location') === check.expectedLocation,
      `${check.name}: expected Location ${check.expectedLocation}, received ${response.headers.get(
        'location',
      )}`,
    );
  }

  for (const fragment of check.expectedBody ?? []) {
    assert(body.includes(fragment), `${check.name}: missing body fragment ${fragment}`);
  }

  console.log(`OK ${check.name}`);
}

console.log(`SSR smoke checks passed for ${origin}`);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchSmokeTarget(url, check) {
  try {
    return await fetch(url, {
      redirect: 'manual',
      headers: check.headers,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);

    throw new Error(
      `${check.name}: unable to reach ${url}. Start the built SSR server first or set SSR_SMOKE_ORIGIN. ${detail}`,
    );
  }
}
