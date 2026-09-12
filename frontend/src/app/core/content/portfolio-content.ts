import { SupportedLocale } from '../i18n/locales';
import {
  EducationEntry,
  EducationEntryFact,
  EducationEntryId,
  ExperienceEntry,
  ExperienceEntryFact,
  ExperienceEntryId,
  Language,
  LanguageFact,
  LanguageId,
  LocalizedPortfolioContent,
  PortfolioContentByLocale,
  PortfolioPeriod,
  PortfolioPeriodFact,
  SkillDomainId,
  SkillGroup,
  SkillGroupFact,
  SkillGroupId,
  SkillTechnologyId,
} from './portfolio-content.models';

export const portfolioPublicProfile = {
  portraitPath: '/assets/portrait/baptiste-wetterwald-portrait-v1-480w.webp',
  sameAs: ['https://github.com/BaptisteWetterwald'],
  socialCard: {
    path: '/assets/social/baptiste-wetterwald-social-card-v1.png',
    width: 1200,
    height: 630,
    mimeType: 'image/png',
  },
} as const;

interface PeriodLabels {
  readonly start?: string;
  readonly end?: string;
  readonly endPrefix?: string;
  readonly single?: string;
  readonly label?: string;
}

interface LocalizedEducationCopy {
  readonly institution: string;
  readonly degree: string;
  readonly field?: string;
  readonly status?: string;
  readonly summary?: string;
  readonly periodLabels?: PeriodLabels;
}

interface LocalizedExperienceCopy {
  readonly role: string;
  readonly context?: string;
  readonly responsibilities?: readonly string[];
  readonly periodLabels: PeriodLabels;
}

interface LocalizedSkillGroupCopy {
  readonly title: string;
  readonly summary?: string;
}

interface LocalizedSkillDomainCopy {
  readonly title: string;
}

interface LocalizedSkillTechnologyCopy {
  readonly name?: string;
  readonly note?: string;
}

interface LocalizedLanguageCopy {
  readonly name: string;
  readonly level?: string;
}

export const educationEntryFacts: readonly EducationEntryFact[] = [
  {
    id: 'ensisa',
    location: 'Mulhouse, France',
    period: {
      startDatetime: '2022',
      endDatetime: '2025',
    },
    affiliation: {
      officialWebsiteUrl: 'https://www.ensisa.uha.fr/',
      logo: {
        src: '/assets/logos/logo_ensisa.svg',
        alt: 'ENSISA logo',
      },
    },
  },
  {
    id: 'uqac-semester',
    location: 'Chicoutimi, Canada',
    period: {
      singleDatetime: '2022',
    },
    affiliation: {
      officialWebsiteUrl: 'https://www.uqac.ca/',
      logo: {
        src: '/assets/logos/logo_uqac.png',
        alt: 'UQAC logo',
      },
    },
  },
  {
    id: 'iut-robert-schuman',
    location: 'Illkirch, France',
    period: {
      startDatetime: '2020',
      endDatetime: '2022',
    },
    affiliation: {
      officialWebsiteUrl: 'https://iutrs.unistra.fr/',
      logo: {
        src: '/assets/logos/logo_iut_robert_schuman.png',
        alt: 'IUT Robert Schuman logo',
      },
    },
  },
  {
    id: 'insa-lyon',
    location: 'Lyon, France',
    period: {
      startDatetime: '2019',
      endDatetime: '2020',
    },
  },
  {
    id: 'lycee-louis-armand',
    location: 'Mulhouse, France',
    period: {
      singleDatetime: '2019',
    },
    affiliation: {
      logo: {
        src: '/assets/logos/logo_lycée_louis_armand.jpeg',
        alt: 'Lycée Louis Armand logo',
      },
    },
  },
];

