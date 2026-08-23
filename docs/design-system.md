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

| Token | Value | Role |
| --- | --- | --- |
| `navy-950` | `#0A1A2F` | Core navy reference, dark background, primary identity color. |
| `navy-900` | `#10243D` | Deep surfaces and high-emphasis dark accents. |
| `navy-800` | `#173456` | Secondary dark surface. |
| `off-white` | `#F7F4ED` | Nautical chart-inspired light background. |
| `white` | `#FFFFFF` | Clean base surface. |
| `mist-100` | `#EEF5F8` | Cool light surface tint. |
| `slate-700` | `#334155` | Secondary text. |
| `slate-500` | `#64748B` | Muted text and icons. |
| `blue-600` | `#2563EB` | Restrained navigation blue. |
| `cyan-400` | `#22D3EE` | Limited sonar/night illumination. |
| `signal-red-600` | `#D7263D` | Restrained French-inspired signal red and error base. |
| `green-600` | `#16A34A` | Success state. |
| `amber-500` | `#F59E0B` | Warning state. |
| `lighthouse-light` | `#FFF3B0` | Decorative pale lighthouse light only. |

Avoid building the entire interface from navy and cyan. Signal red should be used sparingly for orientation, active navigation accents, or semantic error states.

### Semantic Tokens

| Token | Light Theme | Dark Theme |
| --- | --- | --- |
| `color-bg` | `off-white` | `navy-950` |
| `color-surface` | softened near-white | `navy-900` |
| `color-surface-subtle` | cool mist surface | `navy-800` |
| `color-text` | `navy-950` | `#F8FAFC` |
| `color-text-muted` | `slate-500` | `#CBD5E1` |
| `color-border` | `#D8E1EA` | `#29435F` |
| `color-link` | `blue-600` | `#67E8F9` |
| `color-focus` | `signal-red-600` | `cyan-400` |
| `color-accent-maritime` | `blue-600` | `cyan-400` |
| `color-accent-signal` | `signal-red-600` | `#FB7185` |
| `color-error` | `signal-red-600` | `#FB7185` |
| `color-success` | `green-600` | `#4ADE80` |
| `color-warning` | `amber-500` | `#FBBF24` |

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

| Role | Purpose |
| --- | --- |
| `display` | Home headline or major page heading only. |
| `heading-1` | Page title. |
| `heading-2` | Section title. |
| `heading-3` | Card or subsection title. |
| `body` | Default reading text. |
| `body-small` | Supporting text, metadata, captions. |
| `label` | Form labels, nav labels, badges. |
| `code` | Technical identifiers, if needed. |

Typography constraints:

- Do not scale font sizes directly with viewport width.
- Keep letter spacing at `0` unless a specific font requires a small positive adjustment for labels.
- Use readable line lengths for long copy.
- Avoid oversized type inside dense tools, cards, timelines, and navigation panels.

## Spacing

Use a compact spacing scale based on `4px`.

| Token | Value |
| --- | --- |
| `space-1` | `4px` |
| `space-2` | `8px` |
| `space-3` | `12px` |
| `space-4` | `16px` |
| `space-5` | `24px` |
| `space-6` | `32px` |
| `space-7` | `48px` |
| `space-8` | `64px` |
| `space-9` | `96px` |

Use larger spacing for page rhythm and smaller spacing for navigation, badges, controls, and metadata.

## Borders, Radii, and Shadows

| Token | Value | Role |
| --- | --- | --- |
| `border-thin` | `1px` | Default borders. |
| `border-strong` | `2px` | Focus, selected states, and waypoint markers. |
| `radius-sm` | `4px` | Small controls and tags. |
| `radius-md` | `8px` | Cards, modals, repeated items. |
| `radius-round` | `999px` | Pills, porthole frames, circular navigation markers. |
| `shadow-sm` | subtle | Raised controls. |
| `shadow-md` | moderate | Dialogs, menus. |

Repeated cards should stay at `8px` radius or less unless a later design system explicitly changes that rule.

## Breakpoints

| Token | Width | Use |
| --- | --- | --- |
| `bp-sm` | `480px` | Small phones and narrow layouts. |
| `bp-md` | `768px` | Tablet and mobile navigation transition. |
| `bp-lg` | `1024px` | Desktop layout. |
| `bp-xl` | `1280px` | Wide layout constraints. |

Use container constraints where practical instead of relying only on viewport breakpoints.

## Semantic States

| State | Requirement |
| --- | --- |
| Default | Quiet, readable, no decorative overload. |
| Hover | Clear but restrained affordance. |
| Active/current | Visible state, may use signal red or sonar/compass marker. |
| Focus | High-contrast visible focus ring. |
| Disabled | Lower contrast but still legible where text is present. |
| Loading | Stable layout, no content jump. |
| Error | Clear message and recovery path using semantic error styling. |
| Success | Confirm action without excessive animation. |

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

Advanced sonar sweeps, pings, lighthouse beams, waves, bathymetric textures, porthole portrait treatment, and nautical timelines remain deferred to Milestones 9 and 10.

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
