# TheGodotAssetHub

Funky third-party hub for free Godot resources, our own simple assets, and shaders.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy on Azure (free)

Use **Azure Static Web Apps** (Free tier) — right fit for this Astro static site.

### 1. Put the project on GitHub

```bash
cd C:\Users\matth\Documents\ASSETSALES
git init
git add .
git commit -m "Initial TheGodotAssetHub site"
git branch -M main
git remote add origin https://github.com/YOUR_USER/thegodotassethub.git
git push -u origin main
```

### 2. Create the Static Web App in Azure

1. Open [Azure Portal](https://portal.azure.com) → **Create a resource** → **Static Web App**
2. Basics:
   - **Plan type:** Free
   - **Region:** closest to you (e.g. West Europe)
3. Deployment details:
   - **Source:** GitHub
   - Authorize Azure, pick your repo + `main`
4. Build details:
   - **Build Presets:** Custom
   - **App location:** `/`
   - **Api location:** *(leave empty)*
   - **Output location:** `dist`
5. Create

Azure will add a deploy workflow / API token. If you already have [`.github/workflows/azure-static-web-apps.yml`](.github/workflows/azure-static-web-apps.yml), make sure the secret `AZURE_STATIC_WEB_APPS_API_TOKEN` exists in the repo (Azure usually sets this automatically).

### 3. Custom domain (optional)

Static Web App → **Custom domains** → add your domain and follow the DNS instructions.

## Content

Edit JSON in `src/data/`:

- `resources.json` — curated external free resources
- `assets.json` — hub assets
- `shaders.json` — shader gallery + snippets

Preview art lives in `public/previews/`. Models in `public/models/`.
