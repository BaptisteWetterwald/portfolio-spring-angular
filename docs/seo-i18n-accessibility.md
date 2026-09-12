# SEO, I18n, and Accessibility

This document separates implemented behavior from remaining production hardening.

## Implemented Localization

The site supports French and English through canonical `/fr` and `/en` documents. Both contain localized Home, Education, Experience, Projects, and Contact sections with stable language-independent fragments.

Runtime UI dictionaries are frontend-owned. Profile/education/experience/skill/language content is typed and localized in the frontend; project translations are loaded from the backend.

The root `/` is not canonical content. The built Express SSR server returns a temporary HTTP 302 because the destination varies by request, using:

1. explicit `portfolio_locale` cookie;
2. `Accept-Language`;
3. English fallback.

The Angular root guard provides equivalent client/development-server behavior. Locale choices are stored in `portfolio.locale` and mirrored to the cookie. No geolocation is used.

## Localized URL Model

Main documents and fragments:

```text
/fr#home
/fr#education
/fr#experience
/fr#projects
/fr#contact
/en#home
/en#education
/en#experience
/en#projects
/en#contact
```

Fragments identify locations inside `/fr` or `/en`; they are not separate canonical documents.

Former localized section paths are permanent architecture migrations and return HTTP 308 from the built SSR server to these fragments. Dedicated project details remain `/fr/projets/:slug` and `/en/projects/:slug`, with one shared slug across languages.

FR/EN switching preserves a recognized current section. On project details it preserves the slug when the API reports the target locale in `availableLocales`; otherwise it returns to the target locale's Projects section.

## SSR and Hydration

All public routes use request-time SSR. The localized root resolvers load project summaries and controlled GitHub activity before the composed page renders, and detail resolvers load the selected project before detail HTML/metadata is sent. Angular HTTP transfer caching prevents immediate duplicate API requests after hydration.

Angular hydration uses event replay. Browser-only fragment scrolling, scroll-spy, header visibility, lighthouse measurement, media-query handling, animation frames, and mobile drag geometry are platform-guarded and initialized after render.

Direct fragment loads are positioned immediately after hydration and checked again after load/browser restoration. Back/forward fragment navigation scrolls without generating another history entry.

## Implemented Metadata

`PageMetadataService` currently manages:

- `<html lang>`;
- localized `<title>` and description;
- `robots`;
- canonical link;
- localized `hreflang` alternates and, for the main documents, `x-default`;
- OpenGraph title, description, type, URL, locale, and alternate locale;
- a shared OpenGraph social image with localized alt text, intrinsic dimensions, MIME type, and site name;
- a matching `summary_large_image` Twitter/X card with localized page title, description, and image alt text.

The main composed document canonicalizes to `/fr` or `/en` and uses one localized document metadata set. It does not create separate canonical/alternate entries for fragments.

Project detail metadata comes from localized `title` and `shortDescription`. Its `hreflang` and OpenGraph alternate locales are limited to actual API-reported translations of that project: bilingual details advertise reciprocal French and English URLs, while a single-language detail advertises only that locale. Project details do not emit `x-default`, because the portfolio root is not an equivalent version of a project.

Healthy main documents and healthy localized project details share the approved language-neutral `1200 × 630` PNG at `/assets/social/baptiste-wetterwald-social-card-v1.png`, emitted as the absolute production URL. The versioned filename supports safe replacement under the long-lived static-asset cache policy. Project `logoMediaRef` values are not social-card sources, and M12 does not provide project-specific or localized social images. The full managed image/Twitter group is rendered during SSR, replaced on successful client navigation, and removed on 404, untranslated-detail, and temporary 503 states so stale preview metadata cannot survive navigation.

Healthy `/fr` and `/en` SSR responses contain one managed JSON-LD `ProfilePage` with a locale-specific page `@id`, canonical page URL, and `inLanguage`. Each page identifies the same stable `Person` `@id` and includes only the approved public name, localized profile description and job title, portrait URL, and GitHub `sameAs` identity. The GitHub identity is frontend-static public profile metadata and does not depend on GitHub activity API availability. Project detail, 404, untranslated-project, and temporary 503 states remove the managed JSON-LD script.

