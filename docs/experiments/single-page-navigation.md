# Single-Page Navigation Candidate Record

Status: implemented and validated on `experiment/single-page-navigation`; pending reconciliation and merge into `main`. This file records the architectural experiment and its outcome. The current contract is maintained in [Information architecture](../information-architecture.md) and [Frontend architecture](../frontend-architecture.md).

## Question Evaluated

Could the five primary portfolio pages become one localized scrolling document without losing request-time SSR, direct links, browser history, project case-study routes, accessible fallback navigation, or the established maritime identity?

## Candidate Outcome

The branch implements:

- `/fr` and `/en` as the two main portfolio documents;
- Home, Education, Experience, Projects, and Contact composed from the existing section components;
- stable `#home`, `#education`, `#experience`, `#projects`, and `#contact` fragments;
- compatibility redirects from the former localized section URLs;
- separate localized `DETAIL` project pages and unchanged `CARD_ONLY` restrictions;
- project-summary resolution before root-document SSR;
- explicit fragment navigation with normal history entries;
- passive scroll-spy without URL/history mutation;
- direct fragment and back/forward restoration after hydration;
- locale switching that preserves the current section when recognized.

## Navigation Outcome

The top-of-page header is conventional. The earlier embedded large sonar and header lighthouse were removed.

On wide viewports, header visibility controls a focus-safe handoff to the compact floating sonar. Separate leave/return thresholds provide hysteresis. On mobile, the sonar is available immediately and retains draggable bubble, edge snapping, safe-area, lighthouse avoidance, and inward-expanding viewport-constrained behavior.

One persistent floating lighthouse is the only theme control and beam origin. It does not participate in the header/sonar handoff.

## Motion and Focus Outcome

- Explicit pointer navigation uses smooth native scrolling when motion is allowed.
- Keyboard activation focuses the target section.
- Direct fragments, back/forward, and reduced-motion navigation use instant positioning.
- Scroll-spy never changes focus, URL, or browser history.
- Focused outgoing header/sonar controls remain operable until focus leaves.
- The dark-mode beam remains a native-CSS effect from the persistent lighthouse.

## Visual Outcome

The section components retain their existing design. Five localized anchor permalinks expose canonical fragments: Home uses the hero eyebrow treatment, while the four standard sections place the control with their headings. Four restrained daisyUI dividers separate the major sections.

No decorative Home wave was restored.

## Verification Added

- route/composition and compatibility-redirect tests;
- fragment parsing, locale preservation, and history tests;
- scroll-spy and SSR browser-guard tests;
- header-to-sonar handoff and focus-retention tests;
- mobile drag/snap/viewport-safety tests;
- section permalink/divider tests;
- updated built SSR smoke coverage;
- headless Chrome wide/mobile/reduced-motion smoke coverage through `npm run smoke:browser`.

The experiment does not establish that CI/CD or production deployment exists; those remain roadmap work.