export const experienceEntryFacts: readonly ExperienceEntryFact[] = [
  {
    id: 'plansee-group-functions',
    organization: 'Plansee Group Functions',
    location: 'Mamer, Luxembourg',
    period: {
      startDatetime: '2025-12-01',
    },
    duration: {
      en: 'Planned end: end of November 2026',
      fr: 'Fin prévue : fin novembre 2026',
    },
    technologies: [
      'ABAP',
      'SAP S/4HANA',
      'Angular',
      'TypeScript',
      'Node.js',
      'Express',
      'REST',
      'OAuth 2.0',
      'C#',
      '.NET',
    ],
    affiliation: {
      officialWebsiteUrl: 'https://plansee-group.com/en',
      logo: {
        src: '/assets/logos/logo_plansee.png',
        alt: 'Plansee logo',
      },
    },
  },
  {
    id: 'plansee-internship',
    organization: 'Plansee Group Functions',
    location: 'Mamer, Luxembourg',
    period: {
      startDatetime: '2025-07-01',
      endDatetime: '2025-09',
    },
    duration: {
      en: '11 weeks',
      fr: '11 semaines',
    },
    technologies: ['Angular', 'TypeScript'],
    affiliation: {
      officialWebsiteUrl: 'https://www.plansee.com/',
      logo: {
        src: '/assets/logos/logo_plansee.png',
        alt: 'Plansee logo',
      },
    },
  },
  {
    id: 'bureau-veritas-laboratories',
    organization: {
      en: 'Bureau Veritas Laboratories',
      fr: 'Bureau Veritas Laboratoires',
    },
    location: 'Sausheim, France',
    period: {
      startDatetime: '2023-09',
      endDatetime: '2025-09-30',
    },
    technologies: [
      'Microsoft Power Apps',
      'Power Automate',
      'Dataverse',
      'Microsoft Power Platform',
    ],
    affiliation: {
      officialWebsiteUrl: 'https://www.bureauveritas.fr/',
      logo: {
        src: '/assets/logos/logo_bureau_veritas.svg',
        alt: 'Bureau Veritas logo',
      },
    },
  },
  {
    id: 'groupe-ies',
    organization: 'Groupe IES',
    location: 'Colmar, France',
    period: {
      startDatetime: '2023-07',
      endDatetime: '2023-08',
    },
    duration: {
      en: '2 months',
      fr: '2 mois',
    },
    technologies: ['C#', '.NET', 'ASP.NET Blazor', 'VB.NET', 'REST'],
    affiliation: {
      logo: {
        src: '/assets/logos/logo_groupe_ies.jpeg',
        alt: 'Groupe IES logo',
      },
    },
  },
  {
    id: 'lif-uqac-internship',
    organization: 'Laboratoire d’Informatique Formelle (LIF), UQAC',
    location: 'Chicoutimi, Canada',
    period: {
      startDatetime: '2022-04',
      endDatetime: '2022-07',
    },
    duration: {
      en: 'approximately 3 months',
      fr: 'environ 3 mois',
    },
    technologies: ['Java', 'Python', 'Sockets', 'BeamNG.drive', 'BeepBeep 3'],
    affiliation: {
      logo: {
        src: '/assets/logos/logo_lif.png',
        alt: 'LIF logo',
      },
    },
  },
];

export const languageFacts: readonly LanguageFact[] = [
  {
    id: 'french',
    level: 'native',
  },
  {
    id: 'english',
    level: 'C1',
    certification: 'TOEIC 975',
  },
  {
    id: 'german',
    level: 'B1',
  },
];

