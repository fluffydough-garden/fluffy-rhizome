import { del } from "@vercel/blob";
import { readDb, writeDb, latestVersion, toLists, authed, json, unauthorized, isOurImage } from "../lib/store.js";

const COLLS = new Set(["posts", "categories", "tags"]);
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const imagesOf = db => new Set(Object.values(db.posts).map(p => p.image).filter(Boolean));

// 관리자 전체 데이터 (초안 포함)
export async function GET(req) {
  if (!authed(req)) return unauthorized();
  return json(toLists(await readDb()));
}

// { ops: [{ op: "set"|"update"|"delete", coll, id, data }] }
export async function POST(req) {
  if (!authed(req)) return unauthorized();
  let body;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const ops = Array.isArray(body?.ops) ? body.ops : null;
  if (!ops || !ops.length || ops.length > 1000) return json({ error: "bad_ops" }, 400);

  for (const o of ops) {
    if (!o || !COLLS.has(o.coll) || !ID.test(String(o.id)) || !["set", "update", "delete"].includes(o.op)) return json({ error: "bad_op" }, 400);
  }

  // 읽고 → 적용하고 → 쓰기 직전에 그사이 다른 저장이 있었는지 확인. 있었으면 최신 DB에 다시 적용.
  let db, before;
  for (let attempt = 0; ; attempt++) {
    db = await readDb();
    before = imagesOf(db);
    for (const o of ops) {
      const coll = db[o.coll];
      const data = o.data && typeof o.data === "object" ? { ...o.data } : {};
      delete data.id;
      // 포자 이미지 상태는 /api/spore가 따로 관리 — 글을 통째로 저장해도 지우거나 예전 값으로 덮지 않음
      if (o.coll === "posts") { delete data.spore; if (coll[o.id]?.spore) data.spore = coll[o.id].spore; }
      // 돌 DNA도 /api/stone이 따로 관리
      if (o.coll === "posts") { delete data.stone; if (coll[o.id]?.stone) data.stone = coll[o.id].stone; }
      if (o.coll === "posts") { delete data.stoneModel; if (coll[o.id]?.stoneModel) data.stoneModel = coll[o.id].stoneModel; }
      if (o.op === "set") coll[o.id] = data;
      else if (o.op === "update") { if (coll[o.id]) coll[o.id] = { ...coll[o.id], ...data }; }
      else delete coll[o.id];
    }
    if (attempt >= 3 || (await latestVersion()) === (db.version || null)) break;
  }
  await writeDb(db);

  // 글에서 빠진 이미지는 저장소에서도 지움
  const after = imagesOf(db);
  const orphans = [...before].filter(u => !after.has(u) && isOurImage(u));
  if (orphans.length) await del(orphans).catch(() => {});

  return json(toLists(db));
}
