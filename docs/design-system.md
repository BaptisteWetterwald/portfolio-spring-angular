# Design System

This document defines design foundations only. It does not specify full page layouts.

## Direction

Visual identity:

```text
modern software engineering portfolio x French naval / maritime inspiration
```

Approximate balance:

- 70% modern clean interface;
- 20% maritime visual language;
- 10% signature effects.

The interface should feel like a polished software engineering portfolio first. Maritime cues should provide structure, rhythm, and identity without becoming a simulated naval control panel.

`#0A1A2F` is the core navy reference.

## Color Foundations

The intended identity prioritizes:

- navy;
- off-white / white;
- restrained maritime blue/cyan;
- restrained French-inspired signal red.

Do not use brass/gold as a primary brand accent. A warm pale lighthouse light may exist as a decorative effect, but it does not need to become a major semantic brand token.

### Primitive Tokens

| Token              | Value     | Role                                                          |
| ------------------ | --------- | ------------------------------------------------------------- |
| `navy-950`         | `#0A1A2F` | Core navy reference, dark background, primary identity color. |
| `navy-900`         | `#10243D` | Deep surfaces and high-emphasis dark accents.                 |
| `navy-800`         | `#173456` | Secondary dark surface.                                       |
| `off-white`        | `#F7F4ED` | Nautical chart-inspired light background.                     |
| `white`            | `#FFFFFF` | Clean base surface.                                           |
| `mist-100`         | `#EEF5F8` | Cool light surface tint.                                      |
| `slate-700`        | `#334155` | Secondary text.                                               |
| `slate-500`        | `#64748B` | Muted text and icons.                                         |
| `blue-600`         | `#2563EB` | Restrained navigation blue.                                   |
| `cyan-400`         | `#22D3EE` | Limited sonar/night illumination.                             |
| `signal-red-600`   | `#D7263D` | Restrained French-inspired signal red and error base.         |
| `green-600`        | `#16A34A` | Success state.                                                |
| `amber-500`        | `#F59E0B` | Warning state.                                                |
| `lighthouse-light` | `#FFF3B0` | Decorative pale lighthouse light only.                        |

Avoid building the entire interface from navy and cyan. Signal red should be used sparingly for orientation, active navigation accents, or semantic error states.

### Semantic Tokens

| Token                   | Light Theme         | Dark Theme |
| ----------------------- | ------------------- | ---------- |
| `color-bg`              | `off-white`         | `navy-950` |
| `color-surface`         | softened near-white | `navy-900` |
| `color-surface-subtle`  | cool mist surface   | `navy-800` |
| `color-text`            | `navy-950`          | `#F8FAFC`  |
| `color-text-muted`      | `#59697F`           | `#CBD5E1`  |
| `color-border`          | `#D8E1EA`           | `#29435F`  |
| `color-link`            | `blue-600`          | `#67E8F9`  |
| `color-focus`           | `signal-red-600`    | `cyan-400` |
| `color-accent-maritime` | `blue-600`          | `cyan-400` |
| `color-accent-signal`   | `signal-red-600`    | `#FB7185`  |
| `color-error`           | `signal-red-600`    | `#FB7185`  |
| `color-success`         | `green-600`         | `#4ADE80`  |
| `color-warning`         | `amber-500`         | `#FBBF24`  |

## Light and Dark Themes

Light mode should evoke:

- daytime maritime navigation;
- nautical charts;
- off-white and softened near-white surfaces;
- navy text and structure;
- subtle red/blue navigation signals.

Dark mode should evoke:

- nighttime navigation;
- `#0A1A2F` and deeper navy;
- restrained cyan illumination;
- illuminated lighthouse details;
- optional lighthouse beam as ambient effect.

The themes should be related but not simple inversions. Dark mode can introduce more cyan illumination, while light mode should keep a calmer chart-like feel.

## Typography Roles

Choose fonts during implementation. The roles should exist regardless of font family.

| Role         | Purpose                                   |
| ------------ | ----------------------------------------- |
| `display`    | Home headline or major page heading only. |
| `heading-1`  | Page title.                               |
| `heading-2`  | Section title.                            |
| `heading-3`  | Card or subsection title.                 |
| `body`       | Default reading text.                     |
| `body-small` | Supporting text, metadata, captions.      |
| `label`      | Form labels, nav labels, badges.          |
| `code`       | Technical identifiers, if needed.         |