export const skillGroupFacts: readonly SkillGroupFact[] = [
  {
    id: 'software-engineering',
    importance: 'primary',
    domains: [
      {
        id: 'backend-application-development',
        importance: 'primary',
        technologies: [
          { id: 'java', defaultName: 'Java', importance: 'primary' },
          { id: 'spring', defaultName: 'Spring', importance: 'primary' },
          { id: 'spring-boot', defaultName: 'Spring Boot', importance: 'primary' },
          { id: 'csharp', defaultName: 'C#', importance: 'primary' },
          { id: 'dotnet', defaultName: '.NET', importance: 'primary' },
          { id: 'typescript', defaultName: 'TypeScript', importance: 'primary' },
          { id: 'nodejs', defaultName: 'Node.js', importance: 'primary' },
          { id: 'express', defaultName: 'Express' },
        ],
      },
      {
        id: 'frontend-full-stack',
        importance: 'primary',
        technologies: [
          { id: 'angular', defaultName: 'Angular', importance: 'primary' },
          { id: 'typescript', defaultName: 'TypeScript', importance: 'primary' },
          { id: 'html', defaultName: 'HTML' },
          { id: 'css', defaultName: 'CSS' },
          { id: 'tailwind-css', defaultName: 'Tailwind CSS' },
          { id: 'daisyui', defaultName: 'daisyUI' },
        ],
      },
      {
        id: 'apis-integration',
        importance: 'primary',
        technologies: [
          { id: 'rest-apis', defaultName: 'REST' },
          { id: 'http', defaultName: 'HTTP' },
          { id: 'oauth2', defaultName: 'OAuth 2.0' },
          { id: 'sockets', defaultName: 'Sockets' },
        ],
      },
    ],
  },
  {
    id: 'data-databases',
    importance: 'professional-complementary',
    domains: [
      {
        id: 'data-platforms',
        importance: 'professional-complementary',
        technologies: [
          { id: 'sql', defaultName: 'SQL' },
          { id: 'postgresql', defaultName: 'PostgreSQL', importance: 'secondary' },
          { id: 'mysql', defaultName: 'MySQL', importance: 'secondary' },
          { id: 'sqlite', defaultName: 'SQLite', importance: 'secondary' },
          { id: 'oracle', defaultName: 'Oracle', importance: 'secondary' },
          { id: 'plsql', defaultName: 'PL/SQL', importance: 'secondary' },
        ],
      },
    ],
  },
  {
    id: 'enterprise-industrial',
    importance: 'professional-complementary',
    domains: [
      {
        id: 'sap-industrial',
        importance: 'professional-complementary',
        technologies: [
          { id: 'sap-s4hana', defaultName: 'SAP S/4HANA' },
          { id: 'abap', defaultName: 'ABAP' },
        ],
      },
      {
        id: 'microsoft-power-platform',
        importance: 'professional-complementary',
        technologies: [
          { id: 'power-apps', defaultName: 'Power Apps' },
          { id: 'power-automate', defaultName: 'Power Automate' },
          { id: 'dataverse', defaultName: 'Dataverse' },
          { id: 'power-platform', defaultName: 'Microsoft Power Platform' },
        ],
      },
      {
        id: 'dotnet-ecosystem',
        importance: 'secondary',
        technologies: [
          { id: 'aspnet-blazor', defaultName: 'ASP.NET Blazor' },
          { id: 'vbnet', defaultName: 'VB.NET' },
        ],
      },
    ],
  },
  {
    id: 'ai-assisted-engineering',
    importance: 'secondary',
    domains: [
      {
        id: 'developer-tooling-llms',
        importance: 'secondary',
        technologies: [
          { id: 'chatgpt', defaultName: 'ChatGPT' },
          { id: 'codex-coding-agents', defaultName: 'Codex / coding agents' },
          {
            id: 'mcp-concepts',
            defaultName: 'MCP concepts',
            importance: 'exploratory-historical',
          },
          {
            id: 'agentic-workflows',
            defaultName: 'Agentic workflows',
            importance: 'exploratory-historical',
          },
        ],
      },
    ],
  },
  {
    id: 'broader-software-experience',
    importance: 'secondary',
    domains: [
      {
        id: 'broader-programming-frameworks',
        importance: 'secondary',
        technologies: [
          { id: 'c', defaultName: 'C' },
          { id: 'cpp', defaultName: 'C++' },
          { id: 'python', defaultName: 'Python' },
          { id: 'django', defaultName: 'Django' },
          { id: 'php', defaultName: 'PHP' },
          { id: 'laravel', defaultName: 'Laravel' },
        ],
      },
      {
        id: 'game-mobile-academic',
        importance: 'secondary',
        technologies: [
          { id: 'android-java', defaultName: 'Android / Java' },
          { id: 'kotlin', defaultName: 'Kotlin' },
          { id: 'javafx', defaultName: 'JavaFX' },
          { id: 'swing', defaultName: 'Swing' },
          { id: 'unreal-engine', defaultName: 'Unreal Engine' },
          { id: 'blueprint', defaultName: 'Blueprint' },
          { id: 'matlab', defaultName: 'MATLAB' },
        ],
      },
    ],
  },
  {
    id: 'exploratory-historical',
    importance: 'exploratory-historical',
    domains: [
      {
        id: 'engineering-tools',
        importance: 'exploratory-historical',
        technologies: [
          { id: 'arduino', defaultName: 'Arduino' },
          { id: 'labview', defaultName: 'LabVIEW' },
          { id: 'flowcode', defaultName: 'Flowcode' },
          { id: 'latex', defaultName: 'LaTeX' },
          { id: 'uml', defaultName: 'UML' },
          { id: 'solidworks', defaultName: 'SolidWorks' },
          { id: 'solid-edge', defaultName: 'Solid Edge' },
        ],
      },
      {
        id: 'version-control',
        importance: 'secondary',
        technologies: [
          { id: 'git', defaultName: 'Git' },
          { id: 'perforce', defaultName: 'Perforce' },
          { id: 'subversion', defaultName: 'Apache Subversion' },
          { id: 'docker', defaultName: 'Docker' },
        ],
      },
      {
        id: 'operating-systems',
        importance: 'exploratory-historical',
        technologies: [
          { id: 'windows', defaultName: 'Windows' },
          { id: 'linux', defaultName: 'Linux' },
        ],
      },
    ],
  },
];

