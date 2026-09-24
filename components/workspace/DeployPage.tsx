"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Check, Copy, ExternalLink, Loader2, Rocket, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { SiteThumb } from "@/components/preview/SitePreview";
import { Hint } from "@/components/shell/Hint";
import { useShell } from "@/components/shell/shell-context";
import { SourcePath } from "@/components/integrations/SourcePath";
import { Button } from "@/components/ui/button";
import { Empty, Field, Progress, Segmented, Status, StepGlyph } from "@/components/ui/bits";
import { useApp } from "@/lib/store";
import type { Deployment, Project } from "@/lib/types";
import { ago, cn, hash, slugify, uid } from "@/lib/utils";

type Target = Deployment["target"];
const STAGES = [
  { label: "Queued", note: "Waiting for a build slot", ms: 700, log: ["Deployment queued", "Build slot assigned"] },
  { label: "Building", note: "Compiling the project", ms: 1700, log: ["Installing dependencies", "Compiling routes and components", "Optimising assets"] },
  { label: "Running checks", note: "Lint, types and smoke test", ms: 1300, log: ["Lint passed", "Type check passed", "Smoke test passed"] },
  { label: "Assigning URL", note: "Publishing to the target", ms: 900, log: ["Uploading build output", "Assigning a preview URL"] },
  { label: "Ready", note: "Deployment is live (simulated)", ms: 300, log: ["Deployment ready"] },
];

function Burst() {
  const bits = useMemo(() => Array.from({ length: 26 }, (_, i) => ({ a: (i / 26) * Math.PI * 2 + Math.random() * 0.4, d: 70 + Math.random() * 90, r: Math.random() * 360, c: i % 3 }))
    , []);
  return (
    <div className="burst" aria-hidden>
      {bits.map((b, i) => <motion.i key={i} className={`c${b.c}`} initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }} animate={{ x: Math.cos(b.a) * b.d, y: Math.sin(b.a) * b.d + 24, opacity: 0, rotate: b.r, scale: 0.6 }} transition={{ duration: 1.1, ease: "easeOut" }} />)}
    </div>
  );
}

