const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const KEYWORDS = "import|export|from|default|function|return|const|let|var|async|await|type|interface|extends|if|else|new|for|of|in|as|null|undefined|true|false|typeof|class";

const TS = new RegExp(
  [
    "(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)", // 1 comment
    "(\"(?:\\\\.|[^\"\\\\\\n])*\"|'(?:\\\\.|[^'\\\\\\n])*'|`(?:\\\\.|[^`\\\\])*`)", // 2 string
    `\\b(${KEYWORDS})\\b`, // 3 keyword
    "(<\\/?[A-Za-z][\\w.]*)", // 4 jsx tag
    "\\b(\\d+(?:\\.\\d+)?)\\b", // 5 number
    "\\b([A-Z][A-Za-z0-9_]*)\\b", // 6 type / component
  ].join("|"),
  "g",
);

const CSS = /(\/\*[\s\S]*?\*\/)|("[^"]*"|'[^']*')|(@[\w-]+)|(#[0-9a-fA-F]{3,8}\b)|(\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw)?\b)|([a-z-]+)(?=\s*:)/g;
const JSON_RE = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\b\d+(?:\.\d+)?\b)/g;

export function highlight(code: string, path: string): string {
  const ext = path.split(".").pop() ?? "";
  if (ext === "json") {
    return code.split("\n").map((line) => {
      let out = ""; let last = 0;
      for (const m of line.matchAll(JSON_RE)) {
        out += esc(line.slice(last, m.index));
        if (m[1] && m[2]) out += `<i class="tk-prop">${esc(m[1])}</i>${esc(m[2])}`;
        else if (m[1]) out += `<i class="tk-str">${esc(m[1])}</i>`;
        else if (m[3]) out += `<i class="tk-kw">${m[3]}</i>`;
        else out += `<i class="tk-num">${m[4]}</i>`;
        last = (m.index ?? 0) + m[0].length;
      }
      return out + esc(line.slice(last));
    }).join("\n");
  }
  if (ext === "md") {
    return code.split("\n").map((l) => (/^#/.test(l) ? `<i class="tk-kw">${esc(l)}</i>` : /^\s*[-*\d.]+\s/.test(l) ? `<i class="tk-str">${esc(l)}</i>` : esc(l))).join("\n");
  }
  const re = ext === "css" ? CSS : TS;
  let out = "";
  let last = 0;
  for (const m of code.matchAll(re)) {
    out += esc(code.slice(last, m.index));
    const text = esc(m[0]);
    if (ext === "css") {
      const cls = m[1] ? "tk-com" : m[2] ? "tk-str" : m[3] ? "tk-kw" : m[4] || m[5] ? "tk-num" : "tk-prop";
      out += `<i class="${cls}">${text}</i>`;
    } else {
      const cls = m[1] ? "tk-com" : m[2] ? "tk-str" : m[3] ? "tk-kw" : m[4] ? "tk-tag" : m[5] ? "tk-num" : "tk-type";
      out += `<i class="${cls}">${text}</i>`;
    }
    last = (m.index ?? 0) + m[0].length;
  }
  return out + esc(code.slice(last));
}
