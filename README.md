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
- `public/spore/` 포자 컨셉 웹진 **부드러운 침범 / Soft Invasion** (브랜치 `concept-spore`, 기본 영어 · 한국어 전환은 오른쪽 위 EN/KO, `?lang=ko`로도 열림)
  - `index.html` 메인: 1) 모든 포자(글 하나 = 포자 하나)가 떠 있는 대문 2) 포자 분류(의제별) 3) 리좀 미리보기 → 버튼으로 `rhizome/` 4) 끝없이 이어지는 글 목록. 글은 오른쪽 패널에서 열리고 주소 `#p=글ID`로 공유
  - `rhizome/index.html` 전체 리좀 인터랙션(균사 성장·균총·나의 균사). 주소 `#c=개념&p=글ID`
  - `shared.js` 두 페이지 공통: 한/영 문구(`TEXT`)와 포자 분류 이름·설명·색(`TOPICS`) — 다듬은 문구는 여기에 넣으면 됨. 데이터, 포자 그림(승인된 포자 이미지가 없으면 포자 속성으로 그린 임시 표본), 지난 10초 마우스 궤적, 글 패널, 리좀 배치, 마크다운
  - `shared.css` 공통 스타일과 글꼴
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
