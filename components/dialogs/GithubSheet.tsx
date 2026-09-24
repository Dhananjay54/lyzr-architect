"use client";

import { Check, GitCommit, GitFork, Loader2, Lock, Globe, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConsentModal } from "@/components/integrations/ConsentModal";
import { Button } from "@/components/ui/button";
import { ConnectorMark, Empty, Field, Status } from "@/components/ui/bits";
import { Sheet } from "@/components/ui/overlay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { connectors } from "@/lib/catalog";
import { diffLines, diffStat } from "@/lib/diff";
import { useApp } from "@/lib/store";
import { ago, cn } from "@/lib/utils";

const STAGES = ["Disconnected", "Connecting", "Connected", "Repository selected", "Sync ready"];

export function GithubSheet({ open, onClose, projectId, initialTab = "connection" }: { open: boolean; onClose: () => void; projectId?: string; initialTab?: "connection" | "repository" | "commit" }) {
  const { state, connectConnector, disconnectConnector, createRepo, selectRepo, commitPush } = useApp();
  const gh = connectors.find((c) => c.id === "github")!;
  const [pid, setPid] = useState(projectId ?? state.activeProjectId ?? state.projects[0]?.id);
  const project = state.projects.find((p) => p.id === pid);
  const [tab, setTab] = useState<string>(initialTab);
  const [consent, setConsent] = useState(false);
  const [creating, setCreating] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [desc, setDesc] = useState("");
  const [message, setMessage] = useState("");
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [pushing, setPushing] = useState(false);
  const [pushed, setPushed] = useState<{ sha: string; count: number } | null>(null);

  const connState = state.connectors.github;
  const connected = state.github.status === "connected";
  const changed = useMemo(() => (project?.files ?? []).filter((f) => f.committed !== f.content), [project?.files]);
  const selected = changed.filter((f) => picked[f.path] !== false);
  const stage = connState?.status === "connecting" ? 1 : !connected ? 0 : !project?.github ? 2 : changed.length ? 3 : 4;

  const doPush = () => {
    if (!project || !selected.length) return;
    setPushing(true);
    window.setTimeout(() => {
      const sha = commitPush(project.id, message || `Update ${project.name}`, selected.map((f) => f.path));
      setPushing(false); setPushed({ sha, count: selected.length });
      toast.success("Push complete (simulated)", { description: `${selected.length} files · ${sha}` });
    }, 1100);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()} eyebrow="Integration · simulated" title="GitHub" description="Connect an account, choose a repository, then commit and push. Everything here is a local demo.">
        <ol className="stages" aria-label="Connection state">
          {STAGES.map((s, i) => (
            <li key={s} className={cn(i < stage && "done", i === stage && "on")}>
              <span>{i < stage ? <Check size={10} /> : i === stage && stage === 1 ? <Loader2 size={10} className="spin" /> : i + 1}</span>{s}
            </li>
          ))}
        </ol>

        {state.projects.length > 1 && (
          <Field label="PROJECT"><select value={pid} onChange={(e) => { setPid(e.target.value); setPushed(null); }}>{state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList label="GitHub sections">
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="repository">Repository</TabsTrigger>
            <TabsTrigger value="commit" count={changed.length}>Commit</TabsTrigger>
          </TabsList>

          <TabsContent value="connection">
            <div className="conn-card">
              <ConnectorMark mark="GH" hue={0} size={44} />
              <div>
                <b>{connected ? `Connected as @${state.github.username}` : connState?.status === "connecting" ? "Connecting…" : "Not connected"}</b>
                <small>{connected ? "Simulated account. No token was created." : "Grant Architect access to repositories you choose."}</small>
              </div>
              {connected ? <Button size="sm" onClick={() => { disconnectConnector("github"); toast("GitHub disconnected"); }}>Disconnect</Button>
                : <Button variant="primary" size="sm" disabled={connState?.status === "connecting"} onClick={() => setConsent(true)}>{connState?.status === "connecting" ? <Loader2 size={14} className="spin" /> : <GitFork size={14} />} Connect GitHub</Button>}
            </div>
            <ul className="bullets">{gh.capabilities.map((c) => <li key={c}><Check size={12} /> {c}</li>)}</ul>
            {connected && <Button variant="primary" onClick={() => setTab("repository")}>Choose a repository</Button>}
          </TabsContent>

          <TabsContent value="repository">
            {!connected ? (
              <Empty icon={<GitFork size={20} />} title="Connect GitHub first" body="Repositories appear here once an account is connected." action={<Button variant="primary" size="sm" onClick={() => setTab("connection")}>Go to connection</Button>} />
            ) : (
              <>
                <div className="repo-list" role="radiogroup" aria-label="Repositories">
                  {state.github.repos.map((r) => {
                    const on = project?.github?.repository === r.name;
                    return (
                      <button key={r.name} role="radio" aria-checked={on} className={cn("repo", on && "on")} onClick={() => { if (project) { selectRepo(project.id, r.name); toast.success(`Linked ${r.name}`, { description: "Simulated link. Nothing was cloned." }); } }}>
                        <span className="repo-radio">{on && <Check size={11} />}</span>
                        <span className="repo-body"><b>{state.github.username}/{r.name}</b><small>{r.description}</small></span>
                        <span className="repo-meta">{r.draft && <Status tone="accent" dot={false}>Draft</Status>}<Status tone="neutral" dot={false}>{r.visibility === "private" ? <Lock size={10} /> : <Globe size={10} />} {r.visibility}</Status><small>{r.language} · {r.updated}</small></span>
                      </button>
                    );
                  })}
                </div>
                {creating ? (
                  <div className="inline-form">
                    <Field label="REPOSITORY NAME"><input autoFocus value={repoName} onChange={(e) => setRepoName(e.target.value)} placeholder={project ? project.name.toLowerCase().replace(/\s+/g, "-") : "my-project"} /></Field>
                    <Field label="DESCRIPTION"><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional" /></Field>
                    <div className="row"><label className="radio"><input type="radio" checked={visibility === "private"} onChange={() => setVisibility("private")} /> Private</label><label className="radio"><input type="radio" checked={visibility === "public"} onChange={() => setVisibility("public")} /> Public</label></div>
                    <div className="row end">
                      <Button size="sm" onClick={() => setCreating(false)}>Cancel</Button>
                      <Button size="sm" variant="primary" onClick={() => {
                        const name = repoName.trim() || project?.name.toLowerCase().replace(/\s+/g, "-") || "new-repo";
                        createRepo(name, visibility, desc); if (project) selectRepo(project.id, name.toLowerCase().replace(/[^a-z0-9]+/g, "-")); setCreating(false); setRepoName(""); setDesc("");
                        toast.success("Repository draft created", { description: "Local draft only. Nothing exists on GitHub." });
                      }}>Create draft</Button>
                    </div>
                  </div>
                ) : <Button onClick={() => setCreating(true)}><Plus size={14} /> Create a repository draft</Button>}
              </>
            )}
          </TabsContent>

          <TabsContent value="commit">
            {!connected || !project?.github ? (
              <Empty icon={<GitCommit size={20} />} title={!connected ? "Connect GitHub first" : "Choose a repository first"} body="Changed files can be committed once a repository is linked." action={<Button size="sm" variant="primary" onClick={() => setTab(!connected ? "connection" : "repository")}>{!connected ? "Go to connection" : "Choose a repository"}</Button>} />
            ) : pushed ? (
              <div className="push-done">
                <div className="push-check"><Check size={22} /></div>
                <h4>Pushed {pushed.count} {pushed.count === 1 ? "file" : "files"} to {project.github.repository}</h4>
                <p className="mono">{project.github.branch} · {pushed.sha}</p>
                <p className="note">Simulated push. No commit exists on GitHub.</p>
                <div className="row"><Button size="sm" onClick={() => { setPushed(null); setMessage(""); }}>Make another commit</Button><Button size="sm" variant="primary" onClick={() => { onClose(); }}>Done</Button></div>
              </div>
            ) : changed.length === 0 ? (
              <Empty icon={<Check size={20} />} title="Sync ready" body={`Everything in ${project.name} matches the last push${project.github.lastPushAt ? ` (${ago(project.github.lastPushAt)})` : ""}.`} />
            ) : (
              <>
                <div className="section-label">Changed files · {selected.length} of {changed.length} selected</div>
                <ul className="commit-files">
                  {changed.map((f) => {
                    const st = diffStat(diffLines(f.committed ?? "", f.content));
                    return (
                      <li key={f.path}>
                        <label><input type="checkbox" checked={picked[f.path] !== false} onChange={(e) => setPicked({ ...picked, [f.path]: e.target.checked })} /> <span className="mono">{f.path}</span></label>
                        <span className="commit-stat"><Status tone={f.committed === null ? "success" : "accent"} dot={false}>{f.committed === null ? "New" : "Modified"}</Status><i className="add">+{st.added}</i><i className="del">−{st.removed}</i></span>
                      </li>
                    );
                  })}
                </ul>
                <Field label="COMMIT MESSAGE"><textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Update ${project.name}`} /></Field>
                <Button variant="primary" disabled={pushing || !selected.length} onClick={doPush}>{pushing ? <Loader2 size={15} className="spin" /> : <GitCommit size={15} />} {pushing ? "Pushing…" : `Commit and push to ${project.github.branch}`}</Button>
                <p className="note">Simulated push to {state.github.username}/{project.github.repository}.</p>
              </>
            )}
          </TabsContent>
        </Tabs>
      </Sheet>
      <ConsentModal connector={gh} open={consent} onOpenChange={setConsent} onAllow={(a) => connectConnector("github", a)} />
    </>
  );
}
