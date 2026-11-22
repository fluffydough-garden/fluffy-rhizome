import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { del } from "@vercel/blob";
import { readDb, writeDb, latestVersion, authed, json, unauthorized } from "../lib/store.js";
import { THEMES, EXPERIENCES, PATTERNS, STANCES, MOTIONS, FORMATS, FIELDS, CONFIDENCE_MIN, DNA_VERSION,
  cleanDna, lowConfidence, isComplete, colorRule, stoneImagePrompt, stoneModelPrompt, webMotionOf, MODEL_SPEC, dnaSummary,
  isOurModel, cleanModelStats, modelWarnings, MODEL_MAX_BYTES, MODEL_BUDGET } from "../lib/stone.js";

// 돌 DNA: 전시 리뷰를 읽고 돌의 속성(색·형태·무늬·표면·내포물·움직임)을 정해진 값 중에서 고르고,
// 이미지(정적인 돌, 3D의 참조 이미지)·3D 모델(GLB, 이미지→3D) 프롬프트를 만들어요. 어드민 비밀번호가 필요해요.
//
//  GET  /api/stone?schema=1                       분류체계 (어드민 화면용)
//  POST /api/stone { action: "analyze", id }        저장된 글을 분석 (저장은 안 함)
//  POST /api/stone { action: "analyze", title, body, info }   붙여넣은 원문을 분석 (저장은 안 함)
//  POST /api/stone { action: "prompts", dna }       고친 DNA로 프롬프트만 다시 만들기
//  POST /api/stone { action: "save", id, dna, confirmed }    글에 저장 (confirmed = 편집자가 확인함)
//  POST /api/stone { action: "clear", id }          글의 돌 DNA 지우기 (3D 모델은 그대로)
//  3D 모델(GLB): 브라우저가 /api/stone-upload로 받은 토큰으로 저장소에 바로 올린 뒤
//  POST /api/stone { action: "model-use", id, url, stats }   올린 GLB를 그 글의 '후보'로
//  POST /api/stone { action: "model-approve", id }           후보를 승인 → 웹진이 이 모델을 씀
//  POST /api/stone { action: "model-reject", id }            후보 버리기(파일도 지움)
//  POST /api/stone { action: "model-remove", id }            승인본 내리기(파일도 지움) → 다시 기본 돌

export const config = { maxDuration: 120 };

const client = new Anthropic(); // ANTHROPIC_API_KEY (Vercel 환경변수)
const ID = /^[A-Za-z0-9_-]{1,64}$/;

const keys = o => Object.keys(o);
const field = (values, what) => z.object({
  value: values,
  confidence: z.number().describe("이 판단의 확신도 0~1. 글에 근거가 분명하면 높게, 짐작이면 0.7 미만으로 솔직하게."),
  evidence: z.string().describe(`판단의 근거가 되는 본문 문장을 그대로 짧게 인용(120자 이내). ${what}`)
});
const Dna = z.object({
  primary_theme: field(z.enum(keys(THEMES)), "전시가 무엇에 관한 것인지 드러나는 문장."),
  secondary_theme: field(z.enum(["none", ...keys(THEMES)]), "보조 주제가 없으면 value는 none, evidence는 빈 문자열."),
  experience: field(z.enum(keys(EXPERIENCES)), "관람 방식이 드러나는 문장."),
  interpretive_lens: field(z.enum(keys(PATTERNS)), "글쓴이가 전시를 읽는 관점이 드러나는 문장."),
  critical_stance: field(z.enum(keys(STANCES)), "글쓴이의 태도가 드러나는 문장."),
  argument_count: field(z.number().int(), "핵심 논점들이 드러나는 문장(들). value는 1~5."),
  narrative_direction: field(z.enum(keys(MOTIONS)), "글이 어떻게 전개되는지 드러나는 문장."),
  exhibition_format: field(z.enum(keys(FORMATS)), "작가 수가 드러나는 문장. 알 수 없으면 unknown."),
  arguments: z.array(z.string()).describe("독립적으로 논의되는 핵심 논점들을 한 줄씩(한국어). 개수가 argument_count와 같아야 함."),
  note: z.string().describe("편집자에게 남길 한두 문장(한국어): 애매했던 판단과 그 이유. 없으면 빈 문자열.")
});

