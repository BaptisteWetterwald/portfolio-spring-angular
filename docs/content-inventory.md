# Content Inventory

This document tracks portfolio content needed for V1. It separates confirmed facts from copy that still needs rewriting and content that remains missing. Long-term positioning and content hierarchy rules live in [Content strategy](content-strategy.md).

Primary source: `docs/product-vision.md`.

## Status Definitions

| Status | Meaning |
| --- | --- |
| Confirmed | Approved factual content that may be used as source material. |
| Requires rewriting | Factual source exists, but portfolio-ready French and English copy still needs to be written. |
| Missing / TODO | Source content does not exist in the repository yet. Do not invent it. |

## Confirmed Product Context

| Area | Confirmed |
| --- | --- |
| Site type | Personal portfolio for Baptiste Wetterwald. |
| Positioning | Software Engineer - Backend / Full-stack. |
| Languages | French and English from the beginning. |
| Main sections | Home, Education, Experience, Projects, Project details, Contact. |
| Visual identity | Modern software engineering portfolio x French naval / maritime inspiration. |
| Project data | Projects are backed by Spring Boot and PostgreSQL. |
| Deployment target | `bwetterwald.fr` on a Linux VPS, with Nginx host reverse proxy and Docker Compose for frontend/backend/PostgreSQL. |

## Milestone 8 Implementation Status

Structured static personal content for Home, Education, Experience, and Skills is implemented in `frontend/src/app/core/content/portfolio-content.ts` with typed models in `frontend/src/app/core/content/portfolio-content.models.ts`. Timeline facts and skill topology are locale-neutral; localized records provide visitor-facing labels, notes, and prose.

| Area | M8 Status |
| --- | --- |
| Home | Implemented with name, Software Engineer identity, Backend / Full-stack positioning, concise introduction, primary stack, portfolio entry links, and skill domains. |
| Education | Implemented with ENSISA, IUT Robert Schuman, and UQAC entries. ENSISA and IUT use confirmed year ranges; UQAC is identified as an international semester during the DUT without invented semester dates. |
| Experience | Implemented with confirmed role titles, organizations, periods, limited confirmed context, and role-specific technologies only where confirmed. Plansee employment and internship remain separate entries. |
| Skills | Implemented as technical domains without percentages. Group/domain/technology ordering, membership, and importance are centralized in shared skill facts. The model supports primary, professional/complementary, secondary, and exploratory/historical importance levels. Primary hierarchy is Java / Spring, C# / .NET, TypeScript / Node.js, then Angular. Microsoft enterprise experience and AI-assisted engineering are presented as subordinate/supporting areas. |
| Social profiles | Not implemented because actual GitHub and LinkedIn URLs are still missing. |
| Portrait/media | Approved Home portrait implemented as an original asset cropped responsively in the porthole frame. Approved Education/Experience organization logos are wired from local frontend public assets. OpenGraph image assets and project logos/media remain pending. |
| Projects on Home | No fake featured projects are shown. Project records remain backend-owned and await approved real project content. |
| Contact | No real contact method is published because the final public contact method is still missing. |

## Inventory

