# Study Space

A standalone study website. Name a session, choose a 1–180 minute countdown or a live clock, select a theme, and mix calming sounds. Starting opens a minimal time-and-music view; Change session returns to setup. Escape leaves focus mode.

Run `npm start` and open http://localhost:3001. No dependencies or build step are required. The site files are in `dist/` and can also be hosted on a static web host.

Audio is synthesized locally with Web Audio: filtered rain-like noise, swelling ocean-like noise, brown noise, and a quiet harmonic drone. These are generated soundscapes, not field recordings. Audio begins only after a sound is selected. Each layer has its own volume, and a global mute preserves the mix.

The timer uses a wall-clock deadline to catch up after background tab throttling. Session data is not saved. Only the selected theme is stored on this device. Fonts load from Google Fonts with system fallbacks.

## Public website

https://pradip17k.github.io/study-space/

GitHub Pages serves `docs/` from `main`. The standalone source is in `dist/`. After changing the website, copy the updated contents of `dist/` into `docs/` and push both directories. No backend, account, or installation is needed to use the website.

## Mobile and streaming update

Phone and tablet layouts now have larger touch targets, safe-area spacing, and a centered focus view. Stream music accepts full Spotify and YouTube links; its official player remains visible during focus. Audio resumption after a mobile interruption may require a tap. Provider playback and sign-in requirements still apply. Run `node test/stream-link.test.cjs` to check URL validation.