const educationCopy: Record<SupportedLocale, Record<EducationEntryId, LocalizedEducationCopy>> = {
  en: {
    ensisa: {
      institution: 'ENSISA',
      degree: 'Engineering Degree',
      field: 'Computer Science and Networks',
      status: 'Graduated',
      periodLabels: { start: '2022', end: '2025' },
      summary: 'Engineering graduate in Computer Science and Networks.',
    },
    'uqac-semester': {
      institution: 'Université du Québec à Chicoutimi',
      degree: 'Study semester abroad',
      field: 'Fourth semester of the DUT Computer Science',
      periodLabels: { single: '2022' },
      summary: 'International semester completed at UQAC in Canada.',
    },
    'iut-robert-schuman': {
      institution: 'IUT Robert Schuman',
      degree: 'DUT Computer Science',
      periodLabels: { start: '2020', end: '2022' },
      summary: 'The fourth semester was completed abroad at UQAC in Canada.',
    },
    'insa-lyon': {
      institution: 'INSA Lyon',
      degree: 'First year of the integrated engineering preparatory cycle',
      field: 'Engineering Sciences',
      periodLabels: { start: '2019', end: '2020' },
    },
    'lycee-louis-armand': {
      institution: 'Lycée Louis Armand',
      degree: 'Baccalauréat STI2D',
      field: 'Specialization: SIN',
      status: 'Mention Très Bien',
      periodLabels: { single: '2019' },
    },
  },
  fr: {
    ensisa: {
      institution: 'ENSISA',
      degree: "Diplôme d'Ingénieur",
      field: 'Informatique et Réseaux',
      status: 'Diplômé',
      periodLabels: { start: '2022', end: '2025' },
      summary: 'Ingénieur diplômé en Informatique et Réseaux.',
    },
    'uqac-semester': {
      institution: 'Université du Québec à Chicoutimi',
      degree: 'Semestre international',
      field: 'Quatrième semestre du DUT informatique',
      periodLabels: { single: '2022' },
      summary: "Semestre du DUT réalisé à l'UQAC, au Canada.",
    },
    'iut-robert-schuman': {
      institution: 'IUT Robert Schuman',
      degree: 'DUT Informatique',
      periodLabels: { start: '2020', end: '2022' },
      summary: "Le quatrième semestre a été effectué à l'UQAC, au Canada.",
    },
    'insa-lyon': {
      institution: 'INSA Lyon',
      degree: 'Première année du cycle préparatoire intégré',
      field: "Sciences de l'Ingénieur",
      periodLabels: { start: '2019', end: '2020' },
    },
    'lycee-louis-armand': {
      institution: 'Lycée Louis Armand',
      degree: 'Baccalauréat STI2D',
      field: 'Spécialité : SIN',
      status: 'Mention Très Bien',
      periodLabels: { single: '2019' },
    },
  },
};

const experienceCopy: Record<
  SupportedLocale,
  Record<ExperienceEntryId, LocalizedExperienceCopy>
