create table if not exists project_sections (
  id bigserial primary key,
  project_id bigint not null,
  display_order integer not null default 0,
  created_at timestamp(6) with time zone not null default now(),
  updated_at timestamp(6) with time zone not null default now(),
  constraint project_sections_project_fk
    foreign key (project_id) references projects (id) on delete cascade,
  constraint project_sections_project_display_order_unique unique (project_id, display_order)
);

create table if not exists project_section_translations (
  id bigserial primary key,
  section_id bigint not null,
  locale varchar(8) not null,
  title varchar(180) not null,
  content text not null,
  created_at timestamp(6) with time zone not null default now(),
  updated_at timestamp(6) with time zone not null default now(),
  constraint project_section_translations_section_fk
    foreign key (section_id) references project_sections (id) on delete cascade,
  constraint project_section_translations_locale_check check (locale in ('fr', 'en')),
  constraint project_section_translations_title_not_blank check (length(btrim(title)) > 0),
  constraint project_section_translations_content_not_blank check (length(btrim(content)) > 0),
  constraint project_section_translations_section_locale_unique unique (section_id, locale)
);

create index if not exists idx_project_sections_project_order
  on project_sections (project_id, display_order, id);

create index if not exists idx_project_section_translations_locale
  on project_section_translations (locale);

with seed_clock(seed_at) as (
  values (timestamp with time zone '2026-08-30 00:00:00+00')
),
project_ref as (
  select id
  from projects
  where slug = 'blaze4'
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
      $$Blaze4 est une application web de Puissance 4 réalisée dans le cadre d'un projet consacré aux architectures N-tiers. L'objectif principal était de séparer clairement la logique métier, l'accès aux données et l'interface utilisateur.$$
    ),
    (
      20,
      'fr',
      'Architecture',
      $$L'application est organisée en plusieurs projets .NET : une couche applicative exposant une API REST ASP.NET Core, une couche d'accès aux données basée sur Entity Framework Core, un frontend Blazor WebAssembly, un projet de DTOs partagés et un projet de tests.$$
    ),
    (
      30,
      'fr',
      'Logique métier et API',
      $$Le backend prend en charge la création des parties, le déroulement du jeu et la validation des tours. Les concepts métier du Puissance 4 sont représentés par des modèles dédiés, tandis que des services, repositories et mappers assurent la séparation entre logique métier, persistance et contrats d'API.$$
    ),
    (
      40,
      'fr',
      'Authentification et persistance',
      $$L'application propose l'inscription et la connexion des joueurs avec authentification JWT. Les données sont persistées dans une base SQLite via Entity Framework Core et ses migrations.$$
    ),
    (
      10,
      'en',
      'Context',
      $$Blaze4 is a Connect Four web application developed as part of an academic project focused on N-tier architectures. Its main architectural goal was to clearly separate business logic, data access and the user interface.$$
    ),
    (
      20,
      'en',
      'Architecture',
      $$The application is organized into several .NET projects: an application layer exposing an ASP.NET Core REST API, a data-access layer based on Entity Framework Core, a Blazor WebAssembly frontend, a shared DTO project and a test project.$$
    ),
    (
      30,
      'en',
      'Business logic and API',
      $$The backend handles game creation, gameplay and turn validation. Connect Four concepts are represented through dedicated domain models, while services, repositories and mappers separate business logic, persistence and API contracts.$$
    ),
    (
      40,
      'en',
      'Authentication and persistence',
      $$The application supports player registration and login using JWT authentication. Data is persisted in SQLite through Entity Framework Core and its migrations.$$
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
