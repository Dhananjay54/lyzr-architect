import { baseProject, buildFiles, readyTimeline, siteFor } from "./engine";
import type { AppState, Deployment, Project } from "./types";
import { hash, uid } from "./utils";

export const STORAGE_KEY = "architect2:state:v2";

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const H = 3600_000;
const D = 24 * H;

export function seedProjects(): Project[] {
  const orbitSite = siteFor("landing", "Orbit");
  const orbit = baseProject({
    id: "p_orbit", name: "Orbit", site: orbitSite, origin: "seed", status: "ready", createdAt: ago(2 * D), updatedAt: ago(3 * H),
    description: "A calm, editorial launch page for a focused team workspace.",
    prompt: "A launch page called Orbit for a focused team workspace.",
    messages: [
      { id: uid("m"), author: "architect", at: ago(2 * D), text: "I mapped a calm, editorial launch page for Orbit. The first build is ready to inspect." },
      { id: uid("m"), author: "you", at: ago(2 * D - 5 * 60_000), text: "Make it feel intentional, not like another productivity tool." },
      { id: uid("m"), author: "architect", at: ago(2 * D - 8 * 60_000), text: "Done. I pulled back the visual noise, sharpened the hierarchy and made the core action more decisive. Try asking for a pricing section or a darker theme next." },
    ],
    timeline: readyTimeline("Updated 3 hours ago"),
  });

  const harborSite = siteFor("support", "Harbor", "ocean");
  const harbor = baseProject({
    id: "p_harbor", name: "Harbor", site: harborSite, origin: "seed", status: "ready", createdAt: ago(5 * D), updatedAt: ago(1 * D),
    description: "A help centre with an answer agent that hands off to a person.",
    prompt: "A customer support site called Harbor with an answer agent and clear hand-off.",
    messages: [
      { id: uid("m"), author: "architect", at: ago(5 * D), text: "Harbor is ready: a help centre, a live conversation preview and a clear hand-off path." },
      { id: uid("m"), author: "agent", agent: "QA reviewer", at: ago(1 * D), text: "QA review: Hero button touch target is 38px, below the 44px guideline (components/hero.tsx)." },
    ],
    agentRuns: [{
      id: uid("run"), agentId: "qa", task: "Check the preview at mobile width", state: "complete", startedAt: ago(1 * D),
      log: [{ at: ago(1 * D), text: "Opened the preview at 375, 768 and 1280" }, { at: ago(1 * D), text: "Found: Hero button touch target is 38px (components/hero.tsx)" }],
      summary: "Found one responsive issue.",
    }],
    timeline: readyTimeline("Updated yesterday"),
  });
  harbor.site = { ...harbor.site, mobileNav: true };

  const notesSite = { ...siteFor("portfolio", "Field Notes", "violet"), mobileNav: true };
  const notesFiles = buildFiles(notesSite, { name: "Field Notes", framework: "Next.js", styling: "Tailwind CSS", config: baseProject({ name: "x", site: notesSite }).configuration });
  const deployment: Deployment = {
    id: "d_notes_1", target: "Architect hosting", environment: "Production", branch: "main", status: "ready",
    url: `https://field-notes-${hash("field-notes", 5)}.architect.demo`, createdAt: ago(8 * D), durationMs: 41_000,
    source: ["Local changes", "Architect hosting"], site: notesSite, fileCount: notesFiles.length,
  };
  const notes = baseProject({
    id: "p_notes", name: "Field Notes", site: notesSite, origin: "seed", status: "deployed", createdAt: ago(9 * D), updatedAt: ago(8 * D),
    description: "A portfolio with four case studies and a short bio.", deployments: [deployment],
    prompt: "A personal portfolio called Field Notes for a product designer.",
    messages: [
      { id: uid("m"), author: "architect", at: ago(9 * D), text: "Field Notes is built: four case studies, a short bio and a contact section." },
      { id: uid("m"), author: "architect", at: ago(8 * D), text: "Deployed to Architect hosting (simulated). The static preview is available from Deploy." },
    ],
    timeline: readyTimeline("Deployed 8 days ago"),
  });

  return [orbit, harbor, notes];
}

export function seedState(user: AppState["user"] = null): AppState {
  return {
    version: 2,
    user,
    projects: seedProjects(),
    activeProjectId: null,
    onboarding: { workspaceTourCompleted: false, seenHints: [] },
    preferences: { theme: "system" },
    github: { status: "disconnected", repos: [] },
    vercel: { status: "disconnected", teams: [] },
    connectors: {},
    customConnectors: [],
    workflows: [],
    activity: [
      { id: uid("a"), at: ago(3 * H), text: "Orbit updated: sharper headline", projectId: "p_orbit" },
      { id: uid("a"), at: ago(1 * D), text: "QA reviewer finished a review on Harbor", projectId: "p_harbor", tone: "warn" },
      { id: uid("a"), at: ago(8 * D), text: "Field Notes deployed to Architect hosting (simulated)", projectId: "p_notes", tone: "success" },
    ],
    notificationsSeenAt: new Date().toISOString(),
  };
}
