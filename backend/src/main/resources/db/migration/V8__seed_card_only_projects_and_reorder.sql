-- Seed additional real CARD_ONLY projects and normalize the current public ordering.
-- Sources:
-- - https://github.com/BaptisteWetterwald/ecole-ios-frequensisa
-- - https://github.com/BaptisteWetterwald/ecole-android-summercamp
-- - https://github.com/BaptisteWetterwald/discord-bot-ensisa-ir

with project_order(slug, display_order) as (
  values
    ('portfolio-spring-angular', 10),
    ('blaze4', 20),
    ('frequensisa', 30),
    ('summercamp', 40),
    ('bot-discord-ir', 50),
    ('beamng-drive-beepbeep-3', 60)
)
update projects
set
  display_order = project_order.display_order,
  updated_at = timestamp with time zone '2026-08-30 00:00:00+00'
from project_order
where projects.slug = project_order.slug;

with seed_clock(seed_at) as (
  values (timestamp with time zone '2026-08-30 00:00:00+00')
),
project_seed(slug, github_url, display_order) as (
  values
    ('frequensisa', 'https://github.com/BaptisteWetterwald/ecole-ios-frequensisa', 30),
    ('summercamp', 'https://github.com/BaptisteWetterwald/ecole-android-summercamp', 40),
    ('bot-discord-ir', 'https://github.com/BaptisteWetterwald/discord-bot-ensisa-ir', 50)
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
  project_seed.slug,
  null,
  project_seed.github_url,
  null,
  false,
  'PUBLISHED',
  'CARD_ONLY',
  project_seed.display_order,
  seed_clock.seed_at,
  seed_clock.seed_at,
  null
from project_seed
cross join seed_clock
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
    ('Swift', 'swift'),
    ('SwiftUI', 'swiftui'),
    ('SQLite', 'sqlite'),
    ('Kotlin', 'kotlin'),
    ('Jetpack Compose', 'jetpack-compose'),
    ('Android', 'android'),
    ('Room', 'room'),
    ('Node.js', 'node-js'),
    ('JavaScript', 'javascript'),
    ('discord.js', 'discord-js')
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
translation_seed(project_slug, locale, title, short_description) as (
  values
    (
      'frequensisa',
      'fr',
      'Frequensisa',
      $$Application iOS d'écoute et de gestion de radios Internet, développée en Swift avec persistance SQLite et lecture audio via AVPlayer.$$
    ),
    (
      'frequensisa',
      'en',
      'Frequensisa',
      $$iOS application for listening to and managing Internet radio stations, built in Swift with SQLite persistence and AVPlayer audio playback.$$
    ),
    (
      'summercamp',
      'fr',
      'SummerCamp',
      $$Application Android de gestion de camps de vacances développée en Kotlin avec Jetpack Compose et persistance Room.$$
    ),
    (
      'summercamp',
      'en',
      'SummerCamp',
      $$Android summer-camp management application built with Kotlin, Jetpack Compose and Room persistence.$$
    ),
    (
      'bot-discord-ir',
      'fr',
      'Bot Discord IR',
      $$Bot Discord développé en Node.js pour centraliser des commandes et services utiles à la classe Informatique et Réseaux de l'ENSISA.$$
    ),
    (
      'bot-discord-ir',
      'en',
      'Bot Discord IR',
      $$Discord bot built with Node.js to centralize commands and utilities for the ENSISA Computer Science and Networks class.$$
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
  projects.id,
  translation_seed.locale,
  translation_seed.title,
  translation_seed.short_description,
  null::text,
  seed_clock.seed_at,
  seed_clock.seed_at
from translation_seed
join projects on projects.slug = translation_seed.project_slug
cross join seed_clock
on conflict (project_id, locale) do update
set
  title = excluded.title,
  short_description = excluded.short_description,
  detailed_description = excluded.detailed_description,
  updated_at = excluded.updated_at;

with technology_seed(project_slug, technology_slug, display_order) as (
  values
    ('frequensisa', 'swift', 10),
    ('frequensisa', 'swiftui', 20),
    ('frequensisa', 'sqlite', 30),
    ('summercamp', 'kotlin', 10),
    ('summercamp', 'jetpack-compose', 20),
    ('summercamp', 'android', 30),
    ('summercamp', 'room', 40),
    ('bot-discord-ir', 'node-js', 10),
    ('bot-discord-ir', 'javascript', 20),
    ('bot-discord-ir', 'discord-js', 30),
    ('bot-discord-ir', 'sqlite', 40)
)
insert into project_technologies (
  project_id,
  technology_id,
  display_order
)
select
  projects.id,
  technologies.id,
  technology_seed.display_order
from technology_seed
join projects on projects.slug = technology_seed.project_slug
join technologies on technologies.slug = technology_seed.technology_slug
on conflict (project_id, technology_id) do update
set display_order = excluded.display_order;
