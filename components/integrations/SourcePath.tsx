"use client";

import { ArrowRight, Check, GitFork, HardDrive, Minus, Triangle } from "lucide-react";
import { Status } from "@/components/ui/bits";
import { useApp } from "@/lib/store";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Local changes → GitHub repository (if connected) → Vercel. Every state carries a label and an icon. */
export function SourcePath({ project, target = "Vercel", environment = "Preview" }: { project: Project; target?: string; environment?: string }) {
  const { state } = useApp();
  const pending = project.files.filter((f) => f.committed !== f.content).length;
  const ghConnected = state.github.status === "connected";
  const vercelLinked = !!project.vercel;
  const nodes = [
    { icon: <HardDrive size={15} />, title: "Local changes", note: `${project.files.length} files`, state: pending ? "warn" : "ok", label: pending ? `${pending} unpushed` : "Up to date" },
    { icon: <GitFork size={15} />, title: "GitHub", note: project.github?.repository ?? "Optional", state: project.github ? (pending ? "warn" : "ok") : ghConnected ? "warn" : "off", label: project.github ? (pending ? "Push pending" : "Synced") : ghConnected ? "No repository" : "Not connected" },
    { icon: <Triangle size={14} />, title: target, note: target === "Vercel" ? (project.vercel ? `${project.vercel.project}` : "Optional") : environment, state: target !== "Vercel" ? "ok" : vercelLinked ? "ok" : state.vercel.status === "connected" ? "warn" : "off", label: target !== "Vercel" ? "Ready" : vercelLinked ? "Linked" : state.vercel.status === "connected" ? "Not linked" : "Not connected" },
  ] as const;
  return (
    <div className="source-path" role="list" aria-label="Source path">
      {nodes.map((n, i) => (
        <div key={n.title} className="sp-wrap" role="listitem">
          <div className={cn("sp-node", n.state)}>
            <span className="sp-icon">{n.icon}</span>
            <b>{n.title}</b><small>{n.note}</small>
            <Status tone={n.state === "ok" ? "success" : n.state === "warn" ? "warn" : "neutral"} dot={false}>
              {n.state === "ok" ? <Check size={10} /> : n.state === "warn" ? "!" : <Minus size={10} />} {n.label}
            </Status>
          </div>
          {i < nodes.length - 1 && <ArrowRight className="sp-arrow" size={16} aria-hidden />}
        </div>
      ))}
    </div>
  );
}
