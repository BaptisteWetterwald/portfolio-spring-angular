# Content Strategy

This document is the durable source of truth for portfolio positioning, content ownership, and public-copy rules.

## Positioning

The portfolio presents Baptiste Wetterwald primarily as:

- Software Engineer;
- backend and full-stack oriented;
- focused first on Java / Spring / Spring Boot, C# / .NET, TypeScript / Node.js, and Angular;
- broadly experienced, but without giving every technology equal weight.

The first-glance hierarchy should read:

```text
Software Engineer -> Java/Spring + C#/.NET + TypeScript/Node.js -> backend/full-stack -> real industrial/professional experience -> Angular as the main frontend/full-stack framework.
```

Deeper sections and project-detail pages may show SAP, API/integration work, OAuth 2.0, Power Platform, databases, AI-assisted engineering, international experience, and older academic or exploratory technologies.

Old, niche, academic, or self-taught technologies can remain discoverable, but they must not visually compete with the current backend/full-stack direction.

## Content Ownership

The approved architecture is intentionally hybrid.

Frontend-static, typed, and version-controlled:

- identity and biography;
- Home positioning copy;
- Education;
- Professional Experience;
- Skills and skill hierarchy;
- Languages;
- profile/portrait metadata;
- organization/school logo references;
- official organization/school website URLs.

Backend/PostgreSQL-owned:

- Projects;
- project translations;
- project technologies;
- project publication/archive/featured state;
- project presentation mode;
- project-owned media/links;
- ordered localized detail sections.

Do not migrate CV/profile content into PostgreSQL or introduce Education, Experience, Skill, Language, biography, or generic CMS tables unless future requirements materially change. Valid triggers would include runtime editing/admin, many dynamic clients, substantially more locales, or an external content-management workflow.

Shared locale-neutral frontend facts should include IDs, dates, ordering, organizations, locations, technologies, importance, logo paths, and official URLs where practical. Localized prose and labels should remain in localized records.

## Skill Hierarchy

Skills use importance levels, not percentages, star ratings, fake proficiency scores, gauges, or vague expert/intermediate/beginner labels.

| Level                        | Meaning                                                                                  | Current examples                                                                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary                      | Central to the current professional positioning and strongest visual emphasis.           | Java, Spring, Spring Boot, C#, .NET, TypeScript, Node.js, Express, Angular, REST, HTTP, OAuth 2.0, Sockets.                                                                         |
| Professional / complementary | Real professional or enterprise context, but subordinate to the main positioning.        | SQL, PostgreSQL as portfolio experience, MySQL, SQLite, Oracle, PL/SQL, SAP S/4HANA, ABAP, Power Apps, Power Automate, Dataverse, Microsoft Power Platform, ASP.NET Blazor, VB.NET. |
| Secondary                    | Useful supporting or broader software experience that should remain visible but quieter. | C, C++, Python, Django, PHP, Laravel, Android / Java, Kotlin, JavaFX, Swing, Unreal Engine, Blueprint, MATLAB.                                                                      |
| Exploratory / historical     | Older, niche, academic, self-taught, or lightly explored knowledge.                      | Arduino, LabVIEW, Flowcode, LaTeX, UML, SolidWorks, Solid Edge, Git, Perforce, Apache Subversion, Docker, Windows, Linux.                                                           |

PostgreSQL should be framed as portfolio/personal project experience unless professional usage is later supplied. Microsoft Office and the old PIX score/code are intentionally not part of the public skill positioning.

Skill cards remain informational surfaces. Do not add fake click behavior, pointer cursors, strong scaling, or effects that imply navigation.

## AI-Assisted Engineering

AI-assisted software engineering belongs in the portfolio only as a secondary developer-tooling area.

Current public scope:

- ChatGPT as a software-development and problem-solving assistant;
- Codex / coding agents for repository work;
- familiarity with MCP concepts;
- early practical exploration of agentic development workflows.

Do not present Baptiste as an AI Engineer, ML Engineer, LLM Engineer, Agentic AI specialist, MCP specialist, or equivalent unsupported role.

## Languages

Languages are frontend-static profile content and are visually secondary to technical skills.

Current public facts:

- French: native language / langue maternelle;
- English: C1, TOEIC 975;
- German: B1.

Do not use progress bars, percentages, star ratings, gauges, or invented language scores.

## Project Strategy

Projects remain backend/PostgreSQL-owned. Do not hardcode project records into the frontend and do not seed fake records.

Project publication status and presentation mode are separate editorial decisions. `DRAFT`, `PUBLISHED`, and `ARCHIVED` describe visibility and lifecycle. `CARD_ONLY` and `DETAIL` describe whether a public project should have a dedicated page. Do not infer detail-page availability from status, media, repository links, or detailed-description text.

`DETAIL` projects use ordered localized content sections as the canonical case-study model. Section headings and body copy are project content, not backend enums, so each project can use the narrative structure that fits its real evidence. The legacy `detailedDescription` field is kept only as a staged fallback for older records and should not be authored for new rich detail pages.

Current project presentation supports three prominence levels from existing fields:

| Level                | Intended use                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Featured / flagship  | Large, polished, current projects aligned with the target backend/full-stack profile.     |
| Significant          | Meaningful technical projects worth explaining normally.                                  |
| Archive / historical | Small academic projects, old experiments, niche demonstrations, and historical exercises. |

The existing backend `featured` flag, `PUBLISHED` / `ARCHIVED` statuses, and `CARD_ONLY` / `DETAIL` presentation modes are sufficient for now. Do not add a separate project-importance persistence field until real project content proves that this model is insufficient.

Current inventory and future candidates:

- Featured / flagship: WakomMUTE when implementation facts are ready.
- Seeded published projects in public display order: Portfolio Spring Angular (`DETAIL`, display order `10`); Blaze4 (`DETAIL`, `20`); Frequensisa (`CARD_ONLY`, `30`); SummerCamp (`CARD_ONLY`, `40`); Bot Discord IR (`CARD_ONLY`, `50`); BeamNG.drive x BeepBeep 3 (`CARD_ONLY`, `60`).
- Remaining significant candidates: educational Unreal Engine game; Abalone.
- Archive / historical: educational 2D game; Puissance 4 JavaFX; Fourmilière; Kingdomino; EnsiBlog; Cloner Kebab; folder synchronization tool; holiday expense-management Windows Forms app; ant-colony simulation; other Discord bots; Minecraft server administration/community project. These may later need a compact "Autres projets" / "Archives" presentation, but no separate presentation mode or archive UI exists yet.

DaisyUI mockups, Aura, and Hover 3D treatments should only be used for future project content when real media, project type, and importance justify them. Do not fabricate screenshots, media, URLs, metrics, or repository/demo links.

## Supporting Materials

Bureau Veritas supporting material exists as owner-provided context: an approximately 40-page school report and a recommendation letter from a former manager. These may become portfolio supporting material later, but must not be published without appropriate permission and approval.

## Public-Copy Rule

Visitor-facing pages must avoid internal process wording such as:

- confirmed roles;
- approved content exists;
- content awaiting confirmation;
- before later visual styling;
- role detail is not yet available;
- TODO.

Public copy must also avoid unsupported metrics, inflated ownership claims, reasons for leaving employers, salary/job-search information, private personal relationships, unpublished reports, unpublished recommendation letters, social URLs that have not been supplied, and the old PIX verification code.
