# Recruitment review — 13 September 2026

Current presentation order: Home → Experience → Education → Projects → GitHub activity → Contact. GitHub remains supporting content without a navigation destination. Core technologies remain in the introduction; the full skills catalogue is no longer rendered. Project and experience technology lists retain their context.

Approved public information:

- Preferred locations: Luxembourg or Budapest.
- Availability: from December 2026; no commitment to 1 December.
- English: C1.
- GitHub: <https://github.com/BaptisteWetterwald>.
- LinkedIn: <https://www.linkedin.com/in/baptiste-wetterwald/>.
- The e-mail address remains in the CV; Home offers a Contact section link instead of repeating it.
- French and English CVs are served from [the public CV directory](../frontend/public/assets/cv/). The Hungarian page explicitly offers the English CV. No telephone link is displayed on the website.

The portfolio repository is now public; its existing URL was verified with an HTTP 200 response. No project link migration is needed.

## Hungarian support

The main document is `/hu`, project detail paths are `/hu/projektek/:slug`, and section fragments remain stable across all three languages. Locale cookies, Accept-Language negotiation, language switching, canonical URLs, hreflang and sitemap generation share the supported locale model. Hungarian does not represent an additional spoken-language proficiency claim.

[Migration V9](../backend/src/main/resources/db/migration/V9__add_hungarian_project_translations.sql) extends the locale constraints and translates all six project summaries and the eight structured sections of the two detail projects. Existing publication and CARD_ONLY rules are preserved. Deploy the compatible backend migration before serving the new frontend.

## Visual corrections

Global link/button inheritance excludes daisyUI buttons. The document declares CSS layer order before SSR critical styles are injected, so Tailwind base resets cannot override daisyUI button backgrounds and text colors. Browser regression checks cover light/dark submit contrast, mobile reflow and CV placement.

A [lighthouse favicon](../frontend/public/favicon.svg) is declared. The shared Open Graph image is now a [1200 × 630 JPEG](../frontend/public/assets/social/baptiste-wetterwald-social-card-v2.jpg), approximately 107 KB rather than the previous 1.26 MB PNG. The previous file remains available for existing references.

## Verification and remaining editorial work

Frontend checks: `npm run format:check`, `npm run lint`, `npm test -- --watch=false`, `npm run build`, `npm run smoke:ssr`, and `npm run smoke:browser`. Backend checks use `docker compose up -d postgres`, then the Maven wrapper with `test package`; tests manage isolated temporary schemas.

No new mission outcomes, metrics, explanation of the 2025 employment overlap, project screenshots or personal design decisions have been invented. These require factual input before an editorial expansion. Contact delivery to a real inbox and production deployment are outside this local validation.

## Final language and interface review

The introduction presents core technologies, biography, preferred locations and availability, profile/contact/CV buttons, then language badges (French native, English C1 / TOEIC 975, German B1). All three locales share this order. The Hungarian page intentionally links to the English CV; institutional names and technology trademarks retain their original spelling. Country names are localized in Hungarian.

[Migration V10](../backend/src/main/resources/db/migration/V10__polish_hungarian_project_copy.sql) clarifies the Hungarian Connect Four description without rewriting V9. English diploma labels explain the DUT and the baccalaureate honours. Interface dictionaries are checked for identical keys and interpolation placeholders.

GitHub repositories precede the live contribution calendar. Both floating controls start at the vertical centre; the mobile sonar remains draggable. The lighthouse rotates once every 48 seconds and pauses in light mode, resuming from its previous position in dark mode. Reduced motion keeps a static beam.

Release scope: open a PR, wait for validation, merge into main, and verify main CI/image publication. The user will handle VPS deployment separately. No production credentials or local test tools belong in the release.
