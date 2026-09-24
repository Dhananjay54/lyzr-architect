"use client";

import { Check, Copy, Globe, Lock, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Kbd } from "@/components/ui/bits";
import { Modal } from "@/components/ui/overlay";
import { roleAgents } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import { cn, slugify } from "@/lib/utils";
import { useShell } from "@/components/shell/shell-context";
import { GithubSheet } from "./GithubSheet";
import { VercelSheet } from "./VercelSheet";

function ShareDialog({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { getProject } = useApp();
  const router = useRouter();
  const project = getProject(projectId);
  const [access, setAccess] = useState<"view" | "private">("view");
  const [copied, setCopied] = useState(false);
  if (!project) return null;
  const link = `https://architect.demo/share/${slugify(project.name)}-${project.id.slice(-5)}`;
  const latest = project.deployments[0];
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} eyebrow="Share" title={`Share ${project.name}`} description="This link is simulated. It is not reachable outside this browser session."
      footer={<><Button onClick={onClose}>Done</Button>{latest && <Button variant="primary" onClick={() => { window.open(`/deployed/${latest.id}`, "_blank"); }}>Open static preview</Button>}</>}>
      <Field label="LINK"><div className="copy-row"><input readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
        <Button onClick={async () => { try { await navigator.clipboard.writeText(link); } catch { /* clipboard may be blocked */ } setCopied(true); toast.success("Link copied", { description: "Demo link only." }); window.setTimeout(() => setCopied(false), 1600); }}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}</Button></div></Field>
      <div className="section-label">Who can open it</div>
      <div className="choice-list" role="radiogroup" aria-label="Access">
        {([["view", "Anyone with the link can view", "Read-only preview of the latest build.", <Globe key="g" size={16} />], ["private", "Only you", "Hidden until you change this.", <Lock key="l" size={16} />]] as const).map(([v, t, d, icon]) => (
          <button key={v} role="radio" aria-checked={access === v} className={cn("choice", access === v && "on")} onClick={() => { setAccess(v); toast(`Access set: ${t}`); }}>{icon}<span><b>{t}</b><small>{d}</small></span><i>{access === v && <Check size={14} />}</i></button>
        ))}
      </div>
      {!latest && <p className="note">No deployment yet. <button className="linkish" onClick={() => { onClose(); router.push(`/project/${project.id}/deploy`); }}>Deploy first</button> to get a static preview.</p>}
    </Modal>
  );
}

function HelpDialog({ onClose }: { onClose: () => void }) {
  const { openTour, resetDemo, state } = useApp();
  const router = useRouter();
  const rows: [string, string[]][] = [
    ["Open the command palette", ["⌘", "K"]], ["Send a chat message", ["⌘", "↵"]], ["Close a dialog or the tour", ["esc"]],
    ["Move through the tour", ["←", "→"]], ["Open help", ["?"]],
  ];
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} eyebrow="Help" title="Help and shortcuts" description="A short guide to what is real in this prototype and what is simulated.">
      <div className="help-grid">
        <section>
          <div className="section-label">Shortcuts</div>
          <ul className="shortcuts">{rows.map(([label, keys]) => <li key={label}><span>{label}</span><span>{keys.map((k) => <Kbd key={k}>{k}</Kbd>)}</span></li>)}</ul>
        </section>
        <section>
          <div className="section-label">What is simulated</div>
          <ul className="bullets">
            <li><Check size={12} /> Generation, agents, GitHub, Vercel and deploys run locally with timers.</li>
            <li><Check size={12} /> Nothing calls an LLM, clones a repository or deploys an app.</li>
            <li><Check size={12} /> Data lives in this tab&apos;s session and resets in a new session.</li>
          </ul>
        </section>
      </div>
      <div className="row wrap">
        <Button onClick={() => { onClose(); const p = state.projects.find((x) => x.id === state.activeProjectId) ?? state.projects[0]; if (p) router.push(`/project/${p.id}`); openTour(); }}>Replay workspace tour</Button>
        <Button onClick={() => { resetDemo(); onClose(); }}>Reset demo data</Button>
        <Button onClick={() => { onClose(); router.push("/settings"); }}>Open settings</Button>
      </div>
    </Modal>
  );
}

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
const pascalName = (s: string) => s.replace(/(^|[^a-zA-Z0-9]+)(\w)/g, (_, __, c) => c.toUpperCase()).replace(/[^a-zA-Z0-9]/g, "");

