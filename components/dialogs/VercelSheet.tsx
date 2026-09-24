"use client";

import { Check, Loader2, Plus, Triangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConsentModal } from "@/components/integrations/ConsentModal";
import { SourcePath } from "@/components/integrations/SourcePath";
import { Button } from "@/components/ui/button";
import { ConnectorMark, Empty, Field, Status } from "@/components/ui/bits";
import { Sheet } from "@/components/ui/overlay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { connectors } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import { ago, cn, slugify } from "@/lib/utils";

const STAGES = ["Disconnected", "Connecting", "Connected", "Project linked", "Ready to deploy"];

export function VercelSheet({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId?: string }) {
  const { state, connectConnector, disconnectConnector, setVercelTeam, linkVercel, unlinkVercel } = useApp();
  const router = useRouter();
  const vc = connectors.find((c) => c.id === "vercel")!;
  const [pid, setPid] = useState(projectId ?? state.activeProjectId ?? state.projects[0]?.id);
  const project = state.projects.find((p) => p.id === pid);
  const [tab, setTab] = useState("connection");
  const [consent, setConsent] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("new");
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("main");
  const [existing, setExisting] = useState("");

  const connState = state.connectors.vercel;
  const connected = state.vercel.status === "connected";
  const linked = project?.vercel;
  const stage = connState?.status === "connecting" ? 1 : !connected ? 0 : !linked ? 2 : project?.deployments.some((d) => d.target === "Vercel") ? 4 : 3;
  const defaultName = project ? slugify(project.name) : "project";
  const demoProjects = ["architect-orbit", "marketing-site", "docs-portal"];

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()} eyebrow="Integration · simulated" title="Vercel" description="Record a demo account and team, then link a project. Nothing here calls Vercel.">
        <ol className="stages" aria-label="Connection state">
          {STAGES.map((s, i) => (
            <li key={s} className={cn(i < stage && "done", i === stage && "on")}>
              <span>{i < stage ? <Check size={10} /> : i === stage && stage === 1 ? <Loader2 size={10} className="spin" /> : i + 1}</span>{s}
            </li>
          ))}
        </ol>
        {state.projects.length > 1 && (
          <Field label="PROJECT"><select value={pid} onChange={(e) => setPid(e.target.value)}>{state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        )}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList label="Vercel sections">
            <TabsTrigger value="connection">Account</TabsTrigger>
            <TabsTrigger value="project">Project</TabsTrigger>
            <TabsTrigger value="path">Source path</TabsTrigger>
          </TabsList>

          <TabsContent value="connection">
            <div className="conn-card">
              <ConnectorMark mark="▲" hue={0} size={44} />
              <div>
                <b>{connected ? `Connected as ${state.vercel.username}` : connState?.status === "connecting" ? "Connecting…" : "Not connected"}</b>
                <small>{connected ? "Simulated account. No OAuth was performed." : "Link a project and deploy previews from Architect."}</small>
              </div>
              {connected ? <Button size="sm" onClick={() => { disconnectConnector("vercel"); toast("Vercel disconnected"); }}>Disconnect</Button>
                : <Button variant="primary" size="sm" disabled={connState?.status === "connecting"} onClick={() => setConsent(true)}>{connState?.status === "connecting" ? <Loader2 size={14} className="spin" /> : <Triangle size={13} />} Connect Vercel</Button>}
            </div>
            {connected && (
              <Field label="TEAM" hint="Simulated teams for this demo.">
                <select value={state.vercel.team} onChange={(e) => { setVercelTeam(e.target.value); toast.success(`Team set to ${e.target.value}`); }}>{state.vercel.teams.map((t) => <option key={t}>{t}</option>)}</select>
              </Field>
            )}
            <ul className="bullets">{vc.capabilities.map((c) => <li key={c}><Check size={12} /> {c}</li>)}</ul>
            {connected && <Button variant="primary" onClick={() => setTab("project")}>Link a project</Button>}
          </TabsContent>

          <TabsContent value="project">
            {!connected ? (
              <Empty icon={<Triangle size={20} />} title="Connect Vercel first" body="Once an account and team exist you can link or create a project." action={<Button size="sm" variant="primary" onClick={() => setTab("connection")}>Go to account</Button>} />
            ) : linked && project ? (
              <div className="linked-card">
                <div className="row between"><b>{linked.project}</b><Status tone="success">Linked</Status></div>
                <dl>
                  <dt>Team</dt><dd>{linked.team}</dd>
                  <dt>Framework</dt><dd><span className="tag">{linked.framework}</span></dd>
                  <dt>Target branch</dt><dd className="mono">{linked.targetBranch}</dd>
                  <dt>Latest deployment</dt>
                  <dd>{project.deployments.find((d) => d.target === "Vercel") ? <>{project.deployments.find((d) => d.target === "Vercel")!.status === "ready" ? <Status tone="success">Ready</Status> : <Status tone="danger">Failed</Status>} <small>{ago(project.deployments.find((d) => d.target === "Vercel")!.createdAt)}</small></> : <Status tone="neutral">No deployments yet</Status>}</dd>
                </dl>
                <p className="note">Simulated project. URLs use architect.demo.</p>
                <div className="row"><Button size="sm" onClick={() => { setName(linked.project); setBranch(linked.targetBranch); unlinkVercel(project.id); }}>Change link</Button><Button size="sm" variant="primary" onClick={() => { onClose(); router.push(`/project/${project.id}/deploy`); }}>Deploy to this project</Button></div>
              </div>
            ) : (
              <>
                <div className="seg-line">
                  <button className={cn("chip", mode === "new" && "on")} onClick={() => setMode("new")}>Create project</button>
                  <button className={cn("chip", mode === "existing" && "on")} onClick={() => setMode("existing")}>Link existing</button>
                </div>
                {mode === "new" ? (
                  <>
                    <Field label="PROJECT NAME"><input value={name} onChange={(e) => setName(e.target.value)} placeholder={defaultName} /></Field>
                    <div className="two-col">
                      <Field label="FRAMEWORK"><input readOnly value={project?.framework ?? "Next.js"} /></Field>
                      <Field label="TARGET BRANCH"><select value={branch} onChange={(e) => setBranch(e.target.value)}><option>main</option><option>staging</option></select></Field>
                    </div>
                  </>
                ) : (
                  <div className="repo-list" role="radiogroup" aria-label="Existing projects">
                    {demoProjects.map((n) => (
                      <button key={n} role="radio" aria-checked={existing === n} className={cn("repo", existing === n && "on")} onClick={() => setExisting(n)}>
                        <span className="repo-radio">{existing === n && <Check size={11} />}</span>
                        <span className="repo-body"><b>{n}</b><small>{state.vercel.team} · Next.js</small></span>
                      </button>
                    ))}
                  </div>
                )}
                <Button variant="primary" disabled={!project || (mode === "existing" && !existing)} onClick={() => {
                  if (!project) return;
                  const link = { project: mode === "new" ? slugify(name || defaultName) : existing, team: state.vercel.team ?? "Personal", targetBranch: branch };
                  linkVercel(project.id, link); toast.success(`Linked ${link.project}`, { description: "Simulated link. No Vercel project was created." });
                }}><Plus size={14} /> {mode === "new" ? "Create and link project" : "Link project"}</Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="path">
            {project ? <SourcePath project={project} /> : <Empty title="No project" />}
            <p className="note">Deploy uses this path. GitHub is optional; Vercel is preferred when linked.</p>
          </TabsContent>
        </Tabs>
      </Sheet>
      <ConsentModal connector={vc} open={consent} onOpenChange={setConsent} onAllow={(a) => connectConnector("vercel", a)} />
    </>
  );

}
