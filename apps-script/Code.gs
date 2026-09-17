/**
 * Krince Film Archive — Google Apps Script backend (V2)
 * Google Sheets = personal database; TMDB token stays server-side.
 */
const FILMS_SHEET = 'Films';
const WATCHES_SHEET = 'Watches';
const MIGRATION_SHEET = 'Migration';

const FILM_HEADERS = [
  'internal_id','tmdb_id','source','media_type','title_zh_hk','title_en','original_title',
  'release_year','release_date','regions','original_language','genres','director','cast',
  'runtime','poster_path','backdrop_path','overview_zh_hk','overview_en','created_at','updated_at'
];
const WATCH_HEADERS = [
  'watch_id','film_id','status','watched_date','watched_from','watched_to','date_precision',
  'platform','rating','note','is_rewatch','created_at','updated_at'
];
const MIGRATION_HEADERS = [
  'legacy_id','raw_title','match_query','year_hint','legacy_source','match_status','tmdb_id',
  'matched_title','matched_year','confidence','review_reason','candidates_json','last_error','updated_at'
];

function doGet(e) {
  const callback = String((e.parameter && e.parameter.callback) || '').trim();
  try {
    const action = String((e.parameter && e.parameter.action) || 'health').trim();
    let data;
    switch (action) {
      case 'health': data = {ok:true, service:'Krince Film Archive V2.6'}; break;
      case 'library': data = getLibrary_(); break;
      case 'tmdbSearch': data = tmdbSearch_(e.parameter.q || ''); break;
      case 'tmdbDetails': data = tmdbDetails_(e.parameter.id || ''); break;
      case 'discover': data = tmdbDiscover_(e.parameter || {}); break;
      case 'migrationStatus': data = migrationStatus_(); break;
      case 'migrationReview': data = migrationReview_(); break;
      case 'write':
        assertWriteToken_(e.parameter.writeToken || '');
        data = handleJsonpWrite_(String(e.parameter.op || ''), safeJson_(e.parameter.payload || '{}', {}));
        break;
      default: throw new Error('Unknown action: ' + action);
    }
    return callback ? jsonp_(data, callback) : json_(data);
  } catch (err) {
    const out = {error:String(err && err.message || err)};
    return callback ? jsonp_(out, callback) : json_(out);
  }
}


function handleJsonpWrite_(op, payload) {
  switch (op) {
    case 'addFilm': return upsertFilmAndWatch_(payload.film || {});
    case 'updateFilm': return upsertFilmAndWatch_(payload.film || {});
    case 'bulkAdd': return bulkAdd_(payload.films || []);
    case 'migrateLegacyBatch': return migrateLegacyBatch_(payload.records || []);
    case 'resolveMigration': return resolveMigration_(payload.record || {});
    default: throw new Error('Unknown write action: ' + op);
  }
}

function doPost(e) {
  let requestId = '';
  let bridge = false;
  try {
    const body = parsePostBody_(e);
    requestId = String(body.requestId || '');
    bridge = truthy_(body.bridge);
    assertWriteToken_(body.writeToken || '');
    let data;
    switch (body.action) {
      case 'addFilm': data = upsertFilmAndWatch_(body.film || {}); break;
      case 'updateFilm': data = upsertFilmAndWatch_(body.film || {}); break;
      case 'bulkAdd': data = bulkAdd_(body.films || []); break;
      case 'migrateLegacyBatch': data = migrateLegacyBatch_(body.records || []); break;
      case 'resolveMigration': data = resolveMigration_(body.record || {}); break;
      default: throw new Error('Unknown POST action: ' + body.action);
    }
    return bridge ? bridgeResponse_({ok:true,data:data}, requestId) : json_(data);
  } catch (err) {
    const out = {error:String(err && err.message || err)};
    return bridge ? bridgeResponse_({ok:false,error:out.error}, requestId) : json_(out);
  }
}

