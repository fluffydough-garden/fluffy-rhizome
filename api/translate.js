import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { authed, json, unauthorized } from "../lib/store.js";

// 어드민 ‘번역’ 버튼. 글의 제목·요약·본문을 한국어 ↔ 영어로 옮겨서 돌려줌. 저장은 하지 않음 — 어드민 칸에 채워 넣고, 고친 뒤 저장.
// POST { to: "en" | "ko", title, summary, body }
//  → { title, summary, body }

export const config = { maxDuration: 300 };   // 긴 본문도 한 번에 (1만 자면 1~2분)

const client = new Anthropic(); // ANTHROPIC_API_KEY (Vercel 환경변수)

const Translation = z.object({
  title: z.string().describe("번역한 제목. 원문 제목이 비어 있으면 빈 문자열."),
  summary: z.string().describe("번역한 요약. 원문 요약이 비어 있으면 빈 문자열."),
  body: z.string().describe("번역한 본문(마크다운). 원문 본문이 비어 있으면 빈 문자열.")
});

const SYSTEM = {
  en: `You translate articles for "Soft Invasion" (부드러운 침범), a Korean art and culture webzine, from Korean into English.
Write the English a thoughtful editor would publish: natural, precise, and close to the author's voice and register — essayistic where the original is essayistic, plain where it is plain. Do not summarise, add, explain or soften anything.
Keep the Markdown exactly: headings, emphasis, lists, block quotes, tables, footnote markers, line breaks between paragraphs, and every link and image URL unchanged (translate only link text and image alt text). Leave code untouched.
Names of people, places, institutions, exhibitions and works: use the established English name if one exists; otherwise romanise (Revised Romanisation) and keep the original in parentheses the first time only if it helps the reader. Keep text that is already in English or another language as it is.
The title should read as an English title, not a word-for-word gloss.`,
  ko: `너는 한국 예술·문화 웹진 ‘부드러운 침범(Soft Invasion)’의 글을 영어에서 한국어로 옮긴다.
편집자가 그대로 발행할 수 있는 자연스럽고 정확한 한국어로 쓰고, 글쓴이의 목소리와 문체(에세이는 에세이답게, 건조한 글은 건조하게)를 지킨다. 요약하거나 덧붙이거나 설명하거나 누그러뜨리지 않는다.
마크다운을 그대로 지킨다: 소제목, 강조, 목록, 인용, 표, 각주 표시, 문단 사이 줄바꿈, 모든 링크·이미지 주소(링크 글자와 이미지 설명만 옮김). 코드는 건드리지 않는다.
사람·장소·기관·전시·작품 이름은 국내에서 널리 쓰는 표기를 따르고, 없으면 외래어 표기법에 맞춰 쓰되 처음 한 번만 필요하면 괄호에 원어를 적는다. 이미 한국어이거나 다른 언어인 부분은 그대로 둔다.
제목은 한국어 제목답게 옮긴다.`
};

export async function POST(req) {
  if (!authed(req)) return unauthorized();
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: "no_api_key" }, 503);
  let p;
  try { p = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const to = p?.to === "ko" ? "ko" : "en";
  const title = String(p?.title || ""), summary = String(p?.summary || ""), body = String(p?.body || "");
  if (!title.trim() && !summary.trim() && !body.trim()) return json({ error: "empty" }, 400);
  if (body.length > 40000) return json({ error: "too_long" }, 413);   // 글 한 편(4만 자)까지 — 그 이상은 나눠서

  const user = `Translate the three parts below. Return each part translated; return an empty string for any part that is empty.

<title>
${title}
</title>

<summary>
${summary}
</summary>

<body>
${body}
</body>`;

  try {
    const res = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 20000,   // 스트리밍 없이 보낼 수 있는 한도 안
      output_config: { effort: "low", format: betaZodOutputFormat(Translation) },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM[to],
      messages: [{ role: "user", content: user }]
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) return json({ error: "no_result" }, 502);
    if (res.stop_reason === "max_tokens") return json({ error: "too_long" }, 413);
    const o = res.parsed_output;
    return json({ to, title: title.trim() ? o.title.trim() : "", summary: summary.trim() ? o.summary.trim() : "", body: body.trim() ? o.body.replace(/\s+$/, "") : "" });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return json({ error: "bad_api_key" }, 503);
    if (e instanceof Anthropic.RateLimitError) return json({ error: "rate_limited" }, 429);
    if (e instanceof Anthropic.APIError) return json({ error: "api_error", status: e.status }, 502);
    throw e;
  }
}
