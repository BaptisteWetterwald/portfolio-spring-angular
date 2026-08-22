create table projects (
  id bigserial primary key,
  slug varchar(120) not null,
  logo_media_ref varchar(500),
  github_url varchar(500),
  demo_url varchar(500),
  featured boolean not null default false,
  status varchar(32) not null,
  display_order integer not null default 0,
  created_at timestamp(6) with time zone not null default now(),
  updated_at timestamp(6) with time zone not null default now(),
  published_at timestamp(6) with time zone,
  constraint projects_slug_unique unique (slug),
  constraint projects_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint projects_status_check check (status in ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);

create table project_translations (
  id bigserial primary key,
  project_id bigint not null,
  locale varchar(8) not null,
  title varchar(180) not null,
  short_description varchar(320) not null,
  detailed_description text,
  created_at timestamp(6) with time zone not null default now(),
  updated_at timestamp(6) with time zone not null default now(),
  constraint project_translations_project_fk
    foreign key (project_id) references projects (id) on delete cascade,
  constraint project_translations_locale_check check (locale in ('fr', 'en')),
  constraint project_translations_title_not_blank check (length(btrim(title)) > 0),
  constraint project_translations_short_description_not_blank check (length(btrim(short_description)) > 0),
  constraint project_translations_project_locale_unique unique (project_id, locale)
);

create table technologies (
  id bigserial primary key,
  name varchar(120) not null,
  slug varchar(120) not null,
  icon_ref varchar(500),
  category varchar(80),
  created_at timestamp(6) with time zone not null default now(),
  updated_at timestamp(6) with time zone not null default now(),
  constraint technologies_name_unique unique (name),
  constraint technologies_slug_unique unique (slug),
  constraint technologies_name_not_blank check (length(btrim(name)) > 0),
  constraint technologies_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table project_technologies (
  project_id bigint not null,
  technology_id bigint not null,
  display_order integer not null default 0,
  constraint project_technologies_pk primary key (project_id, technology_id),
  constraint project_technologies_project_fk
    foreign key (project_id) references projects (id) on delete cascade,
  constraint project_technologies_technology_fk
    foreign key (technology_id) references technologies (id) on delete restrict
);

create index idx_projects_status_featured_display_order
  on projects (status, featured, display_order);

create index idx_projects_status_display_order
  on projects (status, display_order);

create index idx_project_translations_locale
  on project_translations (locale);

create index idx_project_technologies_technology_id
  on project_technologies (technology_id);

create index idx_project_technologies_project_order
  on project_technologies (project_id, display_order);
