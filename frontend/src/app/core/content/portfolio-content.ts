import { SupportedLocale } from '../i18n/locales';
import {
  EducationEntry,
  EducationEntryFact,
  EducationEntryId,
  ExperienceEntry,
  ExperienceEntryFact,
  ExperienceEntryId,
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

export const educationEntryFacts: readonly EducationEntryFact[] = [
  {
    id: 'ensisa',
    period: {
      startDatetime: '2022',
      endDatetime: '2025',
    },
  },
  {
    id: 'iut-robert-schuman',
    period: {
      startDatetime: '2020',
      endDatetime: '2022',
    },
  },
  {
    id: 'uqac-semester',
  },
];

export const experienceEntryFacts: readonly ExperienceEntryFact[] = [
  {
    id: 'plansee-group-functions',
    organization: 'Plansee Group Functions',
    period: {
      startDatetime: '2025-12',
      endDatetime: '2026-11',
    },
  },
  {
    id: 'plansee-internship',
    organization: 'Plansee',
    period: {
      singleDatetime: '2025',
    },
    duration: {
      en: '11 weeks',
      fr: '11 semaines',
    },
    technologies: ['Angular', 'DaisyUI'],
  },
  {
    id: 'bureau-veritas-laboratories',
    organization: {
      en: 'Bureau Veritas Laboratories',
      fr: 'Bureau Veritas Laboratoires',
    },
    period: {
      startDatetime: '2023',
      endDatetime: '2025',
    },
    technologies: ['Power Platform', 'Power Apps', 'Power Automate', 'Dataverse', 'Microsoft 365'],
  },
  {
    id: 'groupe-ies',
    organization: 'Groupe IES',
    period: {
      singleDatetime: '2023',
    },
    technologies: ['.NET'],
  },
  {
    id: 'uqac-internship',
    organization: 'UQAC',
    period: {
      singleDatetime: '2022',
    },
  },
];

export const skillGroupFacts: readonly SkillGroupFact[] = [
  {
    id: 'software-engineering',
    importance: 'primary',
    domains: [
      {
        id: 'backend',
        importance: 'primary',
        technologies: [
          { id: 'java', defaultName: 'Java' },
          { id: 'spring', defaultName: 'Spring' },
          { id: 'csharp', defaultName: 'C#' },
          { id: 'dotnet', defaultName: '.NET' },
          { id: 'typescript', defaultName: 'TypeScript' },
          { id: 'nodejs', defaultName: 'Node.js' },
          { id: 'rest-apis', defaultName: 'REST APIs' },
        ],
      },
      {
        id: 'frontend',
        importance: 'secondary',
        technologies: [
          { id: 'angular', defaultName: 'Angular', importance: 'primary' },
          { id: 'typescript', defaultName: 'TypeScript', importance: 'primary' },
          { id: 'tailwind-css', defaultName: 'Tailwind CSS' },
          { id: 'daisyui', defaultName: 'DaisyUI' },
        ],
      },
    ],
  },
  {
    id: 'microsoft-enterprise',
    importance: 'professional-complementary',
    domains: [
      {
        id: 'microsoft-ecosystem',
        importance: 'professional-complementary',
        technologies: [
          { id: 'power-platform', defaultName: 'Power Platform' },
          { id: 'power-apps', defaultName: 'Power Apps' },
          { id: 'power-automate', defaultName: 'Power Automate' },
          { id: 'dataverse', defaultName: 'Dataverse' },
          { id: 'microsoft-365', defaultName: 'Microsoft 365' },
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
    id: 'data-databases',
    importance: 'professional-complementary',
    domains: [
      {
        id: 'data-platforms',
        importance: 'professional-complementary',
        technologies: [
          { id: 'sql', defaultName: 'SQL' },
          { id: 'relational-databases', defaultName: 'Relational databases' },
          { id: 'oracle', defaultName: 'Oracle', importance: 'secondary' },
          { id: 'sql-server', defaultName: 'SQL Server', importance: 'secondary' },
          { id: 'sqlite', defaultName: 'SQLite', importance: 'secondary' },
          { id: 'sap-s4hana', defaultName: 'SAP S/4HANA', importance: 'secondary' },
          { id: 'mongodb', defaultName: 'MongoDB', importance: 'secondary' },
          { id: 'postgresql', defaultName: 'PostgreSQL', importance: 'secondary' },
        ],
      },
    ],
  },
  {
    id: 'engineering-infrastructure',
    importance: 'secondary',
    domains: [
      {
        id: 'project-api-foundations',
        importance: 'secondary',
        technologies: [
          { id: 'git', defaultName: 'Git' },
          { id: 'docker', defaultName: 'Docker' },
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
    'iut-robert-schuman': {
      institution: 'IUT Robert Schuman',
      degree: 'DUT Computer Science',
      periodLabels: { start: '2020', end: '2022' },
    },
    'uqac-semester': {
      institution: 'Université du Québec à Chicoutimi',
      degree: 'International semester',
      field: 'Computer Science studies during the DUT',
      periodLabels: { label: 'During the DUT' },
    },
  },
  fr: {
    ensisa: {
      institution: 'ENSISA',
      degree: "Diplôme d'ingénieur",
      field: 'Informatique et réseaux',
      status: 'Diplômé',
      periodLabels: { start: '2022', end: '2025' },
      summary: 'Ingénieur diplômé en informatique et réseaux.',
    },
    'iut-robert-schuman': {
      institution: 'IUT Robert Schuman',
      degree: 'DUT informatique',
      periodLabels: { start: '2020', end: '2022' },
    },
    'uqac-semester': {
      institution: 'Université du Québec à Chicoutimi',
      degree: 'Semestre international',
      field: 'Études informatiques pendant le DUT',
      periodLabels: { label: 'Pendant le DUT' },
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
      periodLabels: {
        start: 'December 2025',
        end: 'November 2026',
        endPrefix: 'planned end ',
      },
      context: 'Software Developer position following the previous Plansee internship.',
    },
    'plansee-internship': {
      role: 'Software Engineering Internship',
      periodLabels: { single: 'Summer 2025' },
      context: 'Internship focused on redesigning an internal e-commerce-like catalogue/site.',
      responsibilities: [
        'Redesign of an internal catalogue/site with Angular and DaisyUI.',
        'The work was carried out in an SAP-related team and did not include ABAP development.',
      ],
    },
    'bureau-veritas-laboratories': {
      role: 'Power Platform Developer Apprentice',
      periodLabels: { start: '2023', end: '2025' },
      context:
        'Apprenticeship focused on enterprise and business applications in the Microsoft ecosystem.',
    },
    'groupe-ies': {
      role: 'Full Stack .NET Developer Intern',
      periodLabels: { single: '2023' },
    },
    'uqac-internship': {
      role: 'Software Developer Intern',
      periodLabels: { single: '2022' },
    },
  },
  fr: {
    'plansee-group-functions': {
      role: 'Software Developer',
      periodLabels: {
        start: 'décembre 2025',
        end: 'novembre 2026',
        endPrefix: 'fin prévue ',
      },
      context: 'Poste de Software Developer dans la continuité du stage Plansee précédent.',
    },
    'plansee-internship': {
      role: 'Stage en développement logiciel',
      periodLabels: { single: 'été 2025' },
      context: "Stage centré sur la refonte d'un catalogue/site interne de type e-commerce.",
      responsibilities: [
        "Refonte d'un catalogue/site interne avec Angular et DaisyUI.",
        'Travail réalisé dans une équipe liée à SAP, sans développement ABAP.',
      ],
    },
    'bureau-veritas-laboratories': {
      role: 'Apprenti développeur Power Platform',
      periodLabels: { start: '2023', end: '2025' },
      context:
        "Alternance orientée applications d'entreprise et métier dans l'écosystème Microsoft.",
    },
    'groupe-ies': {
      role: 'Stagiaire développeur full stack .NET',
      periodLabels: { single: '2023' },
    },
    'uqac-internship': {
      role: 'Stagiaire développeur logiciel',
      periodLabels: { single: '2022' },
    },
  },
};

const skillGroupCopy: Record<SupportedLocale, Record<SkillGroupId, LocalizedSkillGroupCopy>> = {
  en: {
    'software-engineering': {
      title: 'Software Engineering',
      summary: 'Core backend and full-stack direction.',
    },
    'microsoft-enterprise': {
      title: 'Microsoft / Enterprise Applications',
      summary: 'Complementary enterprise application experience.',
    },
    'ai-assisted-engineering': {
      title: 'AI-assisted Engineering',
      summary: 'Practical use of LLM-based developer tools in software engineering workflows.',
    },
    'data-databases': {
      title: 'Data & Databases',
    },
    'engineering-infrastructure': {
      title: 'Engineering / Infrastructure',
    },
  },
  fr: {
    'software-engineering': {
      title: 'Développement logiciel',
      summary: 'Orientation principale backend et full-stack.',
    },
    'microsoft-enterprise': {
      title: 'Applications Microsoft / entreprise',
      summary: "Expérience complémentaire en applications d'entreprise.",
    },
    'ai-assisted-engineering': {
      title: 'Développement assisté par IA',
      summary:
        "Usage pratique d'outils basés sur les LLM dans les flux de travail de développement logiciel.",
    },
    'data-databases': {
      title: 'Données et bases de données',
    },
    'engineering-infrastructure': {
      title: 'Ingénierie / infrastructure',
    },
  },
};

const skillDomainCopy: Record<SupportedLocale, Record<SkillDomainId, LocalizedSkillDomainCopy>> = {
  en: {
    backend: { title: 'Backend' },
    frontend: { title: 'Frontend' },
    'microsoft-ecosystem': { title: 'Microsoft ecosystem' },
    'developer-tooling-llms': { title: 'Developer tooling with LLMs' },
    'data-platforms': { title: 'Relational and data platforms' },
    'project-api-foundations': { title: 'Project foundations' },
  },
  fr: {
    backend: { title: 'Backend' },
    frontend: { title: 'Frontend' },
    'microsoft-ecosystem': { title: 'Écosystème Microsoft' },
    'developer-tooling-llms': { title: 'Outillage développeur avec LLM' },
    'data-platforms': { title: 'Bases relationnelles et plateformes de données' },
    'project-api-foundations': { title: 'Fondations projet' },
  },
};

const skillTechnologyCopy: Record<
  SupportedLocale,
  Partial<Record<SkillTechnologyId, LocalizedSkillTechnologyCopy>>
> = {
  en: {
    chatgpt: {
      note: 'Used as part of software-development and problem-solving workflows.',
    },
    'codex-coding-agents': {
      note: 'Practical use for development workflows.',
    },
    'mcp-concepts': {
      note: 'Familiarity and early exploration.',
    },
    'agentic-workflows': {
      note: 'Early exploration of development workflows.',
    },
    postgresql: {
      note: "Used in this portfolio's Spring Boot / PostgreSQL project.",
    },
  },
  fr: {
    'rest-apis': { name: 'API REST' },
    'relational-databases': { name: 'Bases de données relationnelles' },
    chatgpt: {
      note: 'Utilisé dans des flux de travail de développement logiciel et de résolution de problèmes.',
    },
    'codex-coding-agents': {
      name: 'Codex / agents de code',
      note: 'Usage pratique dans des flux de travail de développement.',
    },
    'mcp-concepts': {
      name: 'Concepts MCP',
      note: 'Familiarité et exploration initiale.',
    },
    'agentic-workflows': {
      name: 'Flux de travail agentiques',
      note: 'Exploration initiale appliquée au développement.',
    },
    postgresql: {
      note: 'Utilisé dans ce portfolio Spring Boot / PostgreSQL.',
    },
  },
};

export const portfolioContent: PortfolioContentByLocale = {
  en: {
    home: {
      hero: {
        name: 'Baptiste Wetterwald',
        role: 'Software Engineer',
        orientation: 'Backend & Full-stack',
        stackLine: 'Java / Spring · C# / .NET · TypeScript / Node.js',
      },
      introduction: [
        'Engineering graduate in Computer Science and Networks, oriented toward backend and full-stack software engineering.',
        'The technical direction spans Java / Spring, C# / .NET, TypeScript / Node.js, Angular, and enterprise applications in the Microsoft ecosystem.',
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
    },
    educationPage: {
      heading: 'Education',
      introduction:
        'Academic path in computer science and networks, from DUT studies to an engineering degree.',
      periodToLabel: 'to',
    },
    education: educationEntriesFor('en'),
    experiencePage: {
      heading: 'Professional experience',
      introduction:
        'Software development roles across internships, apprenticeship, and professional work.',
      periodToLabel: 'to',
    },
    experience: experienceEntriesFor('en'),
    skills: skillGroupsFor('en'),
  },
  fr: {
    home: {
      hero: {
        name: 'Baptiste Wetterwald',
        role: 'Ingénieur logiciel',
        orientation: 'Backend & full-stack',
        stackLine: 'Java / Spring · C# / .NET · TypeScript / Node.js',
      },
      introduction: [
        'Ingénieur diplômé en informatique et réseaux, orienté backend et full-stack.',
        "Le parcours technique couvre Java / Spring, C# / .NET, TypeScript / Node.js, Angular et les applications d'entreprise dans l'écosystème Microsoft.",
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
    },
    educationPage: {
      heading: 'Formation',
      introduction:
        "Parcours académique en informatique et réseaux, du DUT au diplôme d'ingénieur.",
      periodToLabel: 'à',
    },
    education: educationEntriesFor('fr'),
    experiencePage: {
      heading: 'Expérience professionnelle',
      introduction:
        'Expériences en développement logiciel à travers stages, alternance et activité professionnelle.',
      periodToLabel: 'à',
    },
    experience: experienceEntriesFor('fr'),
    skills: skillGroupsFor('fr'),
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
      degree: copy.degree,
      field: copy.field,
      status: copy.status,
      summary: copy.summary,
      period: periodFromFact(fact.period, copy.periodLabels),
    };
  });
}

function experienceEntriesFor(locale: SupportedLocale): readonly ExperienceEntry[] {
  return experienceEntryFacts.map((fact) => {
    const copy = experienceCopy[locale][fact.id];

    return {
      id: fact.id,
      organization: localizedOrganization(fact.organization, locale),
      role: copy.role,
      period: periodFromFact(fact.period, copy.periodLabels) ?? {},
      duration: fact.duration?.[locale],
      context: copy.context,
      responsibilities: copy.responsibilities,
      technologies: fact.technologies,
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
