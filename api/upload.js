import { put, del } from "@vercel/blob";
import { readDb, authed, json, unauthorized, isOurImage } from "../lib/store.js";

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };
const MAX = 4.3 * 1024 * 1024; // Vercel 함수 요청 한도(4.5MB) 안쪽

// 본문 = 이미지 바이너리, ?id=글ID
export async function POST(req) {
  if (!authed(req)) return unauthorized();
  const type = (req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const ext = TYPES[type];
  if (!ext) return json({ error: "unsupported_type" }, 415);
  const buf = Buffer.from(await req.arrayBuffer());
  if (!buf.length) return json({ error: "empty" }, 400);
  if (buf.length > MAX) return json({ error: "too_large" }, 413);
  const id = (new URL(req.url).searchParams.get("id") || "post").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64) || "post";
  const blob = await put(`images/${id}.${ext}`, buf, { access: "public", contentType: type, addRandomSuffix: true });
  return json({ url: blob.url });
}

// 저장하지 않고 닫은 업로드 정리. 저장된 글이 쓰는 이미지는 지우지 않음.
export async function DELETE(req) {
  if (!authed(req)) return unauthorized();
  const url = new URL(req.url).searchParams.get("url") || "";
  if (!isOurImage(url)) return json({ error: "bad_url" }, 400);
  const db = await readDb();
  if (Object.values(db.posts).some(p => p.image === url)) return json({ ok: true, kept: true });
  await del(url).catch(() => {});
  return json({ ok: true });
}
