/* 부드러운 지층 · Fluffy Strata — 돌무더기(/stone/)와 리좀(/stone/rhizome/)이 함께 쓰는 코드
   데이터 불러오기 · 한/영 문구 · 글마다 돌 정하기 · 마우스 궤적 · 글 읽기 패널 · 네트워크 배치 · 마크다운
   3D(돌 모델·물리·그리기)는 /stone/stones.js */
(() => {
"use strict";

/* ============================================================================
   문구 (나중에 다듬어서 바꿔 넣는 곳)
   - TEXT.en / TEXT.ko : 화면 문구. 기본 언어는 영어.
   - TOPICS : 포자 분류(의제)별 이름 · 설명 · 색. 어드민 ‘포자 이미지’의 primaryTopic 값과 같은 키.
   ============================================================================ */
const TEXT = {
  en: {
    title: ["FLUFFY", "STRATA"], titleFlat: "Fluffy Strata",
    subtitle: "Relations that overlap, seep in, and grow in the gaps of time.",
    navStones: "Stones", navRhizome: "Rhizome", navAbout: "About",
    pileHint: "Hover a stone to rattle it · click to pick it up · scroll to zoom",
    pickedUp: "Picked up", putBack: "Put it back",
    close: "Close", article: "Stone", chars: "chars", min: "min", viewInRhizome: "View in the rhizome", linked: "Stones on the same thread",
    aboutTitle: "Fluffy Strata", aboutBody: "A webzine of stones floating in space. Each article is one stone; shared concepts are stars, and threads tie stones to the stars and to each other, without hierarchy.",
    dataLive: n => `${n} published articles from the admin. Saved changes appear within a minute or two.`,
    dataCache: n => `Could not reach the server — showing the last ${n} articles saved in this browser.`,
    dataSample: "Could not load published articles — showing sample articles.", dataEmpty: "No published articles yet.",
    refresh: "Reload", refreshed: n => `Loaded ${n} articles`, upToDate: "Already up to date", offline: "Could not reach the server", loadFail: "Could not load articles — showing samples",
    // rhizome page
    mycelium: "Stone Rhizome", myHyphae: "My orbit", index: "Index", fit: "Fit", hint: "Choose a star to draw its constellation",
    explore: "Rhizome / Explore", keepsLinks: "The threads keep the links of the stone you chose", connectedSpores: "Stars", hyphaeLinked: "Threads · linked stones",
    read: "Read →", memo: "memo", concepts: "Stars", articles: "Stones", none: "None", search: "Search",
    traceNeedTwo: "Pick up two or more stones to draw your own orbit", traceCleared: "Cleared your orbit", clearTrace: "Clear my orbit",
    zoomIn: "Zoom in", zoomOut: "Zoom out", back: "Back to the pile",
    legend: [["Stone", "an article — bigger when longer, glassy when very long"], ["Star", "a concept the articles share (tags · category)"], ["Thread", "a link between star and stone, or stone and stone"], ["Constellation", "the stones around a chosen star; choose several and shared stones glow"], ["Orbit", "the path you have read, shown in ‘My orbit’"]]
  },
  ko: {
    title: ["부드러운", "지층"], titleFlat: "부드러운 지층",
    subtitle: "겹쳐지고 침투하며 시간의 틈에서 자라나는 관계들",
    navStones: "돌", navRhizome: "리좀", navAbout: "소개",
    pileHint: "돌에 마우스를 올리면 덜걱거려요 · 누르면 집어 들어요 · 스크롤로 확대",
    pickedUp: "집어 든 돌", putBack: "내려놓기",
    close: "닫기", article: "Stone", chars: "자", min: "분", viewInRhizome: "리좀에서 보기", linked: "같은 실에 꿰인 돌",
    aboutTitle: "부드러운 지층", aboutBody: "우주에 떠 있는 돌들의 웹진이에요. 글 하나가 돌 하나이고, 같은 개념은 별이 되어, 실이 위계 없이 별과 돌, 돌과 돌을 이어요.",
    dataLive: n => `어드민에서 발행한 글 ${n}편이에요. 저장하면 1~2분 안에 반영돼요.`,
    dataCache: n => `서버에 연결하지 못해 이 브라우저에 저장된 글 ${n}편을 보여줘요.`,
    dataSample: "발행된 글을 불러오지 못해 예시 글을 보여줘요.", dataEmpty: "아직 발행된 글이 없어요.",
    refresh: "새로 불러오기", refreshed: n => `글 ${n}편을 새로 불러왔어요`, upToDate: "이미 최신이에요", offline: "서버에 연결하지 못했어요", loadFail: "글을 불러오지 못해 예시를 보여줘요",
    mycelium: "Stone Rhizome", myHyphae: "나의 궤도", index: "목록", fit: "전체", hint: "별(개념)을 눌러 별자리를 그려 보세요",
    explore: "Rhizome / Explore", keepsLinks: "실은 고른 돌의 연결을 유지해요", connectedSpores: "Stars · 별", hyphaeLinked: "Threads · 이어진 돌",
    read: "읽기 →", memo: "메모", concepts: "별", articles: "돌", none: "없음", search: "검색",
    traceNeedTwo: "돌을 두 개 이상 집어 들면 그 사이에 나의 궤도가 생겨요", traceCleared: "나의 궤도를 지웠어요", clearTrace: "나의 궤도 지우기",
    zoomIn: "확대", zoomOut: "축소", back: "돌무더기로",
    legend: [["Stone", "글. 길수록 크고, 아주 긴 글은 유리질 보석이에요"], ["Star", "글들이 함께 쓰는 개념(태그·카테고리)"], ["Thread", "별과 돌, 돌과 돌을 잇는 실"], ["Constellation", "고른 별 둘레의 돌. 여러 개를 고르면 겹치는 돌이 밝아져요"], ["Orbit", "내가 읽어 온 길. ‘나의 궤도’에서 따로 볼 수 있어요"]]
  }
};
const TOPICS = {
  experience_place:     { color: "#8fa89a", tint: "#b9cdbf", ko: ["경험 · 관람 · 장소", "녹색 계열 · 부드러운 반투명 외피"], en: ["Experience · Viewing · Place", "Green · a soft translucent shell"] },
  memory_time:          { color: "#c19e78", tint: "#dcc3a3", ko: ["기억 · 기록 · 시간", "앰버 계열 · 겹치는 막과 잔상"],     en: ["Memory · Record · Time", "Amber · overlapping membranes and afterimages"] },
  media_technology:     { color: "#95a3c6", tint: "#bec8e0", ko: ["매체 · 물질 · 기술", "청회색 계열 · 유리질과 미세 격자"], en: ["Media · Matter · Technology", "Blue-grey · glassy, with a fine lattice"] },
  body_relation:        { color: "#c0918d", tint: "#dcb7b2", ko: ["신체 · 관계 · 공존", "코럴 계열 · 유기적 섬유와 접합부"], en: ["Body · Relation · Coexistence", "Coral · organic fibres and junctions"] },
  institution_critique: { color: "#9b8bc3", tint: "#c3b7e0", ko: ["제도 · 비평 · 권력", "보라 계열 · 단단한 외피와 균열"],   en: ["Institution · Critique · Power", "Violet · a hard shell with fissures"] },
  unclassified:         { color: "#dfe3f1", tint: "#f3e4ec", ko: ["아직 분류되지 않은 포자", "진주빛 · 어드민에서 의제를 고르면 색이 생겨요"], en: ["Not yet classified", "Pearl · takes on a color once a topic is chosen in the admin"] }
};

/* ===================== language ===================== */
const LANG_KEY = "rhizome-lang";
let LANG = (() => {
  const q = new URLSearchParams(location.search).get("lang");
  if (q === "ko" || q === "en") { try { localStorage.setItem(LANG_KEY, q); } catch {} return q; }
  try { const s = localStorage.getItem(LANG_KEY); if (s === "ko" || s === "en") return s; } catch {}
  return "en";
})();
const t = k => { const v = (TEXT[LANG] || TEXT.en)[k]; return v === undefined ? TEXT.en[k] : v; };
const langHooks = [];
function setLang(l) {
  if (l === LANG) return;
  LANG = l; try { localStorage.setItem(LANG_KEY, l); } catch {}
  document.documentElement.lang = l;
  document.documentElement.classList.toggle("ko", l === "ko");
  renderNav(); langHooks.forEach(f => f());
  if (reader && reader.classList.contains("open") && readerId) openReader(readerId, { replace: true });
}
document.documentElement.lang = LANG;
document.documentElement.classList.toggle("ko", LANG === "ko");
const topicText = k => (TOPICS[k] || TOPICS.unclassified)[LANG] || TOPICS.unclassified.en;

/* ===================== 예시 데이터 (서버에 못 닿을 때) ===================== */
const SAMPLE = {
  meta:{ title:"리좀 웹진", sample:true },
  categories:[
    { id:"research", name:"리서치 노트", nameEn:"Research Notes", color:"#8c9ae0" },
    { id:"essay", name:"에세이", nameEn:"Essays", color:"#d77a7a" },
    { id:"review", name:"리뷰", nameEn:"Reviews", color:"#b3bd95" },
    { id:"fragment", name:"단상", nameEn:"Fragments", color:"#e6915d" }
  ],
  nodes:[
    { id:"p01", title:"SBAU 2021 웹사이트 인터랙션 분석", titleEn:"SBAU 2021 Website Interaction Study", category:"research", tags:["레퍼런스","3D 그래프","인터랙션"], date:"2026-11-18", weight:7,
      summary:"전시 프로젝트를 3D 공간의 점으로 놓은 비엔날레 사이트를 코드 수준에서 뜯어본 노트.",
      body:"서울도시건축비엔날레 2021 사이트는 전시 프로젝트 하나하나를 3D 공간의 점으로 놓는다. 평소에는 하나의 구로 모여 천천히 돌고, '군중 모드'로 바꾸면 전시별 무리로 흩어진다.\n\n## 눈여겨본 것\n- 데이터는 CSV 한 장이다. path를 /로 쪼개 부모와 자식을 잇는다.\n- 노드에 마우스를 올리면 회전이 느려진다. 무언가를 보려 할 때 세계가 살짝 멈칫한다.\n- 점을 누르면 카메라가 2초 동안 날아가고, 글은 오른쪽 패널에서 열린다. 주소만 바뀌고 페이지는 그대로다.\n\n> 구와 군중, 두 가지 보기 사이를 오가는 전환이 이 사이트의 전부라고 해도 좋다." },
    { id:"p02", title:"Biblio-Graph를 읽는 법", titleEn:"Reading Biblio-Graph", category:"research", tags:["레퍼런스","아카이브","인터랙션"], date:"2026-11-18", weight:6,
      summary:"책, 저자, 출판사, 연도가 같은 층위의 라벨로 이어지는 도서 그래프.",
      body:"Biblio-Graph는 미술 기관의 도서 컬렉션을 그래프로 보여준다. 책, 저자, 출판사, 연도가 모두 같은 층위의 라벨이다.\n\n점을 누르면 색이 칠해진 라벨로 펼쳐지고, 여러 개를 누르면 누른 것들 사이의 선만 밝아진다. 탐색이 곧 경로가 된다.\n\n## 가져올 것\n- 테두리 없이 색만 있는 라벨\n- 흐린 배경 위에 또렷한 글자\n- 선 위에 관계의 이름을 적는 방식" },
    { id:"p03", title:"땅속줄기에 대하여", titleEn:"On Rhizomes", category:"essay", tags:["리좀","위계","연결"], date:"2026-03-02", weight:9,
      summary:"뿌리에서 가지로 자라는 나무와 아무 마디에서나 뻗는 땅속줄기.",
      body:"나무는 뿌리에서 줄기로, 줄기에서 가지로 자란다. 어디서 시작했는지가 분명하다. 땅속줄기는 다르다. 아무 마디에서나 새 줄기가 나고, 끊어져도 다른 곳에서 다시 이어진다.\n\n글을 모으는 방식도 이럴 수 있을까. 목차의 1장, 2장 대신, 한 글의 한 문장이 다른 글의 한 문장으로 옆으로 뻗어 가는 방식.\n\n이 웹진은 그 질문에서 시작했다." },
    { id:"p04", title:"목차 없는 책", titleEn:"A Book Without Contents", category:"essay", tags:["리좀","책","읽기"], date:"2026-04-11", weight:5,
      summary:"펼친 곳에서 시작하고, 건너뛰고, 다시 돌아오는 책.",
      body:"어떤 책은 첫 장부터 읽지 않아도 된다. 펼친 곳에서 시작하고, 다른 곳으로 건너뛰고, 다시 돌아온다.\n\n목차가 없다는 건 길을 잃게 한다는 뜻이 아니다. 길이 여러 개라는 뜻이다." },
    { id:"p05", title:"연결선의 두께", titleEn:"The Weight of a Line", category:"fragment", tags:["인터랙션","선","디자인"], date:"2026-05-20", weight:4,
      summary:"선의 두께는 주의의 두께다.",
      body:"선은 얇을수록 많은 것을 견딘다. 수백 개의 연결이 겹쳐도 화면이 무너지지 않으려면, 평소의 선은 거의 보이지 않아야 한다.\n\n그러다 누군가 점 하나를 누르면, 그 점에서 나가는 선만 굵어진다. 선의 두께는 주의의 두께다." },
    { id:"p06", title:"밤의 을지로를 걷다", titleEn:"Walking Euljiro at Night", category:"essay", tags:["도시","걷기","기억"], date:"2026-06-14", weight:7,
      summary:"지도 앱의 파란 점을 끄고 걸은 밤.",
      body:"을지로의 밤은 소리로 기억된다. 셔터 내리는 소리, 지게차 후진 경고음, 골목 끝에서 들리는 라디오.\n\n지도 앱의 파란 점을 끄고 걸었다. 같은 골목을 세 번 지났다는 걸 나중에야 알았다." },
    { id:"p07", title:"천 개의 고원, 다시", titleEn:"A Thousand Plateaus, Again", category:"review", tags:["리좀","들뢰즈","책"], date:"2026-02-08", weight:6,
      summary:"아무 고원에서나 시작하라는 책을 다시 읽으며.",
      body:"들뢰즈와 가타리의 『천 개의 고원』은 순서대로 읽으라고 쓰인 책이 아니다. 저자들도 서문에서 아무 고원에서나 시작하라고 말한다.\n\n다시 읽으며 밑줄 친 개념은 '연결과 이질성의 원리'다. 리좀의 어떤 점이든 다른 어떤 점과 연결될 수 있다는 것." },
    { id:"p08", title:"아카이브는 지도가 아니다", titleEn:"An Archive Is Not a Map", category:"essay", tags:["아카이브","기억","지도"], date:"2026-07-30", weight:8,
      summary:"같은 상자를 열어도 두 사람이 꺼내는 것은 다르다.",
      body:"지도는 어디로 가야 하는지를 알려준다. 아카이브는 어디에 무엇이 있었는지를 알려줄 뿐이다.\n\n그래서 아카이브를 걷는 사람은 매번 자기만의 지도를 그린다. 같은 상자를 열어도 두 사람이 꺼내는 것은 다르다." },
    { id:"p09", title:"각주에서 시작하기", titleEn:"Starting from the Footnote", category:"fragment", tags:["읽기","책","각주"], date:"2026-08-03", weight:3,
      summary:"각주는 글의 뿌리가 아니라 옆으로 뻗은 줄기다.",
      body:"논문을 읽을 때 본문보다 각주를 먼저 본다. 저자가 어디서 왔는지, 누구와 이야기하고 있는지가 거기 있다.\n\n각주는 글의 뿌리가 아니라 옆으로 뻗은 줄기다." },
    { id:"p10", title:"세운상가 옥상에서", titleEn:"On the Roof of Sewoon", category:"fragment", tags:["도시","건축","기억"], date:"2026-09-09", weight:4,
      summary:"가장 오래된 것과 가장 높은 것 사이.",
      body:"세운상가 옥상에서는 종묘 숲과 남산 타워가 한눈에 들어온다. 서울에서 가장 오래된 것과 가장 높은 것 사이에 서 있는 셈이다.\n\n발밑에서는 여전히 납땜 냄새가 올라온다." },
    { id:"p11", title:"도시를 기록하는 다섯 가지 방법", titleEn:"Five Ways to Record a City", category:"research", tags:["도시","지도","걷기"], date:"2026-10-01", weight:6,
      summary:"걷기, 소리, 계절 사진, 간판, 사라진 것의 목록.",
      body:"도시를 기록하는 방법을 다섯 가지로 나눠 정리했다.\n\n- 걷기와 메모\n- 소리 녹음\n- 같은 장소를 계절마다 사진 찍기\n- 간판과 글자 수집\n- 사라진 것의 목록 만들기\n\n다섯 번째가 가장 어렵다. 없어진 것은 없어진 뒤에야 보인다." },
    { id:"p12", title:"잊는 것도 기록이다", titleEn:"Forgetting Is Also a Record", category:"fragment", tags:["기억","아카이브"], date:"2026-10-27", weight:4,
      summary:"기록하지 않기로 한 날들의 빈칸.",
      body:"기록하지 않기로 한 날들도 있다. 그 빈칸도 아카이브의 일부다.\n\n잊는 것은 지우는 것과 다르다. 잊힌 것은 어딘가에서 다시 이어질 수 있다." }
  ],
  links:[
    {source:"p01",target:"p02"},{source:"p01",target:"p05"},{source:"p02",target:"p08"},{source:"p03",target:"p04"},
    {source:"p03",target:"p07"},{source:"p03",target:"p08"},{source:"p04",target:"p09"},{source:"p06",target:"p10"},
    {source:"p06",target:"p11"},{source:"p10",target:"p11"},{source:"p08",target:"p12"},{source:"p07",target:"p04"}
  ]
};

/* ===================== helpers ===================== */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rnd = seed => { let x = hash(seed) || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 100000) / 100000; }; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtDate = d => d ? String(d).replace(/-/g, ".") : "";
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
const plain = md => String(md || "").replace(/```[\s\S]*?```/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[#>*_`~|-]+/g, " ").replace(/\s+/g, " ").trim();
const rgb = h => { const m = String(h || "").replace("#", ""); return [0, 2, 4].map(i => parseInt(m.slice(i, i + 2), 16) || 0); };
const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/* ===================== data (어드민과 같은 공개 API) ===================== */
const API = /\.vercel\.app$/.test(location.hostname) || /(^|\.)fluffydough\.xyz$/.test(location.hostname) ? "/api/rhizome" : "https://rhizome-webzine.vercel.app/api/rhizome";   // 같은 서버면 같은 주소로
const CACHE_KEY = "rhizome-webzine-live";
let DATA = SAMPLE, src = "sample", shown = "sample";
const valid = j => j && Array.isArray(j.nodes) && j.nodes.some(n => n && n.title);
const isFeed = j => j && Array.isArray(j.nodes);
const sig = j => valid(j) ? JSON.stringify([j.categories, j.nodes, j.links]) : isFeed(j) ? "empty" : "sample";
async function fetchLive() {
  const r = await fetch(API, { cache: "no-store" });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json(); if (!isFeed(j)) throw new Error("bad data");
  return j;
}
function useData(j, from) {
  if (valid(j)) { DATA = j; src = from; }
  else if (isFeed(j)) { DATA = { meta: j.meta || {}, categories: [], nodes: [], links: [] }; src = from; }
  else { DATA = SAMPLE; src = "sample"; }
  shown = sig(j); index();
}
async function load() {
  try { const j = await fetchLive(); try { localStorage.setItem(CACHE_KEY, JSON.stringify(j)); } catch {} useData(j, "live"); }
  catch {
    let cached = null; try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch {}
    useData(cached, "cache"); if (src === "sample") toast(t("loadFail"));
  }
}
const dataHooks = [];
async function refresh(manual) {
  try {
    const j = await fetchLive();
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(j)); } catch {}
    const changed = sig(j) !== shown;
    if (changed) { useData(j, "live"); dataHooks.forEach(f => f()); }
    else if (src === "cache") src = "live";
    if (manual) { closeAbout(); toast(changed ? t("refreshed")(POSTS.length) : t("upToDate")); }
  } catch { if (manual) toast(t("offline")); }
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && POSTS.length) refresh(false); });