Typography constraints:

- Do not scale font sizes directly with viewport width.
- Keep letter spacing at `0` unless a specific font requires a small positive adjustment for labels.
- Use readable line lengths for long copy.
- Avoid oversized type inside dense tools, cards, timelines, and navigation panels.

## Spacing

Use a compact spacing scale based on `4px`.

| Token     | Value  |
| --------- | ------ |
| `space-1` | `4px`  |
| `space-2` | `8px`  |
| `space-3` | `12px` |
| `space-4` | `16px` |
| `space-5` | `24px` |
| `space-6` | `32px` |
| `space-7` | `48px` |
| `space-8` | `64px` |
| `space-9` | `96px` |

Use larger spacing for page rhythm and smaller spacing for navigation, badges, controls, and metadata.

## Borders, Radii, and Shadows

| Token           | Value    | Role                                                 |
| --------------- | -------- | ---------------------------------------------------- |
| `border-thin`   | `1px`    | Default borders.                                     |
| `border-strong` | `2px`    | Focus, selected states, and waypoint markers.        |
| `radius-sm`     | `4px`    | Small controls and tags.                             |
| `radius-md`     | `8px`    | Cards, modals, repeated items.                       |
| `radius-round`  | `999px`  | Pills, porthole frames, circular navigation markers. |
| `shadow-sm`     | subtle   | Raised controls.                                     |
| `shadow-md`     | moderate | Dialogs, menus.                                      |

Repeated cards should stay at `8px` radius or less unless a later design system explicitly changes that rule.

## Breakpoints

| Token   | Width    | Use                                      |
| ------- | -------- | ---------------------------------------- |
| `bp-sm` | `480px`  | Small phones and narrow layouts.         |
| `bp-md` | `768px`  | Tablet and mobile navigation transition. |
| `bp-lg` | `1024px` | Desktop layout.                          |
| `bp-xl` | `1280px` | Wide layout constraints.                 |

Use container constraints where practical instead of relying only on viewport breakpoints.

## Semantic States

| State          | Requirement                                                   |
| -------------- | ------------------------------------------------------------- |
| Default        | Quiet, readable, no decorative overload.                      |
| Hover          | Clear but restrained affordance.                              |
| Active/current | Visible state, may use signal red or sonar/compass marker.    |
| Focus          | High-contrast visible focus ring.                             |
| Disabled       | Lower contrast but still legible where text is present.       |
| Loading        | Stable layout, no content jump.                               |
| Error          | Clear message and recovery path using semantic error styling. |
| Success        | Confirm action without excessive animation.                   |

## Theme Handling

Support light and dark themes through semantic tokens.

Theme source priority:

1. explicit user choice;
2. system preference;
3. default theme.

The theme toggle should use a lighthouse concept visually, but the underlying control must remain a normal accessible button or switch.

### Milestone 6 Token and Theme Baseline

Milestone 6 introduces the first implemented CSS custom properties in `frontend/src/styles.css`:

- semantic color tokens for background, surface, text, muted text, border, link, focus, maritime accent, signal accent, and lighthouse light;
- spacing tokens from `--space-1` through `--space-8`;
- radius tokens for small, medium, and round controls;
- small and medium shadow tokens;
- global visible focus styling;
- global reduced-motion defaults.

The implementation uses Tailwind and DaisyUI infrastructure, but the visible identity comes from portfolio-level CSS variables and component styles rather than default DaisyUI themes.

Light mode uses the off-white nautical chart background with navy text. Large surfaces should avoid pure clinical white; use softened near-white, cool mist, or very lightly warm surfaces while preserving strong contrast and clear separation between page background, header/footer, and navigation instruments. Dark mode uses deep navy surfaces with restrained cyan illumination. Signal red is limited to active navigation and orientation markers. Brass/gold remains unused as a major brand color.

The lighthouse theme control is a simple button with a CSS lighthouse icon. Dark mode illuminates the lantern, but the moving beam is deferred to the motion milestone.

## Maritime Motifs

