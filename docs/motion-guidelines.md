# Motion Guidelines

This document describes the motion currently implemented and the rules for extending it.

## Principles

- Motion supports orientation, feedback, and maritime character.
- Content and navigation never depend on animation.
- Prefer native CSS/SVG and browser observers for the current effects.
- Respect `prefers-reduced-motion` globally and within each animated component.
- Keep loops slow, sparse, low-opacity, and decorative.
- Do not add GSAP unless future choreography cannot be maintained cleanly with CSS/SVG.

## Current Motion Inventory

| Area                        | Standard motion                            | Reduced-motion behavior        |
| --------------------------- | ------------------------------------------ | ------------------------------ |
| Explicit section navigation | Native smooth `scrollIntoView`             | Instant scrolling              |
| Header-to-sonar handoff     | Short opacity/transform transition         | Immediate state change         |
| Floating sonar expansion    | CSS opacity/transform deployment           | Immediate/static expansion     |
| Sonar waypoint feedback     | One short hover/focus ripple               | Static ring emphasis           |
| Lighthouse beam             | Slow continuous CSS rotation in dark mode  | Static low-opacity beam        |
| Theme/control feedback      | Short color, glow, and surface transitions | Transitions compressed/removed |

There is no page-introduction choreography, scroll-linked parallax, path morphing, particle layer, ambient bathymetric drift, or animated Home wave.

## Section Navigation and Scroll Spy

Plain primary activation of a section link creates the Angular navigation/history entry and then scrolls to the section. Keyboard activation may focus the section root; pointer navigation does not steal focus. Direct fragments and browser back/forward use instant positioning so no new history entry is created.

Scroll-spy uses `IntersectionObserver` only to update active-section state. It does not animate the document, update the URL, or run a permanent scroll listener.

## Header-to-Sonar Handoff

On wide viewports, `PublicLayoutComponent` observes header visibility. Separate thresholds for leaving and returning provide hysteresis. The transition fades/scales conventional navigation out and the compact sonar in.

The handoff is not a continuous scroll-linked animation. If focus is inside the outgoing header or sonar, that control stays operable until focus leaves. Reduced motion removes the transition while keeping the same state model.

## Sonar Navigation

The sonar is semantic navigation built around real links. Its marker ripple is a one-shot hover/focus acknowledgement, not an ambient pulse or loading indicator.

The floating panel expands from the compact core using CSS transforms and opacity. On mobile, pointer movement repositions the collapsed bubble; release snaps it to an edge. Expansion is calculated to remain inside viewport bounds and away from the persistent lighthouse.

Do not introduce sweep loops, fake tracking, coordinates, or telemetry.

## Lighthouse Theme Toggle and Beam

One persistent lighthouse button controls the theme. It remains in the DOM and in the same viewport position model during header/sonar handoff.

The beam is:

- a single fixed CSS gradient wedge;
- emitted only in dark mode;
- `pointer-events: none` and `aria-hidden`;
- positioned after hydration from the persistent lantern using guarded DOM measurement;
- remeasured for viewport/container resize;
- rotated entirely by a CSS keyframe;
- static at reduced opacity when reduced motion is requested.

There is no second header lighthouse, source-switch observer, collision detection, per-card lighting state, or JavaScript animation loop.

## Timelines, Portrait, and Dividers

Education and Experience use static route lines and waypoints. Any future timeline reveal must preserve chronological reading order and complete static rendering.

The porthole portrait is static; it has no parallax or drift. Section permalink anchors and daisyUI divider waypoints use only restrained hover/focus or surface treatment and do not require motion to communicate their purpose.

## Rejected or Removed Motion

Decorative Home SVG waves and related path/transform animation were evaluated and removed. They are historical experiments, not deferred implemented features. The current design also omits ambient bathymetric motion, page-wide parallax, and particles.

## Performance and Safety

- Animate transform and opacity where possible.
- Guard browser APIs from SSR and initialize layout measurement after render.
- Throttle repeated measurement through animation frames where needed.
- Keep decorative layers noninteractive.
- Test mobile viewport bounds and horizontal overflow.
- Preserve usable static states when observers or motion APIs are unavailable.

## Non-Goals

- no motion-dependent navigation;
- no fake sonar telemetry or military effects;
- no animation that blocks reading;
- no new animation library for simple fades, transforms, beams, or hover feedback.
