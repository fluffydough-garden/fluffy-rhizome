// 마크다운 함수 점검: 세 파일의 rhizomeMd가 같은지, 그리고 예시 입력이 기대대로 바뀌는지.
// 실행: node scripts/check-markdown.mjs
import { readFileSync } from "node:fs";
import { rhizomeMd as md } from "../lib/markdown.js";

const root = new URL("../", import.meta.url);
const block = f => {
  const s = readFileSync(new URL(f, root), "utf8");
  const m = s.match(/\/\* rhizome-md:start \*\/([\s\S]*?)\/\* rhizome-md:end \*\//);
  return m ? m[1].replace(/^[ \t]+/gm, "").trim() : null;
};
let fail = 0;
const ref = block("lib/markdown.js");
for (const f of ["public/admin/index.html", "public/index.html", "public/spore/shared.js"]) {
  if (block(f) !== ref) { console.error(`✗ ${f}의 rhizomeMd가 lib/markdown.js와 달라요`); fail++; }
  else console.log(`✓ ${f} 같음`);
}

const cases = [
  ["제목", "# 큰 제목\n## 작은", "<h2>큰 제목</h2>\n<h3>작은</h3>"],
  ["문단과 줄바꿈", "첫 줄\n둘째 줄\n\n새 문단", "<p>첫 줄<br>\n둘째 줄</p>\n<p>새 문단</p>"],
  ["강조", "**굵게** *기울임* ~~취소~~ `a<b>`", "<p><strong>굵게</strong> <em>기울임</em> <del>취소</del> <code>a&lt;b&gt;</code></p>"],
  ["snake_case 그대로", "file_name_here", "<p>file_name_here</p>"],
  ["곱셈 별표 그대로", "2 * 3 * 4", "<p>2 * 3 * 4</p>"],
  ["HTML은 글자로", "<script>alert(1)</script>", "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>"],
  ["위험한 링크 막기", "[x](javascript:alert(1))", "<p>x</p>"],
  ["엔티티로 숨긴 링크 막기", "[x](javascript&#58;alert(1))", "<p>x</p>"],
  ["링크", "[리좀](https://a.com \"t\")", '<p><a href="https://a.com" title="t" target="_blank" rel="noopener">리좀</a></p>'],
  ["링크 안 주소는 한 번만", "[https://a.com](https://a.com)", '<p><a href="https://a.com" target="_blank" rel="noopener">https://a.com</a></p>'],
  ["자동 링크", "보기: https://a.com/x.", '<p>보기: <a href="https://a.com/x" target="_blank" rel="noopener">https://a.com/x</a>.</p>'],
  ["이미지", "![고양이](https://a.com/c.png)", '<p><img src="https://a.com/c.png" alt="고양이" loading="lazy"></p>'],
  ["링크 속 이미지", "[![a](https://i.png)](https://b.com)", '<p><a href="https://b.com" target="_blank" rel="noopener"><img src="https://i.png" alt="a" loading="lazy"></a></p>'],
  ["목록", "- 하나\n- 둘\n  - 둘의 하나", "<ul>\n<li>하나</li>\n<li>둘\n<ul>\n<li>둘의 하나</li>\n</ul></li>\n</ul>"],
  ["번호 목록", "3. 셋\n4. 넷", '<ol start="3">\n<li>셋</li>\n<li>넷</li>\n</ol>'],
  ["할 일", "- [x] 끝\n- [ ] 남음", '<ul>\n<li class="task"><input type="checkbox" disabled checked> 끝</li>\n<li class="task"><input type="checkbox" disabled> 남음</li>\n</ul>'],
  ["인용 중첩", "> 바깥\n> > 안쪽", "<blockquote>\n<p>바깥</p>\n<blockquote>\n<p>안쪽</p>\n</blockquote>\n</blockquote>"],
  ["코드 블록", "```js\nconst a = '<b>';\n\n# 제목 아님\n```", '<pre><code class="language-js">const a = \'&lt;b&gt;\';\n\n# 제목 아님</code></pre>'],
  ["구분선", "위\n\n---\n\n아래", "<p>위</p>\n<hr>\n<p>아래</p>"],
  ["표", "| 이름 | 수 |\n|:--|--:|\n| a | 1 |", '<div class="table"><table>\n<thead><tr><th style="text-align:left">이름</th><th style="text-align:right">수</th></tr></thead>\n<tbody>\n<tr><td style="text-align:left">a</td><td style="text-align:right">1</td></tr>\n</tbody></table></div>'],
  ["빈 글", "", ""],
];
for (const [name, input, want] of cases) {
  const got = md(input);
  if (got === want) console.log(`✓ ${name}`);
  else { fail++; console.error(`✗ ${name}\n  입력: ${JSON.stringify(input)}\n  기대: ${JSON.stringify(want)}\n  결과: ${JSON.stringify(got)}`); }
}
process.exit(fail ? 1 : 0);