const list = (o, f) => Object.entries(o).map(([k, v]) => `- ${k}: ${f(v)}`).join("\n");
const SYSTEM = `너는 미술 웹진 '리좀'의 편집 보조야. 전시 리뷰 한 편을 읽고, 그 글을 '돌' 하나로 나타내기 위한 속성을 고른다.
원칙: 하나의 시각 속성에는 하나의 정보만 대응한다. 색 = 전시의 핵심 주제, 형태 = 관람 경험, 무늬 = 글의 해석 관점, 표면 = 글의 비평 태도, 내포물 = 논점 수, 움직임 = 서술 방향.
반드시 아래에 정의된 값 중에서만 고른다. 새로운 값을 만들지 않는다.

## primary_theme / secondary_theme — 전시가 무엇을 이야기하는가 (매체가 아니라 주제)
${list(THEMES, v => `${v.ko} (${v.keywords})`)}
지배적인 주제는 언제나 하나. 보조 주제는 글에서 실제로 비중 있게 다뤄질 때만 고르고, 아니면 none.

## experience — 관람 경험의 구조 (작가 수와 섞지 않는다)
${list(EXPERIENCES, v => `${v.ko}: ${v.desc}`)}

## interpretive_lens — 전시 자체가 아니라 글쓴이가 그 전시를 바라보는 핵심 관점
${list(PATTERNS, v => `${v.lens}: ${v.desc}`)}

## critical_stance — 작품 점수가 아니라 글이 취한 태도. 글 전체에서 무엇에 더 비중을 두는지로 판단
${list(STANCES, v => `${v.ko}: ${v.desc}`)}
(부정적인 내용이어도 관찰 중심이면 observational, 미학적으로 높게 평가하면서 제도를 비판하면 critical일 수 있다.)

## argument_count — 키워드 수가 아니라, 글에서 독립적으로 논의되는 핵심 주장·관점의 개수 (1~5)

## narrative_direction — 글이 전개되는 방식
${list(MOTIONS, v => v.ko)}

## exhibition_format — 개인전(solo) / 그룹전(group) / 알 수 없음(unknown). 관람 경험과는 별개의 메타데이터

각 항목에는 판단 근거가 되는 본문 문장을 그대로 짧게 인용하고, 확신도를 솔직하게 매긴다. 글에 근거가 약해 짐작한 항목은 확신도를 ${CONFIDENCE_MIN} 미만으로 둔다 — 편집자가 확인한다.
전시 리뷰가 아닌 글(에세이, 메모 등)이라도 같은 기준으로 가장 가까운 값을 고르되 확신도를 낮춘다.`;

