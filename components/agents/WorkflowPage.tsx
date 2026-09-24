"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Copy, Loader2, Play, Plus, RotateCcw, Rocket, Save, Workflow as WorkflowIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ConsentModal } from "@/components/integrations/ConsentModal";
import { Button } from "@/components/ui/button";
import { ConnectorMark, Empty, Segmented, Status } from "@/components/ui/bits";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger } from "@/components/ui/menu";
import { Modal } from "@/components/ui/overlay";
import { connectors, roleAgents, workflows as samples } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import type { Connector, Workflow, WorkflowNode } from "@/lib/types";
import { levels, type LayoutKind } from "@/lib/workflow-layout";
import { clock, slugify, uid } from "@/lib/utils";
import { WorkflowCanvas, type NodeRun } from "./WorkflowCanvas";

export const blankWorkflow = (): Workflow => ({
  id: "blank", name: "Untitled agent", summary: "An empty orchestra. Add specialists and run a test.", category: "Custom", keywords: [], connectors: [],
  sampleInput: "\"A sample request goes here.\"", sampleOutput: ["Request routed", "Specialists returned results", "Reviewer approved the answer"],
  nodes: [
    { id: "t", kind: "trigger", label: "Request", role: "Trigger", description: "Starts when a request arrives.", tools: [], instructions: "Accept a request and pass it on.", sample: { input: "Request", output: "Request accepted" } },
    { id: "o", kind: "orchestrator", label: "Orchestrator", role: "Orchestrator", description: "Decides which specialist should act.", tools: [], instructions: "Route each request to the right specialists.", sample: { input: "Request", output: "Plan made" } },
    { id: "x", kind: "output", label: "Result", role: "Output", description: "The final answer.", tools: [], instructions: "Return the reviewed answer.", sample: { input: "Answer", output: "Result delivered" } },
  ],
  edges: [{ from: "t", to: "o" }, { from: "o", to: "x" }],
});

function usedConnectors(wf: Workflow): Connector[] {
  const ids = Array.from(new Set(wf.nodes.flatMap((n) => n.tools)));
  return ids.map((id) => connectors.find((c) => c.id === id)).filter(Boolean) as Connector[];
}

