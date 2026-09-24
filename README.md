# Krince Film Archive V4.2 — Performance

V4.2 focuses only on speed and responsiveness.

## What changed
- Instant first paint from the browser's last saved library; Google Sheet refresh now runs in the background.
- Google Sheet `library` response is cached server-side for 5 minutes and invalidated immediately after writes.
- Review count is bundled into the library response, removing one startup request.
- Library renders 60 posters at a time and auto-loads more near the bottom instead of building hundreds of cards at once.
- Library search is debounced, reducing full-grid redraws while typing.
- Normal add/edit autosave no longer reloads the entire database after each write.
- TMDB search, person, detail and discover results are cached in Apps Script.
- Existing app icon/PWA files are preserved.

## Upgrade
1. Replace Apps Script with `apps-script/Code.gs`.
2. Save → Deploy → Manage deployments → Edit → New version → Deploy.
3. Confirm `/exec?action=health` says `Krince Film Archive V4.2`.
4. Upload the contents of this folder to the GitHub repo root.
5. Wait for GitHub Pages deployment, then hard refresh once.

No need to run `setupDatabase()` again. Existing TMDB token, WRITE_TOKEN, Sheet data, and `/exec` URL stay the same.


## V4.3 Homepage polish
- Homepage hero now rotates across the full image-ready library, with favourites lightly weighted rather than hard-limiting the pool.
- Recent hero history avoids repeating the same covers across new tabs/sessions.
- Homepage poster rail shows up to 14 films instead of a fixed six; when exact watch dates are unavailable it rotates through a broader library mix.
- 1980s Hong Kong memory card now uses a real matching film backdrop/poster with a safe text overlay instead of a static gradient placeholder.
- Backend remains V4.2; no Apps Script update is required for this front-end-only release.


V4.3.1: Fixed the homepage memory-card image. Recognizes 香港 / Hong Kong / HK and renders a real img element instead of a CSS-only background. Front-end only; Apps Script V4.2 stays unchanged.
