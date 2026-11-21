// in-memory stand-in for @vercel/blob
const files = globalThis.__blobs ||= new Map();
const base = "https://x.public.blob.vercel-storage.com/";
export async function put(name, body, o = {}) {
  await new Promise(r => setTimeout(r, 3)); // the store names versions by millisecond; real requests never land in the same ms
  const key = o.addRandomSuffix ? name.replace(/(\.[a-z]+)$/, "-" + Math.random().toString(36).slice(2, 8) + "$1") : name;
  files.set(key, typeof body === "string" ? body : Buffer.from(body)); return { url: base + key, pathname: key };
}
export async function list({ prefix }) { return { blobs: [...files.keys()].filter(k => k.startsWith(prefix)).map(k => ({ pathname: k, url: base + k })), hasMore: false }; }
export async function get() { return null; }
export async function del(urls) { [].concat(urls).forEach(u => files.delete(u.replace(base, ""))); }
