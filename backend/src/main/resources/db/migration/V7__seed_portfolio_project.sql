-- Seed the current portfolio itself as a real public DETAIL project.
-- Source: current local repository implementation, documentation, and git origin.

with seed_clock(seed_at) as (
  values (timestamp with time zone '2026-08-30 00:00:00+00')
)
insert into projects (
  slug,
  logo_media_ref,
  github_url,
  demo_url,
  featured,
  status,
  presentation_mode,
  display_order,
  created_at,
  updated_at,
  published_at
)
select
  'portfolio-spring-angular',
  null,
  'https://github.com/BaptisteWetterwald/portfolio-spring-angular',
  null,
  false,
  'PUBLISHED',
  'DETAIL',
  120,
  seed_clock.seed_at,
  seed_clock.seed_at,
  null
from seed_clock
on conflict (slug) do update
set
  logo_media_ref = excluded.logo_media_ref,
  github_url = excluded.github_url,
  demo_url = excluded.demo_url,
  featured = excluded.featured,
  status = excluded.status,
  presentation_mode = excluded.presentation_mode,
  display_order = excluded.display_order,
  updated_at = excluded.updated_at,
  published_at = excluded.published_at;

with seed_clock(seed_at) as (
  values (timestamp with time zone '2026-08-30 00:00:00+00')
),
technology_seed(name, slug) as (
  values
    ('Angular', 'angular'),
    ('TypeScript', 'typescript'),
    ('Java', 'java'),
    ('Spring Boot', 'spring-boot'),
    ('PostgreSQL', 'postgresql'),
    ('Flyway', 'flyway'),
    ('Angular SSR', 'angular-ssr'),
    ('Tailwind CSS', 'tailwind-css'),
    ('daisyUI', 'daisyui'),
    ('Docker Compose', 'docker-compose')
)
insert into technologies (
  name,
  slug,
  icon_ref,
  category,
  created_at,
  updated_at
)
select
  technology_seed.name,
  technology_seed.slug,
  null,
  null,
  seed_clock.seed_at,
  seed_clock.seed_at
from technology_seed
cross join seed_clock
on conflict (slug) do update
set
  name = excluded.name,
  icon_ref = excluded.icon_ref,
  category = excluded.category,
  updated_at = excluded.updated_at;

with seed_clock(seed_at) as (
  values (timestamp with time zone '2026-08-30 00:00:00+00')
),
project_ref as (
  select id
  from projects
  where slug = 'portfolio-spring-angular'
),
translation_seed(locale, title, short_description, detailed_description) as (
  values
    (
      'en',
      'Portfolio Spring Angular',
      $$Bilingual portfolio application built with Angular SSR, Spring Boot, PostgreSQL and Flyway to serve localized content and structured project case studies.$$,
      null::text
    ),
    (
      'fr',
      'Portfolio Spring Angular',
      $$Application portfolio bilingue construite avec Angular SSR, Spring Boot, PostgreSQL et Flyway pour servir du contenu localisé et des études de projets structurées.$$,
      null::text
    )
)
insert into project_translations (
  project_id,
  locale,
  title,
  short_description,
  detailed_description,
  created_at,
  updated_at
)
select
  project_ref.id,
  translation_seed.locale,
  translation_seed.title,
  translation_seed.short_description,
  translation_seed.detailed_description,
  seed_clock.seed_at,
  seed_clock.seed_at
from project_ref
cross join translation_seed
cross join seed_clock
on conflict (project_id, locale) do update
set
  title = excluded.title,
  short_description = excluded.short_description,
  detailed_description = excluded.detailed_description,
  updated_at = excluded.updated_at;

with project_ref as (
  select id
  from projects
  where slug = 'portfolio-spring-angular'
),
technology_seed(slug, display_order) as (
  values
    ('angular', 10),
    ('typescript', 20),
    ('java', 30),
    ('spring-boot', 40),
    ('postgresql', 50),
    ('flyway', 60),
    ('angular-ssr', 70),
    ('tailwind-css', 80),
    ('daisyui', 90),
    ('docker-compose', 100)
)
insert into project_technologies (
  project_id,
  technology_id,
  display_order
)
select
  project_ref.id,
  technologies.id,
  technology_seed.display_order