export function WorkflowPage() {
  const params = useParams<{ id: string }>();
  const { state } = useApp();
  const initial = useMemo(() => {
    if (params.id === "blank") return blankWorkflow();
    return state.workflows.find((w) => w.id === params.id) ?? samples.find((w) => w.id === params.id) ?? null;
    // Only resolve on route change; edits are local until saved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);
  if (!initial) return <div className="page"><Empty title="Workflow not found" body="It may have been removed or belongs to another session." action={<Link href="/agents" className="btn primary">Back to agents</Link>} /></div>;
  return <WorkflowEditor key={params.id} initial={initial} />;
}

function WorkflowEditor({ initial }: { initial: Workflow }) {
  const router = useRouter();
  const { state, saveWorkflow, connectConnector } = useApp();
  const [wf, setWf] = useState<Workflow>(() => JSON.parse(JSON.stringify(initial)));
  const [layout, setLayout] = useState<LayoutKind>("flow");
  const [selected, setSelected] = useState<string | null>(null);
  const [run, setRun] = useState<Record<string, NodeRun>>({});
  const [activeEdges, setActive] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<{ at: string; text: string; tone?: "done" }[]>([]);
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
  const [runKey, setRunKey] = useState(0);
  const [deployOpen, setDeployOpen] = useState(false);
  const [consent, setConsent] = useState<Connector | null>(null);
  const timers = useRef<number[]>([]);
  const logRef = useRef<HTMLOListElement>(null);

  const isSaved = state.workflows.some((w) => w.id === wf.id);
  const conns = usedConnectors(wf);
  const node = wf.nodes.find((n) => n.id === selected) ?? null;

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }); }, [log.length]);

  const stop = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
  const reset = () => { stop(); setRun({}); setActive(new Set()); setLog([]); setStatus("idle"); };
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const start = () => {
    reset();
    setStatus("running"); setRunKey((k) => k + 1); setSelected(null);
    const now = () => new Date().toISOString();
    setLog([{ at: now(), text: `Test request received: ${wf.sampleInput}` }]);
    const lv = levels(wf);
    let t = 300;
    lv.forEach((ids) => {
      later(() => {
        setRun((r) => ({ ...r, ...Object.fromEntries(ids.map((id) => [id, "working" as const])) }));
        setActive(new Set(wf.edges.filter((e) => ids.includes(e.to)).map((e) => `${e.from}>${e.to}`)));
        setLog((l) => [...l, ...ids.map((id) => ({ at: now(), text: `${wf.nodes.find((n) => n.id === id)!.label} started` }))]);
      }, t);
      later(() => {
        setRun((r) => ({ ...r, ...Object.fromEntries(ids.map((id) => [id, "done" as const])) }));
        setLog((l) => [...l, ...ids.map((id) => { const n = wf.nodes.find((x) => x.id === id)!; return { at: now(), text: `${n.label}: ${n.sample.output}`, tone: "done" as const }; })]);
      }, t + 1150);
      t += 1300;
    });
    later(() => { setActive(new Set()); setStatus("done"); setLog((l) => [...l, { at: now(), text: "Test complete. Every step above is simulated.", tone: "done" }]); }, t + 100);
  };

  const addSpecialist = (roleId: string) => {
    const role = roleAgents.find((r) => r.id === roleId)!;
    const id = uid("n");
    const orch = wf.nodes.find((n) => n.kind === "orchestrator");
    const review = wf.nodes.find((n) => n.kind === "review");
    const output = wf.nodes.find((n) => n.kind === "output");
    const newNode: WorkflowNode = { id, kind: "agent", label: role.name, role: "Specialist", description: role.description, tools: [], instructions: `Act as the ${role.name.toLowerCase()}. ${role.description}`, sample: { input: "Task from the orchestrator", output: `${role.skills[0]} complete` } };
    const edges = [...wf.edges];
    if (orch) edges.push({ from: orch.id, to: id });
    const target = review ?? output;
    if (target) edges.push({ from: id, to: target.id });
    reset();
    setWf({ ...wf, nodes: [...wf.nodes, newNode], edges });
    setSelected(id);
    toast.success(`Added ${role.name}`, { description: "Layout updated. Run a test to see it work." });
  };

  const removeNode = (id: string) => {
    const n = wf.nodes.find((x) => x.id === id);
    if (!n || ["trigger", "orchestrator", "output"].includes(n.kind)) return;
    const incoming = wf.edges.filter((e) => e.to === id);
    const outgoing = wf.edges.filter((e) => e.from === id);
    const bridged = incoming.flatMap((i) => outgoing.map((o) => ({ from: i.from, to: o.to })));
    const edges = [...wf.edges.filter((e) => e.from !== id && e.to !== id), ...bridged.filter((b) => !wf.edges.some((e) => e.from === b.from && e.to === b.to))];
    reset(); setSelected(null);
    setWf({ ...wf, nodes: wf.nodes.filter((x) => x.id !== id), edges });
  };

  const save = () => {
    const newId = isSaved ? wf.id : `${slugify(wf.name)}-${uid("").slice(-4)}`;
    const next = { ...wf, id: newId, connectors: conns.map((c) => c.id) };
    saveWorkflow(next);
    toast.success(isSaved ? "Workflow saved" : "Saved to your agents", { description: "Stored in this session." });
    if (!isSaved) router.replace(`/agents/${newId}`);
  };

  const deploy = () => {
    const newId = isSaved ? wf.id : `${slugify(wf.name)}-${uid("").slice(-4)}`;
    const url = `https://agents.architect.demo/${slugify(wf.name)}`;
    saveWorkflow({ ...wf, id: newId, connectors: conns.map((c) => c.id), deployedUrl: url });
    setWf((w) => ({ ...w, id: newId, deployedUrl: url }));
    toast.success("Agent deployed (simulated)", { description: url });
    if (!isSaved) router.replace(`/agents/${newId}`);
  };

  const connState = (id: string) => state.connectors[id]?.status;

  return (
    <div className="page wf-page">
      <div className="wf-top">
        <Link href="/agents" className="back"><ArrowLeft size={14} /> Agents</Link>
        <div className="wf-title">
          <input className="name-input" value={wf.name} onChange={(e) => setWf({ ...wf, name: e.target.value })} aria-label="Agent name" />
          <p>{wf.summary}</p>
        </div>
        <div className="row wrap">
          <Segmented label="Diagram layout" value={layout} onChange={setLayout} options={[{ value: "flow", label: "Flow" }, { value: "orchestra", label: "Orchestra" }]} />
          <Menu>
            <MenuTrigger asChild><Button><Plus size={14} /> Add specialist</Button></MenuTrigger>
            <MenuContent width={250}>
              <MenuLabel>Add to the orchestra</MenuLabel>
              {roleAgents.map((r) => <MenuItem key={r.id} onSelect={() => addSpecialist(r.id)} hint={r.role}>{r.name}</MenuItem>)}
            </MenuContent>
          </Menu>
          <Button onClick={save}><Save size={14} /> {isSaved ? "Save" : "Save agent"}</Button>
          <Button onClick={() => setDeployOpen(true)}><Rocket size={14} /> Deploy</Button>
          {status === "running" ? <Button variant="primary" disabled><Loader2 size={14} className="spin" /> Running…</Button> : status === "done" ? <Button variant="primary" onClick={start}><RotateCcw size={14} /> Run again</Button> : <Button variant="primary" onClick={start}><Play size={14} /> Run test</Button>}
        </div>
      </div>

      <div className="wf-layout">
        <section className="wf-main">
          <div className="wf-legend" aria-hidden>
            <span><i className="k-trigger" /> Trigger</span><span><i className="k-orchestrator" /> Orchestrator</span><span><i className="k-agent" /> Specialist</span><span><i className="k-tool" /> Tool</span><span><i className="k-review" /> Reviewer</span><span><i className="k-output" /> Output</span>
          </div>
          <WorkflowCanvas workflow={wf} layout={layout} run={run} activeEdges={activeEdges} selectedId={selected} onSelect={setSelected} runKey={runKey} />
          <div className="wf-hint muted small">{layout === "flow" ? "Flow: work moves left to right through each step." : "Orchestra: the orchestrator sits in the middle and conducts the specialists."} Select a node to inspect it.</div>
        </section>

        <aside className="wf-side">
          <AnimatePresence mode="wait" initial={false}>
            {node ? (
              <motion.div key={node.id} className="panel-card" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <div className="row between"><Status tone="accent" dot={false}>{node.role}</Status><button className="btn ghost sm" onClick={() => setSelected(null)}>Close</button></div>
                <h3>{node.label}</h3>
                <p className="muted">{node.description}</p>
                <div className="section-label">Instructions</div>
                <div className="code-box">{node.instructions}</div>
                <div className="section-label">Tools</div>
                {node.tools.length ? <div className="chip-list">{node.tools.map((t) => { const c = connectors.find((x) => x.id === t)!; const s = connState(t); return <button key={t} className="tool-chip" onClick={() => s !== "connected" && setConsent(c)}><ConnectorMark mark={c.mark} hue={c.hue} size={20} />{c.name}{s === "connected" ? <Check size={12} /> : <small>Connect</small>}</button>; })}</div> : <p className="muted small">This step uses no external tools.</p>}
                <div className="section-label">Sample</div>
                <dl className="kv small"><dt>In</dt><dd>{node.sample.input}</dd><dt>Out</dt><dd>{node.sample.output}</dd></dl>
                {!["trigger", "orchestrator", "output"].includes(node.kind) && <Button size="sm" variant="danger" onClick={() => removeNode(node.id)}>Remove from orchestra</Button>}
              </motion.div>
            ) : (
              <motion.div key="overview" className="panel-card" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <div className="row between"><h3>Overview</h3><Status tone={wf.deployedUrl ? "info" : isSaved ? "success" : "neutral"}>{wf.deployedUrl ? "Deployed (simulated)" : isSaved ? "Saved" : "Sample"}</Status></div>
                <dl className="kv small"><dt>Steps</dt><dd>{wf.nodes.length}</dd><dt>Specialists</dt><dd>{wf.nodes.filter((n) => n.kind === "agent").length}</dd><dt>Test input</dt><dd>{wf.sampleInput}</dd></dl>
                <div className="section-label">Connectors</div>
                {conns.length ? <div className="chip-list">{conns.map((c) => { const s = connState(c.id); return <button key={c.id} className="tool-chip" onClick={() => s !== "connected" && setConsent(c)}><ConnectorMark mark={c.mark} hue={c.hue} size={20} />{c.name}{s === "connected" ? <Check size={12} /> : <small>Connect</small>}</button>; })}</div> : <p className="muted small">No connectors yet. Add a specialist, then give it tools.</p>}
                {wf.deployedUrl && <div className="endpoint"><span className="mono">{wf.deployedUrl}</span><button className="btn ghost icon sm" aria-label="Copy endpoint" onClick={async () => { try { await navigator.clipboard.writeText(wf.deployedUrl!); } catch { /* blocked */ } toast.success("Endpoint copied"); }}><Copy size={13} /></button></div>}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="panel-card run-card">
            <div className="row between"><h3>Test run</h3>{status !== "idle" && <button className="btn ghost sm" onClick={reset}>Clear</button>}</div>
            {log.length === 0 ? (
              <div className="empty-run"><WorkflowIcon size={18} /><p>Press <b>Run test</b> to watch the agents work through a sample request.</p></div>
            ) : (
              <ol className="run-log" ref={logRef}>
                {log.map((l, i) => <li key={i} className={l.tone}><time>{clock(l.at)}</time><span>{l.text}</span></li>)}
              </ol>
            )}
            {status === "done" && (
              <motion.div className="run-result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <b>Result</b>
                <ul>{wf.sampleOutput.map((o) => <li key={o}><Check size={12} /> {o}</li>)}</ul>
              </motion.div>
            )}
          </div>
        </aside>
      </div>

      <Modal open={deployOpen} onOpenChange={setDeployOpen} eyebrow="Deploy agent" title={`Deploy ${wf.name}`} description="Creates a simulated endpoint. No service is started."
        footer={<><Button onClick={() => setDeployOpen(false)}>Cancel</Button><Button variant="primary" onClick={() => { deploy(); setDeployOpen(false); }}><Rocket size={14} /> Deploy agent</Button></>}>
        <dl className="kv"><dt>Endpoint</dt><dd className="mono">https://agents.architect.demo/{slugify(wf.name)}</dd><dt>Connectors</dt><dd>{conns.length ? conns.map((c) => `${c.name}${connState(c.id) === "connected" ? "" : " (not connected)"}`).join(", ") : "None"}</dd></dl>
        {conns.some((c) => connState(c.id) !== "connected") && <p className="note">Some connectors are not connected. The agent would run without them in this demo.</p>}
      </Modal>
      <ConsentModal connector={consent} open={!!consent} onOpenChange={(o) => !o && setConsent(null)} onAllow={(a) => { if (consent) connectConnector(consent.id, a); }} />
      <span className="sr-only" aria-live="polite">{status === "running" ? "Test running" : status === "done" ? "Test complete" : ""}</span>
    </div>
  );
}