M12 structured data deliberately stops at `ProfilePage` plus `Person`. `SoftwareSourceCode` is deferred until project data formally guarantees that `githubUrl` is a public source repository, explicitly classifies programming languages, and has verified/corrected repository data. No `CreativeWork` or other project schema is used as a fallback.

## Crawl Discovery

The public `robots.txt` allows general site crawling, instructs compliant crawlers not to crawl `/api/`, and advertises the production sitemap URL. This policy is not access control and cannot by itself prevent API URLs from being discovered, indexed from other signals, or requested directly.

The SSR server generates `/sitemap.xml` from the backend-owned localized public project indexes. Generation requires `BACKEND_INTERNAL_ORIGIN` at runtime, and each of the parallel French and English backend requests has a five-second application-controlled timeout. The sitemap contains the canonical `/fr` and `/en` documents plus only localized `DETAIL` routes for `PUBLISHED` and `ARCHIVED` projects. It emits reciprocal `hreflang` entries for available localized project routes, excludes `CARD_ONLY` projects, and returns a plain-text, non-cacheable `503` rather than publishing an incomplete project index when the backend is unavailable or times out. Malformed individual project entries remain safely excluded without failing an otherwise valid localized index.

Successful sitemap responses advertise `public, max-age=900, stale-while-revalidate=3600` for downstream browser or proxy caching. The SSR process does not keep an application-level or last-known-good sitemap cache.

For local built-server validation, start the backend and set `BACKEND_INTERNAL_ORIGIN` to an origin reachable from the frontend process, such as `http://127.0.0.1:8080` when both processes run directly on the host. Compose supplies `http://backend:8080` inside its frontend container. After building and starting the SSR server, `npm run smoke:ssr` validates the healthy sitemap; a missing or unreachable backend origin is expected to make `/sitemap.xml` return `503`.

## Public Project Indexing Rules

- `PUBLISHED` and `ARCHIVED` projects may appear in the SSR-rendered Projects section.
- `DRAFT` projects are absent from public APIs.
- Only `DETAIL` projects have crawlable detail pages.
- Unknown, private, `CARD_ONLY`, and untranslated detail URLs render localized 404 content.
- Project-detail backend failures are temporary availability failures rather than evidence that a project does not exist.

Structured detail sections are rendered as ordinary localized HTML. The deprecated long-description field is used only when a detail project has no structured sections.

## Errors

Unknown localized routes and invalid, missing, non-public, `CARD_ONLY`, or untranslated project details set SSR HTTP 404. Their metadata is localized, uses `noindex,follow`, and removes managed canonical/hreflang links.

Project-detail resolution bounds its backend request to five seconds, matching sitemap generation. A network/backend failure or timeout instead sets SSR HTTP 503 and renders localized temporary-unavailable copy. The response remains `noindex,follow`, has no canonical or `hreflang` links, clears any previously managed successful-project metadata, and does not expose backend or timeout details to the client. This is request-time behavior through the normal SSR backend origin selected by `BackendApiUrlService`, including `BACKEND_INTERNAL_ORIGIN` when configured.

Unsupported locale prefixes such as `/de` do not silently render English canonical content. Project-specific misses recover to the localized `#projects` section; generic misses recover to the localized document root.

## Semantic Structure

The composed document implements:

- a skip link and semantic header/navigation/main/footer shell;
- one Home `h1` and `h2` headings for the other major sections;
- major sections with stable IDs and programmatic-focus targets;
- ordered semantic Education/Experience timelines with real `<time>` elements;
- project cards as articles and actions as real links;
- the GitHub evidence block as an internal Home subsection with a localized date/count contribution grid, repository articles, and safe external-link semantics;
- the Contact section as one labelled form with four visible controls and an action button;
- detail content as one article with section headings;
- buttons only for actions and links for navigation.

Project-card and project-detail action groups are neutral containers around semantic links, not additional named navigation landmarks. The persistent floating-control wrapper is also neutral; the sonar retains its own labelled navigation landmark and the lighthouse retains its button semantics.

DaisyUI supplies presentation primitives without replacing semantic elements.

## Keyboard and Focus

Implemented behavior includes:

