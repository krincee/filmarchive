# Krince Film Archive V2.7 — GitHub Live Build

This build is intended for real sync on GitHub Pages.

- Keep Google Apps Script backend on V2.6. No backend change is required.
- ChatGPT's sandbox preview blocks external Apps Script requests, so sync is intentionally disabled there.
- `/data/legacy_library_bootstrap.json` and `/data/legacy_migration_queue.json` are included for GitHub Pages.

## Deploy
Upload the CONTENTS of this folder to the repository root, then enable GitHub Pages from the main branch / root.
Open the resulting github.io URL and press `同步舊片單`.