function setupDatabase() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SHEET_ID')) {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) props.setProperty('SHEET_ID', active.getId());
  }
  const ss = getSpreadsheet_();
  ensureSheet_(ss, FILMS_SHEET, FILM_HEADERS);
  ensureSheet_(ss, WATCHES_SHEET, WATCH_HEADERS);
  ensureSheet_(ss, MIGRATION_SHEET, MIGRATION_HEADERS);
  return 'Database ready: ' + ss.getName();
}

function getLibrary_() {
  setupDatabase();
  const ss = getSpreadsheet_();
  const films = sheetObjects_(ss.getSheetByName(FILMS_SHEET));
  const watches = sheetObjects_(ss.getSheetByName(WATCHES_SHEET));
  const byFilm = {};
  watches.forEach(w => {
    if (!byFilm[w.film_id]) byFilm[w.film_id] = [];
    byFilm[w.film_id].push(w);
  });
  const migrationRows = sheetObjects_(ss.getSheetByName(MIGRATION_SHEET));
  const migratedLegacyIds = migrationRows.filter(r => r.match_status === 'matched').map(r => String(r.legacy_id));
  return {migratedLegacyIds:migratedLegacyIds, films:films.map(f => {
    const ws = (byFilm[f.internal_id] || []).sort((a,b) => String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at)));
    const primary = ws[0] || {};
    return {
      id:f.internal_id, tmdbId:f.tmdb_id ? Number(f.tmdb_id) : null, source:f.source,
      titleZh:f.title_zh_hk, titleEn:f.title_en, originalTitle:f.original_title,
      year:f.release_year ? Number(f.release_year) : null, releaseDate:f.release_date, region:f.regions,
      originalLanguage:f.original_language, genres:splitPipe_(f.genres), director:f.director,
      cast:splitPipe_(f.cast), runtime:Number(f.runtime)||null,
      posterPath:f.poster_path, backdropPath:f.backdrop_path,
      overviewZh:f.overview_zh_hk, overviewEn:f.overview_en,
      status:primary.status || 'complete', watchedDate:primary.watched_date,
      watchedFrom:primary.watched_from, watchedTo:primary.watched_to,
      datePrecision:primary.date_precision || 'unknown', platform:primary.platform,
      rating:primary.rating === '' || primary.rating == null ? null : Number(primary.rating),
      note:primary.note || '', isRewatch:ws.some(w => truthy_(w.is_rewatch)), watchHistory:ws
    };
  })};
}

function tmdbSearch_(query) {
  query = String(query || '').trim();
  if (!query) return {results:[]};
  const zh = tmdb_('/search/movie', {query:query, language:'zh-HK', include_adult:'false', page:1});
  let en = {results:[]};
  try { en = tmdb_('/search/movie', {query:query, language:'en-US', include_adult:'false', page:1}); } catch (_) {}
  const enMap = {};
  (en.results || []).forEach(r => enMap[r.id] = r.title || r.original_title || '');
  return {results:(zh.results || []).slice(0,16).map(r => ({
    id:r.id, tmdbId:r.id, titleZh:r.title || r.original_title,
    titleEn:enMap[r.id] || r.original_title || '', originalTitle:r.original_title || '',
    year:(r.release_date || '').slice(0,4), releaseDate:r.release_date || '',
    posterPath:r.poster_path || '', backdropPath:r.backdrop_path || '',
    overviewZh:r.overview || '', popularity:r.popularity || 0
  }))};
}

