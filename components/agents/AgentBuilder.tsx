"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/ui/bits";
import { connectors, matchWorkflow, workflowPrompts, workflows } from "@/lib/catalog";
import { blankWorkflow } from "./WorkflowPage";
import { MiniFlow } from "./WorkflowCanvas";

export function AgentBuilder() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [layout, setLayout] = useState<"flow" | "orchestra">("flow");
  useEffect(() => { const id = window.setInterval(() => setLayout((l) => (l === "flow" ? "orchestra" : "flow")), 3600); return () => window.clearInterval(id); }, []);
  const hero = workflows[0];

  const build = () => {
    const match = matchWorkflow(text);
    toast(`Matched “${match.name}”`, { description: "Describing an agent maps to the closest sample. Free-form generation is simulated." });
    router.push(`/agents/${match.id}`);
  };

  return (
    <div className="page">
      <section className="builder-hero">
        <div className="bh-copy">
          <p className="eyebrow">Agent builder</p>
          <h1>Start with the job. Watch the orchestra form.</h1>
          <p className="lede">Agents work best as a small team: one orchestrator that plans, specialists that each do one thing, and a reviewer before anything ships. Pick a sample to see how that looks, run it, then make it yours.</p>
          <div className="prompt-box">
            <label htmlFor="ab-text" className="sr-only">Describe the agent</label>
            <textarea id="ab-text" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe the job, e.g. triage support tickets and draft replies" onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && text.trim()) build(); }} />
            <Button variant="primary" disabled={!text.trim()} onClick={build}><Wand2 size={15} /> Build from description</Button>
          </div>
          <div className="chips">{workflowPrompts.map((p) => <button key={p} className="chip" onClick={() => setText(p)}>{p}</button>)}</div>
          <p className="note">Free text is matched to the closest sample workflow. Nothing calls a model.</p>
        </div>
        <motion.div className="bh-visual" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="bh-tabs"><button className={layout === "flow" ? "on" : ""} onClick={() => setLayout("flow")}>Flow</button><button className={layout === "orchestra" ? "on" : ""} onClick={() => setLayout("orchestra")}>Orchestra</button></div>
          <MiniFlow workflow={hero} layout={layout} />
          <div className="bh-caption"><b>{hero.name}</b><small>{hero.nodes.length} steps · {hero.nodes.filter((n) => n.kind === "agent").length} specialists</small></div>
        </motion.div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Try a sample</h2><span className="muted small">Each one runs a simulated test you can watch</span></div>
        <div className="grid-cards">
          {workflows.map((w) => (
            <Spotlight key={w.id} as={Link} href={`/agents/${w.id}`} className="project-card wf-card">
              <div className="wf-mini"><MiniFlow workflow={w} /></div>
              <div className="pc-body">
                <div className="pc-top"><h3>{w.name}</h3><span className="tag">{w.category}</span></div>
                <p>{w.summary}</p>
                <div className="pc-meta"><span>{w.nodes.filter((n) => n.kind === "agent").length} specialists</span><span className="dots">{w.connectors.map((c) => connectors.find((x) => x.id === c)?.name).join(" · ")}</span></div>
              </div>
            </Spotlight>
          ))}
          <Spotlight as="button" className="project-card wf-card blank" onClick={() => router.push(`/agents/${blankWorkflow().id}`)}>
            <div className="wf-mini blank-mini"><Sparkles size={26} /></div>
            <div className="pc-body"><div className="pc-top"><h3>Start empty</h3><span className="tag">Custom</span></div><p>A trigger, an orchestrator and an output. Add your own specialists.</p><div className="pc-meta"><span>Build it yourself <ArrowRight size={12} style={{ verticalAlign: "middle" }} /></span></div></div>
          </Spotlight>
        </div>
      </section>
    </div>
  );
}
