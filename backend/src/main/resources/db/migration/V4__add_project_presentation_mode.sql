alter table projects
  add column presentation_mode varchar(32);

update projects
set presentation_mode = case
  when slug = 'beamng-drive-beepbeep-3' then 'CARD_ONLY'
  else 'DETAIL'
end;

alter table projects
  alter column presentation_mode set not null;

alter table projects
  add constraint projects_presentation_mode_check
  check (presentation_mode in ('CARD_ONLY', 'DETAIL'));
