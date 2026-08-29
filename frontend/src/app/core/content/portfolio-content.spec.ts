import { supportedLocales } from '../i18n/locales';
import { translations } from '../i18n/translations';
import {
  educationEntryFacts,
  experienceEntryFacts,
  languageFacts,
  portfolioContent,
  portfolioContentFor,
  skillGroupFacts,
} from './portfolio-content';
import {
  ExperienceEntry,
  LocalizedPortfolioContent,
  SkillDomain,
  SkillGroup,
  SkillGroupFact,
  SkillImportance,
} from './portfolio-content.models';

describe('portfolioContent', () => {
  it('keeps education and experience entries aligned across locales', () => {
    expect(ids(portfolioContent.en.education)).toEqual([
      'ensisa',
      'uqac-semester',
      'iut-robert-schuman',
      'insa-lyon',
      'lycee-louis-armand',
    ]);
    expect(ids(portfolioContent.fr.education)).toEqual(ids(portfolioContent.en.education));

    expect(ids(portfolioContent.en.experience)).toEqual([
      'plansee-group-functions',
      'plansee-internship',
      'bureau-veritas-laboratories',
      'groupe-ies',
      'lif-uqac-internship',
    ]);
    expect(ids(portfolioContent.fr.experience)).toEqual(ids(portfolioContent.en.experience));
  });

  it('keeps shared timeline facts, technologies, locations, and logos locale-neutral', () => {
    expect(ids(educationEntryFacts)).toEqual(ids(portfolioContent.en.education));
    expect(ids(experienceEntryFacts)).toEqual(ids(portfolioContent.en.experience));
    expect(periodDatetimes(portfolioContent.en.education)).toEqual(
      periodDatetimes(portfolioContent.fr.education),
    );
    expect(periodDatetimes(portfolioContent.en.experience)).toEqual(
      periodDatetimes(portfolioContent.fr.experience),
    );
    expect(technologyLists(portfolioContent.en.experience)).toEqual(
      technologyLists(portfolioContent.fr.experience),
    );
    expect(locationMap(portfolioContent.en.education)).toEqual(
      locationMap(portfolioContent.fr.education),
    );
    expect(locationMap(portfolioContent.en.experience)).toEqual(
      locationMap(portfolioContent.fr.experience),
    );
    expect(logoSources(portfolioContent.en.education)).toEqual(
      logoSources(portfolioContent.fr.education),
    );
    expect(logoSources(portfolioContent.en.experience)).toEqual(
      logoSources(portfolioContent.fr.experience),
    );
  });

  it('renders the full education inventory without fabricating missing INSA assets', () => {
    expect(portfolioContent.en.education).toEqual([
      expect.objectContaining({
        id: 'ensisa',
        institution: 'ENSISA',
        location: 'Mulhouse, France',
        degree: 'Engineering Degree',
        field: 'Computer Science and Networks',
        status: 'Graduated',
        logo: expect.objectContaining({ src: '/assets/logos/logo_ensisa.svg' }),
      }),
      expect.objectContaining({
        id: 'uqac-semester',
        institution: 'Université du Québec à Chicoutimi',
        location: 'Chicoutimi, Canada',
        degree: 'Study semester abroad',
        logo: expect.objectContaining({ src: '/assets/logos/logo_uqac.png' }),
      }),
      expect.objectContaining({
        id: 'iut-robert-schuman',
        institution: 'IUT Robert Schuman',
        location: 'Illkirch, France',
        degree: 'DUT Computer Science',
        logo: expect.objectContaining({ src: '/assets/logos/logo_iut_robert_schuman.png' }),
      }),
      expect.objectContaining({
        id: 'insa-lyon',
        institution: 'INSA Lyon',
        location: 'Lyon, France',
        degree: 'First year of the integrated engineering preparatory cycle',
        field: 'Engineering Sciences',
        logo: undefined,
        officialWebsiteUrl: undefined,
      }),
      expect.objectContaining({
        id: 'lycee-louis-armand',
        institution: 'Lycée Louis Armand',
        location: 'Mulhouse, France',
        degree: 'Baccalauréat STI2D',
        field: 'Specialization: SIN',
        status: 'Mention Très Bien',
        logo: expect.objectContaining({
          src: '/assets/logos/logo_lycée_louis_armand.jpeg',
        }),
        officialWebsiteUrl: undefined,
      }),
    ]);
  });

  it('keeps Plansee employment and internship separate with the correct technology boundary', () => {
    const [employment, internship] = portfolioContent.en.experience;

    expect(employment).toMatchObject({
      id: 'plansee-group-functions',
      organization: 'Plansee Group Functions',
      role: 'Software Developer',
      location: 'Mamer, Luxembourg',
      duration: 'Planned end: end of November 2026',
    });
    expect(employment.period.start?.datetime).toBe('2025-12-01');
    expect(employment.period.label).toBe('Since 1 December 2025');
    expect(employment.technologies).toEqual([
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
    ]);
    expect(employment.responsibilities).toHaveLength(4);
    expect(employment.responsibilities?.[1]).toContain('powder-recipe calculations');

    expect(internship).toMatchObject({
      id: 'plansee-internship',
      organization: 'Plansee Group Functions',
      role: 'Software Developer Intern',
      duration: '11 weeks',
    });
    expect(internship.period.start?.datetime).toBe('2025-07-01');
    expect(internship.period.end?.datetime).toBe('2025-09');
    expect(internship.technologies).toEqual(['Angular', 'TypeScript']);
    expect(stringifyContent(internship)).toContain('without ABAP development');
    expect(stringifyContent(internship)).not.toContain('DaisyUI');
  });

  it('keeps Bureau Veritas, Groupe IES, and LIF facts precise and scoped', () => {
    const experienceById = byId(portfolioContent.en.experience);
    const bureauVeritas = experienceById.get('bureau-veritas-laboratories');
    const groupeIes = experienceById.get('groupe-ies');
    const lif = experienceById.get('lif-uqac-internship');

    expect(bureauVeritas).toMatchObject({
      organization: 'Bureau Veritas Laboratories',
      role: 'Power Platform Developer Apprentice',
      location: 'Sausheim, France',
      technologies: [
        'Microsoft Power Apps',
        'Power Automate',
        'Dataverse',
        'Microsoft Power Platform',
      ],
    });
    expect(bureauVeritas?.period.start?.datetime).toBe('2023-09');
    expect(bureauVeritas?.period.end?.datetime).toBe('2025-09-30');
    expect(bureauVeritas?.responsibilities?.[2]).toContain(
      'without internal technical Power Platform mentorship',
    );
    expect(stringifyContent(bureauVeritas)).not.toContain('PCF');
    expect(stringifyContent(bureauVeritas)).not.toContain('Custom Connector');

    expect(groupeIes).toMatchObject({
      organization: 'Groupe IES',
      role: '.NET Full-stack Developer Intern',
      location: 'Colmar, France',
      duration: '2 months',
      technologies: ['C#', '.NET', 'ASP.NET Blazor', 'VB.NET', 'REST'],
    });
    expect(groupeIes?.period.start?.datetime).toBe('2023-07');
    expect(groupeIes?.period.end?.datetime).toBe('2023-08');

    expect(lif).toMatchObject({
      organization: 'Laboratoire d’Informatique Formelle (LIF), UQAC',
      role: 'Software Developer Intern',
      location: 'Chicoutimi, Canada',
      duration: 'approximately 3 months',
      technologies: ['Java', 'Python', 'Sockets', 'BeamNG.drive', 'BeepBeep 3'],
      logo: expect.objectContaining({ src: '/assets/logos/logo_lif.png' }),
      officialWebsiteUrl: undefined,
    });
    expect(lif?.period.start?.datetime).toBe('2022-04');
    expect(lif?.period.end?.datetime).toBe('2022-07');
  });

  it('renders languages as structured bilingual profile content', () => {
    expect(ids(languageFacts)).toEqual(['french', 'english', 'german']);
    expect(portfolioContent.en.languages).toEqual([
      { id: 'french', name: 'French', level: 'Native language', certification: undefined },
      { id: 'english', name: 'English', level: 'C1', certification: 'TOEIC 975' },
      { id: 'german', name: 'German', level: 'B1', certification: undefined },
    ]);
    expect(portfolioContent.fr.languages).toEqual([
      { id: 'french', name: 'Français', level: 'Langue maternelle', certification: undefined },
      { id: 'english', name: 'Anglais', level: 'C1', certification: 'TOEIC 975' },
      { id: 'german', name: 'Allemand', level: 'B1', certification: undefined },
    ]);
  });

  it('prioritizes the primary technology hierarchy without proficiency metrics', () => {
    for (const locale of supportedLocales) {
      const content = portfolioContentFor(locale);
      const text = stringifyContent(content);

      expect(content.home.primaryStack).toEqual([
        'Java / Spring',
        'C# / .NET',
        'TypeScript / Node.js',
        'Angular',
      ]);
      expect(content.home.hero.stackLine).toContain('Angular');
      expect(text).not.toMatch(/\b\d{1,3}%\b/);
      expect(text).not.toContain('95%');
      expect(text).not.toContain('87%');
      expect(text).not.toContain('Microsoft Office');
      expect(text).not.toContain('PIX');
    }
  });

  it('classifies skill domains by portfolio positioning importance', () => {
    const content = portfolioContent.en;
    const domains = skillDomains(content);
    const importanceByGroup = new Map(content.skills.map((group) => [group.id, group.importance]));
    const importanceByDomain = new Map(domains.map((domain) => [domain.id, domain.importance]));

    expect(importanceByGroup.get('software-engineering')).toBe('primary');
    expect(importanceByGroup.get('data-databases')).toBe('professional-complementary');
    expect(importanceByGroup.get('enterprise-industrial')).toBe('professional-complementary');
    expect(importanceByGroup.get('ai-assisted-engineering')).toBe('secondary');
    expect(importanceByGroup.get('broader-software-experience')).toBe('secondary');
    expect(importanceByGroup.get('exploratory-historical')).toBe('exploratory-historical');
    expect(importanceByDomain.get('backend-application-development')).toBe('primary');
    expect(importanceByDomain.get('frontend-full-stack')).toBe('primary');
    expect(importanceByDomain.get('apis-integration')).toBe('primary');
    expect(importanceByDomain.get('sap-industrial')).toBe('professional-complementary');
    expect(importanceByDomain.get('microsoft-power-platform')).toBe('professional-complementary');
    expect(importanceByDomain.get('developer-tooling-llms')).toBe('secondary');
    expect(importanceByDomain.get('engineering-tools')).toBe('exploratory-historical');
    expect(new Set(content.skills.map((group) => group.importance))).toEqual(
      new Set<SkillImportance>([
        'primary',
        'professional-complementary',
        'secondary',
        'exploratory-historical',
      ]),
    );
    expect(skillTechnology(content, 'mcp-concepts')?.importance).toBe('exploratory-historical');
    expect(skillTechnology(content, 'agentic-workflows')?.importance).toBe(
      'exploratory-historical',
    );
    expect(skillTechnology(content, 'sockets')?.name).toBe('Sockets');
  });

  it('builds localized skills from shared locale-neutral topology facts', () => {
    const expectedTopology = skillFactTopology(skillGroupFacts);

    expect(skillTopology(portfolioContent.en.skills)).toEqual(expectedTopology);
    expect(skillTopology(portfolioContent.fr.skills)).toEqual(expectedTopology);
    expect(portfolioContent.fr.skills[0].title).not.toBe(portfolioContent.en.skills[0].title);
    expect(skillTechnology(portfolioContent.en, 'sockets')?.name).toBe('Sockets');
    expect(skillTechnology(portfolioContent.fr, 'sockets')?.name).toBe('Sockets');
    expect(skillTechnology(portfolioContent.fr, 'codex-coding-agents')?.name).toBe(
      'Codex / agents de code',
    );
  });

  it('represents AI-assisted engineering without overstating the role', () => {
    const content = portfolioContent.en;
    const aiGroup = content.skills.find((group) => group.id === 'ai-assisted-engineering');
    const text = stringifyContent(content);

    expect(aiGroup?.summary).toContain('software-development assistants');
    expect(aiGroup?.domains[0]?.importance).toBe('secondary');
    expect(text).toContain('AI-assisted Engineering');
    expect(text).toContain('ChatGPT');
    expect(text).toContain('Codex / coding agents');
    expect(text).toContain('MCP concepts');
    expect(text).not.toContain('AI Engineer');
    expect(text).not.toContain('ML Engineer');
    expect(text).not.toContain('LLM Engineer');
    expect(text.toLowerCase()).not.toContain('expert');
  });

  it('describes PostgreSQL as portfolio project experience only', () => {
    const postgres = skillTechnology(portfolioContent.en, 'postgresql');

    expect(postgres?.note).toContain('portfolio');
    expect(postgres?.note).toContain('Spring Boot / PostgreSQL');
    expect(JSON.stringify(portfolioContent.en.experience)).not.toContain('PostgreSQL');
  });

  it('keeps visitor-facing content free of internal or unapproved wording', () => {
    const renderedContent =
      stringifyContent(portfolioContent.en) +
      stringifyContent(portfolioContent.fr) +
      JSON.stringify(translations);

    expect(renderedContent).not.toMatch(
      /confirmed|approved content|owner-approved|awaiting confirmation|before later|role detail is not yet available|content pending|TODO|temporary routing placeholder/i,
    );
    expect(renderedContent).not.toContain('P-FWWV9GV6');
    expect(renderedContent).not.toContain('father');
    expect(renderedContent).not.toContain('salary');
  });
});

