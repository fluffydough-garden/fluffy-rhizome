import { readDb } from "../lib/store.js";
import { rhizomeMd } from "../lib/markdown.js";

// 공개 API — 다른 웹페이지에서 fetch로 읽어 가는 용도. 발행된 글만 나감.
//   GET /api/rhizome               전체 (categories, nodes, links)
//   GET /api/rhizome?slug=xxx      글 하나
//   GET /api/rhizome?id=xxx        글 하나
//   GET /api/rhizome?category=ID   카테고리로 거르기

const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS", "access-control-allow-headers": "content-type" };
const send = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...CORS, "content-type": "application/json; charset=utf-8", "cache-control": status === 200 ? "public, max-age=0, s-maxage=30, stale-while-revalidate=300" : "no-store" }
});

const slugify = s => String(s || "").trim().toLowerCase().replace(/['"]/g, "").replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);


export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const db = await readDb();
  const cats = Object.entries(db.categories).map(([id, c]) => ({ id, ...c }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.name).localeCompare(String(b.name), "ko"))
    .map(c => ({ id: c.id, name: c.name, nameEn: c.nameEn || "", color: c.color }));
  let posts = Object.entries(db.posts).map(([id, p]) => ({ id, ...p })).filter(p => p.status === "published");
  if (q.get("category")) posts = posts.filter(p => p.categoryId === q.get("category"));

  const node = p => ({
    id: p.id, slug: p.slug || slugify(p.titleEn || p.title), title: p.title || "", titleEn: p.titleEn || "",
    category: p.categoryId || null, tags: p.tags || [], date: p.date || "", weight: Number(p.weight) || 5,
    summary: p.summary || "", image: p.image || null, imageAlt: p.imageAlt || "",
    body: p.body || "", bodyHtml: rhizomeMd(p.body || ""), updatedAt: p.updatedAt || ""
  });

  const one = q.get("slug") || q.get("id");
  if (one) {
    const p = posts.find(p => p.id === one || node(p).slug === one);
    return p ? send(node(p)) : send({ error: "not_found" }, 404);
  }

  const ids = new Set(posts.map(p => p.id)), seen = new Set(), links = [];
  posts.forEach(p => (p.links || []).forEach(t => {
    if (!ids.has(t) || t === p.id) return;
    const k = [p.id, t].sort().join("|");
    if (!seen.has(k)) { seen.add(k); links.push({ source: p.id, target: t }); }
  }));
  return send({
    meta: { title: "리좀 웹진", updatedAt: db.updatedAt, count: posts.length },
    categories: cats,
    nodes: posts.sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).map(node),
    links
  });
}
