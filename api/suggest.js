import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { readDb, authed, json, unauthorized } from "../lib/store.js";

// 글 하나를 받아 키워드(태그)와 연결할 만한 다른 글을 추천. 저장은 하지 않음 — 어드민에서 골라서 반영.
// POST { id?, title, titleEn, summary, body, tags[] }
//  → { keywords: string[], related: [{ id, title, reason }] }

export const config = { maxDuration: 60 };

const client = new Anthropic(); // ANTHROPIC_API_KEY (Vercel 환경변수)

const Suggestion = z.object({
  keywords: z.array(z.string()).describe("이 글의 핵심 키워드 3~7개. 짧은 명사구, # 없이."),
  related: z.array(z.object({
    id: z.string().describe("후보 목록에 있는 글 id 그대로"),
    reason: z.string().describe("왜 연결되는지 한 문장(한국어, 40자 안팎)")
  })).describe("연결할 만한 글. 관련도가 높은 순서로 최대 6개. 억지 연결은 넣지 않음.")
});

const SYSTEM = `너는 '리좀 웹진'의 편집 보조야. 웹진은 글들을 서로 연결해 리좀(땅속줄기) 같은 그물을 만든다.
새 글이나 고친 글이 주어지면 두 가지를 한다.
1. 키워드: 글의 주제·개념·장소·인물처럼 다른 글과 이어질 수 있는 핵심어를 3~7개 뽑는다. 이미 있는 태그 목록과 같은 뜻이면 그 표기를 그대로 써서 태그가 흩어지지 않게 한다. 글이 쓰인 언어로 쓴다.
2. 연결: 후보 글 목록에서 주제, 개념, 문제의식, 장소, 인물, 방법이 실제로 겹치는 글만 고른다. 단어 하나 겹친다고 연결하지 않는다. 마땅한 글이 없으면 빈 배열을 돌려준다.
후보 목록에 없는 id는 절대 만들지 않는다.`;

const clip = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n) + "…" : s; };

export async function POST(req) {
  if (!authed(req)) return unauthorized();
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: "no_api_key" }, 503);
  let p;
  try { p = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  if (!String(p?.title || "").trim() && !String(p?.body || "").trim()) return json({ error: "empty" }, 400);

  const db = await readDb();
  const others = Object.entries(db.posts).filter(([id]) => id !== p.id);
  const allTags = [...new Set(Object.values(db.posts).flatMap(x => x.tags || []))].slice(0, 300);

  const candidates = others.map(([id, o]) =>
    `- id: ${id}\n  제목: ${clip(o.title, 120)}${o.titleEn ? ` (${clip(o.titleEn, 80)})` : ""}\n  태그: ${(o.tags || []).join(", ") || "없음"}\n  요약/첫 부분: ${clip(o.summary || o.body, 500)}`
  ).join("\n");

  const user = `## 이번 글
제목: ${p.title || ""}${p.titleEn ? ` (${p.titleEn})` : ""}
현재 태그: ${(p.tags || []).join(", ") || "없음"}
요약: ${p.summary || "없음"}
본문:
${String(p.body || "").slice(0, 60000)}

## 웹진에 이미 있는 태그
${allTags.join(", ") || "없음"}

## 연결 후보 글 (${others.length}편)
${candidates || "없음"}`;

  try {
    const res = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      output_config: { effort: "low", format: betaZodOutputFormat(Suggestion) },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [{ role: "user", content: user }]
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) return json({ error: "no_result" }, 502);

    const known = new Map(others);
    const seen = new Set();
    const related = res.parsed_output.related
      .filter(r => known.has(r.id) && !seen.has(r.id) && seen.add(r.id))
      .slice(0, 6)
      .map(r => ({ id: r.id, title: known.get(r.id).title || "", reason: r.reason }));
    const keywords = [...new Set(res.parsed_output.keywords.map(k => k.trim().replace(/^#/, "")).filter(Boolean))].slice(0, 8);
    return json({ keywords, related });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return json({ error: "bad_api_key" }, 503);
    if (e instanceof Anthropic.RateLimitError) return json({ error: "rate_limited" }, 429);
    if (e instanceof Anthropic.APIError) return json({ error: "api_error", status: e.status }, 502);
    throw e;
  }
}
