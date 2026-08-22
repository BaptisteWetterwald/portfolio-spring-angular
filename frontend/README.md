# Frontend

Angular SSR frontend for the portfolio.

Milestone 6 currently implements canonical `/fr` and `/en` route trees, localized static route segments, root locale redirects, lightweight runtime translations, localized metadata, request-time SSR, localized 404 placeholders, and the first public shell with semantic navigation, responsive mobile navigation, locale switching, light/dark theme preference, lighthouse theme control, and static sonar/compass navigation. Final portfolio content, project API consumption, and advanced visual/motion work are later milestones.

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
