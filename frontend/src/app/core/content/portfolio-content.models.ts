import { SupportedLocale } from '../i18n/locales';
import { StaticPageId } from '../routing/localized-routes';

export type EducationEntryId =
  'ensisa' | 'uqac-semester' | 'iut-robert-schuman' | 'insa-lyon' | 'lycee-louis-armand';

export type ExperienceEntryId =
  | 'plansee-group-functions'
  | 'plansee-internship'
  | 'bureau-veritas-laboratories'
  | 'groupe-ies'
  | 'lif-uqac-internship';

export type TimelineEntryId = EducationEntryId | ExperienceEntryId;

export type SkillGroupId =
  | 'software-engineering'
  | 'data-databases'
  | 'enterprise-industrial'
  | 'ai-assisted-engineering'
  | 'broader-software-experience'
  | 'exploratory-historical';

export type SkillDomainId =
  | 'backend-application-development'
  | 'frontend-full-stack'
  | 'apis-integration'
  | 'data-platforms'
  | 'sap-industrial'
  | 'microsoft-power-platform'
  | 'dotnet-ecosystem'
  | 'developer-tooling-llms'
  | 'broader-programming-frameworks'
  | 'game-mobile-academic'
  | 'engineering-tools'
  | 'version-control'
  | 'operating-systems';

export type SkillTechnologyId =
  | 'java'
  | 'spring'
  | 'spring-boot'
  | 'csharp'
  | 'dotnet'
  | 'typescript'
  | 'nodejs'
  | 'express'
  | 'rest-apis'
  | 'http'
  | 'oauth2'
  | 'sockets'
  | 'angular'
  | 'html'
  | 'css'
  | 'tailwind-css'
  | 'daisyui'
  | 'sap-s4hana'
  | 'abap'
  | 'power-platform'
  | 'power-apps'
  | 'power-automate'
  | 'dataverse'
  | 'microsoft-365'
  | 'aspnet-blazor'
  | 'vbnet'
  | 'chatgpt'
  | 'codex-coding-agents'
  | 'mcp-concepts'
  | 'agentic-workflows'
  | 'sql'
  | 'relational-databases'
  | 'postgresql'
  | 'mysql'
  | 'sqlite'
  | 'oracle'
  | 'plsql'
  | 'sql-server'
  | 'mongodb'
  | 'c'
  | 'cpp'
  | 'python'
  | 'django'
  | 'php'
  | 'laravel'
  | 'android-java'
  | 'kotlin'
  | 'javafx'
  | 'swing'
  | 'unreal-engine'
  | 'blueprint'
  | 'matlab'
  | 'arduino'
  | 'labview'
  | 'flowcode'
  | 'latex'
  | 'uml'
  | 'solidworks'
  | 'solid-edge'
  | 'git'
  | 'perforce'
  | 'subversion'
  | 'docker'
  | 'windows'
  | 'linux';

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
  readonly location?: string;
  readonly period?: PortfolioPeriodFact;
  readonly affiliation?: TimelineEntryAffiliation;
}

export interface ExperienceEntryFact {
  readonly id: ExperienceEntryId;
  readonly organization: string | Partial<Record<SupportedLocale, string>>;
  readonly location?: string;
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
  readonly languagesHeading: string;
  readonly languagesIntroduction: string;
}

export interface EducationEntry {
  readonly id: EducationEntryId;
  readonly institution: string;
  readonly location?: string;
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
  readonly location?: string;
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

export type LanguageId = 'french' | 'english' | 'german';

export interface LanguageFact {
  readonly id: LanguageId;
  readonly level: string;
  readonly certification?: string;
}

export interface Language {
  readonly id: LanguageId;
  readonly name: string;
  readonly level: string;
  readonly certification?: string;
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
  readonly languages: readonly Language[];
}

export type PortfolioContentByLocale = Record<SupportedLocale, LocalizedPortfolioContent>;
