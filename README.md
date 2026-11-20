# 리좀 웹진

- 웹진: https://rhizome-webzine.vercel.app
- 어드민: https://rhizome-webzine.vercel.app/admin (비밀번호: `ADMIN_PASSWORD.txt`, Vercel 환경변수 `ADMIN_PASSWORD`)
- 공개 API (발행된 글만, CORS 허용, 저장 후 최대 1~2분 뒤 반영)
  - `GET /api/rhizome` — `{ meta, categories, nodes, links }`
  - `GET /api/rhizome?slug=슬러그` 또는 `?id=글ID` — 글 하나
  - `GET /api/rhizome?category=카테고리ID`
  - 각 글: `title, titleEn, slug, category, tags, date, weight, summary, image, imageAlt, body(마크다운), bodyHtml`

## 다른 페이지에서 쓰기

```html
<div id="rhizome"></div>
<script>
fetch("https://rhizome-webzine.vercel.app/api/rhizome")
  .then(r => r.json())
  .then(data => {
    document.getElementById("rhizome").innerHTML = data.nodes.map(n => `
      <article>
        ${n.image ? `<img src="${n.image}" alt="${n.imageAlt}">` : ""}
        <h2>${n.title}</h2>
        ${n.bodyHtml}
      </article>`).join("");
  });
</script>
```

## 구조

- `public/index.html` 웹진(첫 화면) — 그래프와 갤러리 보기. 열 때마다 `/api/rhizome`에서 발행된 글을 읽어 옴. 발행된 글이 없으면 빈 화면, 서버에 못 닿으면 이 브라우저에 저장된 마지막 글(그것도 없으면 예시 글)을 보여줌. 탭으로 돌아오면 바뀐 글이 있는지 다시 확인함
- `public/admin/index.html` 어드민 (`/admin`, 검색엔진 noindex)
- `public/fonts/` 웹진 글꼴
- `lib/markdown.js` 마크다운 렌더러 — 웹진·어드민·API가 같은 함수를 씀. 고친 뒤 `node scripts/check-markdown.mjs`
- `api/db.js` 관리자 읽기/쓰기 (비밀번호 필요)
- `api/upload.js` 이미지 업로드/정리 (비밀번호 필요)
- `api/rhizome.js` 공개 API
- 저장소: Vercel Blob. DB는 저장할 때마다 `data/v/<시각>-<난수>.json` 새 파일로 쓰고 가장 최신 것을 읽음(공개 Blob CDN 캐시 때문에 덮어쓰기는 예전 내용을 읽을 수 있음). 최근 20개 버전 보관. `data/db.json`은 옮기기 전 예전 파일, 이미지는 `images/`

## 다시 배포

```bash
npx vercel@latest deploy --prod
```
