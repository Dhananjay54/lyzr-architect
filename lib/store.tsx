"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { demoRepos, demoTeams, roleAgents } from "./catalog";
import {
  buildFiles, buildPackageJson, generationStages, generationTimeline, interpret, mergeGenerated, playbook,
  postGenerationMessage, projectFromImport, projectFromPrompt, readyTimeline, defaultConfig,
} from "./engine";
import { STORAGE_KEY, seedState } from "./seed";
import type {
  Activity, AgentRun, AppState, ChangeSet, ConnectorState, Deployment, Framework, Message, Project,
  ProjectConfig, ProjectFile, ProjectKind, RepoDraft, Snapshot, Styling, ThemeChoice, Workflow, WorkspaceMode,
} from "./types";
import { hash, now, slugify, uid } from "./utils";

type CreateInput = { prompt: string; framework: Framework; styling: Styling; chips: string[]; origin: "prompt" | "template"; kind?: ProjectKind };
type Draft = { prompt: string; kind?: ProjectKind; templateId?: string } | null;

export type Store = {
  ready: boolean;
  state: AppState;
  draft: Draft;
  setDraft: (d: Draft) => void;
  tour: { open: boolean };
  openTour: () => void;
  closeTour: () => void;
  signIn: (mode: "guest" | "google") => void;
  signOut: () => void;
  resetDemo: () => void;
  setTheme: (t: ThemeChoice) => void;
  getProject: (id: string | undefined | null) => Project | undefined;
  createProject: (input: CreateInput) => string;
  importProject: (input: { source: string; kind: "repo" | "zip"; framework: Framework }) => string;
  reviewImport: (id: string, mode: WorkspaceMode) => void;
  setActive: (id: string | null) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => string | undefined;
  renameProject: (id: string, name: string) => void;
  patchProject: (id: string, fn: (p: Project) => Project) => void;
  sendMessage: (id: string, text: string) => void;
  undo: (id: string) => void;
  redo: (id: string) => void;
  setMode: (id: string, mode: WorkspaceMode) => void;
  editFile: (id: string, path: string, content: string) => void;
  acceptFile: (id: string, path: string) => void;
  discardFile: (id: string, path: string) => void;
  createFile: (id: string, path: string, content: string) => void;
  deleteFile: (id: string, path: string) => void;
  updateConfig: (id: string, fn: (c: ProjectConfig) => ProjectConfig) => void;
  resetConfig: (id: string) => void;
  runAgent: (projectId: string, agentId: string, task: string) => string;
  resumeRun: (projectId: string, runId: string) => void;
  acceptChangeSet: (projectId: string, changeId: string) => void;
  discardChangeSet: (projectId: string, changeId: string) => void;
  connectConnector: (id: string, account?: string) => void;
  disconnectConnector: (id: string) => void;
  addCustomConnector: (name: string, url: string) => void;
  createRepo: (name: string, visibility: "private" | "public", description: string) => void;
  selectRepo: (projectId: string, repo: string) => void;
  commitPush: (projectId: string, message: string, paths: string[]) => string;
  setVercelTeam: (team: string) => void;
  linkVercel: (projectId: string, link: { project: string; team: string; targetBranch: string }) => void;
  unlinkVercel: (projectId: string) => void;
  recordDeployment: (projectId: string, d: Deployment) => void;
  saveWorkflow: (w: Workflow) => void;
  removeWorkflow: (id: string) => void;
  markHint: (id: string) => void;
  markNotificationsSeen: () => void;
  log: (text: string, extra?: Partial<Activity>) => void;
};

const Ctx = createContext<Store | null>(null);

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside provider");
  return v;
}

/* ---------- helpers ---------- */

function normalize(state: AppState): AppState {
  const projects = state.projects.map((p) => {
    let next = p;
    if (p.status === "building") {
      next = {
        ...next, status: "ready", generation: undefined, timeline: readyTimeline("Preview ready"),
        messages: [...next.messages, { id: uid("m"), author: "architect", at: now(), text: postGenerationMessage(next) }],
      };
    }
    if (next.messages.some((m) => m.status === "working")) {
      next = { ...next, messages: next.messages.map((m) => (m.status === "working" ? { ...m, status: "done", steps: undefined, text: "That update was interrupted by a refresh. Send it again and I will pick it up." } : m)) };
    }
    if (next.agentRuns.some((r) => r.state === "working" || r.state === "queued")) {
      next = { ...next, agentRuns: next.agentRuns.map((r) => (r.state === "working" || r.state === "queued" ? { ...r, state: "complete", summary: "Run interrupted by a refresh." } : r)) };
    }
    return next;
  });
  return { ...state, projects };
}

