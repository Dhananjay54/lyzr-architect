import type { Accent, Connector, ProjectKind, Workflow, WorkflowNode, WorkflowNodeKind } from "./types";

/* ---------- Starter templates ---------- */

export type Template = {
  id: string;
  kind: ProjectKind;
  name: string;
  tagline: string;
  prompt: string;
  tags: string[];
  accent: Accent;
};

export const templates: Template[] = [
  { id: "saas-dashboard", kind: "saas", name: "SaaS dashboard", tagline: "Metrics, tables and a calm control surface for a product team.", prompt: "A team analytics dashboard called Lumen with a clear overview, weekly metrics, and pricing for small teams.", tags: ["Dashboard", "Auth", "Charts"], accent: "terracotta" },
  { id: "marketplace", kind: "marketplace", name: "Marketplace", tagline: "Listings, seller profiles and a straightforward checkout path.", prompt: "A marketplace called Kiln for independent ceramic makers, with featured listings and seller stories.", tags: ["Listings", "Search", "Payments"], accent: "forest" },
  { id: "portfolio", kind: "portfolio", name: "Personal portfolio", tagline: "Selected work, a short bio and a contact line. Nothing extra.", prompt: "A personal portfolio called Field Notes for a product designer, with selected case studies and a contact section.", tags: ["Case studies", "Blog", "Contact"], accent: "violet" },
  { id: "support-agent", kind: "support", name: "Support agent", tagline: "A help centre with an agent that answers and hands off cleanly.", prompt: "A customer support site called Harbor with an answer agent, help articles, and a clear way to reach a person.", tags: ["Agent", "Help centre", "Handoff"], accent: "ocean" },
  { id: "launch-page", kind: "landing", name: "Launch page", tagline: "One decisive page for a product that is about to ship.", prompt: "A launch page called Orbit for a focused team workspace, with a decisive first screen and three proof points.", tags: ["Landing", "Waitlist", "Pricing"], accent: "terracotta" },
];

export const enhancementChips = [
  "Editorial typography", "Dark theme", "Pricing section", "Waitlist form",
  "Mobile-first", "Testimonials", "Blog", "Admin area",
];

export const quickStarts = [
  "A booking site for a neighbourhood pottery studio",
  "An internal dashboard that shows weekly support volume",
  "A portfolio for a documentary photographer",
  "A help centre with an agent that answers billing questions",
];

/* ---------- Role agents ---------- */

export type RoleAgent = {
  id: string;
  name: string;
  role: string;
  description: string;
  skills: string[];
  tasks: string[];
  hue: number;
};

export const roleAgents: RoleAgent[] = [
  { id: "planner", name: "Product planner", role: "Scopes the work", description: "Turns a rough brief into a sequenced plan with clear outcomes and open questions.", skills: ["Scoping", "Sequencing", "Risks"], tasks: ["Plan the next three releases", "List what is missing before launch", "Draft acceptance criteria for the homepage"], hue: 24 },
  { id: "designer", name: "UI designer", role: "Shapes the interface", description: "Reviews hierarchy, spacing and copy, then proposes precise visual changes.", skills: ["Hierarchy", "Spacing", "Copy"], tasks: ["Tighten spacing and strengthen the headline", "Review the first screen for clarity", "Propose a calmer visual rhythm"], hue: 8 },
  { id: "frontend", name: "Frontend engineer", role: "Builds the UI", description: "Adds sections, routes and components, and shows the file changes before applying them.", skills: ["Components", "Routes", "Refactors"], tasks: ["Add a pricing section", "Refactor shared layout primitives", "Add a testimonials section"], hue: 200 },
  { id: "backend", name: "Backend engineer", role: "Builds the services", description: "Drafts API routes, data access and health checks for the project.", skills: ["API routes", "Data", "Auth"], tasks: ["Add a health check endpoint", "Draft a data access layer", "Outline the auth flow"], hue: 150 },
  { id: "qa", name: "QA reviewer", role: "Checks the work", description: "Walks the preview at three widths and reports issues with file and line references.", skills: ["Responsive", "Accessibility", "Regression"], tasks: ["Check the preview at mobile width", "Audit keyboard navigation", "Find contrast problems"], hue: 45 },
  { id: "deploy", name: "Deploy assistant", role: "Prepares to ship", description: "Verifies the checklist, source path and environment before a deployment.", skills: ["Checklist", "Environments", "Rollback"], tasks: ["Prepare a preview deployment", "Verify environment variables", "Check the source path to Vercel"], hue: 280 },
];

