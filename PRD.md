# Lyzr Architect — Product Requirements Document

## 1. Product summary

Lyzr Architect is a UI-first, AI-assisted application builder for both non-technical creators and developers. A person can describe an app in plain language, watch its structure and interface take shape, refine it through chat or code, connect a GitHub repository, and walk through a simulated deployment.

This is a polished Next.js prototype, not a production coding agent. It prioritizes the product experience, information architecture, and end-to-end flows. All mutable data lives in `sessionStorage`; there is no backend, real authentication, GitHub API, code execution, or deployment infrastructure.

## 2. Problem and opportunity

Current app-building tools often force a choice between a friendly prompt-first workflow and a developer-centric workspace. Architect 2.0 should make both audiences feel supported without presenting two disconnected products.

The core experience should answer three questions clearly:

1. What can I build here?
2. What is the system doing with my request right now?
3. How do I take control, iterate, and ship when I need to?

## 3. Goals

- Demonstrate a considered, complete path from sign-in to deployment.
- Support prompt-led creation, project import, visual iteration, code-aware editing, agents, GitHub, and deployment in one coherent workspace.
- Make product state legible: current project, build progress, generated files, preview state, GitHub state, and deployment state.
- Provide meaningful front-end interactions backed by session-scoped demo data.
- Feel credible and calm for developers while remaining approachable to non-technical users.

## 4. Non-goals

- Real accounts, OAuth, multi-user collaboration, persistence across browser sessions, or authorization.
- Calling an LLM, generating runnable code, running sandboxes, cloning repositories, pushing to GitHub, or deploying an app.
- Production-grade error handling, billing, analytics, or infrastructure.
- Recreating the visual language or layouts of any referenced platform.

## 5. Users and jobs to be done

| User | Primary need | What Architect should offer |
| --- | --- | --- |
| Founder / creator | Turn an idea into a tangible app without setting up a codebase. | Guided prompting, starter ideas, visible progress, visual preview, plain-language edits. |
| Product designer | Explore a product direction and communicate it clearly. | Fast preview changes, design-aware suggestions, shareable-looking project state. |
| Developer | Start quickly, import work, inspect files, and retain control. | Project import flow, file tree/code panel, framework choices, GitHub and deploy handoffs. |

## 6. Product principles

- **Start with intent, not tooling.** The first decision is what the user wants to make, not which framework they understand.
- **Progress must be visible.** Never leave a user guessing whether a request is being handled.
- **Progressive disclosure.** Creator controls come first; code and advanced settings are one deliberate step away.
- **Teach in context.** First-run guidance should orient a user without trapping them in a tutorial or obscuring the work.
- **One project, several modes.** Chat, canvas/preview, files, agents, integrations, and deploy all describe the same project.
- **Honest prototype behavior.** Simulated actions should use clear success states and demo data, never imply a real remote operation happened.
- **First-principles interface.** Build an original experience around user needs rather than copying a reference product.

## 7. Information architecture

### Global areas

- **Authentication:** simple welcome/sign-in entry.
- **Guided setup:** a first-run orientation overlay with contextual workspace callouts.
- **Appearance:** light, dark, and system theme selection.
- **Home:** project list, recent activity, quick starts, import entry point.
- **Project workspace:** the main builder with chat, project context, files, preview, and action rail.
- **Agents:** a focused view for browsing/creating specialist agents and reviewing their activity.
- **Integrations:** GitHub source-control and Vercel deployment-account connection flows.
- **Deploy:** deployment configuration, validation checklist, deployment progress, and success state.

### Persistent workspace chrome

- Left rail: product mark, Home, Projects, Agents, Templates, Integrations, and user menu.
- Top bar: project switcher/name, project status, undo/redo placeholders, preview/open controls, and primary **Deploy** action.
- Contextual right panel: activity/build steps, inspector, integration status, or deploy checklist based on the active task.
- Workspace mode switcher: **Build** for the focused prompt-and-preview experience, and **Developer** for hands-on project controls. The selected mode is per-project and persists for the session.
- Theme switcher: icon-led **Light**, **Dark**, and **System** controls in the user menu; the chosen mode applies app-wide.

## 8. Core screens and requirements

### 8.1 Authentication / welcome

Purpose: establish a low-friction start and communicate the product promise.

