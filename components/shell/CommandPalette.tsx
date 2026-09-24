"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bot, Box, CornerDownLeft, FilePlus2, FileText, GitFork, HelpCircle, Home, LayoutTemplate, Maximize2, Moon, PanelsTopLeft,
  Play, Plus, Redo2, Rocket, Search, Settings, Sparkles, Sun, Terminal, Undo2, Upload, Wand2, Workflow, Laptop, GitCompare, Code2, Eye,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Kbd } from "@/components/ui/bits";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useShell } from "./shell-context";

type Item = { id: string; label: string; hint?: string; group: string; icon: ReactNode; keywords?: string; run: () => void };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const { state, setTheme, setMode, undo, redo, openTour } = useApp();
  const { openDialog, setFocus, setPresenting } = useShell();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const pid = params.id ?? state.activeProjectId ?? undefined;
  const project = state.projects.find((p) => p.id === pid);

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => router.push(href);
    const list: Item[] = [];
    if (project) {
      const dev = (panel: "changes" | "run" | "agent" | "explorer") => () => { setMode(project.id, "developer"); router.push(`/project/${project.id}`); setFocus({ panel }); };
      list.push(
        { id: "create-component", group: `Project · ${project.name}`, label: "Create component", hint: "components/", icon: <FilePlus2 size={15} />, keywords: "new file", run: () => openDialog({ kind: "newComponent", projectId: project.id }) },
        { id: "add-route", group: `Project · ${project.name}`, label: "Add route", hint: "app/…/page.tsx", icon: <FileText size={15} />, keywords: "page", run: () => openDialog({ kind: "newRoute", projectId: project.id }) },
        { id: "ask-agent", group: `Project · ${project.name}`, label: "Ask agent to refactor", hint: "Frontend engineer", icon: <Wand2 size={15} />, keywords: "agent refactor", run: () => openDialog({ kind: "agentTask", projectId: project.id, agentId: "frontend", task: "Refactor shared layout primitives" }) },
        { id: "view-changes", group: `Project · ${project.name}`, label: "View changes", hint: "Developer mode", icon: <GitCompare size={15} />, keywords: "diff review", run: dev("changes") },
        { id: "run-checks", group: `Project · ${project.name}`, label: "Run lint, types and build", hint: "Run panel", icon: <Play size={15} />, keywords: "check test", run: dev("run") },
        { id: "connect-github", group: `Project · ${project.name}`, label: state.github.status === "connected" ? "Commit and push to GitHub" : "Connect GitHub", hint: "Integration", icon: <GitFork size={15} />, keywords: "git commit push", run: () => openDialog({ kind: "github", projectId: project.id, tab: state.github.status === "connected" ? "commit" : "connection" }) },
        { id: "connect-vercel", group: `Project · ${project.name}`, label: state.vercel.status === "connected" ? "Link Vercel project" : "Connect Vercel", hint: "Integration", icon: <Terminal size={15} />, run: () => openDialog({ kind: "vercel", projectId: project.id }) },
        { id: "deploy", group: `Project · ${project.name}`, label: "Deploy preview", hint: "Vercel", icon: <Rocket size={15} />, keywords: "ship publish", run: go(`/project/${project.id}/deploy`) },
        { id: "present", group: `Project · ${project.name}`, label: "Present preview full-screen", icon: <Maximize2 size={15} />, run: () => { router.push(`/project/${project.id}`); setPresenting(true); } },
        { id: "mode", group: `Project · ${project.name}`, label: project.workspaceMode === "build" ? "Switch to Developer mode" : "Switch to Build mode", icon: project.workspaceMode === "build" ? <Code2 size={15} /> : <Eye size={15} />, run: () => { setMode(project.id, project.workspaceMode === "build" ? "developer" : "build"); router.push(`/project/${project.id}`); } },
        { id: "undo", group: `Project · ${project.name}`, label: "Undo last change", icon: <Undo2 size={15} />, run: () => undo(project.id) },
        { id: "redo", group: `Project · ${project.name}`, label: "Redo", icon: <Redo2 size={15} />, run: () => redo(project.id) },
      );
    }
    list.push(
      { id: "new", group: "Create", label: "New project", icon: <Plus size={15} />, run: go("/new") },
      { id: "import", group: "Create", label: "Import existing project", icon: <Upload size={15} />, run: go("/import") },
      { id: "new-agent", group: "Create", label: "Build an agent", hint: "Sample workflow", icon: <Workflow size={15} />, run: go("/agents/new") },
      { id: "home", group: "Go to", label: "Home", icon: <Home size={15} />, run: go("/") },
      { id: "projects", group: "Go to", label: "Projects", icon: <PanelsTopLeft size={15} />, run: go("/projects") },
      { id: "agents", group: "Go to", label: "Agents", icon: <Bot size={15} />, run: go("/agents") },
      { id: "templates", group: "Go to", label: "Templates", icon: <LayoutTemplate size={15} />, run: go("/templates") },
      { id: "integrations", group: "Go to", label: "Integrations", icon: <Box size={15} />, run: go("/integrations") },
      { id: "settings", group: "Go to", label: "Settings", icon: <Settings size={15} />, run: go("/settings") },
      ...state.projects.map((p) => ({ id: "open-" + p.id, group: "Open project", label: p.name, hint: p.kind, icon: <PanelsTopLeft size={15} />, run: go(`/project/${p.id}`) })),
      { id: "theme-light", group: "Appearance", label: "Light theme", icon: <Sun size={15} />, run: () => setTheme("light") },
      { id: "theme-dark", group: "Appearance", label: "Dark theme", icon: <Moon size={15} />, run: () => setTheme("dark") },
      { id: "theme-system", group: "Appearance", label: "System theme", icon: <Laptop size={15} />, run: () => setTheme("system") },
      { id: "tour", group: "Help", label: "Replay workspace tour", icon: <Sparkles size={15} />, run: () => { const p = project ?? state.projects[0]; if (p) router.push(`/project/${p.id}`); openTour(); } },
      { id: "help", group: "Help", label: "Help and keyboard shortcuts", hint: "?", icon: <HelpCircle size={15} />, run: () => openDialog({ kind: "help" }) },
    );
    return list;
  }, [project, state.projects, state.github.status, state.vercel.status, router, setMode, setFocus, openDialog, setPresenting, undo, redo, setTheme, openTour]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => `${i.label} ${i.group} ${i.hint ?? ""} ${i.keywords ?? ""}`.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => { setIndex(0); }, [query, open]);
  useEffect(() => { if (open) setQuery(""); }, [open]);
  useEffect(() => { listRef.current?.querySelector(`[data-i="${index}"]`)?.scrollIntoView({ block: "nearest" }); }, [index]);

  const run = (item?: Item) => { if (!item) return; onClose(); window.setTimeout(item.run, 60); };
  const groups: { name: string; items: (Item & { i: number })[] }[] = [];
  filtered.forEach((item, i) => {
    let g = groups.find((x) => x.name === item.group);
    if (!g) { g = { name: item.group, items: [] }; groups.push(g); }
    g.items.push({ ...item, i });
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="command" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} onMouseDown={onClose}>
          <motion.div
            className="command-box" role="dialog" aria-modal="true" aria-label="Command palette"
            initial={{ y: -12, scale: 0.98, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 36 }}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setIndex((i) => Math.min(filtered.length - 1, i + 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => Math.max(0, i - 1)); }
              else if (e.key === "Enter") { e.preventDefault(); run(filtered[index]); }
              else if (e.key === "Escape") { e.preventDefault(); onClose(); }
            }}
          >
            <div className="command-search">
              <Search size={16} />
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find an action, page or project…" aria-label="Search commands" />
              <Kbd>esc</Kbd>
            </div>
            <div className="command-list" ref={listRef} role="listbox">
              {filtered.length === 0 && <div className="command-empty">No matches for “{query}”. Try “deploy”, “agent” or “theme”.</div>}
              {groups.map((g) => (
                <div key={g.name}>
                  <div className="command-group">{g.name}</div>
                  {g.items.map((item) => (
                    <button key={item.id} data-i={item.i} role="option" aria-selected={item.i === index} className={cn("command-item", item.i === index && "on")} onMouseMove={() => setIndex(item.i)} onClick={() => run(item)}>
                      <span className="ci-icon">{item.icon}</span><span className="ci-label">{item.label}</span>{item.hint && <small>{item.hint}</small>}
                      {item.i === index && <CornerDownLeft size={13} className="ci-enter" />}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="command-foot"><span><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span><span><Kbd>↵</Kbd> run</span><span><Kbd>⌘</Kbd><Kbd>K</Kbd> toggle</span></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
