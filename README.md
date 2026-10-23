# ⏰ RiseUp — Un-Snoozeable Alarm (PWA)

A full-fledged installable Progressive Web App alarm clock with **no snooze button**. To dismiss an alarm you must prove you're awake.

## Features
- **Multiple recurring alarms** — Once, Daily, Mon–Fri, Sat–Sun; persisted in localStorage; auto re-arms daily.
- **Dismiss gauntlet (no snooze exists):**
  - **Math** — 3 correct answers in a row; any mistake resets progress.
  - **Typing** — type a random 6-word phrase exactly; typos reset it.
  - **Movement** — 10s of real accelerometer movement on mobile; chase-the-dot fallback on desktop.
  - **Walk-away secret code** — set a code when arming, write it on paper far from bed, and type it to dismiss.
- Loud pulsing siren via Web Audio (no audio files), fullscreen takeover, vibration, screen wake-lock.
- **Installable PWA** — manifest + service worker; fully offline once installed.

## Project structure
```
riseup/
├── index.html            # App shell
├── manifest.webmanifest  # PWA manifest
├── sw.js                 # Offline service worker
├── icon.svg              # App icon (scalable)
├── css/style.css         # Styles
└── js/
    ├── app.js            # Storage, scheduling, audio, install
    └── challenges.js     # Anti-snooze challenge stages
```

## Run locally
Any static server from the `riseup/` folder:
```bash
npx serve .
# or
python3 -m http.server 8080
```
Then open http://localhost:8080. (A static server is needed for the service worker; file:// works for everything except offline install.)

## Deploy
See [DEPLOY.md](DEPLOY.md) for free deployment on Cloudflare Pages / Netlify / GitHub Pages.

## Important limitation
Browsers only fire alarms while the app/tab is running (the wake-lock keeps the screen on). For alarms that fire with the app closed, a native mobile app is required.