function tmdbDetails_(id) {
  if (!id) throw new Error('TMDB id required');
  const zh = tmdb_('/movie/' + encodeURIComponent(id), {language:'zh-HK', append_to_response:'credits,translations'});
  let en = {};
  try { en = tmdb_('/movie/' + encodeURIComponent(id), {language:'en-US'}); } catch (_) {}
  const translations = (zh.translations && zh.translations.translations) || [];
  const zhTitle = bestZhTitle_(translations) || zh.title || zh.original_title;
  const directors = ((zh.credits && zh.credits.crew) || []).filter(x => x.job === 'Director').map(x => x.name);
  const cast = ((zh.credits && zh.credits.cast) || []).slice(0,15).map(x => x.name);
  return {
    tmdbId:zh.id, titleZh:zhTitle, titleEn:en.title || zh.original_title || '', originalTitle:zh.original_title || '',
    year:(zh.release_date || '').slice(0,4), releaseDate:zh.release_date || '',
    region:(zh.production_countries || []).map(x => x.name).join('／'), originalLanguage:zh.original_language || '',
    genres:(zh.genres || []).map(x => x.name), director:directors.join('／'), cast:cast,
    runtime:zh.runtime || '', posterPath:zh.poster_path || '', backdropPath:zh.backdrop_path || '',
    overviewZh:zh.overview || '', overviewEn:en.overview || '', source:'tmdb', mediaType:'movie'
  };
}

function tmdbDiscover_(p) {
  const params = {language:'zh-HK', include_adult:'false', include_video:'false', sort_by:p.sort || 'popularity.desc', page:p.page || 1};
  if (p.country) params.with_origin_country = p.country;
  if (p.yearFrom) params['primary_release_date.gte'] = p.yearFrom + '-01-01';
  if (p.yearTo) params['primary_release_date.lte'] = p.yearTo + '-12-31';
  if (p.genre) params.with_genres = p.genre;
  if (p.cast) params.with_cast = p.cast;
  if (p.crew) params.with_crew = p.crew;
  if (p.provider) { params.watch_region = p.watchRegion || 'HK'; params.with_watch_providers = p.provider; }
  const r = tmdb_('/discover/movie', params);
  return {page:r.page, totalPages:r.total_pages, results:(r.results || []).map(x => ({
    id:x.id, tmdbId:x.id, titleZh:x.title || x.original_title, titleEn:x.original_title || '',
    originalTitle:x.original_title || '', year:(x.release_date || '').slice(0,4), releaseDate:x.release_date || '',
    posterPath:x.poster_path || '', backdropPath:x.backdrop_path || '', overviewZh:x.overview || ''
  }))};
}

