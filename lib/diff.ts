export type DiffLine = { type: "eq" | "add" | "del"; text: string; a?: number; b?: number };

/** Line-level diff using an LCS table. Files here are small, so O(n*m) is fine. */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before === "" ? [] : before.split("\n");
  const b = after === "" ? [] : after.split("\n");
  const n = a.length;
  const m = b.length;
  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ type: "eq", text: a[i], a: i + 1, b: j + 1 }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: "del", text: a[i], a: i + 1 }); i++; }
    else { out.push({ type: "add", text: b[j], b: j + 1 }); j++; }
  }
  while (i < n) { out.push({ type: "del", text: a[i], a: i + 1 }); i++; }
  while (j < m) { out.push({ type: "add", text: b[j], b: j + 1 }); j++; }
  return out;
}

export function diffStat(lines: DiffLine[]) {
  return { added: lines.filter((l) => l.type === "add").length, removed: lines.filter((l) => l.type === "del").length };
}

/** Collapse long unchanged runs to a few lines of context. */
export function withContext(lines: DiffLine[], context = 2): (DiffLine | { type: "gap"; count: number })[] {
  const keep = new Array(lines.length).fill(false);
  lines.forEach((l, idx) => {
    if (l.type === "eq") return;
    for (let k = Math.max(0, idx - context); k <= Math.min(lines.length - 1, idx + context); k++) keep[k] = true;
  });
  const out: (DiffLine | { type: "gap"; count: number })[] = [];
  let skipped = 0;
  lines.forEach((l, idx) => {
    if (keep[idx]) {
      if (skipped) { out.push({ type: "gap", count: skipped }); skipped = 0; }
      out.push(l);
    } else skipped++;
  });
  if (skipped) out.push({ type: "gap", count: skipped });
  return out;
}
