# Content Inventory

This document tracks owner-provided portfolio source material for V1 and later content passes. Strategy and visual hierarchy rules live in [Content strategy](content-strategy.md).

## Content Ownership

Frontend-static, typed, and version-controlled content:

- identity, biography, Home positioning, profile/portrait metadata;
- Education, Professional Experience, Skills, Languages;
- school/organization logo references and official website URLs.

Backend/PostgreSQL-owned content:

- Projects, project translations, project technologies, publication/archive/featured state, presentation mode, project-owned media/links, and ordered localized detail sections.

Do not move CV/profile content into PostgreSQL, create profile CMS tables, or add admin CRUD unless future requirements materially change.

## Current Public Identity

| Area              | Public content direction                                                                                                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name              | Baptiste Wetterwald                                                                                                                                                                                                   |
| Role              | Software Engineer                                                                                                                                                                                                     |
| Positioning       | Backend & Full-stack                                                                                                                                                                                                  |
| Primary stack     | Java / Spring, C# / .NET, TypeScript / Node.js, Angular                                                                                                                                                               |
| Home copy         | Concise engineering-graduate positioning with backend systems, API-oriented architectures, full-stack applications, Angular, system integration, SAP, Microsoft Power Platform, and industrial software environments. |
| Portrait          | Approved original portrait asset rendered from `frontend/public/assets/portrait/baptiste-wetterwald-portrait.png` with CSS object cropping inside the porthole frame.                                                 |
| Social/contact/CV | Not published until real URLs, contact method, or CV files are supplied.                                                                                                                                              |

The approved global GitHub identity is `BaptisteWetterwald`, now used as the backend default for the M11 activity block and profile URL. Project-specific repository owners remain non-authoritative. Recent public repositories work anonymously; contribution-calendar data remains absent until a backend-only GitHub token is configured.

## Education

Reverse chronological public Education entries:

| ID                   | Period    | Institution                       | Location           | Public content                                                                                                                                                | Logo                                                        | Official URL                 |
| -------------------- | --------- | --------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------- |
| `ensisa`             | 2022-2025 | ENSISA                            | Mulhouse, France   | Engineering Degree in Computer Science and Networks / Diplôme d'Ingénieur en Informatique et Réseaux; graduated / diplômé.                                    | `frontend/public/assets/logos/logo_ensisa.svg`              | `https://www.ensisa.uha.fr/` |
| `uqac-semester`      | 2022      | Université du Québec à Chicoutimi | Chicoutimi, Canada | Study semester abroad / semestre international; fourth semester of the DUT completed at UQAC. Do not invent exact semester dates.                             | `frontend/public/assets/logos/logo_uqac.png`                | `https://www.uqac.ca/`       |
| `iut-robert-schuman` | 2020-2022 | IUT Robert Schuman                | Illkirch, France   | DUT Informatique; fourth semester completed abroad at UQAC in Canada.                                                                                         | `frontend/public/assets/logos/logo_iut_robert_schuman.png`  | `https://iutrs.unistra.fr/`  |
| `insa-lyon`          | 2019-2020 | INSA Lyon                         | Lyon, France       | First year of the integrated engineering preparatory cycle in Engineering Sciences / Première année du cycle préparatoire intégré en Sciences de l'Ingénieur. | none supplied                                               | none                         |
| `lycee-louis-armand` | 2019      | Lycée Louis Armand                | Mulhouse, France   | Baccalauréat STI2D, specialization SIN / spécialité SIN, Mention Très Bien.                                                                                   | `frontend/public/assets/logos/logo_lycée_louis_armand.jpeg` | none                         |

## Professional Experience

Reverse chronological public Experience entries:

