# Product Vision

This document is the primary product source of truth for the portfolio.

## Product

The product is a bilingual personal portfolio for Baptiste Wetterwald, a graduated Engineer in Computer Science and Networks.

The portfolio should present Baptiste as:

- Software Engineer;
- Backend / Full-stack oriented;
- comfortable with professional backend, enterprise, and web application work.

The portfolio must not primarily position Baptiste as:

- frontend-only;
- UI/UX;
- SAP/ABAP specialist;
- low-code-only developer.

## Professional Positioning

Primary positioning:

```text
Software Engineer - Backend / Full-stack
```

Primary technologies to emphasize:

- Java / Spring;
- C# / .NET;
- TypeScript / Node.js;
- Angular.

Complementary Microsoft and enterprise application experience is relevant:

- Microsoft Power Platform;
- Power Apps;
- Power Automate;
- Dataverse;
- Microsoft 365;
- Custom Connectors where genuinely used;
- PCF where genuinely used;
- .NET integrations.

PostgreSQL is part of this portfolio project architecture. It must not be described as previous professional PostgreSQL experience unless such experience is later confirmed.

## Audience

The portfolio should serve:

- recruiters and hiring managers evaluating software engineering fit;
- technical leads looking for backend/full-stack evidence;
- professional contacts who need a concise view of experience, skills, and projects.

The first impression should be competent, modern, precise, and personal without becoming theatrical.

## Visual Identity

The visual identity is:

```text
modern software engineering portfolio x French naval / maritime inspiration
```

Approximate balance:

- 70% clean modern interface;
- 20% maritime visual language;
- 10% signature effects.

Important maritime concepts:

- sonar / compass / rose des vents as the primary visual navigation concept;
- nautical route / waypoints for Education and Experience timelines;
- porthole for portrait treatment;
- lighthouse for light/dark theme toggle;
- lighthouse beam as an optional dark-mode ambient effect;
- bathymetric / nautical chart graphics as subtle backgrounds;
- waves as possible transitions;
- sonar ping as restrained interaction feedback.

The maritime concept should support orientation and identity. It must not become a fake control system.

Avoid:

- submarine operating system styling;
- cyberpunk;
- videogame HUD;
- fake telemetry;
- fake military roleplay;
- excessive neon.

## Home Page Product Requirements

The home page must explicitly account for:

- hero with identity and professional positioning;
- portrait with future porthole treatment;
- GitHub and LinkedIn links when URLs are approved;
- sonar/compass primary visual navigation enhancing real semantic links;
- short About content;
- core technologies;
- featured projects;
- optional GitHub activity;
- contact call to action.

The sonar/compass navigation is a major product concept, not only a later animation. It must enhance accessible navigation links rather than replace them.

## Primary Sections

The portfolio must include:

- Home;
- Education;
- Experience;
- Projects;
- Project details;
- Contact.

French and English must be supported from the beginning with localized routes, content, and metadata.

## Content Principles

- Use confirmed personal information only.
- Do not invent responsibilities, metrics, project outcomes, links, or media.
- English is the primary authoring language for future portfolio source copy.
- French content should be written as a natural localized adaptation, not a literal sentence-by-sentence translation.
- Distinguish primary software engineering skills from complementary enterprise/Microsoft experience.
- Treat SAP-related experience accurately: the Plansee internship occurred inside an SAP-related team but did not involve ABAP development.

## Project Domain

Projects are backend-managed Spring Boot / PostgreSQL entities.

Project statuses:

| Status | Meaning |
| --- | --- |
| `DRAFT` | Private, not publicly visible. |
| `PUBLISHED` | Publicly visible and eligible to be featured. |
| `ARCHIVED` | Publicly visible but belongs to an older or secondary archive. |

Project presentation modes:

| Mode | Meaning |
| --- | --- |
| `CARD_ONLY` | Public project represented completely by its Projects card, with no dedicated detail page. |
| `DETAIL` | Public project with a dedicated localized detail page. |

Publication status and presentation mode are independent. Featured or significant projects may have richer detail pages when their mode is `DETAIL`; smaller public projects may remain useful as `CARD_ONLY` entries with only a title, short description, technologies, and optional external links.

Rich `DETAIL` pages should use ordered localized case-study sections. Section titles and copy belong to project content rather than hard-coded backend categories, so each project can present the narrative supported by its real implementation evidence.

Do not introduce a generic CMS for V1.

## Technical Product Requirements

The intended application consists of:

- Angular frontend;
- Spring Boot backend;
- PostgreSQL database.

Approved frontend direction:

- canonical `/fr/...` and `/en/...` routes;
- localized static route segments;
- shared project slugs across locales in V1;
- runtime UI translations in Angular;
- localized project content from the backend;
- Angular request-time SSR as the main runtime model.

Dynamic project pages must not require a frontend rebuild simply to become crawlable after project data changes.

## Deployment Product Requirements

The production domain is assumed to be:

```text
bwetterwald.fr
```

Use one public origin:

```text
/      -> Angular frontend
/api/* -> Spring Boot backend
```

Production deployment target:

- Linux VPS;
- Nginx on the VPS host as reverse proxy / HTTPS layer unless a concrete blocker appears;
- Docker Compose managing frontend, backend, and PostgreSQL;
- separate production images for frontend and backend;
- persistent PostgreSQL storage;
- GitHub Actions eventually validating, testing, building, publishing immutable GHCR images, deploying on `main`, and verifying health.

Do not design Kubernetes, microservices, or multi-server infrastructure without a new explicit requirement.
