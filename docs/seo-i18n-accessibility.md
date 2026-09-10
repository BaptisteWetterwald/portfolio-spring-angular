# SEO, I18n, and Accessibility

This document separates implemented behavior from remaining production hardening.

## Implemented Localization

The site supports French and English through canonical `/fr` and `/en` documents. Both contain localized Home, Education, Experience, Projects, and Contact sections with stable language-independent fragments.

Runtime UI dictionaries are frontend-owned. Profile/education/experience/skill/language content is typed and localized in the frontend; project translations are loaded from the backend.

The root `/` is not canonical content. The built Express SSR server returns HTTP 302 using:

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

Former localized section paths return redirects to these fragments. Dedicated project details remain `/fr/projets/:slug` and `/en/projects/:slug`, with one shared slug across languages.

FR/EN switching preserves a recognized current section. On project details it preserves the slug when the API reports the target locale in `availableLocales`; otherwise it returns to the target locale's Projects section.

## SSR and Hydration

All public routes use request-time SSR. The localized root resolvers load project summaries and controlled GitHub activity before the composed page renders, and detail resolvers load the selected project before detail HTML/metadata is sent. Angular HTTP transfer caching prevents an immediate duplicate GitHub request after hydration.

Angular hydration uses event replay. Browser-only fragment scrolling, scroll-spy, header visibility, lighthouse measurement, media-query handling, animation frames, and mobile drag geometry are platform-guarded and initialized after render.

Direct fragment loads are positioned immediately after hydration and checked again after load/browser restoration. Back/forward fragment navigation scrolls without generating another history entry.

## Implemented Metadata

`PageMetadataService` currently manages:

- `<html lang>`;
- localized `<title>` and description;
- `robots`;
- canonical link;
- `fr`, `en`, and `x-default` alternates;
- OpenGraph title, description, type, URL, locale, and alternate locale;
- optional project `og:image` from a validated media reference.

The main composed document canonicalizes to `/fr` or `/en` and uses one localized document metadata set. It does not create separate canonical/alternate entries for fragments.

Project detail metadata comes from localized `title` and `shortDescription`. Its `hreflang` and OpenGraph alternate locales are limited to API-reported translations. `og:image` is omitted when no media reference exists.

## Public Project Indexing Rules

- `PUBLISHED` and `ARCHIVED` projects may appear in the SSR-rendered Projects section.
- `DRAFT` projects are absent from public APIs.
- Only `DETAIL` projects have crawlable detail pages.
- Unknown, private, `CARD_ONLY`, and untranslated detail URLs render localized 404 content.

Structured detail sections are rendered as ordinary localized HTML. The deprecated long-description field is used only when a detail project has no structured sections.

## Errors

Unknown localized routes and project-detail misses set SSR HTTP 404 where Angular handles the request. Their metadata is localized, uses `noindex,follow`, and removes managed canonical/hreflang links.

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

DaisyUI supplies presentation primitives without replacing semantic elements.

## Keyboard and Focus

Implemented behavior includes:

- visible global focus styles;
- keyboard-reachable conventional, locale, sonar, theme, project, and permalink controls;
- mobile-menu `aria-expanded` and `aria-controls`;
- Escape close and focus restoration for the mobile menu;
- Escape close for expanded sonar;
- keyboard focus retained inside outgoing header/sonar controls during the visibility handoff;
- keyboard section activation moving focus to the destination section;
- passive scroll-spy never moving focus.
- one focusable horizontal contribution-calendar region with non-focusable, individually labelled date/count cells instead of hundreds of tab stops.
- Contact controls with real associated labels, normal tab order, visible focus, and no focus trap.

Contact validation messages appear only after a field has been touched or submission has been attempted. Invalid controls use `aria-invalid` and `aria-describedby`; submitting uses a polite live status and `aria-busy`; success, rate limiting, and failure use assertive text alerts so meaning is not carried by color or animation. The visually clipped anti-bot control is `aria-hidden`, has `tabindex="-1"`, and is absent from normal keyboard/assistive-technology navigation.

The header-to-sonar handoff does not force focus to a new control. Hidden duplicate navigation is inert and `aria-hidden`; a focused outgoing control remains available until focus leaves.

## Sonar Accessibility

The compact sonar is a semantic `<nav>` with real localized anchors. Its disclosure button exposes `aria-expanded` and `aria-controls`. Collapsed links are hidden from the accessibility tree and removed from tab order. Active links use `aria-current="location"`.

The mobile drag interaction is optional enhancement: tapping and keyboard navigation still operate the control, and no navigation target depends on drag placement.

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

- `sitemap.xml`;
- `robots.txt` file;
- JSON-LD/Schema.org structured data;
- approved site-wide OpenGraph image assets;
- a recorded full screen-reader audit;
- published Lighthouse/performance/accessibility thresholds;
- production analytics or monitoring.

The absence of a `robots.txt` file does not replace the per-page robots metadata already implemented.

## Validation Direction

Current automated coverage includes route/metadata tests, SSR 404 tests, semantic navigation states, Contact validation and live-region semantics, reduced-motion states, fragment/history behavior, mobile viewport geometry, and built SSR/browser smoke scripts.

Before production deployment, add the missing crawl artifacts and complete keyboard-only, screen-reader, contrast, zoom/reflow, and Lighthouse-style audits against the deployed origin.
