# Krince Film Archive V4.1 — Auto-save + Review Fix

## What changed
- Explore / 搜尋新增電影會即時寫入 Google Sheet，不再需要重新跑 339 部舊片單 migration。
- TMDB 電影新增只傳 `tmdbId + 觀看紀錄`；完整 metadata 由 Apps Script server-side 拉取，避免 JSONP URL 太長而失敗。
- 新增 persistent pending queue：網絡失敗或離開頁面，未完成寫入會保留在 browser，下次開 App 自動續傳。
- 首頁會顯示待上傳數量；舊片單已搬遷後，「同步舊片單」降級成維護功能。
- 待確認配對：候選並行載入、兼容舊候選格式、確認按鈕有 loading 狀態，成功後會重新載入片庫與 Review Queue。
- `app.js / styles.css / config.js` 加 `?v=4.1` cache-busting，減少 GitHub Pages/Chrome 食舊檔案。

## Upgrade
1. Apps Script: replace Code.gs with V4.1, Save.
2. Deploy → Manage deployments → Edit → New version → Deploy.
3. Check `/exec?action=health` shows `Krince Film Archive V4.1`.
4. Replace GitHub repo root files with this build and wait for Pages deployment.
5. Hard refresh once.

Existing Sheet data, TMDB token, WRITE_TOKEN, and /exec URL remain unchanged.