/* ---------- Connectors ---------- */

const c = (
  id: string, name: string, category: string, description: string, mark: string, hue: number,
  scopes: string[], capabilities: string[], accounts: string[], featured = false,
): Connector => ({ id, name, category, description, mark, hue, scopes, capabilities, accounts, featured });

export const connectors: Connector[] = [
  c("github", "GitHub", "Source control", "Bring repositories, branches and commit context into the work.", "GH", 0, ["Read repository metadata", "Create branches and commits", "Open pull requests"], ["Push a generated project to a repository", "Show changed files before a commit", "Link a deployment to a branch"], ["dhananjay-dev", "lyzr-labs"], true),
  c("vercel", "Vercel", "Deployment", "Link a project and carry the work from preview to production.", "▲", 0, ["List teams and projects", "Create preview deployments", "Read deployment status"], ["Link a Vercel project", "Deploy a preview or production build", "Track the latest deployment"], ["Personal", "Lyzr Labs"], true),
  c("slack", "Slack", "Communication", "Send useful work updates where your team already talks.", "S", 330, ["Post messages to channels", "Read channel names"], ["Post a deployment summary", "Escalate an agent hand-off", "Notify a channel on review"], ["lyzr-team", "design-studio"], true),
  c("supabase", "Supabase", "Data", "Give the project a database, auth and storage with one link.", "Sb", 155, ["Read project schema", "Run read-only queries", "Manage auth settings"], ["Draft tables from the app description", "Wire auth to the generated routes", "Read rows for agent context"], ["orbit-prod", "field-notes-dev"], true),
  c("google-drive", "Google Drive", "Productivity", "Use Drive documents as context for agent work.", "Dr", 45, ["Read files you choose", "Search document titles"], ["Read a brief before planning", "Attach research to a project", "Export a summary as a document"], ["you@workspace.com"]),
  c("gmail", "Gmail", "Communication", "Draft replies and follow-ups from inside an agent workflow.", "Gm", 4, ["Read labelled threads", "Create drafts"], ["Draft a reply for review", "Summarise a long thread", "Label a thread after handling"], ["you@workspace.com"]),
  c("google-calendar", "Google Calendar", "Productivity", "Give agents the schedule so they can propose realistic timing.", "Ca", 215, ["Read events", "Create events you approve"], ["Suggest a release window", "Book a review", "Avoid conflicts"], ["you@workspace.com"]),
  c("notion", "Notion", "Knowledge", "Pull a working brief or team knowledge into an agent.", "N", 30, ["Read selected pages", "Create pages"], ["Use a page as the project brief", "Publish an agent result", "Search team knowledge"], ["Lyzr HQ", "Personal"], true),
  c("linear", "Linear", "Planning", "Turn an agent outcome into a clear next issue.", "L", 250, ["Read issues and cycles", "Create issues"], ["File an issue from a QA finding", "Link a change to an issue", "Summarise the cycle"], ["Lyzr"], true),
  c("jira", "Jira", "Planning", "Keep tickets and project changes in step.", "J", 215, ["Read projects and issues", "Create issues"], ["Create a ticket from a review", "Link commits to tickets"], ["lyzr.atlassian.net"]),
  c("asana", "Asana", "Planning", "Track agent work next to the rest of the team's tasks.", "A", 350, ["Read projects", "Create tasks"], ["Create tasks from a plan", "Update task status"], ["Lyzr Workspace"]),
  c("figma", "Figma", "Design", "Read frames and tokens so generated UI stays on brand.", "F", 15, ["Read files you choose", "Read design tokens"], ["Match tokens to the theme", "Compare a preview to a frame"], ["Lyzr Design"]),
  c("stripe", "Stripe", "Payments", "Add test-mode pricing and checkout to a generated project.", "St", 255, ["Read products and prices", "Create test checkout sessions"], ["Generate a pricing section from products", "Wire a test checkout"], ["Test mode"]),
  c("sentry", "Sentry", "Monitoring", "Bring real errors into review so agents fix what matters.", "Se", 275, ["Read issues", "Read releases"], ["Turn an error into a task", "Check a release for new issues"], ["lyzr-labs"]),
  c("datadog", "Datadog", "Monitoring", "Read service health while preparing a deployment.", "Dd", 275, ["Read monitors", "Read dashboards"], ["Check health before deploy", "Attach a dashboard to a release"], ["lyzr-prod"]),
  c("hubspot", "HubSpot", "CRM & support", "Give sales agents account and contact context.", "Hs", 18, ["Read contacts and companies", "Create notes"], ["Research an account", "Log an outreach note"], ["Lyzr Sales"]),
  c("salesforce", "Salesforce", "CRM & support", "Connect accounts and opportunities to agent workflows.", "Sf", 205, ["Read accounts", "Read opportunities"], ["Summarise an account", "Draft a follow-up"], ["Production org"]),
  c("zendesk", "Zendesk", "CRM & support", "Read incoming tickets and draft answers for review.", "Zd", 165, ["Read tickets", "Create internal notes"], ["Classify an incoming ticket", "Draft a suggested reply"], ["lyzr.zendesk.com"]),
  c("intercom", "Intercom", "CRM & support", "Route conversations between an answer agent and a person.", "Ic", 220, ["Read conversations", "Reply as a teammate"], ["Answer common questions", "Hand off with context"], ["Lyzr"]),
  c("postgres", "Postgres", "Data", "Point an agent at a read-only replica for grounded answers.", "Pg", 210, ["Read-only queries"], ["Answer questions from live tables", "Draft migrations for review"], ["analytics-replica"]),
  c("mongodb", "MongoDB", "Data", "Use collections as context for a backend agent.", "Mg", 140, ["Read collections"], ["Sketch a schema", "Read sample documents"], ["Atlas · cluster0"]),
  c("airtable", "Airtable", "Data", "Treat a base as the source of truth for a workflow.", "At", 190, ["Read bases you choose", "Create records"], ["Read a content calendar", "Log agent output"], ["Content ops"]),
  c("zapier", "Zapier", "Automation", "Trigger workflows from tools without a native connector.", "Z", 20, ["Trigger zaps you choose"], ["Start a workflow from any app", "Send results back out"], ["Lyzr"]),
  c("discord", "Discord", "Communication", "Post build and deploy updates to a community server.", "Di", 235, ["Post to channels you choose"], ["Announce a release", "Share a preview link"], ["Lyzr Community"]),
  c("teams", "Microsoft Teams", "Communication", "Deliver agent summaries where your organisation already works.", "Tm", 250, ["Post to channels", "Read channel names"], ["Post a review summary", "Notify on a failed check"], ["Lyzr Org"]),
  c("cloudflare", "Cloudflare", "Deployment", "Prepare DNS and edge settings alongside a deployment.", "Cf", 25, ["Read zones", "Read Workers"], ["Check DNS before deploy", "Draft edge rules"], ["lyzr.dev"]),
  c("netlify", "Netlify", "Deployment", "A secondary deployment target for static and hybrid sites.", "Nl", 175, ["List sites", "Create deploys"], ["Deploy a static export", "Track deploy status"], ["Personal"]),
  c("gitlab", "GitLab", "Source control", "Use a GitLab group as the source for imported projects.", "GL", 20, ["Read projects", "Create merge requests"], ["Import a repository", "Open a merge request"], ["lyzr-group"]),
  c("aws", "AWS", "Deployment", "Read infrastructure state for backend and deploy agents.", "Aw", 35, ["Read resources", "Read cost summaries"], ["Check what a service depends on", "Estimate hosting cost"], ["prod-account"]),
];