/* posts with everything derived once: number, length tier, concepts, links */
let POSTS = [], BYID = new Map(), LINKS = [], NBR = new Map(), CATS = new Map();
const TIER_MAX = 5000;
/* 글마다 돌 하나: 12가지 모양(strange stones, media/stones/s01~s12.glb) × 재질 2가지(광택 돌 · 유리질 보석).
   - 모양: 글 번호 순서대로 s01부터 하나씩, 12편을 넘으면 처음부터 다시(그땐 재질을 바꿔 구별).
   - 재질: 4~5단계(긴) 글은 보석, 나머지는 광택 돌. 
   - 크기: 글이 길수록 커요.
   특정 글에 특정 돌을 붙이려면 STONE_PICK = { 글ID: { shape: 0~11, gem: true/false, hue: -180~180, sat: 0.5~1.5 } } */
const STONE_NAMES = ["vortex cube", "honeycomb geode", "ripple disc", "twisted helix", "bubble obsidian", "ammonite spiral", "melted drip", "star fracture sphere", "stacked layers", "cratered egg", "porous iridescent", "trefoil knot"];
const STONES = STONE_NAMES.map((name, i) => { const n = String(i + 1).padStart(2, "0"); return { id: "s" + n, name, src: `/stone/media/stones/s${n}.glb` }; });
const STONE_PICK = {};
const GEM_TIER = 4;
const STONE_HUE = 28;   // 글마다 색조를 돌리는 폭(도). 0이면 모델 색 그대로. STONE_PICK에 hue·sat(채도 배율)을 적으면 그 글은 그 값
/* 어드민에서 아직 포자 속성을 고르지 않은 글: 제목·태그·본문의 낱말로 의제와 유형을 짐작해 임시 속성을 붙여요.
   (어드민에서 고르면 그쪽이 이겨요.) 같은 글은 언제나 같은 결과. */
