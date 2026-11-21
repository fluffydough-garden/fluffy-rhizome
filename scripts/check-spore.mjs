// 포자 API 점검 (저장소는 메모리로 바꿔치기). 실행: node --import ./scripts/spore-test/reg.mjs scripts/check-spore.mjs
const root = new URL("../", import.meta.url).href.replace(/\/$/, "");
process.env.ADMIN_PASSWORD = "pw"; process.env.SPORE_TOKEN = "tok";
const files = globalThis.__blobs ||= new Map();
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, o) => {
  const u = String(url);
  if (u.startsWith("https://x.public.blob.vercel-storage.com/")) { const b = files.get(u.split(".com/")[1]); return new Response(b ?? null, { status: b ? 200 : 404 }); }
  if (u === "https://higgs.example/img.png") return new Response(Buffer.from([137,80,78,71]), { headers: { "content-type": "image/png" } });
  return realFetch(url, o);
};
const db = await import(root + "/api/db.js"), sp = await import(root + "/api/spore.js"), pub = await import(root + "/api/rhizome.js");
const req = (m, path, body, auth = "pw") => new Request("https://site" + path, { method: m, headers: { authorization: "Bearer " + auth, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
const J = r => r.json();
let ok = 0, bad = 0; const check = (c, msg) => { if (c) ok++; else { bad++; console.log("✗", msg); } };

await db.POST(req("POST", "/api/db", { ops: [{ op: "set", coll: "posts", id: "a1", data: { title: "미술관과 비인간 행위자", body: "본문 ".repeat(100), status: "published", links: ["a2"] } }, { op: "set", coll: "posts", id: "a2", data: { title: "둘", body: "짧음", status: "published" } }] }));
let r = await J(await sp.GET(req("GET", "/api/spore?schema=1")));
check(r.token === true && r.webhook === false && r.contentTypes.exhibition_review, "schema");
check((await sp.GET(req("GET", "/api/spore?status=pending", null, "nope"))).status === 401, "no auth → 401");
r = await J(await sp.POST(req("POST", "/api/spore", { action: "save", id: "a1", params: { primaryTopic: "body_relation", secondaryTopic: "media_technology", complexity: 9, symmetry: 2, palette: "dusty coral, silver blue" } })));
check(r.spore.complexity === 5 && r.spore.palette.length === 2 && r.spore.imageStatus === "none", "save clamps");
check((await sp.POST(req("POST", "/api/spore", { action: "generate", id: "a1" }, "tok"))).status === 403, "bot cannot generate");
r = await J(await sp.POST(req("POST", "/api/spore", { action: "generate", id: "a1" })));
check(r.spore.imageStatus === "pending" && r.spore.generation === 1 && /dusty coral/.test(r.spore.prompt) && r.webhook === false, "generate");
r = await J(await sp.GET(req("GET", "/api/spore?status=pending", null, "tok")));
check(r.jobs.length === 1 && r.jobs[0].articleId === "a1" && r.jobs[0].prompt && r.jobs[0].seed === "article_a1", "bot lists pending");
r = await J(await sp.POST(req("POST", "/api/spore", { action: "claim", id: "a1" }, "tok")));
check(r.spore.imageStatus === "generating", "claim");
check((await sp.POST(req("POST", "/api/spore", { action: "claim", id: "a1" }, "tok"))).status === 409, "double claim → 409");
// admin saves the whole post meanwhile with stale data: spore must survive
await db.POST(req("POST", "/api/db", { ops: [{ op: "set", coll: "posts", id: "a1", data: { title: "제목 수정", body: "본문", status: "published", spore: { imageStatus: "none" } } }] }));
r = await J(await sp.GET(req("GET", "/api/spore?id=a1")));
check(r.imageStatus === "generating" && r.title === "제목 수정", "post save keeps spore");
r = await J(await sp.POST(req("POST", "/api/spore", { action: "result", id: "a1", imageUrl: "https://higgs.example/img.png", model: "hf" }, "tok")));
check(r.spore.imageStatus === "review" && /\/spores\/a1-g1/.test(r.spore.image), "result stored");
const first = r.spore.image;
let p = await J(await pub.GET(new Request("https://site/api/rhizome?id=a1")));
check(p.spore && p.spore.image === null && p.spore.primaryTopic === "body_relation", "public hides unapproved");
r = await J(await sp.POST(req("POST", "/api/spore", { action: "approve", id: "a1" })));
check(r.spore.imageStatus === "approved" && r.spore.approvedImage === first, "approve");
p = await J(await pub.GET(new Request("https://site/api/rhizome?id=a1")));
check(p.spore.image === first, "public shows approved");
// regenerate → new result; approved stays until the new one is approved, then the old file is removed
await sp.POST(req("POST", "/api/spore", { action: "generate", id: "a1" }));
r = await J(await sp.POST(req("POST", "/api/spore", { action: "result", id: "a1", imageBase64: "data:image/png;base64," + Buffer.from("png").toString("base64") }, "tok")));
check(r.spore.image !== first && r.spore.approvedImage === first && r.spore.generation === 2, "regenerate keeps approved");
await sp.POST(req("POST", "/api/spore", { action: "approve", id: "a1" }));
check(!files.has(first.split(".com/")[1]), "old approved image deleted");
r = await J(await sp.POST(req("POST", "/api/spore", { action: "fail", id: "a2", error: "timeout" }, "tok")));
check(r.spore.imageStatus === "failed" && r.spore.error === "timeout", "fail");
check((await sp.POST(req("POST", "/api/spore", { action: "use-upload", id: "a2", url: "https://evil.com/x.png" }))).status === 400, "upload url checked");
r = await J(await sp.POST(req("POST", "/api/spore", { action: "approve", id: "a2" }))); 
check(r.error === "no_image", "approve without image");
console.log(`${ok} passed, ${bad} failed`);
