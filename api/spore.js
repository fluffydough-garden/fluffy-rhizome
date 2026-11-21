import { put, del } from "@vercel/blob";
import { timingSafeEqual, createHash } from "node:crypto";
import { readDb, writeDb, latestVersion, authed, json, unauthorized } from "../lib/store.js";
import { CONTENT_TYPES, TOPICS, STATUSES, PROMPT_VERSION, defaultSpore, cleanParams, sporeJob, sporePrompt, isOurSpore } from "../lib/spore.js";

// 포자 이미지 작업 API
//  사람(어드민 비밀번호)과 자동화(n8n, SPORE_TOKEN) 둘 다 씀.
//
//  GET  /api/spore?schema=1                 속성 목록과 연결 상태 (어드민)
//  GET  /api/spore?status=pending           기다리는 작업들 (n8n이 주기적으로 가져감). status는 쉼표로 여러 개
//  GET  /api/spore?id=글ID                  작업 하나
//  POST /api/spore { action, id, ... }
//    어드민: save {params} · generate · approve · use-upload {url} · reset
//    n8n:    claim · result {imageUrl | imageBase64, contentType?, model?} · fail {error}
//
//  환경변수
//    SPORE_TOKEN       n8n이 보낼 토큰 (Authorization: Bearer <토큰> 또는 x-spore-token 헤더)
//    N8N_WEBHOOK_URL   있으면 '생성'을 누를 때 이 주소로 작업을 바로 보냄 (없으면 n8n이 GET으로 가져가면 됨)

export const config = { maxDuration: 60 };

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const sha = s => createHash("sha256").update(String(s)).digest();
function isBot(req) {
  const tok = process.env.SPORE_TOKEN; if (!tok) return false;
  let got = req.headers.get("x-spore-token") || (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  try { got = decodeURIComponent(got); } catch {}
  return timingSafeEqual(sha(got), sha(tok));
}
const who = req => authed(req) ? "admin" : isBot(req) ? "bot" : null;
const ADMIN_ACTIONS = new Set(["save", "generate", "approve", "use-upload", "reset"]);
const BOT_ACTIONS = new Set(["claim", "result", "fail"]);
const nowISO = () => new Date().toISOString();
const sporeOf = (id, p) => ({ ...defaultSpore(id, p), ...(p.spore || {}) });

// 읽고 → 바꾸고 → 그사이 다른 저장이 끼었으면 최신 DB로 다시 (api/db.js와 같은 방식)
async function mutate(id, fn) {
  let db, res;
  for (let attempt = 0; ; attempt++) {
    db = await readDb();
    const p = db.posts[id];
    if (!p) return { error: "not_found", status: 404 };
    const s = sporeOf(id, p);
    res = await fn(s, p);
    if (res && res.error) return res;
    p.spore = s;
    if (attempt >= 3 || (await latestVersion()) === (db.version || null)) break;
  }
  await writeDb(db);
  return { spore: db.posts[id].spore, post: db.posts[id], ...(res || {}) };
}

async function storeImage(id, gen, buf, type) {
  const ext = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif" }[type];
  if (!ext) throw Object.assign(new Error("unsupported_type"), { status: 415 });
  if (buf.length > 20 * 1024 * 1024) throw Object.assign(new Error("too_large"), { status: 413 });
  const blob = await put(`spores/${id}-g${gen}.${ext}`, buf, { access: "public", contentType: type, addRandomSuffix: true });
  return blob.url;
}

async function notifyN8n(job) {
  const url = process.env.N8N_WEBHOOK_URL; if (!url) return false;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...(process.env.SPORE_TOKEN ? { "x-spore-token": process.env.SPORE_TOKEN } : {}) },
      body: JSON.stringify(job),
      signal: AbortSignal.timeout(8000)
    });
    return r.ok;
  } catch { return false; }
}

export async function GET(req) {
  const role = who(req); if (!role) return unauthorized();
  const q = new URL(req.url).searchParams;
  if (q.get("schema")) {
    return json({ contentTypes: CONTENT_TYPES, topics: TOPICS, statuses: STATUSES, promptVersion: PROMPT_VERSION,
      webhook: !!process.env.N8N_WEBHOOK_URL, token: !!process.env.SPORE_TOKEN });
  }
  const db = await readDb();
  const id = q.get("id");
  if (id) {
    const p = db.posts[id]; if (!p) return json({ error: "not_found" }, 404);
    return json(sporeJob(id, p, sporeOf(id, p)));
  }
  const want = new Set((q.get("status") || "pending").split(",").map(s => s.trim()).filter(Boolean));
  const jobs = Object.entries(db.posts).map(([id, p]) => [id, p, sporeOf(id, p)])
    .filter(([, , s]) => want.has("all") || want.has(s.imageStatus))
    .sort((a, b) => String(a[2].requestedAt || "").localeCompare(String(b[2].requestedAt || "")))
    .map(([id, p, s]) => sporeJob(id, p, s));
  return json({ jobs });
}