> = {
  en: {
    'plansee-group-functions': {
      role: 'Software Developer',
      periodLabels: { label: 'Since 1 December 2025' },
      context:
        'Software developer role following an 11-week internship at Plansee in an industrial software environment.',
      responsibilities: [
        'Continued development of the Angular application initially rebuilt during the internship.',
        'Worked with SAP S/4HANA and ABAP on transaction functionality and HTTP/API integration, including a SAP transaction connected to an AI-team API used in powder-recipe calculations.',
        'Adapted an existing C#/.NET industrial measurement application after equipment was moved from Germany to Luxembourg.',
        'Built a Node.js/Express middleware around the Minew electronic-label API for SAP PI consumption, adding a cleaner REST-oriented layer with OAuth 2.0.',
      ],
    },
    'plansee-internship': {
      role: 'Software Developer Intern',
      periodLabels: { start: '1 July 2025', end: 'mid-September 2025' },
      context:
        'Internship focused on the complete redevelopment of an internal ordering website used by company departments.',
      responsibilities: [
        'Modernized the internal application with Angular and TypeScript.',
        'The work took place in a SAP department environment, without ABAP development during the internship.',
      ],
    },
    'bureau-veritas-laboratories': {
      role: 'Power Platform Developer Apprentice',
      periodLabels: { start: 'September 2023', end: '30 September 2025' },
      context:
        'Apprenticeship alternating roughly two to three weeks between engineering school and company work.',
      responsibilities: [
        "Developed an application to replace the laboratory's previous vehicle-fleet management system.",
        'Covered vehicle reception, laboratory workflow tracking, maceration room, test bench, and return process.',
        'Learned Microsoft Power Platform independently and built the implementation largely autonomously, without internal technical Power Platform mentorship.',
      ],
    },
    'groupe-ies': {
      role: '.NET Full-stack Developer Intern',
      periodLabels: { start: 'July 2023', end: 'August 2023' },
      responsibilities: [
        'Developed web features in C# with ASP.NET Blazor.',
        'Built and consumed REST APIs.',
        'Worked with existing database and service layers implemented in VB.NET/.NET.',
      ],
    },
    'lif-uqac-internship': {
      role: 'Software Developer Intern',
      periodLabels: { start: 'approximately April 2022', end: 'July 2022' },
      context:
        'Academic research-oriented internship on a two-person project connecting BeamNG.drive with BeepBeep 3, an Event Stream Processing engine developed at LIF.',
      responsibilities: [
        'Integrated communication between the BeamNG.drive vehicle simulator and BeepBeep 3.',
        'Worked on network/socket programming with Java and Python.',
      ],
    },
  },
  fr: {
    'plansee-group-functions': {
      role: 'Software Developer',
      periodLabels: { label: 'Depuis le 1 décembre 2025' },
      context:
        "Poste de développeur logiciel dans la continuité d'un stage de 11 semaines chez Plansee, dans un environnement logiciel industriel.",
      responsibilities: [
        "Poursuite du développement de l'application Angular initialement reconstruite pendant le stage.",
        "Travail avec SAP S/4HANA et ABAP sur des fonctionnalités de transaction et des intégrations HTTP/API, dont la connexion d'une transaction SAP à une API de l'équipe IA utilisée dans un flux de calcul de recette de poudre.",
        "Adaptation d'une application industrielle de mesure en C#/.NET après le transfert d'une machine d'Allemagne vers le Luxembourg.",
        "Développement d'un middleware Node.js/Express autour de l'API d'étiquettes électroniques Minew pour une consommation par SAP PI, avec une couche REST plus claire et OAuth 2.0.",
      ],
    },
    'plansee-internship': {
      role: 'Stagiaire développeur logiciel',
      periodLabels: { start: '1 juillet 2025', end: 'mi-septembre 2025' },
      context:
        "Stage centré sur la refonte complète d'un site interne de commande utilisé par les départements de l'entreprise.",
      responsibilities: [
        "Modernisation de l'application interne avec Angular et TypeScript.",
        'Travail réalisé dans un environnement de département SAP, sans développement ABAP pendant le stage.',
      ],
    },
    'bureau-veritas-laboratories': {
      role: 'Alternant Développeur Power Platform',
      periodLabels: { start: 'septembre 2023', end: '30 septembre 2025' },
      context:
        "Alternance avec des périodes d'environ deux à trois semaines entre l'école d'ingénieurs et l'entreprise.",
      responsibilities: [
        "Développement d'une application destinée à remplacer l'ancien système de gestion de flotte de véhicules du laboratoire.",
        'Suivi des véhicules depuis la réception jusqu’à la restitution, en passant par le flux laboratoire, la salle de macération et le banc de test.',
        'Apprentissage autonome de Microsoft Power Platform et réalisation largement indépendante, sans mentorat technique interne sur Power Platform.',
      ],
    },
    'groupe-ies': {
      role: 'Stagiaire développeur full-stack .NET',
      periodLabels: { start: 'juillet 2023', end: 'août 2023' },
      responsibilities: [
        'Développement web en C# avec ASP.NET Blazor.',
        "Développement et consommation d'API REST.",
        'Interaction avec des couches de base de données et de services existantes en VB.NET/.NET.',
      ],
    },
    'lif-uqac-internship': {
      role: 'Stagiaire développeur logiciel',
      periodLabels: { start: 'environ avril 2022', end: 'juillet 2022' },
      context:
        "Stage académique orienté recherche sur un projet en binôme reliant BeamNG.drive à BeepBeep 3, un moteur de traitement de flux d'événements développé au LIF.",
      responsibilities: [
        'Intégration de la communication entre le simulateur automobile BeamNG.drive et BeepBeep 3.',
        'Travail de programmation réseau/sockets avec Java et Python.',
      ],
    },
  },
};