Required or likely motifs:

- sonar / compass / rose des vents for primary visual navigation;
- nautical route / waypoints for Education and Experience timelines;
- porthole framing for portrait;
- lighthouse theme toggle;
- optional lighthouse beam in dark mode;
- bathymetric contour lines as low-contrast texture;
- waves as subtle transitions;
- sonar ping for restrained interaction feedback.

These motifs should be sparse, slow, and secondary to content.

Milestone 6 implements only the structural motifs:

- static sonar/compass navigation rings and waypoint markers in a compact radial geometry;
- a simple lighthouse theme toggle.

Advanced sonar sweeps, pings, lighthouse beams, waves, bathymetric textures, and final motion polish remain deferred.

Milestone 10 adds the first restrained motion layer:

- a dark-mode lighthouse beam as the primary signature effect;
- one hover/focus sonar ripple around real navigation markers;
- no retained ambient wave, parallax, bathymetric drift, or replacement background animation;
- a complete reduced-motion baseline for the new looping effects.

Post-Milestone-10 persistent-control experiment:

- after the original header and full sonar scroll away, the shell may show compact floating maritime instruments;
- the left instrument is the same sonar navigation language in a compact state that expands to reveal the five route waypoints;
- the right instrument is the same lighthouse theme control, scaled as a floating control and still backed by the theme service;
- the lighthouse beam follows the active visible lighthouse source and may subtly illuminate page surfaces through compositing;
- mobile uses smaller side controls and tap expansion, while retaining the conventional mobile menu.

The visual priority remains content first, maritime identity second, and motion third. Light mode keeps the lighthouse inactive and avoids the viewport beam.

## DaisyUI Direction for Milestone 9+

DaisyUI is installed in the frontend and should be used from Milestone 9 onward where it provides a good reusable primitive. The official component catalogue should be consulted for suitable primitives such as buttons, badges, cards, timeline, fieldset, inputs, textarea, validator, drawer/menu patterns, and Hover 3D Card: <https://daisyui.com/components/>.

The design principle is:

```text
DaisyUI = reusable UI primitives
Tailwind = layout, composition, adaptation
Custom CSS/SVG/Angular = distinctive maritime identity and behavior
```

Use DaisyUI selectively. The goal is not to make every element a DaisyUI component. Continue to use custom CSS/SVG/Angular for identity-specific pieces such as:

- sonar/compass navigation;
- lighthouse theme toggle and future beam;
- waves;
- bathymetric or maritime decorative geometry;
- bespoke motion/animation;
- components whose identity cannot reasonably come from DaisyUI.

The daisyUI Codex plugin can provide current daisyUI skill guidance to Codex when installed: <https://daisyui.com/docs/plugin/codex/>. It is not part of the current repository setup and should not be installed or configured globally without explicit authorization.

### Milestone 9 Component Strategy

Milestone 9 uses the installed local daisyUI Codex skill only. Do not use or install the paid daisyUI MCP.

Implementation matrix:

