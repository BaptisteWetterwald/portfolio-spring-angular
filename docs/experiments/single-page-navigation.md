# Single-Page Navigation Experiment

Status: experimental architecture, with the desktop handoff refinement evaluated on `experiment/header-sonar-morph`. This note does not replace the approved multi-page information architecture or roadmap.

## Purpose

This branch compares the approved multi-page portfolio with a single scrolling document while preserving localized SSR, the maritime shell, project detail case studies, and the existing content sources.

## Architecture

- `/fr` and `/en` render one `PortfolioPageComponent` that composes the existing Home, Education, Experience, Projects, and Contact components.
- The five stable, language-independent section IDs are `home`, `education`, `experience`, `projects`, and `contact`.
- The root route resolves project summaries before rendering, so the Projects section remains backend-backed and SSR-rendered.
- Existing localized section URLs return Angular SSR 302 redirects to the corresponding root fragment. For example, `/fr/formation` redirects to `/fr#education`.
- `/fr/projets/:slug` and `/en/projects/:slug` remain dedicated detail routes. `CARD_ONLY` behavior is unchanged.
- The composed document owns the root Home metadata once. Canonical and alternate links therefore remain `/fr` and `/en`; detail pages retain their existing project-specific metadata.

## Navigation and history

Header, sonar, mobile menu, and footer links are real anchors whose `href` values point to localized root fragments. Explicit activation uses Angular Router navigation, creates one browser-history entry, and then uses native `scrollIntoView`.

The refined experiment keeps the header conventional and removes its embedded sonar and lighthouse. One lighthouse theme control remains fixed on the right from initial render through the footer. The lighthouse and beam keep one stable DOM source and do not participate in navigation handoffs.

On viewports at least `900px` wide, `PublicLayoutComponent` observes the stable `app-site-header` host. The header navigation is primary while at least `82%` of the header is visible. The compact left sonar becomes primary after visibility falls to `58%` or less with the header moving above the viewport. Keeping the current state between those thresholds provides hysteresis without a scroll listener. A `420ms` CSS handoff using `cubic-bezier(0.22, 1, 0.36, 1)` coordinates a restrained header fade/scale with the existing sonar container's fade/scale into its approved docked geometry.

Below `900px`, the sonar remains available from initial render; the desktop choreography does not run, and the existing mobile drag, snap, expansion, and lighthouse-safe-zone behavior is unchanged. Reduced motion makes the wide handoff immediate. Hidden navigation is inert and removed from the accessibility tree. If focus is already inside the outgoing header navigation or sonar, that control remains visible and operable until focus leaves, without forced focus movement.

Passive scroll-spy changes update only shared active-section state. They do not change the URL or browser history. Active section links use `aria-current="location"`.

Back/forward navigation re-resolves the stored section fragment and jumps to that section without creating another history entry.

Language switching preserves a recognized section fragment. Project detail language switching retains the existing shared-slug behavior; when a translation is unavailable, the fallback is the target locale's `#projects` section.

Direct fragment loads are resolved after hydration. The target is scrolled immediately and checked again after page load/browser scroll restoration so refreshes cannot settle on an older stored scroll position.

## Scroll-spy strategy

One `IntersectionObserver` observes only the five major sections with a `-42% 0px -42% 0px` root margin. This creates a narrow activation band around the viewport center.

The current section remains active while it intersects that band. A replacement is selected only after the current section leaves it, with viewport-center distance and document order as deterministic tie-breakers. This avoids a permanent scroll listener and prevents rapid toggling around adjacent section boundaries.

Observer creation, DOM lookup, fragment scrolling, and mobile geometry remain browser-guarded. SSR renders the same initial active state and all core content without accessing browser-only APIs.

## Motion and focus

Normal explicit navigation requests smooth native scrolling. Reduced-motion users and initial deep links use the browser's instant scrolling mode. Keyboard activation moves focus to the target section, whose root has `tabindex="-1"`; pointer navigation does not steal focus. Passive scroll-spy never changes focus.

The dark-mode lighthouse beam always measures the persistent floating lantern. Its linear sweep lasts `24s`, and its cone uses `clamp(230px, 29vmax, 440px)` with the existing `82%` distance falloff plus a restrained lateral edge mask. Reduced motion keeps the existing static beam state.

## Visual rhythm

The existing page presentation components and daisyUI structures remain intact. The composed page adds restrained section boundary lines, centered route waypoints, and subtle alternating surfaces so the long document reads as one maritime route without redesigning cards or adding decorative clutter.

## Verification

- `npm test` covers the composition, stable anchors, redirects, sonar targets, scroll-spy stability, direct fragments, locale switching, reduced motion, mobile drag/tap behavior, project details, and SSR guards.
- `npm run smoke:ssr` checks the Dockerized request-time SSR application and backend.
- `npm run smoke:browser` launches installed headless Chrome over CDP without a new dependency and checks 1440×900, 390×844, and 360×800 scenarios. Set `CHROME_PATH` if Chrome is not in a standard location and `BROWSER_SMOKE_SCREENSHOT_DIR` to capture verification screenshots.
