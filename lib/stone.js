// 돌 DNA: 전시 리뷰 한 편을 돌의 6가지 속성으로 나타내는 분류체계와 프롬프트 규칙.
// 하나의 시각 속성에는 하나의 정보만: 색 = 주제 · 형태 = 관람 경험 · 무늬 = 해석 관점 · 표면 = 비평 태도 · 내포물 = 논점 수 · 움직임 = 서술 방향.
// AI는 새 값을 만들지 않고 여기 정의된 값 중에서만 골라요(어드민 '돌 DNA', api/stone.js, 공개 API가 모두 이 정의를 씀).

export const DNA_VERSION = "stone-v1";
export const CONFIDENCE_MIN = 0.7;   // 이보다 확신도가 낮은 항목은 자동 확정하지 않고 '확인 필요'로 둠

// 2. Color — 전시의 핵심 주제
export const THEMES = {
  ecology:     { ko: "생태 · 자연 · 비인간", en: "Ecology", hex: "#6b7c5c", keywords: "환경, 기후, 동물, 식물, 공생, 포스트휴머니즘", mineral: "moss green" },
  body:        { ko: "신체 · 젠더 · 정체성", en: "Body",    hex: "#ad7a80", keywords: "몸, 감각, 여성주의, 자아, 타자성",            mineral: "dusty rose pink" },
  technology:  { ko: "기술 · 매체 · 가상",   en: "Technology", hex: "#6d86a0", keywords: "AI, 알고리즘, 데이터, 디지털 이미지, 뉴미디어", mineral: "steel blue" },
  society:     { ko: "사회 · 정치 · 권력",   en: "Society", hex: "#9b5e4f", keywords: "제도, 노동, 계급, 식민주의, 저항, 공공성",    mineral: "rust red-brown" },
  memory:      { ko: "역사 · 기억 · 시간",   en: "Memory",  hex: "#a08866", keywords: "아카이브, 유산, 개인사, 집단기억, 과거의 재해석", mineral: "ochre sandstone" },
  philosophy:  { ko: "철학 · 사유 · 초월",   en: "Thought", hex: "#8b7a9a", keywords: "존재론, 종교, 신화, 영성, 형이상학",          mineral: "muted lavender violet" },
  space:       { ko: "도시 · 공간 · 장소",   en: "Space",   hex: "#858a84", keywords: "건축, 도시, 지역성, 장소특정성, 이동과 경계",  mineral: "cool concrete grey" },
  material:    { ko: "형식 · 물질 · 추상",   en: "Matter",  hex: "#c7bfae", keywords: "재료 실험, 조형 언어, 매체 자체의 탐구, 추상성", mineral: "pale bone beige" }
};

// 3. Shape — 관람 경험의 구조
export const EXPERIENCES = {
  observation:   { ko: "관찰형", shape: "둥근 단일 원석",        desc: "개별 작품을 마주하고 감상하는 방식",                 prompt: "a single rounded, water-worn monolithic stone" },
  reading:       { ko: "열람형", shape: "얇고 넓은 판상석",      desc: "문서, 이미지, 아카이브를 읽고 비교하는 방식",        prompt: "a thin, broad, flat tabular slab of stone" },
  immersive:     { ko: "몰입형", shape: "속이 빈 지오드",        desc: "영상, 사운드, 빛, 설치물에 둘러싸이는 경험",         prompt: "a split-open hollow geode with a crystal-lined inner cavity" },
  juxtaposition: { ko: "병치형", shape: "여러 돌이 결합한 응집석", desc: "다양한 작품과 관점을 교차해 살펴보는 경험",          prompt: "a conglomerate of several distinct stones fused together" },
  participatory: { ko: "참여형", shape: "구멍과 통로가 있는 다공석", desc: "관객의 선택·행위·상호작용이 중요한 전시",          prompt: "a porous stone pierced by holes, tunnels and passages" },
  site:          { ko: "장소형", shape: "바닥에서 솟은 듯한 기반암", desc: "전시 장소, 주변 환경, 공간 이동이 중요한 경험",    prompt: "a fragment of bedrock outcrop that seems to rise from the ground, with a broken flat base" }
};