| Area                             | M9 strategy              | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header                           | Hybrid daisyUI/custom    | Use `navbar`, `menu`, and `btn` as accessible primitives. Keep shell geometry, exact route state, skip link, and maritime surface styling custom.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Footer                           | Hybrid daisyUI/custom    | Use `footer` and `link` primitives while retaining custom chart-like surface treatment and exact active links.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Theme toggle                     | Hybrid daisyUI/custom    | Use button semantics and a daisyUI `btn` foundation. Keep the lighthouse drawing and illuminated lantern custom. Defer lighthouse beam work to a later motion/polish milestone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Locale switcher                  | DaisyUI-led              | Use `join` and compact `btn` anchors with custom active-state integration.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Sonar/compass                    | Custom                   | Keep semantic links and custom SVG/CSS instrument geometry. Rings must use consistent radial spacing around a balanced center, with only symmetrical radial lines and no arbitrary cone/triangle markers. DaisyUI is not a good fit for the signature navigation itself.                                                                                                                                                                                                                                                                                                                                                                                            |
| Home hero                        | Custom                   | Render the approved owner portrait inside a restrained circular porthole/navigation frame. Use the original portrait asset as the image source and CSS object cropping for the circular presentation; do not create a manually cropped square derivative or apply heavy filters/blur/overlays.                                                                                                                                                                                                                                                                                                                                                                      |
| Home navigation/content surfaces | Removed in M9 correction | Do not render redundant Home route cards because header navigation, signature sonar, mobile navigation, and footer navigation already cover portfolio navigation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Skills                           | Hybrid daisyUI/custom    | Use `card` for skill groups and `badge` for technologies. Preserve importance classes and data attributes for the primary/professional/secondary/exploratory hierarchy. Skill cards are informational surfaces, not clickable controls.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Experience                       | Hybrid daisyUI/custom    | Use daisyUI `timeline`, `timeline-start`, `timeline-middle`, `timeline-end`, and `<hr>` geometry first, then style it as a plotted maritime route. Desktop entries alternate around one central route; mobile uses compact one-sided behavior. Preserve chronological DOM order, visible dates, and organization names. Optional organization logos belong in the card metadata column under the period on desktop, then reflow beside the organization name on mobile. The desktop card header may use a compact metadata/identity split, but summaries, responsibility lists, and technology badges should span the card width so detailed roles remain readable. |
| Education                        | Hybrid daisyUI/custom    | Same daisyUI-first timeline strategy as Experience, with education-specific content and order unchanged. Optional school logos and official links follow the same secondary identity-area treatment.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Projects list                    | Hybrid daisyUI/custom    | Use `card`, `badge`, and `btn` primitives. Featured projects receive stronger presentation than standard or archived projects. Presentation mode controls detail-page availability and is not a visual-importance field.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Project detail                   | Hybrid daisyUI/custom    | Use badges and buttons for archived status, technologies, and actions. Public `PUBLISHED` status is not shown as a visitor-facing badge. Mockup wrappers are deferred until the API/content can distinguish screenshots from logos/media references.                                                                                                                                                                                                                                                                                                                                                                                                                |
| Contact                          | Hybrid daisyUI/custom    | Establish a visual contact surface using `card` without inventing contact data or fake form submission. Form primitives remain reserved for a later real contact milestone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

Approved daisyUI components for M9:

- `btn` for commands and prominent links.
- `badge` for technologies, statuses, and restrained metadata.
- `card` for repeated content surfaces and project presentation foundations.
- `timeline` for Experience and Education structure, combined with custom route styling.
- `navbar`, `menu`, `footer`, `link`, and `join` for shell primitives.
- `aura` remains approved only as a rare future focal accent, but the M9 correction removes the previous Home aura because the redundant navigation-card section was removed.

Deferred or constrained components:

- `mockup-browser`, `mockup-phone`, and `mockup-code` are approved for future project showcases, but M9 does not apply them to generic `logoMediaRef` values because the current API does not prove that a media item is a screenshot, phone capture, or code sample.
- `hover-3d` is deferred. The official component requires noninteractive content or a whole-card link, while current project cards contain separate detail, GitHub, and demo links.
- Form components (`fieldset`, `input`, `textarea`, `validator`) are reserved for a later real contact implementation. Do not build a fake contact backend or inert form.

### Milestone 9 Visual Hierarchy

Skills must remain visually weighted:

- primary software engineering and backend/full-stack skills receive the strongest surfaces and badges;
- professional/complementary skills remain prominent but quieter than the primary stack;
- secondary skills are discoverable without competing with primary skills;
- exploratory/historical skills use the quietest treatment.

AI-assisted engineering remains a secondary developer-tooling area. Visual emphasis must not imply AI Engineer, ML Engineer, LLM Engineer, MCP expert, or agentic AI expert positioning.

Project presentation must support three future prominence levels:

- featured/flagship projects: strongest card treatment, optional aura or mockup only when real content supports it;
- standard projects: normal project cards with technologies and actions;
- archived/minor projects: quieter surfaces and lower visual weight.

The existing `featured` and `ARCHIVED` backend concepts are enough for M9. Do not add a project-importance persistence field until real project content proves it is necessary.

Projects detail pages should read as compact software-engineering case studies rather than raw field dumps. Use a restrained hero with title, pitch, actions, and a technical overview derived from existing project data, then render ordered localized sections with comfortable prose measure. The layout must remain complete when no media exists; do not render empty mockups, galleries, or placeholder frames.

