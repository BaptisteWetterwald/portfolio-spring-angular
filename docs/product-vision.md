# Product Vision

This document defines the durable product direction and distinguishes it from deployment work that is not yet complete.

## Product and Positioning

The product is a bilingual personal portfolio for Baptiste Wetterwald, a graduated Engineer in Computer Science and Networks.

Primary positioning:

```text
Software Engineer - Backend / Full-stack
```

Technologies emphasized in the current content are Java/Spring, C#/.NET, TypeScript/Node.js, and Angular. Microsoft Power Platform, SAP/ABAP, database, integration, industrial, AI-assisted, and broader academic experience remain supporting evidence rather than the primary role identity.

The portfolio must not imply unsupported frontend-only, UI/UX, SAP-specialist, low-code-specialist, AI/ML, or LLM-specialist positioning. PostgreSQL is part of this portfolio implementation and is not presented as prior professional PostgreSQL experience.

## Audience and Experience Goal

The portfolio serves recruiters, hiring managers, technical leads, and professional contacts who need a concise, technically credible view of experience, skills, and projects.

The intended first impression is modern, precise, personal, and professional. The maritime identity should aid recognition and orientation without turning the interface into a simulated control system.

## Current Product Shape

The current candidate architecture on `experiment/single-page-navigation` uses two main localized documents:

- `/fr` for French;
- `/en` for English.

Each document composes Home, Education, Experience, Projects, and Contact in that order. Stable fragments make every major section directly linkable. Project case studies remain separate localized pages when a project is configured as `DETAIL`.

This branch state is implemented and validated locally but is not yet the architecture deployed from `main`.

## Current Content

The main document contains:

- an identity/positioning hero and porthole portrait;
- introduction and primary technology directions;
- skills grouped by importance;
- languages;
- education;
- professional experience;
- API-backed projects;
- a conservative Contact section that explicitly does not invent a contact method.

Real GitHub URLs exist on seeded project records where supported by source material. A global GitHub profile link, LinkedIn link, downloadable CV, public contact method, contact form, and GitHub activity feed are not implemented.

## Visual Identity

The implemented visual direction is a restrained modern software-engineering portfolio with French Navy/maritime cues:

- deep navy and off-white themes;
- cyan technical/navigation accent and restrained signal red;
- a porthole portrait;
- route/waypoint Education and Experience timelines;
- compact sonar navigation;
- one persistent lighthouse theme control and dark-mode beam;
- subtle sonar interaction feedback;
- anchor icons for section permalinks;
- restrained daisyUI dividers between major sections.

The lighthouse beam, navigation handoff, and sonar expansion use native browser APIs and CSS. Reduced motion is supported. Decorative Home SVG waves were evaluated and removed; they are not part of the current design.

Avoid cyberpunk, videogame HUD, fake telemetry, submarine-control styling, military roleplay, excessive neon, or motion that competes with content.

## Content Ownership

The product deliberately uses a hybrid content model.

Frontend-static and version-controlled:

- identity and biography;
- Home copy;
- Education and Professional Experience;
- Skills and Languages;
- portrait, organization/school logos, and official organization/school links.

Backend/PostgreSQL-owned:

- Projects and translations;
- publication and presentation state;
- ordered technologies;
- optional project media references and external project links;
- ordered localized detail sections.

Do not add a generic CMS or move profile/CV content into PostgreSQL without a concrete editing or multi-client requirement.

## Project Domain

Publication status and presentation mode are independent:

| Concept            | Values                           | Public behavior                                                                             |
| ------------------ | -------------------------------- | ------------------------------------------------------------------------------------------- |
| Publication status | `DRAFT`, `PUBLISHED`, `ARCHIVED` | Drafts are private; published and archived projects may appear publicly.                    |
| Presentation mode  | `CARD_ONLY`, `DETAIL`            | Card-only projects stop at the list card; detail projects have localized case-study routes. |

Rich `DETAIL` content uses generic ordered localized sections rather than a hard-coded case-study schema. The deprecated long-description field remains a compatibility fallback.

## Technical Requirements

The implemented application consists of:

- an Angular request-time SSR frontend with runtime FR/EN localization;
- a Spring Boot public project API;
- PostgreSQL persistence managed through Flyway;
- separate frontend/backend container images;
- a local Docker Compose stack.

Browser API calls remain same-origin under `/api`. SSR can use `BACKEND_INTERNAL_ORIGIN` to reach the backend over an internal container network. Dynamic project pages become crawlable without rebuilding the frontend.

## Production Direction

The intended production origin is `https://bwetterwald.fr`, with `/` served by the frontend and `/api/*` by the backend through a reverse proxy.

The planned target is a single Linux VPS with host Nginx/HTTPS, Docker Compose, persistent PostgreSQL storage, immutable GHCR images, GitHub Actions validation/deployment, health verification, backups, and rollback. Those production capabilities are not currently implemented; only the application images and local Compose integration exist.