| ID                            | Period                                                    | Organization                                              | Location           | Role                                                                       | Public scope                                                                                                                                                                                                                                                                                                                                                                                                                                           | Technologies                                                                              | Logo                                                   | Official URL                    |
| ----------------------------- | --------------------------------------------------------- | --------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------- |
| `plansee-group-functions`     | Since 1 December 2025; planned end: end of November 2026  | Plansee Group Functions                                   | Mamer, Luxembourg  | Software Developer                                                         | Continued Angular application development; SAP S/4HANA and ABAP transaction/API work; HTTP/API integration; SAP transaction to AI-team API in a powder-recipe calculation workflow; adaptation of a C#/.NET industrial measurement application after equipment relocation; Node.js/Express middleware around Minew electronic-label API for SAP PI with REST-oriented wrapping and OAuth 2.0. Do not position this as SAP specialist career targeting. | ABAP, SAP S/4HANA, Angular, TypeScript, Node.js, Express, REST, HTTP, OAuth 2.0, C#, .NET | `frontend/public/assets/logos/logo_plansee.png`        | `https://plansee-group.com/en`  |
| `plansee-internship`          | 1 July 2025 to approximately mid-September 2025; 11 weeks | Plansee Group Functions                                   | Mamer, Luxembourg  | Software Developer Intern                                                  | Complete modernization/redevelopment of an internal ordering website used by company departments. The internship was in a SAP department/environment but did not include ABAP development.                                                                                                                                                                                                                                                             | Angular, TypeScript                                                                       | `frontend/public/assets/logos/logo_plansee.png`        | `https://www.plansee.com/`      |
| `bureau-veritas-laboratories` | September 2023 to 30 September 2025                       | Bureau Veritas Laboratories / Bureau Veritas Laboratoires | Sausheim, France   | Power Platform Developer Apprentice / Alternant Développeur Power Platform | Engineering apprenticeship alternating roughly two to three weeks between school and company. Independently developed an application to replace the laboratory vehicle-fleet management system, covering reception, workflow tracking, maceration room, test bench, and return/restitution. Learned Power Platform independently and worked largely autonomously without local specialized Power Platform supervision.                                 | Microsoft Power Apps, Power Automate, Dataverse, Microsoft Power Platform                 | `frontend/public/assets/logos/logo_bureau_veritas.svg` | `https://www.bureauveritas.fr/` |
| `groupe-ies`                  | July-August 2023; 2 months                                | Groupe IES                                                | Colmar, France     | .NET Full-stack Developer Intern / Stagiaire développeur full-stack .NET   | Web development in C# with ASP.NET Blazor; development and consumption of REST APIs; work with existing database/service layers implemented in VB.NET/.NET. Do not mention personal/family context.                                                                                                                                                                                                                                                    | C#, .NET, ASP.NET Blazor, VB.NET, REST                                                    | `frontend/public/assets/logos/logo_groupe_ies.jpeg`    | none                            |
| `lif-uqac-internship`         | Approximately April-July 2022; approximately 3 months     | Laboratoire d'Informatique Formelle (LIF), UQAC           | Chicoutimi, Canada | Software Developer Intern / academic research-oriented internship          | Two-person project connecting BeamNG.drive with BeepBeep 3, an Event Stream Processing engine developed at LIF. Work involved simulator/integration communication, network/socket programming, Java, and Python. Do not invent research results or publications.                                                                                                                                                                                       | Java, Python, Sockets, BeamNG.drive, BeepBeep 3                                           | `frontend/public/assets/logos/logo_lif.png`            | none                            |

## Languages

| Language | Public level                        |
| -------- | ----------------------------------- |
| French   | Native language / Langue maternelle |
| English  | C1, TOEIC 975                       |
| German   | B1                                  |

Do not use progress bars, percentages, star ratings, gauges, or invented proficiency scores.

## Skills

Public skills should stay grouped by importance:

| Importance                                             | Groups / technologies                                                                                                                                                                                                                   |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary software engineering                           | Backend & application development: Java, Spring, Spring Boot, C#, .NET, TypeScript, Node.js, Express. Frontend & full-stack: Angular, TypeScript, HTML, CSS, Tailwind CSS, daisyUI. APIs & integration: REST, HTTP, OAuth 2.0, Sockets. |
| Professional / complementary data                      | SQL, PostgreSQL, MySQL, SQLite, Oracle, PL/SQL. PostgreSQL should remain framed as portfolio project experience unless professional use is supplied.                                                                                    |
| Professional / complementary enterprise and industrial | SAP S/4HANA, ABAP, Power Apps, Power Automate, Dataverse, Microsoft Power Platform, ASP.NET Blazor, VB.NET.                                                                                                                             |
| Secondary AI-assisted engineering                      | ChatGPT, Codex / coding agents, MCP concepts, early agentic workflow exploration. Do not use AI/ML/LLM role positioning.                                                                                                                |
| Secondary broader software experience                  | C, C++, Python, Django, PHP, Laravel, Android / Java, Kotlin, JavaFX, Swing, Unreal Engine, Blueprint, MATLAB.                                                                                                                          |
| Exploratory / historical                               | Arduino, LabVIEW, Flowcode, LaTeX, UML, SolidWorks, Solid Edge, Git, Perforce, Apache Subversion, Docker, Windows, Linux.                                                                                                               |