function ids(entries: readonly { id: string }[]): string[] {
  return entries.map((entry) => entry.id);
}

function stringifyContent(content: unknown): string {
  return JSON.stringify(content);
}

function periodDatetimes(
  entries: readonly {
    period?: {
      start?: { datetime: string };
      end?: { datetime: string };
      single?: { datetime: string };
    };
  }[],
): string[][] {
  return entries.map((entry) =>
    [
      entry.period?.start?.datetime,
      entry.period?.end?.datetime,
      entry.period?.single?.datetime,
    ].filter((datetime): datetime is string => Boolean(datetime)),
  );
}

function technologyLists(entries: readonly ExperienceEntry[]): (readonly string[] | undefined)[] {
  return entries.map((entry) => entry.technologies);
}

function locationMap(entries: readonly { id: string; location?: string }[]) {
  return Object.fromEntries(entries.map((entry) => [entry.id, entry.location]));
}

function logoSources(entries: readonly { id: string; logo?: { src: string } }[]) {
  return Object.fromEntries(entries.map((entry) => [entry.id, entry.logo?.src]));
}

function byId(entries: readonly ExperienceEntry[]): Map<string, ExperienceEntry> {
  return new Map(entries.map((entry) => [entry.id, entry]));
}

function skillDomains(content: LocalizedPortfolioContent): readonly SkillDomain[] {
  return content.skills.flatMap((group) => group.domains);
}

function skillTechnology(content: LocalizedPortfolioContent, id: string) {
  return skillDomains(content)
    .flatMap((domain) => domain.technologies)
    .find((technology) => technology.id === id);
}

function skillTopology(groups: readonly SkillGroup[]) {
  return groups.map((group) => ({
    id: group.id,
    importance: group.importance,
    domains: group.domains.map((domain) => ({
      id: domain.id,
      importance: domain.importance,
      technologies: domain.technologies.map((technology) => ({
        id: technology.id,
        importance: technology.importance ?? null,
      })),
    })),
  }));
}

function skillFactTopology(facts: readonly SkillGroupFact[]) {
  return facts.map((group) => ({
    id: group.id,
    importance: group.importance,
    domains: group.domains.map((domain) => ({
      id: domain.id,
      importance: domain.importance,
      technologies: domain.technologies.map((technology) => ({
        id: technology.id,
        importance: technology.importance ?? null,
      })),
    })),
  }));
}
