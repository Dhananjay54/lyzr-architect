"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Clock, GitCompare, Plus, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useShell } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";
import { Empty, Segmented, Spotlight, Status, StepGlyph, type Tone } from "@/components/ui/bits";
import { Sheet } from "@/components/ui/overlay";
import { connectors, roleAgents, workflows as samples } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import type { AgentRun, AgentRunState, Project } from "@/lib/types";
import { ago, clock } from "@/lib/utils";
import { MiniFlow } from "./WorkflowCanvas";

const RUN_TONE: Record<AgentRunState, { tone: Tone; label: string }> = {
  queued: { tone: "neutral", label: "Queued" }, working: { tone: "accent", label: "Working" },
  complete: { tone: "success", label: "Complete" }, "needs-input": { tone: "warn", label: "Needs input" },
};

type Row = { run: AgentRun; project: Project };

export function AgentsPage() {
  const router = useRouter();
  const { state, resumeRun, setMode } = useApp();
  const { openDialog, setFocus } = useShell();
  const [filter, setFilter] = useState<"all" | AgentRunState>("all");
  const [open, setOpen] = useState<Row | null>(null);

  const rows = useMemo<Row[]>(() => state.projects.flatMap((p) => p.agentRuns.map((run) => ({ run, project: p }))).sort((a, b) => b.run.startedAt.localeCompare(a.run.startedAt)), [state.projects]);
  const shown = rows.filter((r) => filter === "all" || r.run.state === filter);
  const live = open ? rows.find((r) => r.run.id === open.run.id) ?? open : null;
  const saved = state.workflows;

  const review = (row: Row) => {
    setOpen(null);
    setMode(row.project.id, "developer");
    router.push(`/project/${row.project.id}`);
    setFocus({ panel: "changes" });
  };

  return (
    <div className="page">
      <div className="page-head">
        <div><p className="eyebrow">Agents</p><h1>Delegate the work. See how it gets done.</h1><p className="lede">Build an orchestra of agents for a repeatable job, or assign a specialist to a task in one of your projects. Every run shows its steps and proposes changes before anything is applied.</p></div>
        <div className="row"><Button onClick={() => openDialog({ kind: "agentTask" })}><Wand2 size={15} /> Assign a task</Button><Button variant="primary" onClick={() => router.push("/agents/new")}><Plus size={15} /> Build an agent</Button></div>
      </div>

      <section className="section">
        <div className="section-head"><h2>Agent workflows</h2><Link href="/agents/new" className="linkish">Start a new one <ArrowRight size={13} /></Link></div>
        <div className="grid-cards">
          {[...saved, ...samples.filter((s) => !saved.some((w) => w.id === s.id))].slice(0, 6).map((w) => (
            <Spotlight key={w.id} as={Link} href={`/agents/${w.id}`} className="project-card wf-card">
              <div className="wf-mini"><MiniFlow workflow={w} /></div>
              <div className="pc-body">
                <div className="pc-top"><h3>{w.name}</h3>{w.saved ? <Status tone={w.deployedUrl ? "info" : "success"}>{w.deployedUrl ? "Deployed" : "Saved"}</Status> : <span className="tag">Sample</span>}</div>
                <p>{w.summary}</p>
                <div className="pc-meta"><span>{w.nodes.filter((n) => n.kind === "agent").length} specialists</span><span className="dots">{Array.from(new Set(w.nodes.flatMap((n) => n.tools))).map((c) => connectors.find((x) => x.id === c)?.name).filter(Boolean).join(" · ")}</span></div>
              </div>
            </Spotlight>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Your team</h2><span className="muted small">Specialists you can assign to any project</span></div>
        <div className="team-grid">
          {roleAgents.map((a) => (
            <Spotlight key={a.id} as="article" className="team-card">
              <div className="team-head"><span className="avatar-lg" style={{ ["--h" as string]: a.hue }}>{a.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span><div><h3>{a.name}</h3><small>{a.role}</small></div></div>
              <p>{a.description}</p>
              <div className="chips">{a.skills.map((s) => <span key={s} className="chip static">{s}</span>)}</div>
              <Button size="sm" onClick={() => openDialog({ kind: "agentTask", agentId: a.id })}>Assign a task <ArrowRight size={13} /></Button>
            </Spotlight>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Runs</h2>
          <Segmented label="Filter runs" value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "working", label: "Working" }, { value: "needs-input", label: "Needs input" }, { value: "complete", label: "Complete" }]} />
        </div>
        {shown.length === 0 ? (
          <Empty icon={<Sparkles size={20} />} title={rows.length ? "No runs with this status" : "No runs yet"} body="Assign a specialist to a task and its activity will appear here." action={<Button variant="primary" size="sm" onClick={() => openDialog({ kind: "agentTask" })}>Assign a task</Button>} />
        ) : (
          <div className="run-table">
            <AnimatePresence initial={false}>
              {shown.map(({ run, project }) => {
                const agent = roleAgents.find((a) => a.id === run.agentId)!;
                const t = RUN_TONE[run.state];
                return (
                  <motion.button key={run.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="run-row" onClick={() => setOpen({ run, project })}>
                    <span className="avatar-lg sm" style={{ ["--h" as string]: agent.hue }}>{agent.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
                    <span className="run-main"><b>{agent.name}</b><small>{run.task}</small></span>
                    <span className="run-proj">{project.name}</span>
                    <Status tone={t.tone} busy={run.state === "working"}>{t.label}</Status>
                    <span className="run-out">{run.summary ?? "In progress…"}</span>
                    <time>{ago(run.startedAt)}</time>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>

      <Sheet open={!!live} onOpenChange={(o) => !o && setOpen(null)} eyebrow={live ? `${live.project.name} · ${roleAgents.find((a) => a.id === live.run.agentId)?.name}` : undefined} title="Run details" description={live?.run.task}>
        {live && (() => {
          const cs = live.project.changeSets.find((c) => c.id === live.run.changeSetId);
          const t = RUN_TONE[live.run.state];
          return (
            <>
              <div className="row between"><Status tone={t.tone} busy={live.run.state === "working"}>{t.label}</Status><span className="muted small">Started {ago(live.run.startedAt)}</span></div>
              <div className="section-label">Activity</div>
              <ol className="timeline-list">
                {live.run.log.map((l, i) => <li key={i}><StepGlyph state="done" /><span>{l.text}<small>{clock(l.at)}</small></span></li>)}
                {live.run.state === "working" && <li><StepGlyph state="active" /><span>Working…</span></li>}
                {live.run.state === "queued" && <li><StepGlyph state="pending" /><span>Waiting to start</span></li>}
              </ol>
              {live.run.summary && <div className="output-card"><b>Output</b><p>{live.run.summary}</p></div>}
              {live.run.state === "needs-input" && live.run.question && (
                <div className="output-card warn">
                  <b>{live.run.question.text}</b>
                  <div className="row" style={{ marginTop: 10 }}>
                    <Button size="sm" onClick={() => openDialog({ kind: "vercel", projectId: live.project.id })}>{live.run.question.actionLabel}</Button>
                    <Button size="sm" variant="primary" disabled={state.vercel.status !== "connected"} onClick={() => resumeRun(live.project.id, live.run.id)}><Check size={13} /> Resume run</Button>
                  </div>
                  {state.vercel.status !== "connected" && <p className="note">Resume unlocks once Vercel is connected.</p>}
                </div>
              )}
              {cs && (
                <div className="output-card">
                  <b>Proposed change: {cs.title}</b>
                  <p>{cs.summary} · {cs.patches.length} {cs.patches.length === 1 ? "file" : "files"} · {cs.status}</p>
                  {cs.status === "proposed" && <Button size="sm" variant="primary" onClick={() => review(live)}><GitCompare size={13} /> Review in Developer mode</Button>}
                </div>
              )}
              <div className="row" style={{ marginTop: 16 }}>
                <Button onClick={() => { const id = live.project.id; setOpen(null); router.push(`/project/${id}`); }}>Open {live.project.name}</Button>
                <Button onClick={() => { setOpen(null); openDialog({ kind: "agentTask", projectId: live.project.id, agentId: live.run.agentId }); }}><Clock size={13} /> Run again</Button>
              </div>
            </>
          );
        })()}
      </Sheet>
    </div>
  );
}
