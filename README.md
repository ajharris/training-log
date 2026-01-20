# Training Log (Local First)

A local-first personal training log that stores session JSON files in this repo. It uses the File System Access API when available so the browser can read and write directly into the `data/` folder. A fallback export/import flow is included for browsers that cannot write to disk.

## Features

- Log strength, grappling drills, cardio, and mobility entries.
- One session file per day stored at `data/sessions/YYYY-MM-DD.json`.
- Templates for quick session setup.
- History list and lightweight charts for progress tracking.
- Local-first storage with a manual fallback option.

## Project structure

- `data/exercises.json`: canonical list of exercises and movements.
- `data/templates.json`: named templates for quick session setup.
- `data/sessions/YYYY-MM-DD.json`: daily sessions.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

3. Open the app in your browser. It should work on desktop and mobile browsers on the same network.

## Using File System Access API

1. Click **Choose repo folder**.
2. Pick the root folder of this repository.
3. The app can now read and write JSON files in `data/`.

Changes are written immediately to disk, so you can review and commit them with git.

## Fallback storage (manual export/import)

If the File System Access API is not available, the app switches to fallback mode. In this mode:

- Sessions are stored in local storage until you export them.
- Use **Export JSON** on the Today screen to download a session file.
- Use the History screen import control to load exported JSON files.
- Copy exported files into `data/sessions` to keep them in the repo.

## Notes

- Templates can be edited in the Templates screen.
- Exercises are managed in the Templates screen and used for quick name suggestions.
- Tag fields accept comma-separated values.