function upsertFilmAndWatch_(film) {
  if (!film || !(film.titleZh || film.tmdbId)) throw new Error('Film title or TMDB id required');
  setupDatabase();
  const ss = getSpreadsheet_();
  const filmsSheet = ss.getSheetByName(FILMS_SHEET);
  const watchesSheet = ss.getSheetByName(WATCHES_SHEET);
  let enriched = Object.assign({}, film);
  if (film.tmdbId) {
    try { enriched = Object.assign({}, tmdbDetails_(film.tmdbId), film); } catch (_) {}
  }
  const internalId = enriched.tmdbId ? 'tmdb-' + enriched.tmdbId : (enriched.id && String(enriched.id).indexOf('manual-') === 0 ? enriched.id : 'manual-' + Utilities.getUuid());
  const now = new Date().toISOString();
  const existingFilm = getByKey_(filmsSheet, FILM_HEADERS, 'internal_id', internalId) || {};
  const filmRow = {
    internal_id:internalId, tmdb_id:enriched.tmdbId || '', source:enriched.tmdbId ? 'tmdb' : (enriched.source || 'manual'), media_type:'movie',
    title_zh_hk:enriched.titleZh || existingFilm.title_zh_hk || '', title_en:enriched.titleEn || existingFilm.title_en || '',
    original_title:enriched.originalTitle || existingFilm.original_title || '', release_year:enriched.year || existingFilm.release_year || '',
    release_date:enriched.releaseDate || existingFilm.release_date || '', regions:enriched.region || existingFilm.regions || '',
    original_language:enriched.originalLanguage || existingFilm.original_language || '', genres:joinPipe_(enriched.genres) || existingFilm.genres || '',
    director:enriched.director || existingFilm.director || '', cast:joinPipe_(enriched.cast) || existingFilm.cast || '',
    runtime:enriched.runtime || existingFilm.runtime || '', poster_path:enriched.posterPath || existingFilm.poster_path || '',
    backdrop_path:enriched.backdropPath || existingFilm.backdrop_path || '', overview_zh_hk:enriched.overviewZh || existingFilm.overview_zh_hk || '',
    overview_en:enriched.overviewEn || existingFilm.overview_en || '', created_at:existingFilm.created_at || enriched.createdAt || now, updated_at:now
  };
  upsertByKey_(filmsSheet, FILM_HEADERS, 'internal_id', internalId, filmRow);

  const watchId = 'watch-' + internalId;
  const oldWatch = getByKey_(watchesSheet, WATCH_HEADERS, 'watch_id', watchId) || {};
  let watchedFrom = enriched.watchedFrom || oldWatch.watched_from || '';
  let watchedTo = enriched.watchedTo || oldWatch.watched_to || '';
  if ((enriched.datePrecision || oldWatch.date_precision) === 'range' && filmRow.release_year) {
    const start = Math.max(Number(String(watchedFrom || '2021').slice(0,4)) || 2021, Number(filmRow.release_year) || 2021);
    watchedFrom = String(start);
    watchedTo = String(Number(String(watchedTo || '2026').slice(0,4)) || 2026);
  }
  const watchRow = {
    watch_id:watchId, film_id:internalId, status:mergeStatus_(oldWatch.status, enriched.status || 'complete'),
    watched_date:enriched.watchedDate || oldWatch.watched_date || '', watched_from:watchedFrom, watched_to:watchedTo,
    date_precision:enriched.datePrecision || oldWatch.date_precision || 'unknown', platform:enriched.platform || oldWatch.platform || '',
    rating:enriched.rating == null ? (oldWatch.rating == null ? '' : oldWatch.rating) : enriched.rating,
    note:enriched.note || oldWatch.note || '', is_rewatch:(truthy_(enriched.isRewatch) || truthy_(oldWatch.is_rewatch)) ? 'TRUE' : 'FALSE',
    created_at:oldWatch.created_at || enriched.watchCreatedAt || now, updated_at:now
  };
  upsertByKey_(watchesSheet, WATCH_HEADERS, 'watch_id', watchId, watchRow);
  return {ok:true,id:internalId,tmdbId:enriched.tmdbId || null};
}

function bulkAdd_(films) {
  let count = 0;
  (films || []).forEach(f => {
    const copy = Object.assign({}, f, {
      status:f.status || 'complete', datePrecision:f.datePrecision || 'range',
      watchedFrom:f.watchedFrom || String(Math.max(2021, Number(f.year)||2021)), watchedTo:f.watchedTo || '2026'
    });
    upsertFilmAndWatch_(copy); count++;
  });
  return {ok:true,count:count};
}

function migrateLegacyBatch_(records) {
  setupDatabase();
  const ss = getSpreadsheet_();
  const migrationSheet = ss.getSheetByName(MIGRATION_SHEET);
  let matched = 0, review = 0, skipped = 0, errors = 0;
  (records || []).forEach(rec => {
    try {
      const prior = getByKey_(migrationSheet, MIGRATION_HEADERS, 'legacy_id', rec.legacy_id) || {};
      if (prior.match_status === 'matched') { skipped++; return; }
      const result = matchLegacyRecord_(rec);
      if (result.status === 'matched') {
        const d = tmdbDetails_(result.tmdbId);
        upsertFilmAndWatch_(Object.assign({}, d, {
          status:rec.status || 'complete', datePrecision:'range',
          watchedFrom:String(Math.max(2021, Number(d.year)||2021)), watchedTo:'2026',
          platform:rec.platform || '', rating:null, note:'', isRewatch:false
        }));
        saveMigrationRow_(migrationSheet, rec, result, 'matched', '');
        matched++;
      } else {
        saveMigrationRow_(migrationSheet, rec, result, 'review', result.reason || '需要確認');
        review++;
      }
    } catch (err) {
      saveMigrationRow_(migrationSheet, rec, {candidates:[]}, 'error', String(err && err.message || err));
      errors++;
    }
  });
  return {ok:true,matched:matched,review:review,skipped:skipped,errors:errors};
}

