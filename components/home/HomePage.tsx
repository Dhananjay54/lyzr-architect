"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Bot, GitFork, Plus, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SiteThumb } from "@/components/preview/SitePreview";
import { useShell } from "@/components/shell/shell-context";
import { statusLabel, statusTone } from "@/components/shell/Sidebar";
import { Button } from "@/components/ui/button";
import { Spotlight, Status } from "@/components/ui/bits";
import { quickStarts, templates } from "@/lib/catalog";
import { siteFor } from "@/lib/engine";
import { useApp } from "@/lib/store";
import { ago, cn } from "@/lib/utils";

const PLACEHOLDERS = [
  "A booking site for a neighbourhood pottery studio…",
  "A dashboard that shows weekly support volume…",
  "A portfolio for a documentary photographer…",
  "A help centre with an agent that answers billing questions…",
];

function useTypewriter(lines: string[], active: boolean) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!active) return;
    let line = 0, char = 0, dir = 1, hold = 0;
    const id = window.setInterval(() => {
      if (hold > 0) { hold--; return; }
      char += dir;
      setText(lines[line].slice(0, char));
      if (dir === 1 && char >= lines[line].length) { dir = -1; hold = 32; }
      else if (dir === -1 && char <= 0) { dir = 1; line = (line + 1) % lines.length; hold = 6; }
    }, 38);
    return () => window.clearInterval(id);
  }, [lines, active]);
  return text;
}

export function HomePage() {
  const router = useRouter();
  const { state, createProject, setDraft, openTour } = useApp();
  const { openDialog } = useShell();
  const [prompt, setPrompt] = useState("");
  const [focused, setFocused] = useState(false);
  const typed = useTypewriter(PLACEHOLDERS, !prompt && !focused);
  const recent = useMemo(() => [...state.projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [state.projects]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const start = (text = prompt) => {
    const value = text.trim();
    if (!value) return;
    const id = createProject({ prompt: value, framework: "Next.js", styling: "Tailwind CSS", chips: [], origin: "prompt" });
    router.push(`/project/${id}`);
  };

  const suggestions = [
    { icon: <Bot size={16} />, title: "Try a sample agent workflow", body: "Watch an orchestra of agents handle a support ticket.", href: "/agents/new", action: () => router.push("/agents/new") },
    state.github.status !== "connected"
      ? { icon: <GitFork size={16} />, title: "Connect GitHub", body: "Keep your source close to the work.", action: () => openDialog({ kind: "github", tab: "connection" }) }
      : { icon: <GitFork size={16} />, title: "Commit your latest changes", body: "Push changed files to a linked repository.", action: () => openDialog({ kind: "github", tab: "commit" }) },
    { icon: <Sparkles size={16} />, title: "Replay the workspace tour", body: "Four short steps through the workspace.", action: () => { const p = recent[0]; if (p) router.push(`/project/${p.id}`); openTour(); } },
  ];

  return (
    <div className="page home">
      <section className="home-hero">
        <div className="hero-orb" aria-hidden />
        <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{greeting}, {state.user?.name}</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>What are we building today?</motion.h1>
        <motion.div className={cn("composer-card", focused && "focus")} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <label className="sr-only" htmlFor="home-prompt">Describe what you want to build</label>
          <textarea
            id="home-prompt" rows={3} value={prompt} placeholder={typed || " "}
            onChange={(e) => setPrompt(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") start(); }}
          />
          <div className="composer-row">
            <div className="chips">
              {quickStarts.slice(0, 3).map((q) => <button key={q} className="chip" onClick={() => { setPrompt(q); }}>{q.length > 42 ? q.slice(0, 40) + "…" : q}</button>)}
            </div>
            <div className="row">
              <Button size="sm" onClick={() => { setDraft({ prompt }); router.push("/new"); }}>More options</Button>
              <Button variant="primary" onClick={() => start()} disabled={!prompt.trim()}>Start building <ArrowRight size={15} /></Button>
            </div>
          </div>
        </motion.div>
        <div className="home-links">
          <Link href="/import"><Upload size={14} /> Import an existing project</Link>
          <Link href="/templates">Browse templates <ArrowUpRight size={13} /></Link>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Continue where you left off</h2><Link href="/projects" className="linkish">All projects <ArrowRight size={13} /></Link></div>
        <div className="grid-cards">
          <AnimatePresence initial={false}>
            {recent.slice(0, 3).map((p, i) => (
              <motion.div key={p.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Spotlight as={Link} href={`/project/${p.id}`} className="project-card">
                  <SiteThumb site={p.site} />
                  <div className="pc-body">
                    <div className="pc-top"><h3>{p.name}</h3><Status tone={statusTone[p.status]} busy={p.status === "building"}>{statusLabel[p.status]}</Status></div>
                    <p>{p.description}</p>
                    <div className="pc-meta"><span className="tag">{p.framework}</span><span>{ago(p.updatedAt)}</span></div>
                  </div>
                </Spotlight>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Start from a template</h2><Link href="/templates" className="linkish">All templates <ArrowRight size={13} /></Link></div>
        <div className="template-row">
          {templates.map((t) => (
            <Spotlight key={t.id} as="button" className="template-card" onClick={() => { setDraft({ prompt: t.prompt, kind: t.kind, templateId: t.id }); router.push("/new"); }}>
              <SiteThumb site={siteFor(t.kind, t.name.split(" ")[0], t.accent)} ratio={0.5} />
              <div className="tc-body"><b>{t.name}</b><small>{t.tagline}</small></div>
            </Spotlight>
          ))}
          <Spotlight as={Link} href="/import" className="template-card ghost-card">
            <div className="ghost-inner"><Plus size={20} /><b>Import a project</b><small>Bring a repository or ZIP archive.</small></div>
          </Spotlight>
        </div>
      </section>

      <div className="two-up">
        <section className="section">
          <div className="section-head"><h2>Suggested next</h2></div>
          <div className="suggest-list">
            {suggestions.map((s) => (
              <button key={s.title} className="suggest" onClick={s.action}>
                <span className="suggest-icon">{s.icon}</span>
                <span><b>{s.title}</b><small>{s.body}</small></span>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        </section>
        <section className="section">
          <div className="section-head"><h2>Recent activity</h2></div>
          <ul className="feed">
            {state.activity.slice(0, 5).map((a) => (
              <li key={a.id}>
                <i className={cn("notif-dot", a.tone)} aria-hidden />
                <button onClick={() => a.projectId && router.push(`/project/${a.projectId}`)}>{a.text}</button>
                <small>{ago(a.at)}</small>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
