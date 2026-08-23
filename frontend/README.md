# Frontend

Angular SSR frontend for the portfolio.

Milestone 9 currently implements canonical `/fr` and `/en` route trees, localized static route segments, root locale redirects, lightweight runtime translations, localized metadata, request-time SSR, localized 404 handling, API-backed project pages, approved static Home/Education/Experience content, and the maritime visual-system baseline.

The shell uses semantic navigation, responsive mobile navigation, locale switching, light/dark theme preference, a custom lighthouse theme control, and a custom sonar/compass navigation enhancement. DaisyUI is used selectively for reusable primitives such as buttons, badges, cards, menu/navbar/footer structures, timeline structure, and join controls. Custom CSS/SVG remains responsible for the maritime identity.

Home intentionally does not render secondary navigation cards. Its right-hand hero area renders the approved portrait in a circular porthole frame, using CSS object cropping from the original portrait asset rather than a manually cropped derivative. Education and Experience entries use frontend-owned static facts for official website links and approved logo assets. Mockup project showcases, hover-3d surfaces, real contact forms, social links, CV downloads, lighthouse beam work, and advanced motion remain deferred until approved content or later milestones justify them.

## Commands

```bash
npm install
npm start
npm run format:check
npm run lint
npm test
npm run build
npm run serve:ssr
npm run smoke:ssr
```

Run `npm run serve:ssr` after `npm run build` to start the built SSR server.

The theme preference uses browser `localStorage` key `portfolio.theme` and mirrors explicit choices to a non-sensitive `portfolio_theme` cookie so request-time SSR can render the selected theme when present. Without an explicit choice, the browser uses `prefers-color-scheme`; SSR falls back to light.

`npm run smoke:ssr` expects the built SSR server to already be running. Verified sequence:

1. `npm run build`
2. `npm run serve:ssr`
3. In another terminal, run `npm run smoke:ssr`

By default the smoke script checks `http://127.0.0.1:4000`. Override the target with `SSR_SMOKE_ORIGIN`, for example:

```powershell
$env:SSR_SMOKE_ORIGIN = 'http://127.0.0.1:4308'
npm run smoke:ssr
```

If an IDE runtime resolves an older Node.js version, use the system Node executable directly:

```powershell
& 'C:\Program Files\nodejs\node.exe' .\node_modules\@angular\cli\bin\ng.js build
```
