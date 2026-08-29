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
    expectedBody: [
      '<html lang="fr"',
      'Baptiste Wetterwald</h1>',
      'Ingénieur logiciel',
      'Java / Spring',
      'src="/assets/portrait/baptiste-wetterwald-portrait.png"',
      'alt="Portrait de Baptiste Wetterwald"',
      'https://bwetterwald.fr/fr',
      'href="#main-content"',
      'data-primary-nav',
      'class="join locale-switcher"',
      'theme-toggle',
      'data-sonar-nav',
      '<footer',
    ],
  },
  {
    name: 'English home SSR',
    path: '/en',
    expectedStatus: 200,
    expectedBody: [
      '<html lang="en"',
      'Baptiste Wetterwald</h1>',
      'Software Engineer',
      'Java / Spring',
      'src="/assets/portrait/baptiste-wetterwald-portrait.png"',
      'alt="Portrait of Baptiste Wetterwald"',
      'https://bwetterwald.fr/en',
      'href="#main-content"',
      'data-primary-nav',
      'class="join locale-switcher"',
      'theme-toggle',
      'data-sonar-nav',
      '<footer',
    ],
  },
  {
    name: 'French education metadata',
    path: '/fr/formation',
    expectedStatus: 200,
    expectedBody: [
      '<title>Formation | Baptiste Wetterwald</title>',
      'ENSISA',
      'Université du Québec à Chicoutimi',
      'IUT Robert Schuman',
      'INSA Lyon',
      'Lycée Louis Armand',
      'href="https://www.ensisa.uha.fr/"',
      'hreflang="en" href="https://bwetterwald.fr/en/education"',
      'href="/fr/formation"',
      'data-primary-nav',
    ],
  },
  {
    name: 'English education content',
    path: '/en/education',
    expectedStatus: 200,
    expectedBody: [
      '<title>Education | Baptiste Wetterwald</title>',
      'Engineering Degree',
      'Computer Science and Networks',
      'Study semester abroad',
      'DUT Computer Science',
      'First year of the integrated engineering preparatory cycle',
      'Baccalauréat STI2D',
    ],
  },
  {
    name: 'French experience content',
    path: '/fr/experience',
    expectedStatus: 200,
    expectedBody: [
      '<title>Expérience | Baptiste Wetterwald</title>',
      'Plansee Group Functions',
      'Bureau Veritas Laboratoires',
      'Power Platform',
      'Laboratoire d’Informatique Formelle',
      'href="https://plansee-group.com/en"',
      'sans développement ABAP',
    ],
  },
  {
    name: 'English experience content',
    path: '/en/experience',
    expectedStatus: 200,
    expectedBody: [
      '<title>Experience | Baptiste Wetterwald</title>',
      'Plansee Group Functions',
      'Software Developer Intern',
      'Bureau Veritas Laboratories',
      'Power Platform',
      'BeamNG.drive',
    ],
  },
  {
    name: 'English projects metadata',
    path: '/en/projects',
    expectedStatus: 200,
    expectedBody: [
      '<title>Projects | Baptiste Wetterwald</title>',
      'hreflang="fr" href="https://bwetterwald.fr/fr/projets"',
      'href="/en/projects"',
      'data-sonar-nav',
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
    expectedBody: ['Page introuvable', 'noindex,follow', 'data-primary-nav', 'theme-toggle'],
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
