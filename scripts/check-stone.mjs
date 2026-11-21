// 돌 DNA API 점검 (저장소는 메모리, Claude 호출은 가짜 응답). 실행: node --import ./scripts/spore-test/reg.mjs scripts/check-stone.mjs
const root = new URL("../", import.meta.url).href.replace(/\/$/, "");
process.env.ADMIN_PASSWORD = "pw"; process.env.ANTHROPIC_API_KEY = "test-key";
const files = globalThis.__blobs ||= new Map();
let sent = null, reply = null;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, o) => {
  const u = String(url);
  if (u.startsWith("https://x.public.blob.vercel-storage.com/")) { const b = files.get(u.split(".com/")[1]); return new Response(b ?? null, { status: b ? 200 : 404 }); }
  if (u.startsWith("https://api.anthropic.com/")) {
    sent = JSON.parse(o.body);
    return new Response(JSON.stringify({ id: "msg_test", type: "message", role: "assistant", model: sent.model, content: [{ type: "text", text: JSON.stringify(reply) }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 10, output_tokens: 10 } }), { headers: { "content-type": "application/json" } });
  }
  return realFetch(url, o);
};
const db = await import(root + "/api/db.js"), st = await import(root + "/api/stone.js"), pub = await import(root + "/api/rhizome.js");
const req = (m, path, body, auth = "pw") => new Request("https://site" + path, { method: m, headers: { authorization: "Bearer " + auth, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
const J = r => r.json();
let ok = 0, bad = 0; const check = (c, msg) => { if (c) ok++; else { bad++; console.log("✗", msg); } };
const f = (value, confidence = .9, evidence = "근거 문장") => ({ value, confidence, evidence });

await db.POST(req("POST", "/api/db", { ops: [{ op: "set", coll: "posts", id: "a1", data: { title: "반복하는 기계", body: "AI가 이미지를 끝없이 생산하는 전시. ".repeat(40), status: "published" } }] }));

let r = await J(await st.GET(req("GET", "/api/stone?schema=1")));
check(r.themes.technology.hex === "#6d86a0" && r.experiences.immersive && r.confidenceMin === .7 && r.ai === true, "schema");
check((await st.POST(req("POST", "/api/stone", { action: "analyze", id: "a1" }, "nope"))).status === 401, "no auth → 401");
check((await st.POST(req("POST", "/api/stone", { action: "analyze", body: "  " }))).status === 400, "empty → 400");

// 예시 001: 기술 · 몰입형 · 반복 · 비판적, 보조 주제 사회(확신도 낮음)
reply = { primary_theme: f("technology"), secondary_theme: f("society", .55), experience: f("immersive"), interpretive_lens: f("repetition"),
  critical_stance: f("critical"), argument_count: f(2), narrative_direction: f("deep_dive"), exhibition_format: f("unknown", .4, ""),
  arguments: ["기술적 이미지 재생산의 반복성", "제도적 비판"], note: "보조 주제는 짧게만 다뤄져요." };
r = await J(await st.POST(req("POST", "/api/stone", { action: "analyze", id: "a1" })));
check(r.dna.primary_theme.value === "technology" && r.dna.argument_count.value === 2, "analyze saved post");
check(r.low.includes("secondary_theme") && r.low.includes("exhibition_format") && !r.low.includes("primary_theme"), "low confidence flagged");
check(r.color.mode === "blend" && r.color.primary === "#6d86a0" && r.color.secondary === "#9b5e4f", "two themes → 80/20");
check(/steel blue/.test(r.imagePrompt) && /hollow geode/.test(r.imagePrompt) && /concentric/.test(r.imagePrompt) && /chiseled/.test(r.imagePrompt), "image prompt");
check(/GLB/.test(r.modelPrompt) && /watertight/.test(r.modelPrompt) && /cavity is real geometry/.test(r.modelPrompt) && /high roughness/.test(r.modelPrompt) && /reference for a 3D model/.test(r.imagePrompt), "3D model prompt");
check(r.webMotion.camera === "dolly-in" && !/camera|push-in/i.test(r.modelPrompt.split("OUTPUT")[1]), "motion goes to the web viewer, not the model");
check(sent.output_config?.format && sent.messages[0].content.includes("반복하는 기계") && sent.system.includes("정의된 값 중에서만"), "sends post + structured output");

// 붙여넣은 원문 + 보조 주제 없음, 모르는 값은 버림
reply = { ...reply, secondary_theme: f("none", .9, ""), argument_count: f(9) };
r = await J(await st.POST(req("POST", "/api/stone", { action: "analyze", title: "붙여넣은 글", body: "본문", info: "2026, 서울" })));
check(r.dna.secondary_theme.value === "" && r.color.mode === "single", "none → single color");
check(r.dna.argument_count.value === 5 && r.complete === true, "clamps count");
reply = { ...reply, experience: f("spaceship") };
check((await st.POST(req("POST", "/api/stone", { action: "analyze", body: "본문" }))).status === 502, "value outside the list → 502");
r = await J(await st.POST(req("POST", "/api/stone", { action: "prompts", dna: { primary_theme: "ecology", experience: "spaceship" } })));
check(!r.dna.experience && r.complete === false, "prompts drops unknown value");
reply = { ...reply, experience: f("immersive") };
r = await J(await st.POST(req("POST", "/api/stone", { action: "analyze", title: "붙여넣은 글", body: "본문", info: "2026, 서울" })));
check(sent.messages[0].content.includes("전시 정보") && sent.messages[0].content.includes("2026, 서울"), "paste mode sends info");

// 3개 이상 논점 + 보조 주제 = 광맥
r = await J(await st.POST(req("POST", "/api/stone", { action: "prompts", dna: { primary_theme: "ecology", secondary_theme: "body", argument_count: 3, experience: "participatory", interpretive_lens: "relation", critical_stance: "speculative", narrative_direction: "inquiry" } })));
check(r.color.mode === "veins" && /only as thin veins/.test(r.imagePrompt) && /porous/.test(r.imagePrompt) && /frosted/.test(r.imagePrompt) && /veins and small crystals/.test(r.modelPrompt) && /holes and passages are real geometry/.test(r.modelPrompt) && r.webMotion.camera === "orbit-20", "veins rule + prompts");

// 저장 → 글을 통째로 다시 저장해도 남아 있음 → 공개 API엔 값만
r = await J(await st.POST(req("POST", "/api/stone", { action: "save", id: "a1", confirmed: true, dna: reply && { primary_theme: f("technology"), experience: f("immersive"), interpretive_lens: f("repetition"), critical_stance: f("critical"), argument_count: f(2), narrative_direction: f("deep_dive") }, arguments: ["하나", "둘"] })));
check(r.stone.confirmed === true && r.stone.dna.primary_theme.evidence === "근거 문장" && /geode/.test(r.stone.imagePrompt) && /GLB/.test(r.stone.modelPrompt) && !r.stone.videoPrompt, "save");
await db.POST(req("POST", "/api/db", { ops: [{ op: "set", coll: "posts", id: "a1", data: { title: "반복하는 기계", body: "고친 본문", status: "published" } }] }));
const list = await J(await pub.GET(new Request("https://site/api/rhizome")));
const n = list.nodes.find(x => x.id === "a1");
check(n.stone && n.stone.primary_theme === "technology" && n.stone.confirmed === true && n.stone.colors[0] === "#6d86a0" && n.stone.webMotion.camera === "dolly-in" && !JSON.stringify(n.stone).includes("근거 문장"), "survives post save; public has values only");
r = await J(await st.POST(req("POST", "/api/stone", { action: "clear", id: "a1" })));
check(r.stone === null, "clear");
check((await st.POST(req("POST", "/api/stone", { action: "save", id: "zz", dna: {} }))).status === 404, "unknown post → 404");

console.log(`${ok} ok, ${bad} failed`);
process.exit(bad ? 1 : 0);