function matchLegacyRecord_(rec) {
  const query = String(rec.match_query || rec.raw_title || '').trim();
  if (!query) return {status:'review',reason:'沒有片名',candidates:[]};
  const params = {query:query, language:'zh-HK', include_adult:'false', page:1};
  if (rec.year_hint) params.year = rec.year_hint;
  const zh = tmdb_('/search/movie', params);
  let en = {results:[]};
  try {
    const ep = {query:query, language:'en-US', include_adult:'false', page:1};
    if (rec.year_hint) ep.year = rec.year_hint;
    en = tmdb_('/search/movie', ep);
  } catch (_) {}
  const merged = mergeSearchResults_(zh.results || [], en.results || []).slice(0,6);
  const candidates = merged.map(r => ({id:r.id,title:r.title || r.original_title || '',originalTitle:r.original_title || '',year:(r.release_date || '').slice(0,4)}));
  if (!merged.length) return {status:'review',reason:'TMDB 搜尋不到',candidates:candidates};
  const top = merged[0];
  if (truthy_(rec.force_review)) return {status:'review',reason:'舊紀錄本身有歧義',candidates:candidates};

  const qn = normalizeTitle_(query);
  let aliases = [top.title, top.original_title, top._enTitle].filter(Boolean);
  let exact = aliases.some(x => normalizeTitle_(x) === qn);
  if (!exact) {
    try { aliases = aliases.concat(tmdbAliasTitles_(top.id)); } catch (_) {}
    exact = aliases.some(x => normalizeTitle_(x) === qn);
  }
  const topYear = Number((top.release_date || '').slice(0,4)) || 0;
  const hint = Number(rec.year_hint) || 0;
  const yearOK = !hint || topYear === hint;
  if ((exact && yearOK) || (rec.query_rewritten_from && hint && yearOK)) {
    return {status:'matched',tmdbId:top.id,confidence:exact?'exact-title':'explicit-rewrite',candidates:candidates};
  }
  return {status:'review',reason:hint && !yearOK ? '年份不吻合' : '片名需要人工確認',candidates:candidates};
}

function tmdbAliasTitles_(id) {
  const out = [];
  try {
    const a = tmdb_('/movie/' + encodeURIComponent(id) + '/alternative_titles', {});
    (a.titles || []).forEach(x => { if (x.title) out.push(x.title); });
  } catch (_) {}
  try {
    const t = tmdb_('/movie/' + encodeURIComponent(id) + '/translations', {});
    (t.translations || []).forEach(x => { if (x.data && x.data.title) out.push(x.data.title); });
  } catch (_) {}
  return out;
}

function mergeSearchResults_(zh, en) {
  const map = {}, order = [];
  (zh || []).forEach(r => { map[r.id] = Object.assign({}, r); order.push(r.id); });
  (en || []).forEach(r => {
    if (!map[r.id]) { map[r.id] = Object.assign({}, r); order.push(r.id); }
    map[r.id]._enTitle = r.title || r.original_title || '';
  });
  return order.map(id => map[id]);
}

function saveMigrationRow_(sheet, rec, result, status, reason) {
  const now = new Date().toISOString();
  const top = (result.candidates || [])[0] || {};
  upsertByKey_(sheet, MIGRATION_HEADERS, 'legacy_id', rec.legacy_id, {
    legacy_id:rec.legacy_id, raw_title:rec.raw_title || '', match_query:rec.match_query || '', year_hint:rec.year_hint || '',
    legacy_source:rec.legacy_source_column || '', match_status:status, tmdb_id:result.tmdbId || top.id || '',
    matched_title:top.title || '', matched_year:top.year || '', confidence:result.confidence || '',
    review_reason:reason || '', candidates_json:JSON.stringify(result.candidates || []).slice(0,45000),
    last_error:status === 'error' ? reason : '', updated_at:now
  });
}

