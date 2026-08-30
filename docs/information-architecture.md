# Information Architecture

This document defines the routing, page hierarchy, and navigation model for the bilingual portfolio.

## Goals

- Provide shareable, crawlable URLs for every primary section and project that has an approved detail page.
- Support French and English routes, content, and metadata from V1.
- Make sonar/compass navigation a major visual navigation concept while preserving real semantic links.
- Support SEO, SSR, localized metadata, and accessible fallback navigation.

## Locale Strategy

Use locale-prefixed canonical routes for all public content.

| Locale  | Prefix | Notes                         |
| ------- | ------ | ----------------------------- |
| French  | `/fr`  | French content and metadata.  |
| English | `/en`  | English content and metadata. |

The root path `/` should redirect to a locale using this approved priority:

1. stored explicit language preference when available;
2. `Accept-Language`;
3. English fallback.

The root path itself is not canonical content.

## Domain

Production domain:

```text
https://bwetterwald.fr
```

Canonical URL examples should use this domain.

## Route Hierarchy

| Page           | French URL          | English URL          | Purpose                                                          |
| -------------- | ------------------- | -------------------- | ---------------------------------------------------------------- |
| Home           | `/fr`               | `/en`                | Identity, positioning, navigation, featured work, contact entry. |
| Education      | `/fr/formation`     | `/en/education`      | Education and semester abroad.                                   |
| Experience     | `/fr/experience`    | `/en/experience`     | Professional timeline and roles.                                 |
| Projects       | `/fr/projets`       | `/en/projects`       | Published and archived project listing.                          |
| Project detail | `/fr/projets/:slug` | `/en/projects/:slug` | Localized project detail for public projects configured as `DETAIL`. |
| Contact        | `/fr/contact`       | `/en/contact`        | Contact options, social links, downloadable CV.                  |

Milestone 5 implemented the static routes above with placeholder pages for Home, Education, Experience, Projects, and Contact. Milestone 7 replaces the Projects placeholder with an API-backed listing and implements project detail routing, data loading, and metadata for shared V1 slugs. Milestone 8 replaces the Home, Education, and Experience placeholders with bilingual professional content while leaving Contact without a fabricated public contact method.

## Project URL Strategy

Use one stable project slug shared across locales in V1.

Example:

```text
https://bwetterwald.fr/fr/projets/portfolio-spring-angular
https://bwetterwald.fr/en/projects/portfolio-spring-angular
```

Rationale:

- stable shared slugs keep database constraints simple;
- URLs remain readable and predictable;
- translation work focuses on page copy and metadata;
- project pages can become crawlable through request-time SSR without a frontend rebuild.

Localized project slugs can be introduced later with redirect mapping if there is a strong SEO reason.

The Milestone 5 locale-switching helper already preserves shared slugs when computing equivalent project-detail paths. No project slug translation is attempted in V1.

Milestone 7 wires those detail paths into the Angular route table:

```text
/fr/projets/:slug
/en/projects/:slug
```

If a slug is unknown, private, non-public, configured as `CARD_ONLY`, or missing the requested translation, the localized project route renders the not-found foundation and links back to the localized Projects page. Locale switching preserves the same slug for loaded `DETAIL` pages; if the target locale has no translation, that target route follows the same not-found behavior rather than showing fallback-language content.

The Projects list may include public `CARD_ONLY` and `DETAIL` projects. `CARD_ONLY` entries must not expose a detail-route affordance, but they remain complete public portfolio entries.

## Project Prominence Strategy

Project visual weight should eventually follow content importance:

| Level | Intended use |
| --- | --- |
| Featured | Major projects that demonstrate the target backend/full-stack profile. |
| Standard | Meaningful projects worth presenting normally. |
| Minor / archive | Small academic projects, old experiments, niche demonstrations, or historical exercises. |

The current backend has `status`, `featured`, and `presentation_mode`; that is sufficient for this phase. Presentation mode controls detail-page availability, not visual importance. Do not add a separate persistence field for project importance until real project content shows that `featured` plus `ARCHIVED` is insufficient.