const TOPIC_WORDS = {
  experience_place: ["관람", "장소", "공간", "산책", "여행", "파리", "현장", "도시", "건축", "동선", "주말", "place", "site"],
  memory_time: ["기억", "기록", "시간", "역사", "아카이브", "도록", "흔적", "인생", "과거", "추억", "남기", "굿즈", "memory", "archive", "time"],
  media_technology: ["기술", "컴퓨터", "매체", "미디어", "디지털", "영상", "영화", "데이터", "기계", "직조", "물질", "사운드", "인류세", "technology", "media", "film"],
  body_relation: ["몸", "신체", "관계", "여성", "공존", "돌봄", "함께", "타자", "연대", "혼자", "alone", "together", "body"],
  institution_critique: ["제도", "비평", "권력", "정치", "자본", "시장", "국가", "미니멀리즘", "질문", "작가상", "수상", "미술계", "critique", "institution"]
};
function autoSpore(p) {
  const head = `${p.title} ${p.titleEn || ""} ${(p.tags || []).join(" ")}`.toLowerCase(), body = plain(p.body).toLowerCase();
  const count = (s, w) => s.split(w).length - 1;
  const R = rnd("auto_" + p.id);
  const score = Object.entries(TOPIC_WORDS).map(([k, ws]) => [k, ws.reduce((n, w) => n + count(head, w) * 6 + Math.min(12, count(body, w)), 0) + R() * .5]).sort((a, b) => b[1] - a[1]);
  const [t1, t2] = score, chars = p._chars;
  const title = String(p.title || "");
  const contentType = chars < 300 ? "casual_fragment"
    : /하우투|가이드|방법|how ?to/i.test(title) ? "observation_guide"
    : /세미나|스터디|강의|아카데미/.test(head) ? "research_note"
    : /(들['’]?\s*$|들['’]|모음|목록)/.test(title) ? "collection_comparison"
    : /비평|연구|인류세|미니멀리즘|특정성/.test(head) ? "critical_research"
    : /질문|개념|철학|alone|better/i.test(head) ? "conceptual_essay"
    : chars >= 5000 ? "experiential_essay" : "exhibition_review";
  return {
    image: null, auto: true, contentType, primaryTopic: t1[0], secondaryTopic: t2[1] >= t1[1] * .45 && t2[1] > 1 ? t2[0] : null,
    complexity: chars >= 9000 ? 5 : chars >= 6000 ? 4 : chars >= 1500 ? 3 : chars >= 300 ? 2 : 1,
    symmetry: 2 + Math.floor(R() * 3), seed: "article_" + p.id
  };
}
function index() {
  CATS = new Map((DATA.categories || []).map(c => [c.id, c]));
  POSTS = (DATA.nodes || []).filter(p => p && p.title);
  BYID = new Map(POSTS.map(p => [p.id, p]));
  const byDate = [...POSTS].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")) || String(a.id).localeCompare(String(b.id)));
  byDate.forEach((p, i) => { p._no = i + 1; });
  POSTS.forEach(p => {
    p._chars = plain(p.body).length;
    if (!p.spore || !p.spore.primaryTopic) { const a = autoSpore(p), s = p.spore || {}; p.spore = { ...a, ...s, primaryTopic: a.primaryTopic, secondaryTopic: s.secondaryTopic || a.secondaryTopic, contentType: s.contentType || a.contentType }; }
    const c = CATS.get(p.category);
    p._concepts = [...new Set([...(c && c.name ? [c.name] : []), ...(p.tags || []).map(String).filter(Boolean)])];
    p._topic = p.spore && TOPICS[p.spore.primaryTopic] ? p.spore.primaryTopic : "unclassified";
    p._topic2 = p.spore && TOPICS[p.spore.secondaryTopic] && p.spore.secondaryTopic !== p._topic ? p.spore.secondaryTopic : null;
  });
  // 글자수 구간: 5000자 이상 = 5, 그 아래는 서로 비교해 1~4 (짧은 순으로 4등분, 같은 글자수는 같은 구간)
  const short = POSTS.filter(p => p._chars < TIER_MAX).map(p => p._chars).sort((a, b) => a - b);
  POSTS.forEach(p => { p._tier = p._chars >= TIER_MAX ? 5 : short.length > 1 ? 1 + Math.min(3, Math.floor(short.indexOf(p._chars) / short.length * 4)) : 2; });
  // 돌 잇기: 글 번호 순서
  [...POSTS].sort((a, b) => a._no - b._no).forEach((p, i) => {
    const pick = STONE_PICK[p.id] || {}, R = rnd("stone_" + p.id);
    const shape = pick.shape ?? i % STONES.length, lap = Math.floor(i / STONES.length);
    const gem = pick.gem ?? ((p._tier >= GEM_TIER) !== (lap % 2 === 1));
    // 색: 글마다 색조를 조금씩 돌려요(±STONE_HUE도). 같은 모양을 다시 쓰는 글은 크게 돌려서 확실히 다르게
    const hue = Math.round(lap ? (R() < .5 ? -1 : 1) * (70 + R() * 110) : (R() * 2 - 1) * STONE_HUE), sat = +(.85 + R() * .35).toFixed(2);
    p._stone = { ...STONES[shape], shape, gem, hue: pick.hue ?? hue, sat: pick.sat ?? sat, size: clamp(.62 + .7 * Math.sqrt(p._chars / 12000), .6, 1.4), seed: R(), spin: .08 + R() * .14 };
    // 어드민에서 이 글의 3D 모델(GLB)을 올려 승인했으면 기본 돌 대신 그 모델을 그대로(색조·보석 재질을 덧입히지 않음)
    if (p.stoneModel && p.stoneModel.url) Object.assign(p._stone, { id: "custom", name: "custom", src: p.stoneModel.url, custom: true, gem: false, hue: 0, sat: 1 });
  });
  const seen = new Set(); LINKS = [];
  (DATA.links || []).forEach(l => {
    if (!BYID.has(l.source) || !BYID.has(l.target) || l.source === l.target) return;
    const k = [l.source, l.target].sort().join("|"); if (seen.has(k)) return; seen.add(k); LINKS.push({ a: l.source, b: l.target });
  });
  NBR = new Map(POSTS.map(p => [p.id, new Set()]));
  LINKS.forEach(l => { NBR.get(l.a).add(l.b); NBR.get(l.b).add(l.a); });
  artCache.clear();
}
const titleOf = p => LANG === "en" && p.titleEn ? p.titleEn : p.title;
// 영어 화면에선 어드민에서 번역해 둔 요약·본문을 쓰고, 없으면 한국어 원문
const summaryOf = p => LANG === "en" && p.summaryEn ? p.summaryEn : (p.summary || "");
const bodyOf = p => LANG === "en" && p.bodyEn ? p.bodyEn : (p.body || "");
const altTitleOf = p => LANG === "en" ? (p.titleEn ? p.title : "") : (p.titleEn || "");
const no = p => String(p._no).padStart(3, "0");
const catOf = p => CATS.get(p.category);
const catName = c => c ? (LANG === "en" && c.nameEn ? c.nameEn : c.name) : "";
const linkedOf = id => [...(NBR.get(id) || [])].map(x => BYID.get(x)).filter(Boolean);

