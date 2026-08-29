alter table projects
  add constraint projects_logo_media_ref_check
  check (
    logo_media_ref is null
    or (
      logo_media_ref = btrim(logo_media_ref)
      and (
        logo_media_ref ~ '^/[^/[:space:]][^[:space:]]*$'
        or logo_media_ref ~ '^https://[^[:space:]]+$'
      )
    )
  );