Small or old projects should not be deleted only because they are old. They should receive lower visual prominence when they are useful for showing breadth or historical context.

## Navigation Model

The site has two coordinated navigation layers:

| Layer                                   | Role                                           | Requirement                                                                               |
| --------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Semantic navigation                     | Real, accessible links for all primary routes. | Must work with keyboard, screen readers, SSR HTML, reduced motion, and no visual effects. |
| Sonar/compass/rose des vents navigation | Primary visual navigation concept.             | Must enhance the semantic links, not replace them.                                        |

The sonar/compass navigation should be treated as part of the application shell design, not only as a future animation. Its markup should still expose normal links and active states.

The conventional navigation must include:

- skip link to main content;
- visible site identity/home link;
- locale switcher;
- links to Home, Education, Experience, Projects, Contact;
- active page indication with `aria-current="page"`;
- responsive mobile navigation with focus management.

Milestone 6 implementation:

- localized routes are still generated from `frontend/src/app/core/routing/localized-routes.ts`;
- the public shell is rendered once by the localized `PublicLayoutComponent` parent;
- the primary header navigation and footer navigation link to Home, Education, Experience, Projects, and Contact;
- exact active matching sets `aria-current="page"` only on the current static destination;
- localized 404 routes under `/fr/...` and `/en/...` keep the shell but do not mark a main navigation destination active;
- the locale switcher preserves equivalent localized paths by using `equivalentLocalizedPath`;
- the compass navigation is a second semantic nav with the same destinations and exact active state;
- the desktop compass layout should remain compact and radial, with destinations presented as waypoints around the navigation instrument rather than spread across a wide panel.

The mobile menu is conventional rather than radial. The compass enhancement remains desktop-oriented and is not required for narrow-screen navigation.

Future visual milestones may explore a compact or floating sonar state deeper in page content. Before implementing that, evaluate the full navigation hierarchy: conventional header, large signature sonar, possible compact/floating sonar, and footer navigation. The portfolio should not present three simultaneous navigation systems that all do the same thing.

Milestone 9 conclusion: do not add a floating or compact sonar control yet. The current IA already has conventional header navigation, the desktop signature sonar/compass, mobile menu navigation, and footer navigation. Adding a floating copy during the visual-system milestone would create redundant navigation before there is evidence that visitors lose orientation in long pages. Revisit only after M9/M10 visual and motion polish can be evaluated on real pages.

## Home Page Structure

The home page should explicitly account for:

- hero with "Baptiste Wetterwald" and Software Engineer - Backend / Full-stack positioning;
- approved portrait with porthole treatment;
- GitHub and LinkedIn links when actual URLs are approved;
- sonar/compass navigation entry points;
- short About content;
- core technology highlights: Java/Spring, C#/.NET, TypeScript/Node.js, Angular;
- languages as secondary profile content;
- complementary Microsoft / enterprise experience summary;
- featured projects;
- optional GitHub activity;
- contact call to action.

This is a content and hierarchy specification, not a complete page design.

Milestone 8 implementation:

- Home renders Baptiste Wetterwald, Software Engineer identity, Backend & Full-stack positioning, a concise introduction, primary stack highlights, and technical skill domains.
- The current content consolidation keeps Home concise while adding a secondary Languages section with French native language, English C1/TOEIC 975, and German B1.
- Skills are presented on Home as domains rather than as a separate route or fake proficiency percentages. The content model supports primary, professional/complementary, secondary, and exploratory/historical importance levels.
- The existing header, footer, and sonar/compass navigation remain the primary navigation system.
- The approved Home portrait is rendered in the hero porthole frame. Supplied school/organization logos may appear only in scoped Education and Experience logo/name areas, with desktop logos in the timeline metadata column. No GitHub link, LinkedIn link, downloadable CV, contact method, GitHub activity, or fake featured project is rendered until those assets, URLs, or records are supplied.
- Featured project content remains backend-owned; Home does not seed or invent project cards when the project API has no approved public records.