Do not prominently publish Microsoft Office or the old PIX score/code. The PIX verification code must not appear in public content.

## Logo Assets

Current supplied logo files under `frontend/public/assets/logos`:

| File                           | Appears to correspond to            | Current mapping                        |
| ------------------------------ | ----------------------------------- | -------------------------------------- |
| `logo_bureau_veritas.svg`      | Bureau Veritas                      | Bureau Veritas Laboratoires experience |
| `logo_ensisa.svg`              | ENSISA                              | ENSISA education                       |
| `logo_groupe_ies.jpeg`         | Groupe IES                          | Groupe IES experience                  |
| `logo_iut_robert_schuman.png`  | IUT Robert Schuman                  | IUT Robert Schuman education           |
| `logo_lif.png`                 | Laboratoire d'Informatique Formelle | LIF/UQAC internship                    |
| `logo_lycée_louis_armand.jpeg` | Lycée Louis Armand                  | Baccalauréat entry                     |
| `logo_plansee.png`             | Plansee                             | Plansee current role and internship    |
| `logo_uqac.png`                | UQAC                                | UQAC study semester                    |

Preferred convention for future assets is `frontend/public/assets/logos/<organization-slug>.<ext>`. Existing owner-supplied filenames are referenced exactly until a safe normalization pass is explicitly requested.

Timeline logo rules:

- desktop: date/period in the metadata column, logo plaque below;
- mobile: compact reflow beside the organization/school name;
- logo image uses `object-fit: contain` inside a normalized white plaque;
- no crop, stretch, arbitrary recolor, fabricated fallback, or hotlinked logos;
- organization/logo links are scoped to the identity areas only, never the whole card.

## Project Inventory Backlog

Projects are backend/PostgreSQL records. Only records with enough authoritative repository content should be seeded.

### Seeded Project Records

Current public display order uses `projects.display_order` ascending: Portfolio Spring Angular (`10`), Blaze4 (`20`), Frequensisa (`30`), SummerCamp (`40`), Bot Discord IR (`50`), then BeamNG.drive x BeepBeep 3 (`60`).

| Slug                       | Title                     | Status      | Presentation mode | Source                                                                                                                                                                                                                                                                                                                                                         | GitHub URL                                                         | Technologies                                                                                                   | Omitted fields                                                                                                                                                                                                  |
| -------------------------- | ------------------------- | ----------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `portfolio-spring-angular` | Portfolio Spring Angular  | `PUBLISHED` | `DETAIL`          | Current local repository implementation, durable docs, and git origin. Bilingual Angular SSR frontend, localized single-page portfolio documents, Spring Boot backend, PostgreSQL/Flyway project domain, localized project API, request-time metadata, Docker Compose local stack, and structured project-detail sections are implemented.                     | <https://github.com/BaptisteWetterwald/portfolio-spring-angular>   | Angular, TypeScript, Java, Spring Boot, PostgreSQL, Flyway, Angular SSR, Tailwind CSS, daisyUI, Docker Compose | Demo URL and project-owned media reference are not supplied. CI/CD and production deployment are not described as implemented.                                                                                  |
| `blaze4`                   | Blaze4                    | `PUBLISHED` | `DETAIL`          | Canonical public repository README: <https://github.com/BaptisteWetterwald/ecole-ntiers-projet-blaze4>. School/academic C#/.NET Connect Four web application documented as an N-tier architecture with separated application, data access, presentation, DTO, and test projects. Bilingual card copy and four ordered bilingual detail sections are available. | <https://github.com/BaptisteWetterwald/ecole-ntiers-projet-blaze4> | C#, .NET, ASP.NET Core, Blazor WebAssembly, Entity Framework Core, SQLite                                      | Demo URL is not supplied. Media is unset for now: the README logo is a GitHub user-attachment URL, and the repository class diagram is not a good fit for the current single `logo_media_ref` card/detail slot. |
| `frequensisa`              | Frequensisa               | `PUBLISHED` | `CARD_ONLY`       | Public repository README and source: <https://github.com/BaptisteWetterwald/ecole-ios-frequensisa>. Third-year academic iOS radio application with SwiftUI screens, SQLite persistence, saved-radio management, categories, detail view, and AVPlayer playback through `RadioPlayerManager`.                                                                   | <https://github.com/BaptisteWetterwald/ecole-ios-frequensisa>      | Swift, SwiftUI, SQLite                                                                                         | No detail sections, demo URL, or portfolio media reference are supplied. Repository-owned app icon/logo assets exist but are not integrated into the current portfolio media contract.                          |
| `summercamp`               | SummerCamp                | `PUBLISHED` | `CARD_ONLY`       | Public repository source: <https://github.com/BaptisteWetterwald/ecole-android-summercamp>. Academic Android summer-camp management application using Kotlin, Jetpack Compose screens, child/supervisor/activity models, and Room persistence.                                                                                                                 | <https://github.com/BaptisteWetterwald/ecole-android-summercamp>   | Kotlin, Jetpack Compose, Android, Room                                                                         | No detail sections, demo URL, or portfolio media reference are supplied. README media is a GitHub user-attachment URL and is not used.                                                                          |
| `bot-discord-ir`           | Bot Discord IR            | `PUBLISHED` | `CARD_ONLY`       | Public repository source and package metadata: <https://github.com/BaptisteWetterwald/discord-bot-ensisa-ir>. Discord bot for the ENSISA Computer Science and Networks class, implemented with Node.js, JavaScript, discord.js commands/events, scheduled jobs, and SQLite-backed command data.                                                                | <https://github.com/BaptisteWetterwald/discord-bot-ensisa-ir>      | Node.js, JavaScript, discord.js, SQLite                                                                        | No detail sections, demo URL, or portfolio media reference are supplied. OpenAI is present in one command but is not surfaced as a primary project technology.                                                  |
| `beamng-drive-beepbeep-3`  | BeamNG.drive x BeepBeep 3 | `PUBLISHED` | `CARD_ONLY`       | Project backlog plus bilingual LIF/UQAC Experience content in `frontend/src/app/core/content/portfolio-content.ts`.                                                                                                                                                                                                                                            | none supplied                                                      | Java, Python, Sockets, BeamNG.drive, BeepBeep 3                                                                | Demo URL and project-owned media/logo reference are not supplied.                                                                                                                                               |