const skillGroupCopy: Record<SupportedLocale, Record<SkillGroupId, LocalizedSkillGroupCopy>> = {
  en: {
    'software-engineering': {
      title: 'Software Engineering',
      summary: 'Primary backend and full-stack direction.',
    },
    'data-databases': {
      title: 'Data & Databases',
      summary: 'Relational data foundations and portfolio database work.',
    },
    'enterprise-industrial': {
      title: 'Enterprise & Industrial Software',
      summary: 'Professional exposure to SAP, Microsoft Power Platform, and industrial .NET work.',
    },
    'ai-assisted-engineering': {
      title: 'AI-assisted Engineering',
      summary: 'Practical use of LLM-based tools as software-development assistants.',
    },
    'broader-software-experience': {
      title: 'Broader Software Experience',
      summary:
        'Academic, personal, and earlier technologies kept visible with proportional weight.',
    },
    'exploratory-historical': {
      title: 'Exploratory & Historical',
      summary: 'Older, niche, and supporting engineering tools kept discoverable.',
    },
  },
  fr: {
    'software-engineering': {
      title: 'Développement logiciel',
      summary: 'Orientation principale backend et full-stack.',
    },
    'data-databases': {
      title: 'Données et bases de données',
      summary: 'Socle relationnel et usage de PostgreSQL sur le portfolio.',
    },
    'enterprise-industrial': {
      title: 'Logiciels entreprise et industriels',
      summary:
        'Expérience professionnelle autour de SAP, Microsoft Power Platform et .NET industriel.',
    },
    'ai-assisted-engineering': {
      title: 'Développement assisté par IA',
      summary: "Usage pratique d'outils basés sur les LLM comme assistants de développement.",
    },
    'broader-software-experience': {
      title: 'Expérience logicielle élargie',
      summary:
        'Technologies académiques, personnelles et plus anciennes gardées avec une importance mesurée.',
    },
    'exploratory-historical': {
      title: 'Exploratoire et historique',
      summary: "Outils d'ingénierie plus anciens, de niche ou de soutien, gardés accessibles.",
    },
  },
};

const skillDomainCopy: Record<SupportedLocale, Record<SkillDomainId, LocalizedSkillDomainCopy>> = {
  en: {
    'backend-application-development': { title: 'Backend & application development' },
    'frontend-full-stack': { title: 'Frontend & full-stack' },
    'apis-integration': { title: 'APIs & integration' },
    'data-platforms': { title: 'Relational and database platforms' },
    'sap-industrial': { title: 'SAP and industrial environments' },
    'microsoft-power-platform': { title: 'Microsoft Power Platform' },
    'dotnet-ecosystem': { title: '.NET ecosystem' },
    'developer-tooling-llms': { title: 'Developer tooling with LLMs' },
    'broader-programming-frameworks': { title: 'Languages and web frameworks' },
    'game-mobile-academic': { title: 'Game, desktop, and mobile work' },
    'engineering-tools': { title: 'Engineering and modelling tools' },
    'version-control': { title: 'Version control and delivery tools' },
    'operating-systems': { title: 'Operating systems' },
  },
  fr: {
    'backend-application-development': { title: "Backend et développement d'applications" },
    'frontend-full-stack': { title: 'Frontend et full-stack' },
    'apis-integration': { title: 'API et intégration' },
    'data-platforms': { title: 'Bases relationnelles et plateformes de données' },
    'sap-industrial': { title: 'SAP et environnements industriels' },
    'microsoft-power-platform': { title: 'Microsoft Power Platform' },
    'dotnet-ecosystem': { title: 'Écosystème .NET' },
    'developer-tooling-llms': { title: 'Outillage développeur avec LLM' },
    'broader-programming-frameworks': { title: 'Langages et frameworks web' },
    'game-mobile-academic': { title: 'Jeu, desktop et mobile' },
    'engineering-tools': { title: "Outils d'ingénierie et de modélisation" },
    'version-control': { title: 'Gestion de versions et livraison' },
    'operating-systems': { title: "Systèmes d'exploitation" },
  },
};

const skillTechnologyCopy: Record<
  SupportedLocale,
  Partial<Record<SkillTechnologyId, LocalizedSkillTechnologyCopy>>
> = {
  en: {
    chatgpt: {
      note: 'Used as a development assistant for software engineering and problem-solving workflows.',
    },
    'codex-coding-agents': {
      note: 'Practical use for coding-agent assisted repository work.',
    },
    'mcp-concepts': {
      note: 'Conceptual familiarity through tool and agent integrations.',
    },
    'agentic-workflows': {
      note: 'Early practical exploration for software-development workflows.',
    },
    postgresql: {
      note: "Used in this portfolio's Spring Boot / PostgreSQL project.",
    },
    kotlin: {
      note: 'Modern Android exploration.',
    },
  },
  fr: {
    'rest-apis': { name: 'REST' },
    chatgpt: {
      note: 'Utilisé comme assistant de développement logiciel et de résolution de problèmes.',
    },
    'codex-coding-agents': {
      name: 'Codex / agents de code',
      note: 'Usage pratique pour du travail de dépôt assisté par agent de code.',
    },
    'mcp-concepts': {
      name: 'Concepts MCP',
      note: "Familiarité conceptuelle avec des intégrations d'outils et d'agents.",
    },
    'agentic-workflows': {
      name: 'Flux de travail agentiques',
      note: 'Exploration pratique initiale appliquée au développement logiciel.',
    },
    postgresql: {
      note: 'Utilisé dans ce portfolio Spring Boot / PostgreSQL.',
    },
    kotlin: {
      note: 'Exploration Android moderne.',
    },
  },
};

