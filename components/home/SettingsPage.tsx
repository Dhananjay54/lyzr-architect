"use client";

import { Laptop, LogOut, Moon, RotateCcw, Sparkles, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Status } from "@/components/ui/bits";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SettingsPage() {
  const router = useRouter();
  const { state, setTheme, resetDemo, signOut, openTour } = useApp();
  const opts = [
    { v: "light", label: "Light", icon: <Sun size={18} />, note: "Cream canvas, white surfaces" },
    { v: "dark", label: "Dark", icon: <Moon size={18} />, note: "Espresso canvas, warm text" },
    { v: "system", label: "System", icon: <Laptop size={18} />, note: "Follow your device" },
  ] as const;
  const connected = Object.entries(state.connectors).filter(([, c]) => c.status === "connected").length;
  return (
    <div className="page narrow">
      <div className="page-head"><div><p className="eyebrow">Settings</p><h1>Make the workspace yours.</h1></div></div>

      <section className="panel-card">
        <h3>Appearance</h3>
        <p className="muted">Applies across the whole app and is remembered for this browser session.</p>
        <div className="theme-cards" role="radiogroup" aria-label="Theme">
          {opts.map((o) => (
            <button key={o.v} role="radio" aria-checked={state.preferences.theme === o.v} className={cn("theme-card", state.preferences.theme === o.v && "on")} onClick={() => setTheme(o.v)}>
              {o.icon}<b>{o.label}</b><small>{o.note}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <h3>Account</h3>
        <dl className="kv">
          <dt>Name</dt><dd>{state.user?.name}</dd>
          <dt>Sign-in</dt><dd>{state.user?.authMode === "google" ? "Google (simulated)" : "Guest"}</dd>
          <dt>Email</dt><dd>{state.user?.email ?? "None for guest sessions"}</dd>
        </dl>
        <div className="row"><Button onClick={signOut}><LogOut size={14} /> Sign out</Button></div>
      </section>

      <section className="panel-card">
        <h3>Session data</h3>
        <p className="muted">Projects, messages, files, connections and deployments live in this tab&apos;s session storage. A new browser session starts with clean demo data.</p>
        <dl className="kv">
          <dt>Projects</dt><dd>{state.projects.length}</dd>
          <dt>Connections</dt><dd>{connected} <Status tone="neutral" dot={false}>simulated</Status></dd>
          <dt>Saved agent workflows</dt><dd>{state.workflows.length}</dd>
        </dl>
        <div className="row wrap">
          <Button onClick={() => { const p = state.projects[0]; if (p) router.push(`/project/${p.id}`); openTour(); }}><Sparkles size={14} /> Replay workspace tour</Button>
          <Button variant="danger" onClick={resetDemo}><RotateCcw size={14} /> Reset demo data</Button>
        </div>
      </section>
    </div>
  );
}