- visible global focus styles;
- keyboard-reachable conventional, locale, sonar, theme, project, and permalink controls;
- mobile-menu `aria-expanded` and `aria-controls`;
- Escape close and focus restoration for the mobile menu;
- Escape close for expanded sonar;
- keyboard focus retained inside outgoing header/sonar controls during the visibility handoff;
- full-route SPA navigation moving focus to the new primary heading, or the destination section when returning to a localized fragment;
- keyboard section activation moving focus to the destination section;
- fragment-only navigation and passive scroll-spy never moving focus;
- one focusable horizontal contribution-calendar region with non-focusable, individually labelled date/count cells instead of hundreds of tab stops;
- Contact controls with real associated labels, normal tab order, visible focus, and no focus trap.

Contact validation messages appear only after a field has been touched or submission has been attempted. Invalid controls use `aria-invalid` and `aria-describedby`; submitting uses a polite live status and `aria-busy`; success, rate limiting, and failure use assertive text alerts so meaning is not carried by color or animation. The visually clipped anti-bot control is `aria-hidden`, has `tabindex="-1"`, and is absent from normal keyboard/assistive-technology navigation.

The header-to-sonar handoff does not force focus to a new control. Hidden duplicate navigation is inert and `aria-hidden`; a focused outgoing control remains available until focus leaves.

## Sonar Accessibility

The compact sonar is a semantic `<nav>` with real localized anchors. Its disclosure button exposes `aria-expanded` and `aria-controls`. Collapsed links are hidden from the accessibility tree and removed from tab order. Active links use `aria-current="location"`. Escape from a focused expanded panel collapses it and leaves focus on the disclosure button; normal Tab movement can then continue outside the sonar.

The mobile drag interaction is optional enhancement: tapping and keyboard navigation still operate the control, and no navigation target depends on drag placement.

## Non-text Contrast

Contact inputs and textareas use a restrained one-pixel boundary mixed from the theme's muted-text and border tokens. The measured default boundary exceeds the WCAG 3:1 non-text contrast threshold against the raised field surface in both light and dark themes; hover, focus outline, and error color remain distinct.

The contribution calendar retains zero plus four positive maritime-cyan levels. Positive days share a high-contrast cyan boundary against the calendar surface and progress from outlined to increasingly filled cells. The compact five-step fill scale is not presented as four independently 3:1-adjacent swatches; exact localized date/count labels remain available to assistive technology and pointer tooltips, and the graph still contributes only one keyboard stop.

## Section Permalinks

Each major section has one anchor-icon permalink with a localized `aria-label` and matching title. The SVG is `aria-hidden` and non-focusable. Home's control is associated with the hero eyebrow rather than the person's name; other controls sit with their section headings.

## Reduced Motion

Global CSS disables smooth scrolling and compresses long animations/transitions when `prefers-reduced-motion: reduce` is active. Component rules additionally:

- make the header/sonar handoff immediate;
- make sonar expansion static;
- replace the waypoint ripple with a static emphasis;
- stop lighthouse rotation and retain a static low-opacity beam;
- keep every state and target discoverable without animation.

## Media Accessibility

The approved portrait has localized meaningful alt text, explicit intrinsic dimensions, and high fetch priority. Timeline logos are decorative within separately labelled links/identity content and use empty alt text. Project media, when present, uses the project title; empty project-media frames are not rendered.

## Not Yet Implemented

The following remain part of the SEO/accessibility/performance hardening roadmap and must not be claimed as current features:

- project-specific JSON-LD/Schema.org structured data, deliberately deferred pending stronger project semantics;
- project-specific or localized social-preview imagery, deliberately excluded from M12;
- a recorded manual screen-reader audit;
- published Lighthouse/performance/accessibility thresholds;
- production analytics or monitoring.

The crawl files complement rather than replace the per-page robots metadata already implemented.

## Validation Direction

Current automated coverage includes route/metadata tests, SSR 404 tests, crawl-policy and Express sitemap response tests, semantic navigation states, full-route focus and fragment-focus exclusions, focused sonar Escape behavior, Contact validation and live-region semantics, reduced-motion states, fragment/history behavior, mobile viewport geometry, and built SSR/browser smoke scripts. The focused `npm run smoke:a11y` check records real-browser route focus, Escape/Tab continuation, landmark counts, computed contrast, 320 CSS-pixel reflow, and reduced-motion behavior.

Before production deployment, complete keyboard-only, screen-reader, contrast, zoom/reflow, and Lighthouse-style audits against the deployed origin.
