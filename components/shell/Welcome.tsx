"use client";

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight, Check, Loader2, Moon, Rocket, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/bits";
import { useApp } from "@/lib/store";

const PROMPT = "A launch page called Orbit for a focused team workspace.";

function Vignette() {
  const [stage, setStage] = useState(0);
  const [typed, setTyped] = useState("");
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-7, 7]), { stiffness: 120, damping: 18 });

  useEffect(() => {
    const id = window.setInterval(() => setStage((s) => (s + 1) % 4), 2600);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (stage !== 0) return;
    setTyped("");
    let i = 0;
    const id = window.setInterval(() => { i += 2; setTyped(PROMPT.slice(0, i)); if (i >= PROMPT.length) window.clearInterval(id); }, 45);
    return () => window.clearInterval(id);
  }, [stage]);

  const steps = ["Planning", "Building UI", "Reviewing", "Ready"];
  return (
    <motion.div
      className="vignette"
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width - 0.5); y.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      aria-hidden
    >
      <div className="vg-bar"><i /><i /><i /><span>orbit · workspace</span></div>
      <div className="vg-body">
        <div className="vg-chat">
          <div className="vg-bubble you">{typed || " "}<b className="caret" /></div>
          <div className="vg-steps">
            {steps.map((s, i) => (
              <div key={s} className={i < stage ? "done" : i === stage || (stage === 3 && i === 3) ? "active" : ""}>
                <span>{i < stage ? <Check size={10} /> : i === stage ? <Loader2 size={10} className="spin" /> : null}</span>{s}
              </div>
            ))}
          </div>
        </div>
        <div className="vg-preview">
          <motion.div className="vg-line h1" animate={{ width: stage >= 1 ? "78%" : "12%", opacity: stage >= 1 ? 1 : 0.3 }} />
          <motion.div className="vg-line h2" animate={{ width: stage >= 1 ? "56%" : "8%", opacity: stage >= 1 ? 1 : 0.3 }} />
          <motion.div className="vg-btn" animate={{ opacity: stage >= 2 ? 1 : 0.25, scale: stage >= 2 ? 1 : 0.9 }} />
          <div className="vg-cards">{[0, 1, 2].map((i) => <motion.i key={i} animate={{ opacity: stage >= 2 ? 1 : 0.2, y: stage >= 2 ? 0 : 8 }} transition={{ delay: i * 0.1 }} />)}</div>
          <AnimatePresence>
            {stage === 3 && (
              <motion.div className="vg-deployed" initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}>
                <Rocket size={13} /> Deployed · orbit.architect.demo
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export function Welcome() {
  const { signIn } = useApp();
  const { resolvedTheme, setTheme } = useTheme();
  const [busy, setBusy] = useState<"google" | "guest" | null>(null);
  const enter = (mode: "google" | "guest") => {
    setBusy(mode);
    window.setTimeout(() => signIn(mode), 650);
  };
  return (
    <div className="welcome">
      <div className="welcome-glow" aria-hidden />
      <header className="welcome-top">
        <Logo />
        <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
          {resolvedTheme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </Button>
      </header>
      <main className="welcome-main">
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="welcome-copy">
          <div className="eyebrow">Lyzr Architect</div>
          <h1>Build what moves the work forward.</h1>
          <p>Describe an app. Shape it with agents. Keep the controls close when you need them. Architect takes an idea from first prompt to deployment in one considered flow.</p>
          <div className="actions">
            <Button variant="primary" onClick={() => enter("google")} disabled={!!busy}>
              {busy === "google" ? <Loader2 size={15} className="spin" /> : null} Continue with Google {busy !== "google" && <ArrowUpRight size={15} />}
            </Button>
            <Button onClick={() => enter("guest")} disabled={!!busy}>
              {busy === "guest" && <Loader2 size={15} className="spin" />} Continue as guest
            </Button>
          </div>
          <ul className="welcome-points">
            <li><b>Prompt to preview</b> in a few seconds</li>
            <li><b>Agents</b> that show their work before they change it</li>
            <li><b>Developer mode</b> one click away</li>
          </ul>
          <p className="mono welcome-note">DEMO SESSION · EVERYTHING STAYS IN THIS BROWSER TAB</p>
        </motion.section>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="welcome-visual">
          <Vignette />
        </motion.div>
      </main>
    </div>
  );
}
