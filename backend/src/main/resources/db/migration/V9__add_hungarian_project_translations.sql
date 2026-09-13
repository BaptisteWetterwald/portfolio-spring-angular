-- Extend the existing project domain to Hungarian without changing publication eligibility.
alter table project_translations drop constraint project_translations_locale_check;
alter table project_translations add constraint project_translations_locale_check check (locale in ('fr', 'en', 'hu'));
alter table project_section_translations drop constraint project_section_translations_locale_check;
alter table project_section_translations add constraint project_section_translations_locale_check check (locale in ('fr', 'en', 'hu'));

with copy(slug, title, short_description) as (values
  ('portfolio-spring-angular', 'Portfolio Spring Angular', $$Többnyelvű portfólió Angular SSR, Spring Boot, PostgreSQL és Flyway használatával, lokalizált tartalommal és strukturált projektesettanulmányokkal.$$),
  ('blaze4', 'Blaze4', $$C#/.NET-alapú négysoros játék N-rétegű architektúrával, ASP.NET Core REST API-val, Blazor WebAssembly felülettel és Entity Framework Core adattárolással.$$),
  ('frequensisa', 'Frequensisa', $$Swiftben készült iOS-alkalmazás internetes rádióállomások hallgatásához és kezeléséhez, SQLite-adattárolással és AVPlayer-hanglejátszással.$$),
  ('summercamp', 'SummerCamp', $$Kotlinban készült Android-alkalmazás nyári táborok kezelésére, Jetpack Compose felülettel és Room-adattárolással.$$),
  ('bot-discord-ir', 'Bot Discord IR', $$Node.js-alapú Discord-bot az ENSISA Informatika és Hálózatok évfolyamának parancsaihoz és segédeszközeihez.$$),
  ('beamng-drive-beepbeep-3', 'BeamNG.drive × BeepBeep 3', $$Kutatási jellegű egyetemi szakmai gyakorlat egy kétszemélyes projekten, amely a BeamNG.drive szimulátort kapcsolja össze a LIF által fejlesztett BeepBeep 3 eseményfolyam-feldolgozó motorral.$$)
)
insert into project_translations(project_id, locale, title, short_description)
select projects.id, 'hu', copy.title, copy.short_description from copy join projects using (slug);

with copy(slug, display_order, title, content) as (values
  ('portfolio-spring-angular', 10, 'Háttér', $$A Portfolio Spring Angular Baptiste Wetterwald portfólióalkalmazása. Lokalizált szakmai tartalmat és valódi projekteket mutat be egy Spring Boot és PostgreSQL backend segítségével.$$),
  ('portfolio-spring-angular', 20, 'Architektúra', $$Az alkalmazás egy Angular 22 SSR frontendre és egy Spring Boot backendre oszlik. A projektadatokat PostgreSQL tárolja, a sémamigrációkat Flyway kezeli, a teljes helyi környezetet pedig Docker Compose kapcsolja össze.$$),
  ('portfolio-spring-angular', 30, 'Projektek és tartalom', $$A projekteket a backend kezeli: közzétételi állapottal, megjelenítési móddal, fordításokkal, rendezett technológiákkal és strukturált részletes szakaszokkal. Az Angular frontend útvonal-feloldókon keresztül használja a tömör lista-DTO-kat és a részletes projekt-DTO-kat.$$),
  ('portfolio-spring-angular', 40, 'SSR, SEO és akadálymentesség', $$A /fr, /en és /hu útvonalak renderelése a szerveren, a kérés időpontjában történik. A frontend lokalizált metaadatokat, kanonikus URL-eket, hreflang hivatkozásokat és a nem elérhető projektekhez noindex jelölést használ, szemantikus navigációval és billentyűzettel elérhető műveletekkel.$$),
  ('blaze4', 10, 'Háttér', $$A Blaze4 egy négysoros játék webalkalmazása, amely egy N-rétegű architektúrákkal foglalkozó egyetemi projekt keretében készült. Fő célja az üzleti logika, az adatelérés és a felhasználói felület világos szétválasztása volt.$$),
  ('blaze4', 20, 'Architektúra', $$Az alkalmazás több .NET-projektből áll: ASP.NET Core REST API-t biztosító alkalmazásrétegből, Entity Framework Core-alapú adatelérési rétegből, Blazor WebAssembly frontendből, közös DTO-projektből és tesztprojektből.$$),
  ('blaze4', 30, 'Üzleti logika és API', $$A backend kezeli a játékok létrehozását, a játékmenetet és a körök ellenőrzését. A játék fogalmait külön domainmodellek írják le; a szolgáltatások, repositoryk és mapperek elkülönítik az üzleti logikát, az adattárolást és az API-szerződéseket.$$),
  ('blaze4', 40, 'Hitelesítés és adattárolás', $$Az alkalmazás JWT-hitelesítéssel támogatja a játékosok regisztrációját és bejelentkezését. Az adatokat SQLite tárolja az Entity Framework Core és annak migrációi segítségével.$$)
)
insert into project_section_translations(section_id, locale, title, content)
select sections.id, 'hu', copy.title, copy.content
from copy join projects on projects.slug = copy.slug
join project_sections sections on sections.project_id = projects.id and sections.display_order = copy.display_order;

update project_translations set short_description = replace(short_description, 'Bilingual', 'Multilingual'), updated_at = now()
where project_id = (select id from projects where slug = 'portfolio-spring-angular') and locale = 'en';
update project_translations set short_description = replace(short_description, 'bilingue', 'multilingue'), updated_at = now()
where project_id = (select id from projects where slug = 'portfolio-spring-angular') and locale = 'fr';
update project_section_translations set content = replace(content, '/fr and /en', '/fr, /en and /hu'), updated_at = now()
where section_id in (select id from project_sections where project_id = (select id from projects where slug = 'portfolio-spring-angular')) and locale = 'en';
update project_section_translations set content = replace(content, '/fr et /en', '/fr, /en et /hu'), updated_at = now()
where section_id in (select id from project_sections where project_id = (select id from projects where slug = 'portfolio-spring-angular')) and locale = 'fr';
