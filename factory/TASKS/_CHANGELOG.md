# Changelog - Athena CMS Factory

## [8.0.3] - 2026-03-02
### ⚡ User Experience & Interaction Standard (v8.1)
- **Swapped Dock Interaction Logic**: De interactie tussen de Dock en de Site is fundamenteel verbeterd. 
    - **Normale klik**: Voert nu altijd de standaard actie uit (link volgen, knop indrukken). Dit lost het probleem op waarbij live sites op GitHub Pages (zoals Athena Hub) Shift+Klik vereisten voor navigatie.
    - **Shift + Klik**: Is nu de standaard methode om een element te selecteren voor bewerking in de Athena Dock.
- **Universal Tooltip Update**: Alle `Editable` componenten (`EditableText`, `EditableLink`, `EditableMedia`) tonen nu de correcte instructie in de tooltip: "Shift+Klik om te bewerken".
- **Global Patch**: De nieuwe logica is batch-gewijs uitgerold naar alle 30+ bestaande sites in de `sites/` directory via een geautomatiseerde engine-patch.

## [8.0.2] - 2026-03-02
### ⚡ Performance & Scalability Optimization
- **Parallel Publisher Workflow**: De monorepo-publisher (`athena-publisher.yml`) is volledig herschreven. Sites worden nu parallel gebouwd en gepusht via een matrix-job, wat de deployment-tijd voor bulk-updates met circa 70% verlaagt.
- **Smart Caching**: Implementatie van `pnpm` store caching op GitHub Actions, waardoor `pnpm install` nagenoeg onmiddellijk klaar is bij herhaalde runs.
- **Optional Audits**: Lighthouse scans zijn nu standaard gedeactiveerd (triggerbaar via `[audit]` in commit) om de feedback-loop te versnellen.

### 🎨 Identity & Aesthetics
- **Randomized Logo Generator**: Introductie van een gecentraliseerde SVG-generator in de Factory-engine. Elke nieuwe site krijgt nu automatisch een uniek, gestileerd logo (Cirkel, Vierkant, Hexagon of Badge) gebaseerd op de sitenaam en primaire kleur.
- **Batch Logo Rollout**: Alle 36 bestaande portfolio-sites zijn voorzien van een uniek gegenereerd logo om lege slots in de headers te elimineren.
- **Urban Soles Media Overhaul**: Alle product-placeholders zijn vervangen door kwalitatieve, lokale afbeeldingen van echte sportschoenen.

### 🛒 E-Commerce & Structural Integrity
- **Cart Isolation Protocol**: De `CartContext` in de kern-boilerplates is aangepast om `localStorage` sleutels te gebruiken op basis van de `site_name`. Dit voorkomt dat winkelwagentjes van verschillende Athena-sites op hetzelfde domein met elkaar vermengd raken.
- **New Site Type**: `premium-webshop-filter` is toegevoegd aan de Factory. Dit type ondersteunt standaard interactieve product-filtering en categorie-badges, gebaseerd op de geoptimaliseerde Urban Soles structuur.

### 🛡️ Fixed & Refined
- **Logo Resolution**: `EditableMedia` is robuuster gemaakt voor paden die al `images/` bevatten, en ondersteunt nu logo's in de `public/` root.
- **Site Renaming**: `Code Crafters Bold` is gepromoveerd naar de standaard `Code Crafters` site; de oude versie is hernoemd naar `Code Crafters Plain`.
- **Publisher Fix**: De workflow stript nu trailing newlines van site-namen om `cd` errors in de runner te voorkomen.
- **Tailwind v4 Fix**: Conflicterende `@import` regels in `main.jsx` en `index.css` opgelost om 500 errors te voorkomen.

---

## [8.0.0-alpha] - 2026-03-01
### 💎 The v8 Gold Standard - Excellence Cycle
Dit is een fundamentele upgrade van de Factory-architectuur, gericht op 100% stabiliteit tussen de Dock en de Site, en een significante verbetering van de performance (LCP).

### 🚀 Breakthrough: v33 Sync Bridge (State Recovery Protocol)
**Het Probleem:** 
In complexe React-omgevingen traden race-conditions op waarbij de Dock-modal leeg bleef of waarden (zoals URLs) direct na het loslaten van een slider "terugsprongen" naar de oude JSON-waarde. Dit kwam doordat de server-write (opslaan op schijf) trager was dan de React re-render.

**De Oplossing (v33):**
- **On-Demand Sync:** De Dock "vraagt" nu bij het openen van een modal (of bij focus) expliciet aan de site: `DOCK_REQUEST_SYNC`.
- **State Responder:** De site (`App.jsx`) antwoordt direct met de data uit zijn actuele React-geheugen via `SITE_SYNC_RESPONSE`.
- **Ref-Based Binding:** De `VisualEditor` in de Dock gebruikt nu `useRef` en `defaultValue` in plaats van directe `value` binding om te voorkomen dat React-cycles de tekstvakken leegmaken tijdens het typen.

### 🛠️ Nieuwe Architectuur-Standaarden
- **Data Aggregation:** Introductie van `all_data.json`. De site laadt nu alle content in één netwerkverzoek, wat de LCP met **45%** verlaagt (getest op `athena-hub`: 2.1s -> 1.1s).
- **Modular Sections:** De monolithische `Section.jsx` is vervangen door een modulaire structuur in `src/components/sections/` (`HeroSection.jsx`, `ProductSection.jsx`, etc.).
- **Universal Save Bridge:** De "Save to Disk" knop gebruikt nu een veilige batch-update via een speciaal geconfigureerde Vite-middleware met harde CORS-headers.
- **Session Persistence:** Live-overrides worden tijdens de sessie gebufferd in de `sessionStorage` van de browser, waardoor wijzigingen behouden blijven, zelfs bij een harde pagina-ververs (F5).

### 🛡️ Security & Integrity
- **Media Mapper Filter:** Metadata-tabellen (`site_settings`, `style_bindings`) worden nu automatisch verborgen in de Visual Media Mapper om accidentele corruptie van systeemconfiguraties te voorkomen.
- **CORS Hardening:** De Vite-server van elke site is nu standaard uitgerust met handmatige CORS-headers voor poort 5001 en 5002.

---

## [7.9.7] - 2026-02-28
### Fixed
- **Jets Archive Restoration**: Resolved a critical white-page crash in `jets-archive` by wrapping the `App` component in a `HashRouter`.
- **Registry Port Correction**: Updated the centralized `sites.json` to reflect port 6225 for `jets-archive`.

... rest of history remains unchanged ...

## [2026-03-01] v8.0.1 - Athena Hub Showcase Update
- **Feature**: Toegevoegd 'showcase' sectie aan Athena Hub met 5 top-tier demo's.
- **Fix**: Hersteld hero CTA koppeling naar #showcase.
- **Optimization**: Lokale opslag van alle showcase afbeeldingen voor snelheid en betrouwbaarheid.
- **Architecture**: Verfijning van HeroSection image-key detectie via JSON volgorde.
