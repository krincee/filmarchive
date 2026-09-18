# Apps Script upgrade — V4.0 Integrated

The Google Sheet / TMDB connection is already configured for the existing project. For this upgrade:

1. Wait for any currently running migration to finish.
2. Open the Sheet → **Extensions → Apps Script**.
3. Open `Code.gs`, select all, and replace it with the V4 `Code.gs` in this folder.
4. Save.
5. Do **not** delete or recreate Script Properties. Keep:
   - `TMDB_READ_TOKEN`
   - `WRITE_TOKEN`
   - `SHEET_ID` (created automatically by the earlier setup)
6. **Deploy → Manage deployments → Edit → New version → Deploy.**
7. Keep the existing `/exec` URL.

You do not need to run `setupDatabase()` again. V4 will ensure the existing sheets/headers are current when requests run.

### Health check

Open:

`YOUR_EXEC_URL?action=health`

Expected service label:

`Krince Film Archive V4.0`

### Existing data

V4 does not wipe the current `Films`, `Watches`, or `Migration` data. New TMDB rating columns are appended to `Films`.
