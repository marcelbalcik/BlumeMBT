# Im Blumenladen 🌸

A tiny, installable **PWA** that teaches a complete beginner the German she needs
to work as an assistant in a German flower shop. It runs offline on an Android
phone (Add to Home Screen → opens standalone).

Three fixed characters appear every time:

- **Kunde / Customer** (blush)
- **Chef / Boss** (gold)
- **Sie / You** — the learner (green)

Content is split into four CEFR levels — **A1 · A2 · B1 · B2** (21 interactions
each, 84 total). Pick a level, read the scene, tap **Tip** for a hint, type your
German reply, and **Check my answer** for forgiving fuzzy feedback. Every German
line has a ♪ speak button (Web Speech API, no external TTS), and **▶ Play scene**
reads the whole interaction line by line with a speed control.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173/im-blumenladen/
npm run build    # produces an installable PWA in dist/
npm run preview  # preview the production build
```

(The icons in `public/icons/` are generated placeholders. Regenerate them any
time with `node scripts/make-icons.mjs`.)

## Deploy to GitHub Pages

GitHub Pages serves from a subpath like `https://USERNAME.github.io/REPO/`, so
the app **must** be built for that path or it loads to a blank screen.

1. **Set the repo name in `vite.config.js`.** Change:

   ```js
   const base = "/im-blumenladen/"; // ← change to "/<your-repo-name>/"
   ```

   Keep the leading and trailing slashes.

2. **Push to `main`.** The included GitHub Actions workflow
   (`.github/workflows/deploy.yml`) builds the app and publishes `dist/`.

3. **Enable Pages.** In your repo: **Settings → Pages → Build and deployment →
   Source: GitHub Actions**.

4. **Open the URL on your phone:** `https://USERNAME.github.io/REPO/`.

5. **Install it:** in Android Chrome, menu **⋮ → Add to Home Screen**. It opens
   standalone and keeps working with no network.

## Editing the content

All content lives in [`src/data/situations.js`](src/data/situations.js) as an
exported array, plus `levels` and a `getByLevel(level)` helper. Add a new
interaction by appending one object following the existing schema (`id`, `level`,
`title`, `setting`, `script`, `cue`, `tip`, `accepted`, `model`, `modelEn`,
`grammar`). The German uses the polite **Sie / Ihnen** throughout.

## How grading works

`src/lib/evaluate.js` is intentionally kind. It normalises both answers
(lowercase, strip punctuation, fold `ä→ae ö→oe ü→ue ß→ss` so an English keyboard
works), then does a token-level fuzzy match (Levenshtein similarity ≥ 0.8) against
every `accepted` variant, keeps the best score, and gives tiered, encouraging
feedback. The model answer and grammar note are always revealed afterwards —
the score is guidance, not judgement.

## Project structure

```
src/
  App.jsx
  main.jsx
  styles.css
  data/situations.js
  lib/evaluate.js
  lib/speak.js
  components/Avatar.jsx
  components/SpeechBubble.jsx
  components/LevelPicker.jsx
  components/SituationView.jsx
index.html
vite.config.js          (vite-plugin-pwa configured for a Pages subpath)
.github/workflows/deploy.yml
```
