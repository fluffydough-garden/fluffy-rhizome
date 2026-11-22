import { handleUpload } from "@vercel/blob/client";
import { authed, json, unauthorized } from "../lib/store.js";
import { MODEL_MAX_BYTES, modelPathOk } from "../lib/stone.js";

// 돌 3D 모델(GLB) 올리기: 브라우저가 Vercel Blob에 바로 올려요(함수 본문 4.5MB 제한을 피하려고).
// 이 함수는 어드민 비밀번호를 확인하고 '올려도 된다'는 토큰만 내줘요. 올린 뒤 글에 붙이는 건 /api/stone { action: "model-use" }.
// 경로: stones/<글ID>-<난수>.glb · GLB만 · MODEL_MAX_BYTES까지

export async function POST(req) {
  let body; try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  // 토큰 요청은 어드민만. (완료 알림은 쓰지 않아서 받지 않아요)
  if (body?.type !== "blob.generate-client-token") return json({ error: "bad_event" }, 400);
  if (!authed(req)) return unauthorized();
  try {
    const out = await handleUpload({
      body, request: req,
      onBeforeGenerateToken: async pathname => {
        if (!modelPathOk(pathname)) throw Object.assign(new Error("bad_path"), { status: 400 });
        return { allowedContentTypes: ["model/gltf-binary", "application/octet-stream"], maximumSizeInBytes: MODEL_MAX_BYTES, addRandomSuffix: true };
      }
    });
    return json(out);
  } catch (e) {
    return json({ error: e.message || "upload_failed" }, e.status || 400);
  }
}
