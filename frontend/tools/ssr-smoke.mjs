const origin = process.env['SSR_SMOKE_ORIGIN'] ?? 'http://127.0.0.1:4000';
const runControlledDetailSmoke = process.env['SSR_SMOKE_CONTROLLED_DETAIL'] === 'true';

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
      'data-navigation-handoff-state="header"',
      'class="join locale-switcher"',
      'theme-toggle',
      'data-sonar-nav',
      'href="/fr#education"',
      'aria-label="Lien vers la section Expérience"',
      'data-portfolio-divider',
      'id="home"',
      'id="education"',
      'id="experience"',
      'id="projects"',
      'id="contact"',
      'ENSISA',
      'Plansee Group Functions',
      'Portfolio Spring Angular',
      'Blaze4',
      'Frequensisa',
      'SummerCamp',
      'Bot Discord IR',
      'BeamNG.drive x BeepBeep 3',
      'href="/fr/projets/blaze4"',
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
      'data-navigation-handoff-state="header"',
      'class="join locale-switcher"',
      'theme-toggle',
      'data-sonar-nav',
      'href="/en#experience"',
      'aria-label="Link to Experience section"',
      'data-portfolio-divider',
      'id="home"',
      'id="education"',
      'id="experience"',
      'id="projects"',
      'id="contact"',
      'Engineering Degree',
      'Software Developer Intern',
      'Portfolio Spring Angular',
      'Blaze4',
      'Frequensisa',
      'SummerCamp',
      'Bot Discord IR',
      'BeamNG.drive x BeepBeep 3',
      'href="/en/projects/portfolio-spring-angular"',
      '<footer',
    ],
  },
  {
    name: 'French education compatibility redirect',
    path: '/fr/formation',
    expectedStatus: 302,
    expectedLocation: '/fr#education',
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
    name: 'English education compatibility redirect',
    path: '/en/education',
    expectedStatus: 302,
    expectedLocation: '/en#education',
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
    name: 'French experience compatibility redirect',
    path: '/fr/experience',
    expectedStatus: 302,
    expectedLocation: '/fr#experience',
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
    name: 'English experience compatibility redirect',
    path: '/en/experience',
    expectedStatus: 302,
    expectedLocation: '/en#experience',
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
    name: 'English projects compatibility redirect',
    path: '/en/projects',
    expectedStatus: 302,
    expectedLocation: '/en#projects',
    expectedBody: [
      '<title>Projects | Baptiste Wetterwald</title>',
      'A selection of personal and academic projects showcasing the technologies and software architectures I have worked with.',
      'Portfolio Spring Angular',
      'Bilingual portfolio application built with Angular SSR',
      'href="/en/projects/portfolio-spring-angular"',
      'href="https://github.com/BaptisteWetterwald/portfolio-spring-angular"',
      'Blaze4',
      'Connect Four web application built with C#/.NET using an N-tier architecture',
      'href="/en/projects/blaze4"',
      'href="https://github.com/BaptisteWetterwald/ecole-ntiers-projet-blaze4"',
      'Frequensisa',
      'iOS application for listening to and managing Internet radio stations',
      'href="https://github.com/BaptisteWetterwald/ecole-ios-frequensisa"',
      'SummerCamp',
      'Android summer-camp management application built with Kotlin',
      'href="https://github.com/BaptisteWetterwald/ecole-android-summercamp"',
      'Bot Discord IR',
      'Discord bot built with Node.js to centralize commands and utilities',
      'href="https://github.com/BaptisteWetterwald/discord-bot-ensisa-ir"',
      'BeamNG.drive x BeepBeep 3',
      'Academic research-oriented internship',
      'hreflang="fr" href="https://bwetterwald.fr/fr/projets"',
      'href="/en/projects"',
      'data-sonar-nav',
    ],
    expectedBodyOrder: [
      'Portfolio Spring Angular',
      'Blaze4',
      'Frequensisa',
      'SummerCamp',
      'Bot Discord IR',
      'BeamNG.drive x BeepBeep 3',
    ],
    unexpectedBody: [
      'href="/en/projects/frequensisa"',
      'href="/en/projects/summercamp"',
      'href="/en/projects/bot-discord-ir"',
      'href="/en/projects/beamng-drive-beepbeep-3"',
    ],
  },
  {
    name: 'French projects compatibility redirect',
    path: '/fr/projets',
    expectedStatus: 302,
    expectedLocation: '/fr#projects',
    expectedBody: [
      '<title>Projets | Baptiste Wetterwald</title>',
      "Une sélection de projets personnels et académiques illustrant les technologies et architectures avec lesquelles j'ai travaillé.",
      'BeamNG.drive x BeepBeep 3',
      'Blaze4',
      "Application web de Puissance 4 en C#/.NET, construite autour d'une architecture N-tiers",
      'href="/fr/projets/blaze4"',
      'href="https://github.com/BaptisteWetterwald/ecole-ntiers-projet-blaze4"',
      'Portfolio Spring Angular',
      'Application portfolio bilingue construite avec Angular SSR',
      'href="/fr/projets/portfolio-spring-angular"',
      'href="https://github.com/BaptisteWetterwald/portfolio-spring-angular"',
      'Frequensisa',
      'AVPlayer',
      'href="https://github.com/BaptisteWetterwald/ecole-ios-frequensisa"',
      'SummerCamp',
      'Jetpack Compose',
      'href="https://github.com/BaptisteWetterwald/ecole-android-summercamp"',
      'Bot Discord IR',
      'Node.js',
      'href="https://github.com/BaptisteWetterwald/discord-bot-ensisa-ir"',
      'hreflang="en" href="https://bwetterwald.fr/en/projects"',
      'href="/fr/projets"',
    ],
    expectedBodyOrder: [
      'Portfolio Spring Angular',
      'Blaze4',
      'Frequensisa',
      'SummerCamp',
      'Bot Discord IR',
      'BeamNG.drive x BeepBeep 3',
    ],
    unexpectedBody: [
      'href="/fr/projets/frequensisa"',
      'href="/fr/projets/summercamp"',
      'href="/fr/projets/bot-discord-ir"',
      'href="/fr/projets/beamng-drive-beepbeep-3"',
    ],
  },
  {
    name: 'French contact compatibility redirect',
    path: '/fr/contact',
    expectedStatus: 302,
    expectedLocation: '/fr#contact',
  },
  {
    name: 'English contact compatibility redirect',
    path: '/en/contact',
    expectedStatus: 302,
    expectedLocation: '/en#contact',
  },
  {
    name: 'English Blaze4 detail SSR metadata',
    path: '/en/projects/blaze4',
    expectedStatus: 200,
    expectedBody: [
      '<title>Blaze4 | Baptiste Wetterwald</title>',
      'Connect Four web application built with C#/.NET using an N-tier architecture',
      'Technical overview',
      'Case study',
      'Context',
      'Blaze4 is a Connect Four web application developed as part of an academic project focused on N-tier architectures.',
      'Architecture',
      'The application is organized into several .NET projects',
      'Business logic and API',
      'The backend handles game creation, gameplay and turn validation.',
      'Authentication and persistence',
      'The application supports player registration and login using JWT authentication.',
      'C#',
      '.NET',
      'ASP.NET Core',
      'Blazor WebAssembly',
      'Entity Framework Core',
      'SQLite',
      'href="https://github.com/BaptisteWetterwald/ecole-ntiers-projet-blaze4"',
      'href="https://bwetterwald.fr/en/projects/blaze4"',
      'hreflang="fr" href="https://bwetterwald.fr/fr/projets/blaze4"',
      'hreflang="en" href="https://bwetterwald.fr/en/projects/blaze4"',
      'property="og:type" content="article"',
      'property="og:locale" content="en_US"',
      'property="og:locale:alternate" content="fr_FR"',
      'href="/fr/projets/blaze4"',
      'href="/en/projects/blaze4"',
    ],
    unexpectedBody: ['property="og:image"', 'SignalR', 'WebSockets'],
  },
  {
    name: 'French Blaze4 detail SSR metadata',
    path: '/fr/projets/blaze4',
    expectedStatus: 200,
    expectedBody: [
      '<title>Blaze4 | Baptiste Wetterwald</title>',
      "Application web de Puissance 4 en C#/.NET, construite autour d'une architecture N-tiers",
      'Vue technique',
      'Étude de projet',
      'Contexte',
      "Blaze4 est une application web de Puissance 4 réalisée dans le cadre d'un projet consacré aux architectures N-tiers.",
      'Architecture',
      "L'application est organisée en plusieurs projets .NET",
      'Logique métier et API',
      'Le backend prend en charge la création des parties, le déroulement du jeu et la validation des tours.',
      'Authentification et persistance',
      "L'application propose l'inscription et la connexion des joueurs avec authentification JWT.",
      'C#',
      '.NET',
      'ASP.NET Core',
      'Blazor WebAssembly',
      'Entity Framework Core',
      'SQLite',
      'href="https://github.com/BaptisteWetterwald/ecole-ntiers-projet-blaze4"',
      'href="https://bwetterwald.fr/fr/projets/blaze4"',
      'hreflang="fr" href="https://bwetterwald.fr/fr/projets/blaze4"',
      'hreflang="en" href="https://bwetterwald.fr/en/projects/blaze4"',
      'property="og:type" content="article"',
      'property="og:locale" content="fr_FR"',
      'property="og:locale:alternate" content="en_US"',
      'href="/fr/projets/blaze4"',
      'href="/en/projects/blaze4"',
    ],
    unexpectedBody: ['property="og:image"', 'SignalR', 'WebSockets'],
  },
  {
    name: 'English Portfolio detail SSR metadata',
    path: '/en/projects/portfolio-spring-angular',
    expectedStatus: 200,
    expectedBody: [
      '<title>Portfolio Spring Angular | Baptiste Wetterwald</title>',
      'Bilingual portfolio application built with Angular SSR, Spring Boot, PostgreSQL and Flyway',
      'Technical overview',
      'Case study',
      'Context',
      'Portfolio Spring Angular is the source-backed portfolio application for Baptiste Wetterwald.',
      'Architecture',
      'The application is split into an Angular 22 SSR frontend and a Spring Boot backend.',
      'Projects and content',
      'Projects are backend-managed entities with publication status, presentation mode, localized translations',
      'SSR, SEO and accessibility',
      'Localized /fr and /en routes are rendered at request time.',
      'Angular',
      'TypeScript',
      'Java',
      'Spring Boot',
      'PostgreSQL',
      'Flyway',
      'Angular SSR',
      'Tailwind CSS',
      'daisyUI',
      'Docker Compose',
      'href="https://github.com/BaptisteWetterwald/portfolio-spring-angular"',
      'href="https://bwetterwald.fr/en/projects/portfolio-spring-angular"',
      'hreflang="fr" href="https://bwetterwald.fr/fr/projets/portfolio-spring-angular"',
      'hreflang="en" href="https://bwetterwald.fr/en/projects/portfolio-spring-angular"',
      'property="og:type" content="article"',
      'property="og:locale" content="en_US"',
      'property="og:locale:alternate" content="fr_FR"',
      'href="/fr/projets/portfolio-spring-angular"',
      'href="/en/projects/portfolio-spring-angular"',
    ],
    unexpectedBody: ['property="og:image"', 'CI/CD', 'production deployment'],
  },
  {
    name: 'French Portfolio detail SSR metadata',
    path: '/fr/projets/portfolio-spring-angular',
    expectedStatus: 200,
    expectedBody: [
      '<title>Portfolio Spring Angular | Baptiste Wetterwald</title>',
      'Application portfolio bilingue construite avec Angular SSR, Spring Boot, PostgreSQL et Flyway',
      'Vue technique',
      'Étude de projet',
      'Contexte',
      "Portfolio Spring Angular est l'application portfolio source de Baptiste Wetterwald.",
      'Architecture',
      "L'application est séparée entre un frontend Angular 22 avec SSR et un backend Spring Boot.",
      'Projets et contenu',
      'Les projets sont des entités gérées côté backend avec statut de publication',
      'SSR, SEO et accessibilité',
      'Les routes localisées /fr et /en sont rendues à la requête.',
      'Angular',
      'TypeScript',
      'Java',
      'Spring Boot',
      'PostgreSQL',
      'Flyway',
      'Angular SSR',
      'Tailwind CSS',
      'daisyUI',
      'Docker Compose',
      'href="https://github.com/BaptisteWetterwald/portfolio-spring-angular"',
      'href="https://bwetterwald.fr/fr/projets/portfolio-spring-angular"',
      'hreflang="fr" href="https://bwetterwald.fr/fr/projets/portfolio-spring-angular"',
      'hreflang="en" href="https://bwetterwald.fr/en/projects/portfolio-spring-angular"',
      'property="og:type" content="article"',
      'property="og:locale" content="fr_FR"',
      'property="og:locale:alternate" content="en_US"',
      'href="/fr/projets/portfolio-spring-angular"',
      'href="/en/projects/portfolio-spring-angular"',
    ],
    unexpectedBody: ['property="og:image"', 'CI/CD', 'déploiement production'],
  },
  {
    name: 'English BeamNG card-only detail URL is unavailable',
    path: '/en/projects/beamng-drive-beepbeep-3',
    expectedStatus: 404,
    expectedBody: [
      '<title>Page not found | Baptiste Wetterwald</title>',
      'Page not found',
      'noindex,follow',
    ],
    unexpectedBody: ['property="og:type" content="article"', 'network/socket programming'],
  },
  {
    name: 'French BeamNG card-only detail URL is unavailable',
    path: '/fr/projets/beamng-drive-beepbeep-3',
    expectedStatus: 404,
    expectedBody: [
      '<title>Page introuvable | Baptiste Wetterwald</title>',
      'Page introuvable',
      'noindex,follow',
    ],
    unexpectedBody: ['property="og:type" content="article"', 'programmation réseau/sockets'],
  },
  {
    name: 'English Frequensisa card-only detail URL is unavailable',
    path: '/en/projects/frequensisa',
    expectedStatus: 404,
    expectedBody: [
      '<title>Page not found | Baptiste Wetterwald</title>',
      'Page not found',
      'noindex,follow',
    ],
    unexpectedBody: ['property="og:type" content="article"', 'AVPlayer'],
  },
  {
    name: 'French Frequensisa card-only detail URL is unavailable',
    path: '/fr/projets/frequensisa',
    expectedStatus: 404,
    expectedBody: [
      '<title>Page introuvable | Baptiste Wetterwald</title>',
      'Page introuvable',
      'noindex,follow',
    ],
    unexpectedBody: ['property="og:type" content="article"', 'AVPlayer'],
  },
  {
    name: 'English SummerCamp card-only detail URL is unavailable',
    path: '/en/projects/summercamp',
    expectedStatus: 404,
    expectedBody: [
      '<title>Page not found | Baptiste Wetterwald</title>',
      'Page not found',
      'noindex,follow',
    ],
    unexpectedBody: ['property="og:type" content="article"', 'Jetpack Compose'],
  },
  {
    name: 'French SummerCamp card-only detail URL is unavailable',
    path: '/fr/projets/summercamp',
    expectedStatus: 404,
    expectedBody: [
      '<title>Page introuvable | Baptiste Wetterwald</title>',
      'Page introuvable',
      'noindex,follow',
    ],
    unexpectedBody: ['property="og:type" content="article"', 'Jetpack Compose'],
  },
  {
    name: 'English Bot Discord IR card-only detail URL is unavailable',
    path: '/en/projects/bot-discord-ir',
    expectedStatus: 404,
    expectedBody: [
      '<title>Page not found | Baptiste Wetterwald</title>',
      'Page not found',
      'noindex,follow',
    ],
    unexpectedBody: ['property="og:type" content="article"', 'Discord bot built with Node.js'],
  },
  {
    name: 'French Bot Discord IR card-only detail URL is unavailable',
    path: '/fr/projets/bot-discord-ir',
    expectedStatus: 404,
    expectedBody: [
      '<title>Page introuvable | Baptiste Wetterwald</title>',
      'Page introuvable',
      'noindex,follow',
    ],
    unexpectedBody: ['property="og:type" content="article"', 'Bot Discord'],
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

if (runControlledDetailSmoke) {
  checks.push(
    {
      name: 'English controlled detail SSR metadata',
      path: '/en/projects/ssr-detail-fixture',
      expectedStatus: 200,
      expectedBody: [
        '<title>SSR Detail Fixture | Baptiste Wetterwald</title>',
        'SSR detail fixture short description.',
        'SSR detail fixture detailed description.',
        'Angular',
        'href="https://bwetterwald.fr/en/projects/ssr-detail-fixture"',
        'hreflang="fr" href="https://bwetterwald.fr/fr/projets/ssr-detail-fixture"',
        'property="og:type" content="article"',
      ],
      unexpectedBody: ['property="og:image"'],
    },
    {
      name: 'French controlled detail SSR metadata',
      path: '/fr/projets/ssr-detail-fixture',
      expectedStatus: 200,
      expectedBody: [
        '<title>Fixture de detail SSR | Baptiste Wetterwald</title>',
        'Description courte de fixture detail SSR.',
        'Description detaillee de fixture detail SSR.',
        'Angular',
        'href="https://bwetterwald.fr/fr/projets/ssr-detail-fixture"',
        'hreflang="en" href="https://bwetterwald.fr/en/projects/ssr-detail-fixture"',
        'property="og:locale" content="fr_FR"',
      ],
      unexpectedBody: ['property="og:image"'],
    },
  );
}

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

  if (response.status >= 300 && response.status < 400) {
    console.log(`OK ${check.name}`);
    continue;
  }

  for (const fragment of check.expectedBody ?? []) {
    assert(body.includes(fragment), `${check.name}: missing body fragment ${fragment}`);
  }

  let previousOrderedIndex = -1;
  for (const fragment of check.expectedBodyOrder ?? []) {
    const orderedIndex = body.indexOf(fragment);

    assert(orderedIndex !== -1, `${check.name}: missing ordered body fragment ${fragment}`);
    assert(
      orderedIndex > previousOrderedIndex,
      `${check.name}: body fragment ${fragment} rendered out of order`,
    );

    previousOrderedIndex = orderedIndex;
  }

  for (const fragment of check.unexpectedBody ?? []) {
    assert(!body.includes(fragment), `${check.name}: unexpected body fragment ${fragment}`);
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