Project card action hierarchy should favor the portfolio detail action for `DETAIL` entries. External links such as GitHub or demo URLs remain secondary, keyboard-accessible links with explicit external-link semantics. `CARD_ONLY` cards must not receive fake detail affordances or padding content.

### Milestone 9 Maritime Identity Rules

Maritime identity should come from instrument-like details rather than literal theming:

- compass bearings, plotted-route lines, waypoint markers, porthole-like circular details, subtle lighthouse light, restrained wave edges, and low-contrast bathymetric/chart lines are appropriate;
- fake telemetry, targeting language, pirate elements, military roleplay, and literal ship dashboards are not appropriate;
- light mode should feel like daylight navigation charts using warm off-white, navy text, cool mist separation, and restrained red/blue accents;
- dark mode should feel like nighttime navigation using deep navy, restrained cyan illumination, and subtle lighthouse accents.

Motion remains progressive enhancement in M9. A static state must communicate the same meaning as any animated hover, focus, sonar, aura, or lighthouse treatment.

### Milestone 9 Owner-Review Corrections

The corrected M9 Home page does not include a secondary portfolio-navigation card section. Page navigation is provided by the header, desktop sonar/compass, mobile menu, and footer. The Home flow is hero, primary technologies, skills/domains, and future featured projects only when real backend project content exists.

The Home hero's right side now uses the approved owner portrait in the porthole frame. On desktop and large tablets, the portrait balances the Hero text in the right column. On mobile, it sits beside the name/identity block before the biography; very narrow screens may stack it directly after the name while still keeping it before the role, stack, and biography. This keeps the portrait part of the identity hierarchy without creating excessive vertical whitespace before the primary technology section. Keep the portrait natural and recognizable. Crop it responsively with `object-fit: cover` and `object-position`; do not add a generated avatar, stock substitute, heavy filter, artificial blur, excessive overlay, or manually cropped square derivative.

The main sonar remains the signature navigation instrument. Its SVG geometry should stay clean: evenly spaced concentric rings, a balanced center, symmetrical axes, real destination links close to the instrument, and no random triangle/cone markers.

The lighthouse header toggle should not render a beam in M9. Dark mode is communicated by the illuminated lantern and subtle glow only. A credible rotating lighthouse beam remains deferred to the later motion/polish milestone.

Skill cards remain informational. Do not add click behavior, `cursor: pointer`, strong scaling, or any effect that implies navigation. A subtle desktop-only border/shadow/1px lift is acceptable for materiality.

Education and Experience timelines must use daisyUI timeline geometry first: one central continuous route, waypoints on that route, alternating `timeline-start` and `timeline-end` entries on desktop, `<hr>` route segments between points, and `max-md:timeline-compact` for narrow viewports. Custom CSS may style route color, waypoints, and card surfaces, but must not replace the daisyUI layout with a detached custom rail.

Timeline entries may expose an optional logo asset and official website URL. Logos are secondary identity marks with normalized display dimensions, regardless of source aspect ratio. On desktop timeline cards, logos sit below the date/period in the left metadata column so they use otherwise empty space; the organization or school name stays in the right content column. Experience cards use that split only for the compact header; their summary, responsibility bullets, and technology badges span the full card width below the header to avoid constraining detailed work into a narrow column. Education cards keep the simpler compact period/logo and school-content composition. On mobile, the same logo may reflow beside the organization or school name. When an official URL is present, only the logo and/or name may be scoped links with external-link semantics; never turn the whole timeline card into a link. Prefer official organization or school websites over LinkedIn pages. Do not add logos unless approved logo assets are provided. The durable asset convention is `frontend/public/assets/logos/<organization-slug>.<ext>`; when existing owner-supplied filenames differ, typed facts must reference the exact local asset path until the files are safely normalized.

## Anti-Patterns

Avoid:

- cyberpunk aesthetics;
- videogame HUD layouts;
- submarine OS interfaces;
- excessive neon;
- fake telemetry;
- radar screens pretending to show real data;
- military roleplay language or targeting metaphors;
- dense cockpit panels;
- decorative charts with no real meaning;
- animations that block reading or navigation.
