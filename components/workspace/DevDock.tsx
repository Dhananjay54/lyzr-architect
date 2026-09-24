"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Check, ChevronDown, Eye, FileDiff, GitCompare, Loader2, Play, Terminal, Wand2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Empty, Segmented, Status, StepGlyph } from "@/components/ui/bits";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { roleAgents } from "@/lib/catalog";
import { diffLines, diffStat } from "@/lib/diff";
import { simulateCheck, type CheckKind, type CheckLine, type CheckResult } from "@/lib/engine";
import { useApp } from "@/lib/store";
import type { Project } from "@/lib/types";
import { ago, cn } from "@/lib/utils";
import { DiffView } from "./CodeEditor";

export type DockPanel = "changes" | "run" | "agent";

type Props = { project: Project; panel: DockPanel; onPanel: (p: DockPanel) => void; onOpenFile: (path: string, line?: number) => void; onViewDiff: (path: string) => void };

/* ---------- Changes ---------- */

function ChangesPanel({ project, onViewDiff }: Props) {
  const { acceptFile, discardFile, acceptChangeSet, discardChangeSet } = useApp();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const pending = project.files.filter((f) => f.content !== f.base);
  const proposals = project.changeSets.filter((c) => c.status === "proposed");
  const history = project.changeSets.filter((c) => c.status !== "proposed").slice(0, 6);
  const total = pending.length + proposals.length;

  return (
    <div className="dock-body">
      <div className="dock-toolbar">
        <b>{total ? `${total} ${total === 1 ? "change" : "changes"} to review` : "Nothing to review"}</b>
        {pending.length > 1 && (
          <span className="row tight"><Button size="sm" onClick={() => { pending.forEach((f) => acceptFile(project.id, f.path)); toast.success(`Accepted ${pending.length} edits`); }}><Check size={13} /> Accept all edits</Button><Button size="sm" onClick={() => { pending.forEach((f) => discardFile(project.id, f.path)); toast(`Discarded ${pending.length} edits`); }}><X size={13} /> Discard all</Button></span>
        )}
      </div>

      {total === 0 && <Empty icon={<GitCompare size={20} />} title="All caught up" body="Edit a file, add a dependency, or ask an agent for a change. Each one shows up here as a before/after diff." />}

      {proposals.map((c) => (
        <motion.div key={c.id} layout className="change-card proposal">
          <div className="change-head">
            <button className="change-title" aria-expanded={!!open[c.id]} onClick={() => setOpen({ ...open, [c.id]: !open[c.id] })}><ChevronDown size={14} style={{ transform: open[c.id] ? "rotate(180deg)" : undefined }} /><b>{c.title}</b></button>
            <Status tone="accent" dot={false}><Bot size={11} /> {c.source} · proposed</Status>
            <span className="spacer" />
            <Button size="sm" variant="primary" onClick={() => { acceptChangeSet(project.id, c.id); toast.success(`Applied “${c.title}”`); }}><Check size={13} /> Accept</Button>
            <Button size="sm" onClick={() => { discardChangeSet(project.id, c.id); toast(`Discarded “${c.title}”`); }}><X size={13} /> Discard</Button>
          </div>
          <p className="change-sum">{c.summary} · {c.patches.length} {c.patches.length === 1 ? "file" : "files"}. Nothing is applied until you accept.</p>
          <AnimatePresence initial={false}>
            {open[c.id] && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                {c.patches.map((p) => <div key={p.path} className="patch"><div className="patch-head"><span className="mono">{p.path}</span><Status tone={p.before === null ? "success" : "accent"} dot={false}>{p.before === null ? "New file" : "Modified"}</Status></div><DiffView before={p.before ?? ""} after={p.after} path={p.path} compact /></div>)}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      {pending.map((f) => {
        const st = diffStat(diffLines(f.base, f.content));
        return (
          <motion.div key={f.path} layout className="change-card">
            <div className="change-head">
              <button className="change-title" aria-expanded={!!open[f.path]} onClick={() => setOpen({ ...open, [f.path]: !open[f.path] })}><ChevronDown size={14} style={{ transform: open[f.path] ? "rotate(180deg)" : undefined }} /><span className="mono">{f.path}</span></button>
              <span className="diffstat"><i className="add">+{st.added}</i><i className="del">−{st.removed}</i></span>
              <span className="spacer" />
              <Button size="sm" onClick={() => onViewDiff(f.path)}><Eye size={13} /> View in editor</Button>
              <Button size="sm" variant="primary" onClick={() => { acceptFile(project.id, f.path); toast.success(`Accepted ${f.path}`); }}><Check size={13} /> Accept</Button>
              <Button size="sm" onClick={() => { discardFile(project.id, f.path); toast(`Discarded edits to ${f.path}`); }}><X size={13} /> Discard</Button>
            </div>
            <AnimatePresence initial={false}>
              {open[f.path] && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}><DiffView before={f.base} after={f.content} path={f.path} compact /></motion.div>}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {history.length > 0 && (
        <>
          <div className="section-label">History · UI-level, not Git</div>
          <ul className="mini-list">{history.map((c) => <li key={c.id}><FileDiff size={12} /><span>{c.title}<small>{c.source} · {c.status} · {ago(c.createdAt)}</small></span></li>)}</ul>
        </>
      )}
    </div>
  );
}

/* ---------- Run ---------- */

type Line = CheckLine & { key: string };

function RunPanel({ project, onOpenFile }: Props) {
  const [outcome, setOutcome] = useState<"pass" | "fail">("pass");
  const [lines, setLines] = useState<Line[]>([]);
  const [results, setResults] = useState<Partial<Record<CheckKind, CheckResult>>>({});
  const [running, setRunning] = useState<CheckKind | null>(null);
  const timers = useRef<number[]>([]);
  const term = useRef<HTMLDivElement>(null);
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  useEffect(() => { term.current?.scrollTo({ top: term.current.scrollHeight }); }, [lines.length]);

  const runKinds = (kinds: CheckKind[]) => {
    timers.current.forEach(window.clearTimeout); timers.current = [];
    setLines([]); setResults({});
    let t = 0;
    kinds.forEach((kind) => {
      const res = simulateCheck(kind, project.files, outcome);
      timers.current.push(window.setTimeout(() => setRunning(kind), t));
      res.lines.forEach((l, i) => timers.current.push(window.setTimeout(() => setLines((prev) => [...prev, { ...l, key: `${kind}${i}${Date.now()}` }]), t + 250 + i * 260)));
      t += 250 + res.lines.length * 260 + 250;
      timers.current.push(window.setTimeout(() => { setResults((r) => ({ ...r, [kind]: res })); setLines((prev) => [...prev, { key: `${kind}-done`, text: res.ok ? `✔ ${kind} passed in ${(res.ms / 1000).toFixed(1)}s` : `✖ ${kind} failed`, tone: res.ok ? "ok" : "err" }, { key: `${kind}-sp`, text: "" }]); }, t));
      t += 120;
    });
    timers.current.push(window.setTimeout(() => setRunning(null), t + 50));
  };

  const kinds: { k: CheckKind; label: string }[] = [{ k: "lint", label: "Lint" }, { k: "types", label: "Type check" }, { k: "build", label: "Build" }];
  return (
    <div className="dock-body run">
      <div className="dock-toolbar">
        <span className="row tight">{kinds.map(({ k, label }) => <Button key={k} size="sm" disabled={!!running} onClick={() => runKinds([k])}>{running === k ? <Loader2 size={13} className="spin" /> : <Play size={13} />} {label}</Button>)}<Button size="sm" variant="primary" disabled={!!running} onClick={() => runKinds(["lint", "types", "build"])}>{running ? <Loader2 size={13} className="spin" /> : <Play size={13} />} Run all</Button></span>
        <span className="spacer" />
        <label className="muted small">Outcome</label>
        <Segmented label="Simulated outcome" value={outcome} onChange={setOutcome} options={[{ value: "pass", label: "Pass" }, { value: "fail", label: "Fail" }]} />
      </div>
      <div className="run-chips">{kinds.map(({ k, label }) => { const r = results[k]; return <Status key={k} tone={!r ? "neutral" : r.ok ? "success" : "danger"} busy={running === k} dot={false}>{r ? (r.ok ? <Check size={11} /> : <X size={11} />) : null} {label}{r ? (r.ok ? " passed" : " failed") : ""}</Status>; })}<small className="muted">Simulated output. No code is executed.</small></div>
      <div className="terminal" ref={term} role="log" aria-live="polite">
        {lines.length === 0 && <div className="term-empty"><Terminal size={16} /> Run a check to see simulated output. Choose “Fail” to see errors that link to a file and line.</div>}
        {lines.map((l) => l.file ? <button key={l.key} className={cn("term-line link", l.tone)} onClick={() => onOpenFile(l.file!, l.line)}>{l.text}</button> : <div key={l.key} className={cn("term-line", l.tone)}>{l.text || " "}</div>)}
      </div>
    </div>
  );
}

/* ---------- Agents ---------- */

function AgentPanel({ project, onPanel }: Props) {
  const { runAgent } = useApp();
  const [agent, setAgent] = useState("frontend");
  const [task, setTask] = useState("");
  const def = roleAgents.find((a) => a.id === agent)!;
  const runs = project.agentRuns;
  const suggestion = useMemo(() => def.tasks[0], [def]);
  return (
    <div className="dock-body">
      <div className="agent-invoke">
        <select value={agent} onChange={(e) => { setAgent(e.target.value); setTask(""); }} aria-label="Agent">{roleAgents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <input value={task} onChange={(e) => setTask(e.target.value)} placeholder={suggestion} aria-label="Technical task" onKeyDown={(e) => { if (e.key === "Enter") { runAgent(project.id, agent, task.trim() || suggestion); setTask(""); } }} />
        <Button variant="primary" size="sm" onClick={() => { runAgent(project.id, agent, task.trim() || suggestion); setTask(""); toast(`${def.name} started`, { description: "Proposed changes will appear in Changes." }); }}><Wand2 size={13} /> Ask agent</Button>
      </div>
      <div className="chips">{def.tasks.map((t) => <button key={t} className="chip" onClick={() => setTask(t)}>{t}</button>)}</div>
      {runs.length === 0 ? <Empty icon={<Bot size={20} />} title="No agent runs yet" body="Give an agent a technical task. It shows its steps and proposes file changes for you to accept." /> : (
        <ul className="run-list">
          {runs.map((r) => (
            <li key={r.id}>
              <StepGlyph state={r.state === "working" || r.state === "queued" ? "active" : r.state === "needs-input" ? "error" : "done"} />
              <span><b>{roleAgents.find((a) => a.id === r.agentId)?.name}</b> <small>{r.task}</small><em>{r.state === "working" ? r.log.at(-1)?.text ?? "Working…" : r.summary}</em></span>
              {r.changeSetId && project.changeSets.find((c) => c.id === r.changeSetId)?.status === "proposed" && <Button size="sm" onClick={() => onPanel("changes")}>Review proposal</Button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DevDock(props: Props) {
  const pending = props.project.files.filter((f) => f.content !== f.base).length + props.project.changeSets.filter((c) => c.status === "proposed").length;
  const working = props.project.agentRuns.filter((r) => r.state === "working" || r.state === "queued").length;
  return (
    <Tabs value={props.panel} onValueChange={(v) => props.onPanel(v as DockPanel)} className="dock" data-tour="composer">
      <TabsList label="Developer panels">
        <TabsTrigger value="changes" count={pending || undefined}>Changes</TabsTrigger>
        <TabsTrigger value="run">Run</TabsTrigger>
        <TabsTrigger value="agent" count={working || undefined}>Agents</TabsTrigger>
      </TabsList>
      <TabsContent value="changes"><ChangesPanel {...props} /></TabsContent>
      <TabsContent value="run"><RunPanel {...props} /></TabsContent>
      <TabsContent value="agent"><AgentPanel {...props} /></TabsContent>
    </Tabs>
  );
}