const languageCopy: Record<SupportedLocale, Record<LanguageId, LocalizedLanguageCopy>> = {
  en: {
    french: { name: 'French', level: 'Native language' },
    english: { name: 'English' },
    german: { name: 'German' },
  },
  fr: {
    french: { name: 'Français', level: 'Langue maternelle' },
    english: { name: 'Anglais' },
    german: { name: 'Allemand' },
  },
};

export const portfolioContent: PortfolioContentByLocale = {
  en: {
    home: {
      hero: {
        name: 'Baptiste Wetterwald',
        role: 'Software Engineer',
        orientation: 'Backend & Full-stack',
        stackLine: 'Java / Spring · C# / .NET · TypeScript / Node.js · Angular',
        portraitAlt: 'Portrait of Baptiste Wetterwald',
      },
      introduction: [
        'Computer Science and Networks engineering graduate focused on software development, with a particular interest in backend systems, API-oriented architectures and full-stack applications.',
        'I work primarily with Java/Spring, C#/.NET and TypeScript/Node.js, while using Angular for frontend and full-stack applications. My experience also spans system integration, SAP, Microsoft Power Platform and industrial software environments.',
      ],
      primaryStackHeading: 'Primary technical directions',
      primaryStack: ['Java / Spring', 'C# / .NET', 'TypeScript / Node.js', 'Angular'],
      exploreHeading: 'Continue through the portfolio',
      exploreLinks: [
        {
          pageId: 'experience',
          label: 'Professional experience',
          description:
            'Software development roles, periods, contexts, and associated technologies.',
        },
        {
          pageId: 'education',
          label: 'Education',
          description: 'Engineering degree, DUT Computer Science, and international semester.',
        },
        {
          pageId: 'projects',
          label: 'Projects',
          description: 'Software project write-ups connected to the engineering stack.',
        },
      ],
      skillsHeading: 'Skills and technical domains',
      skillsIntroduction:
        'Technical domains are weighted around the current backend and full-stack direction, with broader knowledge kept in context.',
      languagesHeading: 'Languages',
      languagesIntroduction:
        'Language levels are shown as factual descriptors without artificial scores or progress bars.',
    },
    educationPage: {
      heading: 'Education',
      introduction:
        'Academic path in computer science and networks, from secondary studies to an engineering degree.',
      periodToLabel: 'to',
      officialWebsiteLabel: 'Official website',
      opensInNewTabLabel: 'opens in a new tab',
    },
    education: educationEntriesFor('en'),
    experiencePage: {
      heading: 'Professional experience',
      introduction:
        'Software development roles across internships, apprenticeship, and professional work.',
      periodToLabel: 'to',
      officialWebsiteLabel: 'Official website',
      opensInNewTabLabel: 'opens in a new tab',
    },
    experience: experienceEntriesFor('en'),
    skills: skillGroupsFor('en'),
    languages: languagesFor('en'),
  },
  fr: {
    home: {
      hero: {
        name: 'Baptiste Wetterwald',
        role: 'Ingénieur logiciel',
        orientation: 'Backend & full-stack',
        stackLine: 'Java / Spring · C# / .NET · TypeScript / Node.js · Angular',
        portraitAlt: 'Portrait de Baptiste Wetterwald',
      },
      introduction: [
        'Ingénieur diplômé en Informatique et Réseaux, orienté développement logiciel, avec un intérêt particulier pour les systèmes backend, les architectures orientées API et les applications full-stack.',
        "Je travaille principalement avec Java/Spring, C#/.NET et TypeScript/Node.js, tout en utilisant Angular pour les applications frontend et full-stack. Mon expérience couvre aussi l'intégration de systèmes, SAP, Microsoft Power Platform et les environnements logiciels industriels.",
      ],
      primaryStackHeading: 'Directions techniques principales',
      primaryStack: ['Java / Spring', 'C# / .NET', 'TypeScript / Node.js', 'Angular'],
      exploreHeading: 'Parcourir le portfolio',
      exploreLinks: [
        {
          pageId: 'experience',
          label: 'Expérience professionnelle',
          description:
            'Rôles en développement logiciel, périodes, contextes et technologies associées.',
        },
        {
          pageId: 'education',
          label: 'Formation',
          description: "Diplôme d'ingénieur, DUT informatique et semestre international.",
        },
        {
          pageId: 'projects',
          label: 'Projets',
          description: "Des présentations de projets logiciels reliées au socle d'ingénierie.",
        },
      ],
      skillsHeading: 'Compétences et domaines techniques',
      skillsIntroduction:
        "Les domaines techniques sont hiérarchisés autour de l'orientation backend et full-stack actuelle, avec un socle plus large remis en contexte.",
      languagesHeading: 'Langues',
      languagesIntroduction:
        'Les niveaux de langue sont présentés comme des faits, sans jauges ni scores artificiels.',
    },
    educationPage: {
      heading: 'Formation',
      introduction:
        "Parcours académique en informatique et réseaux, du secondaire au diplôme d'ingénieur.",
      periodToLabel: 'à',
      officialWebsiteLabel: 'Site officiel',
      opensInNewTabLabel: 'ouvre dans un nouvel onglet',
    },
    education: educationEntriesFor('fr'),
    experiencePage: {
      heading: 'Expérience professionnelle',
      introduction:
        'Expériences en développement logiciel à travers stages, alternance et activité professionnelle.',
      periodToLabel: 'à',
      officialWebsiteLabel: 'Site officiel',
      opensInNewTabLabel: 'ouvre dans un nouvel onglet',
    },
    experience: experienceEntriesFor('fr'),
    skills: skillGroupsFor('fr'),
    languages: languagesFor('fr'),
  },
};

