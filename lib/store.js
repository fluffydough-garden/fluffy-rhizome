import { put, get, list, del } from "@vercel/blob";
import { createHash, timingSafeEqual, randomBytes } from "node:crypto";

// 공개 Blob은 CDN이 같은 주소를 최대 60초 캐시하고, useCache:false도 공개 저장소에선 듣지 않아요.
// 같은 파일을 덮어쓰면 연달아 저장할 때 예전 DB를 읽고 덮어써서 앞의 저장이 사라져요.
// 그래서 저장할 때마다 새 이름(data/v/<시각>-<난수>.json)으로 쓰고, 읽을 땐 list(항상 최신)로 가장 새 파일을 골라요.
const LEGACY_PATH = "data/db.json";
const VER_PREFIX = "data/v/";
const KEEP = 20; // 되돌리기용으로 남겨 둘 이전 버전 수

const empty = () => ({ posts: {}, categories: {}, tags: {}, updatedAt: null });
const norm = db => { db.posts ||= {}; db.categories ||= {}; db.tags ||= {}; return db; };   // tags: 글 없이도 남겨 둘 태그 목록 { [id]: { name } }

async function versions() {
  const out = []; let cursor;
  do {
    const r = await list({ prefix: VER_PREFIX, cursor, limit: 1000 });
    out.push(...r.blobs); cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return out.sort((a, b) => a.pathname < b.pathname ? 1 : -1); // 최신 먼저
}

// db 모양: { posts: { [id]: doc }, categories: { [id]: doc }, updatedAt }
// 지금 가장 새 버전의 이름 (저장 직전에 다른 저장이 끼어들었는지 확인용)
export async function latestVersion() { const [v] = await versions(); return v ? v.pathname : null; }

export async function readDb() {
  const [latest] = await versions();
  if (latest) {
    const r = await fetch(latest.url);
    if (!r.ok) throw new Error("db_read_failed " + r.status);
    const db = norm(await r.json());
    Object.defineProperty(db, "version", { value: latest.pathname, enumerable: false });
    return db;
  }
  // 아직 버전 파일이 없으면 예전 단일 파일에서 시작
  const r = await get(LEGACY_PATH, { access: "public" });
  if (!r || r.statusCode !== 200) return empty();
  return norm(JSON.parse(await new Response(r.stream).text()));
}

export async function writeDb(db) {
  db.updatedAt = new Date().toISOString();
  const name = `${VER_PREFIX}${Date.now().toString().padStart(15, "0")}-${randomBytes(4).toString("hex")}.json`;
  await put(name, JSON.stringify(db), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json; charset=utf-8",
    cacheControlMaxAge: 31536000 // 한 번 쓴 파일은 바뀌지 않음
  });
  // 오래된 버전 정리 (실패해도 저장에는 영향 없음)
  try {
    const old = (await versions()).slice(KEEP).map(b => b.url);
    if (old.length) await del(old);
  } catch {}
}

export const toLists = db => ({
  posts: Object.entries(db.posts).map(([id, d]) => ({ ...d, id })),
  categories: Object.entries(db.categories).map(([id, d]) => ({ ...d, id })),
  tags: Object.entries(db.tags || {}).map(([id, d]) => ({ ...d, id })),
  updatedAt: db.updatedAt
});

const sha = s => createHash("sha256").update(String(s)).digest();
export function authed(req) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  let got = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  try { got = decodeURIComponent(got); } catch {}
  return timingSafeEqual(sha(got), sha(pw));
}

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
export const unauthorized = () => json({ error: "unauthorized" }, 401);

export const isOurImage = url => {
  try { const u = new URL(url); return u.hostname.endsWith(".blob.vercel-storage.com") && u.pathname.startsWith("/images/"); }
  catch { return false; }
};
