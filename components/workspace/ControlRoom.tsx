"use client";

import { Eye, EyeOff, Plus, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Status } from "@/components/ui/bits";
import { Modal } from "@/components/ui/overlay";
import { suggestedDependencies } from "@/lib/engine";
import { useApp } from "@/lib/store";
import type { EnvVar, Project, Styling } from "@/lib/types";
import { uid } from "@/lib/utils";

const VERSIONS: Record<string, string[]> = { "Next.js": ["14.x", "15.x", "16.x"], React: ["18.x", "19.x"], Other: ["1.x"] };

export function ControlRoom({ project }: { project: Project }) {
  const { updateConfig, resetConfig, patchProject } = useApp();
  const c = project.configuration;
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [depName, setDepName] = useState("");
  const [depVersion, setDepVersion] = useState("^1.0.0");
  const [envKey, setEnvKey] = useState("");
  const [envValue, setEnvValue] = useState("");
  const [envScope, setEnvScope] = useState<EnvVar["scope"]>("all");
  const [envSecret, setEnvSecret] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const suggested = suggestedDependencies(c);

  const addDep = (name: string, version: string, kind: "runtime" | "dev" = "runtime") => {
    const n = name.trim();
    if (!n || c.dependencies.some((d) => d.name === n)) { toast.error(n ? `${n} is already installed` : "Enter a package name"); return; }
    updateConfig(project.id, (cfg) => ({ ...cfg, dependencies: [...cfg.dependencies, { id: uid("dep"), name: n, version, kind }] }));
    toast.success(`Added ${n} locally`, { description: "package.json shows the change in Changes." });
    setDepName("");
  };
  const addEnv = () => {
    const key = envKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    if (!key) { toast.error("Enter a variable name"); return; }
    if (c.environmentVariables.some((e) => e.key === key)) { toast.error(`${key} already exists`); return; }
    updateConfig(project.id, (cfg) => ({ ...cfg, environmentVariables: [...cfg.environmentVariables, { id: uid("env"), key, value: envValue, scope: envScope, secret: envSecret }] }));
    setEnvKey(""); setEnvValue(""); setEnvSecret(false);
  };

  return (
    <div className="control-room">
      <div className="cr-head">
        <div><h3>Control Room</h3><Status tone="info" dot={false}>Local demo configuration</Status></div>
        <p>Project levers you can change here. Nothing runs and nothing is sent anywhere.</p>
      </div>

      <section className="cr-card">
        <h4>Runtime</h4>
        <Field label="FRAMEWORK VERSION">
          <select value={c.frameworkVersion} onChange={(e) => updateConfig(project.id, (cfg) => ({ ...cfg, frameworkVersion: e.target.value }))}>{(VERSIONS[project.framework] ?? VERSIONS.Other).map((v) => <option key={v}>{v}</option>)}</select>
        </Field>
        <Field label="STYLING SYSTEM">
          <select value={c.styling} onChange={(e) => { const s = e.target.value as Styling; patchProject(project.id, (p) => ({ ...p, styling: s })); updateConfig(project.id, (cfg) => ({ ...cfg, styling: s })); }}>{["Tailwind CSS", "CSS Modules", "Vanilla CSS", "styled-components"].map((v) => <option key={v}>{v}</option>)}</select>
        </Field>
        <Field label="BUILD TARGET">
          <select value={c.buildTarget} onChange={(e) => updateConfig(project.id, (cfg) => ({ ...cfg, buildTarget: e.target.value as typeof c.buildTarget }))}>{["Vercel", "Node server", "Static export"].map((v) => <option key={v}>{v}</option>)}</select>
        </Field>
      </section>

      <section className="cr-card">
        <div className="row between"><h4>Dependencies</h4><small className="muted">{c.dependencies.length}</small></div>
        <ul className="cr-list">
          {c.dependencies.map((d) => (
            <li key={d.id}>
              <span className="cr-name">{d.name}{d.kind === "dev" && <i>dev</i>}</span>
              <input className="cr-ver" aria-label={`${d.name} version`} defaultValue={d.version} onBlur={(e) => { if (e.target.value !== d.version) updateConfig(project.id, (cfg) => ({ ...cfg, dependencies: cfg.dependencies.map((x) => (x.id === d.id ? { ...x, version: e.target.value } : x)) })); }} />
              <button className="btn ghost icon sm" aria-label={`Remove ${d.name}`} onClick={() => updateConfig(project.id, (cfg) => ({ ...cfg, dependencies: cfg.dependencies.filter((x) => x.id !== d.id) }))}><X size={13} /></button>
            </li>
          ))}
        </ul>
        {suggested.length > 0 && <div className="chips">{suggested.slice(0, 4).map((s) => <button key={s.name} className="chip" onClick={() => addDep(s.name, s.version)}><Plus size={11} /> {s.name}</button>)}</div>}
        <div className="cr-add">
          <input value={depName} onChange={(e) => setDepName(e.target.value)} placeholder="package name" aria-label="New dependency name" onKeyDown={(e) => e.key === "Enter" && addDep(depName, depVersion)} />
          <input value={depVersion} onChange={(e) => setDepVersion(e.target.value)} aria-label="New dependency version" className="cr-ver" />
          <Button size="sm" onClick={() => addDep(depName, depVersion)}>Add</Button>
        </div>
      </section>

      <section className="cr-card">
        <div className="row between"><h4>Environment variables</h4><small className="muted">{c.environmentVariables.length}</small></div>
        <ul className="cr-list env">
          {c.environmentVariables.map((e) => (
            <li key={e.id}>
              <span className="cr-name mono">{e.key}</span>
              <input className="cr-val" aria-label={`${e.key} value`} type={e.secret && !reveal[e.id] ? "password" : "text"} value={e.value} onChange={(ev) => updateConfig(project.id, (cfg) => ({ ...cfg, environmentVariables: cfg.environmentVariables.map((x) => (x.id === e.id ? { ...x, value: ev.target.value } : x)) }))} />
              {e.secret && <button className="btn ghost icon sm" aria-label={reveal[e.id] ? "Hide value" : "Reveal value"} onClick={() => setReveal({ ...reveal, [e.id]: !reveal[e.id] })}>{reveal[e.id] ? <EyeOff size={13} /> : <Eye size={13} />}</button>}
              <select className="cr-scope" aria-label={`${e.key} scope`} value={e.scope} onChange={(ev) => updateConfig(project.id, (cfg) => ({ ...cfg, environmentVariables: cfg.environmentVariables.map((x) => (x.id === e.id ? { ...x, scope: ev.target.value as EnvVar["scope"] } : x)) }))}><option value="all">All</option><option value="preview">Preview</option><option value="production">Production</option></select>
              <button className="btn ghost icon sm" aria-label={`Remove ${e.key}`} onClick={() => updateConfig(project.id, (cfg) => ({ ...cfg, environmentVariables: cfg.environmentVariables.filter((x) => x.id !== e.id) }))}><X size={13} /></button>
            </li>
          ))}
        </ul>
        <div className="cr-add env">
          <input value={envKey} onChange={(e) => setEnvKey(e.target.value)} placeholder="KEY" aria-label="New variable name" />
          <input value={envValue} onChange={(e) => setEnvValue(e.target.value)} placeholder="value" aria-label="New variable value" type={envSecret ? "password" : "text"} />
          <select value={envScope} onChange={(e) => setEnvScope(e.target.value as EnvVar["scope"])} aria-label="New variable scope"><option value="all">All</option><option value="preview">Preview</option><option value="production">Production</option></select>
          <label className="check"><input type="checkbox" checked={envSecret} onChange={(e) => setEnvSecret(e.target.checked)} /> Secret</label>
          <Button size="sm" onClick={addEnv}>Add</Button>
        </div>
        <p className="note">Demo values only. Never paste a real secret here.</p>
      </section>

      <Button className="cr-reset" onClick={() => setConfirm(true)}><RotateCcw size={14} /> Reset to generated defaults</Button>
      <Modal open={confirm} onOpenChange={setConfirm} title="Reset configuration?" description="Dependencies, environment variables and runtime settings return to what Architect generated." footer={<><Button onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" onClick={() => { resetConfig(project.id); setConfirm(false); toast.success("Configuration reset"); }}>Reset</Button></>}>
        <p className="note">This does not touch your file edits.</p>
      </Modal>
    </div>
  );
}