function migrationStatus_() {
  setupDatabase();
  const rows = sheetObjects_(getSpreadsheet_().getSheetByName(MIGRATION_SHEET));
  const counts = {matched:0,review:0,error:0,total:rows.length};
  rows.forEach(r => { if (counts[r.match_status] != null) counts[r.match_status]++; });
  return counts;
}

function migrationReview_() {
  setupDatabase();
  const rows = sheetObjects_(getSpreadsheet_().getSheetByName(MIGRATION_SHEET)).filter(r => r.match_status === 'review' || r.match_status === 'error');
  return {records:rows.map(r => ({
    legacyId:r.legacy_id, rawTitle:r.raw_title, matchQuery:r.match_query, yearHint:r.year_hint,
    reason:r.review_reason || r.last_error || '', candidates:safeJson_(r.candidates_json, [])
  }))};
}

function resolveMigration_(record) {
  if (!record.legacyId) throw new Error('legacyId required');
  if (!record.tmdbId) throw new Error('tmdbId required');
  const d = tmdbDetails_(record.tmdbId);
  upsertFilmAndWatch_(Object.assign({}, d, {
    status:record.status || 'complete', datePrecision:'range', watchedFrom:String(Math.max(2021,Number(d.year)||2021)),
    watchedTo:'2026', platform:record.platform || '', note:'', rating:null
  }));
  const sh = getSpreadsheet_().getSheetByName(MIGRATION_SHEET);
  const old = getByKey_(sh, MIGRATION_HEADERS, 'legacy_id', record.legacyId) || {};
  old.match_status='matched'; old.tmdb_id=record.tmdbId; old.matched_title=d.titleZh; old.matched_year=d.year;
  old.confidence='manual-review'; old.review_reason=''; old.last_error=''; old.updated_at=new Date().toISOString();
  upsertByKey_(sh, MIGRATION_HEADERS, 'legacy_id', record.legacyId, old);
  return {ok:true};
}

function tmdb_(path, params) {
  const token = PropertiesService.getScriptProperties().getProperty('TMDB_READ_TOKEN');
  if (!token) throw new Error('Missing TMDB_READ_TOKEN in Script Properties');
  const base = 'https://api.themoviedb.org/3' + path;
  const qs = Object.keys(params || {}).filter(k => params[k] !== '' && params[k] != null).map(k => encodeURIComponent(k)+'='+encodeURIComponent(params[k])).join('&');
  const response = UrlFetchApp.fetch(base + (qs ? '?' + qs : ''), {
    method:'get', headers:{Authorization:'Bearer ' + token, accept:'application/json'}, muteHttpExceptions:true
  });
  const code = response.getResponseCode(), text = response.getContentText();
  if (code < 200 || code >= 300) throw new Error('TMDB ' + code + ': ' + text.slice(0,220));
  return JSON.parse(text);
}