Milestone 9 correction:

- Redundant Home route-card navigation is removed because the header, signature sonar/compass, mobile menu, and footer already provide portfolio navigation.
- The hero right-hand area contains the approved portrait in a porthole frame. Keep it as identity support for the hero, not a separate navigation or decorative radar surface.
- Home should flow from hero to primary technologies to skills/domains, with featured projects added only when real backend project content exists.

## Page Composition

| Page           | Primary Content Blocks                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Home           | Hero, short About, approved portrait/porthole frame, core technologies, skills domains, languages; social/project/contact blocks only when approved content exists. |
| Education      | Semantic timeline/list with ENSISA, UQAC semester, IUT Robert Schuman, INSA Lyon, and Lycée Louis Armand entries. |
| Experience     | Semantic timeline/list with Plansee current role, Plansee internship, Bureau Veritas Laboratoires apprenticeship, Groupe IES internship, and LIF/UQAC internship. |
| Projects       | Featured published projects, full published list, archived/secondary project area, technology filters if useful.                            |
| Project detail | For public `DETAIL` projects only: title, short description, ordered localized case-study sections, optional logo/media reference, technologies, GitHub/demo links, related projects if useful. |
| Contact        | Contact method, GitHub/LinkedIn links, downloadable CV, optional future contact form.                                                       |

## Metadata Requirements

Every canonical route needs localized:

- `title`;
- meta description;
- OpenGraph title and description;
- canonical URL;
- alternate `hreflang` links;
- structured data where relevant.

Project detail metadata should be generated from `ProjectTranslation.title` and `ProjectTranslation.shortDescription`. Structured sections and deprecated fallback detailed descriptions should not be required for metadata.

## Error and Redirect Routes

| Route Type           | Behavior                                                                  |
| -------------------- | ------------------------------------------------------------------------- |
| `/`                  | Locale redirect using stored preference, `Accept-Language`, then English. |
| Unknown locale       | Return 404 unless a clear redirect rule exists.                           |
| Unknown page         | Localized 404 with semantic navigation.                                   |
| Unknown project slug | Localized 404 with link back to Projects.                                 |
| `DRAFT` project slug | 404 for public users.                                                     |
| `CARD_ONLY` project slug | 404 for public detail URLs; the project remains visible on the Projects list. |
| Old public route     | 301 redirect after a route has existed publicly.                          |

Milestone 5 root redirect implementation:

- browser locale choices are stored in `localStorage` under `portfolio.locale`;
- the same explicit choice is mirrored to a non-sensitive `portfolio_locale` cookie so request-time SSR can honor it;
- the built Express SSR server returns a real HTTP 302 from `/` to `/fr` or `/en`;
- the Angular root guard provides the same behavior for client-side and development-server navigation.

Milestone 5 404 implementation:

- unknown routes under `/fr/...` and `/en/...` render localized not-found pages;
- unsupported locale prefixes render a not-found page selected from stored preference, `Accept-Language`, or English fallback, and never render canonical portfolio content;
- Angular server routes plus `RESPONSE_INIT.status` set HTTP 404 for SSR wildcard routes.

Milestone 7 update:

- unknown project slugs, `DRAFT` slugs, non-public projects, `CARD_ONLY` projects, and missing requested translations are normalized to localized project not-found behavior;
- project detail not-found responses set SSR HTTP 404 through `RESPONSE_INIT` where Angular SSR handles the request;
- project-specific not-found pages recover to `/fr/projets` or `/en/projects` instead of Home.

## Content Authoring

- English is the primary authoring language for future portfolio source copy.
- French content should be written as a natural localized adaptation, not a literal sentence-by-sentence translation.
- Public copy must not expose milestone/review/TODO language. Documentation may track missing or unconfirmed content; visitor-facing pages should either omit missing details or use plain user-facing empty states.
- Long-term content hierarchy and enrichment rules are tracked in `docs/content-strategy.md`.

## Remaining Decisions

- Whether localized project slugs are worth adding after V1.
