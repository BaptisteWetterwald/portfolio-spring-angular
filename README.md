# Baptiste Wetterwald Portfolio

Bilingual personal portfolio for Baptiste Wetterwald, a graduated Engineer in Computer Science and Networks.

Primary positioning:

- Software Engineer - Backend / Full-stack.

## Repository Structure

```text
frontend/  Angular SSR application
backend/   Spring Boot application
docs/      Product and architecture documentation
```

No Docker, PostgreSQL schema, CI/CD, deployment, portfolio UI, project domain, or i18n implementation exists yet.

## Frontend

Prerequisites:

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0` compatible with Angular 22;
- npm 11.x.

Commands from `frontend/`:

```bash
npm install
npm start
npm run format:check
npm run lint
npm test
npm run build
npm run serve:ssr
```

`npm run serve:ssr` serves the built SSR output and should be run after `npm run build`.

## Backend

Prerequisites:

- Java 21.

Maven is provided through the Maven Wrapper; no global Maven installation is required.

Commands from `backend/` on Windows:

```bash
cmd /c mvnw.cmd spring-boot:run
cmd /c mvnw.cmd test
cmd /c mvnw.cmd compile
cmd /c mvnw.cmd package
```

The default bootstrap configuration temporarily disables database, JPA, and Flyway auto-configuration so the backend can start before the PostgreSQL milestone.

## Documentation

- [Product vision](docs/product-vision.md)
- [Content inventory](docs/content-inventory.md)
- [Information architecture](docs/information-architecture.md)
- [Design system](docs/design-system.md)
- [Frontend architecture](docs/frontend-architecture.md)
- [Backend architecture](docs/backend-architecture.md)
- [Data model](docs/data-model.md)
- [SEO, i18n, and accessibility](docs/seo-i18n-accessibility.md)
- [Motion guidelines](docs/motion-guidelines.md)
- [Deployment architecture](docs/deployment-architecture.md)
- [Roadmap](docs/roadmap.md)