/* ===================== spore art =====================
   어드민에서 승인한 포자 이미지가 있으면 그것을, 없으면 포자 속성(유형·의제·복잡도·연결·대칭·시드)으로
   그린 임시 표본을 씀. 같은 글은 언제나 같은 모양. */
const artCache = new Map();
function sporeCanvas(p, S = 256) {
  const key = p.id + ":" + S;
  if (artCache.has(key)) return artCache.get(key);
  const s = p.spore || {}, T1 = TOPICS[p._topic], c1 = rgb(T1.color), c2 = p._topic2 ? rgb(TOPICS[p._topic2].color) : p._topic === "unclassified" ? rgb(T1.tint) : null;
  const cx = clamp(Math.round(s.complexity || 3), 1, 5), cn = clamp(Math.round(s.connectivity || Math.min(5, 1 + Math.round((NBR.get(p.id) || new Set()).size / 2))), 1, 5), sy = clamp(Math.round(s.symmetry || 3), 1, 5);
  const ct = s.contentType || "", R = rnd(s.seed || "article_" + p.id);
  const cv = document.createElement("canvas"); cv.width = cv.height = S;
  const g = cv.getContext("2d"), C = S / 2;
  const r0 = S * (ct === "casual_fragment" ? .2 : ct === "collection_comparison" ? .2 : .25);
  const [kx, ky] = ct === "exhibition_review" ? [1.2, .86] : ct === "observation_guide" ? [.9, 1.12] : [1, 1];
  const rot = R() * Math.PI * 2;
  const symK = ct === "conceptual_essay" ? 4 : 3 + Math.floor(R() * 4), symA = ct === "conceptual_essay" ? .22 : [0, .015, .03, .05, .08, .11][sy];
  const harm = [2, 3, 4, 5, 6].map(h => ({ h, a: ((5 - sy) / 4 * .14 + .012) / (h * .7) * R(), ph: R() * 6.28 }));
  const rad = th => r0 * (1 + symA * Math.cos(symK * th) + harm.reduce((v, q) => v + q.a * Math.cos(q.h * th + q.ph), 0));
  const pt = (th, k = 1, ox = C, oy = C, rr = rad) => { const r = rr(th) * k, x = Math.cos(th) * r * kx, y = Math.sin(th) * r * ky; return [ox + x * Math.cos(rot) - y * Math.sin(rot), oy + x * Math.sin(rot) + y * Math.cos(rot)]; };
  const shell = (k = 1, ox = C, oy = C, rr = rad) => { g.beginPath(); for (let i = 0; i <= 140; i++) { const [x, y] = pt(i / 140 * 6.2832, k, ox, oy, rr); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); };
  const ink = mix(c1, [24, 28, 48], .55);
  // shadow
  g.save(); g.filter = `blur(${S * .03}px)`; g.fillStyle = "rgba(40,48,90,.16)"; g.beginPath(); g.ellipse(C, C + r0 * 1.25, r0 * 1.05, r0 * .2, 0, 0, 6.29); g.fill(); g.restore();
  // filaments (behind the shell)
  const nF = [0, 3, 5, 8, 12, 17][cn];
  g.lineCap = "round";
  for (let i = 0; i < nF; i++) {
    const th = R() * 6.28, [x0, y0] = pt(th, .92), len = r0 * (.35 + R() * .9), a = Math.atan2(y0 - C, x0 - C) + (R() - .5) * .9;
    const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len, bx = (x0 + x1) / 2 + (R() - .5) * len * .6, by = (y0 + y1) / 2 + (R() - .5) * len * .6;
    g.strokeStyle = css(ink, .45); g.lineWidth = S * (.004 + R() * .004);
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(bx, by, x1, y1); g.stroke();
    g.fillStyle = css(mix(c1, [255, 255, 255], .4), .9); g.beginPath(); g.arc(x1, y1, S * .007, 0, 6.29); g.fill();
  }
  const body = (k, ox, oy, rr = rad) => {
    shell(k, ox, oy, rr);
    const gr = g.createRadialGradient(ox - r0 * k * .35, oy - r0 * k * .42, r0 * k * .05, ox, oy, r0 * k * 1.45);
    gr.addColorStop(0, "rgba(255,255,255,.97)"); gr.addColorStop(.3, css(mix(c1, [255, 255, 255], .45))); gr.addColorStop(.75, css(c1)); gr.addColorStop(1, css(mix(c1, [20, 24, 40], .35)));
    g.fillStyle = gr; g.globalAlpha = .95; g.fill(); g.globalAlpha = 1;
    if (c2) { g.save(); shell(k, ox, oy, rr); g.clip(); const g2 = g.createRadialGradient(ox + r0 * k * .55, oy + r0 * k * .5, 0, ox + r0 * k * .4, oy + r0 * k * .4, r0 * k * 1.1); g2.addColorStop(0, css(c2, .85)); g2.addColorStop(1, css(c2, 0)); g.fillStyle = g2; g.fillRect(0, 0, S, S); g.restore(); }
  };
  // clusters: smaller sub-spores around the main one
  if (ct === "collection_comparison") {
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + R() * .5, d = r0 * (1 + R() * .3); body(.42 + R() * .2, C + Math.cos(a) * d, C + Math.sin(a) * d * .9); }
  }
  body(1, C, C);
  // interior: pores, lattice or rings — denser with complexity
  g.save(); shell(1); g.clip();
  if (ct === "research_note" || ct === "critical_research") {
    const step = r0 / (1.5 + cx * .9); g.translate(C, C); g.rotate(rot + .4);
    for (let k = -2; k <= 2; k += 4) for (let i = -r0 * 1.6; i < r0 * 1.6; i += step) {
      g.strokeStyle = k < 0 ? "rgba(255,255,255,.38)" : css(ink, .14); g.lineWidth = S * .004;
      g.beginPath(); g.moveTo(i + k * .4, -r0 * 1.6); g.lineTo(i + k * .4, r0 * 1.6); g.moveTo(-r0 * 1.6, i + k * .4); g.lineTo(r0 * 1.6, i + k * .4); g.stroke();
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  } else if (ct === "observation_guide") {
    for (let i = 1; i <= 2 + cx; i++) { const k = i / (3 + cx); g.strokeStyle = css(ink, .18); g.lineWidth = S * .005; shell(1.02 - k * .9); g.stroke(); }
  }
  const nP = ct === "casual_fragment" ? cx : [0, 4, 8, 14, 22, 34][cx];
  for (let i = 0; i < nP; i++) {
    const a = R() * 6.28, d = Math.sqrt(R()) * .78, [x, y] = pt(a, d), pr = r0 * (.04 + R() * .09) * (1.15 - cx * .07);
    g.fillStyle = css(mix(c1, [20, 24, 40], .35), .28); g.beginPath(); g.ellipse(x, y, pr, pr * (.7 + R() * .3), R() * 3, 0, 6.29); g.fill();
    g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.ellipse(x - pr * .25, y - pr * .25, pr * .45, pr * .3, R() * 3, 0, 6.29); g.fill();
  }
  g.restore();
  // rim light + edge
  shell(1); const rl = g.createLinearGradient(C - r0, C - r0, C + r0, C + r0); rl.addColorStop(0, "rgba(255,255,255,.95)"); rl.addColorStop(.5, "rgba(255,255,255,.15)"); rl.addColorStop(1, css(ink, .25));
  g.strokeStyle = rl; g.lineWidth = S * .01; g.stroke();
  g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.ellipse(C - r0 * .38, C - r0 * .45, r0 * .2, r0 * .1, -.6, 0, 6.29); g.fill();
  artCache.set(key, cv);
  return cv;
}
const urlCache = new Map();
// <img src>에 쓸 주소: 승인된 이미지 > 그린 표본
function sporeSrc(p) {
  if (p.spore && p.spore.image) return p.spore.image;
  const k = p.id; if (!urlCache.has(k) || !artCache.has(p.id + ":256")) urlCache.set(k, sporeCanvas(p, 256).toDataURL("image/png"));
  return urlCache.get(k);
}
const BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
// 글의 돌 그림: stones.js가 그 돌을 한 번 렌더해서 채워 넣어요(WebGL이 없으면 그린 표본)
const stoneImg = (p, cls = "") => `<img class="stone-img ${cls}" ${hasGL ? `data-stone="${esc(p.id)}" src="${BLANK}"` : `src="${esc(sporeSrc(p))}"`} alt="" draggable="false">`;
const sporeImg = stoneImg;

