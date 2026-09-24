"use client";

import { motion } from "framer-motion";
import {
  ArrowUp, Bot, Check, Code2, Command as CommandIcon, ExternalLink, GitFork, Loader2, Maximize2, MousePointer2, RefreshCw,
  Rocket, Sparkles, Trash2, Triangle, Wand2, AlertTriangle, LayoutTemplate, PenLine,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { toast } from "sonner";
import { SitePreview } from "@/components/preview/SitePreview";
import { Hint } from "@/components/shell/Hint";
import { useShell } from "@/components/shell/shell-context";
import { SourcePath } from "@/components/integrations/SourcePath";
import { Button } from "@/components/ui/button";
import { Empty, Segmented, Status, StepGlyph } from "@/components/ui/bits";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tip } from "@/components/ui/tip";
import { roleAgents } from "@/lib/catalog";
import { sectionLabel, suggestionsFor } from "@/lib/engine";
import { useMedia } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import type { Message, Project, Section } from "@/lib/types";
import { ago, clock, cn } from "@/lib/utils";
import { DeviceFrame, type Device } from "./DeviceFrame";

type PreviewState = "live" | "loading" | "error" | "empty";

/* ---------- chat ---------- */

function StreamText({ text, animate }: { text: string; animate: boolean }) {
  const [n, setN] = useState(animate ? 0 : text.length);
  useEffect(() => {
    if (!animate) { setN(text.length); return; }
    setN(0);
    const id = window.setInterval(() => setN((v) => { if (v >= text.length) { window.clearInterval(id); return v; } return v + 3; }), 16);
    return () => window.clearInterval(id);
  }, [text, animate]);
  return <>{text.slice(0, n)}{n < text.length && <b className="caret" />}</>;
}

function MessageView({ m, onViewChanges }: { m: Message; onViewChanges: () => void }) {
  const wasWorking = useRef(m.status === "working");
  const animate = wasWorking.current && m.status === "done";
  useEffect(() => { if (m.status === "working") wasWorking.current = true; }, [m.status]);
  const label = m.author === "you" ? "You" : m.author === "agent" ? m.agent ?? "Agent" : "Architect";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("message", m.author)}>
      <div className="message-meta">
        {m.author === "agent" && <Bot size={12} />}{label}<span>· {m.status === "working" ? "Working" : clock(m.at)}</span>
      </div>
      <div className="bubble">
        {m.status === "working" ? (
          <>
            <div className="bubble-work"><Loader2 size={13} className="spin" /> Shaping that update…</div>
            <ol className="msg-steps">{m.steps?.map((s) => <li key={s.label} className={s.state}><StepGlyph state={s.state} />{s.label}</li>)}</ol>
          </>
        ) : (
          <><StreamText text={m.text} animate={animate} />
            {m.changeTitle && <button className="change-chip" onClick={onViewChanges}><Code2 size={12} /> {m.changeTitle} · view files</button>}
          </>
        )}
      </div>
    </motion.div>
  );
}

