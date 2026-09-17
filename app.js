(() => {
  const CFG = window.APP_CONFIG || {};
  let API = CFG.APPS_SCRIPT_URL || localStorage.getItem('krince-api-url') || '';
  const IS_CHATGPT_PREVIEW = /(?:^|\.)oaiusercontent\.com$/i.test(location.hostname);
  const IMG = CFG.TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p/';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  const demoFilms = [
    {id:'demo-glass',tmdbId:null,titleZh:'玻璃之城',titleEn:'City of Glass',year:1998,region:'香港',genres:['劇情','愛情'],rating:5,status:'complete',platform:'',note:'有些愛情，從來都不是用來在一起的。',datePrecision:'range',watchedFrom:'2021',watchedTo:'2026',posterPath:'',backdropPath:'',tone:['#7f705e','#28322e']},
    {id:'demo-amadeus',titleZh:'Amadeus',titleEn:'Amadeus',year:1984,region:'美國',genres:['劇情','音樂'],rating:5,status:'complete',note:'',datePrecision:'range',watchedFrom:'2021',watchedTo:'2026',tone:['#9a412c','#241613']},
    {id:'demo-prestige',titleZh:'The Prestige',titleEn:'The Prestige',year:2006,region:'美國',genres:['劇情','懸疑'],rating:5,status:'complete',note:'',datePrecision:'range',watchedFrom:'2021',watchedTo:'2026',tone:['#4c4237','#111214']},
    {id:'demo-hp',titleZh:'哈利波特：神秘的魔法石',titleEn:"Harry Potter and the Philosopher's Stone",year:2001,region:'英國／美國',genres:['奇幻','冒險'],rating:5,status:'complete',note:'',datePrecision:'range',watchedFrom:'2021',watchedTo:'2026',tone:['#564c2f','#16231f']},
    {id:'demo-homealone',titleZh:'寶貝智多星',titleEn:'Home Alone',year:1990,region:'美國',genres:['喜劇','家庭'],rating:5,status:'complete',note:'',datePrecision:'range',watchedFrom:'2021',watchedTo:'2026',tone:['#a64a31','#1f4d42']},
    {id:'demo-lucy',titleZh:'LUCY：超能煞姬',titleEn:'Lucy',year:2014,region:'法國／美國',genres:['動作','科幻'],rating:5,status:'complete',note:'',datePrecision:'range',watchedFrom:'2021',watchedTo:'2026',tone:['#bbb8b4','#24384b']},
    {id:'demo-wreck',titleZh:'無敵破壞王',titleEn:'Wreck-It Ralph',year:2012,region:'美國',genres:['動畫','喜劇'],rating:5,status:'complete',note:'',datePrecision:'range',watchedFrom:'2021',watchedTo:'2026',tone:['#c75f36','#3b3b72']},
    {id:'demo-five',titleZh:'奇謀妙計五福星',titleEn:'Winners & Sinners',year:1983,region:'香港',genres:['喜劇','動作'],rating:5,status:'complete',note:'',datePrecision:'range',watchedFrom:'2021',watchedTo:'2026',tone:['#9d3325','#dca344']},
    {id:'demo-perfume',titleZh:'香水：一個殺人者的故事',titleEn:'Perfume: The Story of a Murderer',year:2006,region:'德國／法國',genres:['劇情','驚悚'],rating:4.5,status:'complete',note:'',datePrecision:'range',watchedFrom:'2021',watchedTo:'2026',tone:['#5d392a','#26201c']},
  ];

  const demoDiscover = [
    {id:'d1',titleZh:'英雄本色',titleEn:'A Better Tomorrow',year:1986,region:'香港',tone:['#3d4649','#131b20']},
    {id:'d2',titleZh:'胭脂扣',titleEn:'Rouge',year:1987,region:'香港',tone:['#752e32','#24171a']},
    {id:'d3',titleZh:'警察故事',titleEn:'Police Story',year:1985,region:'香港',tone:['#c08736','#5c2720']},
    {id:'d4',titleZh:'秋天的童話',titleEn:'An Autumn’s Tale',year:1987,region:'香港',tone:['#60736e','#c18c55']},
    {id:'d5',titleZh:'最佳拍檔',titleEn:'Aces Go Places',year:1982,region:'香港',tone:['#b65c35','#252d33']},
    {id:'d6',titleZh:'開心鬼',titleEn:'Happy Ghost',year:1984,region:'香港',tone:['#957142','#622e31']},
    {id:'d7',titleZh:'奇謀妙計五福星',titleEn:'Winners & Sinners',year:1983,region:'香港',tone:['#9d3325','#dca344'],inLibrary:true},
    {id:'d8',titleZh:'富貴逼人',titleEn:"It's a Mad, Mad, Mad World",year:1987,region:'香港',tone:['#934a3b','#d99b4a']},
    {id:'d9',titleZh:'鬼馬智多星',titleEn:'All the Wrong Clues',year:1981,region:'香港',tone:['#5b2927','#b07b32']},
    {id:'d10',titleZh:'投奔怒海',titleEn:'Boat People',year:1982,region:'香港',tone:['#2f494e','#a36e3b']},
    {id:'d11',titleZh:'似水流年',titleEn:'Homecoming',year:1984,region:'香港',tone:['#64735b','#4a3123']},
    {id:'d12',titleZh:'八星報喜',titleEn:'The Eighth Happiness',year:1988,region:'香港',tone:['#b05b4d','#483c3a']},
  ];

  let state = {
    page:'home',
    detailId:null,
    films:loadLocalFilms(),
    searchResults:[],
    searchLoading:false,
    discoverMode:'root',
    discoverResults:demoDiscover,
    discoverSelected:new Set(),
    libraryFilter:'all',
    libraryQuery:'',
    discoverLoading:false,
    migrationRunning:false,
    migrationProgress:null
  };

  function loadLocalFilms(){
    try { const saved=JSON.parse(localStorage.getItem('krince-film-library-v2')||'null'); return Array.isArray(saved)&&saved.length?saved:[]; }
    catch { return []; }
  }
  function persist(){ localStorage.setItem('krince-film-library-v2',JSON.stringify(state.films)); }
  function filmById(id){ return state.films.find(f=>f.id===id) || state.searchResults.find(f=>f.id===id) || state.discoverResults.find(f=>f.id===id) || demoDiscover.find(f=>f.id===id); }
  function stars(r=0){ const full=Math.floor(r), half=r-full>=.5; return '★'.repeat(full)+(half?'½':'') || '—'; }
  function posterBg(f){ const [a,b]=f.tone||['#6f5a4d','#27211e']; return `linear-gradient(145deg,${a},${b})`; }
  function posterImg(f,size='w500') { return f.posterPath ? `${IMG}${size}${f.posterPath}` : ''; }
  function backdropImg(f,size='w1280') { return f.backdropPath ? `${IMG}${size}${f.backdropPath}` : ''; }
  function statusLabel(s){ return ({complete:'完整睇過',partial:'睇過少少',unsure:'亂睇／唔確定睇晒未',unknown:'記唔清楚'})[s]||'完整睇過'; }
  function toast(msg){ const root=$('#toast-root'); root.innerHTML=`<div class="toast">${esc(msg)}</div>`; setTimeout(()=>root.innerHTML='',2200); }

  const icons = {
    home:`<svg viewBox="0 0 24 24"><path d="M3.5 10.5 12 3l8.5 7.5v9a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M9 21v-7h6v7"/></svg>`,
    library:`<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>`,
    search:`<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>`,
    stats:`<svg viewBox="0 0 24 24"><path d="M5 20V11M12 20V4M19 20v-7"/></svg>`,
    plus:`<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
    back:`<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>`,
    tune:`<svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6"/></svg>`,
    globe:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 4.5 6 4.5 9S15 18 12 21c-3-3-4.5-6-4.5-9S9 6 12 3"/></svg>`,
    calendar:`<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>`,
    person:`<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 21c.5-4 3-6 7-6s6.5 2 7 6"/></svg>`,
    film:`<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4"/></svg>`,
    play:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/></svg>`,
    monitor:`<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
    note:`<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>`
  };

  function chrome(content, active=state.page){
    const rail = `<aside class="desktop-rail"><div class="rail-brand">我的電影檔案<small>KRINCE'S FILM ARCHIVE · EST. 2021</small></div><nav class="rail-nav">
      ${railBtn('home','首頁')}${railBtn('library','片庫')}${railBtn('add','新增電影')}${railBtn('discover','探索電影')}${railBtn('stats','統計')}
    </nav></aside>`;
    const main = `<main>${content}</main>`;
    const mobile = `<nav class="mobile-nav">
      ${navBtn('home','首頁',icons.home)}${navBtn('library','片庫',icons.library)}${navBtn('add','新增',icons.plus,true)}${navBtn('discover','探索',icons.search)}${navBtn('stats','統計',icons.stats)}
    </nav>`;
    return rail+main+mobile;
    function railBtn(p,label){ return `<button class="rail-btn ${active===p?'active':''}" data-nav="${p}">${label}</button>`; }
    function navBtn(p,label,icon,add=false){ return `<button class="nav-btn ${active===p?'active':''} ${add?'add':''}" data-nav="${p}">${add?`<span class="round-add">${icon}</span>`:icon}<span>${label}</span></button>`; }
  }

  function posterCard(f,{selectable=false,selected=false,small=false}={}){
    const img=posterImg(f, small?'w342':'w500');
    const badge=f.status==='partial'?'部分':f.status==='unsure'?'？':'';
    return `<article class="poster-card ${selected?'selected':''}" data-film-id="${esc(f.id)}" ${selectable?'data-selectable="1"':''}>
      <div class="poster" style="--poster-bg:${posterBg(f)}">
        ${img?`<img src="${img}" alt="${esc(f.titleZh)} 海報" loading="lazy"/>`:`<div class="poster-placeholder"><span>${esc(f.titleZh)}</span></div>`}
        ${selectable?`<div class="select-mark">${selected?'✓':f.inLibrary?'✓':'○'}</div>`:badge?`<div class="poster-badge">${badge}</div>`:''}
      </div>
      <div class="poster-title">${esc(f.titleZh)}</div>
      <div class="poster-meta">${f.year||'年份不詳'}${f.rating?` · ${stars(f.rating)}`:''}</div>
    </article>`;
  }

  function renderHome(){
    const favNeedles=['玻璃之城','perfume','amadeus','prestige','home alone'];
    const heroPool=state.films.filter(f=>favNeedles.some(n=>`${f.titleZh||''} ${f.titleEn||''}`.toLowerCase().includes(n.toLowerCase())));
    const hero=heroPool[Math.floor(Math.random()*Math.max(heroPool.length,1))]||state.films[0]||demoFilms[0];
    const bg=backdropImg(hero); const heroStyle=bg?`url('${bg}') center/cover,${posterBg(hero)}`:posterBg(hero);
    const exact=state.films.filter(f=>f.datePrecision==='exact'&&f.watchedDate).sort((a,b)=>String(b.watchedDate).localeCompare(String(a.watchedDate)));
    const recent=(exact.length?exact:state.films).slice(0,6);
    const recentLabel=exact.length?'最近觀看':'片庫一覽';
    const needs=state.films.filter(f=>f.needsEnrichment).length;
    const progress=state.migrationProgress&&state.migrationRunning?`已處理 ${state.migrationProgress.done}/${state.migrationProgress.total||'…'} 部。`:'';
    // Always surface the database action on Home. An older cached build could otherwise
    // hide the migration button after loading stale demo records.
    const syncCard=`<div class="sync-card sync-card-v23"><div class="sync-copy"><div class="sync-kicker">DATABASE · ${API?'READY':'NOT CONNECTED'}</div><strong>${API?'Google Sheet 已連接':'尚未連接 Google Sheet'}</strong><span>${state.migrationRunning?progress:(API?(needs?`目前有 ${needs} 部舊紀錄等待 TMDB 補資料。`:'可以隨時同步／重新檢查你的舊片單。'):'連接後會用 TMDB 補上海報、年份同電影資料。')}</span></div>${API?`<button class="sync-primary-btn" data-run-migration ${state.migrationRunning?'disabled':''}>${state.migrationRunning?'同步中…':'同步舊片單 →'}</button><button class="sync-token-reset" data-reset-write-token>重新輸入同步碼</button>`:`<button class="sync-primary-btn" data-connect-backend>連接資料庫 →</button>`}</div>`;
    return chrome(`<section class="page">
      <div class="hero" style="--hero-bg:${heroStyle}">
        <div class="hero-art"></div><div class="hero-grain"></div>
        <div class="hero-film-tag">本次封面 · ${esc(hero.titleZh)}</div>
        <div class="hero-copy"><div class="eyebrow">KRINCE'S FILM ARCHIVE · EST. 2021</div><h1 class="display-title">我的電影檔案</h1><div class="hero-count"><strong>${state.films.length}</strong><span>部電影</span></div></div>
      </div>
      ${syncCard}
      <section class="section"><div class="section-head"><h2 class="section-title">${recentLabel}</h2><button class="section-link" data-nav="library">查看全部 ›</button></div><div class="horizontal-posters">${recent.map(f=>posterCard(f,{small:true})).join('')}</div></section>
      <section class="section"><div class="section-head"><h2 class="section-title">繼續整理你的電影記憶</h2></div><div class="memory-card" data-open-discover="hk80"><div class="memory-art"></div><div><div class="eyebrow">CONTINUE DISCOVERING</div><div class="memory-title">80年代香港電影</div><div class="memory-stat">由你記得的開始，再慢慢補回去。</div><div class="inline-arrow">繼續探索 →</div></div></div></section>
      <section class="section"><div class="section-head"><h2 class="section-title">2026</h2><button class="section-link" data-nav="stats">查看完整統計 ›</button></div><div class="year-summary"><div><strong>—</strong><p>正式年份統計會在觀看日期資料補齊後顯示</p></div><div class="muted" style="font-size:12px;text-align:right">戲院觀看<br>重新觀看</div></div></section>
    </section>`,'home');
  }

  function renderLibrary(){
    let films=state.films;
    if(state.libraryFilter!=='all') films=films.filter(f=>f.status===state.libraryFilter || (state.libraryFilter==='rewatch'&&f.isRewatch));
    if(state.libraryQuery.trim()) { const q=state.libraryQuery.toLowerCase(); films=films.filter(f=>`${f.titleZh} ${f.titleEn||''} ${(f.genres||[]).join(' ')} ${f.region||''}`.toLowerCase().includes(q)); }
    return chrome(`<section class="page">
      <div class="page-title-row"><div><h1 class="page-title">片庫</h1><div class="page-count">${state.films.length} 部電影</div></div><button class="icon-btn" aria-label="篩選">${icons.tune}</button></div>
      <div class="searchbox">${icons.search}<input id="library-search" placeholder="搜尋電影、導演、演員……" value="${esc(state.libraryQuery)}"/></div>
      <div class="chips"><button class="chip ${state.libraryFilter==='all'?'active':''}" data-filter="all">全部</button><button class="chip ${state.libraryFilter==='complete'?'active':''}" data-filter="complete">完整睇過</button><button class="chip ${state.libraryFilter==='partial'?'active':''}" data-filter="partial">睇過少少</button><button class="chip ${state.libraryFilter==='rewatch'?'active':''}" data-filter="rewatch">重新觀看</button></div>
      <div class="filter-row"><button class="filter-btn">年份⌄</button><button class="filter-btn">地區⌄</button><button class="filter-btn">類型⌄</button><button class="filter-btn">導演⌄</button><button class="filter-btn">演員⌄</button><button class="filter-btn">觀看平台⌄</button><button class="filter-btn">評分⌄</button></div>
      ${films.length?`<div class="library-grid">${films.map(f=>posterCard(f)).join('')}</div>`:`<div class="empty">片庫入面暫時搵唔到符合條件嘅電影。</div>`}
    </section>`,'library');
  }

  function renderAdd(){
    const results=state.searchResults.length?state.searchResults:state.films.filter(f=>['玻璃之城','Amadeus','The Prestige','perfume'].some(n=>`${f.titleZh} ${f.titleEn||''}`.toLowerCase().includes(n.toLowerCase()))).slice(0,4);
    return chrome(`<section class="page"><div class="add-intro"><h1>想記低哪一套電影？</h1><div class="searchbox">${icons.search}<input id="add-search" placeholder="搜尋中文名、英文名或原名……" autocomplete="off"/></div></div>
      ${state.searchLoading?`<div class="loading">搜尋緊……</div>`:`<div class="search-results">${results.map(resultRow).join('')}</div>`}
      <div class="manual-callout"><p>搵唔到你想要的電影？</p><button class="text-link" data-manual-add="1">手動新增 →</button></div>
    </section>`,'add');
  }
  function resultRow(f){ const img=posterImg(f,'w185'); return `<div class="result-row"><div class="result-poster" style="background:${posterBg(f)}">${img?`<img src="${img}" alt=""/>`:''}</div><div><div class="result-title">${esc(f.titleZh)}</div><div class="result-en">${esc(f.titleEn||f.originalTitle||'')}</div><div class="result-meta">${f.year||''}${f.region?` · ${esc(f.region)}`:''}</div></div><button class="plus-small" data-quick-add="${esc(f.id)}">＋</button></div>`; }

  function renderDiscover(){
    if(state.discoverMode==='hk80'){
      return chrome(`<section class="page"><div class="discover-toolbar"><button class="back-btn" data-discover-root>${icons.back}</button><h1>香港 · 1980年代</h1><button class="icon-btn">${icons.tune}</button></div><div class="page-count" style="margin:-10px 0 18px">瀏覽後直接揀返你睇過嘅電影</div>${state.discoverLoading?`<div class="loading">載入電影中……</div>`:`<div class="discover-grid">${state.discoverResults.map(f=>posterCard(f,{selectable:true,selected:state.discoverSelected.has(f.id)})).join('')}</div>`}</section>${state.discoverSelected.size?`<div class="bulk-bar"><span>已選擇 ${state.discoverSelected.size} 部</span><button data-bulk-add>加入我的片庫 →</button></div>`:''}`,'discover');
    }
    const options=[
      ['地區','香港 · 日本 · 韓國 · 台灣 · 美國……',icons.globe,'hk80'],
      ['年代','70s / 80s / 90s / 00s / 10s / 20s',icons.calendar,'hk80'],
      ['人物','演員 · 導演',icons.person,'hk80'],
      ['類型','喜劇 · 恐怖 · 愛情 · 劇情……',icons.film,'hk80'],
      ['平台','Netflix · Disney+ · Prime Video……',icons.play,'hk80']
    ];
    return chrome(`<section class="page"><div class="page-title-row"><div><h1 class="page-title">探索電影</h1></div></div><h2 class="explore-question">想由哪裏開始回想？</h2><div class="explore-list">${options.map(([t,s,i,m])=>`<div class="explore-card" data-open-discover="${m}"><div class="explore-icon">${i}</div><div><strong>${t}</strong><span>${s}</span></div><div>›</div></div>`).join('')}</div></section>`,'discover');
  }

  function renderStats(){
    const complete=state.films.filter(f=>f.status==='complete').length, partial=state.films.filter(f=>f.status==='partial').length, unsure=state.films.filter(f=>f.status==='unsure').length, unknown=state.films.filter(f=>f.status==='unknown').length;
    const decadeCounts={}; state.films.forEach(f=>{if(f.year){const d=Math.floor(f.year/10)*10;decadeCounts[d]=(decadeCounts[d]||0)+1;}}); const max=Math.max(1,...Object.values(decadeCounts));
    const regions={}; state.films.forEach(f=>{const r=(f.region||'待補資料').split('／')[0];regions[r]=(regions[r]||0)+1;}); const reg=Object.entries(regions).sort((a,b)=>b[1]-a[1]).slice(0,5); const regMax=Math.max(1,...reg.map(x=>x[1]));
    return chrome(`<section class="page"><div class="page-title-row"><div><h1 class="page-title">統計</h1></div></div><div class="stats-tabs"><button class="stats-tab active">總覽</button><button class="stats-tab">年份</button><button class="stats-tab">地區</button><button class="stats-tab">導演</button><button class="stats-tab">演員</button><button class="stats-tab">類型</button></div><div class="big-stat"><strong>${state.films.length}</strong><p>部曾經進入你人生的電影</p></div><div class="stat-cards"><div class="stat-mini"><strong>${complete}</strong><span>完整睇過</span></div><div class="stat-mini"><strong>${partial}</strong><span>睇過少少</span></div><div class="stat-mini"><strong>${unsure}</strong><span>不確定</span></div><div class="stat-mini"><strong>${unknown}</strong><span>記唔清楚</span></div></div>
      <section class="section"><div class="section-head"><h2 class="section-title">電影年代</h2></div><div class="bar-chart">${Object.entries(decadeCounts).sort().map(([d,c])=>`<div class="bar-item"><div class="bar" style="--h:${Math.max(9,(c/max)*120)}px"><span class="bar-value">${c}</span></div><div class="bar-label">${String(d).slice(2)}s</div></div>`).join('')}</div></section>
      <section class="section"><div class="section-head"><h2 class="section-title">觀看地區</h2></div>${reg.map(([r,c])=>`<div class="region-row"><span>${esc(r)}</span><div class="region-track"><div class="region-fill" style="width:${c/regMax*100}%"></div></div><span>${c}</span></div>`).join('')}</section><div class="credits">電影資料及圖片使用 TMDB。This product uses the TMDB API but is not endorsed or certified by TMDB.</div>
    </section>`,'stats');
  }

  function renderDetail(id){
    const f=filmById(id); if(!f){ state.page='library'; return renderLibrary(); }
    const bg=backdropImg(f); const style=bg?`background-image:url('${bg}')`:`background:${posterBg(f)}`;
    const dateText=f.datePrecision==='exact'?f.watchedDate:(f.watchedFrom&&f.watchedTo?`${f.watchedFrom}–${f.watchedTo} · 準確日期不詳`:'唔記得日期');
    return chrome(`<section class="page with-topbar"><div class="detail-hero" style="${style}"><div class="detail-top-actions"><button class="detail-action" data-back>${icons.back}</button><button class="detail-action">♡</button></div></div><div class="detail-body"><h1 class="detail-title">${esc(f.titleZh)}</h1><div class="detail-en">${esc(f.titleEn||'')}</div><div class="detail-meta">${f.year||''}${f.region?` · ${esc(f.region)}`:''}${f.genres?.length?` · ${f.genres.map(esc).join(' / ')}`:''}</div><div class="rating-row"><div class="rating-stars">${f.rating?stars(f.rating):'☆☆☆☆☆'}</div><button class="outline-btn" data-edit-film="${esc(f.id)}">編輯紀錄</button></div>
      <div class="detail-section"><h3>我的紀錄</h3><div class="record-list"><div class="record-line">${icons.play}<span>${statusLabel(f.status)}</span></div><div class="record-line">${icons.calendar}<span>${esc(dateText)}</span></div>${f.platform?`<div class="record-line">${icons.monitor}<span>${esc(f.platform)}</span></div>`:''}${f.note?`<div class="record-line">${icons.note}<div><strong>感想</strong><p class="note-quote">${esc(f.note)}</p></div></div>`:''}</div></div>
      <div class="detail-section"><h3>觀看紀錄</h3><div class="watch-history"><div class="watch-row"><span class="watch-num">1</span><strong>第一次</strong><span>${esc(dateText)}</span></div>${f.isRewatch?`<div class="watch-row"><span class="watch-num">2</span><strong>重新觀看</strong><span>${esc(f.rewatchDate||'日期不詳')}</span></div>`:''}</div></div>
      <div class="detail-section"><h3>故事簡介</h3><p class="synopsis">${esc(f.overviewZh||'接上 TMDB 後，這裏會優先顯示繁體中文（香港）故事簡介；如無 zh-HK 資料，會再 fallback 到英文。')}</p></div>
    </div></section>`,'detail');
  }

  function render(){
    let html='';
    if(state.page==='home')html=renderHome();
    else if(state.page==='library')html=renderLibrary();
    else if(state.page==='add')html=renderAdd();
    else if(state.page==='discover')html=renderDiscover();
    else if(state.page==='stats')html=renderStats();
    else if(state.page==='detail')html=renderDetail(state.detailId);
    $('#app').innerHTML=html;
    bind();
  }

  function bind(){
    $$('[data-nav]').forEach(el=>el.onclick=()=>{state.page=el.dataset.nav;state.discoverMode=state.page==='discover'?state.discoverMode:'root';render();scrollTo(0,0);});
    $$('.poster-card:not([data-selectable])').forEach(el=>el.onclick=()=>{state.detailId=el.dataset.filmId;state.page='detail';render();scrollTo(0,0);});
    $$('[data-open-discover]').forEach(el=>el.onclick=async()=>{state.page='discover';state.discoverMode=el.dataset.openDiscover;render();scrollTo(0,0);if(state.discoverMode==='hk80')await loadDiscover({country:'HK',yearFrom:1980,yearTo:1989});});
    $$('[data-discover-root]').forEach(el=>el.onclick=()=>{state.discoverMode='root';state.discoverSelected.clear();render();});
    $$('.poster-card[data-selectable]').forEach(el=>el.onclick=()=>{
      const id=el.dataset.filmId, f=filmById(id); if(f?.inLibrary){toast('呢套已經喺片庫入面');return;}
      state.discoverSelected.has(id)?state.discoverSelected.delete(id):state.discoverSelected.add(id); render();
    });
    $('[data-bulk-add]')?.addEventListener('click',()=>openBulkModal());
    $$('[data-filter]').forEach(el=>el.onclick=()=>{state.libraryFilter=el.dataset.filter;render();});
    $('#library-search')?.addEventListener('input',e=>{state.libraryQuery=e.target.value; const pos=e.target.selectionStart; render(); setTimeout(()=>{$('#library-search')?.focus();$('#library-search')?.setSelectionRange(pos,pos)},0);});
    let searchTimer; $('#add-search')?.addEventListener('input',e=>{clearTimeout(searchTimer); const q=e.target.value.trim(); if(q.length<2){state.searchResults=[];return;} searchTimer=setTimeout(()=>searchMovies(q),350);});
    $$('[data-quick-add]').forEach(el=>el.onclick=()=>openRecordModal(filmById(el.dataset.quickAdd)));
    $('[data-manual-add]')?.addEventListener('click',()=>openManualModal());
    $$('[data-back]').forEach(el=>el.onclick=()=>{state.page='library';render();});
    $$('[data-edit-film]').forEach(el=>el.onclick=()=>openRecordModal(filmById(el.dataset.editFilm),true));
    $('[data-run-migration]')?.addEventListener('click',requestLegacyMigration);
    $('[data-reset-write-token]')?.addEventListener('click',()=>{localStorage.removeItem('krince-write-token');openSyncTokenModal();});
    $('[data-connect-backend]')?.addEventListener('click',openConnectionModal);
  }

  async function searchMovies(q){
    state.searchLoading=true; render(); $('#add-search')?.focus();
    try{
      if(API){
        const data=await apiGet('tmdbSearch',{q});
        state.searchResults=(data.results||[]).map(mapApiFilm);
      } else {
        const low=q.toLowerCase(); state.searchResults=state.films.filter(f=>`${f.titleZh} ${f.titleEn||''} ${f.originalTitle||''}`.toLowerCase().includes(low)).slice(0,20);
      }
    }catch(e){ toast('搜尋暫時失敗'); console.error(e); }
    finally{ state.searchLoading=false; render(); const inp=$('#add-search'); if(inp){inp.value=q;inp.focus();inp.setSelectionRange(q.length,q.length);} }
  }
  function mapApiFilm(x){return {id:`tmdb-${x.tmdbId||x.id}`,tmdbId:x.tmdbId||x.id,titleZh:x.titleZh||x.title||x.name,titleEn:x.titleEn||x.englishTitle||x.originalTitle||'',originalTitle:x.originalTitle||'',year:x.year||'',region:x.region||'',genres:x.genres||[],posterPath:x.posterPath||x.poster_path||'',backdropPath:x.backdropPath||x.backdrop_path||'',overviewZh:x.overviewZh||x.overview||'',tone:['#72584c','#25201e']};}
  function jsonpGet(url,action,params={}){
    return new Promise((resolve,reject)=>{
      const cb='__kfa_jsonp_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2);
      const u=new URL(url); u.searchParams.set('action',action); u.searchParams.set('callback',cb); u.searchParams.set('_',Date.now());
      Object.entries(params).forEach(([k,v])=>{ if(v!==undefined&&v!==null)u.searchParams.set(k,v); });
      const s=document.createElement('script'); let done=false;
      const cleanup=()=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();};
      window[cb]=(data)=>{cleanup();if(data&&data.error)reject(new Error(data.error));else resolve(data||{});};
      s.onerror=()=>{cleanup();reject(new Error('未能連接 Google Apps Script'));};
      const timer=setTimeout(()=>{cleanup();reject(new Error('Google Apps Script 連線逾時'));},30000);
      s.src=u.toString(); document.head.appendChild(s);
    });
  }
  async function apiGet(action,params={}){ return jsonpGet(API,action,params); }
  async function apiPost(action,payload){
    const writeToken=localStorage.getItem('krince-write-token')||'';
    if(!writeToken)throw new Error('未設定個人同步碼');
    try{
      return await jsonpGet(API,'write',{op:action,writeToken,payload:JSON.stringify(payload||{})});
    }catch(e){
      if(String(e.message||'').includes('Invalid write token'))localStorage.removeItem('krince-write-token');
      throw e;
    }
  }

  function modal(html){ $('#modal-root').innerHTML=`<div class="modal-backdrop"><div class="modal">${html}</div></div>`; $('.modal-backdrop').onclick=e=>{if(e.target===e.currentTarget)closeModal()}; $$('.close-btn').forEach(b=>b.onclick=closeModal); }
  function closeModal(){ $('#modal-root').innerHTML=''; }
  function openSyncTokenModal(){
    modal(`<div class="modal-head"><h2>輸入個人同步碼</h2><button class="close-btn">×</button></div><div class="form-grid">
      <p class="muted" style="font-size:12px;line-height:1.7;margin:0">呢個就係你喺 Apps Script → Script Properties 自己設定嘅 <strong>WRITE_TOKEN</strong>。只需要輸入一次，之後會儲存在呢個瀏覽器。</p>
      <div class="field"><label>個人同步碼</label><input id="sync-write-token" type="password" autocomplete="off" placeholder="輸入 WRITE_TOKEN"></div>
      <button class="primary-btn" id="save-sync-token">儲存並開始同步</button>
    </div>`);
    const input=$('#sync-write-token');
    const submit=()=>{
      const token=input.value.trim();
      if(!token){toast('請輸入個人同步碼');input.focus();return;}
      localStorage.setItem('krince-write-token',token);
      closeModal();
      runLegacyMigration();
    };
    $('#save-sync-token').onclick=submit;
    input.addEventListener('keydown',e=>{if(e.key==='Enter')submit();});
    setTimeout(()=>input.focus(),50);
  }
  function requestLegacyMigration(){
    if(IS_CHATGPT_PREVIEW){
      modal(`<div class="modal-head"><h2>同步要喺正式網站進行</h2><button class="close-btn">×</button></div><div class="form-grid"><p class="muted" style="font-size:13px;line-height:1.8;margin:0">呢個 ChatGPT Preview 會阻擋連去 Google Apps Script，所以只適合預覽畫面。你的 Google Apps Script backend 已經可以獨立開到 V2.6；將呢個版本放上 GitHub Pages 後，再撳「同步舊片單」就會真正連線。</p><button class="primary-btn close-btn">知道了</button></div>`);
      return;
    }
    if(localStorage.getItem('krince-write-token')) runLegacyMigration();
    else openSyncTokenModal();
  }
  function openRecordModal(f,editing=false){
    if(!f)return;
    modal(`<div class="modal-head"><h2>${editing?'編輯紀錄':'加入我的片庫'}</h2><button class="close-btn">×</button></div><div class="form-grid">
      <div><strong>${esc(f.titleZh)}</strong><div class="muted" style="font-size:12px">${esc(f.titleEn||'')} ${f.year?`· ${f.year}`:''}</div></div>
      <div class="field"><label>觀看狀態</label><select id="m-status"><option value="complete" ${f.status==='complete'?'selected':''}>完整睇過</option><option value="partial" ${f.status==='partial'?'selected':''}>睇過少少</option><option value="unsure" ${f.status==='unsure'?'selected':''}>亂睇／唔確定睇晒未</option><option value="unknown" ${f.status==='unknown'?'selected':''}>記唔清楚</option></select></div>
      <div class="field"><label>觀看日期</label><input id="m-date" type="date" value="${f.datePrecision==='exact'?esc(f.watchedDate||''):''}"><div style="margin-top:7px"><label style="display:flex;gap:7px;align-items:center"><input id="m-date-unknown" type="checkbox" ${f.datePrecision!=='exact'?'checked':''}> 唔記得日期</label></div></div>
      <div class="field"><label>觀看平台</label><select id="m-platform"><option value="">未記錄</option>${['戲院','Netflix','Disney+','Prime Video','Apple TV+','飛機','Blu-ray / DVD','其他'].map(x=>`<option ${f.platform===x?'selected':''}>${x}</option>`).join('')}</select></div>
      <div class="field"><label>評分</label><select id="m-rating"><option value="">未評分</option>${[5,4.5,4,3.5,3,2.5,2,1.5,1,.5].map(x=>`<option value="${x}" ${Number(f.rating)===x?'selected':''}>${x} / 5</option>`).join('')}</select></div>
      <div class="field"><label>感想</label><textarea id="m-note" placeholder="留低一兩句，等以後的自己記得這套電影。">${esc(f.note||'')}</textarea></div>
      <button class="primary-btn" id="save-record">${editing?'儲存修改':'加入我的片庫'}</button>
    </div>`);
    $('#save-record').onclick=async()=>{
      const data={...f,id:f.id||`manual-${Date.now()}`,status:$('#m-status').value,platform:$('#m-platform').value,rating:Number($('#m-rating').value)||null,note:$('#m-note').value.trim()};
      if($('#m-date-unknown').checked){data.datePrecision='range';data.watchedFrom=data.watchedFrom||'2021';data.watchedTo=data.watchedTo||'2026';delete data.watchedDate;} else {data.datePrecision='exact';data.watchedDate=$('#m-date').value;}
      const i=state.films.findIndex(x=>x.id===data.id || (data.tmdbId&&x.tmdbId===data.tmdbId)); if(i>=0)state.films[i]=data;else state.films.unshift(data); persist();
      if(API){ try{await apiPost(i>=0?'updateFilm':'addFilm',{film:data});}catch(e){console.warn('Sheet sync failed',e);toast('已儲存在裝置；Google Sheet 同步稍後再試');} }
      closeModal();toast(editing?'已更新紀錄':'已加入片庫');state.page='library';render();
    };
  }
  function openConnectionModal(){
    modal(`<div class="modal-head"><h2>連接 Google Sheet</h2><button class="close-btn">×</button></div><div class="form-grid">
      <p class="muted" style="font-size:12px;line-height:1.7;margin:0">先完成 Apps Script 設定，再將部署後的 <code>/exec</code> URL 貼在這裏。TMDB token 只會留在 Apps Script，不會存入這個 App。</p>
      <div class="field"><label>Apps Script Web App URL</label><input id="backend-url" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(API)}"></div>
      <button class="primary-btn" id="save-backend">測試並連接</button>
    </div>`);
    $('#save-backend').onclick=async()=>{
      const url=$('#backend-url').value.trim();
      if(!/^https:\/\/script\.google\.com\/.+\/exec(?:\?.*)?$/.test(url)){toast('請貼 Apps Script 的 /exec URL');return;}
      const btn=$('#save-backend');btn.disabled=true;btn.textContent='測試中…';
      try{
        const data=await jsonpGet(url,'health');
        if(!data.ok)throw new Error(data.error||'連線失敗');
        localStorage.setItem('krince-api-url',url);API=url;closeModal();toast('資料庫已連接');await hydrate();
      }catch(e){toast('未能連接：'+e.message);btn.disabled=false;btn.textContent='測試並連接';}
    };
  }

  function openManualModal(){
    modal(`<div class="modal-head"><h2>手動新增電影</h2><button class="close-btn">×</button></div><div class="form-grid"><div class="field"><label>片名 *</label><input id="man-title"></div><div class="field"><label>英文名</label><input id="man-en"></div><div class="field"><label>年份</label><input id="man-year" inputmode="numeric"></div><div class="field"><label>國家／地區</label><input id="man-region"></div><button class="primary-btn" id="manual-next">下一步：加入觀看紀錄</button></div>`);
    $('#manual-next').onclick=()=>{const title=$('#man-title').value.trim();if(!title){toast('請先輸入片名');return;} const f={id:`manual-${Date.now()}`,source:'manual',titleZh:title,titleEn:$('#man-en').value.trim(),year:Number($('#man-year').value)||null,region:$('#man-region').value.trim(),genres:[],tone:['#6c574a','#29221f']};closeModal();openRecordModal(f);};
  }
  function openBulkModal(){
    const picked=state.discoverResults.filter(f=>state.discoverSelected.has(f.id));
    modal(`<div class="modal-head"><h2>加入 ${picked.length} 部電影</h2><button class="close-btn">×</button></div><p class="muted" style="font-size:13px;line-height:1.7">如果你已經唔記得準確日期，可以直接用「2021–2026 · 準確日期不詳」加入，之後先慢慢補。</p><div class="form-grid"><button class="primary-btn" id="bulk-unknown">唔記得，直接加入</button><button class="secondary-btn" id="bulk-cancel">取消</button></div>`);
    $('#bulk-cancel').onclick=closeModal;
    $('#bulk-unknown').onclick=async()=>{const add=picked.filter(f=>!state.films.some(x=>(f.tmdbId&&x.tmdbId===f.tmdbId)||(!f.tmdbId&&x.titleZh===f.titleZh&&x.year===f.year))).map(f=>({...f,status:'complete',datePrecision:'range',watchedFrom:String(Math.max(2021,Number(f.year)||2021)),watchedTo:'2026'}));add.forEach(f=>state.films.unshift(f));persist();if(API&&add.length){try{await apiPost('bulkAdd',{films:add});}catch(e){console.warn(e)}}state.discoverSelected.clear();closeModal();toast(`已加入 ${add.length} 部電影`);render();};
  }

  async function fetchBootstrapFilms(){
    // Self-contained preview embeds the bootstrap on window; GitHub build loads JSON.
    if(Array.isArray(window.LEGACY_BOOTSTRAP)&&window.LEGACY_BOOTSTRAP.length) return window.LEGACY_BOOTSTRAP;
    try{
      const r=await fetch('data/legacy_library_bootstrap.json',{cache:'no-store'});
      if(!r.ok)throw new Error('bootstrap HTTP '+r.status);
      const films=await r.json();
      return Array.isArray(films)?films:[];
    }catch(e){console.warn('Bootstrap load failed',e);return [];}
  }
  async function loadBootstrap(){
    const films=await fetchBootstrapFilms();
    if(films.length){state.films=films;persist();return true;}
    return false;
  }
  function mergeLiveAndLegacy(live,bootstrap,migratedLegacyIds=[]){
    const migrated=new Set(migratedLegacyIds||[]);
    const remaining=(bootstrap||[]).filter(f=>!migrated.has(f.id));
    const seen=new Set();
    return [...(live||[]),...remaining].filter(f=>{const k=f.tmdbId?`t:${f.tmdbId}`:`i:${f.id}`;if(seen.has(k))return false;seen.add(k);return true;});
  }

  function markLibraryFlags(results){
    return results.map(f=>({...f,inLibrary:state.films.some(x=>(f.tmdbId&&x.tmdbId===f.tmdbId)||(`${x.titleZh||''}`.toLowerCase()===`${f.titleZh||''}`.toLowerCase()&&String(x.year||'')===String(f.year||'')))}));
  }

  async function loadDiscover(params){
    state.discoverLoading=true;render();
    try{
      if(API){
        const data=await apiGet('discover',params);
        state.discoverResults=markLibraryFlags((data.results||[]).map(mapApiFilm));
      } else state.discoverResults=markLibraryFlags(demoDiscover);
    }catch(e){console.warn(e);state.discoverResults=markLibraryFlags(demoDiscover);toast('探索電影暫時用離線示範資料');}
    state.discoverLoading=false;render();
  }

  async function runLegacyMigration(){
    if(!API||state.migrationRunning)return;
    state.migrationRunning=true;state.migrationProgress={done:0,total:0};render();
    try{
      let queue;
      if (Array.isArray(window.LEGACY_MIGRATION_QUEUE)) queue=window.LEGACY_MIGRATION_QUEUE;
      else { const r=await fetch('data/legacy_migration_queue.json',{cache:'no-store'}); queue=await r.json(); }
      state.migrationProgress.total=queue.length;
      const compact=(rec)=>({legacy_id:rec.legacy_id,raw_title:rec.raw_title,match_query:rec.match_query,year_hint:rec.year_hint||'',status:rec.status||'complete',platform:rec.platform||'',watched_from:rec.watched_from||'2021',watched_to:rec.watched_to||'2026',legacy_source_column:rec.legacy_source_column||'',force_review:!!rec.force_review});
      const batchSize=3;
      for(let i=0;i<queue.length;i+=batchSize){
        const batch=queue.slice(i,i+batchSize).map(compact);
        await apiPost('migrateLegacyBatch',{records:batch});
        state.migrationProgress.done=Math.min(i+batch.length,queue.length);
        render();
      }
      const lib=await apiGet('library');
      const bootstrap=await fetchBootstrapFilms();
      const live=Array.isArray(lib.films)?lib.films.map(mapApiFilmFromSheet):[];
      state.films=mergeLiveAndLegacy(live,bootstrap,lib.migratedLegacyIds||[]);persist();
      const ms=await apiGet('migrationStatus');
      toast(`TMDB 同步完成：${ms.matched||0} 已配對，${ms.review||0} 待確認`);
    }catch(e){console.error(e);toast('同步未完成：'+e.message);}
    finally{state.migrationRunning=false;render();}
  }

  // Load Google Sheet first when connected; otherwise show the user's real 2021–2026 legacy library locally.
  async function hydrate(){
    const bootstrap=await fetchBootstrapFilms();
    // Replace stale V1/demo cache with the real legacy bootstrap on first V2.2 load.
    const staleCache = state.films.length && (state.films.length < 100 || state.films.every(f=>String(f.id||'').startsWith('demo-')));
    if(staleCache && bootstrap.length){ state.films=bootstrap; persist(); }
    if(API){
      try{
        const data=await apiGet('library');
        const live=Array.isArray(data.films)?data.films.map(mapApiFilmFromSheet):[];
        state.films=mergeLiveAndLegacy(live,bootstrap,data.migratedLegacyIds||[]);persist();
      }catch(e){console.warn('Using local fallback',e);if(bootstrap.length && (!state.films.length || staleCache)){state.films=bootstrap;persist();}}
    } else if((!state.films.length||staleCache)&&bootstrap.length){state.films=bootstrap;persist();}
    render();
  }
  function mapApiFilmFromSheet(x){return {...x,id:x.id||x.internalId||`tmdb-${x.tmdbId}`,titleZh:x.titleZh||x.title_zh_hk||x.title,titleEn:x.titleEn||x.title_en||'',posterPath:x.posterPath||x.poster_path||'',backdropPath:x.backdropPath||x.backdrop_path||'',genres:Array.isArray(x.genres)?x.genres:String(x.genres||'').split('|').filter(Boolean),rating:(x.rating===''||x.rating==null)?null:Number(x.rating),needsEnrichment:false,tone:['#6b5348','#25201e']};}

  hydrate();
})();
