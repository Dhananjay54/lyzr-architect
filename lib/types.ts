export type ThemeChoice = "light" | "dark" | "system";
export type Framework = "Next.js" | "React" | "Other";
export type Styling = "Tailwind CSS" | "CSS Modules" | "Vanilla CSS" | "styled-components";
export type ProjectKind = "saas" | "marketplace" | "portfolio" | "support" | "landing";
export type ProjectStatus = "draft" | "building" | "ready" | "deployed";
export type WorkspaceMode = "build" | "developer";
export type Accent = "terracotta" | "ocean" | "forest" | "violet";

/* ---------- Generated site (drives the live preview) ---------- */

export type SectionType =
  | "nav" | "hero" | "logos" | "features" | "stats" | "showcase"
  | "pricing" | "testimonials" | "faq" | "cta" | "footer";

export type SectionItem = { title: string; body?: string; meta?: string };
export type Section = {
  id: string;
  type: SectionType;
  eyebrow?: string;
  title?: string;
  body?: string;
  cta?: string;
  items?: SectionItem[];
};
export type Site = {
  brand: string;
  kind: ProjectKind;
  theme: "light" | "dark";
  accent: Accent;
  mobileNav: boolean;
  density: "comfortable" | "tight";
  sections: Section[];
};

/* ---------- Project ---------- */

export type ChatStep = { label: string; state: "done" | "active" | "pending" };
export type Message = {
  id: string;
  author: "architect" | "you" | "agent";
  agent?: string;
  text: string;
  at: string;
  status?: "working" | "done";
  steps?: ChatStep[];
  changeTitle?: string;
};

export type ProjectFile = {
  path: string;
  content: string;
  /** Last reviewed/accepted content. `content !== base` means a pending local edit. */
  base: string;
  /** Content at the last simulated push. null = never pushed. */
  committed: string | null;
  changed?: boolean;
};

export type Dependency = { id: string; name: string; version: string; kind: "runtime" | "dev" };
export type EnvVar = { id: string; key: string; value: string; scope: "all" | "preview" | "production"; secret: boolean };
export type ProjectConfig = {
  frameworkVersion: string;
  styling: Styling;
  buildTarget: "Vercel" | "Node server" | "Static export";
  dependencies: Dependency[];
  environmentVariables: EnvVar[];
};

export type FilePatch = { path: string; before: string | null; after: string };
export type ChangeSet = {
  id: string;
  title: string;
  summary: string;
  source: string;
  createdAt: string;
  status: "proposed" | "accepted" | "discarded" | "applied";
  patches: FilePatch[];
  siteAfter?: Site;
};

export type AgentRunState = "queued" | "working" | "complete" | "needs-input";
export type AgentRun = {
  id: string;
  agentId: string;
  task: string;
  state: AgentRunState;
  startedAt: string;
  log: { at: string; text: string }[];
  summary?: string;
  question?: { text: string; actionLabel: string; action: "connect-vercel" | "connect-github" | "confirm" };
  changeSetId?: string;
};

export type Deployment = {
  id: string;
  target: "Vercel" | "Architect hosting" | "Netlify";
  environment: string;
  branch: string;
  url: string;
  status: "ready" | "failed";
  createdAt: string;
  durationMs: number;
  commit?: string;
  source: string[];
  site: Site;
  fileCount: number;
};

export type Snapshot = { site: Site; files: ProjectFile[]; label: string };

export type Project = {
  id: string;
  name: string;
  description: string;
  prompt?: string;
  framework: Framework;
  styling: Styling;
  kind: ProjectKind;
  origin: "prompt" | "template" | "import" | "seed";
  importedFrom?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  files: ProjectFile[];
  site: Site;
  agentRuns: AgentRun[];
  workspaceMode: WorkspaceMode;
  configuration: ProjectConfig;
  changeSets: ChangeSet[];
  github?: { repository: string; branch: string; lastCommit?: string; lastPushAt?: string };
  vercel?: { project: string; team: string; targetBranch: string; framework: string };
  deployments: Deployment[];
  previewChecked?: boolean;
  importReviewed?: boolean;
  generation?: { stage: number; startedAt: string };
  history: { past: Snapshot[]; future: Snapshot[] };
  timeline: { label: string; note: string; state: "done" | "active" | "pending" }[];
};

/* ---------- Integrations ---------- */

export type Connector = {
  id: string;
  name: string;
  category: string;
  description: string;
  mark: string;
  hue: number;
  scopes: string[];
  capabilities: string[];
  accounts: string[];
  featured?: boolean;
};
export type ConnectorState = { status: "connected" | "connecting"; account?: string; connectedAt?: string };
export type CustomConnector = { id: string; name: string; url: string };

export type RepoDraft = { name: string; visibility: "private" | "public"; description: string; draft?: boolean; updated: string; language: string };

/* ---------- Workflows (sample agent orchestras) ---------- */

export type WorkflowNodeKind = "trigger" | "orchestrator" | "agent" | "tool" | "review" | "output";
export type WorkflowNode = {
  id: string;
  kind: WorkflowNodeKind;
  label: string;
  role: string;
  description: string;
  tools: string[];
  instructions: string;
  sample: { input: string; output: string };
};
export type WorkflowEdge = { from: string; to: string; label?: string };
export type Workflow = {
  id: string;
  name: string;
  summary: string;
  category: string;
  keywords: string[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  sampleInput: string;
  sampleOutput: string[];
  connectors: string[];
  saved?: boolean;
  deployedUrl?: string;
  createdAt?: string;
};

/* ---------- App ---------- */

export type Activity = { id: string; at: string; text: string; projectId?: string; tone?: "default" | "success" | "warn" };

export type AppState = {
  version: 2;
  user: { id: string; name: string; email?: string; authMode: "guest" | "google" } | null;
  projects: Project[];
  activeProjectId: string | null;
  onboarding: { workspaceTourCompleted: boolean; seenHints: string[] };
  preferences: { theme: ThemeChoice };
  github: { status: "disconnected" | "connected"; username?: string; repos: RepoDraft[] };
  vercel: { status: "disconnected" | "connected"; username?: string; team?: string; teams: string[] };
  connectors: Record<string, ConnectorState>;
  customConnectors: CustomConnector[];
  workflows: Workflow[];
  activity: Activity[];
  notificationsSeenAt: string;
};
