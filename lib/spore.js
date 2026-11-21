// 포자 이미지: 글마다 하나씩 만드는 3D 포자 표본의 속성 · 프롬프트 · 작업(job) 모양.
// 어드민(/admin 포자 화면), 자동화(n8n → Higgsfield), 공개 API가 모두 이 정의를 씀.

export const PROMPT_VERSION = "spore-v1";

// A. 기본 실루엣 = 글의 유형
export const CONTENT_TYPES = {
  exhibition_review:     { ko: "전시 후기",      en: "Exhibition Note",  form: "an irregular ellipsoid spore with a semi-translucent shell and only a few sparse filaments" },
  casual_fragment:       { ko: "짧은 기록",      en: "Casual Fragment",  form: "a small, simple spore with a smooth shell, low surface density and short stubby protrusions" },
  research_note:         { ko: "세미나·스터디",  en: "Research Spore",   form: "an organized reticulate spore with a dense interior and fine, regular folds" },
  experiential_essay:    { ko: "경험적 에세이",  en: "Experiential",     form: "an irregular spherical spore with a soft, open shell and freely growing protrusions" },
  observation_guide:     { ko: "관찰·가이드",    en: "Guide",            form: "a regularly segmented spore with repeating annular ridges" },
  collection_comparison: { ko: "수집·비교",      en: "Collection",       form: "a cluster spore: many small sub-spores gathered into one aggregate body" },
  conceptual_essay:      { ko: "개념적 에세이",  en: "Conceptual",       form: "a multi-axial branching spore extending from a central core in several directions" },
  critical_research:     { ko: "비평·연구",      en: "Critical",         form: "a reticulate spore where a woven, regular lattice crosses irregular hyphae" }
};

// D. 표면 패턴과 색 = 글의 핵심 의제 (장르와 따로)
export const TOPICS = {
  experience_place:     { ko: "경험·관람·장소", palette: ["moss green", "pale sage"],   surface: "a soft, translucent outer membrane" },
  memory_time:          { ko: "기억·기록·시간", palette: ["amber", "honey"],            surface: "overlapping membranes with faint afterimage-like layers" },
  media_technology:     { ko: "매체·물질·기술", palette: ["silver blue", "slate"],      surface: "a glassy shell with a micro-lattice" },
  body_relation:        { ko: "신체·관계·공존", palette: ["dusty coral", "blush"],      surface: "organic fibers and soft junctions" },
  institution_critique: { ko: "제도·비평·권력", palette: ["muted violet", "plum"],      surface: "a hard shell with fine cracks" }
};

// imageStatus 흐름: none → pending(생성 요청) → generating(n8n이 가져감) → review(이미지 도착, 검토 대기) → approved
//                   어느 단계든 실패하면 failed. 재생성하면 다시 pending.
export const STATUSES = {
  none: "없음", pending: "생성 대기", generating: "생성 중", review: "검토", approved: "승인됨", failed: "실패"
};

// 공통 아트디렉션 — 모든 포자가 하나의 표본집처럼 보이도록
export const ART_DIRECTION = [
  "a single abstract microscopic spore specimen, closer to an unknown spore under a microscope than to a real mushroom",
  "3/4 view camera angle",
  "soft studio lighting with a thin rim light",
  "semi-translucent organic shell material with local texture variation",
  "centered composition, the spore fully separated from the background",
  "plain neutral background",
  "consistent rendering style across the whole series"
];
export const NEGATIVE = "no text, no letters, no literal objects (no clocks, no yarn, no books), no mushrooms, no faces, no hands, no frame";

