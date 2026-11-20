// 리좀 마크다운 → HTML. 의존성 없음.
// 같은 함수가 세 곳에 있어요: lib/markdown.js(공개 API), public/admin/index.html(어드민 미리보기), public/index.html(웹진).
// 고칠 때는 세 곳을 같이 고치고 `node scripts/check-markdown.mjs`로 맞는지 확인하세요.
// 원칙: 글 안의 HTML 태그는 글자로 보여 줌(실행 안 함). 링크는 http(s)·mailto·tel·상대 주소만.
// 지원: # 제목(웹진에서는 한 단계 낮춰 h2부터), 문단(줄바꿈 유지), **굵게** *기울임* ~~취소선~~ `코드`,
//       ``` 코드 블록, > 인용(중첩), - / 1. 목록(중첩, - [ ] 할 일), --- 구분선, | 표 |, [링크](url), ![이미지](url), 주소 자동 링크

/* rhizome-md:start */
function rhizomeMd(src) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const safeUrl = u => {
    u = String(u || "").trim().replace(/^<([\s\S]*)>$/, "$1");
    const probe = u.replace(/&#x?[0-9a-f]+;?|&colon;?/gi, ":").replace(/[\s\x00-\x1f]/g, "").toLowerCase();
    return /^[a-z][a-z0-9+.-]*:/.test(probe) && !/^(https?|mailto|tel):/.test(probe) ? "" : u;
  };
  const inline = (s, inLink) => {
    const keep = [], put = h => "\u0000" + (keep.push(h) - 1) + "\u0000";
    s = s.replace(inLink ? /\u0000/g : /[\u0000\u0001]/g, "");
    s = s.replace(/\\([\\`*_{}\[\]()#+\-.!~|>])/g, (_, c) => put(esc(c)));
    s = s.replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g, (_, f, c) => put(`<code>${esc(c.replace(/^ ([\s\S]*) $/, "$1"))}</code>`));
    const target = String.raw`\(\s*(<[^>\n]*>|(?:[^\s()]|\([^\s()]*\))+)(?:\s+"([^"]*)")?\s*\)`;
    s = s.replace(new RegExp(String.raw`!\[([^\]]*)\]` + target, "g"), (_, alt, url, title) => {
      const u = safeUrl(url);
      return put(u ? `<img src="${esc(u)}" alt="${esc(alt)}"${title ? ` title="${esc(title)}"` : ""} loading="lazy">` : esc(alt));
    });
    const a = (u, title) => `<a href="${esc(u)}"${title ? ` title="${esc(title)}"` : ""}${/^https?:/i.test(u) ? ' target="_blank" rel="noopener"' : ""}>`;
    if (!inLink) {
      s = s.replace(new RegExp(String.raw`\[((?:[^\[\]]|\[[^\]]*\])+)\]` + target, "g"), (_, text, url, title) => {
        const u = safeUrl(url), t = inline(text.replace(/\u0000(\d+)\u0000/g, (_, i) => "\u0001" + i + "\u0001"), true).replace(/\u0001(\d+)\u0001/g, (_, i) => keep[i]);
        return u ? put(a(u, title) + t + "</a>") : put(t);
      });
      s = s.replace(/<((?:https?:\/\/|mailto:)[^\s<>]+)>/g, (_, u) => put(a(u) + esc(u.replace(/^mailto:/, "")) + "</a>"));
      s = s.replace(/\bhttps?:\/\/[^\s<>\u0000]*[^\s<>\u0000.,:;"')\]!?]/g, u => put(a(u) + esc(u) + "</a>"));
    }
    s = esc(s)
      .replace(/(\*\*\*|___)(?=\S)([\s\S]*?\S)\1/g, "<strong><em>$2</em></strong>")
      .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^\w])__(?=\S)([\s\S]*?\S)__(?!\w)/g, "$1<strong>$2</strong>")
      .replace(/\*(?=[^\s*])([^*]*?[^\s*]|[^\s*])\*/g, "<em>$1</em>")
      .replace(/(^|[^\w])_(?=[^\s_])([^_]*?[^\s_]|[^\s_])_(?!\w)/g, "$1<em>$2</em>")
      .replace(/~~(?=\S)([\s\S]*?\S)~~/g, "<del>$1</del>")
      .replace(/ {2,}\n|\\\n|\n/g, "<br>\n");
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[i]);
  };

  const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)[^`]*$/, HEAD = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/,
    HR = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/, QUOTE = /^ {0,3}>/, LI = /^( *)([-*+]|\d{1,9}[.)])(?:[ \t]+|$)/,
    TSEP = /^ *\|? *:?-+:? *(?:\| *:?-+:? *)*\|? *$/, SETEXT = /^ {0,3}(=+|-+)[ \t]*$/;
  const indentOf = l => l.match(/^ */)[0].length;
  const blank = l => /^\s*$/.test(l);
  const cells = row => {
    const out = []; let cur = "", tick = false;
    row = row.trim().replace(/^\|/, "").replace(/(^|[^\\])\|$/, "$1");
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === "\\" && row[i + 1] === "|") { cur += "|"; i++; continue; }
      if (c === "`") tick = !tick;
      if (c === "|" && !tick) { out.push(cur.trim()); cur = ""; } else cur += c;
    }
    out.push(cur.trim());
    return out;
  };
  const isTable = (ls, i) => ls[i].includes("|") && i + 1 < ls.length && ls[i + 1].includes("-") && TSEP.test(ls[i + 1]) && (ls[i + 1].includes("|") || cells(ls[i]).length > 1);
  const starts = (ls, i) => FENCE.test(ls[i]) || HEAD.test(ls[i]) || HR.test(ls[i]) || QUOTE.test(ls[i]) || LI.test(ls[i]) || isTable(ls, i);

  function list(ls, i) {
    const m0 = ls[i].match(LI), base = m0[1].length, ordered = /\d/.test(m0[2]);
    const items = []; let loose = false;
    while (i < ls.length) {
      const m = ls[i].match(LI);
      if (!m || m[1].length !== base || /\d/.test(m[2]) !== ordered) break;
      const pad = Math.min(m[0].length, base + 6);
      const body = [ls[i].slice(m[0].length)];
      i++;
      while (i < ls.length) {
        const l = ls[i];
        if (blank(l)) {
          let j = i; while (j < ls.length && blank(ls[j])) j++;
          if (j < ls.length && indentOf(ls[j]) > base && !(LI.test(ls[j]) && indentOf(ls[j]) <= base)) { for (; i < j; i++) body.push(""); loose = true; continue; }
          if (j < ls.length && LI.test(ls[j]) && indentOf(ls[j]) === base) loose = true;
          i = j; break;
        }
        if (indentOf(l) > base) { body.push(l.replace(new RegExp(`^ {0,${pad}}`), "")); i++; continue; }
        if (starts(ls, i)) break;
        if (blank(body[body.length - 1])) break;
        body.push(l); i++;
      }
      items.push(body);
      if (i < ls.length && blank(ls[i - 1]) && !(LI.test(ls[i]) && indentOf(ls[i]) === base)) break;
    }
    const start = ordered ? parseInt(m0[2], 10) : 1;
    const html = items.map(body => {
      let pre = "";
      const t = body[0].match(/^\[([ xX])\][ \t]+/);
      if (t) { pre = `<input type="checkbox" disabled${t[1] === " " ? "" : " checked"}> `; body[0] = body[0].slice(t[0].length); }
      return `<li${t ? ' class="task"' : ""}>${pre}${blocks(body, !loose)}</li>`;
    }).join("\n");
    const tag = ordered ? "ol" : "ul";
    return [`<${tag}${ordered && start !== 1 ? ` start="${start}"` : ""}>\n${html}\n</${tag}>`, i];
  }

  function blocks(ls, tight) {
    const out = []; let i = 0;
    while (i < ls.length) {
      const l = ls[i]; let m;
      if (blank(l)) { i++; continue; }
      if ((m = l.match(FENCE))) {
        const close = new RegExp(`^ {0,3}${m[1][0] === "`" ? "`" : "~"}{${m[1].length},}[ \\t]*$`), ind = indentOf(l), code = [];
        for (i++; i < ls.length && !close.test(ls[i]); i++) code.push(ls[i].replace(new RegExp(`^ {0,${ind}}`), ""));
        i++;
        out.push(`<pre><code${m[2] ? ` class="language-${esc(m[2])}"` : ""}>${esc(code.join("\n"))}</code></pre>`);
        continue;
      }
      if ((m = l.match(HEAD))) { const d = Math.min(m[1].length + 1, 6); out.push(`<h${d}>${inline(m[2] || "")}</h${d}>`); i++; continue; }
      if (HR.test(l)) { out.push("<hr>"); i++; continue; }
      if (QUOTE.test(l)) {
        const q = [];
        for (; i < ls.length && !blank(ls[i]) && (QUOTE.test(ls[i]) || !starts(ls, i)); i++) q.push(ls[i].replace(/^ {0,3}> ?/, ""));
        out.push(`<blockquote>\n${blocks(q)}\n</blockquote>`);
        continue;
      }
      if (LI.test(l) && !(LI.exec(l)[0].trim() === l.trim() && blank(ls[i + 1] || ""))) { const [h, j] = list(ls, i); out.push(h); i = j; continue; }
      if (isTable(ls, i)) {
        const head = cells(ls[i]), al = cells(ls[i + 1]).map(c => /^:-+:$/.test(c) ? "center" : /-:$/.test(c) ? "right" : /^:-/.test(c) ? "left" : "");
        const td = (tag, c, k) => `<${tag}${al[k] ? ` style="text-align:${al[k]}"` : ""}>${inline(c)}</${tag}>`;
        const rows = [];
        for (i += 2; i < ls.length && !blank(ls[i]) && ls[i].includes("|"); i++) rows.push(cells(ls[i]));
        out.push(`<div class="table"><table>\n<thead><tr>${head.map((c, k) => td("th", c, k)).join("")}</tr></thead>\n<tbody>\n${rows.map(r => `<tr>${head.map((_, k) => td("td", r[k] || "", k)).join("")}</tr>`).join("\n")}\n</tbody></table></div>`);
        continue;
      }
      const para = [l.trim()];
      for (i++; i < ls.length && !blank(ls[i]); i++) {
        if ((m = ls[i].match(SETEXT))) break;
        if (starts(ls, i) && !(LI.test(ls[i]) && /^\d/.test(ls[i].trim()) && !/^1[.)]/.test(ls[i].trim()))) break;
        para.push(ls[i].trim());
      }
      if (i < ls.length && (m = ls[i].match(SETEXT))) { const d = m[1][0] === "=" ? 2 : 3; out.push(`<h${d}>${inline(para.join("\n"))}</h${d}>`); i++; continue; }
      out.push(tight ? inline(para.join("\n")) : `<p>${inline(para.join("\n"))}</p>`);
    }
    return out.join("\n");
  }

  const lines = String(src ?? "").replace(/\r\n?/g, "\n").replace(/^\t+/gm, t => "    ".repeat(t.length)).split("\n");
  return blocks(lines);
}
/* rhizome-md:end */

export { rhizomeMd };
