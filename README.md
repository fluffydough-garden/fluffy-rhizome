# 리좀 웹진

- 웹진: https://rhizome-webzine.vercel.app
- 어드민: https://rhizome-webzine.vercel.app/admin (비밀번호: `ADMIN_PASSWORD.txt`, Vercel 환경변수 `ADMIN_PASSWORD`)
- 공개 API (발행된 글만, CORS 허용, 저장 후 최대 1~2분 뒤 반영)
  - `GET /api/rhizome` — `{ meta, categories, nodes, links }`
  - `GET /api/rhizome?slug=슬러그` 또는 `?id=글ID` — 글 하나
  - `GET /api/rhizome?category=카테고리ID`
  - 각 글: `title, titleEn, slug, category, tags, date, weight, summary, image, imageAlt, body(마크다운), bodyHtml, spore`(승인된 포자 이미지와 속성)

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
- `public/spore/index.html` 포자 컨셉 웹진 (`/spore`, 브랜치 `concept-spore`) — MYCELIUM ARCHIVE. 개념(태그·카테고리)=포자, 연결=균사, 글=자실체. 개념을 누르면 균사가 자라고(여러 개면 균총이 겹침), 글을 열면 우측 패널과 함께 포자가 퍼짐. 내가 읽은 경로는 ‘나의 균사’(이 브라우저에만 저장). 주소 `#c=개념&p=글ID`로 공유·뒤로 가기. 글 크기는 글자수 구간 1~5(5000자 이상=5, 그 아래는 상대 4등분). 배경 이미지·영상은 파일 위쪽 `MEDIA`에 경로를 넣으면 됨. 같은 `/api/rhizome`을 읽어 어드민 공유
- `public/admin/index.html` 어드민 (`/admin`, 검색엔진 noindex). ‘포자 이미지’ 화면에서 글마다 속성 정리·생성·재생성·승인·직접 올리기
- `public/fonts/` 웹진 글꼴
- `lib/markdown.js` 마크다운 렌더러 — 웹진·어드민·API가 같은 함수를 씀. 고친 뒤 `node scripts/check-markdown.mjs`
- `api/db.js` 관리자 읽기/쓰기 (비밀번호 필요)
- `api/upload.js` 이미지 업로드/정리 (비밀번호 필요)
- `api/rhizome.js` 공개 API
- `api/spore.js` 포자 이미지 작업 API (어드민 비밀번호 또는 `SPORE_TOKEN`). 흐름: 어드민 ‘생성’ → `pending` → n8n이 `GET /api/spore?status=pending`로 가져가 `claim` → Higgsfield 생성 → `result`(imageUrl 또는 imageBase64, 웹진 저장소 `spores/`로 옮겨 담음) → `review` → 어드민 ‘승인’ → 공개 API `spore.image`. 실패는 `fail`. 환경변수 `SPORE_TOKEN`(n8n 인증), `N8N_WEBHOOK_URL`(있으면 ‘생성’ 때 바로 보냄). 자세한 요청 모양은 어드민 ‘포자 이미지 → n8n 연결 방법’
- `lib/spore.js` 포자 속성(유형·의제·복잡도·연결·대칭·색·시드)과 프롬프트 규칙(아트디렉션). 점검: `node --import ./scripts/spore-test/reg.mjs scripts/check-spore.mjs`
- 저장소: Vercel Blob. DB는 저장할 때마다 `data/v/<시각>-<난수>.json` 새 파일로 쓰고 가장 최신 것을 읽음(공개 Blob CDN 캐시 때문에 덮어쓰기는 예전 내용을 읽을 수 있음). 최근 20개 버전 보관. `data/db.json`은 옮기기 전 예전 파일, 이미지는 `images/`

## 다시 배포

```bash
npx vercel@latest deploy --prod
```
