# Content Inventory

This document tracks portfolio content needed for V1. It separates confirmed facts from copy that still needs rewriting and content that remains missing.

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

## Inventory

| Content Area | Confirmed Content | Requires Rewriting | Missing / TODO | Notes |
| --- | --- | --- | --- | --- |
| Identity | Baptiste Wetterwald; graduated Engineer in Computer Science and Networks; Software Engineer; target positioning Backend / Full-stack. | Public headline and concise identity statement in French and English. | Pronunciation if desired, location visibility preference, availability status. | Do not infer additional personal details from local machine paths, Git config, or usernames. |
| Professional introduction | Backend/full-stack software engineer positioning; primary technologies Java/Spring, C#/.NET, TypeScript/Node.js, Angular. | Short About copy, hero supporting copy, recruiter-facing summary in French and English. | Personal tone preference, target roles, preferred industries, availability wording. | Keep the positioning software-engineering first, not frontend-only or low-code-only. |
| Professional experiences | Plansee Group Functions - Software Developer - December 2025 to planned end November 2026; Plansee - Software Engineering internship - 11 weeks during summer 2025; Bureau Veritas Laboratories - Power Platform Developer apprenticeship - 2023-2025; Groupe IES - Full Stack .NET Developer internship - 2023; UQAC - Software Developer internship - 2022. | Role descriptions, responsibilities, technologies, and outcomes in French and English. | Exact locations, team names if public, approved project details, measurable outcomes, links or references. | Do not invent responsibilities, metrics, or outcomes. |
| Plansee internship detail | Redesign of an internal e-commerce-like catalogue using Angular and DaisyUI inside an SAP-related team; no ABAP development during that internship. | Internship narrative and project summary in both locales. | Approved screenshots, project confidentiality boundaries, exact technology context beyond Angular/DaisyUI. | Do not position this as ABAP development. |
| Education | Engineering Degree in Computer Science and Networks - ENSISA - graduated; DUT Computer Science - IUT Robert Schuman; semester abroad at UQAC. | Education descriptions and localized labels. | Dates, locations, coursework, honors, credential URLs, approved school logo usage. | Keep degree naming accurate in both locales. |
| Skills - primary | Java / Spring; C# / .NET; TypeScript / Node.js; Angular. | Skill grouping, labels, project links, proficiency wording. | Evidence examples and approved ordering. | These are the primary technologies to emphasize. |
| Skills - Microsoft / enterprise | Power Platform; Power Apps; Power Automate; Dataverse; Microsoft 365. | Enterprise application experience narrative. | Confirmation of Custom Connectors, PCF, and .NET integrations where genuinely used. | Mention Custom Connectors and PCF only where factual use is confirmed. |
| Database experience | Oracle; SQL Server; SQLite; SAP S/4HANA; MongoDB; SQL / relational database concepts. | Grouping and context for database experience. | Specific project associations and depth of usage. | PostgreSQL is introduced through this portfolio project and must not be described as previous professional PostgreSQL experience. |
| Projects | Project section, project detail pages, backend-managed records, featured projects, archived projects. | Project titles, short descriptions, optional detailed descriptions, technology associations in both locales. | Actual project list, slugs, GitHub URLs, demo URLs, logo/media references, featured flags, statuses, display order. | V1 uses structured project entities, not a generic CMS. |
| Languages | French and English UI/content support. | Personal language proficiency copy if displayed. | Spoken/written proficiency levels and approved wording. | UI locale support is separate from personal language proficiency. |
| Social profiles | GitHub and LinkedIn links are required conceptually on Home. | Link labels and aria labels. | Actual GitHub URL, actual LinkedIn URL, other approved public profiles. | Do not fabricate profile URLs. |
| Portrait/media | Portrait should support future porthole treatment. | Alt text and captions once media exists. | Portrait file, approved project logos/media, OpenGraph image assets. | V1 project media remains a single logo/media reference. |
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
