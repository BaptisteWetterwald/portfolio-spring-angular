# Frontend

Angular 22 request-time SSR frontend for the bilingual portfolio.

## Current Application Shape

- `/fr` and `/en` each render one `PortfolioPageComponent` containing Home, Education, Experience, Projects, and Contact.
- Stable fragment IDs are `home`, `education`, `experience`, `projects`, and `contact`.
- Former localized section routes redirect to those fragments.
- `/fr/projets/:slug` and `/en/projects/:slug` remain dedicated `DETAIL` project pages.
- Projects are loaded from the Spring Boot API by route resolvers and participate in Angular's SSR transfer cache.
- Runtime FR/EN translations, localized metadata, canonical/hreflang links, localized 404s, and root locale selection are implemented.

The header is conventional. A compact sonar provides persistent section navigation, including a draggable and edge-snapping mobile presentation. One persistent lighthouse controls the theme, and its dark-mode beam is native CSS. Section anchors, daisyUI dividers, semantic timelines, keyboard states, and reduced-motion fallbacks are implemented.

Static profile, education, experience, skills, languages, and organization metadata live under `src/app/core/content`. Project content remains backend/PostgreSQL-owned.

## Commands

```bash
npm ci
npm start
npm run format:check
npm run lint
npm test
npm run build
npm run serve:ssr
npm run smoke:ssr
npm run smoke:browser
```

Run `npm run serve:ssr` only after `npm run build`. The smoke scripts expect the built SSR server to be running and default to `http://127.0.0.1:4000`.

- Override SSR smoke target with `SSR_SMOKE_ORIGIN`.
- Override browser smoke target with `BROWSER_SMOKE_ORIGIN`.
- Set `CHROME_PATH` if Chrome/Chromium is not in a recognized location.
- Set `BROWSER_SMOKE_SCREENSHOT_DIR` to retain browser-smoke screenshots.

The development server uses `proxy.conf.json` to forward `/api` to `http://localhost:8080`. The built SSR server uses `BACKEND_INTERNAL_ORIGIN` for server-side API requests and browser-facing `/api` proxying.

Theme choices use `localStorage` key `portfolio.theme` and the non-sensitive `portfolio_theme` cookie. Locale choices use `portfolio.locale` and `portfolio_locale`. Cookies allow request-time SSR to honor an explicit preference; without a theme cookie, SSR uses light and the browser may apply its system preference before hydration.