/* ===================== network (리좀) — 같은 배치를 메인 미리보기와 리좀 페이지가 함께 씀 ===================== */
// node ids: "c:<concept>" and "p:<post id>"
function network() {
  const nodes = [], byId = new Map(), edges = [], seen = new Set();
  const add = n => { byId.set(n.id, n); nodes.push(n); return n; };
  const count = new Map();
  POSTS.forEach(p => p._concepts.forEach(c => count.set(c, (count.get(c) || 0) + 1)));
  const ranked = [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const major = new Set(ranked.slice(0, Math.min(8, Math.max(5, Math.round(ranked.length * .25)))).map(r => r[0]));
  ranked.forEach(([c, n]) => add({ id: "c:" + c, type: "c", label: c, count: n, major: major.has(c) }));
  POSTS.forEach(p => add({ id: "p:" + p.id, type: "p", post: p, no: p._no, concepts: p._concepts, chars: p._chars, tier: p._tier }));
  const link = (a, b, kind) => { if (a === b || !byId.has(a) || !byId.has(b)) return; const k = [a, b].sort().join("|"); if (seen.has(k)) return; seen.add(k); edges.push({ a, b, k, kind }); };
  POSTS.forEach(p => p._concepts.forEach(c => link("p:" + p.id, "c:" + c, "pc")));
  LINKS.forEach(l => link("p:" + l.a, "p:" + l.b, "pp"));
  const nbr = new Map(nodes.map(n => [n.id, new Set()])), edgeOf = new Map();
  edges.forEach(e => { nbr.get(e.a).add(e.b); nbr.get(e.b).add(e.a); edgeOf.set(e.k, e); });
  const G = { nodes, byId, edges, nbr, edgeOf, posts: POSTS, concepts: nodes.filter(n => n.type === "c") };
  place(G); grow(G);
  return G;
}
function place(G) {
  if (typeof d3 === "undefined") return;
  const sim = d3.forceSimulation(G.nodes)
    .force("link", d3.forceLink(G.edges.map(e => ({ source: e.a, target: e.b, kind: e.kind }))).id(n => n.id)
      .distance(l => l.kind === "pp" ? 230 : (l.source.count || l.target.count) === 1 ? 55 : 120)
      .strength(l => l.kind === "pp" ? .25 : (l.source.count || l.target.count) === 1 ? .9 : .3))
    .force("charge", d3.forceManyBody().strength(n => n.type === "c" ? (n.count > 1 ? -320 - n.count * 30 : -60) : -650).distanceMax(700))
    .force("collide", d3.forceCollide(n => n.type === "c" ? (n.count > 1 ? 40 : 22) : (n.tier || 1) >= 4 ? 96 : 52 + (n.tier || 1) * 6).strength(.9))   // 4~5단계는 3D 포자라 자리를 넓게
    .force("x", d3.forceX(0).strength(.03)).force("y", d3.forceY(0).strength(.045))
    .stop();
  for (let i = 0; i < 360; i++) sim.tick();
}
function grow(G) {
  const wav = (R, len) => { const amp = Math.min(22, 4 + len * .07), f1 = 1 + R() * 2, f2 = 2.5 + R() * 3, p1 = R() * 6.28, p2 = R() * 6.28, a2 = .25 + R() * .3;
    return t => amp * Math.sin(t * Math.PI) * (Math.sin(t * f1 * 6.28 + p1) + a2 * Math.sin(t * f2 * 6.28 + p2)); };
  const filament = (R, x, y, ang, len, steps) => { const pts = [[x, y]]; let a = ang; const st = len / steps; for (let i = 0; i < steps; i++) { a += (R() - .5) * .7; x += Math.cos(a) * st; y += Math.sin(a) * st; pts.push([x, y]); } return pts; };
  G.edges.forEach(e => {
    const A = G.byId.get(e.a), B = G.byId.get(e.b), R = rnd(e.k);
    const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, off = wav(R, len);
    const n = clamp(Math.round(len / 7), 10, 60), pts = [];
    for (let i = 0; i <= n; i++) { const tt = i / n, o = off(tt); pts.push([A.x + dx * tt + nx * o, A.y + dy * tt + ny * o]); }
    const br = []; const nb = Math.floor(len / 70 + R() * 2);
    for (let i = 0; i < nb; i++) {
      const at = Math.floor((.15 + R() * .7) * n), [x, y] = pts[at], [x2, y2] = pts[Math.min(n, at + 1)];
      br.push({ at: at / n, pts: filament(R, x, y, Math.atan2(y2 - y, x2 - x) + (R() < .5 ? -1 : 1) * (.5 + R() * .7), 10 + R() * 26, 6) });
    }
    e.pts = pts; e.br = br;
  });
  G.nodes.forEach(nd => { const R = rnd("f" + nd.id), m = nd.type === "c" ? 5 + Math.min(6, nd.count) : 3;
    nd.fil = Array.from({ length: m }, () => filament(R, nd.x, nd.y, R() * 6.28, 14 + R() * (nd.type === "c" ? 46 : 26), 8)); });
}

/* ===================== mouse trace: 지난 2초 동안 지나간 자리에 흰 부스러기가 흩어져요(선은 없음) ===================== */
const TRACE_MS = 2000;
const trace = { pts: [], cv: null, ctx: null, raf: 0, last: null, W: 0, H: 0, dpr: 1 };
function traceInit() {
  if (REDUCE || trace.cv) return;
  const cv = document.createElement("canvas"); cv.id = "trace"; cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv); trace.cv = cv; trace.ctx = cv.getContext("2d");
  const size = () => { trace.dpr = Math.min(2, devicePixelRatio || 1); trace.W = innerWidth; trace.H = innerHeight; cv.width = trace.W * trace.dpr; cv.height = trace.H * trace.dpr; };
  size(); addEventListener("resize", size);
  addEventListener("pointermove", e => {
    const l = trace.last, x = e.clientX, y = e.clientY;
    if (l && Math.hypot(x - l.x, y - l.y) < 7) return;
    const p = { x, y, t: performance.now(), s: hash(x * 7 + "," + y * 13 + "," + trace.pts.length) };
    trace.pts.push(p); trace.last = p;
    if (!trace.raf) trace.raf = requestAnimationFrame(traceLoop);
  }, { passive: true });
  document.addEventListener("pointerleave", () => { trace.last = null; });
}
function traceLoop() {
  trace.raf = 0;
  const now = performance.now(), g = trace.ctx, pts = trace.pts;
  while (pts.length && now - pts[0].t > TRACE_MS) pts.shift();
  g.setTransform(trace.dpr, 0, 0, trace.dpr, 0, 0); g.clearRect(0, 0, trace.W, trace.H);
  // 선은 그리지 않고, 지나간 자리에 흰 부스러기만 흩어져요
  // spores multiplying along it: white dots with a soft transparent halo, drifting outward as they age
  g.lineCap = "butt";
  for (const p of pts) {
    const age = (now - p.t) / TRACE_MS, fade = Math.pow(1 - age, 1.4); let x = p.s;
    const r = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 1000) / 1000; };
    const n = 2 + (p.s % 3) + Math.floor(age * 3);
    for (let j = 0; j < n; j++) {
      const ang = r() * 6.28, dist = 4 + Math.pow(age, .7) * (18 + r() * 38), rad = (1.2 + r() * 2.2) * (1 + age * .7);
      const sx = p.x + Math.cos(ang) * dist, sy = p.y + Math.sin(ang) * dist + age * 6;
      const halo = g.createRadialGradient(sx, sy, 0, sx, sy, rad * 3.2);
      halo.addColorStop(0, `rgba(255,255,255,${fade * .45})`); halo.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = halo; g.beginPath(); g.arc(sx, sy, rad * 3.2, 0, 6.29); g.fill();
      g.fillStyle = `rgba(255,255,255,${fade * .95})`;
      g.beginPath(); g.arc(sx, sy, rad, 0, 6.29); g.fill();
    }
  }
  if (pts.length) trace.raf = requestAnimationFrame(traceLoop);
}

