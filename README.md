# A birthday for Bukky

An interactive birthday website built with Next.js App Router, React, TypeScript, Tailwind CSS, Motion, and Lucide icons. The cake illustration is included; no personal photographs or external services are needed.

The entrance leads to a single, non-scrolling invitation screen, followed by a single, non-scrolling coral confession screen. Continue opens the Happy Birthday story at the top, where scrolling begins.

## Run locally

Install Node.js 24, then open a terminal in this folder and run:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Keep the terminal running while you view the site. Stop it with `Ctrl+C`.

To check the production build locally:

```bash
npm run typecheck
npm run build
npm run start
```

After `npm run build`, `npm run start` serves the exported production site at `http://127.0.0.1:3000`. Stop it with `Ctrl+C`.

## Personalize

Edit [`birthday.config.ts`](./birthday.config.ts) to change Bukky's name, romantic messages, six flip cards, nine revealable facts, letter, gift message, theme colors, or enabled sections. The site has no countdown, photo gallery, or sound control.

The generated cake illustration lives at `public/images/birthday-still-life.png`. The interactive cake, candles, envelope, gift, confetti, and fireworks are built with code.

A rhythmic piano arrangement of the familiar **Happy Birthday** tune starts when Bukky presses **Begin your birthday surprise** and loops through the experience. Its audio file is `public/audio/bukky-birthday-tune.wav`. To regenerate it after editing the score, run `node scripts/generate-birthday-piano.mjs`.

## Deploy to Netlify when ready

1. Create a GitHub repository and push this project when you are ready. The `node_modules`, `.next`, and `out` folders are ignored by Git.
2. In Netlify, choose **Add new project → Import an existing project**, connect GitHub, and select the repository.
3. The included `netlify.toml` sets the build command to `npm run build` and the publish directory to `out`. The `.nvmrc` file selects Node.js 24. Leave the base directory at the repository root.
4. Deploy. Later pushes to the connected GitHub branch will trigger new Netlify builds.

This project uses Next.js static export, so Netlify serves the generated files directly. The GitHub repository does not need to include `out` or any generated build files. No environment variables are required for the site itself.

The site works as a keepsake at any time; it does not depend on a birthday date.