export function portfolioContentFor(locale: SupportedLocale): LocalizedPortfolioContent {
  return portfolioContent[locale];
}

function educationEntriesFor(locale: SupportedLocale): readonly EducationEntry[] {
  return educationEntryFacts.map((fact) => {
    const copy = educationCopy[locale][fact.id];

    return {
      id: fact.id,
      institution: copy.institution,
      location: fact.location,
      degree: copy.degree,
      field: copy.field,
      status: copy.status,
      summary: copy.summary,
      period: periodFromFact(fact.period, copy.periodLabels),
      officialWebsiteUrl: fact.affiliation?.officialWebsiteUrl,
      logo: fact.affiliation?.logo,
    };
  });
}

function experienceEntriesFor(locale: SupportedLocale): readonly ExperienceEntry[] {
  return experienceEntryFacts.map((fact) => {
    const copy = experienceCopy[locale][fact.id];

    return {
      id: fact.id,
      organization: localizedOrganization(fact.organization, locale),
      location: fact.location,
      role: copy.role,
      period: periodFromFact(fact.period, copy.periodLabels) ?? {},
      duration: fact.duration?.[locale],
      context: copy.context,
      responsibilities: copy.responsibilities,
      technologies: fact.technologies,
      officialWebsiteUrl: fact.affiliation?.officialWebsiteUrl,
      logo: fact.affiliation?.logo,
    };
  });
}

function skillGroupsFor(locale: SupportedLocale): readonly SkillGroup[] {
  return skillGroupFacts.map((groupFact) => {
    const groupCopy = skillGroupCopy[locale][groupFact.id];

    return {
      id: groupFact.id,
      importance: groupFact.importance,
      title: groupCopy.title,
      summary: groupCopy.summary,
      domains: groupFact.domains.map((domainFact) => {
        const domainCopy = skillDomainCopy[locale][domainFact.id];

        return {
          id: domainFact.id,
          title: domainCopy.title,
          importance: domainFact.importance,
          technologies: domainFact.technologies.map((technologyFact) => {
            const technologyCopy = skillTechnologyCopy[locale][technologyFact.id];

            return {
              id: technologyFact.id,
              name: technologyCopy?.name ?? technologyFact.defaultName,
              note: technologyCopy?.note,
              importance: technologyFact.importance,
            };
          }),
        };
      }),
    };
  });
}

function languagesFor(locale: SupportedLocale): readonly Language[] {
  return languageFacts.map((fact) => {
    const copy = languageCopy[locale][fact.id];

    return {
      id: fact.id,
      name: copy.name,
      level: copy.level ?? fact.level,
      certification: fact.certification,
    };
  });
}

function periodFromFact(
  fact: PortfolioPeriodFact | undefined,
  labels: PeriodLabels | undefined,
): PortfolioPeriod | undefined {
  if (fact?.startDatetime && fact.endDatetime) {
    return {
      start: { datetime: fact.startDatetime, label: labels?.start ?? fact.startDatetime },
      end: { datetime: fact.endDatetime, label: labels?.end ?? fact.endDatetime },
      endPrefix: labels?.endPrefix,
    };
  }

  if (fact?.startDatetime) {
    return {
      start: { datetime: fact.startDatetime, label: labels?.start ?? fact.startDatetime },
      label: labels?.label,
    };
  }

  if (fact?.singleDatetime) {
    return {
      single: { datetime: fact.singleDatetime, label: labels?.single ?? fact.singleDatetime },
    };
  }

  return labels?.label ? { label: labels.label } : undefined;
}

function localizedOrganization(
  organization: ExperienceEntryFact['organization'],
  locale: SupportedLocale,
): string {
  return typeof organization === 'string'
    ? organization
    : (organization[locale] ?? organization.en ?? '');
}