function ChatPanel({ project, prefill, clearPrefill }: { project: Project; prefill: string; clearPrefill: () => void }) {
  const { sendMessage, setMode } = useApp();
  const { openDialog, setFocus } = useShell();
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const busy = project.messages.some((m) => m.status === "working");
  const suggestions = useMemo(() => suggestionsFor(project.site), [project.site]);

  useEffect(() => { if (prefill) { setText(prefill); clearPrefill(); areaRef.current?.focus(); } }, [prefill, clearPrefill]);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [project.messages.length, project.messages.at(-1)?.status, project.messages.at(-1)?.steps?.[2]?.state]);

  const send = (t = text) => { if (!t.trim()) return; sendMessage(project.id, t); setText(""); };
  const viewChanges = () => { setMode(project.id, "developer"); setFocus({ panel: "changes" }); };

  return (
    <div className="chat" data-tour="composer">
      <div className="panel-head"><span>Conversation</span><span className="muted mono small">↵ send · ⇧↵ new line</span></div>
      <div className="messages" ref={listRef} role="log" aria-live="polite">
        {project.messages.map((m) => <MessageView key={m.id} m={m} onViewChanges={viewChanges} />)}
      </div>
      <div className="suggestions" aria-label="Suggested next actions">
        {suggestions.map((s) => <button key={s} className="chip" disabled={busy} onClick={() => send(s)}><Sparkles size={11} /> {s}</button>)}
      </div>
      <div className="composer">
        <textarea
          ref={areaRef} value={text} rows={2} placeholder={busy ? "Architect is working…" : "Describe the next change, e.g. “Add a pricing section”"}
          aria-label="Message Architect"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <div className="composer-actions">
          <Tip label="Ask a specialist agent"><button className="btn ghost icon sm" aria-label="Ask a specialist agent" onClick={() => openDialog({ kind: "agentTask", projectId: project.id })}><Wand2 size={15} /></button></Tip>
          <Button variant="primary" size="icon" aria-label="Send message" disabled={!text.trim()} onClick={() => send()}><ArrowUp size={16} /></Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- preview ---------- */

function PreviewPanel({ project, inspect, setInspect, selected, onSelect }: { project: Project; inspect: boolean; setInspect: (v: boolean) => void; selected: string | null; onSelect: (s: Section | null) => void }) {
  const { patchProject, setMode } = useApp();
  const { setPresenting, setFocus } = useShell();
  const router = useRouter();
  const [device, setDevice] = useState<Device>(() => (typeof window !== "undefined" && window.innerWidth < 720 ? "mobile" : "desktop"));
  const [view, setView] = useState<PreviewState>("live");
  const [key, setKey] = useState(0);
  const checked = useRef(!!project.previewChecked);
  const mark = () => { if (!checked.current) { checked.current = true; patchProject(project.id, (p) => ({ ...p, previewChecked: true })); } };

  // Having the preview in view for a few seconds counts as checking it.
  useEffect(() => {
    if (checked.current) return;
    const id = window.setTimeout(mark, 4000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = () => { setView("loading"); setKey((k) => k + 1); window.setTimeout(() => setView("live"), 900); mark(); };
  const latest = project.deployments[0];

  return (
    <div className="preview" data-tour="preview">
      <div className="preview-bar">
        <Segmented label="Device" value={device} onChange={(d) => { setDevice(d); mark(); }} options={[
          { value: "desktop", label: <>Desktop</>, title: "Desktop width" }, { value: "tablet", label: <>Tablet</>, title: "Tablet width" }, { value: "mobile", label: <>Mobile</>, title: "Mobile width" },
        ]} />
        <div className="preview-tools">
          <Tip label={inspect ? "Stop inspecting" : "Inspect a section"}><button className={cn("btn ghost icon sm", inspect && "on")} aria-pressed={inspect} aria-label="Inspect a section" onClick={() => { setInspect(!inspect); mark(); }}><MousePointer2 size={15} /></button></Tip>
          <Tip label="Reload preview"><button className="btn ghost icon sm" aria-label="Reload preview" onClick={reload}><RefreshCw size={15} className={view === "loading" ? "spin" : ""} /></button></Tip>
          <Tip label="Present full-screen"><button className="btn ghost icon sm" aria-label="Present full-screen" onClick={() => { setPresenting(true); mark(); }}><Maximize2 size={15} /></button></Tip>
          <Tip label={latest ? "Open deployed preview" : "Deploy to open a live URL"}><button className="btn ghost icon sm" aria-label="Open deployed preview" onClick={() => latest ? window.open(`/deployed/${latest.id}`, "_blank") : toast("Not deployed yet", { action: { label: "Deploy", onClick: () => router.push(`/project/${project.id}/deploy`) } })}><ExternalLink size={15} /></button></Tip>
          <select className="mini-select" aria-label="Simulate preview state" value={view} onChange={(e) => { setView(e.target.value as PreviewState); }}>
            <option value="live">State: Live</option><option value="loading">State: Loading</option><option value="error">State: Error</option><option value="empty">State: Empty</option>
          </select>
        </div>
      </div>
      <DeviceFrame device={device} url={`${project.name.toLowerCase().replace(/\s+/g, "-")}.local`}>
        {view === "live" && <SitePreview key={key} site={project.site} inspect={inspect} selectedId={selected} onSelect={(s) => { onSelect(s); mark(); }} />}
        {view === "loading" && <div className="pv-loading" aria-busy="true"><i /><i /><i /><i /><span><Loader2 size={14} className="spin" /> Rebuilding preview…</span></div>}
        {view === "error" && (
          <div className="pv-state error">
            <AlertTriangle size={26} />
            <h4>Preview failed to render</h4>
            <p className="mono">TypeError: Cannot read properties of undefined (reading &lsquo;map&rsquo;) at components/features.tsx:9</p>
            <div className="row"><Button size="sm" onClick={() => { setMode(project.id, "developer"); setFocus({ file: "components/features.tsx", line: 9 }); }}>Open components/features.tsx</Button><Button size="sm" variant="primary" onClick={reload}>Retry</Button></div>
            <small className="muted">Simulated error state. Choose “Live” to return.</small>
          </div>
        )}
        {view === "empty" && (
          <div className="pv-state">
            <LayoutTemplate size={26} /><h4>Nothing to preview yet</h4><p>Sections appear here as soon as you describe them.</p>
            <Button size="sm" variant="primary" onClick={() => setView("live")}>Show the preview</Button>
          </div>
        )}
      </DeviceFrame>
    </div>
  );
}

/* ---------- context panel ---------- */

function InspectorTab({ project, section, askAbout }: { project: Project; section: Section | null; askAbout: (t: string) => void }) {
  const { sendMessage, setMode } = useApp();
  const { setFocus } = useShell();
  if (!section) return <Empty icon={<MousePointer2 size={20} />} title="Nothing selected" body="Turn on Inspect in the preview toolbar, then click a section to see its file and quick actions." />;
  const file = `components/${section.type}.tsx`;
  const removable = section.type !== "hero" && section.type !== "nav";
  return (
    <div className="inspector">
      <div className="row between"><h4>{sectionLabel[section.type]}</h4><Status tone="neutral" dot={false}>{section.type}</Status></div>
      {section.title && <p className="insp-title">“{section.title}”</p>}
      <dl className="kv small"><dt>File</dt><dd className="mono">{file}</dd><dt>Items</dt><dd>{section.items?.length ?? 0}</dd></dl>
      <div className="section-label">Quick actions</div>
      <div className="stack">
        <Button size="sm" onClick={() => askAbout(`Make the ${sectionLabel[section.type].toLowerCase()} more decisive`)}><PenLine size={13} /> Ask Architect to refine it</Button>
        <Button size="sm" onClick={() => { setMode(project.id, "developer"); setFocus({ file }); }}><Code2 size={13} /> Open file in Developer mode</Button>
        {removable && <Button size="sm" variant="danger" onClick={() => sendMessage(project.id, `Remove the ${section.type} section`)}><Trash2 size={13} /> Remove this section</Button>}
      </div>
    </div>
  );
}

function ActivityTab({ project }: { project: Project }) {
  const applied = project.changeSets.filter((c) => c.status === "applied" || c.status === "accepted").slice(0, 4);
  return (
    <>
      <div className="section-label">Build pulse</div>
      <ol className="timeline">
        {project.timeline.map((t) => (
          <li key={t.label}><StepGlyph state={t.state} /><div><b>{t.label}</b><small>{t.note}</small></div></li>
        ))}
      </ol>
      <div className="section-label">Recent changes</div>
      {applied.length ? <ul className="mini-list">{applied.map((c) => <li key={c.id}><Check size={12} /><span>{c.title}<small>{c.source} · {ago(c.createdAt)}</small></span></li>)}</ul> : <p className="muted small">No changes yet. Ask for one in the conversation.</p>}
      {project.agentRuns.length > 0 && (
        <>
          <div className="section-label">Agents</div>
          <ul className="mini-list">{project.agentRuns.slice(0, 3).map((r) => <li key={r.id}><Bot size={12} /><span>{roleAgents.find((a) => a.id === r.agentId)?.name}<small>{r.state === "working" ? "Working…" : r.summary}</small></span></li>)}</ul>
        </>
      )}
    </>
  );
}

function ConnectTab({ project }: { project: Project }) {
  const { state } = useApp();
  const { openDialog } = useShell();
  const gh = state.github.status === "connected";
  const vc = state.vercel.status === "connected";
  return (
    <>
      <Hint id="integration" title="Connect when you are ready.">Both integrations are simulated. Nothing leaves this browser.</Hint>
      <div className="int-card">
        <div className="row between"><span className="int-name"><GitFork size={14} /> GitHub</span><Status tone={project.github ? "success" : gh ? "warn" : "neutral"}>{project.github ? "Repository linked" : gh ? "No repository" : "Not connected"}</Status></div>
        <p>{project.github ? `${project.github.repository} · ${project.github.branch}` : gh ? "Choose or create a repository to push to." : "Keep your source close to the work."}</p>
        <div className="row"><Button size="sm" variant={gh ? "default" : "primary"} onClick={() => openDialog({ kind: "github", projectId: project.id, tab: !gh ? "connection" : !project.github ? "repository" : "commit" })}>{!gh ? "Connect GitHub" : !project.github ? "Choose repository" : "Commit and push"}</Button></div>
      </div>
      <div className="int-card">
        <div className="row between"><span className="int-name"><Triangle size={13} /> Vercel</span><Status tone={project.vercel ? "success" : vc ? "warn" : "neutral"}>{project.vercel ? "Project linked" : vc ? "Not linked" : "Not connected"}</Status></div>
        <p>{project.vercel ? `${project.vercel.project} · ${project.vercel.targetBranch}` : vc ? "Link or create a project to deploy to." : "Bring it to a live URL."}</p>
        <div className="row"><Button size="sm" variant={vc ? "default" : "primary"} onClick={() => openDialog({ kind: "vercel", projectId: project.id })}>{!vc ? "Connect Vercel" : project.vercel ? "Manage link" : "Link project"}</Button></div>
      </div>
      <div className="section-label">Source path</div>
      <SourcePath project={project} />
    </>
  );
}

function ShipTab({ project }: { project: Project }) {
  const router = useRouter();
  const items = [
    { ok: true, label: "Project generated" },
    { ok: !!project.previewChecked, label: "Preview checked", warn: true },
    { ok: !!project.github, label: "GitHub repository", optional: true },
    { ok: !!project.vercel, label: "Vercel project", optional: true },
    { ok: project.configuration.environmentVariables.length > 0, label: "Environment variables (demo)", optional: true },
  ];
  return (
    <>
      <div className="section-label">Before you deploy</div>
      <ul className="check-list">
        {items.map((i) => <li key={i.label} className={cn(i.ok ? "ok" : "todo")}><span>{i.ok ? <Check size={12} /> : "○"}</span>{i.label}{!i.ok && i.optional && <small>optional</small>}</li>)}
      </ul>
      {project.deployments[0] && <p className="muted small">Last deployment {ago(project.deployments[0].createdAt)} to {project.deployments[0].target}.</p>}
      <Button variant="primary" onClick={() => router.push(`/project/${project.id}/deploy`)}><Rocket size={14} /> Go to Deploy</Button>
    </>
  );
}

/* ---------- workspace ---------- */

export function BuildWorkspace({ project }: { project: Project }) {
  const [inspect, setInspect] = useState(false);
  const [selected, setSelected] = useState<Section | null>(null);
  const [tab, setTab] = useState("activity");
  const [prefill, setPrefill] = useState("");
  const [pane, setPane] = useState<"chat" | "preview" | "details">("chat");
  const wide = useMedia("(min-width: 1080px)", true);
  const { openPalette } = useShell();

  const onSelect = (s: Section | null) => { setSelected(s); if (s) { setTab("inspect"); if (!wide) setPane("details"); } };
  const askAbout = (t: string) => { setPrefill(t); if (!wide) setPane("chat"); };

  const context = (
    <div className="context">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList label="Project context"><TabsTrigger value="activity">Activity</TabsTrigger><TabsTrigger value="inspect">Inspect</TabsTrigger><TabsTrigger value="connect">Connect</TabsTrigger><TabsTrigger value="ship">Ship</TabsTrigger></TabsList>
        <TabsContent value="activity"><ActivityTab project={project} /></TabsContent>
        <TabsContent value="inspect"><InspectorTab project={project} section={selected} askAbout={askAbout} /></TabsContent>
        <TabsContent value="connect"><ConnectTab project={project} /></TabsContent>
        <TabsContent value="ship"><ShipTab project={project} /></TabsContent>
      </Tabs>
    </div>
  );
  const chat = <ChatPanel project={project} prefill={prefill} clearPrefill={() => setPrefill("")} />;
  const preview = <PreviewPanel project={project} inspect={inspect} setInspect={(v) => { setInspect(v); if (!v) setSelected(null); }} selected={selected?.id ?? null} onSelect={onSelect} />;

  return (
    <div className="workspace">
      {wide ? (
        <Group orientation="horizontal" className="rp-group" id="build-layout">
          <Panel id="chat" defaultSize="27%" minSize="20%" className="rp-panel">{chat}</Panel>
          <Separator className="rp-sep" />
          <Panel id="preview" defaultSize="50%" minSize="30%" className="rp-panel">{preview}</Panel>
          <Separator className="rp-sep" />
          <Panel id="context" defaultSize="23%" minSize="16%" collapsible collapsedSize="0%" className="rp-panel">{context}</Panel>
        </Group>
      ) : (
        <>
          <div className="pane-switch"><Segmented label="Workspace pane" value={pane} onChange={setPane} options={[{ value: "chat", label: "Chat" }, { value: "preview", label: "Preview" }, { value: "details", label: "Details" }]} /><button className="btn ghost icon sm" aria-label="Command menu" onClick={openPalette}><CommandIcon size={15} /></button></div>
          <div className="pane-body">{pane === "chat" ? chat : pane === "preview" ? preview : context}</div>
        </>
      )}
    </div>
  );
}
