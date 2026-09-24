"use client";

import { useEffect, useMemo, useRef } from "react";
import { diffLines, withContext, type DiffLine } from "@/lib/diff";
import { highlight } from "@/lib/highlight";
import { cn } from "@/lib/utils";

const LINE_H = 20;

export function CodeEditor({ path, value, onChange, revealLine, onCursor, readOnly }: {
  path: string; value: string; onChange: (v: string) => void; revealLine?: { line: number; nonce: number } | null; onCursor?: (line: number, col: number) => void; readOnly?: boolean;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const html = useMemo(() => highlight(value, path) + "\n", [value, path]);
  const lines = useMemo(() => value.split("\n").length, [value]);

  useEffect(() => {
    if (!revealLine || !scroller.current) return;
    scroller.current.scrollTo({ top: Math.max(0, (revealLine.line - 4) * LINE_H), behavior: "smooth" });
  }, [revealLine]);

  const cursor = () => {
    const el = area.current; if (!el || !onCursor) return;
    const before = el.value.slice(0, el.selectionStart);
    const parts = before.split("\n");
    onCursor(parts.length, parts[parts.length - 1].length + 1);
  };

  return (
    <div className="code-scroll" ref={scroller}>
      <div className="code-grid" style={{ ["--lh" as string]: `${LINE_H}px` }}>
        <div className="code-gutter" aria-hidden>{Array.from({ length: lines }, (_, i) => <span key={i} className={cn(revealLine?.line === i + 1 && "hot")}>{i + 1}</span>)}</div>
        <div className="code-body">
          {revealLine && <div key={revealLine.nonce} className="code-flash" style={{ top: (revealLine.line - 1) * LINE_H + 12 }} />}
          <pre aria-hidden dangerouslySetInnerHTML={{ __html: html }} />
          <textarea
            ref={area} value={value} spellCheck={false} wrap="off" readOnly={readOnly} aria-label={`Edit ${path}`}
            onChange={(e) => onChange(e.target.value)}
            onKeyUp={cursor} onClick={cursor} onSelect={cursor}
            onKeyDown={(e) => {
              if (e.key === "Tab" && !e.shiftKey) {
                e.preventDefault();
                const el = e.currentTarget; const s = el.selectionStart;
                onChange(el.value.slice(0, s) + "  " + el.value.slice(el.selectionEnd));
                requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function DiffView({ before, after, path, compact }: { before: string; after: string; path: string; compact?: boolean }) {
  const rows = useMemo(() => withContext(diffLines(before, after), compact ? 1 : 3), [before, after, compact]);
  const changed = rows.some((r) => r.type === "add" || r.type === "del");
  if (!changed) return <div className="diff-empty">No differences in {path}.</div>;
  return (
    <div className={cn("diff", compact && "compact")} role="table" aria-label={`Diff for ${path}`}>
      {rows.map((r, i) => r.type === "gap"
        ? <div key={i} className="diff-gap" role="row">⋯ {r.count} unchanged {r.count === 1 ? "line" : "lines"}</div>
        : <DiffRow key={i} r={r as DiffLine} />)}
    </div>
  );
}

function DiffRow({ r }: { r: DiffLine }) {
  return (
    <div className={cn("diff-row", r.type)} role="row">
      <span className="diff-n">{r.a ?? ""}</span><span className="diff-n">{r.b ?? ""}</span>
      <span className="diff-sign" aria-label={r.type === "add" ? "added" : r.type === "del" ? "removed" : "unchanged"}>{r.type === "add" ? "+" : r.type === "del" ? "−" : " "}</span>
      <code>{r.text || " "}</code>
    </div>
  );
}