// 4. Pattern — 리뷰의 해석 관점 (실제 광물·암석에 있는 무늬만)
export const PATTERNS = {
  repetition: { ko: "동심원", lens: "반복과 순환",     desc: "반복, 의례, 순환적 시간, 재생산, 되풀이되는 구조",      prompt: "concentric agate-like banding" },
  relation:   { ko: "수지상 무늬", lens: "관계와 연결", desc: "네트워크, 상호의존성, 다중성, 공생, 리좀적 연결",     prompt: "branching dendritic mineral patterns like dendritic agate" },
  trace:      { ko: "화석 각인", lens: "흔적과 부재",   desc: "사라진 존재, 상실, 잔존, 기억의 재발견",               prompt: "fossil-like organic imprints pressed into the surface" },
  strata:     { ko: "평행한 지층", lens: "역사·계보·시간의 축적", desc: "겹겹의 얇은 선과 층리",                    prompt: "fine parallel sedimentary strata and bedding lines" },
  fault:      { ko: "갈라진 단층", lens: "갈등·균열·불일치", desc: "서로 어긋난 절리와 균열",                         prompt: "offset fault lines, joints and fractures that do not meet" },
  vein:       { ko: "흐르는 광맥", lens: "이동·전환·변형", desc: "돌 내부를 가로지르는 곡선",                        prompt: "flowing mineral veins curving through the stone" },
  lattice:    { ko: "결정 격자", lens: "규칙·시스템·제도", desc: "규칙적인 다각형 결정 배열",                         prompt: "a regular polygonal crystal lattice" }
};

// 5. Texture — 비평적 태도 (작품 점수가 아니라 글이 취한 태도)
export const STANCES = {
  observational: { ko: "관찰적·기술적", surface: "부드러운 무광",       desc: "평가보다 전시의 구성과 경험을 전달",       prompt: "a soft matte, honed surface" },
  affirmative:   { ko: "긍정적·확장적", surface: "광택이 있는 연마면",   desc: "전시의 성취와 가능성을 중심으로 논의",     prompt: "a glossy, mirror-polished surface" },
  critical:      { ko: "비판적·논쟁적", surface: "거칠고 깎인 표면",     desc: "문제점, 모순, 한계를 적극적으로 지적",     prompt: "a rough, chiseled, faceted surface with tool marks" },
  speculative:   { ko: "유보적·사변적", surface: "서리 낀 반투명 표면",  desc: "결론을 열어두고 질문을 남김",             prompt: "a frosted, semi-translucent surface" }
};

// 6. Inclusion — 독립적으로 논의되는 핵심 논점의 수 (키워드 수가 아님)
export const inclusionOf = n => n >= 3
  ? { ko: "여러 내포물이 모인 복합 구조", prompt: "a complex cluster of several different mineral inclusions" }
  : n === 2 ? { ko: "두 종류의 광물 집합", prompt: "two distinct kinds of mineral inclusions" }
  : { ko: "드문드문한 작은 결정", prompt: "a few sparse small crystal inclusions" };

// 6. Motion — 서술 방향 = 웹 3D 뷰어에서 돌을 보여 주는 카메라 움직임 (모델 자체는 움직이지 않음, GLB엔 애니메이션을 넣지 않음)
//    web: 웹진 3D 뷰어가 쓸 값 — 공개 API에 함께 나가요
export const MOTIONS = {
  deep_dive:  { ko: "하나의 작품을 깊이 해부",          camera: "느린 카메라 접근",        web: { camera: "dolly-in",   speed: .6 } },
  expansion:  { ko: "개별 작품에서 넓은 맥락으로 확장", camera: "느린 카메라 후퇴",        web: { camera: "dolly-out",  speed: .6 } },
  comparison: { ko: "두 관점이나 대상을 비교",          camera: "좌우 이동",               web: { camera: "truck",      speed: .5 } },
  tracing:    { ko: "과거의 맥락을 따라 추적",          camera: "층리를 따라 수평 이동",   web: { camera: "pan-strata", speed: .4 } },
  inquiry:    { ko: "하나의 질문을 여러 각도에서 탐구", camera: "작은 각도의 느린 오비트", web: { camera: "orbit-20",   speed: .5 } }
};

// 별도 메타데이터: 개인전/그룹전 (관람 방식과 섞지 않음)
export const FORMATS = { solo: { ko: "개인전" }, group: { ko: "그룹전" }, unknown: { ko: "알 수 없음" } };

// 분석 항목 = 저장되는 값. 각 항목은 { value, confidence(0~1), evidence(본문 인용) }
export const FIELDS = {
  primary_theme:       { ko: "색 · 주제",        options: THEMES },
  secondary_theme:     { ko: "보조 색 · 보조 주제", options: THEMES, optional: true },
  experience:          { ko: "형태 · 관람 경험",  options: EXPERIENCES },
  interpretive_lens:   { ko: "무늬 · 해석 관점",  options: PATTERNS },
  critical_stance:     { ko: "표면 · 비평 태도",  options: STANCES },
  argument_count:      { ko: "내포물 · 논점 수",  range: [1, 5] },
  narrative_direction: { ko: "움직임 · 서술 방향", options: MOTIONS },
  exhibition_format:   { ko: "개인전/그룹전",     options: FORMATS }
};

