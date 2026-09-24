"use client";

import { motion } from "framer-motion";
import { Bot, Check, Flag, Loader2, Plug, ShieldCheck, Workflow, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ConnectorMark } from "@/components/ui/bits";
import { connectors } from "@/lib/catalog";
import type { Workflow as Wf, WorkflowNodeKind } from "@/lib/types";
import { NODE, STAGE, arrowAt, bezier, bezierPath, layoutFor, samplePath, type LayoutKind } from "@/lib/workflow-layout";
import { cn } from "@/lib/utils";

export type NodeRun = "idle" | "working" | "done";

const KIND_ICON: Record<WorkflowNodeKind, React.ReactNode> = {
  trigger: <Zap size={14} />, orchestrator: <Workflow size={14} />, agent: <Bot size={14} />,
  tool: <Plug size={14} />, review: <ShieldCheck size={14} />, output: <Flag size={14} />,
};

export function WorkflowCanvas({ workflow, layout, run, activeEdges, selectedId, onSelect, runKey }: {
  workflow: Wf; layout: LayoutKind; run: Record<string, NodeRun>; activeEdges: Set<string>; selectedId: string | null; onSelect: (id: string | null) => void; runKey: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const measure = () => setScale(Math.min(1, el.clientWidth / STAGE.w));
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pos = useMemo(() => layoutFor(workflow, layout), [workflow, layout]);
  const edges = useMemo(() => workflow.edges.filter((e) => pos[e.from] && pos[e.to]).map((e) => ({ ...e, id: `${e.from}>${e.to}`, b: bezier(pos[e.from], pos[e.to]) })), [workflow.edges, pos]);
  const toolMark = (id: string) => connectors.find((c) => c.id === id);

  return (
    <div className="wf-canvas" ref={wrap} style={{ height: STAGE.h * scale }} role="group" aria-label="Agent workflow diagram">
      <div className="wf-stage" style={{ width: STAGE.w, height: STAGE.h, transform: `scale(${scale})` }}>
        <svg className="wf-edges" width={STAGE.w} height={STAGE.h} viewBox={`0 0 ${STAGE.w} ${STAGE.h}`} aria-hidden>
          {edges.map((e) => {
            const hot = activeEdges.has(e.id);
            const done = run[e.to] === "done" || run[e.to] === "working";
            const a = arrowAt(e.b);
            const pts = samplePath(e.b);
            return (
              <g key={e.id} className={cn("wf-edge", hot && "hot", done && "seen")}>
                <motion.path initial={false} animate={{ d: bezierPath(e.b) }} transition={{ type: "spring", stiffness: 120, damping: 20 }} fill="none" />
                <motion.g initial={false} animate={{ x: a.p.x, y: a.p.y, rotate: a.angle }} transition={{ type: "spring", stiffness: 120, damping: 20 }}>
                  <path d="M-6,-4.5 L3,0 L-6,4.5 z" className="wf-arrow" />
                </motion.g>
                {e.label && <text x={(e.b.s.x + e.b.t.x) / 2} y={(e.b.s.y + e.b.t.y) / 2 - 8} textAnchor="middle" className="wf-edge-label">{e.label}</text>}
                {hot && (
                  <motion.circle key={`${e.id}-${runKey}`} r={5} className="wf-packet"
                    initial={{ cx: pts[0].x, cy: pts[0].y, opacity: 0 }}
                    animate={{ cx: pts.map((p) => p.x), cy: pts.map((p) => p.y), opacity: [0, 1, 1, 1, 0] }}
                    transition={{ duration: 0.95, repeat: Infinity, ease: "easeInOut" }} />
                )}
              </g>
            );
          })}
        </svg>
        {workflow.nodes.map((n) => {
          const p = pos[n.id]; if (!p) return null;
          const st = run[n.id] ?? "idle";
          return (
            <motion.button
              key={n.id}
              type="button"
              className={cn("wf-node", `k-${n.kind}`, st, selectedId === n.id && "selected")}
              style={{ width: NODE.w, height: NODE.h }}
              initial={false}
              animate={{ x: p.x - NODE.w / 2, y: p.y - NODE.h / 2, scale: st === "working" ? 1.04 : 1 }}
              transition={{ type: "spring", stiffness: 140, damping: 20 }}
              onClick={() => onSelect(selectedId === n.id ? null : n.id)}
              aria-pressed={selectedId === n.id}
              aria-label={`${n.label}, ${n.role}${st === "working" ? ", working" : st === "done" ? ", done" : ""}`}
            >
              <span className="wf-icon">{KIND_ICON[n.kind]}</span>
              <span className="wf-text"><b>{n.label}</b><small>{n.role}</small></span>
              <span className="wf-state" aria-hidden>{st === "working" ? <Loader2 size={13} className="spin" /> : st === "done" ? <Check size={13} /> : null}</span>
              {n.tools.length > 0 && <span className="wf-tools">{n.tools.map((t) => { const c = toolMark(t); return c ? <ConnectorMark key={t} mark={c.mark} hue={c.hue} size={18} /> : null; })}</span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/** A small static illustration of a workflow, used on cards. */
export function MiniFlow({ workflow, layout = "flow" }: { workflow: Wf; layout?: LayoutKind }) {
  const pos = useMemo(() => layoutFor(workflow, layout), [workflow, layout]);
  const fill: Record<WorkflowNodeKind, string> = { trigger: "var(--m-trigger)", orchestrator: "var(--accent)", agent: "var(--m-agent)", tool: "var(--m-tool)", review: "var(--m-review)", output: "var(--success)" };
  return (
    <svg className="miniflow" viewBox={`0 0 ${STAGE.w} ${STAGE.h}`} role="img" aria-label={`${workflow.name} diagram`}>
      {workflow.edges.map((e) => pos[e.from] && pos[e.to] ? <path key={`${e.from}${e.to}`} d={bezierPath(bezier(pos[e.from], pos[e.to]))} className="mf-edge" /> : null)}
      {workflow.nodes.map((n, i) => pos[n.id] ? (
        <g key={n.id}>
          <rect x={pos[n.id].x - NODE.w / 2} y={pos[n.id].y - NODE.h / 2} width={NODE.w} height={NODE.h} rx={16} className="mf-node" style={{ ["--f" as string]: fill[n.kind], animationDelay: `${i * 0.18}s` }} />
          <rect x={pos[n.id].x - NODE.w / 2 + 16} y={pos[n.id].y - 6} width={n.kind === "orchestrator" ? 96 : 72} height={12} rx={6} className="mf-line" />
        </g>
      ) : null)}
    </svg>
  );
}
