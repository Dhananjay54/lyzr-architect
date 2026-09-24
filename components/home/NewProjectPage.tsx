"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Segmented } from "@/components/ui/bits";
import { enhancementChips, quickStarts, templates } from "@/lib/catalog";
import { brandFrom, inferKind, kindNoun, sectionLabel, siteFor } from "@/lib/engine";
import { useApp } from "@/lib/store";
import type { Framework, ProjectKind, Styling } from "@/lib/types";
import { cn } from "@/lib/utils";

const KINDS: { value: ProjectKind | "auto"; label: string }[] = [
  { value: "auto", label: "Infer from prompt" }, { value: "landing", label: "Launch page" }, { value: "saas", label: "SaaS dashboard" },
  { value: "marketplace", label: "Marketplace" }, { value: "portfolio", label: "Portfolio" }, { value: "support", label: "Support site" },
];

export function NewProjectPage() {
  const router = useRouter();
  const { createProject, draft, setDraft } = useApp();
  const [prompt, setPrompt] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [framework, setFramework] = useState<Framework>("Next.js");
  const [styling, setStyling] = useState<Styling>("Tailwind CSS");
  const [kind, setKind] = useState<ProjectKind | "auto">("auto");
  const [advanced, setAdvanced] = useState(false);
  const [templateId, setTemplateId] = useState<string | undefined>();

  useEffect(() => {
    if (draft) { setPrompt(draft.prompt); setTemplateId(draft.templateId); if (draft.kind) setKind(draft.kind); setDraft(null); }
  }, [draft, setDraft]);

  const resolvedKind = kind === "auto" ? inferKind(prompt + " " + chips.join(" ")) : kind;
  const brand = brandFrom(prompt, resolvedKind);
  const outline = useMemo(() => {
    const site = siteFor(resolvedKind, brand);
    if (chips.includes("Pricing section")) site.sections.splice(site.sections.length - 2, 0, { id: "pricing", type: "pricing" });
    if (chips.includes("Testimonials")) site.sections.splice(site.sections.length - 2, 0, { id: "testimonials", type: "testimonials" });
    return site.sections.map((s) => sectionLabel[s.type]);
  }, [resolvedKind, brand, chips]);

  const create = () => {
    const id = createProject({ prompt: prompt.trim(), framework, styling, chips, origin: templateId ? "template" : "prompt", kind: kind === "auto" ? undefined : kind });
    router.push(`/project/${id}`);
  };
  const ready = prompt.trim().length >= 8;

  return (
    <div className="page narrow-wide">
      <div className="page-head">
        <div><p className="eyebrow">New project</p><h1>Describe it. We will build the first version.</h1><p className="lede">A sentence is enough. Add a few directions if you like, and change anything later through chat or code.</p></div>
        <Link href="/import" className="btn"><Upload size={15} /> Import existing project</Link>
      </div>

      <div className="new-grid">
        <section className="panel-card">
          <label htmlFor="np-prompt" className="section-label">WHAT SHOULD IT BE?</label>
          <textarea id="np-prompt" className="big-input" rows={5} autoFocus value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. A booking site for a neighbourhood pottery studio, calm and editorial, with pricing and a short story." />
          <div className="chips">
            {quickStarts.map((q) => <button key={q} className="chip" onClick={() => setPrompt(q)}>{q}</button>)}
          </div>

          <div className="section-label" style={{ marginTop: 22 }}>ADD A DIRECTION <span>optional</span></div>
          <div className="chips" role="group" aria-label="Enhancements">
            {enhancementChips.map((c) => {
              const on = chips.includes(c);
              return <button key={c} aria-pressed={on} className={cn("chip", on && "on")} onClick={() => setChips(on ? chips.filter((x) => x !== c) : [...chips, c])}>{on && <Check size={11} />} {c}</button>;
            })}
          </div>

          <button className="disclosure" aria-expanded={advanced} onClick={() => setAdvanced(!advanced)}>
            <ChevronDown size={15} style={{ transform: advanced ? "rotate(180deg)" : undefined }} /> Advanced options <span>Framework, styling and project type</span>
          </button>
          <AnimatePresence initial={false}>
            {advanced && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                <div className="adv-grid">
                  <Field label="FRAMEWORK"><Segmented label="Framework" value={framework} onChange={setFramework} options={(["Next.js", "React", "Other"] as Framework[]).map((v) => ({ value: v, label: v }))} /></Field>
                  <Field label="STYLING"><select value={styling} onChange={(e) => setStyling(e.target.value as Styling)}>{["Tailwind CSS", "CSS Modules", "Vanilla CSS", "styled-components"].map((s) => <option key={s}>{s}</option>)}</select></Field>
                  <Field label="PROJECT TYPE"><select value={kind} onChange={(e) => setKind(e.target.value as ProjectKind | "auto")}>{KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</select></Field>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="row end" style={{ marginTop: 22 }}>
            <Button onClick={() => router.push("/templates")}>Browse templates</Button>
            <Button variant="primary" disabled={!ready} onClick={create}><Sparkles size={15} /> Create project <ArrowRight size={15} /></Button>
          </div>
          {!ready && <p className="note" style={{ textAlign: "right" }}>Add a short description to continue.</p>}
        </section>

        <aside className="panel-card outline-card" aria-live="polite">
          <div className="section-label">WHAT ARCHITECT WILL BUILD</div>
          <div className="outline-head">
            <b>{brand}</b><span className="tag">{kindNoun(resolvedKind)}</span>
          </div>
          <small className="muted">{framework} · {styling}</small>
          <ol className="outline">
            <AnimatePresence initial={false}>
              {outline.map((s, i) => (
                <motion.li key={s} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ delay: i * 0.02 }}><span>{String(i + 1).padStart(2, "0")}</span>{s}</motion.li>
              ))}
            </AnimatePresence>
          </ol>
          <p className="note">Generated locally with deterministic demo content. No model is called.</p>
          {templateId && <p className="note">Starting from the “{templates.find((t) => t.id === templateId)?.name}” template.</p>}
        </aside>
      </div>
    </div>
  );
}
