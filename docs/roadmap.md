# Roadmap

This roadmap turns the specification into milestone-based implementation work. It intentionally stops before bootstrapping code in the current phase.

## 1. Project and Tooling Bootstrap

Objective: establish the repository structure and baseline tooling.

Dependencies: approved technical specification.

Deliverables:

- Angular project scaffold;
- Spring Boot project scaffold;
- shared repository conventions;
- editor/formatting baseline;
- safe example environment files if needed.

Non-goals:

- production deployment;
- final visual design;
- database domain implementation.

Validation criteria:

- clean repository structure;
- generated apps build with default checks;
- README documents only real commands after they exist.

## 2. Angular and Spring Foundations

Objective: create minimal working frontend and backend applications.

Dependencies: milestone 1.

Deliverables:

- Angular app shell placeholder;
- Spring Boot health endpoint;
- local frontend/backend communication;
- environment-based configuration.

Non-goals:

- final UI;
- project database model;
- authentication.

Validation criteria:

- frontend runs locally;
- backend runs locally;
- frontend can reach backend health endpoint in development.

## 3. Docker and Local Integration

Objective: create reproducible local full-stack integration.

Dependencies: milestone 2.

Deliverables:

- local Docker Compose file;
- PostgreSQL service with local persistent volume;
- backend database configuration;
- frontend/backend wiring for integration mode;
- optional local Nginx configuration only if proxy behavior needs testing.

Non-goals:

- production Docker hardening;
- CI publishing;
- VPS deployment.

Validation criteria:

- full stack starts locally through Compose;
- backend reaches PostgreSQL;
- `/api` routing works in integration mode.

## 4. PostgreSQL, Flyway, and Project Domain

Objective: implement the structured project and technology domain.

Dependencies: milestone 3.

Deliverables:

- Flyway migrations for project tables;
- JPA entities and repositories;
- `DRAFT`, `PUBLISHED`, `ARCHIVED` status handling;
- optional `detailedDescription`;
- seed or fixture strategy for development data;
- validation constraints.

Non-goals:

- generic CMS;
- full project media domain;
- admin editing UI;
- GitHub integration.

Validation criteria:

- migrations apply from an empty database;
- schema validates on backend startup;
- public queries exclude `DRAFT`;
- `PUBLISHED` and `ARCHIVED` project queries work;
- repository tests cover core queries.

## 5. Routing, I18n, and Request-Time SSR

Objective: establish localized route handling and SEO-capable rendering.

Dependencies: milestones 2 and 4.

Deliverables:

- `/fr` and `/en` route trees;
- localized static route segments;
- root redirect using stored preference, `Accept-Language`, then English;
- runtime UI translations;
- metadata service;
- request-time SSR baseline;
- localized 404 handling.

Non-goals:

- polished page designs;
- advanced animations.

Validation criteria:

- each public route renders server-side HTML;
- dynamic project detail pages render without frontend rebuild after backend data changes;
- locale switching preserves equivalent route where possible;
- localized metadata is visible in rendered HTML.

## 6. Application Shell and Navigation

Objective: build the accessible portfolio shell and primary navigation concept.

Dependencies: milestone 5.

Deliverables:

- header, footer, skip link;
- semantic navigation links;
- sonar/compass/rose des vents visual navigation enhancement;
- locale switcher;
- lighthouse light/dark theme control;
- responsive mobile navigation.

Non-goals:

- complex motion choreography;
- final maritime visual polish.

Validation criteria:

- keyboard navigation works;
- active route state is exposed;
- sonar/compass navigation enhances real links;
- theme preference persists without layout shift.

## 7. Project API and Project Pages

Objective: expose project data and render project listing/detail pages.

Dependencies: milestones 4, 5, and 6.

Deliverables:

- public project list API;
- published project filter;
- archived project filter;
- featured published projects API;
- project detail API;
- Angular project index;
- Angular project detail page;
- loading, empty, error, and 404 states.

Non-goals:

- rich case-study builder;
- authenticated editing;
- full media gallery;
- live GitHub metadata.

Validation criteria:

- `DRAFT` projects are not public;
- `PUBLISHED` projects render in both locales when translations exist;
- `ARCHIVED` projects render as public archive content;
- project detail pages work with optional detailed descriptions;
- project detail pages have localized metadata and canonical URLs.

## 8. Education, Experience, and Content

Objective: add approved owner content for non-project sections.

Dependencies: milestone 6 and supplied content.

Deliverables:

- Baptiste Wetterwald identity content;
- Backend / Full-stack positioning;
- ENSISA, IUT Robert Schuman, and UQAC education content;
- confirmed experience entries;
- primary and enterprise skill groups;
- skill importance model for primary, professional/complementary, secondary, and exploratory/historical knowledge;
- conservative AI-assisted software engineering content;
- content strategy documentation for future skill/project enrichment;
- GitHub/LinkedIn links when actual URLs are approved;
- downloadable CV link when approved files exist;
- content inventory updated from TODO to confirmed where source is supplied.

Non-goals:

- fabricated placeholder personal details;
- invented responsibilities, metrics, or outcomes;
- contact form backend.