/* ===================== lens cursor ===================== */
/* 커서 = 16px 유리 구슬(링크·버튼 위에선 32px). 굴절·색 번짐은 뺐어요(블러 필터가 매 프레임 다시 계산돼서 무겁고, 없어도 충분해서).
   크기는 shared.css의 --lens */
const LENS_HOVER = "a,button,label,select,summary,[role=button],[data-read],[tabindex]:not([tabindex='-1']),.fb,.cn";
function lensInit() {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches || document.getElementById("lens")) return;
  const lens = document.createElement("div");
  lens.id = "lens"; lens.setAttribute("aria-hidden", "true");
  document.body.append(lens);
  document.documentElement.classList.add("lens-on");
  let x = -100, y = -100, raf = 0, hover = false;
  const place = () => { raf = 0; lens.style.transform = `translate(${x}px,${y}px)`; };
  addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    x = e.clientX; y = e.clientY; document.documentElement.classList.remove("lens-out");
    const t = e.target, h = document.documentElement.classList.contains("stone-hot") || !!(t && t.closest && (t.closest(LENS_HOVER) || (t.style && t.style.cursor === "pointer")));
    if (h !== hover) { hover = h; document.documentElement.classList.toggle("lens-hover", h); }
    if (!raf) raf = requestAnimationFrame(place);
  }, { passive: true });
  addEventListener("pointerdown", () => document.documentElement.classList.add("lens-down"));
  addEventListener("pointerup", () => document.documentElement.classList.remove("lens-down"));
  document.addEventListener("mouseleave", () => document.documentElement.classList.add("lens-out"));
}

/* ===================== 3D stones (모델·물리·그리기는 /stone/stones.js) ===================== */
const hasGL = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } })();
let stonesMod = null;
const stones3d = () => stonesMod || (stonesMod = import("/stone/stones.js"));
// 화면에 붙은 돌 그림 자리(img[data-stone])를 찾아 그 글의 돌을 렌더해 채워요
function hydrateStones() {
  const els = document.querySelectorAll("img[data-stone]:not(.live)"); if (!els.length) return;
  stones3d().then(M => els.forEach(img => {
    const p = BYID.get(img.dataset.stone); if (!p || img.classList.contains("live")) return;
    img.classList.add("live");
    M.thumb(p._stone).then(url => { img.src = url; img.classList.add("on"); }).catch(() => { img.src = sporeSrc(p); img.classList.add("on"); });
  })).catch(() => {});
}
let hydRaf = 0;
if (hasGL) new MutationObserver(() => { if (!hydRaf) hydRaf = requestAnimationFrame(() => { hydRaf = 0; hydrateStones(); }); }).observe(document.documentElement, { childList: true, subtree: true });

/* ===================== nav ===================== */
let navActive = "";
/* 페이지 전환: 대문 ↔ 리좀을 페이드로. 브라우저가 문서 간 View Transition을 지원하면 그걸로(탭 밑줄이 미끄러져 옮겨 감),
   아니면 직접 화면을 흐리게 지운 뒤 넘어가고, 도착한 페이지가 다시 밝아져요. */
const IND = '<span class="nav-ind" aria-hidden="true"></span>';
const VT = "CSSViewTransitionRule" in window;
let going = false;
function go(href, tab) {
  if (going) return; going = true;
  if (VT || REDUCE) { location.href = href; return; }
  if (tab) renderNav(tab);                        // 탭 먼저 바꾸고
  try { sessionStorage.setItem("sp-fade", "1"); } catch {}
  document.documentElement.classList.add("page-out");   // 화면을 지운 뒤
  setTimeout(() => { location.href = href; }, 520);     // 넘어가요
}
addEventListener("pageshow", () => { going = false; document.documentElement.classList.remove("page-out"); });
try { if (sessionStorage.getItem("sp-fade")) { sessionStorage.removeItem("sp-fade"); document.documentElement.classList.add("page-in"); } } catch {}
document.addEventListener("click", e => {
  const a = e.target.closest && e.target.closest("a[data-go]"); if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
  if (a.getAttribute("aria-current")) { e.preventDefault(); return; }
  e.preventDefault(); go(a.getAttribute("href"), a.dataset.go);
});
function renderNav(active) {
  if (active !== undefined) navActive = active;
  const el = $("#nav"); if (!el) return;
  const home = /(^|\.)fluffydough\.xyz$/.test(location.hostname) ? "/" : "/stone/", rz = "/stone/rhizome/";   // fluffydough.xyz에선 돌무더기가 첫 화면(/)
  el.innerHTML = `
    <a class="brand" href="${home}"><span class="brand-mark" aria-hidden="true">${hasGL ? '<canvas class="brand-stone"></canvas>' : ""}</span><span>${esc(t("titleFlat"))}</span></a>
    <nav class="links" aria-label="Main">
      <a href="${home}" data-go="stones" ${navActive === "stones" ? 'aria-current="page"' : ""}>${esc(t("navStones"))}${navActive === "stones" ? IND : ""}</a>
      <a href="${rz}" data-go="rhizome" ${navActive === "rhizome" ? 'aria-current="page"' : ""}>${esc(t("navRhizome"))}${navActive === "rhizome" ? IND : ""}</a>
      <button type="button" data-sp="about">${esc(t("navAbout"))}</button>
    </nav>
    <div class="lang" role="group" aria-label="Language">
      <button type="button" data-sp="lang" data-v="en" aria-pressed="${LANG === "en"}">EN</button><button type="button" data-sp="lang" data-v="ko" aria-pressed="${LANG === "ko"}">KO</button>
    </div>`;
  if (hasGL) requestAnimationFrame(mountLogo);
}
// 로고 돌: 기본 돌 s12를 작게 띄워요(언어를 바꿔 nav를 다시 그리면 새로 붙어요)
const LOGO_STONE = { src: "/stone/media/stones/s12.glb", gem: false, hue: 0, sat: 1 };
function mountLogo() {
  const cv = document.querySelector("#nav .brand-stone:not(.live)"); if (!cv) return;
  cv.classList.add("live");
  stones3d().then(M => M.logo(cv, LOGO_STONE)).catch(() => {});
}