### Featured / Flagship Candidates

| Candidate | Type                            | Status                      | Notes                                                                                                                                                                                                     |
| --------- | ------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WakomMUTE | Personal Android/mobile project | Unfinished / in development | Adaptive commute alarm intended to adjust wake-up decisions based on public-transport disruptions. Do not publish architecture or technology details beyond what the source actually confirms when added. |

### Significant Candidates

| Candidate                      | Source                            | Technologies / notes                                                           |
| ------------------------------ | --------------------------------- | ------------------------------------------------------------------------------ |
| Educational Unreal Engine game | UQAC academic project             | Unreal Engine, Blueprint; collaboration with NAD-UQAC digital-design students. |
| Abalone                        | ENSISA two-week intensive project | C, AI, multiplayer, sockets.                                                   |

### Archive / Historical Candidates

| Candidate                                            | Source                        | Technologies / notes                                                                                                                         |
| ---------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Educational 2D game                                  | DUT academic project          | Java, LibGDX, HyperLap2D.                                                                                                                    |
| Kingdomino                                           | DUT academic project          | Java, Swing.                                                                                                                                 |
| Instant-messaging website                            | ENSISA academic project       | Python, Django, HTML, JavaScript, CSS.                                                                                                       |
| Folder synchronization tool                          | ENSISA academic project       | Java, sockets.                                                                                                                               |
| Android applications                                 | DUT/ENSISA academic projects  | Java / Android. Keep separate from WakomMUTE.                                                                                                |
| Holiday expense-management Windows Forms application | DUT academic project          | C# / Windows Forms / database management.                                                                                                    |
| Ant-colony simulation                                | DUT academic project          | Java / UML.                                                                                                                                  |
| Discord bots                                         | Personal projects             | Node.js, discord.js, Puppeteer, including web scraping.                                                                                      |
| Minecraft server administration/community project    | Volunteer/personal, 2014-2018 | Event organization and server database management. Candidate for an "Origins" or early-projects treatment, not the main Experience timeline. |

## Supporting Material Not Published

- Bureau Veritas school report, approximately 40 pages: may become supporting material later only with Bureau Veritas permission.
- Bureau Veritas recommendation letter: may become supporting material later only with appropriate permission/approval.
- Do not add download links, screenshots, metrics, testimonials, or quotations from these materials in the public portfolio until permission and public copy are explicitly approved.

## Missing Or Deferred Public Content

- real LinkedIn profile URL;
- public contact method or contact form policy;
- downloadable CV file(s);
- additional project records, final bilingual copy, GitHub/demo URLs, and project-owned media;
- approved OpenGraph images beyond the existing portrait where applicable;
- INSA Lyon logo or official link, if a local asset/URL is supplied later.