// 색 규칙: 지배색은 언제나 하나. 두 주제 = 80/20, 여러 논점이 얽히면 보조색은 광맥·결정에만
export function colorRule(d) {
  const t1 = THEMES[val(d.primary_theme)], t2 = THEMES[val(d.secondary_theme)];
  if (!t1) return null;
  if (!t2 || t2 === t1) return { mode: "single", ko: "단일 주제: 하나의 색이 돌 전체를 지배", primary: t1, secondary: null };
  if ((val(d.argument_count) || 1) >= 3) return { mode: "veins", ko: `여러 주제: ${t1.ko.split(" · ")[0]} 돌 안에 ${t2.ko.split(" · ")[0]} 광맥·결정`, primary: t1, secondary: t2 };
  return { mode: "blend", ko: `두 주제: ${t1.ko.split(" · ")[0]} 80% · ${t2.ko.split(" · ")[0]} 20%`, primary: t1, secondary: t2 };
}

const val = f => f && typeof f === "object" ? f.value : f;
const num = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(v) || lo)));
const conf = v => Math.max(0, Math.min(1, Number(v) || 0));
const str = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

// 저장 전에 정리: 모르는 값은 버리고, 확신도·근거는 길이를 맞춤
export function cleanDna(d = {}) {
  const out = {};
  for (const [k, f] of Object.entries(FIELDS)) {
    const raw = d[k]; if (raw === undefined) continue;
    const o = raw && typeof raw === "object" ? raw : { value: raw };
    let v = o.value;
    if (f.range) v = num(v, f.range[0], f.range[1]);
    else if (!f.options[v]) { if (f.optional || k === "exhibition_format") v = f.optional ? "" : "unknown"; else continue; }
    out[k] = { value: v, confidence: o.confidence === undefined ? 1 : conf(o.confidence), evidence: str(o.evidence, 400) };
  }
  if (out.secondary_theme && out.primary_theme && out.secondary_theme.value === out.primary_theme.value) out.secondary_theme.value = "";
  return out;
}
// 확신도가 낮은 항목들 (편집자가 확인해야 함)
export const lowConfidence = d => Object.keys(FIELDS).filter(k => d[k] && d[k].value !== "" && d[k].confidence < CONFIDENCE_MIN);
export const isComplete = d => ["primary_theme", "experience", "interpretive_lens", "critical_stance", "argument_count", "narrative_direction"].every(k => d[k] && d[k].value !== "" && d[k].value !== undefined);

/* ---------- 이미지 생성용 프롬프트 ---------- */
export function stoneImagePrompt(d) {
  const rule = colorRule(d) || { primary: THEMES.material, secondary: null, mode: "single" };
  const ex = EXPERIENCES[val(d.experience)] || EXPERIENCES.observation;
  const pa = PATTERNS[val(d.interpretive_lens)] || PATTERNS.strata;
  const st = STANCES[val(d.critical_stance)] || STANCES.observational;
  const inc = inclusionOf(val(d.argument_count) || 1);
  const secondary = !rule.secondary ? "none — a single dominant mineral color throughout"
    : rule.mode === "veins" ? `${rule.secondary.mineral} (${rule.secondary.hex}), appearing only as thin veins and small crystals inside the dominant color`
    : `${rule.secondary.mineral} (${rule.secondary.hex}), about 20% of the stone against 80% dominant color`;
  return `Create a single geological specimen that functions as a semantic portrait of an art exhibition review.

STONE ATTRIBUTES
- Dominant mineral color: ${rule.primary.mineral} (${rule.primary.hex})
- Secondary mineral accent: ${secondary}
- Geological silhouette: ${ex.prompt}
- Primary internal pattern: ${pa.prompt}
- Surface finish: ${st.prompt}
- Mineral inclusions: ${inc.prompt}

ART DIRECTION
A fictional but geologically plausible mineral specimen.
Highly detailed geological textures, subtle imperfections, natural crystallization, mineral veins and sedimentary formations.

The specimen should feel ancient, tactile and physically real, as if recovered from an unknown geological archive.

Isolated single object, three-quarter view, centered composition, the whole specimen fully in frame with nothing cropped, consistent scale, plain neutral studio background, soft even lighting with no harsh highlights, no cast shadow on the background — this image will be used as the reference for a 3D model.

Do not introduce any visual features that conflict with the defined attributes.

No typography, symbols, decorative objects, plants, people, surreal landscapes or exaggerated fantasy crystals.`;
}

