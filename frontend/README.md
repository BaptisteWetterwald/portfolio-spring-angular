# Frontend

Angular SSR frontend for the portfolio.

Milestone 5 currently implements canonical `/fr` and `/en` route trees, localized static route segments, root locale redirects, lightweight runtime translations, localized metadata, request-time SSR, and localized 404 placeholders. Final portfolio content, project API consumption, and the visual system are later milestones.

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