const clamp15 = v => Math.max(1, Math.min(5, Math.round(Number(v) || 3)));
const str = (v, n = 200) => String(v ?? "").trim().slice(0, n);
export const plainLength = md => String(md || "")
  .replace(/```[\s\S]*?```/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
  .replace(/[#>*_`~|-]+/g, " ").replace(/\s+/g, " ").trim().length;
export const readingLength = chars => chars >= 5000 ? "long" : chars >= 1500 ? "medium" : "short";

// 글에서 기본값 추천 (사람이 고르기 전 출발점). complexity·symmetry는 일부러 가운데(3)로 둠 — 큐레이션 대상.
export function defaultSpore(id, post = {}) {
  const links = (post.links || []).length;
  return {
    contentType: "exhibition_review",
    primaryTopic: "experience_place",
    secondaryTopic: "",
    complexity: 3,
    connectivity: Math.max(1, Math.min(5, 1 + Math.round(links / 2))),
    symmetry: 3,
    morphology: "",
    palette: [],
    seed: `article_${id}`,
    imageStatus: "none"
  };
}

// 저장 전에 값 정리 (모르는 키는 버리고, 범위를 맞춤). 이미지·상태 필드는 그대로 둠.
export function cleanParams(p = {}) {
  const out = {};
  if (p.contentType !== undefined) out.contentType = CONTENT_TYPES[p.contentType] ? p.contentType : "exhibition_review";
  if (p.primaryTopic !== undefined) out.primaryTopic = TOPICS[p.primaryTopic] ? p.primaryTopic : "experience_place";
  if (p.secondaryTopic !== undefined) out.secondaryTopic = TOPICS[p.secondaryTopic] ? p.secondaryTopic : "";
  for (const k of ["complexity", "connectivity", "symmetry"]) if (p[k] !== undefined) out[k] = clamp15(p[k]);
  if (p.morphology !== undefined) out.morphology = str(p.morphology, 160);
  if (p.palette !== undefined) out.palette = (Array.isArray(p.palette) ? p.palette : String(p.palette).split(",")).map(x => str(x, 40)).filter(Boolean).slice(0, 4);
  if (p.seed !== undefined) out.seed = str(p.seed, 80);
  return out;
}

export const paletteOf = s => s.palette && s.palette.length ? s.palette
  : [TOPICS[s.primaryTopic]?.palette[0], TOPICS[s.secondaryTopic]?.palette[0] || TOPICS[s.primaryTopic]?.palette[1]].filter(Boolean);

const level = (v, words) => words[clamp15(v) - 1];

// 속성 → 이미지 프롬프트 (영어). 의미를 설명하지 않고 형식적 특징만 씀.
export function sporePrompt(s) {
  const ct = CONTENT_TYPES[s.contentType] || CONTENT_TYPES.exhibition_review;
  const t1 = TOPICS[s.primaryTopic] || TOPICS.experience_place, t2 = TOPICS[s.secondaryTopic];
  const parts = [
    `${s.morphology ? s.morphology + ", " : ""}${ct.form}`,
    `surface: ${t1.surface}${t2 ? `, blending into ${t2.surface} in places` : ""}`,
    `colors: ${paletteOf(s).join(" and ")}`,
    `internal structure: ${level(s.complexity, ["very simple, almost empty", "simple with a few chambers", "moderate folds and pores", "dense folds, lattice and pores", "extremely dense, intricate folds, lattice and pores"])}`,
    `filaments: ${level(s.connectivity, ["almost none", "two or three short filaments", "several filaments", "many thread-like filaments", "a rich halo of long branching filaments"])}`,
    `symmetry: ${level(s.symmetry, ["strongly asymmetric, freely grown", "mostly asymmetric", "loosely balanced", "mostly regular", "highly regular, radially repeating"])}`,
    ...ART_DIRECTION
  ];
  return parts.join("; ") + ".";
}

// n8n이 받아 가는 작업 하나
export function sporeJob(id, post, s) {
  const chars = plainLength(post.body);
  return {
    articleId: id,
    title: post.title || "",
    titleEn: post.titleEn || "",
    summary: post.summary || "",
    tags: post.tags || [],
    excerpt: String(post.body || "").replace(/\s+/g, " ").slice(0, 1200),
    chars,
    readingLength: readingLength(chars),
    contentType: s.contentType, primaryTopic: s.primaryTopic, secondaryTopic: s.secondaryTopic || null,
    complexity: s.complexity, connectivity: s.connectivity, symmetry: s.symmetry,
    morphology: s.morphology || "", palette: paletteOf(s), seed: s.seed,
    promptVersion: PROMPT_VERSION,
    prompt: sporePrompt(s),
    negativePrompt: NEGATIVE,
    generation: s.generation || 0,
    imageStatus: s.imageStatus,
    requestedAt: s.requestedAt || null
  };
}

export const isOurSpore = url => {
  try { const u = new URL(url); return u.hostname.endsWith(".blob.vercel-storage.com") && u.pathname.startsWith("/spores/"); }
  catch { return false; }
};
