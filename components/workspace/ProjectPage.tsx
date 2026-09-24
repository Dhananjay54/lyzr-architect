"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, Code2, Eye, FileCode2, Loader2, Route, Boxes, Package, KeyRound, Info } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Empty, Progress, Status } from "@/components/ui/bits";
import { analyze, generationStages, sectionLabel } from "@/lib/engine";
import { useApp } from "@/lib/store";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BuildWorkspace } from "./BuildWorkspace";
import { DeveloperWorkspace } from "./DeveloperWorkspace";

export function ProjectPage() {
  const params = useParams<{ id: string }>();
  const { state, tour, openTour } = useApp();
  const project = state.projects.find((p) => p.id === params.id);
  const showing = !!project && project.status !== "building" && !(project.origin === "import" && !project.importReviewed);
  const completed = state.onboarding.workspaceTourCompleted;

  // First workspace visit: offer the guided tour once. Skipping or finishing marks it complete.
  useEffect(() => {
    if (!showing || completed || tour.open) return;
    const id = window.setTimeout(openTour, 700);
    return () => window.clearTimeout(id);
  }, [showing, completed, tour.open, openTour]);

  if (!project) {
    return <div className="page"><Empty title="Project not found" body="It may have been deleted, or it belongs to a different browser session." action={<Link href="/projects" className="btn primary">Back to projects</Link>} /></div>;
  }
  if (project.status === "building") return <GenerationView project={project} />;
  if (project.origin === "import" && !project.importReviewed) return <ImportReview project={project} />;
  return project.workspaceMode === "developer" ? <DeveloperWorkspace project={project} /> : <BuildWorkspace project={project} />;
}

/* ------------------------------------------------------------------ */

function GenerationView({ project }: { project: Project }) {
  const router = useRouter();
  const stage = project.generation?.stage ?? 0;
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = window.setInterval(() => setTick((t) => t + 1), 70); return () => window.clearInterval(id); }, []);

  const files = project.files;
  const revealed = Math.max(1, Math.min(files.length, Math.round(((stage + Math.min(1, tick / 40)) / generationStages.length) * files.length) + (stage >= 1 ? 2 : 0)));
  const currentIdx = Math.floor(tick / 14) % revealed;
  const current = files[currentIdx];
  const typed = current ? current.content.slice(0, ((tick % 14) + 1) * 34) : "";
  const total = generationStages.reduce((s, x) => s + x.ms, 0);
  const done = generationStages.slice(0, stage).reduce((s, x) => s + x.ms, 0);
  const pct = Math.min(96, ((done + Math.min(generationStages[stage]?.ms ?? 0, tick * 70 % (generationStages[stage]?.ms ?? 1))) / total) * 100);
  const sections = project.site.sections;
  const shown = Math.round((sections.length * (stage + 0.6)) / generationStages.length);

  return (
    <div className="gen">
      <div className="gen-head">
        <div>
          <p className="eyebrow">Generating</p>
          <h1>Building {project.name}…</h1>
          <p className="lede">{generationStages[stage]?.note}. This is a local simulation: no model is called and nothing leaves your browser.</p>
        </div>
        <div className="gen-side">
          <Progress value={pct} />
          <small className="muted">{Math.round(pct)}% · about {Math.max(1, Math.round((total - done) / 1000))}s left</small>
          <Button size="sm" onClick={() => router.push("/")}>Keep working elsewhere</Button>
        </div>
      </div>

      <div className="gen-grid">
        <ol className="gen-stages" aria-label="Build stages">
          {generationStages.map((s, i) => (
            <li key={s.label} className={cn(i < stage && "done", i === stage && "on")}>
              <span className={cn("step", i < stage ? "done" : i === stage ? "active" : "")}>{i < stage ? <Check size={11} /> : i === stage ? <Loader2 size={11} className="spin" /> : null}</span>
              <div><b>{s.label}</b><small>{i < stage ? "Done" : s.note}</small></div>
            </li>
          ))}
          <li className="gen-prompt"><small>YOUR BRIEF</small><p>{project.prompt}</p></li>
        </ol>

        <div className="gen-code">
          <div className="gen-tree">
            {files.slice(0, revealed).map((f, i) => (
              <motion.div key={f.path} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className={cn("gen-file", i === currentIdx && "on")}><FileCode2 size={12} /> {f.path}</motion.div>
            ))}
          </div>
          <div className="gen-editor"><div className="gen-tab">{current?.path}</div><pre className="mono">{typed}<b className="caret" /></pre></div>
        </div>

        <div className="gen-preview" aria-hidden>
          <div className="gen-frame">
            {sections.slice(0, Math.max(1, shown)).map((s, i) => (
              <motion.div key={s.id} className={cn("gen-block", s.type)} initial={{ opacity: 0, y: 10, scaleY: 0.9 }} animate={{ opacity: 1, y: 0, scaleY: 1 }} transition={{ delay: i * 0.05 }}><span>{sectionLabel[s.type]}</span></motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ImportReview({ project }: { project: Project }) {
  const { reviewImport } = useApp();
  const info = useMemo(() => analyze(project.files), [project.files]);
  const stats = [
    { icon: <FileCode2 size={16} />, label: "Files", value: project.files.length },
    { icon: <Route size={16} />, label: "Routes", value: info.routes.length },
    { icon: <Boxes size={16} />, label: "Components", value: info.components.length },
    { icon: <Package size={16} />, label: "Dependencies", value: project.configuration.dependencies.length },
    { icon: <KeyRound size={16} />, label: "Env variables", value: project.configuration.environmentVariables.length },
  ];
  return (
    <div className="page narrow">
      <div className="page-head">
        <div><p className="eyebrow">Imported project review</p><h1>{project.name} is ready to explore.</h1><p className="lede">Architect read <span className="mono">{project.importedFrom}</span> and built this summary. It is simulated: nothing was uploaded, cloned or executed.</p></div>
        <Status tone="success">Import complete</Status>
      </div>
      <div className="stat-row">
        {stats.map((s, i) => <motion.div key={s.label} className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>{s.icon}<b>{s.value}</b><small>{s.label}</small></motion.div>)}
      </div>
      <div className="two-up">
        <section className="panel-card">
          <h3>Detected</h3>
          <dl className="kv"><dt>Framework</dt><dd><span className="tag">{project.framework} {project.configuration.frameworkVersion}</span></dd><dt>Styling</dt><dd>{project.styling}</dd><dt>Build target</dt><dd>{project.configuration.buildTarget}</dd><dt>Source</dt><dd className="mono">{project.github ? `${project.github.repository}@${project.github.branch}` : "Archive"}</dd></dl>
        </section>
        <section className="panel-card">
          <h3>Worth knowing</h3>
          <ul className="bullets"><li><Info size={12} /> Uses the App Router with {info.routes.filter((r) => r.type === "Page").length} pages and {info.routes.filter((r) => r.type === "API").length} API route.</li><li><Info size={12} /> {project.configuration.environmentVariables.length} environment variables are referenced. Values are demo-only.</li><li><Info size={12} /> No test files were found.</li></ul>
        </section>
      </div>
      <div className="row" style={{ marginTop: 22 }}>
        <Button variant="primary" onClick={() => reviewImport(project.id, "developer")}><Code2 size={15} /> Open in Developer mode <ArrowRight size={15} /></Button>
        <Button onClick={() => reviewImport(project.id, "build")}><Eye size={15} /> Open in Build mode</Button>
      </div>
    </div>
  );
}
