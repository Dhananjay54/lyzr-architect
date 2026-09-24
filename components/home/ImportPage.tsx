"use client";

import { Archive, ArrowRight, Check, FileArchive, GitFork, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Progress, Segmented } from "@/components/ui/bits";
import { Modal } from "@/components/ui/overlay";
import { useApp } from "@/lib/store";
import type { Framework } from "@/lib/types";
import { cn } from "@/lib/utils";

const SAMPLE_REPOS = ["https://github.com/lyzr-labs/orbit-dashboard", "https://github.com/acme/storefront", "https://github.com/dhananjay-dev/field-notes"];
const SAMPLE_ZIPS = [{ name: "orbit-dashboard.zip", size: "2.4 MB" }, { name: "storefront-app.zip", size: "5.1 MB" }, { name: "portfolio-site.zip", size: "1.2 MB" }];
const STEPS = ["Reading source", "Detecting framework", "Mapping routes and components", "Reading dependencies"];

export function ImportPage() {
  const router = useRouter();
  const { importProject } = useApp();
  const [source, setSource] = useState<"repo" | "zip">("repo");
  const [url, setUrl] = useState("");
  const [zip, setZip] = useState<{ name: string; size: string } | null>(null);
  const [picker, setPicker] = useState(false);
  const [framework, setFramework] = useState<Framework>("Next.js");
  const [step, setStep] = useState(-1);

  const valid = source === "repo" ? /^(https?:\/\/)?[\w.-]+\/[\w.-]+\/[\w.-]+/.test(url.trim()) || /^[\w.-]+\/[\w.-]+$/.test(url.trim()) : !!zip;
  const importing = step >= 0;

  const run = () => {
    setStep(0);
    STEPS.forEach((_, i) => window.setTimeout(() => setStep(i + 1), 700 * (i + 1)));
    window.setTimeout(() => {
      const id = importProject({ source: source === "repo" ? url.trim() : zip!.name, kind: source, framework });
      router.push(`/project/${id}`);
    }, 700 * STEPS.length + 350);
  };

  return (
    <div className="page narrow">
      <div className="page-head">
        <div><p className="eyebrow">Import</p><h1>Bring what you already have.</h1><p className="lede">Provide a repository URL or choose an archive. Architect builds a believable project summary. Nothing is uploaded or cloned.</p></div>
        <Link href="/new" className="btn">Start from a prompt instead</Link>
      </div>

      <section className="panel-card">
        {importing ? (
          <div className="import-progress" aria-live="polite">
            <Loader2 className="spin" size={22} color="var(--accent)" />
            <h3>Importing {source === "repo" ? url.replace(/^https?:\/\//, "") : zip?.name}</h3>
            <Progress value={Math.min(100, (step / STEPS.length) * 100)} />
            <ul className="steps-list">
              {STEPS.map((s, i) => <li key={s} className={cn(i < step && "done", i === step && "on")}><span>{i < step ? <Check size={11} /> : i === step ? <Loader2 size={11} className="spin" /> : null}</span>{s}</li>)}
            </ul>
          </div>
        ) : (
          <>
            <Segmented label="Import source" value={source} onChange={setSource} options={[{ value: "repo", label: <><GitFork size={13} /> Repository URL</> }, { value: "zip", label: <><Archive size={13} /> ZIP archive</> }]} />
            {source === "repo" ? (
              <>
                <Field label="REPOSITORY URL"><input autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/owner/repository" onKeyDown={(e) => { if (e.key === "Enter" && valid) run(); }} /></Field>
                <div className="chips"><span className="muted small">Try:</span>{SAMPLE_REPOS.map((r) => <button key={r} className="chip" onClick={() => setUrl(r)}>{r.replace("https://github.com/", "")}</button>)}</div>
              </>
            ) : (
              <>
                <button className={cn("dropzone", zip && "filled")} onClick={() => setPicker(true)}>
                  <FileArchive size={26} />
                  {zip ? <><b>{zip.name}</b><small>{zip.size} · click to choose another</small></> : <><b>Choose an archive</b><small>Opens a demo file picker. No file is read.</small></>}
                </button>
              </>
            )}
            <Field label="FRAMEWORK" hint="Architect would detect this. Change it if the demo guessed wrong."><Segmented label="Framework" value={framework} onChange={setFramework} options={(["Next.js", "React", "Other"] as Framework[]).map((v) => ({ value: v, label: v }))} /></Field>
            <div className="row end"><Button variant="primary" disabled={!valid} onClick={run}>Import project <ArrowRight size={15} /></Button></div>
          </>
        )}
      </section>

      <Modal open={picker} onOpenChange={setPicker} eyebrow="Demo file picker" title="Choose an archive" description="These are sample names. Choosing one only records the name locally.">
        <div className="choice-list">
          {SAMPLE_ZIPS.map((z) => (
            <button key={z.name} className="choice" onClick={() => { setZip(z); setPicker(false); }}><FileArchive size={16} /><span><b>{z.name}</b><small>{z.size}</small></span></button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
