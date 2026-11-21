// 번역 API 점검 (Claude 호출은 가짜 응답으로 바꿔치기). 실행: node --import ./scripts/spore-test/reg.mjs scripts/check-translate.mjs
const root = new URL("../", import.meta.url).href.replace(/\/$/, "");
process.env.ADMIN_PASSWORD = "pw"; process.env.ANTHROPIC_API_KEY = "test-key";
let sent = null, reply = null;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, o) => {
  const u = String(url);
  if (u.startsWith("https://api.anthropic.com/")) {
    sent = JSON.parse(o.body);
    return new Response(JSON.stringify({ id: "msg_test", type: "message", role: "assistant", model: sent.model, content: [{ type: "text", text: JSON.stringify(reply) }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 10, output_tokens: 10 } }), { headers: { "content-type": "application/json" } });
  }
  return realFetch(url, o);
};
const tr = await import(root + "/api/translate.js");
const req = (body, auth = "pw") => new Request("https://site/api/translate", { method: "POST", headers: { authorization: "Bearer " + auth, "content-type": "application/json" }, body: JSON.stringify(body) });
let ok = 0, bad = 0; const check = (c, msg) => { if (c) ok++; else { bad++; console.log("✗", msg); } };

check((await tr.POST(req({ to: "en", title: "x" }, "nope"))).status === 401, "no auth → 401");
check((await tr.POST(req({ to: "en", title: " ", body: "" }))).status === 400, "empty → 400");

reply = { title: "On Rhizomes", summary: "", body: "# Roots\n\nA rhizome has no centre. [link](https://ex.com/a)\n\n" };
let r = await tr.POST(req({ to: "en", title: "땅속줄기에 대하여", summary: "", body: "# 뿌리\n\n땅속줄기에는 중심이 없다. [링크](https://ex.com/a)" }));
let j = await r.json();
check(r.status === 200 && j.title === "On Rhizomes" && j.body === "# Roots\n\nA rhizome has no centre. [link](https://ex.com/a)", "ko → en fills title/body, trims trailing space");
check(j.summary === "", "empty part stays empty");
check(sent.system.includes("into English") && sent.messages[0].content.includes("땅속줄기에 대하여") && sent.output_config?.format, "sends English prompt + structured output");

reply = { title: "땅속줄기에 대하여", summary: "짧은 요약", body: "본문" };
j = await (await tr.POST(req({ to: "ko", title: "On Rhizomes", summary: "Short", body: "Body" }))).json();
check(j.to === "ko" && j.summary === "짧은 요약" && sent.system.includes("한국어로 옮긴다"), "en → ko");

check((await tr.POST(req({ to: "en", body: "가".repeat(40001) }))).status === 413, "too long → 413");

console.log(`${ok} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
