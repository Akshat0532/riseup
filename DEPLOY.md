# Deploying RiseUp

RiseUp is a static PWA — any static host works. No environment variables or secrets are needed.

## Option 1 — Cloudflare Pages (recommended, free)
1. Cloudflare Dashboard → Workers & Pages → Create → Pages → **Connect to Git** and pick this repo.
2. Build settings: Framework preset **None**, build command empty, output directory `/`.
3. Deploy. You get `https://<project>.pages.dev` — open it on your phone and use **Add to Home Screen**.

## Option 2 — Netlify Drop
Drag the `riseup/` folder onto https://app.netlify.com/drop. Done.

## Option 3 — GitHub Pages
Settings → Pages → Source: deploy from branch `main`, root `/`. Site: `https://akshat0532.github.io/riseup/`.

## Post-deploy checklist
- Visit the URL once online — the service worker caches all assets.
- On Android Chrome: menu → **Add to Home screen** → app installs standalone.
- On iOS Safari: Share → **Add to Home Screen** (motion permission is prompted on first alarm).
- Allow notifications/vibration if prompted; keep the device charging overnight.
