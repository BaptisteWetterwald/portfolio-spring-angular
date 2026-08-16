# Deployment and Operations

The complete portfolio must be deployable on a Linux VPS.

## Containerization

The application consists of at least:

* Angular frontend;
* Spring Boot backend;
* PostgreSQL database.

The Angular application and Spring Boot application must each have their own production Docker image.

PostgreSQL should use an official PostgreSQL image rather than a custom image unless a genuine requirement appears.

The production environment should be orchestrated using Docker Compose unless a better solution becomes justified later.

The architecture must remain simple and appropriate for a personal portfolio. Kubernetes or microservice orchestration is not required.

## Reverse proxy

The public website should preferably expose a single origin.

Conceptually:

```text
Internet
   |
   v
Reverse proxy / HTTPS
   |
   +---- /        ---> Frontend
   |
   +---- /api/*   ---> Spring Boot
                         |
                         v
                     PostgreSQL
```

The exact reverse-proxy implementation should be decided during architecture design.

## CI/CD

Changes merged or pushed to the `main` branch should automatically trigger the production delivery pipeline.

The intended workflow is approximately:

```text
push main
    |
    v
CI
    |
    +-- frontend checks/tests/build
    |
    +-- backend checks/tests/build
    |
    +-- Docker image builds
    |
    v
Container registry
    |
    v
VPS deployment
    |
    +-- pull versioned images
    +-- apply controlled database migrations
    +-- restart/update services
    +-- verify health
```

A container registry such as GitHub Container Registry may be used.

Production images should be immutable and versioned, preferably using the Git commit SHA or another traceable version identifier.

Avoid relying only on mutable `latest` tags.

## Deployment principles

Deployment should be:

* automated;
* reproducible;
* observable enough to diagnose failures;
* reasonably rollback-friendly;
* secure;
* simple enough for a single VPS.

The VPS should not need the complete development toolchain merely to compile the application on every deployment.

Prefer building and validating production artifacts in CI and deploying already-built images.

## Secrets

Secrets must never be committed to Git.

Configuration should distinguish between:

* non-secret application configuration;
* development configuration;
* production configuration;
* secrets.

Provide safe templates such as `.env.example` where useful.

Potential secrets may eventually include:

* PostgreSQL credentials;
* external API tokens;
* email credentials;
* deployment credentials.

## Database

PostgreSQL data must live on persistent storage independent from the lifecycle of the PostgreSQL container.

Database migrations must be version-controlled.

Production schema changes must be performed through an explicit migration mechanism such as Flyway.

The production database must never depend on Hibernate automatically recreating or mutating the schema.

## Health checks

Production deployment should eventually provide enough health information to determine whether:

* the frontend is serving requests;
* the backend is operational;
* required backend dependencies are available.

Spring Boot Actuator may be considered where appropriate.

Health endpoints must not unnecessarily expose sensitive application information.

## Rollback

The architecture should make application rollback reasonably straightforward by retaining or identifying previous container image versions.

Database migrations require additional care because application rollback does not automatically imply database rollback.

Prefer backward-compatible migrations when reasonably possible.

## Local development

Containerization must not unnecessarily degrade developer experience.

The architecture may support both:

* native development servers with hot reload;
* Docker Compose for reproducible full-stack integration environments.

The exact local development workflow should be documented once the frontend and backend architecture are finalized.