function snapshot(p: Project, label: string): Snapshot {
  return { site: p.site, files: p.files, label };
}

function patchesBetween(before: ProjectFile[], after: ProjectFile[]) {
  const prev = new Map(before.map((f) => [f.path, f.content]));
  return after.filter((f) => prev.get(f.path) !== f.content).map((f) => ({ path: f.path, before: prev.get(f.path) ?? null, after: f.content }));
}

function withUpdated(p: Project): Project {
  return { ...p, updatedAt: now() };
}

/* ---------- provider ---------- */

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setTheme: setNextTheme } = useTheme();
  const [state, setState] = useState<AppState | null>(null);
  const [draft, setDraft] = useState<Draft>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const stateRef = useRef<AppState | null>(null);
  const hydrated = useRef(false);

  // hydrate from sessionStorage after mount
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    let next: AppState | null = null;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        if (parsed && parsed.version === 2 && Array.isArray(parsed.projects)) next = normalize(parsed);
      }
    } catch { /* fall through to seed */ }
    if (next) setNextTheme(next.preferences.theme);
    else { setNextTheme("system"); next = seedState(null); }
    stateRef.current = next;
    setState(next);
  }, [setNextTheme]);

  // persist
  useEffect(() => {
    stateRef.current = state;
    if (!state) return;
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
  }, [state]);

  const commit = useCallback((fn: (s: AppState) => AppState) => {
    setState((prev) => (prev ? fn(prev) : prev));
  }, []);

  const patch = useCallback((id: string, fn: (p: Project) => Project) => {
    commit((s) => ({ ...s, projects: s.projects.map((p) => (p.id === id ? fn(p) : p)) }));
  }, [commit]);

  const log = useCallback((text: string, extra: Partial<Activity> = {}) => {
    commit((s) => ({ ...s, activity: [{ id: uid("a"), at: now(), text, ...extra }, ...s.activity].slice(0, 40) }));
  }, [commit]);

  const current = (id: string) => stateRef.current?.projects.find((p) => p.id === id);

  /* ----- generation ----- */
  const startGeneration = useCallback((id: string) => {
    let stage = 0;
    const step = () => {
      const ms = generationStages[stage].ms;
      window.setTimeout(() => {
        stage += 1;
        if (stage >= generationStages.length) {
          patch(id, (p) => ({
            ...p, status: "ready", generation: undefined, timeline: readyTimeline("Preview ready"), updatedAt: now(),
            messages: [...p.messages, { id: uid("m"), author: "architect", at: now(), text: postGenerationMessage(p) }],
          }));
          const p = current(id);
          log(`${p?.name ?? "Project"} generated`, { projectId: id, tone: "success" });
          toast.success(`${p?.name ?? "Project"} is ready`, { description: "Generated locally for this demo." });
        } else {
          patch(id, (p) => ({ ...p, generation: { stage, startedAt: p.generation?.startedAt ?? now() }, timeline: generationTimeline(stage) }));
          step();
        }
      }, ms);
    };
    step();
  }, [patch, log]);

  /* ----- actions ----- */
  const store = useMemo<Store | null>(() => {
    if (!state) return null;

    const setTheme = (t: ThemeChoice) => { setNextTheme(t); commit((s) => ({ ...s, preferences: { ...s.preferences, theme: t } })); };

    const createProject: Store["createProject"] = (input) => {
      const project = projectFromPrompt(input);
      commit((s) => ({ ...s, projects: [project, ...s.projects], activeProjectId: project.id }));
      log(`Started ${project.name}`, { projectId: project.id });
      startGeneration(project.id);
      return project.id;
    };

    const importProject: Store["importProject"] = (input) => {
      const project = projectFromImport(input);
      commit((s) => ({ ...s, projects: [project, ...s.projects], activeProjectId: project.id }));
      log(`Imported ${project.name} (simulated)`, { projectId: project.id, tone: "success" });
      return project.id;
    };

    const applySite = (p: Project, site: Project["site"], label: string, source: string): Project => {
      const gen = buildFiles(site, { name: site.brand, framework: p.framework, styling: p.styling, config: p.configuration });
      const files = mergeGenerated(p.files, gen);
      const change: ChangeSet = { id: uid("cs"), title: label, summary: "Applied from chat", source, createdAt: now(), status: "applied", patches: patchesBetween(p.files, files), siteAfter: site };
      return {
        ...p, site, files, name: site.brand !== p.site.brand ? site.brand : p.name,
        changeSets: [change, ...p.changeSets].slice(0, 30),
        history: { past: [...p.history.past, snapshot(p, label)].slice(-25), future: [] },
        timeline: readyTimeline(`Updated · ${label}`), updatedAt: now(),
      };
    };

    const sendMessage: Store["sendMessage"] = (id, text) => {
      const content = text.trim();
      if (!content) return;
      const you: Message = { id: uid("m"), author: "you", text: content, at: now() };
      const work: Message = {
        id: uid("m"), author: "architect", at: now(), status: "working", text: "Working on that…",
        steps: [{ label: "Planning", state: "active" }, { label: "Building UI", state: "pending" }, { label: "Reviewing", state: "pending" }],
      };
      patch(id, (p) => ({
        ...p, messages: [...p.messages, you, work], updatedAt: now(),
        timeline: p.timeline.map((t, i) => (i === 3 ? { ...t, state: "active", note: "Applying your request" } : t)),
      }));
      const setSteps = (idx: number) => patch(id, (p) => ({
        ...p, messages: p.messages.map((m) => (m.id === work.id ? { ...m, steps: (m.steps ?? []).map((s, i) => ({ ...s, state: i < idx ? "done" : i === idx ? "active" : "pending" })) } : m)),
      }));
      window.setTimeout(() => setSteps(1), 650);
      window.setTimeout(() => setSteps(2), 1350);
      window.setTimeout(() => {
        const p = current(id);
        if (!p) return;
        const it = interpret(content, p.site, p.messages.length);
        patch(id, (proj) => {
          let next = proj;
          if (it.site && it.kind !== "noop") next = applySite(proj, it.site, it.title, "Chat");
          return {
            ...next,
            messages: next.messages.map((m) => (m.id === work.id ? { ...m, status: "done", text: it.reply, steps: (m.steps ?? []).map((s) => ({ ...s, state: "done" as const })), changeTitle: it.kind === "noop" ? undefined : it.title } : m)),
          };
        });
        if (it.kind !== "noop") log(`${p.name}: ${it.title.toLowerCase()}`, { projectId: id });
      }, 2050);
    };

    const restore = (id: string, dir: "undo" | "redo") => {
      const p = current(id);
      if (!p) return;
      const source = dir === "undo" ? p.history.past : p.history.future;
      if (!source.length) return;
      const target = source[source.length - 1];
      const here = snapshot(p, target.label);
      patch(id, (proj) => ({
        ...proj, site: target.site, files: target.files, name: target.site.brand,
        history: dir === "undo"
          ? { past: proj.history.past.slice(0, -1), future: [...proj.history.future, here] }
          : { past: [...proj.history.past, here], future: proj.history.future.slice(0, -1) },
        messages: [...proj.messages, { id: uid("m"), author: "architect", at: now(), text: `${dir === "undo" ? "Undid" : "Redid"}: ${target.label}.` }],
        timeline: readyTimeline(`${dir === "undo" ? "Undid" : "Redid"} · ${target.label}`), updatedAt: now(),
      }));
    };

    const editFile: Store["editFile"] = (id, path, content) => patch(id, (p) => ({
      ...p, updatedAt: now(),
      files: p.files.map((f) => (f.path === path ? { ...f, content, changed: content !== f.base } : f)),
    }));

    const createFile: Store["createFile"] = (id, path, content) => patch(id, (p) => {
      if (p.files.some((f) => f.path === path)) return p;
      return withUpdated({ ...p, files: [...p.files, { path, content, base: "", committed: null, changed: true }] });
    });

    const updateConfig: Store["updateConfig"] = (id, fn) => patch(id, (p) => {
      const configuration = fn(p.configuration);
      const pkg = buildPackageJson(p.name, configuration, p.framework);
      return withUpdated({ ...p, configuration, files: p.files.map((f) => (f.path === "package.json" ? { ...f, content: pkg, changed: pkg !== f.base } : f)) });
    });

    const runAgent: Store["runAgent"] = (projectId, agentId, task) => {
      const runId = uid("run");
      const agent = roleAgents.find((a) => a.id === agentId)!;
      const project = current(projectId);
      if (!project) return runId;
      const st = stateRef.current!;
      const book = playbook(agentId, task, project, { vercel: st.vercel.status === "connected", github: st.github.status === "connected" });
      const run: AgentRun = { id: runId, agentId, task, state: "queued", startedAt: now(), log: [] };
      patch(projectId, (p) => ({ ...p, agentRuns: [run, ...p.agentRuns] }));
      const setRun = (fn: (r: AgentRun) => AgentRun) => patch(projectId, (p) => ({ ...p, agentRuns: p.agentRuns.map((r) => (r.id === runId ? fn(r) : r)) }));
      window.setTimeout(() => setRun((r) => ({ ...r, state: "working", log: [{ at: now(), text: `${agent.name} picked up the task` }] })), 700);
      book.logs.forEach((text, i) => window.setTimeout(() => setRun((r) => ({ ...r, log: [...r.log, { at: now(), text }] })), 1300 + i * 800));
      window.setTimeout(() => {
        const csId = book.proposal ? uid("cs") : undefined;
        const change: ChangeSet | null = book.proposal ? { id: csId!, createdAt: now(), status: "proposed", source: agent.name, ...book.proposal } : null;
        patch(projectId, (p) => ({
          ...p,
          agentRuns: p.agentRuns.map((r) => (r.id === runId ? { ...r, state: book.needs ? "needs-input" : "complete", summary: book.summary, question: book.needs, changeSetId: csId } : r)),
          changeSets: change ? [change, ...p.changeSets] : p.changeSets,
          messages: [...p.messages, { id: uid("m"), author: "agent", agent: agent.name, at: now(), text: book.message }],
          timeline: p.timeline.map((t, i) => (i === 3 ? { ...t, note: `${agent.name}: ${book.summary}` } : t)),
        }));
        log(`${agent.name}: ${book.summary}`, { projectId, tone: book.needs ? "warn" : "success" });
        toast(book.needs ? `${agent.name} needs input` : `${agent.name} finished`, { description: book.summary });
      }, 1300 + book.logs.length * 800 + 300);
      return runId;
    };

    const resumeRun: Store["resumeRun"] = (projectId, runId) => {
      const project = current(projectId);
      const run = project?.agentRuns.find((r) => r.id === runId);
      if (!project || !run) return;
      const setRun = (fn: (r: AgentRun) => AgentRun) => patch(projectId, (p) => ({ ...p, agentRuns: p.agentRuns.map((r) => (r.id === runId ? fn(r) : r)) }));
      setRun((r) => ({ ...r, state: "working", question: undefined, log: [...r.log, { at: now(), text: "Input received. Continuing." }] }));
      const book = playbook(run.agentId, run.task, project, { vercel: true, github: true });
      book.logs.slice(1).forEach((text, i) => window.setTimeout(() => setRun((r) => ({ ...r, log: [...r.log, { at: now(), text }] })), 700 + i * 700));
      window.setTimeout(() => {
        setRun((r) => ({ ...r, state: "complete", summary: book.summary }));
        patch(projectId, (p) => ({ ...p, messages: [...p.messages, { id: uid("m"), author: "agent", agent: "Deploy assistant", at: now(), text: book.message }] }));
        log(`Deploy assistant: ${book.summary}`, { projectId, tone: "success" });
        toast.success("Deploy assistant finished", { description: book.summary });
      }, 700 + book.logs.length * 700);
    };

    const acceptChangeSet: Store["acceptChangeSet"] = (projectId, changeId) => {
      patch(projectId, (p) => {
        const cs = p.changeSets.find((c) => c.id === changeId);
        if (!cs || cs.status !== "proposed") return p;
        let files = [...p.files];
        for (const patchItem of cs.patches) {
          const at = files.findIndex((f) => f.path === patchItem.path);
          if (at >= 0) files[at] = { ...files[at], content: patchItem.after, base: patchItem.after, changed: true };
          else files.push({ path: patchItem.path, content: patchItem.after, base: patchItem.after, committed: null, changed: true });
        }
        const site = cs.siteAfter ?? p.site;
        return {
          ...p, files, site, name: site.brand,
          changeSets: p.changeSets.map((c) => (c.id === changeId ? { ...c, status: "accepted" } : c)),
          history: { past: [...p.history.past, snapshot(p, cs.title)].slice(-25), future: [] },
          timeline: readyTimeline(`Applied · ${cs.title}`), updatedAt: now(),
          messages: [...p.messages, { id: uid("m"), author: "architect", at: now(), text: `Applied "${cs.title}" from ${cs.source}. ${cs.patches.length} ${cs.patches.length === 1 ? "file" : "files"} changed.` }],
        };
      });
      log("Accepted a proposed change", { projectId, tone: "success" });
    };

    const commitPush: Store["commitPush"] = (projectId, message, paths) => {
      const sha = hash(message + Date.now(), 7);
      patch(projectId, (p) => ({
        ...p,
        files: p.files.map((f) => (paths.includes(f.path) ? { ...f, committed: f.content } : f)),
        github: p.github ? { ...p.github, lastCommit: sha, lastPushAt: now() } : p.github,
        updatedAt: now(),
      }));
      const p = current(projectId);
      log(`Pushed ${paths.length} ${paths.length === 1 ? "file" : "files"} to ${p?.github?.repository ?? "a repository"} (simulated)`, { projectId, tone: "success" });
      return sha;
    };

    return {
      ready: true, state, draft, setDraft,
      tour: { open: tourOpen },
      openTour: () => setTourOpen(true),
      closeTour: () => { setTourOpen(false); commit((s) => ({ ...s, onboarding: { ...s.onboarding, workspaceTourCompleted: true } })); },
      signIn: (mode) => commit((s) => ({ ...s, user: { id: uid("u"), name: mode === "google" ? "Dhananjay" : "Guest", email: mode === "google" ? "dhananjay@lyzr.demo" : undefined, authMode: mode } })),
      signOut: () => { try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ } setNextTheme("system"); setState(seedState(null)); router.push("/"); },
      resetDemo: () => { commit((s) => seedState(s.user)); toast.success("Demo data reset", { description: "Seeded projects restored." }); },
      setTheme,
      getProject: (id) => state.projects.find((p) => p.id === id),
      createProject, importProject,
      reviewImport: (id, mode) => patch(id, (p) => ({ ...p, importReviewed: true, workspaceMode: mode })),
      deleteProject: (id) => commit((s) => ({ ...s, projects: s.projects.filter((p) => p.id !== id), activeProjectId: s.activeProjectId === id ? null : s.activeProjectId })),
      duplicateProject: (id) => {
        const p = current(id);
        if (!p) return undefined;
        const copy: Project = { ...p, id: uid("p"), name: `${p.name} copy`, createdAt: now(), updatedAt: now(), deployments: [], github: undefined, vercel: undefined, status: p.status === "deployed" ? "ready" : p.status, agentRuns: [], history: { past: [], future: [] } };
        commit((s) => ({ ...s, projects: [copy, ...s.projects] }));
        log(`Duplicated ${p.name}`, { projectId: copy.id });
        return copy.id;
      },
      renameProject: (id, name) => patch(id, (p) => ({ ...p, name, site: { ...p.site, brand: name }, updatedAt: now() })),
      setActive: (id) => commit((s) => (s.activeProjectId === id ? s : { ...s, activeProjectId: id })),
      patchProject: patch,
      sendMessage,
      undo: (id) => restore(id, "undo"),
      redo: (id) => restore(id, "redo"),
      setMode: (id, mode) => patch(id, (p) => ({ ...p, workspaceMode: mode })),
      editFile,
      acceptFile: (id, path) => patch(id, (p) => ({ ...p, files: p.files.map((f) => (f.path === path ? { ...f, base: f.content, changed: true } : f)) })),
      discardFile: (id, path) => patch(id, (p) => ({ ...p, files: p.files.map((f) => (f.path === path ? { ...f, content: f.base } : f)) })),
      createFile,
      deleteFile: (id, path) => patch(id, (p) => withUpdated({ ...p, files: p.files.filter((f) => f.path !== path) })),
      updateConfig,
      resetConfig: (id) => { const p = current(id); if (p) updateConfig(id, () => defaultConfig(p.framework, p.styling)); },
      runAgent, resumeRun, acceptChangeSet,
      discardChangeSet: (projectId, changeId) => patch(projectId, (p) => ({ ...p, changeSets: p.changeSets.map((c) => (c.id === changeId ? { ...c, status: "discarded" } : c)) })),
      connectConnector: (id, account) => {
        commit((s) => ({ ...s, connectors: { ...s.connectors, [id]: { status: "connecting", account } } }));
        window.setTimeout(() => {
          commit((s) => {
            const entry: ConnectorState = { status: "connected", account, connectedAt: now() };
            const next = { ...s, connectors: { ...s.connectors, [id]: entry } };
            if (id === "github") next.github = { status: "connected", username: account ?? "dhananjay-dev", repos: s.github.repos.length ? s.github.repos : demoRepos.map((r) => ({ ...r })) };
            if (id === "vercel") next.vercel = { status: "connected", username: "dhananjay", team: account ?? demoTeams[0], teams: demoTeams };
            return next;
          });
          log(`Connected ${id} (simulated)`, { tone: "success" });
        }, 900);
      },
      disconnectConnector: (id) => commit((s) => {
        const { [id]: _removed, ...rest } = s.connectors;
        void _removed;
        const next = { ...s, connectors: rest };
        if (id === "github") next.github = { status: "disconnected", repos: [] };
        if (id === "vercel") next.vercel = { status: "disconnected", teams: [] };
        return next;
      }),
      addCustomConnector: (name, url) => commit((s) => ({ ...s, customConnectors: [...s.customConnectors, { id: "custom-" + slugify(name), name, url }], connectors: { ...s.connectors, ["custom-" + slugify(name)]: { status: "connected", account: url, connectedAt: now() } } })),
      createRepo: (name, visibility, description) => commit((s) => ({ ...s, github: { ...s.github, repos: [{ name: slugify(name), visibility, description: description || "Created in Architect (demo draft)", draft: true, updated: "Just now", language: "TypeScript" } as RepoDraft, ...s.github.repos] } })),
      selectRepo: (projectId, repo) => { patch(projectId, (p) => ({ ...p, github: { repository: repo, branch: "main" } })); log(`Linked ${repo} to a project (simulated)`, { projectId }); },
      commitPush,
      setVercelTeam: (team) => commit((s) => ({ ...s, vercel: { ...s.vercel, team } })),
      linkVercel: (projectId, link) => { patch(projectId, (p) => ({ ...p, vercel: { ...link, framework: p.framework } })); log(`Linked Vercel project ${link.project} (simulated)`, { projectId, tone: "success" }); },
      unlinkVercel: (projectId) => patch(projectId, (p) => ({ ...p, vercel: undefined })),
      recordDeployment: (projectId, d) => {
        patch(projectId, (p) => ({ ...p, status: d.status === "ready" ? "deployed" : p.status, deployments: [d, ...p.deployments], updatedAt: now(), timeline: d.status === "ready" ? readyTimeline(`Deployed · ${d.environment}`) : p.timeline }));
        log(d.status === "ready" ? `Deployed to ${d.target} · ${d.environment} (simulated)` : `Deployment to ${d.target} failed (simulated)`, { projectId, tone: d.status === "ready" ? "success" : "warn" });
      },
      saveWorkflow: (w) => { commit((s) => ({ ...s, workflows: [{ ...w, saved: true, createdAt: w.createdAt ?? now() }, ...s.workflows.filter((x) => x.id !== w.id)] })); log(`Saved agent workflow: ${w.name}`, { tone: "success" }); },
      removeWorkflow: (id) => commit((s) => ({ ...s, workflows: s.workflows.filter((w) => w.id !== id) })),
      markHint: (id) => commit((s) => (s.onboarding.seenHints.includes(id) ? s : { ...s, onboarding: { ...s.onboarding, seenHints: [...s.onboarding.seenHints, id] } })),
      markNotificationsSeen: () => commit((s) => ({ ...s, notificationsSeenAt: now() })),
      log,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, draft, tourOpen]);

  if (!store) return null;
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useProject(id: string | undefined) {
  const { state } = useApp();
  return state.projects.find((p) => p.id === id);
}
