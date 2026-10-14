# A birthday for Bukky

An interactive birthday website built with Next.js App Router, React, TypeScript, Tailwind CSS, Motion, and Lucide icons. The cake illustration is included; no personal photographs or external services are needed.

The entrance leads to a single, non-scrolling invitation screen. Once Bukky confirms, the Happy Birthday story opens at the top and becomes scrollable.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. To check the production build:

```bash
npm run typecheck
npm run build
npm run start
```

`npm run start` serves the exported production site at `http://127.0.0.1:3000`.

## Personalize

Edit [`birthday.config.ts`](./birthday.config.ts) to change Bukky's name, romantic messages, notes, letter, gift message, theme colors, or enabled sections. The site has no countdown or photo gallery.

The floating music controller plays an original melody generated in the browser after a visitor taps it. To use your own track, place a file in `public/audio/` and set `musicSource` to its URL, such as `/audio/our-song.mp3`. Use music you own or are allowed to share. It never autoplays.

The generated cake illustration lives at `public/images/birthday-still-life.png`. The interactive cake, candles, envelope, gift, confetti, and fireworks are built with code.

## Deploy to Vercel

1. Push this folder to a Git repository.
2. Import that repository into Vercel as a Next.js project.
3. Use the default build command (`npm run build`) and deploy. No environment variables are required.

The site works as a keepsake at any time; it does not depend on a birthday date.
