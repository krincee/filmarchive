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
    librarySort:localStorage.getItem('krince-library-sort')||'year-desc',
    libraryFacets:{year:'',region:'',genre:'',director:'',cast:'',platform:'',rating:''},
    discoverLoading:false,
    discoverCategory:'',
    discoverTitle:'',
    discoverParams:null,
    discoverPage:1,
    discoverTotalPages:1,
    personRole:'cast',
    personResults:[],
    discoverHideLibrary:false,
    statsTab:'overview',
    reviewCount:0,
    reviewRecords:[],
    reviewLoading:false,
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
    const external=f.tmdbVoteAverage!=null&&Number(f.tmdbVoteAverage)>0?`TMDB ${Number(f.tmdbVoteAverage).toFixed(1)}`:'';
    return `<article class="poster-card ${selected?'selected':''}" data-film-id="${esc(f.id)}" ${selectable?'data-selectable="1"':''}>
      <div class="poster" style="--poster-bg:${posterBg(f)}">
        <div class="poster-placeholder"><small>${f.needsEnrichment?'待補資料':'FILM ARCHIVE'}</small><span>${esc(f.titleZh)}</span><em>${esc(f.year||'年份不詳')}</em></div>
        ${img?`<img src="${img}" alt="${esc(f.titleZh)} 海報" loading="lazy" onerror="this.remove()"/>`:''}
        ${selectable?`<div class="select-mark">${selected?'✓':f.inLibrary?'✓':'○'}</div>`:badge?`<div class="poster-badge">${badge}</div>`:''}
      </div>
      <div class="poster-title">${esc(f.titleZh)}</div>
      <div class="poster-meta">${f.year||'年份不詳'}${f.rating?` · ${stars(f.rating)}`:external?` · ${external}`:''}</div>
    </article>`;
  }

  function renderHome(){
    const favNeedles=['玻璃之城','perfume','amadeus','prestige','home alone','哈利波特','wreck-it ralph','奇謀妙計'];
    let heroPool=state.films.filter(f=>favNeedles.some(n=>`${f.titleZh||''} ${f.titleEn||''}`.toLowerCase().includes(n.toLowerCase())) && (f.backdropPath||f.posterPath));
    if(!heroPool.length) heroPool=state.films.filter(f=>f.backdropPath||f.posterPath);
    let hero=null;
    const savedHero=sessionStorage.getItem('krince-hero-film');
    if(savedHero) hero=heroPool.find(f=>String(f.id)===savedHero);
    if(!hero){hero=heroPool[Math.floor(Math.random()*Math.max(heroPool.length,1))]||state.films[0]||demoFilms[0]; if(hero?.id)sessionStorage.setItem('krince-hero-film',String(hero.id));}
    const heroImage=backdropImg(hero)||posterImg(hero,'w780');
    const heroStyle=heroImage?`url('${heroImage}') center 28%/cover,${posterBg(hero)}`:posterBg(hero);
    const exact=state.films.filter(f=>f.datePrecision==='exact'&&f.watchedDate).sort((a,b)=>String(b.watchedDate).localeCompare(String(a.watchedDate)));
    const recent=(exact.length?exact:sortLibraryFilms([...state.films])).slice(0,6);
    const recentLabel=exact.length?'最近觀看':'片庫一覽';
    const needs=state.films.filter(f=>f.needsEnrichment).length;
    const progress=state.migrationProgress&&state.migrationRunning?`已處理 ${state.migrationProgress.done}/${state.migrationProgress.total||'…'} 部${state.migrationProgress.failed?` · ${state.migrationProgress.failed} 部稍後重試`:''}。`:'';
    const syncCard=`<div class="sync-card sync-card-v23"><div class="sync-copy"><div class="sync-kicker">DATABASE · ${API?'READY':'NOT CONNECTED'}</div><strong>${API?'Google Sheet 已連接':'尚未連接 Google Sheet'}</strong><span>${state.migrationRunning?progress:(API?(needs?`目前有 ${needs} 部舊紀錄等待 TMDB 補資料。`:'片庫已連接 TMDB；需要時可以重新同步舊片單。'):'連接後會用 TMDB 補上海報、年份同電影資料。')}</span></div>${API?`<button class="sync-primary-btn" data-run-migration ${state.migrationRunning?'disabled':''}>${state.migrationRunning?'同步中…':'同步／續傳舊片單 →'}</button><button class="sync-token-reset" data-reset-write-token>重新輸入同步碼</button>`:`<button class="sync-primary-btn" data-connect-backend>連接資料庫 →</button>`}</div>`;
    const reviewCard=state.reviewCount>0?`<button class="review-home-card" data-open-review><div><span>NEEDS REVIEW</span><strong>待確認配對</strong><small>有 ${state.reviewCount} 筆舊紀錄需要你揀返正確電影。</small></div><b>${state.reviewCount}</b></button>`:'';
    return chrome(`<section class="page">
      <div class="hero" style="--hero-bg:${heroStyle}"><div class="hero-art"></div><div class="hero-grain"></div><div class="hero-film-tag">本次封面 · ${esc(hero.titleZh)}</div><div class="hero-copy"><div class="eyebrow">KRINCE'S FILM ARCHIVE · EST. 2021</div><h1 class="display-title">我的電影檔案</h1><div class="hero-count"><strong>${state.films.length}</strong><span>部電影</span></div></div></div>
      ${syncCard}${reviewCard}
      <section class="section"><div class="section-head"><h2 class="section-title">${recentLabel}</h2><button class="section-link" data-nav="library">查看全部 ›</button></div><div class="horizontal-posters">${recent.map(f=>posterCard(f,{small:true})).join('')}</div></section>
      <section class="section"><div class="section-head"><h2 class="section-title">繼續整理你的電影記憶</h2></div><div class="memory-card" data-discover-preset="hk80"><div class="memory-art"></div><div><div class="eyebrow">CONTINUE DISCOVERING</div><div class="memory-title">80年代香港電影</div><div class="memory-stat">由你記得的開始，再慢慢補回去。</div><div class="inline-arrow">繼續探索 →</div></div></div></section>
      <section class="section"><div class="section-head"><h2 class="section-title">你的電影人生</h2><button class="section-link" data-nav="stats">查看完整統計 ›</button></div><div class="year-summary"><div><strong>${state.films.length}</strong><p>片庫會隨住你繼續觀看同補回舊記憶而增長。</p></div><div class="muted" style="font-size:12px;text-align:right">TMDB 資料<br>你的私人紀錄</div></div></section>
    </section>`,'home');
  }

  function normalizeList(v){
    if(Array.isArray(v)) return v.filter(Boolean);
    return String(v||'').split(/[／|,]/).map(x=>x.trim()).filter(Boolean);
  }
  function facetLabel(key, value){
    const labels={year:'年份',region:'地區',genre:'類型',director:'導演',cast:'演員',platform:'觀看平台',rating:'評分'};
    if(!value) return labels[key]+'⌄';
    if(key==='rating') return `${labels[key]} · ${value}★`;
    return `${labels[key]} · ${value}`;
  }
  const titleCollator = new Intl.Collator('zh-HK',{numeric:true,sensitivity:'base'});
  function sortLabel(sort=state.librarySort){
    return ({
      'year-desc':'年份 · 新 → 舊',
      'year-asc':'年份 · 舊 → 新',
      'title-asc':'片名 · A → Z',
      'title-desc':'片名 · Z → A',
      'rating-desc':'我的評分 · 高 → 低',
      'rating-asc':'我的評分 · 低 → 高',
      'tmdb-desc':'TMDB · 高 → 低',
      'tmdb-asc':'TMDB · 低 → 高',
      'created-desc':'最近加入',
      'created-asc':'最早加入',
      'original':'原本次序'
    })[sort]||'年份 · 新 → 舊';
  }
  function sortLibraryFilms(films){
    const indexed=films.map((film,index)=>({film,index}));
    const yearValue=f=>{const y=Number(f.year);return Number.isFinite(y)&&y>0?y:null;};
    const ratingValue=f=>{const r=Number(f.rating);return Number.isFinite(r)?r:null;};
    indexed.sort((a,b)=>{
      const A=a.film,B=b.film, sort=state.librarySort;
      if(sort==='original') return a.index-b.index;
      if(sort==='year-desc'||sort==='year-asc'){
        const ay=yearValue(A),by=yearValue(B);
        if(ay==null&&by==null) return titleCollator.compare(A.titleZh||A.titleEn||'',B.titleZh||B.titleEn||'');
        if(ay==null) return 1; if(by==null) return -1;
        const diff=sort==='year-desc'?by-ay:ay-by;
        return diff||titleCollator.compare(A.titleZh||A.titleEn||'',B.titleZh||B.titleEn||'');
      }
      if(sort==='rating-desc'||sort==='rating-asc'){
        const ar=ratingValue(A),br=ratingValue(B);
        if(ar==null&&br==null) return titleCollator.compare(A.titleZh||A.titleEn||'',B.titleZh||B.titleEn||'');
        if(ar==null) return 1; if(br==null) return -1;
        const diff=sort==='rating-desc'?br-ar:ar-br;
        return diff||titleCollator.compare(A.titleZh||A.titleEn||'',B.titleZh||B.titleEn||'');
      }
      if(sort==='tmdb-desc'||sort==='tmdb-asc'){
        const ar=Number(A.tmdbVoteAverage),br=Number(B.tmdbVoteAverage),av=Number.isFinite(ar)&&ar>0?ar:null,bv=Number.isFinite(br)&&br>0?br:null;
        if(av==null&&bv==null) return titleCollator.compare(A.titleZh||A.titleEn||'',B.titleZh||B.titleEn||'');
        if(av==null) return 1; if(bv==null) return -1;
        const diff=sort==='tmdb-desc'?bv-av:av-bv;return diff||titleCollator.compare(A.titleZh||A.titleEn||'',B.titleZh||B.titleEn||'');
      }
      if(sort==='created-desc'||sort==='created-asc'){
        const av=String(A.createdAt||''),bv=String(B.createdAt||'');
        const diff=sort==='created-desc'?bv.localeCompare(av):av.localeCompare(bv);
        return diff||titleCollator.compare(A.titleZh||A.titleEn||'',B.titleZh||B.titleEn||'');
      }
      const cmp=titleCollator.compare(A.titleZh||A.titleEn||'',B.titleZh||B.titleEn||'');
      return sort==='title-desc'?-cmp:cmp;
    });
    return indexed.map(x=>x.film);
  }
  function filteredLibrary(){
    let films=[...state.films];
    if(state.libraryFilter!=='all') films=films.filter(f=>f.status===state.libraryFilter || (state.libraryFilter==='rewatch'&&f.isRewatch));
    const ff=state.libraryFacets||{};
    if(ff.year) films=films.filter(f=>String(f.year||'')===String(ff.year));
    if(ff.region) films=films.filter(f=>normalizeList(f.region).includes(ff.region));
    if(ff.genre) films=films.filter(f=>normalizeList(f.genres).includes(ff.genre));
    if(ff.director) films=films.filter(f=>normalizeList(f.director).includes(ff.director));
    if(ff.cast) films=films.filter(f=>normalizeList(f.cast).includes(ff.cast));
    if(ff.platform) films=films.filter(f=>(f.platform||'未記錄')===ff.platform);
    if(ff.rating) films=films.filter(f=>Number(f.rating||0)===Number(ff.rating));
    if(state.libraryQuery.trim()) {
      const q=state.libraryQuery.toLowerCase();
      films=films.filter(f=>`${f.titleZh||''} ${f.titleEn||''} ${f.originalTitle||''} ${(f.genres||[]).join(' ')} ${f.region||''} ${f.director||''} ${(f.cast||[]).join(' ')} ${f.platform||''}`.toLowerCase().includes(q));
    }
    return sortLibraryFilms(films);
  }
  function hasFacetFilters(){return Object.values(state.libraryFacets||{}).some(Boolean);}
  function renderLibrary(){
    const films=filteredLibrary();
    const ff=state.libraryFacets||{};
    return chrome(`<section class="page">
      <div class="page-title-row"><div><h1 class="page-title">片庫</h1><div class="page-count">${films.length===state.films.length?`${state.films.length} 部電影`:`顯示 ${films.length} / ${state.films.length} 部`}</div></div><button class="icon-btn" aria-label="清除篩選" data-clear-facets ${!hasFacetFilters()?'disabled':''}>${icons.tune}</button></div>
      <div class="searchbox">${icons.search}<input id="library-search" placeholder="搜尋電影、導演、演員……" value="${esc(state.libraryQuery)}"/></div>
      <div class="chips"><button class="chip ${state.libraryFilter==='all'?'active':''}" data-filter="all">全部</button><button class="chip ${state.libraryFilter==='complete'?'active':''}" data-filter="complete">完整睇過</button><button class="chip ${state.libraryFilter==='partial'?'active':''}" data-filter="partial">睇過少少</button><button class="chip ${state.libraryFilter==='rewatch'?'active':''}" data-filter="rewatch">重新觀看</button></div>
      <div class="filter-row">
        <button class="filter-btn sort-filter active" data-open-library-sort>排序 · ${esc(sortLabel())}</button>
        ${['year','region','genre','director','cast','platform','rating'].map(k=>`<button class="filter-btn ${ff[k]?'active':''}" data-open-library-filter="${k}">${esc(facetLabel(k,ff[k]))}</button>`).join('')}
        ${hasFacetFilters()?`<button class="filter-clear-inline" data-clear-facets>清除</button>`:''}
      </div>
      ${films.length?`<div class="library-grid">${films.map(f=>posterCard(f)).join('')}</div>`:`<div class="empty">片庫入面暫時搵唔到符合條件嘅電影。<br><button class="text-link" data-clear-facets>清除篩選</button></div>`}
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

  const DISCOVER_COUNTRIES=[
    ['香港','HK'],['日本','JP'],['韓國','KR'],['台灣','TW'],['中國','CN'],
    ['美國','US'],['英國','GB'],['法國','FR'],['德國','DE'],['意大利','IT']
  ];
  const DISCOVER_DECADES=[
    ['1950年代',1950,1959],['1960年代',1960,1969],['1970年代',1970,1979],['1980年代',1980,1989],
    ['1990年代',1990,1999],['2000年代',2000,2009],['2010年代',2010,2019],['2020年代',2020,2029]
  ];
  const DISCOVER_GENRES=[
    ['動作',28],['冒險',12],['動畫',16],['喜劇',35],['犯罪',80],['紀錄片',99],['劇情',18],['家庭',10751],
    ['奇幻',14],['歷史',36],['恐怖',27],['音樂',10402],['懸疑',9648],['愛情',10749],['科幻',878],['驚慄',53]
  ];
  const DISCOVER_PROVIDERS=[['Netflix',8],['Disney+',337],['Prime Video',119],['Apple TV+',350]];
  function renderDiscover(){
    if(state.discoverMode==='results'){
      return chrome(`<section class="page"><div class="discover-toolbar"><button class="back-btn" data-discover-back>${icons.back}</button><h1>${esc(state.discoverTitle||'探索電影')}</h1><button class="icon-btn" data-discover-refine aria-label="篩選">${icons.tune}</button></div>
        <div class="discover-result-tools"><div class="page-count">已載入 ${state.discoverResults.length} 部</div><button class="chip ${state.discoverHideLibrary?'active':''}" data-toggle-hide-library>${state.discoverHideLibrary?'已隱藏片庫電影':'隱藏已在片庫'}</button></div>
        ${state.discoverLoading&&state.discoverResults.length===0?`<div class="loading">載入電影中……</div>`:`<div class="discover-grid">${state.discoverResults.filter(f=>!state.discoverHideLibrary||!f.inLibrary).map(f=>posterCard(f,{selectable:true,selected:state.discoverSelected.has(f.id)})).join('')}</div>`}
        ${state.discoverPage<state.discoverTotalPages?`<button class="load-more-btn" data-load-more ${state.discoverLoading?'disabled':''}>${state.discoverLoading?'載入中……':'載入更多電影'}</button>`:''}
      </section>${state.discoverSelected.size?`<div class="bulk-bar"><span>已選擇 ${state.discoverSelected.size} 部</span><button data-bulk-add>加入我的片庫 →</button></div>`:''}`,'discover');
    }
    if(state.discoverMode==='category'){
      let body='';
      if(state.discoverCategory==='region') body=`<div class="picker-grid">${DISCOVER_COUNTRIES.map(([n,c])=>`<button class="picker-card" data-discover-choice data-title="${esc(n)}電影" data-params='${esc(JSON.stringify({country:c}))}'><strong>${esc(n)}</strong><span>按地區瀏覽</span></button>`).join('')}</div>`;
      else if(state.discoverCategory==='decade') body=`<div class="picker-grid">${DISCOVER_DECADES.map(([n,a,b])=>`<button class="picker-card" data-discover-choice data-title="${esc(n)}電影" data-params='${esc(JSON.stringify({yearFrom:a,yearTo:b}))}'><strong>${esc(n)}</strong><span>${a}–${b}</span></button>`).join('')}</div>`;
      else if(state.discoverCategory==='genre') body=`<div class="picker-grid">${DISCOVER_GENRES.map(([n,id])=>`<button class="picker-card" data-discover-choice data-title="${esc(n)}片" data-params='${esc(JSON.stringify({genre:id}))}'><strong>${esc(n)}</strong><span>電影類型</span></button>`).join('')}</div>`;
      else if(state.discoverCategory==='platform') body=`<div class="picker-grid">${DISCOVER_PROVIDERS.map(([n,id])=>`<button class="picker-card" data-discover-choice data-title="${esc(n)} · 香港" data-params='${esc(JSON.stringify({provider:id,watchRegion:'HK'}))}'><strong>${esc(n)}</strong><span>香港區供應資料</span></button>`).join('')}</div>`;
      else if(state.discoverCategory==='person') body=`<div class="person-search-panel"><div class="chips"><button class="chip ${state.personRole==='cast'?'active':''}" data-person-role="cast">演員</button><button class="chip ${state.personRole==='crew'?'active':''}" data-person-role="crew">導演</button></div><div class="searchbox">${icons.search}<input id="person-search" placeholder="輸入演員或導演姓名……"></div><div id="person-results">${state.personResults.map(p=>`<button class="person-result" data-person-id="${p.id}" data-person-name="${esc(p.name)}"><strong>${esc(p.name)}</strong><span>${esc(p.knownForDepartment||'')}</span></button>`).join('')}</div></div>`;
      const title={region:'地區',decade:'年代',person:'人物',genre:'類型',platform:'平台'}[state.discoverCategory]||'探索電影';
      return chrome(`<section class="page"><div class="discover-toolbar"><button class="back-btn" data-discover-root>${icons.back}</button><h1>${title}</h1><span></span></div>${body}</section>`,'discover');
    }
    const options=[
      ['地區','香港 · 日本 · 韓國 · 台灣 · 美國……',icons.globe,'region'],
      ['年代','70s / 80s / 90s / 00s / 10s / 20s',icons.calendar,'decade'],
      ['人物','演員 · 導演',icons.person,'person'],
      ['類型','喜劇 · 恐怖 · 愛情 · 劇情……',icons.film,'genre'],
      ['平台','Netflix · Disney+ · Prime Video……',icons.play,'platform']
    ];
    return chrome(`<section class="page"><div class="page-title-row"><div><h1 class="page-title">探索電影</h1></div></div><h2 class="explore-question">想由哪裏開始回想？</h2><div class="explore-list">${options.map(([t,s,i,m])=>`<div class="explore-card" data-open-discover="${m}"><div class="explore-icon">${i}</div><div><strong>${t}</strong><span>${s}</span></div><div>›</div></div>`).join('')}</div></section>`,'discover');
  }

  function renderStats(){
    const complete=state.films.filter(f=>f.status==='complete').length, partial=state.films.filter(f=>f.status==='partial').length, unsure=state.films.filter(f=>f.status==='unsure').length, unknown=state.films.filter(f=>f.status==='unknown').length;
    const tabs=[['overview','總覽'],['year','年份'],['region','地區'],['director','導演'],['cast','演員'],['genre','類型']];
    const tabbar=`<div class="stats-tabs">${tabs.map(([k,l])=>`<button class="stats-tab ${state.statsTab===k?'active':''}" data-stats-tab="${k}">${l}</button>`).join('')}</div>`;
    const rank=(pairs,label)=>`<div class="rank-list">${pairs.slice(0,30).map(([name,count],i)=>`<div class="rank-row"><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(name)}</strong><b>${count}</b></div>`).join('')||`<div class="empty">暫時未有足夠資料。</div>`}</div>`;
    const countList=(getter)=>{const m={};state.films.forEach(f=>normalizeList(getter(f)).forEach(x=>m[x]=(m[x]||0)+1));return Object.entries(m).sort((a,b)=>b[1]-a[1]||titleCollator.compare(a[0],b[0]));};
    let body='';
    if(state.statsTab==='overview'){
      const decadeCounts={}; state.films.forEach(f=>{if(f.year){const d=Math.floor(Number(f.year)/10)*10;decadeCounts[d]=(decadeCounts[d]||0)+1;}}); const max=Math.max(1,...Object.values(decadeCounts));
      const regions=countList(f=>f.region||'待補資料').slice(0,5),regMax=Math.max(1,...regions.map(x=>x[1]));
      body=`<div class="big-stat"><strong>${state.films.length}</strong><p>部曾經進入你人生的電影</p></div><div class="stat-cards"><div class="stat-mini"><strong>${complete}</strong><span>完整睇過</span></div><div class="stat-mini"><strong>${partial}</strong><span>睇過少少</span></div><div class="stat-mini"><strong>${unsure}</strong><span>不確定</span></div><div class="stat-mini"><strong>${unknown}</strong><span>記唔清楚</span></div></div><section class="section"><div class="section-head"><h2 class="section-title">電影年代</h2></div><div class="bar-chart">${Object.entries(decadeCounts).sort().map(([d,c])=>`<div class="bar-item"><div class="bar" style="--h:${Math.max(9,(c/max)*120)}px"><span class="bar-value">${c}</span></div><div class="bar-label">${String(d).slice(2)}s</div></div>`).join('')}</div></section><section class="section"><div class="section-head"><h2 class="section-title">主要地區</h2></div>${regions.map(([r,c])=>`<div class="region-row"><span>${esc(r)}</span><div class="region-track"><div class="region-fill" style="width:${c/regMax*100}%"></div></div><span>${c}</span></div>`).join('')}</section>`;
    }else if(state.statsTab==='year'){
      const m={};state.films.forEach(f=>{if(f.year)m[f.year]=(m[f.year]||0)+1});body=`<h2 class="stats-section-title">按上映年份</h2>${rank(Object.entries(m).sort((a,b)=>Number(b[0])-Number(a[0])),'年份')}`;
    }else if(state.statsTab==='region') body=`<h2 class="stats-section-title">地區</h2>${rank(countList(f=>f.region),'地區')}`;
    else if(state.statsTab==='director') body=`<h2 class="stats-section-title">導演</h2>${rank(countList(f=>f.director),'導演')}`;
    else if(state.statsTab==='cast') body=`<h2 class="stats-section-title">演員</h2>${rank(countList(f=>f.cast),'演員')}`;
    else if(state.statsTab==='genre') body=`<h2 class="stats-section-title">類型</h2>${rank(countList(f=>f.genres),'類型')}`;
    return chrome(`<section class="page"><div class="page-title-row"><div><h1 class="page-title">統計</h1></div></div>${tabbar}${body}<div class="credits">電影資料、圖片及 TMDB 社群評分使用 TMDB。This product uses the TMDB API but is not endorsed or certified by TMDB.</div></section>`,'stats');
  }

  function renderDetail(id){
    const f=filmById(id); if(!f){ state.page='library'; return renderLibrary(); }
    const bg=backdropImg(f)||posterImg(f,'w1280'); const style=bg?`background-image:url('${bg}')`:`background:${posterBg(f)}`;
    const dateText=f.datePrecision==='exact'?f.watchedDate:(f.watchedFrom&&f.watchedTo?`${f.watchedFrom}–${f.watchedTo} · 準確日期不詳`:'唔記得日期');
    const tmdbScore=f.tmdbVoteAverage!=null&&Number(f.tmdbVoteAverage)>0?Number(f.tmdbVoteAverage).toFixed(1):'—';
    const voteCount=f.tmdbVoteCount!=null?Number(f.tmdbVoteCount).toLocaleString('en-US'):'—';
    return chrome(`<section class="page with-topbar"><div class="detail-hero" style="${style}"><div class="detail-top-actions"><button class="detail-action" data-back>${icons.back}</button></div></div><div class="detail-body"><h1 class="detail-title">${esc(f.titleZh)}</h1><div class="detail-en">${esc(f.titleEn||'')}</div><div class="detail-meta">${f.year||''}${f.region?` · ${esc(f.region)}`:''}${f.genres?.length?` · ${f.genres.map(esc).join(' / ')}`:''}</div>
      <div class="ratings-panel"><div><span>我的評分</span><strong class="rating-stars">${f.rating?stars(f.rating):'未評分'}</strong></div><div><span>TMDB</span><strong>${tmdbScore}<em>/ 10</em></strong><small>${voteCount} votes</small></div></div>
      <div class="detail-record-actions detail-actions-main"><button class="outline-btn" data-edit-film="${esc(f.id)}">編輯紀錄</button>${f.tmdbId?`<button class="outline-btn" data-remap-film="${esc(f.id)}">重新配對</button>`:''}<button class="danger-outline-btn" data-delete-film="${esc(f.id)}">刪除紀錄</button></div>
      <div class="detail-section"><h3>我的紀錄</h3><div class="record-list"><div class="record-line">${icons.play}<span>${statusLabel(f.status)}</span></div><div class="record-line">${icons.calendar}<span>${esc(dateText)}</span></div>${f.platform?`<div class="record-line">${icons.monitor}<span>${esc(f.platform)}</span></div>`:''}${f.note?`<div class="record-line">${icons.note}<div><strong>感想</strong><p class="note-quote">${esc(f.note)}</p></div></div>`:''}</div></div>
      <div class="detail-section"><h3>觀看紀錄</h3><div class="watch-history"><div class="watch-row"><span class="watch-num">1</span><strong>第一次</strong><span>${esc(dateText)}</span></div>${f.isRewatch?`<div class="watch-row"><span class="watch-num">2</span><strong>重新觀看</strong><span>${esc(f.rewatchDate||'日期不詳')}</span></div>`:''}</div></div>
      <div class="detail-section"><h3>故事簡介</h3><p class="synopsis">${esc(f.overviewZh||f.overviewEn||'暫時未有故事簡介。')}</p></div>
      ${(f.director||f.cast?.length||f.runtime)?`<div class="detail-section"><h3>電影資料</h3><div class="meta-list">${f.director?`<div><span>導演</span><strong>${esc(f.director)}</strong></div>`:''}${f.cast?.length?`<div><span>演員</span><strong>${f.cast.slice(0,8).map(esc).join(' · ')}</strong></div>`:''}${f.runtime?`<div><span>片長</span><strong>${esc(f.runtime)} 分鐘</strong></div>`:''}</div></div>`:''}
    </div></section>`,'detail');
  }

  function renderReview(){
    return chrome(`<section class="page"><div class="discover-toolbar"><button class="back-btn" data-review-back>${icons.back}</button><h1>待確認配對</h1><span></span></div><div class="page-count" style="margin:-10px 0 18px">系統唔夠肯定嘅舊紀錄會留喺呢度，唔會自行亂配。</div>${state.reviewLoading?`<div class="loading">載入中……</div>`:state.reviewRecords.length?`<div class="review-list">${state.reviewRecords.map(r=>`<button class="review-row" data-review-record="${esc(r.legacyId)}"><div><span>${esc(r.reason||'需要確認')}</span><strong>${esc(r.rawTitle||r.matchQuery||'未命名')}</strong><small>${r.yearHint?`年份提示 · ${esc(r.yearHint)}`:'沒有年份提示'}${r.candidates?.length?` · ${r.candidates.length} 個候選`:''}</small></div><b>確認 ›</b></button>`).join('')}</div>`:`<div class="review-done"><strong>已經清晒 ✓</strong><p>目前冇待確認配對。</p></div>`}</section>`,'review');
  }

  function render(){
    let html='';
    if(state.page==='home')html=renderHome();
    else if(state.page==='library')html=renderLibrary();
    else if(state.page==='add')html=renderAdd();
    else if(state.page==='discover')html=renderDiscover();
    else if(state.page==='stats')html=renderStats();
    else if(state.page==='detail')html=renderDetail(state.detailId);
    else if(state.page==='review')html=renderReview();
    $('#app').innerHTML=html;
    bind();
  }

  function bind(){
    $$('[data-nav]').forEach(el=>el.onclick=()=>{state.page=el.dataset.nav;state.discoverMode=state.page==='discover'?state.discoverMode:'root';render();scrollTo(0,0);});
    $$('.poster-card:not([data-selectable])').forEach(el=>el.onclick=()=>showFilmDetail(el.dataset.filmId));
    $$('[data-open-discover]').forEach(el=>el.onclick=()=>{state.page='discover';state.discoverMode='category';state.discoverCategory=el.dataset.openDiscover;state.personResults=[];render();scrollTo(0,0);});
    $$('[data-discover-preset]').forEach(el=>el.onclick=async()=>{if(el.dataset.discoverPreset==='hk80'){state.page='discover';state.discoverMode='results';state.discoverTitle='香港 · 1980年代';state.discoverParams={country:'HK',yearFrom:1980,yearTo:1989};state.discoverPage=1;state.discoverResults=[];state.discoverSelected.clear();render();scrollTo(0,0);await loadDiscover({...state.discoverParams,page:1},false);}});
    $$('[data-discover-root]').forEach(el=>el.onclick=()=>{state.discoverMode='root';state.discoverCategory='';state.discoverSelected.clear();state.personResults=[];render();});
    $$('[data-discover-back]').forEach(el=>el.onclick=()=>{state.discoverMode='category';state.discoverSelected.clear();render();});
    $$('[data-discover-choice]').forEach(el=>el.onclick=async()=>{state.discoverTitle=el.dataset.title||'探索電影';state.discoverParams=JSON.parse(el.dataset.params||'{}');state.discoverMode='results';state.discoverPage=1;state.discoverResults=[];state.discoverSelected.clear();render();scrollTo(0,0);await loadDiscover({...state.discoverParams,page:1},false);});
    $('[data-load-more]')?.addEventListener('click',async()=>{if(state.discoverLoading)return;const next=state.discoverPage+1;await loadDiscover({...state.discoverParams,page:next},true);});
    $('[data-toggle-hide-library]')?.addEventListener('click',()=>{state.discoverHideLibrary=!state.discoverHideLibrary;render();});
    $('[data-discover-refine]')?.addEventListener('click',openDiscoverRefineModal);
    $$('[data-person-role]').forEach(el=>el.onclick=()=>{state.personRole=el.dataset.personRole;state.personResults=[];render();setTimeout(()=>$('#person-search')?.focus(),0);});
    let personTimer; $('#person-search')?.addEventListener('input',e=>{clearTimeout(personTimer);const q=e.target.value.trim();if(q.length<2){state.personResults=[];$('#person-results').innerHTML='';return;}personTimer=setTimeout(()=>searchPeople(q),300);});
    $$('[data-person-id]').forEach(el=>el.onclick=async()=>{const id=Number(el.dataset.personId);const name=el.dataset.personName;state.discoverTitle=`${name} · ${state.personRole==='crew'?'導演':'演員'}`;state.discoverParams=state.personRole==='crew'?{crew:id}:{cast:id};state.discoverMode='results';state.discoverPage=1;state.discoverResults=[];state.discoverSelected.clear();render();await loadDiscover({...state.discoverParams,page:1},false);});
    $$('.poster-card[data-selectable]').forEach(el=>el.onclick=()=>{
      const id=el.dataset.filmId, f=filmById(id); if(f?.inLibrary){toast('呢套已經喺片庫入面');return;}
      state.discoverSelected.has(id)?state.discoverSelected.delete(id):state.discoverSelected.add(id); render();
    });
    $('[data-bulk-add]')?.addEventListener('click',()=>openBulkModal());
    $$('[data-filter]').forEach(el=>el.onclick=()=>{state.libraryFilter=el.dataset.filter;render();});
    $$('[data-open-library-filter]').forEach(el=>el.onclick=()=>openLibraryFilterModal(el.dataset.openLibraryFilter));
    $('[data-open-library-sort]')?.addEventListener('click',openLibrarySortModal);
    $$('[data-clear-facets]').forEach(el=>el.onclick=()=>{state.libraryFacets={year:'',region:'',genre:'',director:'',cast:'',platform:'',rating:''};render();});
    $('#library-search')?.addEventListener('input',e=>{state.libraryQuery=e.target.value; const pos=e.target.selectionStart; render(); setTimeout(()=>{$('#library-search')?.focus();$('#library-search')?.setSelectionRange(pos,pos)},0);});
    let searchTimer; $('#add-search')?.addEventListener('input',e=>{clearTimeout(searchTimer); const q=e.target.value.trim(); if(q.length<2){state.searchResults=[];return;} searchTimer=setTimeout(()=>searchMovies(q),350);});
    $$('[data-quick-add]').forEach(el=>el.onclick=()=>openRecordModal(filmById(el.dataset.quickAdd)));
    $('[data-manual-add]')?.addEventListener('click',()=>openManualModal());
    $$('[data-back]').forEach(el=>el.onclick=()=>{state.page='library';render();});
    $$('[data-edit-film]').forEach(el=>el.onclick=()=>openRecordModal(filmById(el.dataset.editFilm),true));
    $$('[data-delete-film]').forEach(el=>el.onclick=()=>openDeleteFilmModal(filmById(el.dataset.deleteFilm)));
    $$('[data-remap-film]').forEach(el=>el.onclick=()=>openRemapFilmModal(filmById(el.dataset.remapFilm)));
    $('[data-open-review]')?.addEventListener('click',()=>openReviewQueue());
    $('[data-review-back]')?.addEventListener('click',()=>{state.page='home';render();});
    $$('[data-review-record]').forEach(el=>el.onclick=()=>openReviewRecord(state.reviewRecords.find(r=>String(r.legacyId)===String(el.dataset.reviewRecord))));
    $$('[data-stats-tab]').forEach(el=>el.onclick=()=>{state.statsTab=el.dataset.statsTab;render();});
    $('[data-run-migration]')?.addEventListener('click',requestLegacyMigration);
    $('[data-reset-write-token]')?.addEventListener('click',()=>{localStorage.removeItem('krince-write-token');openSyncTokenModal();});
    $('[data-connect-backend]')?.addEventListener('click',openConnectionModal);
  }

  function facetValues(key){
    const vals=[];
    state.films.forEach(f=>{
      if(key==='year'&&f.year) vals.push(String(f.year));
      else if(key==='region') vals.push(...normalizeList(f.region));
      else if(key==='genre') vals.push(...normalizeList(f.genres));
      else if(key==='director') vals.push(...normalizeList(f.director));
      else if(key==='cast') vals.push(...normalizeList(f.cast));
      else if(key==='platform') vals.push(f.platform||'未記錄');
      else if(key==='rating'&&f.rating!=null&&f.rating!=='') vals.push(String(Number(f.rating)));
    });
    const unique=[...new Set(vals.filter(Boolean))];
    if(key==='year') return unique.sort((a,b)=>Number(b)-Number(a));
    if(key==='rating') return unique.sort((a,b)=>Number(b)-Number(a));
    return unique.sort((a,b)=>a.localeCompare(b,'zh-HK'));
  }
  function openLibrarySortModal(){
    const options=[
      ['year-desc','年份 · 新 → 舊'],['year-asc','年份 · 舊 → 新'],
      ['title-asc','片名 · A → Z'],['title-desc','片名 · Z → A'],
      ['rating-desc','我的評分 · 高 → 低'],['rating-asc','我的評分 · 低 → 高'],
      ['tmdb-desc','TMDB · 高 → 低'],['tmdb-asc','TMDB · 低 → 高'],
      ['created-desc','最近加入'],['created-asc','最早加入'],
      ['original','原本次序']
    ];
    modal(`<div class="modal-head"><h2>排序</h2><button class="close-btn">×</button></div>
      <div class="facet-options">${options.map(([value,label])=>`<button class="facet-option ${state.librarySort===value?'active':''}" data-sort-value="${value}"><span>${label}</span>${state.librarySort===value?'✓':''}</button>`).join('')}</div>`);
    $$('[data-sort-value]').forEach(el=>el.onclick=()=>{
      state.librarySort=el.dataset.sortValue;
      localStorage.setItem('krince-library-sort',state.librarySort);
      closeModal();render();
    });
  }

  function openLibraryFilterModal(key){
    const names={year:'年份',region:'地區',genre:'類型',director:'導演',cast:'演員',platform:'觀看平台',rating:'評分'};
    const values=facetValues(key), current=state.libraryFacets[key]||'';
    const needsSearch=['director','cast'].includes(key)&&values.length>20;
    modal(`<div class="modal-head"><h2>${names[key]}</h2><button class="close-btn">×</button></div>
      ${needsSearch?`<div class="searchbox compact"><input id="facet-search" placeholder="搜尋${names[key]}……"></div>`:''}
      <div class="facet-options" id="facet-options">
        <button class="facet-option ${!current?'active':''}" data-facet-value=""><span>全部</span>${!current?'✓':''}</button>
        ${values.map(v=>`<button class="facet-option ${String(current)===String(v)?'active':''}" data-facet-value="${esc(v)}"><span>${key==='rating'?`${esc(v)} ★`:esc(v)}</span>${String(current)===String(v)?'✓':''}</button>`).join('')}
      </div>`);
    const bindOptions=()=>$$('[data-facet-value]').forEach(el=>el.onclick=()=>{state.libraryFacets[key]=el.dataset.facetValue;closeModal();render();});
    bindOptions();
    $('#facet-search')?.addEventListener('input',e=>{
      const q=e.target.value.trim().toLowerCase();
      $('#facet-options').innerHTML=`<button class="facet-option ${!current?'active':''}" data-facet-value=""><span>全部</span>${!current?'✓':''}</button>`+
        values.filter(v=>v.toLowerCase().includes(q)).map(v=>`<button class="facet-option ${String(current)===String(v)?'active':''}" data-facet-value="${esc(v)}"><span>${esc(v)}</span>${String(current)===String(v)?'✓':''}</button>`).join('');
      bindOptions();
    });
  }
  async function showFilmDetail(id){
    state.detailId=id;state.page='detail';render();scrollTo(0,0);
    const f=filmById(id);
    if(!API||!f?.tmdbId||f.tmdbVoteAverage!=null)return;
    try{
      const d=mapApiFilm(await apiGet('tmdbDetails',{id:f.tmdbId}));
      ['titleZh','titleEn','originalTitle','year','region','genres','director','cast','runtime','posterPath','backdropPath','overviewZh','overviewEn','tmdbVoteAverage','tmdbVoteCount'].forEach(k=>{if(d[k]!=null&&d[k]!==''&&(!Array.isArray(d[k])||d[k].length))f[k]=d[k];});
      persist();
      if(localStorage.getItem('krince-write-token')){try{await apiPost('updateFilm',{film:f});}catch(e){console.warn('TMDB rating cache write skipped',e);}}
      if(state.page==='detail'&&state.detailId===id)render();
    }catch(e){console.warn('TMDB detail refresh skipped',e);}
  }

  function openDiscoverRefineModal(){
    const p=state.discoverParams||{};
    const country=DISCOVER_COUNTRIES.find(x=>x[1]===p.country)?.[1]||'';
    const decade=DISCOVER_DECADES.find(x=>Number(x[1])===Number(p.yearFrom)&&Number(x[2])===Number(p.yearTo));
    modal(`<div class="modal-head"><h2>篩選探索結果</h2><button class="close-btn">×</button></div><div class="form-grid"><div class="field"><label>地區</label><select id="ref-country"><option value="">全部</option>${DISCOVER_COUNTRIES.map(([n,c])=>`<option value="${c}" ${country===c?'selected':''}>${n}</option>`).join('')}</select></div><div class="field"><label>年代</label><select id="ref-decade"><option value="">全部</option>${DISCOVER_DECADES.map(([n,a,b])=>`<option value="${a}-${b}" ${decade&&decade[1]===a?'selected':''}>${n}</option>`).join('')}</select></div><div class="field"><label>類型</label><select id="ref-genre"><option value="">全部</option>${DISCOVER_GENRES.map(([n,id])=>`<option value="${id}" ${String(p.genre||'')===String(id)?'selected':''}>${n}</option>`).join('')}</select></div><div class="field"><label>平台（香港區）</label><select id="ref-provider"><option value="">全部</option>${DISCOVER_PROVIDERS.map(([n,id])=>`<option value="${id}" ${String(p.provider||'')===String(id)?'selected':''}>${n}</option>`).join('')}</select></div><button class="primary-btn" id="apply-discover-refine">套用篩選</button></div>`);
    $('#apply-discover-refine').onclick=async()=>{
      const next={};const c=$('#ref-country').value,d=$('#ref-decade').value,g=$('#ref-genre').value,pr=$('#ref-provider').value;
      if(c)next.country=c;if(d){const [a,b]=d.split('-');next.yearFrom=a;next.yearTo=b;}if(g)next.genre=g;if(pr){next.provider=pr;next.watchRegion='HK';}
      if(p.cast)next.cast=p.cast;if(p.crew)next.crew=p.crew;
      state.discoverParams=next;state.discoverTitle='自訂探索';state.discoverPage=1;state.discoverResults=[];state.discoverSelected.clear();closeModal();render();await loadDiscover({...next,page:1},false);
    };
  }

  async function refreshReviewCount(){
    if(!API){state.reviewCount=0;return;}
    try{const m=await apiGet('migrationStatus');state.reviewCount=Number(m.review||0)+Number(m.error||0);}catch(e){console.warn('Review status unavailable',e);}
  }
  async function openReviewQueue(){
    state.page='review';state.reviewLoading=true;render();scrollTo(0,0);
    try{const data=await apiGet('migrationReview');state.reviewRecords=data.records||[];state.reviewCount=state.reviewRecords.length;}catch(e){toast('未能載入待確認配對');console.error(e);}finally{state.reviewLoading=false;render();}
  }
  async function getLegacyQueue(){
    if(Array.isArray(window.LEGACY_MIGRATION_QUEUE))return window.LEGACY_MIGRATION_QUEUE;
    try{const r=await fetch('data/legacy_migration_queue.json',{cache:'no-store'});return await r.json();}catch(_){return [];}
  }
  async function openReviewRecord(rec){
    if(!rec)return;
    modal(`<div class="modal-head"><h2>${esc(rec.rawTitle||'確認電影')}</h2><button class="close-btn">×</button></div><p class="muted review-reason">${esc(rec.reason||'需要確認')}</p><div id="review-candidates" class="review-candidates"><div class="loading">載入候選電影……</div></div><div class="review-search"><label>都唔啱？重新搜尋</label><div class="searchbox">${icons.search}<input id="review-search-input" value="${esc(rec.matchQuery||rec.rawTitle||'')}" placeholder="輸入電影名"></div><div id="review-search-results"></div></div><button class="secondary-btn" id="review-later">稍後先處理</button>`);
    $('#review-later').onclick=closeModal;
    const basic=(rec.candidates||[]).slice(0,4);
    const details=[];
    for(const c of basic){try{details.push(mapApiFilm(await apiGet('tmdbDetails',{id:c.id})));}catch(_){details.push(mapApiFilm({tmdbId:c.id,titleZh:c.title,originalTitle:c.originalTitle,year:c.year,posterPath:c.posterPath||''}));}}
    renderReviewCandidates(rec,details,'#review-candidates');
    let timer;$('#review-search-input').addEventListener('input',e=>{clearTimeout(timer);const q=e.target.value.trim();if(q.length<2){$('#review-search-results').innerHTML='';return;}timer=setTimeout(async()=>{try{const d=await apiGet('tmdbSearch',{q});renderReviewCandidates(rec,(d.results||[]).slice(0,8).map(mapApiFilm),'#review-search-results');}catch(_){toast('搜尋暫時失敗');}},350);});
  }
  function renderReviewCandidates(rec,films,target){
    const box=$(target);if(!box)return;box.innerHTML=films.length?films.map(f=>`<div class="review-candidate"><div class="review-candidate-poster" style="background:${posterBg(f)}"><div class="mini-placeholder">${esc(f.titleZh)}</div>${posterImg(f,'w185')?`<img src="${posterImg(f,'w185')}" onerror="this.remove()" alt="">`:''}</div><div><strong>${esc(f.titleZh)}</strong><span>${esc(f.titleEn||f.originalTitle||'')} ${f.year?`· ${f.year}`:''}</span>${f.director?`<small>導演 · ${esc(f.director)}</small>`:''}${f.cast?.length?`<small>${f.cast.slice(0,3).map(esc).join(' · ')}</small>`:''}</div><button data-resolve-review="${esc(f.tmdbId)}">就是這套</button></div>`).join(''):`<div class="empty">暫時搵唔到候選電影。</div>`;
    $$('[data-resolve-review]',box).forEach(btn=>btn.onclick=()=>resolveReviewRecord(rec,Number(btn.dataset.resolveReview)));
  }
  async function resolveReviewRecord(rec,tmdbId){
    const queue=await getLegacyQueue();const meta=queue.find(x=>String(x.legacy_id)===String(rec.legacyId))||{};
    try{await apiPost('resolveMigration',{record:{legacyId:rec.legacyId,tmdbId,status:meta.status||'complete',platform:meta.platform||''}});closeModal();await refreshLiveLibraryDuringMigration();const data=await apiGet('migrationReview');state.reviewRecords=data.records||[];state.reviewCount=state.reviewRecords.length;render();toast('配對已確認');}catch(e){toast('確認失敗：'+e.message);}
  }

  function openRemapFilmModal(f){
    if(!f)return;
    modal(`<div class="modal-head"><h2>重新配對電影</h2><button class="close-btn">×</button></div><p class="muted" style="font-size:12px;line-height:1.7">如果 TMDB 自動配錯，喺度搜尋正確版本。你的觀看狀態、日期、平台、評分同感想會保留。</p><div class="searchbox">${icons.search}<input id="remap-search" value="${esc(f.titleZh||f.titleEn||'')}" placeholder="搜尋正確電影"></div><div id="remap-results" class="remap-results"></div>`);
    const run=async q=>{if(q.length<2)return;try{const d=await apiGet('tmdbSearch',{q});const box=$('#remap-results');box.innerHTML=(d.results||[]).slice(0,10).map(x=>{const m=mapApiFilm(x);return `<button class="remap-result" data-remap-target="${m.tmdbId}"><div class="result-poster" style="background:${posterBg(m)}"><div class="mini-placeholder">${esc(m.titleZh)}</div>${posterImg(m,'w185')?`<img src="${posterImg(m,'w185')}" onerror="this.remove()" alt="">`:''}</div><div><strong>${esc(m.titleZh)}</strong><span>${esc(m.titleEn||m.originalTitle||'')} ${m.year?`· ${m.year}`:''}</span></div><b>選擇</b></button>`}).join('');$$('[data-remap-target]',box).forEach(btn=>btn.onclick=()=>confirmRemapFilm(f,Number(btn.dataset.remapTarget)));}catch(e){toast('搜尋失敗');}};
    let t;$('#remap-search').addEventListener('input',e=>{clearTimeout(t);const q=e.target.value.trim();t=setTimeout(()=>run(q),300)});run($('#remap-search').value.trim());
  }
  async function confirmRemapFilm(f,newTmdbId){
    try{const result=await apiPost('remapFilm',{oldId:f.id,newTmdbId});closeModal();await refreshLiveLibraryDuringMigration();state.detailId=result.newId||`tmdb-${newTmdbId}`;state.page='detail';render();toast('已改成正確電影');}catch(e){toast('重新配對失敗：'+e.message);}
  }

  async function searchPeople(q){
    if(!API){toast('人物搜尋需要連接 TMDB');return;}
    try{
      const data=await apiGet('personSearch',{q});
      state.personResults=data.results||[];
      const box=$('#person-results');
      if(box) box.innerHTML=state.personResults.map(p=>`<button class="person-result" data-person-id="${p.id}" data-person-name="${esc(p.name)}"><strong>${esc(p.name)}</strong><span>${esc(p.knownForDepartment||'')}</span></button>`).join('');
      $$('[data-person-id]').forEach(el=>el.onclick=async()=>{const id=Number(el.dataset.personId);const name=el.dataset.personName;state.discoverTitle=`${name} · ${state.personRole==='crew'?'導演':'演員'}`;state.discoverParams=state.personRole==='crew'?{crew:id}:{cast:id};state.discoverMode='results';state.discoverPage=1;state.discoverResults=[];state.discoverSelected.clear();render();await loadDiscover({...state.discoverParams,page:1},false);});
    }catch(e){console.error(e);toast('人物搜尋暫時失敗');}
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
  function mapApiFilm(x){return {id:`tmdb-${x.tmdbId||x.id}`,tmdbId:x.tmdbId||x.id,titleZh:x.titleZh||x.title||x.name,titleEn:x.titleEn||x.englishTitle||x.originalTitle||'',originalTitle:x.originalTitle||'',year:x.year||'',region:x.region||'',genres:x.genres||[],director:x.director||'',cast:Array.isArray(x.cast)?x.cast:[],runtime:x.runtime||null,posterPath:x.posterPath||x.poster_path||'',backdropPath:x.backdropPath||x.backdrop_path||'',overviewZh:x.overviewZh||x.overview||'',overviewEn:x.overviewEn||'',tmdbVoteAverage:x.tmdbVoteAverage==null?null:Number(x.tmdbVoteAverage),tmdbVoteCount:x.tmdbVoteCount==null?null:Number(x.tmdbVoteCount),tone:['#72584c','#25201e']};}
  function jsonpGet(url,action,params={}){
    return new Promise((resolve,reject)=>{
      const cb='__kfa_jsonp_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2);
      const u=new URL(url); u.searchParams.set('action',action); u.searchParams.set('callback',cb); u.searchParams.set('_',Date.now());
      Object.entries(params).forEach(([k,v])=>{ if(v!==undefined&&v!==null)u.searchParams.set(k,v); });
      const s=document.createElement('script'); let done=false;
      const cleanup=()=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();};
      window[cb]=(data)=>{cleanup();if(data&&data.error)reject(new Error(data.error));else resolve(data||{});};
      s.onerror=()=>{cleanup();reject(new Error('未能連接 Google Apps Script'));};
      const timer=setTimeout(()=>{cleanup();reject(new Error('Google Apps Script 連線逾時'));},60000);
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
      modal(`<div class="modal-head"><h2>同步要喺正式網站進行</h2><button class="close-btn">×</button></div><div class="form-grid"><p class="muted" style="font-size:13px;line-height:1.8;margin:0">呢個 ChatGPT Preview 會阻擋連去 Google Apps Script，所以只適合預覽畫面。你的 Google Apps Script backend 已經可以獨立運作；將呢個版本放上 GitHub Pages 後，再撳「同步舊片單」就會真正連線。</p><button class="primary-btn close-btn">知道了</button></div>`);
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
  function openDeleteFilmModal(f){
    if(!f)return;
    modal(`<div class="modal-head"><h2>刪除電影紀錄？</h2><button class="close-btn">×</button></div>
      <div class="delete-confirm">
        <div class="delete-film-name"><strong>${esc(f.titleZh)}</strong>${f.titleEn?`<span>${esc(f.titleEn)}</span>`:''}</div>
        <p>刪除後，呢套電影同相關觀看紀錄會由你的片庫及 Google Sheet 移除。TMDB 本身嘅電影資料不受影響。</p>
        <p class="muted">如果呢套係舊片單自動配錯，系統亦會記低「不要再自動匯入」，之後你可以搜尋正確版本重新加入。</p>
        <div class="delete-actions"><button class="secondary-btn" id="delete-cancel">取消</button><button class="danger-btn" id="delete-confirm">確認刪除</button></div>
      </div>`);
    $('#delete-cancel').onclick=closeModal;
    $('#delete-confirm').onclick=async()=>{
      const btn=$('#delete-confirm');btn.disabled=true;btn.textContent='刪除中…';
      try{
        if(API) await apiPost('deleteFilm',{id:f.id});
        state.films=state.films.filter(x=>x.id!==f.id && !(f.tmdbId&&x.tmdbId===f.tmdbId));
        persist();closeModal();state.page='library';state.detailId=null;render();toast('已刪除電影紀錄');
      }catch(e){console.error(e);btn.disabled=false;btn.textContent='確認刪除';toast('刪除失敗：'+e.message);}
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

  async function loadDiscover(params,append=false){
    state.discoverLoading=true;render();
    try{
      if(API){
        const data=await apiGet('discover',params);
        const incoming=markLibraryFlags((data.results||[]).map(mapApiFilm));
        const merged=append?[...state.discoverResults,...incoming]:incoming;
        const seen=new Set();
        state.discoverResults=merged.filter(f=>{const k=f.tmdbId||f.id;if(seen.has(k))return false;seen.add(k);return true;});
        state.discoverPage=Number(data.page||params.page||1);
        state.discoverTotalPages=Math.min(Number(data.totalPages||1),500);
      } else {
        state.discoverResults=markLibraryFlags(demoDiscover);
        state.discoverPage=1;state.discoverTotalPages=1;
      }
    }catch(e){console.warn(e);if(!append)state.discoverResults=markLibraryFlags(demoDiscover);toast('探索電影暫時未能載入');}
    state.discoverLoading=false;render();
  }

  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  async function refreshLiveLibraryDuringMigration(){
    try{
      const lib=await apiGet('library');
      const bootstrap=await fetchBootstrapFilms();
      const live=Array.isArray(lib.films)?lib.films.map(mapApiFilmFromSheet):[];
      state.films=mergeLiveAndLegacy(live,bootstrap,lib.migratedLegacyIds||[]);persist();render();
    }catch(e){console.warn('Live library refresh skipped',e);}
  }
  async function postMigrationRecordWithRetry(record,maxAttempts=3){
    let lastErr;
    for(let attempt=1;attempt<=maxAttempts;attempt++){
      try{return await apiPost('migrateLegacyBatch',{records:[record]});}
      catch(e){
        lastErr=e;
        console.warn(`Migration retry ${attempt}/${maxAttempts}`,record.legacy_id,e);
        if(attempt<maxAttempts)await sleep(1200*attempt);
      }
    }
    throw lastErr||new Error('同步失敗');
  }
  async function runLegacyMigration(){
    if(!API||state.migrationRunning)return;
    state.migrationRunning=true;state.migrationProgress={done:0,total:0,failed:0};render();
    let failed=0;
    try{
      let queue;
      if (Array.isArray(window.LEGACY_MIGRATION_QUEUE)) queue=window.LEGACY_MIGRATION_QUEUE;
      else { const r=await fetch('data/legacy_migration_queue.json',{cache:'no-store'}); queue=await r.json(); }
      state.migrationProgress.total=queue.length;
      const compact=(rec)=>({legacy_id:rec.legacy_id,raw_title:rec.raw_title,match_query:rec.match_query,year_hint:rec.year_hint||'',status:rec.status||'complete',platform:rec.platform||'',watched_from:rec.watched_from||'2021',watched_to:rec.watched_to||'2026',legacy_source_column:rec.legacy_source_column||'',force_review:!!rec.force_review});
      for(let i=0;i<queue.length;i++){
        const record=compact(queue[i]);
        try{
          await postMigrationRecordWithRetry(record,3);
        }catch(e){
          failed++;
          console.error('Skipping record after retries',record,e);
        }
        state.migrationProgress.done=i+1;
        state.migrationProgress.failed=failed;
        if((i+1)%10===0 || i===queue.length-1) await refreshLiveLibraryDuringMigration();
        else render();
        await sleep(120);
      }
      await refreshLiveLibraryDuringMigration();
      const ms=await apiGet('migrationStatus');
      toast(`TMDB 同步完成：${ms.matched||0} 已配對，${ms.review||0} 待確認${failed?`，${failed} 部稍後重試`:''}`);
    }catch(e){console.error(e);toast('同步暫停：'+e.message+'；再次撳同步會由已完成紀錄續跑');}
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
    await refreshReviewCount();
    render();
  }
  function mapApiFilmFromSheet(x){return {...x,id:x.id||x.internalId||`tmdb-${x.tmdbId}`,titleZh:x.titleZh||x.title_zh_hk||x.title,titleEn:x.titleEn||x.title_en||'',posterPath:x.posterPath||x.poster_path||'',backdropPath:x.backdropPath||x.backdrop_path||'',genres:Array.isArray(x.genres)?x.genres:String(x.genres||'').split('|').filter(Boolean),cast:Array.isArray(x.cast)?x.cast:String(x.cast||'').split('|').filter(Boolean),rating:(x.rating===''||x.rating==null)?null:Number(x.rating),tmdbVoteAverage:(x.tmdbVoteAverage===''||x.tmdbVoteAverage==null)?null:Number(x.tmdbVoteAverage),tmdbVoteCount:(x.tmdbVoteCount===''||x.tmdbVoteCount==null)?null:Number(x.tmdbVoteCount),createdAt:x.createdAt||x.created_at||'',updatedAt:x.updatedAt||x.updated_at||'',needsEnrichment:false,tone:['#6b5348','#25201e']};}

  hydrate();
})();
