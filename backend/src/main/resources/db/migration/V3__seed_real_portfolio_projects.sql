-- Real portfolio project seed data.
-- Source: docs/content-inventory.md and frontend/src/app/core/content/portfolio-content.ts.

with seed_clock(seed_at) as (
  values (timestamp with time zone '2026-08-29 00:00:00+00')
)
insert into projects (
  slug,
  logo_media_ref,
  github_url,
  demo_url,
  featured,
  status,
  display_order,
  created_at,
  updated_at,
  published_at
)
select
  'beamng-drive-beepbeep-3',
  null,
  null,
  null,
  false,
  'PUBLISHED',
  100,
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
  display_order = excluded.display_order,
  updated_at = excluded.updated_at,
  published_at = excluded.published_at;

with seed_clock(seed_at) as (
  values (timestamp with time zone '2026-08-29 00:00:00+00')
),
technology_seed(name, slug) as (
  values
    ('Java', 'java'),
    ('Python', 'python'),
    ('Sockets', 'sockets'),
    ('BeamNG.drive', 'beamng-drive'),
    ('BeepBeep 3', 'beepbeep-3')
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
  values (timestamp with time zone '2026-08-29 00:00:00+00')
),
project_ref as (
  select id
  from projects
  where slug = 'beamng-drive-beepbeep-3'
),
translation_seed(locale, title, short_description, detailed_description) as (
  values
    (
      'en',
      'BeamNG.drive x BeepBeep 3',
      $$Academic research-oriented internship on a two-person project connecting BeamNG.drive with BeepBeep 3, an Event Stream Processing engine developed at LIF.$$,
      $$Integrated communication between the BeamNG.drive vehicle simulator and BeepBeep 3.
Worked on network/socket programming with Java and Python.$$
    ),
    (
      'fr',
      'BeamNG.drive x BeepBeep 3',
      $$Stage académique orienté recherche sur un projet en binôme reliant BeamNG.drive à BeepBeep 3, un moteur de traitement de flux d'événements développé au LIF.$$,
      $$Intégration de la communication entre le simulateur automobile BeamNG.drive et BeepBeep 3.
Travail de programmation réseau/sockets avec Java et Python.$$
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
  where slug = 'beamng-drive-beepbeep-3'
),
technology_seed(slug, display_order) as (
  values
    ('java', 10),
    ('python', 20),
    ('sockets', 30),
    ('beamng-drive', 40),
    ('beepbeep-3', 50)
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
