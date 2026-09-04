# App sources

Each Astro-native web app keeps its scripts and modules in a folder here,
with its stylesheet files in a `styles/` subfolder:

```text
src/app/<name>/            # app scripts/modules, bundled by Astro
src/app/<name>/styles/     # per-app stylesheet files
src/pages/app/<name>/      # the app page (uses layouts/Base.astro)
```

The page imports the app scripts and styles so Astro bundles them, e.g. from
`src/pages/app/<name>/index.astro`:

```astro
---
import '../../../app/<name>/styles/style.css';
---

<script>
  import main from '../../../app/<name>/main.ts';
</script>
```

To appear on the `/apps` listing, add a `metadata.json` next to the sources
with the same `title` / `date` / `introduction` fields the legacy apps use:

```json
{
  "title": "My app",
  "date": "2026-01-01",
  "introduction": "What this app does."
}
```

Legacy standalone apps (raw HTML/CSS/JS/WASM served from `app/<name>/`) keep
using `layouts/AppLayoutClassical.astro`.