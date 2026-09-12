# Information Architecture

This document describes the routing, document hierarchy, and navigation behavior of the
implemented single-page architecture.

## Status

The single-page architecture is implemented on `main`. Former multi-page routes remain only as
compatibility redirects and historical context.

## Canonical Localized Documents

| Locale  | Canonical document | Language                     |
| ------- | ------------------ | ---------------------------- |
| French  | `/fr`              | French content and metadata  |
| English | `/en`              | English content and metadata |

The root `/` is a non-canonical entry point. The built SSR server returns temporary HTTP 302 according to:

1. explicit `portfolio_locale` cookie;
2. `Accept-Language`;
3. English fallback.

The locale switcher stores a browser choice in `portfolio.locale` and mirrors it to that non-sensitive cookie.

## Main Document Sections

Each localized document renders the same five major sections in this order:

| Section    | Stable fragment | Content                                                                 |
| ---------- | --------------- | ----------------------------------------------------------------------- |
| Home       | `#home`         | Identity, positioning, portrait, introduction, stack, skills, languages |
| Education  | `#education`    | Education timeline                                                      |
| Experience | `#experience`   | Professional timeline                                                   |
| Projects   | `#projects`     | Backend-owned public project cards                                      |
| Contact    | `#contact`      | Current conservative contact state                                      |

Canonical section links therefore use forms such as `/fr#education` and `/en#projects`. The fragment identifiers are deliberately language-independent so locale switching and shared navigation logic remain stable.

`PortfolioPageComponent` composes the existing section components. The root localized route resolves project summaries before activation, so Projects remains API-backed and present in request-time SSR HTML.

## Compatibility and Detail Routes

The former section URLs issue redirects to the matching main-document fragment. The built SSR response is permanent HTTP 308 because these are architecture migrations; client-side Angular navigation uses the same targets.

| Former route     | Redirect target  |
| ---------------- | ---------------- |
| `/fr/formation`  | `/fr#education`  |
| `/fr/experience` | `/fr#experience` |
| `/fr/projets`    | `/fr#projects`   |
| `/fr/contact`    | `/fr#contact`    |
| `/en/education`  | `/en#education`  |
| `/en/experience` | `/en#experience` |
| `/en/projects`   | `/en#projects`   |
| `/en/contact`    | `/en#contact`    |

Project details remain separate pages:

```text
/fr/projets/:slug
/en/projects/:slug
```

Slugs are shared across locales. Only public projects with `presentationMode = DETAIL` and the requested translation resolve. Invalid slugs and unknown, `DRAFT`, `CARD_ONLY`, or untranslated detail requests return localized HTTP 404 behavior. A missed project detail links back to the localized `#projects` section. Backend failures and the bounded five-second detail timeout instead return localized temporary-unavailable content with HTTP 503.

## Navigation Model

The interface coordinates conventional and maritime navigation around the same semantic section links.

### Top of page

The header contains:

- a skip link to `#main-content`;
- site identity/home link;
- conventional desktop section navigation;
- locale switcher;
- conventional mobile menu.

There is no large sonar and no lighthouse inside the header.

### Wide viewport handoff

The conventional header navigation is primary while the header remains substantially visible. When it scrolls above the viewport, `PublicLayoutComponent` activates the compact floating sonar. Separate exit and return visibility thresholds provide hysteresis so minor boundary movement does not repeatedly flip the controls.

Hidden navigation is `inert` and removed from the accessibility tree. If keyboard focus is already inside the outgoing control, that control remains visible and usable until focus leaves; focus is not forcibly moved during the handoff.

### Mobile

The conventional mobile menu remains available in the header, and the compact sonar is available persistently. Its Messenger-style bubble can be dragged, clamps to safe viewport bounds, snaps to the nearest edge, avoids the lighthouse safe zone, and expands inward as a viewport-constrained panel.

### Footer

The footer exposes conventional links to all five sections. It is a durable navigation fallback and does not depend on motion or the sonar presentation.

## Fragment, History, and Focus Behavior

Header, mobile-menu, sonar, footer, and section-permalink anchors expose real localized `href` values. Plain primary activation is enhanced by `PortfolioNavigationService`:

- Angular navigation writes the requested fragment to browser history;
- explicit pointer navigation uses native smooth scrolling unless reduced motion is requested;
- keyboard activation also focuses the target section;
- modified clicks and non-browser rendering retain normal anchor behavior.

Passive scroll-spy updates shared active-section state and `aria-current="location"`, but it does not mutate the URL or browser history.

Back/forward navigation resolves the fragment and scrolls instantly without creating another entry. Direct fragment loads are handled after hydration and checked again after browser load/restoration so an older saved scroll position does not win.

## Scroll Spy

One browser-only `IntersectionObserver` observes the five major sections around a narrow viewport-center band. The current section remains active while it intersects that band; otherwise the nearest visible section wins with document order as a deterministic tie-breaker.

The observer is progressive enhancement. SSR renders all content and an initial Home state without browser layout access.

## Locale Switching

On the main document, FR/EN switching preserves a recognized section fragment. On a project detail page, it preserves the shared slug when the target translation exists. If the target project translation is unavailable, it links to the target locale's `#projects` section.

## Section Permalinks and Dividers

Every major section exposes one localized, accessible anchor-icon permalink for its canonical fragment.

- Education, Experience, Projects, and Contact place the control with the section heading.
- Home places it in the hero eyebrow row, not beside the person's name.
- Controls are links, have localized accessible names, and keep the SVG decorative.

Four restrained daisyUI dividers with small route waypoints separate the five top-level sections. They are decorative and do not create additional document landmarks.

## Metadata and Errors

The composed document owns one metadata set per locale and canonicalizes to `/fr` or `/en`; fragments are not separate canonical documents. Alternate `fr`, `en`, and `x-default` links are emitted.

Project detail pages use API-provided titles, descriptions, available locales, and optional media. They advertise only actual translations of that project: bilingual pages link reciprocally, single-language pages advertise only their locale, and no project detail emits `x-default`. Localized wildcard and project-detail misses set SSR HTTP 404, use `noindex,follow`, and omit canonical/hreflang links. Temporary backend failures and timeouts use HTTP 503 with the same noindex/no-canonical/no-hreflang policy rather than being misclassified as missing content.

Unsupported locale prefixes are not silently normalized to English. They render not-found behavior selected using the normal locale preference fallback.

## Remaining Information-Architecture Decision

- Whether project slugs should ever be localized. V1 intentionally uses one shared slug per project.