/* ---------- 3D 모델(GLB)용 프롬프트 ----------
   위 이미지를 참조 이미지로 넣는 이미지→3D(Higgsfield 3D · Meshy · Tripo 등). 텍스트→3D에도 그대로 쓸 수 있게 속성도 다시 적어요.
   웹진에 바로 넣을 GLB 기준: 한 덩어리 메시 · PBR 텍스처 · 가벼운 삼각형 수 · 가운데 원점 · 애니메이션 없음 */
export const MODEL_SPEC = { triangles: "about 40,000", textures: "2048 px", format: "GLB (glTF 2.0)" };
export function stoneModelPrompt(d) {
  const rule = colorRule(d) || { primary: THEMES.material, secondary: null, mode: "single" };
  const ex = EXPERIENCES[val(d.experience)] || EXPERIENCES.observation;
  const pa = PATTERNS[val(d.interpretive_lens)] || PATTERNS.strata;
  const st = STANCES[val(d.critical_stance)] || STANCES.observational;
  const inc = inclusionOf(val(d.argument_count) || 1);
  const secondary = !rule.secondary ? "" : rule.mode === "veins"
    ? ` with thin ${rule.secondary.mineral} (${rule.secondary.hex}) veins and small crystals inside`
    : ` with about 20% ${rule.secondary.mineral} (${rule.secondary.hex}) zones`;
  const hollow = val(d.experience) === "immersive" ? "\n- The geode cavity is real geometry: an open, concave crystal-lined interior, not a painted texture."
    : val(d.experience) === "participatory" ? "\n- The holes and passages are real geometry that light can pass through, not painted on."
    : val(d.experience) === "juxtaposition" ? "\n- The fused stones are one connected watertight mesh, with no separate floating pieces."
    : val(d.experience) === "site" ? "\n- The broken base is a flat, closed surface so the outcrop can stand on its own."
    : "";
  return `Generate a game-ready 3D model of the stone in the reference image, for real-time display on a website.

MATCH THE REFERENCE
Reproduce the exact silhouette, proportions, dominant colors, geological patterns, mineral distribution and surface finish of the reference image. Infer the unseen back and underside as the same stone continuing naturally — same material, same pattern, no new features.

STONE (for reference and text-to-3D)
- Silhouette: ${ex.prompt}
- Mineral color: ${rule.primary.mineral} (${rule.primary.hex})${secondary}
- Pattern: ${pa.prompt}, carried consistently around the whole stone
- Surface: ${st.prompt}
- Inclusions: ${inc.prompt}

GEOMETRY
- One single, watertight, manifold mesh; no floating fragments, no ground plane, no pedestal, no background.${hollow}
- Clean, evenly distributed triangles, ${MODEL_SPEC.triangles} in total; fine detail goes into the normal map, not into extra polygons.
- Model centered at the origin, resting upright, scaled so the longest side is 1 unit. No animation, no rig.

MATERIAL & TEXTURES
- PBR metallic-roughness: base color, normal, and roughness/metallic maps at ${MODEL_SPEC.textures}, one UV set without visible seams or stretching.
- Base color must be pure albedo: no baked lighting, shadows, highlights or ambient occlusion.
- Roughness follows the surface finish: ${val(d.critical_stance) === "affirmative" ? "low roughness, glossy" : val(d.critical_stance) === "speculative" ? "medium roughness with a frosted, slightly translucent look" : val(d.critical_stance) === "critical" ? "high roughness, raw and chiseled" : "medium-high roughness, soft matte"}.

OUTPUT
${MODEL_SPEC.format}, a single file.

Do not add text, symbols, plants, people, extra objects or fantasy crystals. Do not change the stone's colors or patterns.`;
}
// 웹 3D 뷰어용 카메라 움직임 (모델이 아니라 웹진에서 쓰는 값)
export const webMotionOf = d => (MOTIONS[val(d.narrative_direction)] || MOTIONS.inquiry).web;

// 한 줄 요약 (예: "기술 · 몰입형 · 동심원 · 비판적")
export function dnaSummary(d) {
  const t = THEMES[val(d.primary_theme)], e = EXPERIENCES[val(d.experience)], p = PATTERNS[val(d.interpretive_lens)], s = STANCES[val(d.critical_stance)];
  return [t && t.ko.split(" · ")[0], e && e.ko, p && p.lens, s && s.ko.split("·")[0]].filter(Boolean).join(" · ");
}
// 공개 API·n8n용: 확신도·근거를 뺀 값만
export const dnaValues = d => Object.fromEntries(Object.keys(FIELDS).filter(k => d[k]).map(k => [k, d[k].value]));
