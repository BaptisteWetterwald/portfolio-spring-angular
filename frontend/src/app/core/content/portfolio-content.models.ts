import { SupportedLocale } from '../i18n/locales';
import { StaticPageId } from '../routing/localized-routes';

export type EducationEntryId = 'ensisa' | 'iut-robert-schuman' | 'uqac-semester';

export type ExperienceEntryId =
  | 'plansee-group-functions'
  | 'plansee-internship'
  | 'bureau-veritas-laboratories'
  | 'groupe-ies'
  | 'uqac-internship';

export type TimelineEntryId = EducationEntryId | ExperienceEntryId;

export type SkillGroupId =
  | 'software-engineering'
  | 'microsoft-enterprise'
  | 'ai-assisted-engineering'
  | 'data-databases'
  | 'engineering-infrastructure';

export type SkillDomainId =
  | 'backend'
  | 'frontend'
  | 'microsoft-ecosystem'
  | 'developer-tooling-llms'
  | 'data-platforms'
  | 'project-api-foundations';

export type SkillTechnologyId =
  | 'java'
  | 'spring'
  | 'csharp'
  | 'dotnet'
  | 'typescript'
  | 'nodejs'
  | 'rest-apis'
  | 'angular'
  | 'tailwind-css'
  | 'daisyui'
  | 'power-platform'
  | 'power-apps'
  | 'power-automate'
  | 'dataverse'
  | 'microsoft-365'
  | 'chatgpt'
  | 'codex-coding-agents'
  | 'mcp-concepts'
  | 'agentic-workflows'
  | 'sql'
  | 'relational-databases'
  | 'oracle'
  | 'sql-server'
  | 'sqlite'
  | 'sap-s4hana'
  | 'mongodb'
  | 'postgresql'
  | 'git'
  | 'docker';

export type SkillImportance =
  'primary' | 'professional-complementary' | 'secondary' | 'exploratory-historical';

export interface PortfolioDate {
  readonly datetime: string;
  readonly label: string;
}

export interface PortfolioPeriod {
  readonly start?: PortfolioDate;
  readonly end?: PortfolioDate;
  readonly endPrefix?: string;
  readonly single?: PortfolioDate;
  readonly label?: string;
}

export interface PortfolioPeriodFact {
  readonly startDatetime?: string;
  readonly endDatetime?: string;
  readonly singleDatetime?: string;
}

export interface TimelineEntryLogo {
  readonly src: string;
  readonly alt: string;
}

export interface TimelineEntryAffiliation {
  readonly officialWebsiteUrl?: string;
  readonly logo?: TimelineEntryLogo;
}

export interface EducationEntryFact {
  readonly id: EducationEntryId;
  readonly period?: PortfolioPeriodFact;
  readonly affiliation?: TimelineEntryAffiliation;
}

export interface ExperienceEntryFact {
  readonly id: ExperienceEntryId;
  readonly organization: string | Partial<Record<SupportedLocale, string>>;
  readonly period: PortfolioPeriodFact;
  readonly duration?: Partial<Record<SupportedLocale, string>>;
  readonly technologies?: readonly string[];
  readonly affiliation?: TimelineEntryAffiliation;
}

export interface SkillTechnologyFact {
  readonly id: SkillTechnologyId;
  readonly defaultName: string;
  readonly importance?: SkillImportance;
}

export interface SkillDomainFact {
  readonly id: SkillDomainId;
  readonly importance: SkillImportance;
  readonly technologies: readonly SkillTechnologyFact[];
}

export interface SkillGroupFact {
  readonly id: SkillGroupId;
  readonly importance: SkillImportance;
  readonly domains: readonly SkillDomainFact[];
}

export interface HomeHeroContent {
  readonly name: string;
  readonly role: string;
  readonly orientation: string;
  readonly stackLine: string;
  readonly portraitAlt: string;
}

export interface HomeLinkContent {
  readonly pageId: StaticPageId;
  readonly label: string;
  readonly description: string;
}

export interface HomeContent {
  readonly hero: HomeHeroContent;
  readonly introduction: readonly string[];
  readonly primaryStackHeading: string;
  readonly primaryStack: readonly string[];
  readonly exploreHeading: string;
  readonly exploreLinks: readonly HomeLinkContent[];
  readonly skillsHeading: string;
  readonly skillsIntroduction: string;
}

export interface EducationEntry {
  readonly id: EducationEntryId;
  readonly institution: string;
  readonly degree: string;
  readonly field?: string;
  readonly status?: string;
  readonly period?: PortfolioPeriod;
  readonly summary?: string;
  readonly officialWebsiteUrl?: string;
  readonly logo?: TimelineEntryLogo;
}

export interface ExperienceEntry {
  readonly id: ExperienceEntryId;
  readonly organization: string;
  readonly role: string;
  readonly period: PortfolioPeriod;
  readonly duration?: string;
  readonly context?: string;
  readonly responsibilities?: readonly string[];
  readonly technologies?: readonly string[];
  readonly officialWebsiteUrl?: string;
  readonly logo?: TimelineEntryLogo;
}

export interface SkillTechnology {
  readonly id: SkillTechnologyId;
  readonly name: string;
  readonly note?: string;
  readonly importance?: SkillImportance;
}

export interface SkillDomain {
  readonly id: SkillDomainId;
  readonly title: string;
  readonly importance: SkillImportance;
  readonly technologies: readonly SkillTechnology[];
}

export interface SkillGroup {
  readonly id: SkillGroupId;
  readonly importance: SkillImportance;
  readonly title: string;
  readonly summary?: string;
  readonly domains: readonly SkillDomain[];
}

export interface TimelinePageContent {
  readonly heading: string;
  readonly introduction: string;
  readonly periodToLabel: string;
  readonly officialWebsiteLabel: string;
  readonly opensInNewTabLabel: string;
}

export interface LocalizedPortfolioContent {
  readonly home: HomeContent;
  readonly educationPage: TimelinePageContent;
  readonly education: readonly EducationEntry[];
  readonly experiencePage: TimelinePageContent;
  readonly experience: readonly ExperienceEntry[];
  readonly skills: readonly SkillGroup[];
}

export type PortfolioContentByLocale = Record<SupportedLocale, LocalizedPortfolioContent>;
