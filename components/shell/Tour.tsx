"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";

const STEPS = [
  { target: "nav", eyebrow: "Project and navigation", title: "One project. A clear way through.", body: "Move between projects, agents, templates and integrations here. Everything you open describes the same project, so nothing gets lost on the way." },
  { target: "composer", eyebrow: "Prompt composer", title: "Say what should change.", body: "Describe a change here. Architect turns the request into a visible project update, and shows each step while it works." },
  { target: "preview", eyebrow: "Live preview", title: "Keep the result in view.", body: "Switch device widths, inspect a section, or present full-screen. What you see is generated from the same files Developer mode shows." },
  { target: "actions", eyebrow: "Modes, integrations and deploy", title: "Take control, then ship.", body: "Flip to Developer mode for files and checks, connect GitHub and Vercel, then deploy. Every remote step is a clearly labelled local simulation." },
];

type Rect = { top: number; left: number; width: number; height: number };

function findTarget(name: string): Rect | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return { top: r.top, left: r.left, width: r.width, height: r.height };
  }
  return null;
}

export function Tour() {
  const { tour, closeTour } = useApp();
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [vp, setVp] = useState({ w: 1200, h: 800 });

  const measure = useCallback(() => {
    setVp({ w: window.innerWidth, h: window.innerHeight });
    setRect(findTarget(STEPS[step].target));
  }, [step]);

  useEffect(() => { if (tour.open) setStep(0); }, [tour.open]);
  useLayoutEffect(() => {
    if (!tour.open) return;
    measure();
    window.addEventListener("resize", measure);
    const id = window.setInterval(measure, 500); // layout can settle after panels animate in
    return () => { window.removeEventListener("resize", measure); window.clearInterval(id); };
  }, [tour.open, measure]);

  const next = useCallback(() => { if (step === STEPS.length - 1) closeTour(); else setStep((s) => s + 1); }, [step, closeTour]);
  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  useEffect(() => {
    if (!tour.open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeTour(); }
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [tour.open, next, back, closeTour]);

  const s = STEPS[step];
  const pad = 8;
  const hole = rect ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 } : { top: vp.h / 2, left: vp.w / 2, width: 0, height: 0 };
  const cardW = Math.min(360, vp.w - 24);
  let cardTop = vp.h / 2 - 110; let cardLeft = vp.w / 2 - cardW / 2;
  if (rect) {
    const roomRight = vp.w - (hole.left + hole.width);
    const roomBelow = vp.h - (hole.top + hole.height);
    if (roomRight > cardW + 24) { cardLeft = hole.left + hole.width + 16; cardTop = Math.max(12, Math.min(hole.top, vp.h - 300)); }
    else if (roomBelow > 250) { cardTop = hole.top + hole.height + 14; cardLeft = Math.max(12, Math.min(hole.left, vp.w - cardW - 12)); }
    else { cardTop = Math.max(12, hole.top - 250); cardLeft = Math.max(12, Math.min(hole.left, vp.w - cardW - 12)); }
  }

  return (
    <AnimatePresence>
      {tour.open && (
        <motion.div className="tour" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-live="polite">
          <motion.div className="tour-hole" initial={false} animate={hole} transition={{ type: "spring", stiffness: 260, damping: 32 }} aria-hidden />
          <motion.div
            className="tour-card" role="dialog" aria-label="Workspace tour" aria-labelledby="tour-title"
            initial={false} animate={{ top: cardTop, left: cardLeft }} transition={{ type: "spring", stiffness: 260, damping: 32 }} style={{ width: cardW }}
          >
            <button className="btn ghost icon sm tour-x" aria-label="Skip tour" onClick={closeTour}><X size={14} /></button>
            <div className="tour-progress">{STEPS.map((_, i) => <i key={i} className={i <= step ? "done" : ""} />)}</div>
            <div className="eyebrow">{String(step + 1).padStart(2, "0")} / 04 · {s.eyebrow}</div>
            <h3 id="tour-title">{s.title}</h3>
            <p>{s.body}</p>
            <div className="tour-actions">
              <Button variant="ghost" size="sm" onClick={closeTour}>Skip tour</Button>
              <span className="spacer" />
              {step > 0 && <Button size="sm" onClick={back}><ChevronLeft size={14} /> Back</Button>}
              <Button variant="primary" size="sm" autoFocus onClick={next}>{step === STEPS.length - 1 ? "Let’s build" : "Continue"} <ChevronRight size={14} /></Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
