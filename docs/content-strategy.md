# Content Strategy

This document is the source of truth for how portfolio content should grow after the first Milestone 8 content pass.

## Positioning

The portfolio presents Baptiste Wetterwald as:

- Software Engineer;
- backend and full-stack first;
- primarily oriented around Java / Spring, C# / .NET, and TypeScript / Node.js;
- able to use Angular as a relevant full-stack/frontend capability;
- experienced with Microsoft and enterprise application ecosystems as a complementary specialization.

The portfolio must not flatten every known technology into the same visual priority. Broad technical background can remain visible, but the main page hierarchy should continue to emphasize the current backend/full-stack direction.

Absence from the current public portfolio does not prove lack of knowledge. The current inventory is intentionally incomplete and will be enriched over time as owner-approved details are supplied.

## Skill Hierarchy

Skills should use importance levels rather than percentages, star ratings, years-of-experience claims, or vague expert/intermediate/beginner labels.

| Level | Meaning | Current examples |
| --- | --- | --- |
| Primary | Central to the current professional positioning and strongest visual emphasis. | Java, Spring, C#, .NET, TypeScript, Node.js, Angular, REST APIs, backend/full-stack engineering. |
| Professional / complementary | Used professionally or relevant to enterprise/business application experience, but not the main positioning. | Power Platform, Power Apps, Power Automate, Dataverse, Microsoft 365, SQL/data platforms, SAP S/4HANA where relevant. |
| Secondary | Previously used or useful supporting technologies/tools that should not dominate the page. | Tailwind CSS, DaisyUI, Docker, Git, Oracle, SQL Server, SQLite, MongoDB. |
| Exploratory / historical | Older, niche, educational, self-taught, lightly explored, or experimental knowledge. | Future owner-supplied items such as LabVIEW, older school technologies, high-school experiments, small academic exercises. |

Future additions such as LabVIEW or older school technologies should use the lower levels unless the owner supplies a reason to promote them. Small or older skills should not be deleted merely because they are no longer central.

Milestone 9 visual treatment must reinforce this hierarchy. Primary backend/full-stack skills may use the strongest surfaces, route-like accents, and highest-contrast badges. Professional/complementary skills should remain clearly visible but quieter. Secondary and exploratory/historical skills should be discoverable without competing with the primary stack. Visual weight must never imply unsupported expertise or flatten every technology into the same priority. Skill cards are informational surfaces, not navigation; do not add fake click behavior, pointer cursors, or strong interactive transforms.

## AI-Assisted Engineering

AI-assisted software engineering is relevant to the portfolio, but it must remain subordinate to the backend/full-stack positioning for now.

Current conservative facts that may be represented:

- practical use of ChatGPT in software-development and problem-solving workflows;
- practical use of Codex / coding agents;
- Codex beginning to appear in the professional environment;
- familiarity with MCP concepts;
- early exploration of agentic development workflows.

Do not present Baptiste as:

- AI Engineer;
- ML Engineer;
- LLM Engineer;
- Agentic AI expert;
- MCP expert.

Preferred wording:

- AI-assisted software engineering;
- AI-assisted development workflows;
- coding agents;
- developer tooling with LLMs;
- familiarity or early exploration of MCP;
- early exploration of agentic workflows.

## Project Hierarchy

Project prominence must follow importance. The project system should eventually distinguish:

| Level | Meaning |
| --- | --- |
| Featured | Major projects that demonstrate the target backend/full-stack engineering profile. |
| Standard | Meaningful projects worth presenting normally. |
| Minor / archive | Small academic projects, old experiments, niche demonstrations, and historical exercises. |

The existing backend project status model (`PUBLISHED`, `ARCHIVED`, `DRAFT`) is not the same thing as visual/project importance. `featured` currently covers the strongest public emphasis. A richer project-importance field may be added later if real project content proves the need.

Do not modify persistence solely to anticipate this hierarchy. Document the requirement until the content model needs it.

Milestone 9 may style existing `featured`, standard published, and `ARCHIVED` project groups with different visual weight. It must not invent project records, screenshots, demos, repository URLs, or a new persistence field for project importance. DaisyUI mockup treatments should wait until real project media is supplied and its type is known.

The portfolio application itself is expected to become an important open-source project once it has enough real content, visual polish, and deployment maturity to be presented as such. Do not create a fake project record before approved project copy exists.

## Content Evolution

The portfolio should be able to grow without redesigning the pages:

- skills can be progressively enriched with owner-approved older, niche, academic, and professional knowledge;
- projects can include major portfolio projects, academic work, small experiments, and archives with different visual weights;
- experience entries can receive richer responsibilities, outcomes, and technologies only when confirmed;
- static identity, biography, education, experience, skill hierarchy, organization/school links, and organization/school logo references remain frontend-owned, typed, and version-controlled;
- project records, project translations, project technologies, project publication/archive/featured state, and project-owned media remain backend-owned.

Do not move CV/profile content into PostgreSQL or introduce profile CMS tables unless future requirements materially change. Valid triggers would include runtime editing/admin needs, many dynamic clients, substantially more locales, or an external content-management workflow.

Documentation may contain TODOs, confidence notes, missing-content labels, and confirmation status. Visitor-facing content must not expose internal milestone, review, confirmation, or TODO language.

## Public-Copy Rule

Public pages must avoid phrases such as:

- confirmed roles;
- approved content exists;
- content awaiting confirmation;
- before later visual styling;
- role detail is not yet available;
- TODO.

Use concise professional copy instead. If a public field is missing, omit the block or use a plain user-facing empty state that does not expose internal process.