| Content Area | Confirmed Content | Requires Rewriting | Missing / TODO | Notes |
| --- | --- | --- | --- | --- |
| Identity | Baptiste Wetterwald; graduated Engineer in Computer Science and Networks; Software Engineer; target positioning Backend / Full-stack. | First bilingual public headline and identity statement implemented; owner tone may still be refined. | Pronunciation if desired, location visibility preference, availability status. | Do not infer additional personal details from local machine paths, Git config, or usernames. |
| Professional introduction | Backend/full-stack software engineer positioning; primary technologies Java/Spring, C#/.NET, TypeScript/Node.js, Angular. | First concise About/Home copy implemented in French and English. | Personal tone preference, target roles, preferred industries, availability wording. | Keep the positioning software-engineering first, not frontend-only or low-code-only. |
| Professional experiences | Plansee Group Functions - Software Developer - December 2025 to planned end November 2026; Plansee - Software Engineering internship - 11 weeks during summer 2025; Bureau Veritas Laboratories / Bureau Veritas Laboratoires - Power Platform Developer apprenticeship - 2023-2025; Groupe IES - Full Stack .NET Developer internship - 2023; UQAC - Software Developer internship - 2022. | First concise bilingual timeline implemented with optional official website fields and approved local logos for current organizations. Richer responsibilities, outcomes, and role descriptions still require source details. | Exact locations, team names if public, approved project details, measurable outcomes, remaining links or references. | Use French company name "Bureau Veritas Laboratoires" in French public copy. Do not invent responsibilities, metrics, outcomes, or logos. |
| Plansee internship detail | Redesign of an internal e-commerce-like catalogue using Angular and DaisyUI inside an SAP-related team; no ABAP development during that internship. | First bilingual internship summary implemented. | Approved screenshots, project confidentiality boundaries, exact technology context beyond Angular/DaisyUI. | Do not position this as ABAP development. |
| Education | Engineering Degree in Computer Science and Networks - ENSISA - graduated - 2022-2025; DUT Computer Science - IUT Robert Schuman - 2020-2022; semester abroad at UQAC during DUT studies. | First bilingual education timeline implemented with optional official school website fields and approved local school logos. | Exact locations, coursework, honors, credential URLs, exact UQAC semester dates if public. | Keep degree naming accurate in both locales. Do not add school logos unless approved assets exist. |
| Skills - primary | Java / Spring; C# / .NET; TypeScript / Node.js; Angular; REST APIs; backend/full-stack engineering. | Implemented as prioritized technical domains without percentages. | Evidence examples and project associations. | These are the primary technologies to emphasize. |
| Skills - Microsoft / enterprise | Power Platform; Power Apps; Power Automate; Dataverse; Microsoft 365. | Implemented as professional/complementary enterprise application experience. | Confirmation of Custom Connectors, PCF, ABAP, and .NET integrations where genuinely used. | Mention Custom Connectors, PCF, ABAP, and .NET integrations only where factual use is confirmed. |
| Skills - AI-assisted engineering | ChatGPT for software-development/problem-solving workflows; Codex / coding agents; familiarity with MCP concepts; early exploration of agentic workflows. | Implemented as secondary developer tooling with explicit non-expert positioning. | Concrete examples, boundaries for professional usage, and public phrasing refinements. | Do not position Baptiste as AI Engineer, ML Engineer, LLM Engineer, agentic AI expert, or MCP expert. |
| Database experience | Oracle; SQL Server; SQLite; SAP S/4HANA; MongoDB; SQL / relational database concepts. | Implemented as a professional/complementary Data & Databases group. PostgreSQL is labelled as portfolio implementation experience. | Specific project associations and depth of usage. | PostgreSQL is introduced through this portfolio project and must not be described as previous professional PostgreSQL experience. |
| Skills - older/niche/historical | Architecture now supports secondary and exploratory/historical skills. | Awaiting owner-supplied inventory. | LabVIEW, older school technologies, high-school experiments, small academic exercises, and other older/self-taught knowledge. | Absence from the current public page does not imply lack of knowledge. Add later with lower visual prominence unless promoted by owner-approved evidence. |
| Projects | Project section, project detail pages, backend-managed records, featured projects, archived projects. | Project titles, short descriptions, optional detailed descriptions, technology associations in both locales. | Actual project list, slugs, GitHub URLs, demo URLs, logo/media references, featured flags, statuses, display order, and future project-importance classification. | V1 uses structured project entities, not a generic CMS. No fake records should be seeded. |
| Languages | French and English UI/content support. | Personal language proficiency copy if displayed. | Spoken/written proficiency levels and approved wording. | UI locale support is separate from personal language proficiency. |
| Social profiles | GitHub and LinkedIn links are required conceptually on Home. | Link labels and aria labels. | Actual GitHub URL, actual LinkedIn URL, other approved public profiles. | Do not fabricate profile URLs. |
| Portrait/media | Home portrait uses the approved original image asset and porthole treatment. Timeline school/organization logos use approved local frontend assets. | Localized portrait alt text implemented; timeline logo references are locale-neutral facts. | Approved project logos/media and OpenGraph image assets. | Crop the portrait with CSS object positioning rather than a manual square derivative. V1 project media remains a single logo/media reference owned by the Project domain. |
| Contact information | Contact page and contact CTA are required. | Contact copy, CTA labels, response expectation text. | Public email or form preference, location/timezone disclosure, availability, future contact form policy. | Email delivery secrets must remain server-side. |
| Downloadable CV | Downloadable CV is part of the planned portfolio content. | CV link labels and locale-specific download copy. | CV file(s), language variants, file naming, update date, public/private fields. | Do not create placeholder PDFs with fabricated content. |
| Optional GitHub activity | Optional home-page content. | Section heading and summary if enabled. | Whether to include it, what data to show, whether a token is needed. | Server-side integration if tokens are required. |

## Experience Source Template

```text
Organization:
Role:
Dates:
Location:
Contract type:
Confirmed responsibilities:
Confirmed technologies:
Confirmed outcomes:
Confidentiality limits:
French draft:
English draft:
```

## Project Content Template

```text
Name:
Stable slug:
Status: DRAFT | PUBLISHED | ARCHIVED
Featured: yes | no
Display order:
Short description, fr:
Short description, en:
Detailed description, fr:
Detailed description, en:
Technologies:
GitHub URL:
Demo URL:
Logo/media reference:
Known confidentiality limits:
```

## Copy Requirements

- Every public content item must have an explicit locale strategy: translated, locale-specific, shared, or intentionally hidden in one locale.
- English is the primary authoring language for future source copy.
- French pages should be written as natural localized adaptations, not mechanically mirrored sentence by sentence.
- Missing content must remain visibly tracked as TODO in documentation until supplied.
- Public copy should avoid unsupported claims, invented metrics, unverified dates, and private client information.
- PostgreSQL may be described as part of the portfolio implementation, not as prior professional database experience.
