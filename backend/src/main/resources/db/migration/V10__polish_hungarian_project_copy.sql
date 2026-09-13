-- Refine the Hungarian game description without changing already-applied migrations.
update project_translations
set short_description = replace(short_description, 'négysoros játék', 'Connect Four (négyet egy sorba) játék'), updated_at = now()
where locale = 'hu' and project_id = (select id from projects where slug = 'blaze4');

update project_section_translations
set content = replace(content, 'négysoros játék', 'Connect Four (négyet egy sorba) játék'), updated_at = now()
where locale = 'hu' and section_id in (select id from project_sections where project_id = (select id from projects where slug = 'blaze4'));