export const connectorCategories = ["All", ...Array.from(new Set(connectors.map((x) => x.category)))];

/* ---------- Demo repositories and teams ---------- */

export const demoRepos = [
  { name: "orbit-workspace", visibility: "private" as const, description: "Editorial landing page for Orbit", updated: "2 days ago", language: "TypeScript" },
  { name: "field-notes", visibility: "public" as const, description: "Portfolio and case studies", updated: "1 week ago", language: "TypeScript" },
  { name: "harbor-support", visibility: "private" as const, description: "Support desk and answer agent", updated: "3 weeks ago", language: "TypeScript" },
  { name: "design-tokens", visibility: "public" as const, description: "Shared colour and type tokens", updated: "1 month ago", language: "CSS" },
];

export const demoTeams = ["Personal", "Lyzr Labs", "Design Studio"];

export const dependencyCatalog = [
  { name: "framer-motion", version: "^12.0.0" }, { name: "lucide-react", version: "^0.460.0" },
  { name: "zod", version: "^3.24.0" }, { name: "swr", version: "^2.3.0" },
  { name: "date-fns", version: "^4.1.0" }, { name: "clsx", version: "^2.1.1" },
  { name: "recharts", version: "^2.15.0" }, { name: "@tanstack/react-query", version: "^5.60.0" },
];