function bestZhTitle_(translations) {
  const prefs = [['zh','HK'],['zh','TW'],['zh','CN']];
  for (let i=0;i<prefs.length;i++) {
    const hit = (translations || []).find(x => x.iso_639_1 === prefs[i][0] && x.iso_3166_1 === prefs[i][1] && x.data && x.data.title);
    if (hit) return hit.data.title;
  }
  return '';
}
function mergeStatus_(a,b) {
  const p={complete:4,partial:3,unsure:2,unknown:1};
  return (p[b]||0) >= (p[a]||0) ? (b || a || 'complete') : (a || b || 'complete');
}
function normalizeTitle_(s) {
  return String(s || '').toLowerCase().replace(/囍/g,'喜').replace(/[\s\-_:：·!！?？'"“”‘’（）()、,，.。\/\\&]/g,'');
}
function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Missing SHEET_ID. Run setupDatabase() once from the bound Sheet project.');
  return SpreadsheetApp.openById(id);
}
function assertWriteToken_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('WRITE_TOKEN');
  if (!expected) throw new Error('Missing WRITE_TOKEN in Script Properties');
  if (String(token) !== String(expected)) throw new Error('Invalid write token');
}
function ensureSheet_(ss,name,headers) {
  let sh=ss.getSheetByName(name); if(!sh) sh=ss.insertSheet(name);
  if(sh.getLastRow()===0) sh.getRange(1,1,1,headers.length).setValues([headers]);
  else {
    const existing=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),headers.length)).getValues()[0];
    if(headers.some((h,i)=>existing[i]!==h)) sh.getRange(1,1,1,headers.length).setValues([headers]);
  }
  sh.setFrozenRows(1); return sh;
}
function sheetObjects_(sh) {
  const values=sh.getDataRange().getValues(); if(values.length<2)return [];
  const headers=values[0]; return values.slice(1).filter(r=>r.some(v=>v!==''&&v!=null)).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]])));
}
function getByKey_(sh,headers,keyName,keyValue) {
  const keyCol=headers.indexOf(keyName)+1,last=sh.getLastRow(); if(last<2)return null;
  const vals=sh.getRange(2,keyCol,last-1,1).getValues().flat().map(String),idx=vals.indexOf(String(keyValue));
  if(idx<0)return null; const row=sh.getRange(idx+2,1,1,headers.length).getValues()[0];
  return Object.fromEntries(headers.map((h,i)=>[h,row[i]]));
}
function upsertByKey_(sh,headers,keyName,keyValue,obj) {
  const keyCol=headers.indexOf(keyName)+1,last=sh.getLastRow(); let row=0;
  if(last>1){const vals=sh.getRange(2,keyCol,last-1,1).getValues().flat().map(String);const idx=vals.indexOf(String(keyValue));if(idx>=0)row=idx+2;}
  const out=headers.map(h=>obj[h]==null?'':obj[h]); if(row)sh.getRange(row,1,1,headers.length).setValues([out]);else sh.appendRow(out);
}
function parsePostBody_(e) {
  const p = (e && e.parameter) || {};
  if (p.payload != null || p.action != null || p.writeToken != null) {
    const payload = safeJson_(p.payload || '{}', {});
    return Object.assign({}, payload, {
      action:String(p.action || payload.action || ''),
      writeToken:String(p.writeToken || payload.writeToken || ''),
      requestId:String(p.requestId || payload.requestId || ''),
      bridge:String(p.bridge || payload.bridge || '')
    });
  }
  return safeJson_((e.postData && e.postData.contents) || '{}', {});
}
function jsonp_(obj, callback) {
  const cb = String(callback || '');
  if (!/^[A-Za-z_$][0-9A-Za-z_$]{0,100}$/.test(cb)) return json_({error:'Invalid JSONP callback'});
  return ContentService.createTextOutput(cb + '(' + JSON.stringify(obj) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function bridgeResponse_(payload, requestId) {
  const message = {source:'krince-film-archive-bridge', requestId:String(requestId || ''), payload:payload};
  const html = '<!doctype html><meta charset="utf-8"><script>parent.postMessage(' + JSON.stringify(message).replace(/</g,'\\u003c') + ',"*");</script>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function splitPipe_(v){return String(v||'').split('|').filter(Boolean);}
function joinPipe_(v){return Array.isArray(v)?v.join('|'):String(v||'');}
function truthy_(v){return v===true||String(v).toLowerCase()==='true';}
function safeJson_(s,fallback){try{return JSON.parse(String(s||''));}catch(_){return fallback;}}
