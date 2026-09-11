const origin = process.env['SSR_SMOKE_ORIGIN'] ?? 'http://127.0.0.1:4000';
const runControlledDetailSmoke = process.env['SSR_SMOKE_CONTROLLED_DETAIL'] === 'true';
const unexpectedIndexingLinks = ['rel="canonical"', 'rel="alternate"'];
const projectXDefault = 'hreflang="x-default"';

const checks = [
  {
    name: 'robots crawl policy',
    path: '/robots.txt',
    expectedStatus: 200,
    expectedContentType: 'text/plain',
    expectedBody: [
      'User-agent: *',
      'Disallow: /api/',
      'Sitemap: https://bwetterwald.fr/sitemap.xml',
    ],
  },
  {
    name: 'localized sitemap discovery',
    path: '/sitemap.xml',
    expectedStatus: 200,
    expectedContentType: 'application/xml',
    expectedBody: [
      '<loc>https://bwetterwald.fr/fr</loc>',
      '<loc>https://bwetterwald.fr/en</loc>',
      '<loc>https://bwetterwald.fr/fr/projets/blaze4</loc>',
      '<loc>https://bwetterwald.fr/en/projects/blaze4</loc>',
      '<loc>https://bwetterwald.fr/fr/projets/portfolio-spring-angular</loc>',
      '<loc>https://bwetterwald.fr/en/projects/portfolio-spring-angular</loc>',
      'hreflang="x-default" href="https://bwetterwald.fr/"',
    ],
    unexpectedBody: ['card-only', 'frequensisa', 'summercamp', 'bot-discord-ir'],
  },
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
      '<title>Baptiste Wetterwald | Ingénieur logiciel</title>',
      'name="description" content="Baptiste Wetterwald, ingénieur logiciel orienté backend et full-stack autour de Java, Spring, .NET, TypeScript, Node.js et Angular."',
      'name="robots" content="index,follow"',
      'rel="canonical" href="https://bwetterwald.fr/fr"',
      'hreflang="fr" href="https://bwetterwald.fr/fr"',
      'hreflang="en" href="https://bwetterwald.fr/en"',
      'hreflang="x-default" href="https://bwetterwald.fr/"',
      'property="og:title" content="Baptiste Wetterwald | Ingénieur logiciel"',
      'property="og:description" content="Baptiste Wetterwald, ingénieur logiciel orienté backend et full-stack autour de Java, Spring, .NET, TypeScript, Node.js et Angular."',
      'property="og:type" content="website"',
      'property="og:url" content="https://bwetterwald.fr/fr"',
      'property="og:locale" content="fr_FR"',
      'property="og:locale:alternate" content="en_US"',
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
      'formcontrolname="name"',
      'formcontrolname="email"',
      'Envoyer le message',
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
      '<title>Baptiste Wetterwald | Software Engineer</title>',
      'name="description" content="Baptiste Wetterwald, Software Engineer focused on backend and full-stack development with Java, Spring, .NET, TypeScript, Node.js, and Angular."',
      'name="robots" content="index,follow"',
      'rel="canonical" href="https://bwetterwald.fr/en"',
      'hreflang="fr" href="https://bwetterwald.fr/fr"',
      'hreflang="en" href="https://bwetterwald.fr/en"',
      'hreflang="x-default" href="https://bwetterwald.fr/"',
      'property="og:title" content="Baptiste Wetterwald | Software Engineer"',
      'property="og:description" content="Baptiste Wetterwald, Software Engineer focused on backend and full-stack development with Java, Spring, .NET, TypeScript, Node.js, and Angular."',
      'property="og:type" content="website"',
      'property="og:url" content="https://bwetterwald.fr/en"',
      'property="og:locale" content="en_US"',
      'property="og:locale:alternate" content="fr_FR"',
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
      'formcontrolname="name"',
      'formcontrolname="email"',
      'Send message',
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
    expectedStatus: 308,
    expectedLocation: '/fr#education',
  },
  {
    name: 'English education compatibility redirect',
    path: '/en/education',
    expectedStatus: 308,
    expectedLocation: '/en#education',
  },
  {
    name: 'French experience compatibility redirect',
    path: '/fr/experience',
    expectedStatus: 308,
    expectedLocation: '/fr#experience',
  },
  {
    name: 'English experience compatibility redirect',
    path: '/en/experience',
    expectedStatus: 308,
    expectedLocation: '/en#experience',
  },
  {
    name: 'English projects compatibility redirect',
    path: '/en/projects',
    expectedStatus: 308,
    expectedLocation: '/en#projects',
  },
  {
    name: 'French projects compatibility redirect',
    path: '/fr/projets',
    expectedStatus: 308,
    expectedLocation: '/fr#projects',
  },
  {
    name: 'French contact compatibility redirect',
    path: '/fr/contact',
    expectedStatus: 308,
    expectedLocation: '/fr#contact',
  },
  {
    name: 'English contact compatibility redirect',
    path: '/en/contact',
    expectedStatus: 308,
    expectedLocation: '/en#contact',
  },
  {
    name: 'English Blaze4 detail SSR metadata',
    path: '/en/projects/blaze4',
    expectedStatus: 200,
    expectedBody: [
      '<title>Blaze4 | Baptiste Wetterwald</title>',
      'name="description" content="Connect Four web application built with C#/.NET using an N-tier architecture, an ASP.NET Core REST API, a Blazor WebAssembly frontend and Entity Framework Core persistence."',
      'name="robots" content="index,follow"',
      'rel="canonical" href="https://bwetterwald.fr/en/projects/blaze4"',
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
      'property="og:title" content="Blaze4 | Baptiste Wetterwald"',
      'property="og:description" content="Connect Four web application built with C#/.NET using an N-tier architecture, an ASP.NET Core REST API, a Blazor WebAssembly frontend and Entity Framework Core persistence."',
      'property="og:url" content="https://bwetterwald.fr/en/projects/blaze4"',
      'property="og:locale" content="en_US"',
      'property="og:locale:alternate" content="fr_FR"',
      'href="/fr/projets/blaze4"',
      'href="/en/projects/blaze4"',
    ],
    unexpectedBody: [projectXDefault, 'property="og:image"', 'SignalR', 'WebSockets'],
  },
  {
    name: 'French Blaze4 detail SSR metadata',
    path: '/fr/projets/blaze4',
    expectedStatus: 200,
    expectedBody: [
      '<title>Blaze4 | Baptiste Wetterwald</title>',
      'name="description" content="Application web de Puissance 4 en C#/.NET, construite autour d\'une architecture N-tiers avec API REST ASP.NET Core, frontend Blazor WebAssembly et persistance via Entity Framework Core."',
      'name="robots" content="index,follow"',
      'rel="canonical" href="https://bwetterwald.fr/fr/projets/blaze4"',
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
      'property="og:title" content="Blaze4 | Baptiste Wetterwald"',
      'property="og:description" content="Application web de Puissance 4 en C#/.NET, construite autour d\'une architecture N-tiers avec API REST ASP.NET Core, frontend Blazor WebAssembly et persistance via Entity Framework Core."',
      'property="og:url" content="https://bwetterwald.fr/fr/projets/blaze4"',
      'property="og:locale" content="fr_FR"',
      'property="og:locale:alternate" content="en_US"',
      'href="/fr/projets/blaze4"',
      'href="/en/projects/blaze4"',
    ],
    unexpectedBody: [projectXDefault, 'property="og:image"', 'SignalR', 'WebSockets'],
  },
  {
    name: 'English Portfolio detail SSR metadata',
    path: '/en/projects/portfolio-spring-angular',
    expectedStatus: 200,
    expectedBody: [
      '<title>Portfolio Spring Angular | Baptiste Wetterwald</title>',
      'name="description" content="Bilingual portfolio application built with Angular SSR, Spring Boot, PostgreSQL and Flyway to serve localized content and structured project case studies."',
      'name="robots" content="index,follow"',
      'rel="canonical" href="https://bwetterwald.fr/en/projects/portfolio-spring-angular"',
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
      'property="og:title" content="Portfolio Spring Angular | Baptiste Wetterwald"',
      'property="og:description" content="Bilingual portfolio application built with Angular SSR, Spring Boot, PostgreSQL and Flyway to serve localized content and structured project case studies."',
      'property="og:url" content="https://bwetterwald.fr/en/projects/portfolio-spring-angular"',
      'property="og:locale" content="en_US"',
      'property="og:locale:alternate" content="fr_FR"',
      'href="/fr/projets/portfolio-spring-angular"',
      'href="/en/projects/portfolio-spring-angular"',
    ],
    unexpectedBody: [projectXDefault, 'property="og:image"', 'CI/CD', 'production deployment'],
  },
  {
    name: 'French Portfolio detail SSR metadata',
    path: '/fr/projets/portfolio-spring-angular',
    expectedStatus: 200,
    expectedBody: [
      '<title>Portfolio Spring Angular | Baptiste Wetterwald</title>',
      'name="description" content="Application portfolio bilingue construite avec Angular SSR, Spring Boot, PostgreSQL et Flyway pour servir du contenu localisé et des études de projets structurées."',
      'name="robots" content="index,follow"',
      'rel="canonical" href="https://bwetterwald.fr/fr/projets/portfolio-spring-angular"',
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
      'property="og:title" content="Portfolio Spring Angular | Baptiste Wetterwald"',
      'property="og:description" content="Application portfolio bilingue construite avec Angular SSR, Spring Boot, PostgreSQL et Flyway pour servir du contenu localisé et des études de projets structurées."',
      'property="og:url" content="https://bwetterwald.fr/fr/projets/portfolio-spring-angular"',
      'property="og:locale" content="fr_FR"',
      'property="og:locale:alternate" content="en_US"',
      'href="/fr/projets/portfolio-spring-angular"',
      'href="/en/projects/portfolio-spring-angular"',
    ],
    unexpectedBody: [projectXDefault, 'property="og:image"', 'CI/CD', 'déploiement production'],
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
    unexpectedBody: [
      ...unexpectedIndexingLinks,
      'property="og:type" content="article"',
      'network/socket programming',
    ],
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
    unexpectedBody: [
      ...unexpectedIndexingLinks,
      'property="og:type" content="article"',
      'programmation réseau/sockets',
    ],
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
    unexpectedBody: [
      ...unexpectedIndexingLinks,
      'property="og:type" content="article"',
      'AVPlayer',
    ],
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
    unexpectedBody: [
      ...unexpectedIndexingLinks,
      'property="og:type" content="article"',
      'AVPlayer',
    ],
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
    unexpectedBody: [
      ...unexpectedIndexingLinks,
      'property="og:type" content="article"',
      'Jetpack Compose',
    ],
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
    unexpectedBody: [
      ...unexpectedIndexingLinks,
      'property="og:type" content="article"',
      'Jetpack Compose',
    ],
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
    unexpectedBody: [
      ...unexpectedIndexingLinks,
      'property="og:type" content="article"',
      'Discord bot built with Node.js',
    ],
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
    unexpectedBody: [
      ...unexpectedIndexingLinks,
      'property="og:type" content="article"',
      'Bot Discord',
    ],
  },
  {
    name: 'missing public project detail returns localized 404 metadata',
    path: '/en/projects/missing-project',
    expectedStatus: 404,
    expectedBody: [
      '<title>Page not found | Baptiste Wetterwald</title>',
      'Page not found',
      'name="robots" content="noindex,follow"',
    ],
    unexpectedBody: [...unexpectedIndexingLinks, 'property="og:type" content="article"'],
  },
  {
    name: 'invalid public project slug returns localized 404 metadata',
    path: '/en/projects/Not-Valid',
    expectedStatus: 404,
    expectedBody: [
      '<title>Page not found | Baptiste Wetterwald</title>',
      'Page not found',
      'name="robots" content="noindex,follow"',
    ],
    unexpectedBody: [...unexpectedIndexingLinks, 'property="og:type" content="article"'],
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
    unexpectedBody: unexpectedIndexingLinks,
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

  if (check.expectedContentType) {
    assert(
      response.headers.get('content-type')?.includes(check.expectedContentType),
      `${check.name}: expected Content-Type containing ${check.expectedContentType}, received ${response.headers.get(
        'content-type',
      )}`,
    );
  }

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