/* ---------- Sample agent workflows (the orchestra) ---------- */

const node = (
  id: string, kind: WorkflowNodeKind, label: string, role: string, description: string,
  tools: string[], instructions: string, input: string, output: string,
): WorkflowNode => ({ id, kind, label, role, description, tools, instructions, sample: { input, output } });

export const workflows: Workflow[] = [
  {
    id: "support-triage",
    name: "Customer support triage",
    summary: "Read a ticket, find the right answer, draft a reply, and escalate only when a person needs to look.",
    category: "Support",
    keywords: ["support", "ticket", "customer", "help", "triage", "refund", "billing", "inbox"],
    sampleInput: "\"My invoice was charged twice this month and I need it fixed today.\"",
    sampleOutput: ["Category: Billing · Urgency: High", "Answer found: Duplicate charge policy (Notion)", "Draft reply written and policy-checked", "Escalated to #support-leads with context"],
    connectors: ["zendesk", "notion", "slack"],
    nodes: [
      node("t", "trigger", "New ticket", "Trigger", "Starts when a ticket arrives in the help desk.", ["zendesk"], "Watch the support queue and pass each new ticket on with its full thread.", "Ticket #4821", "Ticket accepted"),
      node("o", "orchestrator", "Support orchestrator", "Orchestrator", "Decides which specialists to call and in what order.", [], "Split the ticket into classification and knowledge lookup, then hand both to the drafter.", "Ticket #4821", "Plan: classify + find answer, then draft"),
      node("c", "agent", "Intent classifier", "Specialist", "Labels the request and rates urgency.", [], "Return a category, an urgency from low to high, and a one-line reason.", "Duplicate charge on invoice", "Billing · High urgency"),
      node("k", "agent", "Knowledge finder", "Specialist", "Finds the policy or article that answers the request.", ["notion"], "Search the help centre and policy pages. Return the best match and a quote.", "Billing · duplicate charge", "Policy: refund within 3 days"),
      node("d", "agent", "Reply drafter", "Specialist", "Writes a clear response in the team's voice.", [], "Write a short reply that answers first, then explains. No jargon.", "Category + policy", "Draft reply, 96 words"),
      node("r", "review", "Policy checker", "Reviewer", "Checks the draft against policy before anyone sees it.", [], "Reject anything that promises what policy does not allow. Flag high urgency.", "Draft reply", "Approved · flagged high urgency"),
      node("e", "tool", "Escalate in Slack", "Tool", "Posts flagged tickets to the leads channel.", ["slack"], "Post the ticket link, category and draft in #support-leads.", "Flagged ticket", "Posted to #support-leads"),
      node("x", "output", "Approved reply", "Output", "A reviewed draft waiting for a person to send.", [], "Attach the draft to the ticket as an internal note.", "Approved draft", "Draft attached to ticket"),
    ],
    edges: [
      { from: "t", to: "o" }, { from: "o", to: "c", label: "classify" }, { from: "o", to: "k", label: "look up" },
      { from: "c", to: "d" }, { from: "k", to: "d" }, { from: "d", to: "r" },
      { from: "r", to: "e", label: "if urgent" }, { from: "r", to: "x" },
    ],
  },
  {
    id: "research-brief",
    name: "Research brief",
    summary: "Turn a question into a sourced one-page brief, with a second agent checking every claim.",
    category: "Research",
    keywords: ["research", "brief", "market", "competitor", "report", "summary", "analysis", "sources"],
    sampleInput: "\"What are mid-size teams using to manage design handoff in 2026?\"",
    sampleOutput: ["12 sources gathered, 9 kept after verification", "Three patterns identified with evidence", "One-page brief published to Notion"],
    connectors: ["notion", "google-drive"],
    nodes: [
      node("t", "trigger", "Brief request", "Trigger", "Starts from a question typed by a teammate.", [], "Accept a question and any constraints such as audience or length.", "Question", "Request accepted"),
      node("o", "orchestrator", "Research lead", "Orchestrator", "Frames the question and assigns the work.", [], "Break the question into three sub-questions and set the bar for evidence.", "Question", "3 sub-questions set"),
      node("w", "agent", "Web researcher", "Specialist", "Gathers candidate sources for each sub-question.", ["google-drive"], "Collect primary sources first. Record title, date and link.", "Sub-questions", "12 sources gathered"),
      node("v", "agent", "Source verifier", "Specialist", "Discards weak, dated or duplicate sources.", [], "Keep only sources that are recent, named and consistent with each other.", "12 sources", "9 sources kept"),
      node("a", "agent", "Analyst", "Specialist", "Finds patterns and writes the argument.", [], "Write three findings, each with two supporting sources.", "9 sources", "3 findings drafted"),
      node("r", "review", "Editor", "Reviewer", "Checks claims, tone and length.", [], "Cut anything without a source. Keep it under one page.", "Draft brief", "Approved, 412 words"),
      node("p", "tool", "Publish to Notion", "Tool", "Creates the brief page in the team wiki.", ["notion"], "Create a page in the Research space with sources as footnotes.", "Approved brief", "Page created"),
      node("x", "output", "One-page brief", "Output", "A sourced brief ready to share.", [], "Return the page link.", "Page", "Brief ready"),
    ],
    edges: [
      { from: "t", to: "o" }, { from: "o", to: "w", label: "gather" }, { from: "w", to: "v" },
      { from: "v", to: "a" }, { from: "o", to: "a", label: "frame" }, { from: "a", to: "r" },
      { from: "r", to: "p" }, { from: "p", to: "x" },
    ],
  },
  {
    id: "sales-outreach",
    name: "Sales outreach",
    summary: "Research a new lead, write a short message in your voice, and leave a draft for a person to send.",
    category: "Sales",
    keywords: ["sales", "lead", "outreach", "email", "crm", "prospect", "follow", "hubspot"],
    sampleInput: "New lead: Maya Ortiz, Head of Ops at Tidewater Logistics",
    sampleOutput: ["Account summary written from 4 sources", "Message drafted, 78 words", "Brand voice check passed", "Draft saved in Gmail, note logged in HubSpot"],
    connectors: ["hubspot", "gmail"],
    nodes: [
      node("t", "trigger", "New lead", "Trigger", "Starts when a lead is created in the CRM.", ["hubspot"], "Watch for new leads that match the ideal customer profile.", "Lead record", "Lead accepted"),
      node("o", "orchestrator", "Outreach conductor", "Orchestrator", "Sequences research and writing.", [], "Research first, write second, review third. Skip leads without a company.", "Lead record", "Research, then write"),
      node("a", "agent", "Account researcher", "Specialist", "Summarises the company and the person.", ["hubspot"], "Return what they do, a recent change, and one relevant angle.", "Tidewater Logistics", "Account summary, 4 sources"),
      node("m", "agent", "Message writer", "Specialist", "Writes a short, specific first message.", [], "Under 90 words. One idea. One question at the end.", "Summary + angle", "Draft message, 78 words"),
      node("r", "review", "Brand voice reviewer", "Reviewer", "Checks tone against the team's examples.", [], "Reject anything pushy or generic. Suggest one edit at most.", "Draft message", "Passed"),
      node("g", "tool", "Save Gmail draft", "Tool", "Puts the message in the rep's drafts.", ["gmail"], "Create a draft. Never send.", "Approved message", "Draft saved"),
      node("h", "tool", "Log in HubSpot", "Tool", "Adds a note to the lead.", ["hubspot"], "Attach the account summary as a note.", "Account summary", "Note logged"),
      node("x", "output", "Draft ready", "Output", "A message waiting for a person to send.", [], "Notify the rep with a link.", "Draft", "Rep notified"),
    ],
    edges: [
      { from: "t", to: "o" }, { from: "o", to: "a" }, { from: "a", to: "m" }, { from: "m", to: "r" },
      { from: "r", to: "g" }, { from: "a", to: "h", label: "note" }, { from: "g", to: "x" }, { from: "h", to: "x" },
    ],
  },
  {
    id: "release-captain",
    name: "Release captain",
    summary: "When a pull request merges, summarise the change, look for test gaps, and write the release note.",
    category: "Engineering",
    keywords: ["release", "pull request", "pr", "merge", "engineering", "code", "deploy", "changelog", "github"],
    sampleInput: "PR #218 merged: \"Add usage-based pricing page\"",
    sampleOutput: ["Change summarised across 14 files", "2 test gaps found in billing helpers", "Risk rated medium", "Release note posted to #releases"],
    connectors: ["github", "vercel", "slack"],
    nodes: [
      node("t", "trigger", "PR merged", "Trigger", "Starts when a pull request merges into main.", ["github"], "Pass the diff, title and author to the orchestrator.", "PR #218", "Diff received"),
      node("o", "orchestrator", "Release captain", "Orchestrator", "Runs the three checks in parallel.", [], "Send the diff to the summariser and the test reviewer at the same time.", "Diff", "2 tasks dispatched"),
      node("s", "agent", "Change summariser", "Specialist", "Explains what changed and why.", ["github"], "Group changes by user-visible effect. Skip formatting-only edits.", "Diff, 14 files", "Summary, 5 bullets"),
      node("g", "agent", "Test gap finder", "Specialist", "Looks for untested paths in the change.", ["github"], "List changed functions with no test. Rank by risk.", "Diff, 14 files", "2 gaps in billing helpers"),
      node("n", "agent", "Release note writer", "Specialist", "Writes the note for customers.", [], "Plain language. Lead with the benefit. No internal names.", "Summary", "Release note, 60 words"),
      node("r", "review", "Risk reviewer", "Reviewer", "Rates the risk of the release.", [], "Rate low, medium or high. Explain in one sentence.", "Note + gaps", "Medium · billing gaps"),
      node("v", "tool", "Vercel preview", "Tool", "Links the preview deployment.", ["vercel"], "Attach the preview URL for the merged commit.", "Commit", "Preview linked"),
      node("x", "output", "Post to #releases", "Output", "Publishes the note with risk and preview link.", ["slack"], "Post the note, risk rating and preview link.", "Note + risk", "Posted to #releases"),
    ],
    edges: [
      { from: "t", to: "o" }, { from: "o", to: "s" }, { from: "o", to: "g" }, { from: "s", to: "n" },
      { from: "n", to: "r" }, { from: "g", to: "r" }, { from: "r", to: "v" }, { from: "v", to: "x" },
    ],
  },
];

export function matchWorkflow(text: string): Workflow {
  const words = text.toLowerCase();
  let best = workflows[0];
  let score = -1;
  for (const flow of workflows) {
    const s = flow.keywords.reduce((sum, k) => sum + (words.includes(k) ? 1 : 0), 0);
    if (s > score) { score = s; best = flow; }
  }
  return best;
}

export const workflowPrompts = [
  "Triage incoming support tickets and draft replies",
  "Research a market question and publish a sourced brief",
  "Follow up with new sales leads in my voice",
  "Summarise every merged pull request into release notes",
];
