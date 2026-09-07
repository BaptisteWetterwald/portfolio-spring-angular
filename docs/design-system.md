# Design System

This document records the visual system currently implemented in the portfolio. It defines durable design contracts rather than milestone history or exact animation tuning constants.

## Direction

```text
modern software engineering portfolio x restrained French Navy / maritime identity
```

The interface should read as a professional software-engineering portfolio first. Maritime elements provide hierarchy, orientation, and identity without imitating a ship, submarine, military display, or videogame HUD.

## Color System

The core palette is:

- deep navy (`#0A1A2F`) for identity and dark surfaces;
- warm off-white for the light document background;
- softened near-white and cool mist for layered light surfaces;
- restrained blue/cyan for technical and navigation accents;
- restrained signal red for waypoints, current state, and errors;
- pale warm light for the lighthouse effect only.

Light mode evokes a daylight navigation chart with navy text and restrained blue/red signals. Dark mode uses deeper navy surfaces, light text, and limited cyan illumination. The themes are related, not simple inversions.

Semantic CSS custom properties in `frontend/src/styles.css` own background, surface, text, muted text, borders, links, focus, maritime accent, signal accent, chart lines, shadows, spacing, radii, motion timing, and lighthouse-beam values. Components should consume these tokens instead of creating unrelated local palettes.

Signal red must remain sparse. Cyan should not turn the entire site neon. Brass/gold is not a primary brand color.

## Typography, Spacing, and Surfaces

- Major headings are prominent but remain proportionate to a content-first portfolio.
- Long prose uses readable line lengths and normal letter spacing.
- The spacing scale is based on 4px and is exposed through `--space-*` properties.
- Cards use restrained radii, borders, and shadows rather than glass-heavy or highly inflated surfaces.
- Focus indicators must remain visible in both themes.
- Repeated project, skill, language, education, and experience content keeps consistent visual rhythm.

## Implemented Maritime Language

| Element              | Current treatment                                                     |
| -------------------- | --------------------------------------------------------------------- |
| Portrait             | Approved portrait cropped with CSS inside a circular porthole frame   |
| Education/Experience | Semantic daisyUI timelines styled as one plotted route with waypoints |
| Navigation           | Conventional header/footer plus compact sonar waypoint navigation     |
| Theme                | One persistent floating lighthouse button                             |
| Dark-mode ambience   | One low-opacity rotating lighthouse beam                              |
| Interaction feedback | A short sonar waypoint ripple on hover/focus                          |
| Section links        | Small anchor-icon permalinks for all five canonical fragments         |
| Section rhythm       | Four restrained daisyUI dividers with centered route waypoints        |

The Home permalink belongs to the hero eyebrow row. It must not be placed beside the person's name. Standard section permalinks sit with the Education, Experience, Projects, and Contact headings. Their SVG is decorative; the link itself has a localized accessible name.

Decorative Home SVG waves, ambient bathymetric drift, parallax, particles, and replacement background animation are not implemented. The earlier Home wave experiment was removed and must not be presented as part of the current design.

## Navigation Controls

The header uses a conventional daisyUI/custom navbar presentation and contains no embedded sonar or lighthouse.

On wide viewports, header navigation hands off to the compact floating sonar after the header leaves the primary viewing area. Hysteresis prevents brittle threshold flicker. The handoff preserves focused controls instead of forcibly relocating keyboard focus.

On mobile, the compact sonar behaves as a draggable bubble. It snaps to the left or right viewport edge, respects safe areas and the lighthouse position, and expands inward without escaping the viewport.

The footer provides conventional text navigation. All presentations share real localized fragment links and the same active-section state.

## Lighthouse and Theme

There is exactly one lighthouse control. It floats persistently on the right and is independent of the header-to-sonar handoff.

The control remains a normal button with an accessible label and `aria-pressed`. `ThemePreferenceService` applies `data-theme`, stores explicit browser preferences, and mirrors them to a non-sensitive cookie for SSR.

Dark mode illuminates the lantern and enables the rotating beam. Light mode has no viewport beam. The beam is a single fixed, pointer-events-none, `aria-hidden` CSS effect measured from the one persistent lantern after hydration. There is no header-lighthouse-to-floating-lighthouse source switch.

## DaisyUI, Tailwind, and Custom CSS

The implemented division of responsibility is:

```text
daisyUI     reusable primitives and structural classes
Tailwind    local layout/composition utilities
Custom CSS  maritime identity, bespoke responsive geometry, and motion
```

Current daisyUI use includes buttons, badges, cards, navbar/menu/footer/join structures, timeline geometry, and major-section dividers. Sonar geometry, the lighthouse drawing/beam, porthole styling, route details, and mobile drag behavior remain custom.

Do not force identity components into a generic library primitive. Conversely, do not recreate buttons, cards, badges, menus, or timelines from scratch when the existing daisyUI structure is already suitable.

Mockup, Aura, Hover 3D, and contact-form primitives are not part of the current public implementation. Project media remains too generic to infer browser, phone, or code mockups, and Contact has no form backend.

## Content Hierarchy

Skill surfaces reflect the typed importance hierarchy:

1. primary software engineering/backend-full-stack;
2. professional/complementary data and enterprise experience;
3. secondary broader software and AI-assisted tooling;
4. exploratory/historical technologies.

Skill cards are informational and must not look clickable.

Project cards distinguish featured, standard published, and archived content using existing API fields. Presentation mode controls whether a detail action exists; it is not a visual-importance field. `CARD_ONLY` cards must not receive fake detail affordances.

Project details remain complete with no media. Structured section headings and content form a compact case study; absent media must not create empty frames.

## Timeline Rules

Education and Experience preserve chronological DOM order and semantic `<time>` elements. DaisyUI supplies the central route, alternating desktop geometry, and compact one-sided mobile behavior.

Organization/school logos are optional secondary identity marks. They use local assets, normalized contain sizing, and scoped external links where an official URL exists. The whole card must not become a link. Experience details span the card width so long summaries and responsibility lists remain readable.

## Responsive and Accessible States

- All navigation and theme controls remain keyboard accessible.
- Hover feedback has a focus-visible equivalent when it conveys interaction.
- Mobile layouts must not introduce horizontal overflow.
- Hidden handoff navigation is inert and absent from the accessibility tree.
- Active section state uses more than color and exposes `aria-current="location"`.
- Reduced-motion mode removes scrolling/expansion choreography and looping beam rotation while keeping static state understandable.

## Anti-Patterns

Avoid:

- cyberpunk, cockpit, submarine-OS, or videogame-HUD layouts;
- fake telemetry, targeting language, and military roleplay;
- excessive neon, glow, or decorative controls;
- generated or heavily filtered portrait substitutes;
- decorative waves or background motion competing with content;
- animations that delay or gate navigation;
- invented project media, contact information, or interaction affordances.