- Show an original product value proposition and one primary sign-in action.
- Provide demo options such as **Continue with Google** and **Continue as guest**; both establish a local demo session.
- Returning users should skip this screen while the session exists.

### 8.2 First-run guided setup

Purpose: help a new user understand the workspace quickly without interrupting momentum.

- After a user first enters a project workspace, show a lightweight, four-step spotlight overlay: project/navigation, prompt composer, preview, and the action area for modes, integrations, and deploy.
- Each step explains the outcome a control enables rather than merely naming the interface element. For example: “Describe a change here; Architect turns the request into a visible project update.”
- Users can move forward/back, skip the guide, or dismiss it with Escape. The overlay must never block later use of the app.
- Persist guide state in `sessionStorage` per user/session. Offer **Replay workspace tour** from Help or the user menu.
- A compact contextual hint may appear the first time a user opens Developer mode, connects an integration, or deploys; each hint is independently dismissible.

### 8.3 Home and projects

Purpose: help users start or resume work.

- Show recent projects as cards with name, description, framework badge, last activity, and status.
- Provide **New project** and **Import project** actions.
- Include promptable starter templates (for example SaaS dashboard, marketplace, personal portfolio, support agent).
- New projects should appear immediately and persist in `sessionStorage` for the browser session.

### 8.4 New project flow

Purpose: collect just enough intent to create a useful workspace.

- A prompt composer supports a product description and optional enhancement chips.
- A lightweight advanced section exposes framework, styling, and project type choices; defaults should be sensible.
- On create, simulate a short generation sequence and then open the project workspace with generated demo files and messages.
- Include a distinct **Import existing project** path accepting a repository URL or ZIP-style choice; it populates a believable imported project summary without uploading or cloning data.

### 8.5 Project workspace

Purpose: be the central creation environment for both audiences.

- Default layout: conversation pane, central preview/canvas, and collapsible project context panel.
- The chat composer accepts requests such as “Add a pricing section” or “Use a darker theme.” Sending a request adds a user message, an in-progress agent state, and a deterministic demo result.
- Include suggested next actions based on the current project state.
- Preview can switch among desktop, tablet, and mobile widths, loading/error/empty states, and a full-screen presentation mode.
- A **Code** mode reveals a file tree and read-only/editable demo code panel alongside the preview. Editing a file updates local project state and marks it changed.
- Show a compact build timeline with stages such as planning, building UI, reviewing, and ready to preview.

### 8.6 Developer mode

Purpose: give developers a high-agency project cockpit without making the default product experience intimidating.

Developer mode is an elevated workspace mode, not simply a code editor. It keeps the live preview visible while exposing the project decisions and levers that developers expect to inspect and change.

- Toggle from Build mode in the workspace top bar; show a short first-use explanation and allow instant return to Build mode.
- Use a three-pane layout: project explorer on the left, editable code/diff surface in the center, and a dockable **Control Room** on the right. The preview can remain split beside the editor or expand full-width.
- Project explorer includes files, routes, components, and a generated dependency map. These are seeded demo structures, but selection and edits work locally.
- Control Room provides mock controls for framework version, styling system, dependencies, environment variables, and build target. Users can add/edit/remove items locally, reset to generated defaults, and see a clear “local demo configuration” label.
- Include a command palette with fast actions such as **Create component**, **Add route**, **Ask agent to refactor**, **View changes**, **Connect GitHub**, and **Deploy preview**.
- **Changes** view shows an intelligible before/after diff and lets the user accept or discard each local change. It is a UI-level history, not Git.
- **Run panel** simulates lint, type-check, and build output with deterministic logs, pass/fail variants, and links to a relevant mock file/error location. It must not execute user code.
- Developers can invoke agents with technical tasks and receive visible proposed file changes before applying them to local state.

### 8.7 Agent section

Purpose: make delegated work understandable rather than magical.

- Present a library of role-based agents: Product planner, UI designer, Frontend engineer, Backend engineer, QA reviewer, and Deploy assistant.
- A user can activate an agent from a project and provide a task.
- Agent runs are simulated with queued, working, complete, and needs-input states.
- Each run records a concise activity log and a visible output summary, such as “Added onboarding cards” or “Found two responsive issues.”
- Agent actions may update the current project’s mock messages, build timeline, or files.

### 8.8 GitHub integration

Purpose: support developer handoff and source-control expectations.