async function analyze({ title, body, info }) {
  const user = `## 제목
${title || "(없음)"}
${info ? `\n## 전시 정보\n${info}\n` : ""}
## 본문
${String(body || "").slice(0, 60000)}`;
  const res = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    output_config: { effort: "medium", format: betaZodOutputFormat(Dna) },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [{ role: "user", content: user }]
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) throw Object.assign(new Error("no_result"), { status: 502 });
  const o = res.parsed_output;
  if (o.secondary_theme.value === "none") o.secondary_theme = { value: "", confidence: o.secondary_theme.confidence, evidence: "" };
  return { dna: cleanDna(o), arguments: (o.arguments || []).map(s => String(s).slice(0, 200)).slice(0, 6), note: String(o.note || "").slice(0, 500), model: res.model };
}

const pack = (dna, extra = {}) => ({
  dna, low: lowConfidence(dna), complete: isComplete(dna), summary: dnaSummary(dna),
  color: (r => r && { mode: r.mode, ko: r.ko, primary: r.primary.hex, secondary: r.secondary?.hex || null })(colorRule(dna)),
  imagePrompt: stoneImagePrompt(dna), modelPrompt: stoneModelPrompt(dna), modelSpec: MODEL_SPEC, webMotion: webMotionOf(dna), version: DNA_VERSION, ...extra
});

// 읽고 → 바꾸고 → 그사이 다른 저장이 끼었으면 최신 DB로 다시 (api/spore.js와 같은 방식)
async function mutate(id, fn) {
  let db;
  for (let attempt = 0; ; attempt++) {
    db = await readDb();
    const p = db.posts[id]; if (!p) return { error: "not_found" };
    fn(p);
    if (attempt >= 3 || (await latestVersion()) === (db.version || null)) break;
  }
  await writeDb(db);
  return { stone: db.posts[id].stone || null };
}

export async function GET(req) {
  if (!authed(req)) return unauthorized();
  return json({ themes: THEMES, experiences: EXPERIENCES, patterns: PATTERNS, stances: STANCES, motions: MOTIONS, formats: FORMATS,
    fields: Object.fromEntries(Object.entries(FIELDS).map(([k, f]) => [k, { ko: f.ko, optional: !!f.optional, range: f.range || null }])),
    confidenceMin: CONFIDENCE_MIN, version: DNA_VERSION, ai: !!process.env.ANTHROPIC_API_KEY, modelMaxBytes: MODEL_MAX_BYTES, modelBudget: MODEL_BUDGET });
}

export async function POST(req) {
  if (!authed(req)) return unauthorized();
  let b; try { b = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const action = String(b?.action || ""), id = b?.id ? String(b.id) : "";
  if (id && !ID.test(id)) return json({ error: "bad_id" }, 400);

  if (action === "prompts") return json(pack(cleanDna(b.dna || {})));

  if (action === "analyze") {
    if (!process.env.ANTHROPIC_API_KEY) return json({ error: "no_api_key" }, 503);
    let src = { title: String(b.title || ""), body: String(b.body || ""), info: String(b.info || "").slice(0, 2000) };
    if (id) { const p = (await readDb()).posts[id]; if (!p) return json({ error: "not_found" }, 404); src = { title: p.title || "", body: p.body || "", info: src.info }; }
    if (!src.body.trim()) return json({ error: "empty" }, 400);
    try {
      const r = await analyze(src);
      return json(pack(r.dna, { arguments: r.arguments, note: r.note, model: r.model }));
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) return json({ error: "bad_api_key" }, 503);
      if (e instanceof Anthropic.RateLimitError) return json({ error: "rate_limited" }, 429);
      if (e instanceof Anthropic.APIError) return json({ error: "api_error", status: e.status }, 502);
      if (e.status) return json({ error: e.message }, e.status);
      return json({ error: "no_result" }, 502);   // 응답이 정해진 값을 벗어나는 등
    }
  }

  if (action.startsWith("model-")) {
    if (!id) return json({ error: "bad_id" }, 400);
    if (action === "model-use" && !isOurModel(b.url)) return json({ error: "bad_url" }, 400);
    const garbage = [];
    const r = await mutate(id, p => {
      garbage.length = 0;
      const m = { ...(p.stoneModel || {}) }, now = new Date().toISOString();
      if (action === "model-use") {
        if (m.candidate?.url && m.candidate.url !== m.approved?.url) garbage.push(m.candidate.url);
        const stats = cleanModelStats({ ...(b.stats || {}) });
        m.candidate = { url: b.url, ...stats, warnings: modelWarnings(stats), uploadedAt: now };
      } else if (action === "model-approve") {
        if (!m.candidate) return;
        if (m.approved?.url && m.approved.url !== m.candidate.url) garbage.push(m.approved.url);
        m.approved = { ...m.candidate, approvedAt: now }; delete m.candidate;
      } else if (action === "model-reject") {
        if (m.candidate?.url && m.candidate.url !== m.approved?.url) garbage.push(m.candidate.url);
        delete m.candidate;
      } else if (action === "model-remove") {
        if (m.approved?.url) garbage.push(m.approved.url);
        delete m.approved;
      } else return;
      if (m.candidate || m.approved) p.stoneModel = m; else delete p.stoneModel;
    });
    if (r.error) return json(r, 404);
    if (garbage.length) await del(garbage.filter(isOurModel)).catch(() => {});
    const db = await readDb();
    return json({ stoneModel: db.posts[id]?.stoneModel || null });
  }

  if (action === "save" || action === "clear") {
    if (!id) return json({ error: "bad_id" }, 400);
    const dna = cleanDna(b.dna || {});
    const r = await mutate(id, p => {
      if (action === "clear") { delete p.stone; return; }
      p.stone = {
        dna, version: DNA_VERSION, confirmed: !!b.confirmed, savedAt: new Date().toISOString(),
        analyzedAt: b.analyzedAt || p.stone?.analyzedAt || null, model: String(b.model || p.stone?.model || "").slice(0, 80),
        arguments: Array.isArray(b.arguments) ? b.arguments.map(s => String(s).slice(0, 200)).slice(0, 6) : (p.stone?.arguments || []),
        note: String(b.note ?? p.stone?.note ?? "").slice(0, 500),
        imagePrompt: stoneImagePrompt(dna), modelPrompt: stoneModelPrompt(dna)
      };
    });
    if (r.error) return json(r, 404);
    return json(r.stone ? { stone: r.stone, ...pack(r.stone.dna) } : { stone: null });
  }
  return json({ error: "bad_action" }, 400);
}
