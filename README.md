# Krince Film Archive V4.0 — Integrated

A consolidated stable build of the personal film archive. UI language: Traditional Chinese (Hong Kong).

## Included in V4.0

- Live Google Sheet + TMDB library
- Resumable legacy migration (one record at a time, retries, refresh every 10 records)
- TMDB zh-HK title / poster / backdrop / synopsis / director / cast / runtime
- TMDB community rating (`vote_average`) + vote count
- Existing V2/V3 libraries can backfill the new TMDB rating fields without changing watch records
- Library filters: year, region, genre, director, cast, viewing platform, personal rating
- Library sorting: release year, title, personal rating, TMDB rating, date added
- Discover: region, decade, person, genre, platform, pagination, combine/refine filters
- Discover toggle to hide films already in the library
- Bulk add from Discover
- Manual add when TMDB has no record
- Delete a film + its watch record
- Re-match a wrongly matched TMDB film while preserving personal watch data
- Review Queue for ambiguous legacy migration matches
- Functional Stats tabs for year / region / director / cast / genre
- Designed poster fallback when TMDB has no poster
- Rotating Home hero sourced from the user's film library

## Upgrade from the current live version

1. **Let any currently running migration finish first.**
2. In Google Apps Script, replace all of `Code.gs` with `apps-script/Code.gs` from this build.
3. Save.
4. **Deploy → Manage deployments → Edit → Version: New version → Deploy.**
   - Keep the same deployment.
   - Your `/exec` URL does not change.
   - `TMDB_READ_TOKEN`, `WRITE_TOKEN`, and the existing Sheet remain unchanged.
5. In GitHub, overwrite the existing front-end files/folders with this build.
6. Wait for GitHub Pages to redeploy and hard-refresh the site.

You do **not** need to run `setupDatabase()` again. On first V4 use, the backend automatically appends the new TMDB rating columns to the existing `Films` sheet header without shifting the old data.

## Review Queue

When migration cannot safely identify a film, Home shows **待確認配對**. Open it to see the old title and TMDB candidates. Candidate details include poster/year/director/cast when available. Choosing the correct film resolves the Migration row and adds the correct TMDB film to the library.

For a film that was already matched incorrectly (for example an old `Dr Strange` being matched instead of Marvel's `Doctor Strange`), open that film and use **重新配對**. The backend moves the existing personal watch data to the new TMDB film and updates the related Migration record.

## TMDB rating

Movie detail pages show:

- **我的評分** — the user's personal 0.5–5 rating
- **TMDB** — TMDB community `vote_average / 10` and vote count

Older already-imported films may not yet have these two fields in the Sheet. Opening a detail page can fetch the live score; if the browser already has the user's `WRITE_TOKEN`, the score is cached back to the Sheet. Re-running **同步／續傳舊片單** under the V4 backend also backfills missing TMDB scores while leaving watch records untouched.

## Data model

- `Films`: external movie metadata + TMDB IDs
- `Watches`: personal status/date/platform/rating/note
- `Migration`: legacy import matching and review state

TMDB metadata and personal watch data remain separated so the external movie database never overwrites the user's notes, rating, viewing status or date.

## Security

- `TMDB_READ_TOKEN` stays in Apps Script Script Properties; never commit it to GitHub.
- `WRITE_TOKEN` stays in Apps Script Script Properties and the user's browser local storage; never commit it to GitHub.
- The Apps Script `/exec` URL itself is not treated as a secret.

## TMDB attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