function NewComponentDialog({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { getProject, createFile, setMode } = useApp();
  const { setFocus } = useShell();
  const router = useRouter();
  const [name, setName] = useState("");
  const project = getProject(projectId);
  const comp = pascalName(name) || "Banner";
  const path = `components/${kebab(comp)}.tsx`;
  const exists = project?.files.some((f) => f.path === path);
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} eyebrow="Developer" title="Create component" description="Adds a file to the local project. It appears in Changes until you accept it."
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!name.trim() || !!exists} onClick={() => {
        createFile(projectId, path, `export function ${comp}() {\n  return (\n    <section className="${kebab(comp)}">\n      <h2>${comp}</h2>\n    </section>\n  );\n}\n`);
        setMode(projectId, "developer"); router.push(`/project/${projectId}`); setFocus({ file: path, panel: "changes" }); onClose(); toast.success(`Created ${path}`, { description: "Review it in Changes." });
      }}>Create component</Button></>}>
      <Field label="COMPONENT NAME" hint={exists ? "A file with that name exists." : `Will create ${path}`}><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Announcement banner" /></Field>
    </Modal>
  );
}

function NewRouteDialog({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { getProject, createFile, setMode } = useApp();
  const { setFocus } = useShell();
  const router = useRouter();
  const [route, setRoute] = useState("/pricing");
  const project = getProject(projectId);
  const clean = "/" + route.trim().replace(/^\/+|\/+$/g, "").replace(/[^a-zA-Z0-9/_-]+/g, "-").toLowerCase();
  const path = `app${clean === "/" ? "" : clean}/page.tsx`;
  const exists = project?.files.some((f) => f.path === path);
  const title = clean.split("/").pop() || "Home";
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} eyebrow="Developer" title="Add route" description="Creates an App Router page in the local project."
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={clean === "/" || !!exists} onClick={() => {
        createFile(projectId, path, `export default function ${pascalName(title) || "Page"}Page() {\n  return (\n    <main>\n      <h1>${title[0].toUpperCase() + title.slice(1)}</h1>\n    </main>\n  );\n}\n`);
        setMode(projectId, "developer"); router.push(`/project/${projectId}`); setFocus({ file: path, panel: "changes" }); onClose(); toast.success(`Added route ${clean}`, { description: path });
      }}>Add route</Button></>}>
      <Field label="ROUTE PATH" hint={exists ? "That route already exists." : `Will create ${path}`}><input autoFocus value={route} onChange={(e) => setRoute(e.target.value)} placeholder="/pricing" /></Field>
    </Modal>
  );
}

function AgentTaskDialog({ projectId, agentId, task: initialTask, onClose }: { projectId?: string; agentId?: string; task?: string; onClose: () => void }) {
  const { state, runAgent } = useApp();
  const router = useRouter();
  const [agent, setAgent] = useState(agentId ?? "frontend");
  const [pid, setPid] = useState(projectId ?? state.activeProjectId ?? state.projects[0]?.id ?? "");
  const [task, setTask] = useState(initialTask ?? "");
  const def = roleAgents.find((a) => a.id === agent)!;
  useEffect(() => { if (!initialTask) setTask(""); }, [agent, initialTask]);
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} eyebrow="Agents" title="Assign a task" description="The agent shows its work and proposes file changes. You approve before anything is applied."
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!pid} onClick={() => {
        const t = task.trim() || def.tasks[0];
        runAgent(pid, agent, t); onClose();
        toast(`${def.name} started`, { description: t, action: { label: "View run", onClick: () => router.push("/agents") } });
      }}><Wand2 size={14} /> Start run</Button></>}>
      <div className="agent-picker" role="radiogroup" aria-label="Agent">
        {roleAgents.map((a) => (
          <button key={a.id} role="radio" aria-checked={agent === a.id} className={cn("agent-opt", agent === a.id && "on")} onClick={() => setAgent(a.id)}>
            <i style={{ ["--h" as string]: a.hue }} /><b>{a.name}</b><small>{a.role}</small>
          </button>
        ))}
      </div>
      <Field label="PROJECT"><select value={pid} onChange={(e) => setPid(e.target.value)}>{state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      <Field label="TASK"><textarea rows={3} value={task} onChange={(e) => setTask(e.target.value)} placeholder={def.tasks[0]} /></Field>
      <div className="chips">{def.tasks.map((t) => <button key={t} className="chip" onClick={() => setTask(t)}>{t}</button>)}</div>
    </Modal>
  );
}

export function DialogHost() {
  const { dialog, closeDialog } = useShell();
  if (!dialog) return null;
  switch (dialog.kind) {
    case "github": return <GithubSheet key="gh" open onClose={closeDialog} projectId={dialog.projectId} initialTab={dialog.tab} />;
    case "vercel": return <VercelSheet key="vc" open onClose={closeDialog} projectId={dialog.projectId} />;
    case "share": return <ShareDialog projectId={dialog.projectId} onClose={closeDialog} />;
    case "help": return <HelpDialog onClose={closeDialog} />;
    case "newComponent": return <NewComponentDialog projectId={dialog.projectId} onClose={closeDialog} />;
    case "newRoute": return <NewRouteDialog projectId={dialog.projectId} onClose={closeDialog} />;
    case "agentTask": return <AgentTaskDialog projectId={dialog.projectId} agentId={dialog.agentId} task={dialog.task} onClose={closeDialog} />;
  }
}
