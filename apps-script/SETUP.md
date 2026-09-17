# Google Sheet + TMDB setup — V2

The app already boots with Krince's 2021–2026 legacy movie list locally. These steps turn it into the live Google Sheet + TMDB version.

1. Create a blank Google Sheet named **Krince Film Archive**.
2. Open **Extensions → Apps Script** from that Sheet.
3. Replace `Code.gs` with this project's `apps-script/Code.gs`.
4. In **Project Settings → Script Properties**, add only:
   - `TMDB_READ_TOKEN` — your TMDB API Read Access Token (Bearer token).
   - `WRITE_TOKEN` — a private sync code you choose yourself.
5. Run `setupDatabase()` once from Apps Script and authorize it. The script automatically remembers the bound Sheet ID and creates:
   - `Films`
   - `Watches`
   - `Migration`
6. Deploy as **Web app**:
   - Execute as: **Me**
   - Who has access: use the option appropriate for your personal deployment.
7. Copy the `/exec` URL into `config.js` as `APPS_SCRIPT_URL`.
8. Reload the GitHub Pages app. On Home, press **同步舊片單** once. The app migrates the legacy queue in small batches, matches via TMDB, dedupes by TMDB ID and fills posters/metadata.
9. Ambiguous old entries are not guessed. They stay in the `Migration` sheet with `match_status = review` and candidate IDs/titles for later confirmation.

## Migration rules

- Old categories such as 周星馳 / 劉德華 are **not** used as new app categories.
- They remain hidden provenance only where useful for migration.
- Grouped cells such as `倩女幽魂1、2`, `逃學威龍123`, `Harry Potter 1、2、3`, `Back to the Future 1、2` are expanded before matching.
- Final dedupe uses TMDB ID.
- Legacy viewing dates use a range. After TMDB supplies the release year, the earliest possible watch year is automatically tightened to `max(2021, release year)`.
- `一半 / 少少 / 亂睇` becomes the agreed viewing status rather than a review note.

## Security

- The TMDB token lives in Apps Script Script Properties, never GitHub.
- `WRITE_TOKEN` is never committed to GitHub; the browser asks for it once on the first write and stores it locally.
- This is a personal single-user V2. If it becomes a public/multi-user product, replace the write token with proper authentication.

## TMDB attribution

Before a public deployment using TMDB data/images, add TMDB's approved logo in an About/Credits area and keep the required TMDB attribution notice. See TMDB's official attribution requirements.