export async function POST(req) {
  const role = who(req); if (!role) return unauthorized();
  let b; try { b = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const action = String(b?.action || ""), id = String(b?.id || b?.articleId || "");
  if (!ID.test(id)) return json({ error: "bad_id" }, 400);
  // 어드민은 모든 동작 가능, n8n은 결과를 돌려주는 동작만
  if (!(ADMIN_ACTIONS.has(action) || BOT_ACTIONS.has(action))) return json({ error: "bad_action" }, 400);
  if (role === "bot" && !BOT_ACTIONS.has(action)) return json({ error: "forbidden" }, 403);

  // 결과 이미지는 DB를 건드리기 전에 먼저 저장소에 올려 둠 (Higgsfield 주소는 오래 안 남을 수 있음)
  let newUrl = null;
  if (action === "result") {
    try {
      let buf, type;
      if (b.imageBase64) {
        const m = String(b.imageBase64).match(/^data:([^;]+);base64,(.*)$/);
        type = (m ? m[1] : b.contentType || "image/png").toLowerCase(); buf = Buffer.from(m ? m[2] : b.imageBase64, "base64");
      } else if (/^https:\/\//i.test(b.imageUrl || "")) {
        const r = await fetch(b.imageUrl, { signal: AbortSignal.timeout(30000) });
        if (!r.ok) return json({ error: "fetch_failed", status: r.status }, 502);
        type = (r.headers.get("content-type") || b.contentType || "image/png").split(";")[0].trim().toLowerCase();
        buf = Buffer.from(await r.arrayBuffer());
      } else return json({ error: "no_image" }, 400);
      const db = await readDb(); const gen = db.posts[id]?.spore?.generation || 0;
      newUrl = await storeImage(id, gen, buf, type);
    } catch (e) { return json({ error: e.message || "store_failed" }, e.status || 500); }
  }
  if (action === "use-upload" && !isOurSpore(b.url)) return json({ error: "bad_url" }, 400);

  const garbage = [];
  const r = await mutate(id, s => {
    const t = nowISO();
    garbage.length = 0; // a retry starts from the latest DB, so recompute what to clean up
    switch (action) {
      case "save":
        Object.assign(s, cleanParams(b.params || {}));
        break;
      case "generate":
        Object.assign(s, cleanParams(b.params || {}));
        s.generation = (s.generation || 0) + 1;
        s.imageStatus = "pending"; s.requestedAt = t; s.error = "";
        s.promptVersion = PROMPT_VERSION; s.prompt = sporePrompt(s);
        break;
      case "claim":
        if (s.imageStatus !== "pending") return { error: "not_pending", status: 409 };
        s.imageStatus = "generating"; s.claimedAt = t;
        break;
      case "result":
        if (s.image && s.image !== s.approvedImage && isOurSpore(s.image)) garbage.push(s.image);
        s.image = newUrl; s.imageStatus = "review"; s.source = "generated"; s.model = String(b.model || "").slice(0, 80);
        s.generatedAt = t; s.error = "";
        break;
      case "use-upload":
        if (s.image && s.image !== s.approvedImage && s.image !== b.url && isOurSpore(s.image)) garbage.push(s.image);
        s.image = b.url; s.imageStatus = "review"; s.source = "upload"; s.generatedAt = t; s.error = "";
        break;
      case "fail":
        s.imageStatus = "failed"; s.error = String(b.error || "생성 실패").slice(0, 300);
        break;
      case "approve":
        if (!s.image) return { error: "no_image", status: 409 };
        if (s.approvedImage && s.approvedImage !== s.image && isOurSpore(s.approvedImage)) garbage.push(s.approvedImage);
        s.approvedImage = s.image; s.imageStatus = "approved"; s.approvedAt = t;
        break;
      case "reset": // 검토 중인 후보를 버리고 승인본(없으면 없음)으로 되돌림
        if (s.image && s.image !== s.approvedImage && isOurSpore(s.image)) garbage.push(s.image);
        s.image = s.approvedImage || ""; s.imageStatus = s.approvedImage ? "approved" : "none"; s.error = "";
        break;
    }
    s.updatedAt = t;
  });
  if (r.error) { if (newUrl) await del(newUrl).catch(() => {}); return json({ error: r.error }, r.status || 400); }
  if (garbage.length) await del([...new Set(garbage)]).catch(() => {});

  const out = { id, spore: r.spore };
  if (action === "generate") out.webhook = await notifyN8n(sporeJob(id, r.post, r.spore));
  return json(out);
}