Validation criteria:

- all public personal content is owner-approved;
- French and English variants are complete;
- Plansee SAP-related internship is not described as ABAP work;
- PostgreSQL is not described as previous professional experience;
- no TODO copy appears on production pages.

## 9. Maritime Visual System

Objective: apply the design foundations and restrained maritime language.

Dependencies: milestones 6 through 8.

Deliverables:

- CSS design tokens;
- related but non-inverted light/dark themes;
- typography and spacing system;
- navy/off-white/blue/cyan/signal-red palette;
- DaisyUI-based reusable UI primitive refinement where it fits the portfolio design system;
- porthole portrait treatment;
- nautical route/waypoint timeline styling;
- bathymetric or nautical chart accents where useful.

Non-goals:

- complex animation timelines;
- brass/gold primary brand system;
- cyberpunk/HUD/submarine styling.

Validation criteria:

- design matches the documented 70/20/10 balance;
- colors meet contrast requirements;
- components remain readable on mobile and desktop;
- maritime visuals support content rather than overpowering it.

## 10. Motion

Objective: add selected signature motion without harming accessibility.

Dependencies: milestone 9.

Deliverables:

- reduced-motion baseline;
- optional lighthouse theme transition;
- restrained sonar ping interaction feedback;
- optional wave or bathymetric motion where appropriate;
- optional dark-mode lighthouse beam.

Non-goals:

- motion-dependent navigation;
- fake telemetry;
- GSAP unless justified by implementation complexity.

Validation criteria:

- reduced-motion mode is calm and complete;
- animations do not block content;
- performance remains acceptable on mobile.

## 11. GitHub and Contact Integrations

Objective: add optional dynamic integrations.

Dependencies: milestones 7 and 8.

Deliverables:

- server-side GitHub integration if approved;
- optional GitHub activity on Home if approved;
- caching for external API responses;
- contact form backend if approved;
- spam/rate-limit strategy;
- email delivery configuration if approved.

Non-goals:

- exposing external API tokens to frontend;
- user accounts;
- admin dashboard.

Validation criteria:

- secrets remain server-side;
- external API failures degrade gracefully;
- contact validation and error handling work.

## 12. SEO, Accessibility, and Performance Hardening

Objective: verify production-quality public behavior.

Dependencies: milestones 5 through 11.

Deliverables:

- sitemap.xml;
- robots.txt;
- OpenGraph images;
- structured data with approved personal details only;
- accessibility fixes;
- performance optimization pass.

Non-goals:

- new major features.

Validation criteria:

- localized `hreflang` and canonicals are correct for `bwetterwald.fr`;
- SSR HTML contains meaningful content;
- public sitemap excludes `DRAFT` projects and includes eligible `PUBLISHED`/`ARCHIVED` projects;
- keyboard and screen reader smoke tests pass;
- Lighthouse or equivalent checks meet agreed thresholds.

## 13. Production Docker Images

Objective: create hardened production images.

Dependencies: milestones 7 and 12.

Deliverables:

- frontend production Dockerfile for Angular SSR runtime;
- backend production Dockerfile for Spring Boot;
- `.dockerignore` files;
- runtime configuration documentation;
- image health behavior.

Non-goals:

- automated deployment;
- Kubernetes.

Validation criteria:

- images build reproducibly;
- runtime images exclude development dependencies;
- services run as non-root where practical;
- secrets are not embedded.

## 14. CI

Objective: validate and build the application in GitHub Actions.

Dependencies: milestone 13.

Deliverables:

- frontend validation job;
- backend validation job;
- test jobs;
- production build jobs;
- Docker image build and publish jobs;
- immutable GHCR image tagging strategy.

Non-goals:

- production workflow before runnable projects exist.

Validation criteria:

- failed checks block image publishing;
- image tags trace to Git commits;
- secrets are managed through GitHub Actions secrets.

## 15. Automated VPS Deployment

Objective: deploy approved image versions to the VPS automatically.

Dependencies: milestone 14 and VPS readiness.

Deliverables:

- host Nginx routing/HTTPS configuration for `bwetterwald.fr`;
- deployment script or Compose update strategy;
- SSH-based GitHub Actions deployment;
- GHCR authentication on VPS;
- Spring Boot startup migration coordination;
- health verification.

Non-goals:

- multi-server orchestration;
- Kubernetes;
- blue/green infrastructure unless justified.

Validation criteria:

- push/merge to `main` deploys selected image tags;
- Nginx routes `/` to frontend and `/api/*` to backend;
- failed health checks stop or roll back deployment;
- deployment record identifies image tags and commit SHA.

## 16. Production Verification and Hardening

Objective: prove the production system is maintainable and recoverable.

Dependencies: milestone 15.

Deliverables:

- HTTPS verification;
- backup plan;
- rollback procedure;
- logging review;
- basic monitoring/health checks;
- security review of secrets and exposed ports.

Non-goals:

- enterprise observability stack;
- Kubernetes;
- complex release train process.

Validation criteria:

- previous image versions can be redeployed;
- database backup and restore procedure is documented/tested;
- only intended ports are public;
- production health can be checked after deployment.
