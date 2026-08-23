# Motion Guidelines

This document defines future motion principles. It does not implement components or animations.

## Principles

- Motion supports orientation, feedback, and brand character.
- Content remains readable while motion is present.
- Navigation never depends solely on animation.
- Prefer CSS and SVG before JavaScript animation libraries.
- Respect `prefers-reduced-motion`.
- Keep the maritime layer subtle and professional.

Milestone 9 uses motion only as restrained progressive enhancement. The visual system may include short hover/focus transitions and very subtle material response on informational surfaces. It must not introduce competing ambient loops, lighthouse beams, scroll choreography, or motion-dependent navigation. Complex sonar pings, animated waves, rotating beams, bathymetric drift, and GSAP choreography remain Milestone 10 or later work unless a focused accessibility-safe need is identified.

## Motion Scale

| Token | Duration | Use |
| --- | --- | --- |
| `motion-fast` | `120ms` | Hover, press, focus reinforcement. |
| `motion-base` | `180ms` | Menu open/close, theme transition. |
| `motion-slow` | `320ms` | Page-level transitions and larger reveals. |
| `motion-ambient` | `6s+` | Optional looping wave/beam movement. |

Use easing that feels calm and precise, not elastic or arcade-like.

## Sonar / Compass / Rose Des Vents Navigation

This is a major visual navigation concept for the portfolio, not merely decorative animation.

Purpose:

- provide a signature primary navigation treatment;
- reinforce orientation across Home, Education, Experience, Projects, and Contact;
- preserve normal accessible links.

Guidelines:

- implement visual compass/sonar elements as enhancement around real navigation anchors;
- selected route may show a subtle pulse, bearing marker, or rose des vents state;
- hover/focus feedback should be quick and restrained;
- signal red may be used sparingly for current route or orientation marks;
- do not simulate targeting, tracking, fake telemetry, or military systems;
- reduced motion mode should show a static selected marker.

Milestone 6 implements only the static foundation: SVG/CSS compass rings, waypoint markers, exact active state, and real router links. Its desktop geometry should stay compact and radial, with destinations visually associated with the radar circumference rather than spread across a wide rectangular panel. There is no sweep, ping loop, fake targeting, coordinates, or telemetry. Future animation should build on this component without making navigation motion-dependent.

Future M9/M10 exploration: consider whether the large sonar navigation should have an optional compact or floating state once users scroll into page content. A compact control could reuse the same localized route model and active-state semantics, and could expand on hover, click, or focus to reveal the five destinations. This must be evaluated against the conventional header, the large signature sonar, and footer navigation so the site does not present redundant navigation systems with the same purpose at the same time.

M9 evaluation result: the floating/compact sonar is deferred. Header links, the desktop signature sonar, the mobile menu, and footer links already provide enough route access for the current page lengths.

## Lighthouse Theme Toggle

Purpose:

- connect light/dark theme switching to the maritime concept.

Guidelines:

- underlying control remains a button or switch with accessible name/state;
- light/dark transition may use a short beam or aperture effect;
- the effect should not flash rapidly;
- state must be clear without animation.

Milestone 6 implements the lighthouse as a simple accessible button. The dark state illuminates the lantern statically. The M9 owner-review correction keeps this approach and removes the experimental static beam. Moving or realistic lighthouse beams and transition choreography remain deferred.

## Lighthouse Beam

Possible uses:

- optional dark-mode ambient effect;
- theme transition;
- subtle section reveal.

Guidelines:

- use a warm pale lighthouse light only as a decorative effect;
- prefer CSS gradients or SVG masks;
- avoid sweeping beams over long reading text;
- keep opacity low;
- disable looping beam in reduced motion.

## Nautical Timeline

Possible uses:

- Education chronology;
- Experience chronology;
- route/waypoint metaphor.

Guidelines:

- timeline must remain semantic HTML;
- use daisyUI's timeline geometry first: one central route, waypoints on the route, desktop start/end alternation, and compact one-sided mobile behavior;
- line and marker styling can borrow from route maps or nautical charts;
- avoid coordinates or telemetry unless real and meaningful;
- current/featured points can use restrained blue or signal red accents.

## Porthole Portrait

Primary use:

- portrait framing on Home.

Guidelines:

- porthole should be a frame or mask, not a decorative card inside another card;
- preserve image aspect ratio and alt text;
- avoid excessive metallic realism;
- reduced motion mode should remove image drift/parallax.

## Waves

Possible uses:

- section transitions;
- subtle background rhythm;
- loading skeleton accent.

Guidelines:

- prefer SVG paths, CSS masks, or low-cost transforms;
- keep waves low contrast;
- avoid large animated backgrounds behind dense text;
- pause or simplify on reduced motion.

## Bathymetric / Nautical Chart Graphics

Possible uses:

- low-contrast backgrounds;
- project or section texture;
- footer detail.

Guidelines:

- use contour-like lines sparingly;
- keep contrast below content prominence;
- never let contours reduce text readability;
- static SVG is preferred.

## Sonar Ping Feedback

Possible uses:

- selected navigation state;
- successful interaction confirmation;
- project filter selection.

Guidelines:

- use one or two rings at most;
- keep duration short;
- avoid infinite pulses except rare ambient moments;
- do not use sonar as a loading spinner for long operations.

## GSAP Use

GSAP may be justified when:

- multiple SVG elements need coordinated timelines;
- scroll-linked choreography becomes hard to maintain with CSS;
- timeline control needs pause/resume/reverse behavior;
- performance and accessibility can be verified.

Do not add GSAP for simple fades, transforms, hover states, or theme transitions.

## Performance Requirements

- Animate transform and opacity where possible.
- Avoid layout-triggering animation on frequently updated elements.
- Keep SVG complexity reasonable.
- Test on mobile viewport sizes.
- Provide static fallbacks.

## Non-Goals

- No motion implementation in the specification phase.
- No submarine operating system styling.
- No cyberpunk or videogame HUD.
- No fake telemetry or military roleplay.
- No simulated sonar screen as the only navigation.
- No animation that delays access to content.
