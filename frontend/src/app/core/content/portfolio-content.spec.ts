import { supportedLocales } from '../i18n/locales';
import { translations } from '../i18n/translations';
import {
  educationEntryFacts,
  experienceEntryFacts,
  portfolioContent,
  portfolioContentFor,
  skillGroupFacts,
} from './portfolio-content';
import {
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
      'iut-robert-schuman',
      'uqac-semester',
    ]);
    expect(ids(portfolioContent.fr.education)).toEqual(ids(portfolioContent.en.education));

    expect(ids(portfolioContent.en.experience)).toEqual([
      'plansee-group-functions',
      'plansee-internship',
      'bureau-veritas-laboratories',
      'groupe-ies',
      'uqac-internship',
    ]);
    expect(ids(portfolioContent.fr.experience)).toEqual(ids(portfolioContent.en.experience));
  });

  it('keeps important locale-neutral timeline facts in one source', () => {
    expect(ids(educationEntryFacts)).toEqual(ids(portfolioContent.en.education));
    expect(ids(experienceEntryFacts)).toEqual(ids(portfolioContent.en.experience));
    expect(ids(portfolioContent.fr.education)).toEqual(ids(educationEntryFacts));
    expect(ids(portfolioContent.fr.experience)).toEqual(ids(experienceEntryFacts));

    expect(periodDatetimes(portfolioContent.en.experience)).toEqual(
      periodDatetimes(portfolioContent.fr.experience),
    );
    expect(portfolioContent.en.experience[1].technologies).toEqual(
      portfolioContent.fr.experience[1].technologies,
    );
  });

  it('keeps optional timeline affiliation metadata locale-neutral and non-blocking', () => {
    expect(portfolioContent.en.education[0]).toMatchObject({
      id: 'ensisa',
      officialWebsiteUrl: 'https://www.ensisa.uha.fr/',
      logo: {
        src: '/assets/logos/logo_ensisa.svg',
      },
    });
    expect(portfolioContent.fr.education[0].officialWebsiteUrl).toBe(
      portfolioContent.en.education[0].officialWebsiteUrl,
    );
    expect(logoSources(portfolioContent.en.education)).toEqual({
      ensisa: '/assets/logos/logo_ensisa.svg',
      'iut-robert-schuman': '/assets/logos/logo_iut_robert_schuman.png',
      'uqac-semester': '/assets/logos/logo_uqac.png',
    });
    expect(logoSources(portfolioContent.fr.education)).toEqual(
      logoSources(portfolioContent.en.education),
    );
    expect(logoSources(portfolioContent.en.education)).toEqual(
      factLogoSources(educationEntryFacts),
    );
    expect(portfolioContent.en.experience[0]).toMatchObject({
      id: 'plansee-group-functions',
      officialWebsiteUrl: 'https://plansee-group.com/en',
      logo: {
        src: '/assets/logos/logo_plansee.png',
      },
    });
    expect(logoSources(portfolioContent.en.experience)).toEqual({
      'plansee-group-functions': '/assets/logos/logo_plansee.png',
      'plansee-internship': '/assets/logos/logo_plansee.png',
      'bureau-veritas-laboratories': '/assets/logos/logo_bureau_veritas.svg',
      'groupe-ies': '/assets/logos/logo_groupe_ies.jpeg',
      'uqac-internship': '/assets/logos/logo_uqac.png',
    });
    expect(logoSources(portfolioContent.fr.experience)).toEqual(
      logoSources(portfolioContent.en.experience),
    );
    expect(logoSources(portfolioContent.en.experience)).toEqual(
      factLogoSources(experienceEntryFacts),
    );
    expect(portfolioContent.en.experience[3].id).toBe('groupe-ies');
    expect(portfolioContent.en.experience[3].officialWebsiteUrl).toBeUndefined();
    expect(portfolioContent.en.experience[3].logo?.src).toBe('/assets/logos/logo_groupe_ies.jpeg');
  });

  it('keeps Plansee employment and internship as separate timeline entries', () => {
    const experience = portfolioContent.en.experience;

    expect(experience[0]).toMatchObject({
      id: 'plansee-group-functions',
      organization: 'Plansee Group Functions',
      role: 'Software Developer',
    });
    expect(experience[1]).toMatchObject({
      id: 'plansee-internship',
      organization: 'Plansee',
      role: 'Software Engineering Internship',
    });
    expect(experience[0].technologies).toBeUndefined();
    expect(experience[1].technologies).toEqual(['Angular', 'DaisyUI']);
  });

  it('prioritizes the approved primary technology hierarchy without proficiency metrics', () => {
    for (const locale of supportedLocales) {
      const content = portfolioContentFor(locale);
      const text = stringifyContent(content);

      expect(content.home.primaryStack).toEqual([
        'Java / Spring',
        'C# / .NET',
        'TypeScript / Node.js',
        'Angular',
      ]);
      expect(text).not.toMatch(/\b\d{1,3}%\b/);
      expect(text).not.toContain('95%');
      expect(text).not.toContain('87%');
    }
  });

  it('classifies skill domains by portfolio positioning importance', () => {
    const content = portfolioContent.en;
    const domains = skillDomains(content);
    const importanceByGroup = new Map(content.skills.map((group) => [group.id, group.importance]));
    const importanceByDomain = new Map(domains.map((domain) => [domain.id, domain.importance]));

    expect(importanceByGroup.get('software-engineering')).toBe('primary');
    expect(importanceByGroup.get('microsoft-enterprise')).toBe('professional-complementary');
    expect(importanceByGroup.get('ai-assisted-engineering')).toBe('secondary');
    expect(importanceByDomain.get('backend')).toBe('primary');
    expect(importanceByDomain.get('microsoft-ecosystem')).toBe('professional-complementary');
    expect(importanceByDomain.get('frontend')).toBe('secondary');
    expect(importanceByDomain.get('developer-tooling-llms')).toBe('secondary');
    expect(new Set(domains.map((domain) => domain.importance))).toEqual(
      new Set<SkillImportance>(['primary', 'professional-complementary', 'secondary']),
    );
    expect(skillTechnology(content, 'mcp-concepts')?.importance).toBe('exploratory-historical');
    expect(skillTechnology(content, 'agentic-workflows')?.importance).toBe(
      'exploratory-historical',
    );
  });

  it('builds localized skills from shared locale-neutral topology facts', () => {
    const expectedTopology = skillFactTopology(skillGroupFacts);

    expect(skillTopology(portfolioContent.en.skills)).toEqual(expectedTopology);
    expect(skillTopology(portfolioContent.fr.skills)).toEqual(expectedTopology);
    expect(portfolioContent.fr.skills[0].title).not.toBe(portfolioContent.en.skills[0].title);
    expect(skillTechnology(portfolioContent.fr, 'rest-apis')?.name).toBe('API REST');
  });

  it('represents AI-assisted engineering without overstating expertise', () => {
    const content = portfolioContent.en;
    const aiGroup = content.skills.find((group) => group.id === 'ai-assisted-engineering');
    const text = stringifyContent(content);

    expect(aiGroup?.summary).toContain('software engineering workflows');
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

  it('omits unconfirmed PCF, custom connector, and .NET integration claims', () => {
    const renderedFacts = stringifyContent(portfolioContent.en);

    expect(renderedFacts).not.toContain('PCF');
    expect(renderedFacts).not.toContain('Custom Connector');
    expect(renderedFacts).not.toContain('Custom Connectors');
    expect(renderedFacts).not.toContain('.NET integrations');
  });

  it('describes PostgreSQL as portfolio project experience only', () => {
    const postgres = portfolioContent.en.skills
      .flatMap((group) => group.domains)
      .flatMap((domain) => domain.technologies)
      .find((technology) => technology.name === 'PostgreSQL');

    expect(postgres?.note).toContain('portfolio');
    expect(postgres?.note).toContain('Spring Boot / PostgreSQL');
    expect(JSON.stringify(portfolioContent.en.experience)).not.toContain('PostgreSQL');
  });

  it('keeps visitor-facing content free of internal review wording', () => {
    const renderedContent =
      stringifyContent(portfolioContent.en) +
      stringifyContent(portfolioContent.fr) +
      JSON.stringify(translations);

    expect(renderedContent).not.toMatch(
      /confirmed|approved content|awaiting confirmation|before later|role detail is not yet available|content pending|TODO|temporary routing placeholder/i,
    );
  });
});

function ids(entries: readonly { id: string }[]): string[] {
  return entries.map((entry) => entry.id);
}

function stringifyContent(content: LocalizedPortfolioContent): string {
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

function logoSources(entries: readonly { id: string; logo?: { src: string } }[]) {
  return Object.fromEntries(entries.map((entry) => [entry.id, entry.logo?.src]));
}

function factLogoSources(
  entries: readonly { id: string; affiliation?: { logo?: { src: string } } }[],
) {
  return Object.fromEntries(entries.map((entry) => [entry.id, entry.affiliation?.logo?.src]));
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
