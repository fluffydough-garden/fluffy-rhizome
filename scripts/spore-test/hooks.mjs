export async function resolve(spec, ctx, next) {
  if (spec === "@vercel/blob") return { url: new URL("./fakeblob.mjs", import.meta.url).href, shortCircuit: true };
  return next(spec, ctx);
}
