import type { Workflow } from "./types";

export const STAGE = { w: 1180, h: 520 };
export const NODE = { w: 164, h: 70 };
export type Pt = { x: number; y: number };
export type LayoutKind = "flow" | "orchestra";

/** Longest-path depth of each node from the trigger. Used for columns and for the run order. */
export function depths(wf: Workflow): Record<string, number> {
  const d: Record<string, number> = {};
  const incoming = (id: string) => wf.edges.filter((e) => e.to === id).map((e) => e.from);
  const visit = (id: string, seen: Set<string>): number => {
    if (d[id] !== undefined) return d[id];
    if (seen.has(id)) return 0;
    seen.add(id);
    const parents = incoming(id);
    d[id] = parents.length ? Math.max(...parents.map((p) => visit(p, seen))) + 1 : 0;
    return d[id];
  };
  wf.nodes.forEach((n) => visit(n.id, new Set()));
  return d;
}

export function levels(wf: Workflow): string[][] {
  const d = depths(wf);
  const max = Math.max(0, ...Object.values(d));
  return Array.from({ length: max + 1 }, (_, i) => wf.nodes.filter((n) => d[n.id] === i).map((n) => n.id));
}

export function flowLayout(wf: Workflow): Record<string, Pt> {
  const cols = levels(wf);
  const padX = NODE.w / 2 + 14;
  const stepX = cols.length > 1 ? (STAGE.w - padX * 2) / (cols.length - 1) : 0;
  const out: Record<string, Pt> = {};
  cols.forEach((ids, c) => {
    const gap = STAGE.h / (ids.length + 1);
    ids.forEach((id, r) => { out[id] = { x: padX + c * stepX, y: gap * (r + 1) }; });
  });
  return out;
}

export function orchestraLayout(wf: Workflow): Record<string, Pt> {
  const cx = STAGE.w / 2;
  const cy = STAGE.h / 2;
  const out: Record<string, Pt> = {};
  const orch = wf.nodes.find((n) => n.kind === "orchestrator");
  const trig = wf.nodes.filter((n) => n.kind === "trigger");
  const outs = wf.nodes.filter((n) => n.kind === "output");
  const rest = wf.nodes.filter((n) => n !== orch && !trig.includes(n) && !outs.includes(n));
  if (orch) out[orch.id] = { x: cx, y: cy };
  trig.forEach((n, i) => { out[n.id] = { x: NODE.w / 2 + 14, y: cy + (i - (trig.length - 1) / 2) * 90 }; });
  outs.forEach((n, i) => { out[n.id] = { x: STAGE.w - NODE.w / 2 - 14, y: cy + (i - (outs.length - 1) / 2) * 90 }; });
  // Specialists sit on a top arc (left to right) and a bottom arc (right to left), clear of the trigger and output.
  const rx = 370;
  const ry = 200;
  const top = rest.slice(0, Math.ceil(rest.length / 2));
  const bottom = rest.slice(top.length).reverse();
  const place = (list: typeof rest, from: number, to: number) => list.forEach((n, i) => {
    const a = (from + ((i + 0.5) * (to - from)) / list.length) * (Math.PI / 180);
    out[n.id] = { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry };
  });
  place(top, -155, -25);
  place(bottom, 25, 155);
  return out;
}

export const layoutFor = (wf: Workflow, kind: LayoutKind) => (kind === "flow" ? flowLayout(wf) : orchestraLayout(wf));

export type Bezier = { s: Pt; c1: Pt; c2: Pt; t: Pt };

export function bezier(a: Pt, b: Pt): Bezier {
  const mx = (a.x + b.x) / 2;
  return { s: a, c1: { x: mx, y: a.y }, c2: { x: mx, y: b.y }, t: b };
}

export const bezierPath = (b: Bezier) => `M ${b.s.x} ${b.s.y} C ${b.c1.x} ${b.c1.y}, ${b.c2.x} ${b.c2.y}, ${b.t.x} ${b.t.y}`;

export function pointAt(b: Bezier, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * u * b.s.x + 3 * u * u * t * b.c1.x + 3 * u * t * t * b.c2.x + t * t * t * b.t.x,
    y: u * u * u * b.s.y + 3 * u * u * t * b.c1.y + 3 * u * t * t * b.c2.y + t * t * t * b.t.y,
  };
}

/** Point where the curve leaves the target node's box, and the direction there (for an arrowhead). */
export function arrowAt(b: Bezier) {
  const inside = (p: Pt) => Math.abs(p.x - b.t.x) < NODE.w / 2 + 6 && Math.abs(p.y - b.t.y) < NODE.h / 2 + 6;
  let t = 1;
  while (t > 0.05 && inside(pointAt(b, t))) t -= 0.02;
  const p = pointAt(b, t);
  const q = pointAt(b, Math.min(1, t + 0.03));
  return { p, angle: (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI };
}

export function samplePath(b: Bezier, n = 14): Pt[] {
  return Array.from({ length: n }, (_, i) => pointAt(b, i / (n - 1)));
}