/* ===================== reader (오른쪽 패널) ===================== */
let reader = null, readerId = null;
const readerHooks = { open: [], close: [] };
function ensureReader() {
  if (reader) return reader;
  reader = document.createElement("aside"); reader.id = "reader"; reader.setAttribute("aria-label", "Article");
  document.body.appendChild(reader); return reader;
}
function openReader(id, opts = {}) {
  const p = BYID.get(id); if (!p) return;
  ensureReader(); readerId = id;
  const linked = linkedOf(id), c = catOf(p), tp = topicText(p._topic);
  const min = Math.max(1, Math.round(p._chars / 500));
  reader.innerHTML = `
    <div class="r-top"><span class="mono">${esc(t("article"))} / ${no(p)}</span><button class="pill-btn ghost" data-sp="close-reader">${esc(t("close"))} ×</button></div>
    <div class="r-body">
      <div class="r-head">${stoneImg(p, "r-spore")}<div>
        <h2>${esc(titleOf(p))}</h2>${altTitleOf(p) ? `<p class="r-alt">${esc(altTitleOf(p))}</p>` : ""}
        <p class="r-meta mono"><i class="dot" style="background:${TOPICS[p._topic].color}"></i>${esc(tp[0])}${c ? " · " + esc(catName(c)) : ""} · ${min} ${esc(t("min"))} · ${p._chars.toLocaleString()} ${esc(t("chars"))}${p.date ? " · " + esc(fmtDate(p.date)) : ""}</p>
      </div></div>
      ${(p.tags || []).length ? `<div class="r-tags">${p.tags.map(x => `<span class="tag">${esc(x)}</span>`).join("")}</div>` : ""}
      ${p.image ? `<img class="r-hero" src="${esc(p.image)}" alt="${esc(p.imageAlt || "")}">` : ""}
      <div class="prose" lang="${LANG === "en" && p.bodyEn ? "en" : "ko"}">${rhizomeMd(bodyOf(p))}</div>
      ${linked.length ? `<section class="r-linked"><h3 class="mono">${esc(t("linked"))}</h3>${linked.map(o => `<button data-read="${esc(o.id)}">${stoneImg(o, "mini")}<span>${esc(titleOf(o))}</span></button>`).join("")}</section>` : ""}
      <a class="pill-btn dark r-go" href="/stone/rhizome/#p=${encodeURIComponent(p.id)}">${esc(t("viewInRhizome"))} →</a>
    </div>`;
  reader.classList.add("open"); document.body.classList.add("reading");
  reader.querySelector(".r-body").scrollTop = 0;
  readerHooks.open.forEach(f => f(id, opts));
}
function closeReader() {
  if (!reader || !reader.classList.contains("open")) return;
  reader.classList.remove("open"); document.body.classList.remove("reading");
  const id = readerId; readerId = null; readerHooks.close.forEach(f => f(id));
}

/* ===================== about · toast ===================== */
let about = null;
function openAbout() {
  if (!about) { about = document.createElement("div"); about.id = "about"; about.setAttribute("role", "dialog"); about.setAttribute("aria-modal", "true"); document.body.appendChild(about);
    about.addEventListener("click", e => { if (e.target === about) closeAbout(); }); }
  const n = POSTS.length;
  about.innerHTML = `<div class="about-card">
    <h2>${esc(t("aboutTitle"))}</h2><p>${esc(t("aboutBody"))}</p>
    <dl>${t("legend").map(([a, b]) => `<dt class="mono">${esc(a)}</dt><dd>${esc(b)}</dd>`).join("")}</dl>
    <p class="muted">${esc(src !== "sample" && !n ? t("dataEmpty") : src === "live" ? t("dataLive")(n) : src === "cache" ? t("dataCache")(n) : t("dataSample"))}</p>
    <div class="row"><button class="pill-btn dark" data-sp="refresh">${esc(t("refresh"))}</button><button class="pill-btn" data-sp="close-about">${esc(t("close"))}</button></div>
  </div>`;
  about.classList.add("open");
}
function closeAbout() { if (about) about.classList.remove("open"); }
let toastEl = null, toastT = 0;
function toast(msg) {
  if (!toastEl) { toastEl = document.createElement("div"); toastEl.id = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
  toastEl.textContent = msg; toastEl.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 2600);
}

document.addEventListener("click", e => {
  const b = e.target.closest("[data-sp],[data-read]"); if (!b) return;
  if (b.dataset.read && !b.closest("#labels")) { e.preventDefault(); SP.read(b.dataset.read); return; }
  switch (b.dataset.sp) {
    case "lang": setLang(b.dataset.v); break;
    case "about": openAbout(); break;
    case "close-about": closeAbout(); break;
    case "refresh": refresh(true); break;
    case "close-reader": SP.unread(); break;
  }
});
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (about && about.classList.contains("open")) { closeAbout(); e.stopImmediatePropagation(); }
});

