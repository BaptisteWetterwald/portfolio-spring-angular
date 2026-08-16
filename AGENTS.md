# Docker and deployment

The production target is a Linux VPS running containerized services.

The frontend and backend must each be independently containerizable.

PostgreSQL must use persistent storage.

Prefer simple Docker Compose orchestration appropriate for a single-server portfolio deployment.

Do not introduce Kubernetes or similar orchestration without an explicit new requirement.

# Docker images

Production Dockerfiles should:

* use appropriate multi-stage builds where useful;
* produce minimal runtime images;
* avoid development dependencies in runtime stages;
* run applications as non-root users where practical;
* avoid embedding secrets;
* support configuration through environment variables;
* include appropriate `.dockerignore` files.

Production images must be reproducible.

# CI

Changes to `main` are intended to be automatically deployed.

The CI pipeline must validate changes before deployment.

Frontend validation should include the relevant:

* dependency installation;
* linting;
* tests;
* production build.

Backend validation should include the relevant:

* tests;
* compilation;
* production build.

Docker images must only be published after the required validation succeeds.

# CD

Prefer deploying immutable, versioned container images rather than compiling source code directly on the VPS.

The deployment mechanism should support:

* authenticated image pulls;
* environment-specific configuration;
* database migrations;
* controlled service updates;
* health verification;
* traceability to a Git commit;
* reasonable rollback.

Do not silently deploy a failed build.

# GitHub Actions

GitHub Actions is the intended CI/CD platform.

Do not place secrets directly in workflow files.

Use GitHub secrets or the appropriate secure configuration mechanism.

Keep workflows understandable and avoid unnecessary third-party actions.

Pin important external actions to appropriate stable versions rather than relying on arbitrary moving branches.

# PostgreSQL

PostgreSQL production data must survive container recreation.

Schema changes must use version-controlled migrations.

Do not use Hibernate schema auto-generation as the production migration strategy.

# Configuration

Never commit production credentials.

Where environment variables are required:

* document them;
* provide safe examples;
* validate required configuration when possible.

Do not expose secrets to the Angular client bundle.

Any secret required for GitHub API access, email delivery or another integration belongs server-side.

# Operations

Infrastructure changes are part of the application architecture and must be documented.

When modifying deployment-related code, consider:

* service availability;
* health checks;
* persistence;
* migration compatibility;
* secrets;
* HTTPS/reverse proxy behavior;
* rollback.

Do not introduce infrastructure complexity without a concrete benefit.