from project_ref
join technology_seed on true
join technologies on technologies.slug = technology_seed.slug
on conflict (project_id, technology_id) do update
set display_order = excluded.display_order;

with seed_clock(seed_at) as (
  values (timestamp with time zone '2026-08-30 00:00:00+00')
),
project_ref as (
  select id
  from projects
  where slug = 'portfolio-spring-angular'
),
section_seed(display_order) as (
  values
    (10),
    (20),
    (30),
    (40)
),
upserted_sections as (
  insert into project_sections (
    project_id,
    display_order,
    created_at,
    updated_at
  )
  select
    project_ref.id,
    section_seed.display_order,
    seed_clock.seed_at,
    seed_clock.seed_at
  from project_ref
  cross join section_seed
  cross join seed_clock
  on conflict (project_id, display_order) do update
  set updated_at = excluded.updated_at
  returning id, display_order
),
translation_seed(display_order, locale, title, content) as (
  values
    (
      10,
      'fr',
      'Contexte',
      $$Portfolio Spring Angular est l'application portfolio source de Baptiste Wetterwald. Elle présente du contenu professionnel localisé et des projets réels fournis par un backend Spring Boot et PostgreSQL.$$
    ),
    (
      20,
      'fr',
      'Architecture',
      $$L'application est séparée entre un frontend Angular 22 avec SSR et un backend Spring Boot. PostgreSQL stocke les données projet, Flyway gère les migrations de schéma et Docker Compose assemble l'environnement local complet.$$
    ),
    (
      30,
      'fr',
      'Projets et contenu',
      $$Les projets sont des entités gérées côté backend avec statut de publication, mode de présentation, traductions localisées, technologies ordonnées et sections de détail structurées. Le frontend Angular consomme des DTOs de liste compacts et des DTOs de détail enrichis via des resolvers de route.$$
    ),
    (
      40,
      'fr',
      'SSR, SEO et accessibilité',
      $$Les routes localisées /fr et /en sont rendues à la requête. Le frontend applique des métadonnées localisées, des URL canoniques, des alternates hreflang et le noindex pour les pages de détail indisponibles, tout en conservant une navigation sémantique et des actions accessibles au clavier.$$
    ),
    (
      10,
      'en',
      'Context',
      $$Portfolio Spring Angular is the source-backed portfolio application for Baptiste Wetterwald. It presents localized professional content and real project records from a Spring Boot and PostgreSQL backend.$$
    ),
    (
      20,
      'en',
      'Architecture',
      $$The application is split into an Angular 22 SSR frontend and a Spring Boot backend. PostgreSQL stores project data, Flyway owns schema migrations and Docker Compose wires the local full-stack runtime.$$
    ),
    (
      30,
      'en',
      'Projects and content',
      $$Projects are backend-managed entities with publication status, presentation mode, localized translations, ordered technologies and structured detail sections. The Angular frontend consumes compact list DTOs and richer detail DTOs through route resolvers.$$
    ),
    (
      40,
      'en',
      'SSR, SEO and accessibility',
      $$Localized /fr and /en routes are rendered at request time. The frontend applies localized metadata, canonical URLs, hreflang alternates and noindex handling for unavailable project detail pages while keeping semantic navigation and keyboard-accessible actions.$$
    )
)
insert into project_section_translations (
  section_id,
  locale,
  title,
  content,
  created_at,
  updated_at
)
select
  upserted_sections.id,
  translation_seed.locale,
  translation_seed.title,
  translation_seed.content,
  seed_clock.seed_at,
  seed_clock.seed_at
from upserted_sections
join translation_seed on translation_seed.display_order = upserted_sections.display_order
cross join seed_clock
on conflict (section_id, locale) do update
set
  title = excluded.title,
  content = excluded.content,
  updated_at = excluded.updated_at;