- Show disconnected, connecting, connected, repository selected, and sync-ready UI states.
- **Connect GitHub** opens a consent-style modal; confirmation changes only local session state.
- Repository picker lists local demo repositories and supports creating a named repository draft.
- A commit/push panel surfaces changed files, a commit message, and a simulated successful push.
- Label all results appropriately as demo/local where necessary.

### 8.9 Vercel integration

Purpose: make the deployment handoff feel familiar and credible to Next.js developers.

- Show disconnected, connecting, connected, project linked, and ready-to-deploy states separately from the generic deployment target selector.
- **Connect Vercel** opens a consent-style modal and records a local demo account/team; it never performs OAuth or calls Vercel.
- After connecting, offer a team selector and a project-link/create-project sheet. A linked project shows a framework badge, target branch, and latest mock deployment status.
- The deployment flow should preferentially offer the linked Vercel project and show an understandable source path: local changes → GitHub repository (if connected) → Vercel preview/production.
- Clearly label connected accounts, teams, links, URLs, and deployment statuses as simulated where the UI could otherwise imply remote access.

### 8.10 Deployment

Purpose: close the loop with a confident shipping experience.

- Let the user choose a deployment target (Vercel is the primary, familiar option; Architect hosting and Netlify are secondary demo options) and environment name.
- Surface a pre-deploy checklist: project generated, preview checked, GitHub repository connected (optional), Vercel project connected (optional), and environment variables (demo only).
- Clicking **Deploy** runs a staged local progress UI, then shows a generated preview URL and deployment summary.
- Users can revisit deployment history for the current session and open a static deployed-preview screen.

## 9. Primary user flows

### Creator flow

Welcome → Continue as guest → Home → New project → describe an app → choose defaults → simulated generation → first-run workspace guide → chat-led refinements → responsive preview → Deploy → deployment success.

### Developer flow

Welcome → sign in → Import project → provide repository URL → imported-project review → Developer mode → inspect/edit demo file and configuration → simulated checks → GitHub connect → simulated commit/push → Vercel connect/link → Deploy.

### Agent-assisted flow

Workspace → choose Agents → activate UI designer → assign task → watch progress → review output → return to preview/chat to continue.

## 10. Session data model

All data must be read from and written to `sessionStorage` behind a small client-side storage utility. Use a versioned key such as `architect2:state:v2` and seed the UI if no state exists.

```ts
type AppState = {
  user: { id: string; name: string; email?: string; authMode: 'guest' | 'google' } | null;
  projects: Project[];
  activeProjectId: string | null;
  onboarding: { workspaceTourCompleted: boolean; seenHints: string[] };
  preferences: { theme: 'light' | 'dark' | 'system' };
  github: { status: 'disconnected' | 'connected'; username?: string };
  vercel: { status: 'disconnected' | 'connected'; username?: string; team?: string };
};

type Project = {
  id: string;
  name: string;
  description: string;
  framework: 'Next.js' | 'React' | 'Other';
  status: 'draft' | 'building' | 'ready' | 'deployed';
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  files: { path: string; content: string; changed?: boolean }[];
  agentRuns: AgentRun[];
  workspaceMode: 'build' | 'developer';
  configuration: { dependencies: Dependency[]; environmentVariables: EnvVar[] };
  changeSets: ChangeSet[];
  github?: { repository: string; lastCommit?: string };
  vercel?: { project: string; team: string; targetBranch: string };
  deployments: Deployment[];
};
```

Transient progress can be driven by timers in the client. Persist completed states but do not attempt background jobs or cross-tab synchronization.

## 11. Design direction