/* ===================== markdown ===================== */
/* rhizome-md:start */
function rhizomeMd(src) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const safeUrl = u => {
    u = String(u || "").trim().replace(/^<([\s\S]*)>$/, "$1");
    const probe = u.replace(/&#x?[0-9a-f]+;?|&colon;?/gi, ":").replace(/[\s\x00-\x1f]/g, "").toLowerCase();
    return /^[a-z][a-z0-9+.-]*:/.test(probe) && !/^(https?|mailto|tel):/.test(probe) ? "" : u;
  };
  const inline = (s, inLink) => {
    const keep = [], put = h => "\u0000" + (keep.push(h) - 1) + "\u0000";
    s = s.replace(inLink ? /\u0000/g : /[\u0000\u0001]/g, "");
    s = s.replace(/\\([\\`*_{}\[\]()#+\-.!~|>])/g, (_, c) => put(esc(c)));
    s = s.replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g, (_, f, c) => put(`<code>${esc(c.replace(/^ ([\s\S]*) $/, "$1"))}</code>`));
    const target = String.raw`\(\s*(<[^>\n]*>|(?:[^\s()]|\([^\s()]*\))+)(?:\s+"([^"]*)")?\s*\)`;
    s = s.replace(new RegExp(String.raw`!\[([^\]]*)\]` + target, "g"), (_, alt, url, title) => {
      const u = safeUrl(url);
      return put(u ? `<img src="${esc(u)}" alt="${esc(alt)}"${title ? ` title="${esc(title)}"` : ""} loading="lazy">` : esc(alt));
    });
    const a = (u, title) => `<a href="${esc(u)}"${title ? ` title="${esc(title)}"` : ""}${/^https?:/i.test(u) ? ' target="_blank" rel="noopener"' : ""}>`;
    if (!inLink) {
      s = s.replace(new RegExp(String.raw`\[((?:[^\[\]]|\[[^\]]*\])+)\]` + target, "g"), (_, text, url, title) => {
        const u = safeUrl(url), t = inline(text.replace(/\u0000(\d+)\u0000/g, (_, i) => "\u0001" + i + "\u0001"), true).replace(/\u0001(\d+)\u0001/g, (_, i) => keep[i]);
        return u ? put(a(u, title) + t + "</a>") : put(t);
      });
      s = s.replace(/<((?:https?:\/\/|mailto:)[^\s<>]+)>/g, (_, u) => put(a(u) + esc(u.replace(/^mailto:/, "")) + "</a>"));
      s = s.replace(/\bhttps?:\/\/[^\s<>\u0000]*[^\s<>\u0000.,:;"')\]!?]/g, u => put(a(u) + esc(u) + "</a>"));
    }
    s = esc(s)
      .replace(/(\*\*\*|___)(?=\S)([\s\S]*?\S)\1/g, "<strong><em>$2</em></strong>")
      .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^\w])__(?=\S)([\s\S]*?\S)__(?!\w)/g, "$1<strong>$2</strong>")
      .replace(/\*(?=[^\s*])([^*]*?[^\s*]|[^\s*])\*/g, "<em>$1</em>")
      .replace(/(^|[^\w])_(?=[^\s_])([^_]*?[^\s_]|[^\s_])_(?!\w)/g, "$1<em>$2</em>")
      .replace(/~~(?=\S)([\s\S]*?\S)~~/g, "<del>$1</del>")
      .replace(/ {2,}\n|\\\n|\n/g, "<br>\n");
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[i]);
  };

  const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)[^`]*$/, HEAD = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/,
    HR = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/, QUOTE = /^ {0,3}>/, LI = /^( *)([-*+]|\d{1,9}[.)])(?:[ \t]+|$)/,
    TSEP = /^ *\|? *:?-+:? *(?:\| *:?-+:? *)*\|? *$/, SETEXT = /^ {0,3}(=+|-+)[ \t]*$/;
  const indentOf = l => l.match(/^ */)[0].length;
  const blank = l => /^\s*$/.test(l);
  const cells = row => {
    const out = []; let cur = "", tick = false;
    row = row.trim().replace(/^\|/, "").replace(/(^|[^\\])\|$/, "$1");
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === "\\" && row[i + 1] === "|") { cur += "|"; i++; continue; }
      if (c === "`") tick = !tick;
      if (c === "|" && !tick) { out.push(cur.trim()); cur = ""; } else cur += c;
    }
    out.push(cur.trim());
    return out;
  };
  const isTable = (ls, i) => ls[i].includes("|") && i + 1 < ls.length && ls[i + 1].includes("-") && TSEP.test(ls[i + 1]) && (ls[i + 1].includes("|") || cells(ls[i]).length > 1);
  const starts = (ls, i) => FENCE.test(ls[i]) || HEAD.test(ls[i]) || HR.test(ls[i]) || QUOTE.test(ls[i]) || LI.test(ls[i]) || isTable(ls, i);

  function list(ls, i) {
    const m0 = ls[i].match(LI), base = m0[1].length, ordered = /\d/.test(m0[2]);
    const items = []; let loose = false;
    while (i < ls.length) {
      const m = ls[i].match(LI);
      if (!m || m[1].length !== base || /\d/.test(m[2]) !== ordered) break;
      const pad = Math.min(m[0].length, base + 6);
      const body = [ls[i].slice(m[0].length)];
      i++;
      while (i < ls.length) {
        const l = ls[i];
        if (blank(l)) {
          let j = i; while (j < ls.length && blank(ls[j])) j++;
          if (j < ls.length && indentOf(ls[j]) > base && !(LI.test(ls[j]) && indentOf(ls[j]) <= base)) { for (; i < j; i++) body.push(""); loose = true; continue; }
          if (j < ls.length && LI.test(ls[j]) && indentOf(ls[j]) === base) loose = true;
          i = j; break;
        }
        if (indentOf(l) > base) { body.push(l.replace(new RegExp(`^ {0,${pad}}`), "")); i++; continue; }
        if (starts(ls, i)) break;
        if (blank(body[body.length - 1])) break;
        body.push(l); i++;
      }
      items.push(body);
      if (i < ls.length && blank(ls[i - 1]) && !(LI.test(ls[i]) && indentOf(ls[i]) === base)) break;
    }
    const start = ordered ? parseInt(m0[2], 10) : 1;
    const html = items.map(body => {
      let pre = "";
      const t = body[0].match(/^\[([ xX])\][ \t]+/);
      if (t) { pre = `<input type="checkbox" disabled${t[1] === " " ? "" : " checked"}> `; body[0] = body[0].slice(t[0].length); }
      return `<li${t ? ' class="task"' : ""}>${pre}${blocks(body, !loose)}</li>`;
    }).join("\n");
    const tag = ordered ? "ol" : "ul";
    return [`<${tag}${ordered && start !== 1 ? ` start="${start}"` : ""}>\n${html}\n</${tag}>`, i];
  }

  function blocks(ls, tight) {
    const out = []; let i = 0;
    while (i < ls.length) {
      const l = ls[i]; let m;
      if (blank(l)) { i++; continue; }
      if ((m = l.match(FENCE))) {
        const close = new RegExp(`^ {0,3}${m[1][0] === "`" ? "`" : "~"}{${m[1].length},}[ \\t]*$`), ind = indentOf(l), code = [];
        for (i++; i < ls.length && !close.test(ls[i]); i++) code.push(ls[i].replace(new RegExp(`^ {0,${ind}}`), ""));
        i++;
        out.push(`<pre><code${m[2] ? ` class="language-${esc(m[2])}"` : ""}>${esc(code.join("\n"))}</code></pre>`);
        continue;
      }
      if ((m = l.match(HEAD))) { const d = Math.min(m[1].length + 1, 6); out.push(`<h${d}>${inline(m[2] || "")}</h${d}>`); i++; continue; }
      if (HR.test(l)) { out.push("<hr>"); i++; continue; }
      if (QUOTE.test(l)) {
        const q = [];
        for (; i < ls.length && !blank(ls[i]) && (QUOTE.test(ls[i]) || !starts(ls, i)); i++) q.push(ls[i].replace(/^ {0,3}> ?/, ""));
        out.push(`<blockquote>\n${blocks(q)}\n</blockquote>`);
        continue;
      }
      if (LI.test(l) && !(LI.exec(l)[0].trim() === l.trim() && blank(ls[i + 1] || ""))) { const [h, j] = list(ls, i); out.push(h); i = j; continue; }
      if (isTable(ls, i)) {
        const head = cells(ls[i]), al = cells(ls[i + 1]).map(c => /^:-+:$/.test(c) ? "center" : /-:$/.test(c) ? "right" : /^:-/.test(c) ? "left" : "");
        const td = (tag, c, k) => `<${tag}${al[k] ? ` style="text-align:${al[k]}"` : ""}>${inline(c)}</${tag}>`;
        const rows = [];
        for (i += 2; i < ls.length && !blank(ls[i]) && ls[i].includes("|"); i++) rows.push(cells(ls[i]));
        out.push(`<div class="table"><table>\n<thead><tr>${head.map((c, k) => td("th", c, k)).join("")}</tr></thead>\n<tbody>\n${rows.map(r => `<tr>${head.map((_, k) => td("td", r[k] || "", k)).join("")}</tr>`).join("\n")}\n</tbody></table></div>`);
        continue;
      }
      const para = [l.trim()];
      for (i++; i < ls.length && !blank(ls[i]); i++) {
        if ((m = ls[i].match(SETEXT))) break;
        if (starts(ls, i) && !(LI.test(ls[i]) && /^\d/.test(ls[i].trim()) && !/^1[.)]/.test(ls[i].trim()))) break;
        para.push(ls[i].trim());
      }
      if (i < ls.length && (m = ls[i].match(SETEXT))) { const d = m[1][0] === "=" ? 2 : 3; out.push(`<h${d}>${inline(para.join("\n"))}</h${d}>`); i++; continue; }
      out.push(tight ? inline(para.join("\n")) : `<p>${inline(para.join("\n"))}</p>`);
    }
    return out.join("\n");
  }

  const lines = String(src ?? "").replace(/\r\n?/g, "\n").replace(/^\t+/gm, t => "    ".repeat(t.length)).split("\n");
  return blocks(lines);
}
/* rhizome-md:end */

/* ===================== exports ===================== */
lensInit();
const ready = Promise.all([document.fonts ? document.fonts.ready : null, load()]).then(() => { traceInit(); });
const SP = window.SP = {
  TEXT, TOPICS, t, get lang() { return LANG; }, setLang, onLang: f => langHooks.push(f), onData: f => dataHooks.push(f),
  ready, get posts() { return POSTS; }, get links() { return LINKS; }, byId: id => BYID.get(id), linkedOf, get src() { return src; }, get data() { return DATA; },
  go, hasGL, stones3d, STONES, titleOf, altTitleOf, summaryOf, bodyOf, no, catOf, catName, topicText, sporeCanvas, sporeSrc, sporeImg, stoneImg, network,
  renderNav, openReader, closeReader, readerHooks, get readerId() { return readerId; }, openAbout, closeAbout, toast, refresh,
  // pages may replace these (e.g. to keep the address in sync)
  read: id => openReader(id), unread: () => closeReader(),
  util: { $, esc, hash, rnd, clamp, fmtDate, plain, REDUCE, rgb, mix, css }, rhizomeMd
};
})();