export function DeployPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { state, recordDeployment } = useApp();
  const { openDialog, setPresenting } = useShell();
  const project = state.projects.find((p) => p.id === params.id);

  const [target, setTarget] = useState<Target>("Vercel");
  const [env, setEnv] = useState("Preview");
  const [branch, setBranch] = useState("main");
  const [fail, setFail] = useState(false);
  const [phase, setPhase] = useState<"configure" | "deploying" | "success" | "failed">("configure");
  const [stage, setStage] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [result, setResult] = useState<Deployment | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  useEffect(() => { if (project?.vercel && target === "Vercel") setBranch(project.vercel.targetBranch); else if (project?.github) setBranch(project.github.branch); }, [project?.vercel, project?.github, target]);
  useEffect(() => { if (project && !project.vercel) { /* Vercel stays the primary option even if not linked. */ } }, [project]);

  if (!project) return <div className="page"><Empty title="Project not found" action={<Link href="/projects" className="btn primary">Back to projects</Link>} /></div>;

  const vercelReady = state.vercel.status === "connected" && !!project.vercel;
  const envCount = project.configuration.environmentVariables.length;
  const checks: { label: string; ok: boolean; optional?: boolean; note: string; action?: { label: string; run: () => void } }[] = [
    { label: "Project generated", ok: true, note: `${project.files.length} files ready` },
    { label: "Preview checked", ok: !!project.previewChecked, note: project.previewChecked ? "You looked at the preview" : "Open the preview once before shipping", action: { label: "Open preview", run: () => setPresenting(true) } },
    { label: "GitHub repository connected", ok: !!project.github, optional: true, note: project.github ? project.github.repository : "Optional. Keeps source in step with the deploy.", action: { label: project.github ? "Manage" : "Connect", run: () => openDialog({ kind: "github", projectId: project.id, tab: state.github.status === "connected" ? "repository" : "connection" }) } },
    { label: "Vercel project connected", ok: vercelReady, optional: true, note: vercelReady ? project.vercel!.project : "Optional. Preferred target for Next.js.", action: { label: vercelReady ? "Manage" : "Connect", run: () => openDialog({ kind: "vercel", projectId: project.id }) } },
    { label: "Environment variables", ok: envCount > 0, optional: true, note: `${envCount} demo ${envCount === 1 ? "variable" : "variables"}`, action: { label: "Edit", run: () => { router.push(`/project/${project.id}`); } } },
  ];
  const required = checks.filter((c) => !c.optional);
  const blocked = required.some((c) => !c.ok && c.label !== "Preview checked");

  const start = () => {
    timers.current.forEach(window.clearTimeout); timers.current = [];
    setPhase("deploying"); setStage(0); setLog([]); setResult(null);
    const t0 = Date.now();
    let t = 0;
    STAGES.forEach((s, i) => {
      if (fail && i === 2) {
        timers.current.push(window.setTimeout(() => { setStage(2); setLog((l) => [...l, "Lint passed", "Type check failed: components/hero.tsx:12"]); }, t));
        timers.current.push(window.setTimeout(() => {
          const d = makeDeployment(project, target, env, branch, "failed", Date.now() - t0);
          recordDeployment(project.id, d); setResult(d); setPhase("failed");
        }, t + s.ms));
        t = Infinity; return;
      }
      if (t === Infinity) return;
      timers.current.push(window.setTimeout(() => { setStage(i); s.log.forEach((line, k) => timers.current.push(window.setTimeout(() => setLog((l) => [...l, line]), k * (s.ms / (s.log.length + 1))))); }, t));
      t += s.ms;
    });
    if (t !== Infinity) timers.current.push(window.setTimeout(() => {
      const d = makeDeployment(project, target, env, branch, "ready", Date.now() - t0);
      recordDeployment(project.id, d); setResult(d); setStage(STAGES.length); setPhase("success");
      toast.success("Deployment ready (simulated)", { description: d.url });
    }, t));
  };

  const pct = phase === "deploying" ? ((stage + 0.4) / STAGES.length) * 100 : phase === "success" ? 100 : (2.5 / STAGES.length) * 100;
  const history = project.deployments;

  return (
    <div className="page narrow-wide deploy">
      <div className="page-head">
        <div><Link href={`/project/${project.id}`} className="back"><ArrowLeft size={14} /> {project.name}</Link><p className="eyebrow">Deploy</p><h1>Ship it with confidence.</h1><p className="lede">Choose a target, check the path your changes will take, and deploy. Deployments here are simulated: URLs use architect.demo and nothing goes live.</p></div>
      </div>
      <Hint id="deploy" title="Simulated deployment.">A staged progress run, then a static preview URL you can open. No real infrastructure is touched.</Hint>

      <div className="deploy-grid">
        <div className="deploy-main">
          <AnimatePresence mode="wait" initial={false}>
            {phase === "configure" && (
              <motion.section key="cfg" className="panel-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="section-label">1 · Target</div>
                <div className="target-grid" role="radiogroup" aria-label="Deployment target">
                  {([["Vercel", "Preferred for Next.js", vercelReady ? `Linked: ${project.vercel!.project}` : "Not linked yet", true], ["Architect hosting", "Static demo hosting", "Ready", false], ["Netlify", "Secondary option", "Ready", false]] as const).map(([t, d, note, primary]) => (
                    <button key={t} role="radio" aria-checked={target === t} className={cn("target", target === t && "on")} onClick={() => setTarget(t)}>
                      <span className="target-top"><b>{t}</b>{primary && <Status tone="accent" dot={false}>Recommended</Status>}</span>
                      <small>{d}</small><em className={cn(note.startsWith("Linked") && "ok")}>{note}</em>
                    </button>
                  ))}
                </div>
                <div className="deploy-fields">
                  <Field label="ENVIRONMENT"><Segmented label="Environment" value={env} onChange={setEnv} options={["Preview", "Staging", "Production"].map((v) => ({ value: v, label: v }))} /></Field>
                  <Field label="BRANCH"><select value={branch} onChange={(e) => setBranch(e.target.value)}><option>main</option><option>staging</option><option>release</option></select></Field>
                </div>

                <div className="section-label" style={{ marginTop: 22 }}>2 · Source path</div>
                <SourcePath project={project} target={target} environment={env} />

                <div className="section-label" style={{ marginTop: 22 }}>3 · Pre-deploy checklist</div>
                <ul className="preflight">
                  {checks.map((c) => (
                    <li key={c.label} className={cn(c.ok ? "ok" : c.optional ? "opt" : "todo")}>
                      <span className="pf-icon">{c.ok ? <Check size={13} /> : c.optional ? "○" : "!"}</span>
                      <span className="pf-text"><b>{c.label}</b>{c.optional && <i>optional</i>}<small>{c.note}</small></span>
                      {c.action && <Button size="sm" onClick={c.action.run}>{c.action.label}</Button>}
                    </li>
                  ))}
                </ul>

                <label className="check adv"><input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} /> Simulate a failed check <small>Shows the error and retry states</small></label>
                <div className="row end">
                  <Button onClick={() => router.push(`/project/${project.id}`)}>Back to workspace</Button>
                  <Button variant="primary" disabled={blocked} onClick={start}><Rocket size={15} /> Deploy to {target} · {env}</Button>
                </div>
              </motion.section>
            )}

            {phase === "deploying" && (
              <motion.section key="run" className="panel-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} aria-live="polite">
                <div className="row between"><div><p className="eyebrow">Deploying</p><h3>{project.name} to {target} · {env}</h3></div><Loader2 className="spin" size={20} color="var(--accent)" /></div>
                <Progress value={pct} />
                <ol className="deploy-stages">
                  {STAGES.map((s, i) => <li key={s.label} className={cn(i < stage && "done", i === stage && "on")}><StepGlyph state={i < stage ? "done" : i === stage ? "active" : "pending"} /><div><b>{s.label}</b><small>{i <= stage ? s.note : ""}</small></div></li>)}
                </ol>
                <div className="terminal short" role="log">{log.map((l, i) => <div key={i} className="term-line">{`› ${l}`}</div>)}</div>
              </motion.section>
            )}

            {phase === "success" && result && (
              <motion.section key="ok" className="panel-card success-card" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <Burst />
                <div className="success-badge"><Check size={26} /></div>
                <p className="eyebrow">Deployed · simulated</p>
                <h2>{project.name} is live at a demo URL.</h2>
                <div className="url-row"><span className="mono">{result.url}</span>
                  <Button size="sm" onClick={async () => { try { await navigator.clipboard.writeText(result.url); } catch { /* blocked */ } toast.success("URL copied", { description: "Demo URL. Not reachable outside this session." }); }}><Copy size={13} /> Copy</Button>
                  <Button size="sm" variant="primary" onClick={() => window.open(`/deployed/${result.id}`, "_blank")}><ExternalLink size={13} /> Open static preview</Button></div>
                <dl className="kv summary">
                  <dt>Target</dt><dd>{result.target}</dd><dt>Environment</dt><dd>{result.environment}</dd><dt>Branch</dt><dd className="mono">{result.branch}</dd>
                  <dt>Commit</dt><dd className="mono">{result.commit ?? "local changes"}</dd><dt>Files</dt><dd>{result.fileCount}</dd><dt>Duration</dt><dd>{(result.durationMs / 1000).toFixed(1)}s</dd>
                  <dt>Source path</dt><dd>{result.source.join(" → ")}</dd>
                </dl>
                <div className="row wrap"><Button onClick={() => router.push(`/project/${project.id}`)}>Back to workspace</Button><Button onClick={() => { setPhase("configure"); }}>Deploy again</Button><Button onClick={() => router.push("/projects")}>All projects</Button></div>
              </motion.section>
            )}

            {phase === "failed" && (
              <motion.section key="fail" className="panel-card fail-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="fail-badge"><AlertTriangle size={24} /></div>
                <p className="eyebrow">Deployment failed · simulated</p>
                <h2>The type check stopped the deployment.</h2>
                <div className="terminal short">{log.map((l, i) => <div key={i} className={cn("term-line", l.includes("failed") && "err")}>{`› ${l}`}</div>)}</div>
                <p className="note">Nothing was published. Fix the error, or turn off “Simulate a failed check” and retry.</p>
                <div className="row wrap"><Button variant="primary" onClick={() => { setFail(false); setPhase("configure"); }}><RotateCcw size={14} /> Adjust and retry</Button><Button onClick={() => router.push(`/project/${project.id}`)}>Open workspace</Button></div>
              </motion.section>
            )}
          </AnimatePresence>

          <section className="panel-card">
            <div className="row between"><h3>Deployment history</h3><small className="muted">This session</small></div>
            {history.length === 0 ? <Empty title="No deployments yet" body="Your first deployment will show up here with its URL and status." /> : (
              <div className="table compact">
                {history.map((d) => (
                  <div key={d.id} className="tr">
                    <span><Status tone={d.status === "ready" ? "success" : "danger"}>{d.status === "ready" ? "Ready" : "Failed"}</Status></span>
                    <span className="tr-name"><b>{d.target} · {d.environment}</b><small className="mono">{d.url}</small></span>
                    <span className="muted">{ago(d.createdAt)}</span>
                    <span className="row tight">{d.status === "ready" && <Button size="sm" onClick={() => window.open(`/deployed/${d.id}`, "_blank")}><ExternalLink size={12} /> Open</Button>}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="deploy-side">
          <div className="panel-card">
            <SiteThumb site={project.site} />
            <div className="pc-top" style={{ marginTop: 12 }}><h3>{project.name}</h3><Status tone={project.status === "deployed" ? "info" : "success"}>{project.status === "deployed" ? "Deployed" : "Ready"}</Status></div>
            <dl className="kv small"><dt>Framework</dt><dd>{project.framework}</dd><dt>Styling</dt><dd>{project.styling}</dd><dt>Files</dt><dd>{project.files.length}</dd><dt>Last deploy</dt><dd>{history[0] ? ago(history[0].createdAt) : "Never"}</dd></dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

function makeDeployment(project: Project, target: Target, env: string, branch: string, status: Deployment["status"], ms: number): Deployment {
  const slug = slugify(project.name);
  const sha = project.github?.lastCommit;
  const url = env === "Production" ? `https://${slug}.architect.demo` : `https://${slug}-${hash(slug + Date.now(), 5)}.architect.demo`;
  const source = ["Local changes", ...(project.github ? [`GitHub · ${project.github.repository}`] : []), target === "Vercel" && project.vercel ? `Vercel · ${project.vercel.project}` : target];
  return { id: uid("d"), target, environment: env, branch, url, status, createdAt: new Date().toISOString(), durationMs: Math.max(ms, 1000), commit: sha, source, site: project.site, fileCount: project.files.length };
}