- Use Lyzr’s public visual language, including its supplied Lyzr logo asset, and do not substitute a generic AI-app mark or unrelated brand treatment. The product should be identified as **Lyzr Architect** throughout.
- Use the public Lyzr palette as the design-token source: espresso `#160F0A` for dark ink/canvas, cream `#FAFAF9` for light canvas, terracotta `#D96354` as the core accent, terracotta `#BD4C3F` for primary actions, terracotta `#F38676` for dark-mode hover/emphasis, and the supporting espresso/cream scale for surfaces, borders, and hierarchy.
- Lyzr’s public site favors a warm, editorial enterprise tone: concise declarative headlines, short outcome-led supporting copy, and concrete language around control, production, safety, and deployment. Avoid filler such as “supercharge,” “seamlessly,” “revolutionize,” “unlock,” and generic “AI magic” language.
- Use an editorial layout with confident typography, generous negative space, clear information hierarchy, restrained terracotta emphasis, and purposeful data-dense panels in Developer mode.
- Implement equal-quality light and dark themes rather than treating dark mode as the only polished state. Light mode uses cream canvas, white raised surfaces, espresso text, and terracotta actions. Dark mode uses espresso canvas/surfaces, cream text, muted espresso secondary text, and the lighter terracotta action treatment. Respect `prefers-color-scheme` initially when no user choice exists.
- Keep contrast accessible in both themes, including states for hover, focus, disabled, success, warning, and error. Do not use color as the only indicator of status.
- Make every state purposeful: empty, generating, complete, error/retry, disconnected, and deployed.
- Favor straightforward language over technical jargon; advanced details should remain available to developers without blocking beginners.
- Support keyboard navigation, visible focus states, semantic controls, and responsive behavior down to mobile widths.

### Motion and component system

- Use **Framer Motion** for purposeful, fast transitions: first-run spotlight choreography, workspace panel/layout changes, generation and deployment progress, command palette entry, cards, toasts, and small status changes. Motion must clarify state, never delay core actions.
- Respect `prefers-reduced-motion`; reduce non-essential movement to instant or opacity-only transitions.
- Use **shadcn/ui** as the accessible component foundation, customized through Lyzr design tokens rather than stock shadcn colors. Relevant primitives include Dialog, Sheet, Dropdown Menu, Tabs, Tooltip, Command, Scroll Area, Resizable, Sonner, and the theme-ready Button/Input/Form building blocks.
- Complement shadcn/ui with Lucide icons, `next-themes` for class-based theme switching, and a lightweight code editor/rendering component only where it improves the Developer mode prototype. Avoid a crowded component-library aesthetic.

## 12. Technical approach

- **Framework:** Next.js with TypeScript and the App Router.
- **Rendering:** client components where interactive state is required; static/mock data otherwise.
- **Styling:** Tailwind CSS with CSS variables for the Lyzr semantic tokens, wired into a customized shadcn/ui theme.
- **Interaction and UI:** Framer Motion, shadcn/ui, Lucide icons, Sonner notifications, and `next-themes`.
- **State:** React context or a lightweight client store, hydrated from `sessionStorage` after mount.
- **Theme state:** honor the system preference until a user explicitly selects light or dark; persist that selection in `sessionStorage` as part of app preferences.
- **Dependencies:** keep them minimal; do not add server, database, authentication, GitHub, or deployment SDKs.

## 13. Acceptance criteria

- A reviewer can complete the creator, developer/import, agent, GitHub, Vercel, and deploy flows without encountering a dead end.
- The first workspace visit presents an optional, keyboard-dismissible guided setup and it does not repeat once completed or skipped.
- Developer mode provides locally working file/configuration edits, visual changes/diffs, simulated checks, and proposed agent changes without executing code or requiring a backend.
- The app has polished desktop and mobile layouts for its key screens.
- Lyzr Architect uses the approved public Lyzr logo and the specified Lyzr-derived visual tokens; its product copy is concise, specific, and free of generic AI-platform filler.
- The user can choose Light, Dark, or System theme; the choice is retained for the browser session, system preference is honored by default, and both themes meet the same usability/accessibility bar.
- Motion makes workspace state changes easier to follow, respects reduced-motion preferences, and does not prevent or delay task completion.
- Project creation, messages, file/configuration edits, agent outputs, onboarding state, GitHub/Vercel connection state, and deployments survive navigation within the browser session.
- Refreshing retains the session state; a new browser session starts with clean seeded demo data.
- Every remote-looking action is simulated locally and is not represented as a real integration.
- The workspace communicates what is happening during generation and deployment with clear visual feedback.
- The implementation runs locally as a Next.js application with no required backend services or environment variables.

## 14. Suggested delivery slices

1. Lyzr-branded app shell, light/dark/system theme foundation, welcome flow, home/projects, seeded session storage, and design tokens.
2. First-run guided setup, new/import project flows, and the core workspace with chat, generation states, preview, and Code mode.
3. Developer mode, agents, GitHub/Vercel connection and demo commit/link flows, and deployment flow.
4. Responsive polish, accessibility pass, empty/loading/error states, and final interaction QA.
