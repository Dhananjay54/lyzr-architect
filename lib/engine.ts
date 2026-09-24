import { dependencyCatalog } from "./catalog";
import type {
  Accent, ChangeSet, EnvVar, Framework, Project, ProjectConfig, ProjectFile, ProjectKind,
  Section, SectionItem, SectionType, Site, Styling,
} from "./types";
import { hash, slugify, titleCase, uid } from "./utils";

/* =====================================================================
   Kind content
   ===================================================================== */

type KindContent = {
  noun: string;
  eyebrow: string;
  title: string;
  decisive: string;
  body: string;
  cta: string;
  navLinks: string[];
  features: SectionItem[];
  showcase: { eyebrow: string; title: string; body: string; items: SectionItem[] };
  stats: SectionItem[];
  logos: string[];
  testimonials: SectionItem[];
  faq: SectionItem[];
  brands: string[];
  accent: Accent;
};

const K: Record<ProjectKind, KindContent> = {
  saas: {
    noun: "Analytics dashboard",
    eyebrow: "Team analytics",
    title: "See the work that matters.",
    decisive: "Clarity, on tap.",
    body: "One quiet dashboard for the numbers your team actually reads each week.",
    cta: "Open the dashboard",
    navLinks: ["Product", "Metrics", "Changelog"],
    features: [
      { title: "Weekly overview", body: "The five numbers that moved, in one glance." },
      { title: "Shared views", body: "Save a view and send it to the whole team." },
      { title: "Quiet alerts", body: "Only hear about changes worth acting on." },
    ],
    showcase: { eyebrow: "Overview", title: "This week at a glance", body: "Signups, activation and retention, side by side.", items: [{ title: "Signups", meta: "1,284", body: "+12%" }, { title: "Activation", meta: "63%", body: "+4%" }, { title: "Retention", meta: "88%", body: "+1%" }, { title: "Support", meta: "41", body: "-9%" }] },
    stats: [{ title: "4x", body: "faster weekly reviews" }, { title: "12 min", body: "to a shared view" }, { title: "98%", body: "of teams keep it" }],
    logos: ["Northwind", "Tidewater", "Alder & Co", "Fable", "Kestrel"],
    testimonials: [
      { title: "We stopped arguing about which number was right.", body: "Priya N. · Head of Growth" },
      { title: "The Monday review went from an hour to fifteen minutes.", body: "Marcus L. · Operations" },
      { title: "It shows less, and that is exactly why it works.", body: "Aiko T. · Product" },
    ],
    faq: [
      { title: "Where does the data come from?", body: "Connect a database or upload a CSV. Nothing is copied without your say." },
      { title: "Can I share a view outside the team?", body: "Yes. Shared views can be read-only and expire on a date you choose." },
      { title: "How are alerts decided?", body: "You set the threshold. We only notify when a metric crosses it." },
      { title: "Is there an export?", body: "Every chart exports to CSV and PNG." },
    ],
    brands: ["Lumen", "Tally", "Meridian", "Plinth"],
    accent: "terracotta",
  },
  marketplace: {
    noun: "Marketplace",
    eyebrow: "Independent makers",
    title: "Find makers worth backing.",
    decisive: "Made by hand. Bought direct.",
    body: "A small marketplace where every listing has a maker, a story and a fair price.",
    cta: "Browse the listings",
    navLinks: ["Shop", "Makers", "Journal"],
    features: [
      { title: "Maker profiles", body: "Every seller tells their story in their own words." },
      { title: "Fair pricing", body: "Clear prices, clear fees, no hidden costs." },
      { title: "Simple checkout", body: "Three steps from listing to order confirmation." },
    ],
    showcase: { eyebrow: "Featured", title: "New this week", body: "Small batches from makers you can follow.", items: [{ title: "Speckled mug", meta: "$34", body: "Ash & Clay" }, { title: "Tall bud vase", meta: "$48", body: "Studio Wren" }, { title: "Serving bowl", meta: "$62", body: "Ash & Clay" }, { title: "Tea set", meta: "$96", body: "Kiln House" }] },
    stats: [{ title: "320", body: "independent makers" }, { title: "4.9", body: "average order rating" }, { title: "2 days", body: "median dispatch time" }],
    logos: ["Ash & Clay", "Studio Wren", "Kiln House", "Fold", "Moss"],
    testimonials: [
      { title: "My first sale came in an hour. Someone actually read my story.", body: "Wren O. · Ceramicist" },
      { title: "It feels like a craft fair without the queue.", body: "Diego M. · Buyer" },
      { title: "Fees I can explain to my accountant in one line.", body: "Lena K. · Seller" },
    ],
    faq: [
      { title: "How do sellers get paid?", body: "Payouts arrive two days after delivery is confirmed." },
      { title: "What does it cost to sell?", body: "A flat 6% per sale. No listing fees." },
      { title: "Can I return an item?", body: "Each maker sets a return window of at least 14 days." },
      { title: "Do you ship abroad?", body: "Makers choose the regions they ship to." },
    ],
    brands: ["Kiln", "Fable", "Marrow", "Hearth"],
    accent: "forest",
  },
  portfolio: {
    noun: "Portfolio",
    eyebrow: "Product designer",
    title: "Selected work, made with care.",
    decisive: "Design that holds up.",
    body: "Six years of product design across health, logistics and finance. Available from June.",
    cta: "See the work",
    navLinks: ["Work", "About", "Contact"],
    features: [
      { title: "Research to release", body: "I work from the first interview through the shipped build." },
      { title: "Systems thinking", body: "Components and rules that teams keep using." },
      { title: "Clear writing", body: "Case studies that explain decisions, not just outcomes." },
    ],
    showcase: { eyebrow: "Case studies", title: "Recent projects", body: "Four projects, each with the problem, the decision and the result.", items: [{ title: "Clinic booking", meta: "2025", body: "Cut missed appointments by a third." }, { title: "Freight tracking", meta: "2024", body: "One screen for every shipment." }, { title: "Ledger redesign", meta: "2024", body: "Month-end close in two days." }, { title: "Design tokens", meta: "2023", body: "A shared language for six teams." }] },
    stats: [{ title: "6 yrs", body: "in product design" }, { title: "14", body: "shipped projects" }, { title: "3", body: "design systems built" }],
    logos: ["Clinic", "Freightly", "Ledger", "Northbeam", "Tally"],
    testimonials: [
      { title: "The rare designer who writes as well as they draw.", body: "S. Rahman · Engineering lead" },
      { title: "They asked the question nobody else had.", body: "J. Cole · Founder" },
      { title: "Our handoffs finally stopped being painful.", body: "M. Ito · Product manager" },
    ],
    faq: [
      { title: "Are you taking new work?", body: "From June, for projects of eight weeks or more." },
      { title: "Do you work with early teams?", body: "Yes. Most of my best work started with a team of three." },
      { title: "What do you need to start?", body: "A short brief and access to the people who use the product." },
      { title: "Where are you based?", body: "Lisbon, working across European time zones." },
    ],
    brands: ["Field Notes", "Marlow", "Juniper", "Quill"],
    accent: "violet",
  },
  support: {
    noun: "Support site",
    eyebrow: "Help centre",
    title: "Answers before the ticket lands.",
    decisive: "Ask. Get an answer.",
    body: "An answer agent that reads your docs, replies in seconds, and hands off to a person with the full context.",
    cta: "Ask a question",
    navLinks: ["Articles", "Status", "Contact"],
    features: [
      { title: "Answers from your docs", body: "Every reply cites the article it came from." },
      { title: "Clean hand-off", body: "A person sees the whole conversation, not a summary." },
      { title: "Gaps you can fix", body: "See the questions that had no good article." },
    ],
    showcase: { eyebrow: "Live conversation", title: "How it reads", body: "A customer asks. The agent answers. A person steps in when needed.", items: [{ title: "How do I change my billing email?", meta: "customer" }, { title: "Go to Settings, then Billing, then Contact. Changes apply to the next invoice.", meta: "agent" }, { title: "Can I get last month's invoice sent there?", meta: "customer" }, { title: "I have asked Sam from billing to send it. You will hear back within the hour.", meta: "agent" }] },
    stats: [{ title: "72%", body: "resolved without a person" }, { title: "9 sec", body: "median first reply" }, { title: "4.8", body: "satisfaction score" }],
    logos: ["Tidewater", "Northwind", "Alder & Co", "Fable", "Kestrel"],
    testimonials: [
      { title: "Our queue dropped by half and the hard tickets got more attention.", body: "Rosa V. · Support lead" },
      { title: "Hand-offs finally carry context.", body: "Ben A. · Agent" },
      { title: "I can see where the docs fall short.", body: "Nadia F. · Content" },
    ],
    faq: [
      { title: "Can it reply in other languages?", body: "It replies in the language the customer writes in." },
      { title: "What if it does not know?", body: "It says so, and hands off to a person with the thread attached." },
      { title: "Where does it learn from?", body: "Your published articles and any documents you connect." },
      { title: "Can we review replies first?", body: "Yes. Turn on review mode and approve replies before they send." },
    ],
    brands: ["Harbor", "Beacon", "Anchor", "Compass"],
    accent: "ocean",
  },
  landing: {
    noun: "Launch page",
    eyebrow: "A new way to make progress",
    title: "Less noise. More momentum.",
    decisive: "Focus is the feature.",
    body: "A calm workspace that gives small teams a clearer route from the important idea to the work that makes it real.",
    cta: "Meet your momentum",
    navLinks: ["Product", "Journal", "About"],
    features: [
      { title: "One place to think", body: "Capture a thought while it has shape." },
      { title: "A little more signal", body: "Find the next move without the scramble." },
      { title: "Work that holds", body: "Give the important work room to last." },
    ],
    showcase: { eyebrow: "Inside", title: "A week in the workspace", body: "Plans, notes and decisions, kept in one thread.", items: [{ title: "Monday plan", meta: "Draft", body: "Three outcomes for the week." }, { title: "Design review", meta: "Wed", body: "Notes and decisions." }, { title: "Launch checklist", meta: "Fri", body: "Six items left." }, { title: "Retro", meta: "Fri", body: "What to keep." }] },
    stats: [{ title: "3x", body: "clearer weekly plans" }, { title: "5 min", body: "to set up a team" }, { title: "92%", body: "still active after 90 days" }],
    logos: ["Northwind", "Tidewater", "Alder & Co", "Fable", "Kestrel"],
    testimonials: [
      { title: "It made our Mondays feel intentional.", body: "Anya P. · Founder" },
      { title: "We use half the tools we used to.", body: "Tom R. · Operations" },
      { title: "The first productivity tool that did not add noise.", body: "Ines G. · Design" },
    ],
    faq: [
      { title: "Who is it for?", body: "Teams of two to twenty who want fewer, better tools." },
      { title: "Can we import our notes?", body: "Yes. Bring Markdown, Notion exports or a folder of documents." },
      { title: "Is there a free plan?", body: "Yes, for teams of up to five." },
      { title: "How does billing work?", body: "Per member, monthly, cancel any time." },
    ],
    brands: ["Orbit", "Atlas", "Ember", "Solace"],
    accent: "terracotta",
  },
};

export const kindNoun = (kind: ProjectKind) => K[kind].noun;

/* =====================================================================
   Site construction
   ===================================================================== */

const ORDER: SectionType[] = ["nav", "hero", "logos", "features", "showcase", "stats", "pricing", "testimonials", "faq", "cta", "footer"];

export const sectionLabel: Record<SectionType, string> = {
  nav: "Navigation", hero: "Hero", logos: "Customer logos", features: "Features", stats: "Stats",
  showcase: "Showcase", pricing: "Pricing", testimonials: "Testimonials", faq: "FAQ", cta: "Call to action", footer: "Footer",
};

export function makeSection(type: SectionType, kind: ProjectKind, brand: string): Section {
  const k = K[kind];
  switch (type) {
    case "nav": return { id: "nav", type, items: k.navLinks.map((title) => ({ title })), cta: "Get started" };
    case "hero": return { id: "hero", type, eyebrow: k.eyebrow, title: k.title, body: k.body, cta: k.cta };
    case "logos": return { id: "logos", type, title: "Trusted by teams who like fewer tools", items: k.logos.map((title) => ({ title })) };
    case "features": return { id: "features", type, title: "What you get", items: k.features };
    case "showcase": return { id: "showcase", type, eyebrow: k.showcase.eyebrow, title: k.showcase.title, body: k.showcase.body, items: k.showcase.items };
    case "stats": return { id: "stats", type, items: k.stats };
    case "pricing": return { id: "pricing", type, eyebrow: "Pricing", title: "Simple, fair pricing", body: `Start free. Pay when ${brand} becomes part of how your team works.`, items: [
      { title: "Starter", meta: "$0", body: "For a first project. Up to 3 people." },
      { title: "Team", meta: "$24", body: "Per member each month. Shared views, history and support." },
      { title: "Scale", meta: "Custom", body: "For larger groups with review, audit and a named contact." },
    ] };
    case "testimonials": return { id: "testimonials", type, eyebrow: "In their words", title: "What people say", items: k.testimonials };
    case "faq": return { id: "faq", type, eyebrow: "Questions", title: "Before you ask", items: k.faq };
    case "cta": return { id: "cta", type, title: `Try ${brand} this week.`, body: "Set it up in five minutes. Keep it only if it earns its place.", cta: "Start free" };
    case "footer": return { id: "footer", type, body: `© ${new Date().getFullYear()} ${brand}. A simulated project made with Lyzr Architect.`, items: [{ title: "Privacy" }, { title: "Terms" }, { title: "Contact" }] };
  }
}

export function siteFor(kind: ProjectKind, brand: string, accent?: Accent, theme: "light" | "dark" = "light"): Site {
  const types: SectionType[] = kind === "portfolio"
    ? ["nav", "hero", "showcase", "features", "cta", "footer"]
    : ["nav", "hero", "logos", "features", "showcase", "cta", "footer"];
  return {
    brand, kind, theme, accent: accent ?? K[kind].accent, mobileNav: false, density: "comfortable",
    sections: types.map((t) => makeSection(t, kind, brand)),
  };
}

export function inferKind(prompt: string): ProjectKind {
  const p = prompt.toLowerCase();
  if (/(market|listing|seller|shop|store|buy|makers)/.test(p)) return "marketplace";
  if (/(portfolio|case stud|photograph|freelanc|designer)/.test(p)) return "portfolio";
  if (/(support|help cent|ticket|answer agent|customer service)/.test(p)) return "support";
  if (/(dashboard|analytics|metrics|admin|internal|report)/.test(p)) return "saas";
  return "landing";
}

export function brandFrom(prompt: string, kind: ProjectKind): string {
  const named = prompt.match(/(?:called|named|name it|call it)\s+["“']?([A-Z][\w&-]*(?:\s[A-Z][\w&-]*)?)/);
  if (named) return named[1].trim();
  const bank = K[kind].brands;
  return bank[parseInt(hash(prompt, 4), 16) % bank.length];
}

export function accentFrom(text: string): Accent | null {
  const t = text.toLowerCase();
  if (/(blue|ocean|teal|navy)/.test(t)) return "ocean";
  if (/(green|forest|emerald|sage)/.test(t)) return "forest";
  if (/(purple|violet|indigo|lilac)/.test(t)) return "violet";
  if (/(terracotta|warm|orange|red|coral)/.test(t)) return "terracotta";
  return null;
}

/* =====================================================================
   Chat interpretation. Deterministic: every reply maps to a real change.
   ===================================================================== */

export type Interpretation = {
  title: string;
  reply: string;
  site: Site | null;
  kind: "change" | "noop" | "fallback";
};

const SECTION_WORDS: [SectionType, RegExp][] = [
  ["pricing", /(pricing|price|plans?)\b/],
  ["testimonials", /(testimonial|review|quote|social proof)/],
  ["faq", /(faq|questions)/],
  ["stats", /(stats?|metrics?|numbers)\b/],
  ["logos", /(logos?|customers|trusted)/],
  ["cta", /(cta|call to action|sign ?up)/],
  ["showcase", /(showcase|gallery|listings|case stud|demo)/],
  ["features", /(features?)\b/],
  ["footer", /(footer)/],
];

function insertSection(site: Site, section: Section): Site {
  const rank = (t: SectionType) => ORDER.indexOf(t);
  const sections = [...site.sections];
  const at = sections.findIndex((s) => rank(s.type) > rank(section.type));
  if (at === -1) sections.push(section); else sections.splice(at, 0, section);
  return { ...site, sections };
}

export const heroDecisive = (site: Site) => site.sections.find((s) => s.type === "hero")?.title === K[site.kind].decisive;

export function interpret(text: string, site: Site, tick = 0): Interpretation {
  const t = text.toLowerCase();
  let next: Site = site;
  const done: string[] = [];
  const notes: string[] = [];

  const adds = /(add|include|create|insert|need|want|put)/.test(t);
  const removes = /(remove|delete|drop|get rid|take out)/.test(t);

  for (const [type, re] of SECTION_WORDS) {
    if (!re.test(t)) continue;
    const exists = next.sections.some((s) => s.type === type);
    if (removes && exists && type !== "hero" && type !== "nav") {
      next = { ...next, sections: next.sections.filter((s) => s.type !== type) };
      done.push(`removed the ${sectionLabel[type].toLowerCase()} section`);
    } else if (adds || !exists) {
      if (exists) notes.push(`${sectionLabel[type]} is already on the page`);
      else if (!removes) { next = insertSection(next, makeSection(type, next.kind, next.brand)); done.push(`added a ${sectionLabel[type].toLowerCase()} section`); }
    }
  }

  if (/dark/.test(t) && !/(not|no) dark/.test(t)) {
    if (next.theme === "dark") notes.push("The page is already dark");
    else { next = { ...next, theme: "dark" }; done.push("switched the page to a dark theme"); }
  } else if (/(light theme|light mode|lighter|brighter|cream)/.test(t)) {
    if (next.theme === "light") notes.push("The page is already light");
    else { next = { ...next, theme: "light" }; done.push("switched the page to a light theme"); }
  }

  const accent = /(color|colour|accent|use|make|switch|change)/.test(t) ? accentFrom(t) : null;
  if (accent && accent !== next.accent) { next = { ...next, accent }; done.push(`changed the accent to ${accent}`); }

  if (/(mobile nav|hamburger|menu|navigation on mobile|nav on mobile)/.test(t)) {
    if (next.mobileNav) notes.push("Mobile navigation is already in place");
    else { next = { ...next, mobileNav: true }; done.push("added a mobile navigation menu"); }
  }

  if (/(decisive|bolder|sharper|headline|first screen|hero|punchier|shorter title)/.test(t) && !/(remove|delete)/.test(t)) {
    if (heroDecisive(next)) notes.push("The headline is already the short version");
    else {
      next = { ...next, sections: next.sections.map((s) => (s.type === "hero" ? { ...s, title: K[next.kind].decisive } : s)) };
      done.push("sharpened the headline");
    }
  }

  if (/(tight|compact|denser|less space|spacing)/.test(t)) {
    if (next.density === "tight") notes.push("Spacing is already tight");
    else { next = { ...next, density: "tight" }; done.push("tightened the vertical spacing"); }
  } else if (/(airy|breathing|spacious|more space|room)/.test(t)) {
    if (next.density === "comfortable") notes.push("Spacing is already comfortable");
    else { next = { ...next, density: "comfortable" }; done.push("opened up the vertical spacing"); }
  }

  const rename = text.match(/(?:rename (?:it|this|the project)? ?to|call it|name it)\s+["“']?([A-Z][\w&-]*(?:\s[A-Z][\w&-]*)?)/i);
  if (rename && rename[1] !== next.brand) {
    const brand = rename[1].trim();
    next = { ...next, brand, sections: next.sections.map((s) => (s.type === "cta" ? { ...s, title: `Try ${brand} this week.` } : s)) };
    done.push(`renamed the brand to ${brand}`);
  }

  if (done.length) {
    const title = done[0][0].toUpperCase() + done[0].slice(1) + (done.length > 1 ? ` (+${done.length - 1})` : "");
    const list = done.length === 1 ? done[0] : done.slice(0, -1).join(", ") + " and " + done[done.length - 1];
    return { title, kind: "change", site: next, reply: `Done. I ${list}. ${notes.length ? notes.join(". ") + ". " : ""}The preview is updated, and the affected files are in Changes.` };
  }
  if (notes.length) {
    return { title: "No change needed", kind: "noop", site, reply: `${notes.join(". ")}, so I left it alone. Tell me what you would like different and I will change it.` };
  }

  const polish = [
    "Built for the people who do the work.",
    "Everything you need. Nothing you do not.",
    "Made to be understood in one read.",
  ];
  const line = polish[tick % polish.length];
  const hero = next.sections.find((s) => s.type === "hero");
  const changed = hero && hero.body !== `${K[next.kind].body} ${line}`;
  if (changed) {
    next = { ...next, sections: next.sections.map((s) => (s.type === "hero" ? { ...s, body: `${K[next.kind].body} ${line}` } : s)) };
  }
  return {
    title: "Refined the hero copy",
    kind: "fallback",
    site: next,
    reply: `I could not tie that to a specific structural change, so I refined the hero copy and left the layout alone. For something more precise, try one of the suggestions below.`,
  };
}

export function suggestionsFor(site: Site): string[] {
  const has = (t: SectionType) => site.sections.some((s) => s.type === t);
  const out: string[] = [];
  if (!has("pricing")) out.push("Add a pricing section");
  if (!has("testimonials")) out.push("Add testimonials");
  if (!has("faq")) out.push("Add an FAQ");
  if (site.theme === "light") out.push("Use a darker theme");
  else out.push("Go back to a light theme");
  if (!site.mobileNav) out.push("Create a mobile navigation");
  if (!heroDecisive(site)) out.push("Make the first screen more decisive");
  if (site.density === "comfortable") out.push("Tighten the spacing");
  if (!has("stats")) out.push("Add a stats row");
  return out.slice(0, 4);
}

/* =====================================================================
   File generation
   ===================================================================== */

const ACCENT_HEX: Record<Accent, [string, string]> = {
  terracotta: ["#bd4c3f", "#f38676"], ocean: ["#2f6fb0", "#7fb2e8"], forest: ["#3f7650", "#86c49a"], violet: ["#6f4fc0", "#b39cf0"],
};
export const accentHex = ACCENT_HEX;

const pascal = (s: string) => s.replace(/(^|[-_ ])(\w)/g, (_, __, c) => c.toUpperCase());
const json = (v: unknown, indent = 2) => JSON.stringify(v, null, 2).replace(/^(\s*)"(\w+)":/gm, "$1$2:").split("\n").map((l, i) => (i ? " ".repeat(indent) + l : l)).join("\n");

function componentFor(s: Section, site: Site): string {
  const name = pascal(s.type);
  const items = s.items ? `const items = ${json(s.items)};\n\n` : "";
  const head = (eyebrow?: string, title?: string, body?: string) => [
    eyebrow ? `        <p className="eyebrow">${eyebrow}</p>` : "",
    title ? `        <h2>${title}</h2>` : "",
    body ? `        <p className="lead">${body}</p>` : "",
  ].filter(Boolean).join("\n");

  switch (s.type) {
    case "nav":
      return `${items}export function Nav() {\n  return (\n    <header className="nav">\n      <a className="brand" href="/">${site.brand}</a>\n      <nav aria-label="Primary">\n        {items.map((item) => (\n          <a key={item.title} href={"#" + item.title.toLowerCase()}>{item.title}</a>\n        ))}\n      </nav>\n      ${site.mobileNav ? '<button className="menu" aria-label="Open menu">Menu</button>\n      ' : ""}<a className="button" href="#start">${s.cta}</a>\n    </header>\n  );\n}\n`;
    case "hero":
      return `export function Hero() {\n  return (\n    <section className="hero">\n      <p className="eyebrow">${s.eyebrow}</p>\n      <h1>${s.title}</h1>\n      <p className="lead">${s.body}</p>\n      <a className="button" href="#start">${s.cta}</a>\n    </section>\n  );\n}\n`;
    case "logos":
      return `${items}export function Logos() {\n  return (\n    <section className="logos">\n      <p>${s.title}</p>\n      <ul>{items.map((i) => <li key={i.title}>{i.title}</li>)}</ul>\n    </section>\n  );\n}\n`;
    case "stats":
      return `${items}export function Stats() {\n  return (\n    <section className="stats">\n      {items.map((i) => (\n        <div key={i.title}><strong>{i.title}</strong><span>{i.body}</span></div>\n      ))}\n    </section>\n  );\n}\n`;
    case "cta":
      return `export function Cta() {\n  return (\n    <section className="cta" id="start">\n      <h2>${s.title}</h2>\n      <p className="lead">${s.body}</p>\n      <a className="button" href="/signup">${s.cta}</a>\n    </section>\n  );\n}\n`;
    case "footer":
      return `${items}export function Footer() {\n  return (\n    <footer className="footer">\n      <p>${s.body}</p>\n      <nav>{items.map((i) => <a key={i.title} href="#">{i.title}</a>)}</nav>\n    </footer>\n  );\n}\n`;
    default:
      return `${items}export function ${name}() {\n  return (\n    <section className="section" id="${s.type}">\n${head(s.eyebrow, s.title, s.body)}\n      <div className="grid">\n        {items.map((item) => (\n          <article key={item.title}>\n            <h3>{item.title}</h3>\n            {item.meta && <strong>{item.meta}</strong>}\n            {item.body && <p>{item.body}</p>}\n          </article>\n        ))}\n      </div>\n    </section>\n  );\n}\n`;
  }
}

export function buildPackageJson(name: string, config: ProjectConfig, framework: Framework) {
  const runtime = config.dependencies.filter((d) => d.kind === "runtime").sort((a, b) => a.name.localeCompare(b.name));
  const dev = config.dependencies.filter((d) => d.kind === "dev").sort((a, b) => a.name.localeCompare(b.name));
  const obj: Record<string, unknown> = {
    name: slugify(name), version: "0.1.0", private: true,
    scripts: framework === "Next.js" ? { dev: "next dev", build: "next build", start: "next start", lint: "eslint ." } : { dev: "vite", build: "vite build", preview: "vite preview" },
    dependencies: Object.fromEntries(runtime.map((d) => [d.name, d.version])),
    devDependencies: Object.fromEntries(dev.map((d) => [d.name, d.version])),
  };
  return JSON.stringify(obj, null, 2) + "\n";
}

export function buildFiles(site: Site, meta: { name: string; framework: Framework; styling: Styling; config: ProjectConfig }): { path: string; content: string }[] {
  const [light, dark] = ACCENT_HEX[site.accent];
  const dk = site.theme === "dark";
  const imports = site.sections.map((s) => `import { ${pascal(s.type)} } from "@/components/${s.type}";`).join("\n");
  const body = site.sections.map((s) => `      <${pascal(s.type)} />`).join("\n");
  const twLine = meta.styling === "Tailwind CSS" ? '@import "tailwindcss";\n\n' : meta.styling === "CSS Modules" ? "/* Global tokens. Component styles live in *.module.css */\n\n" : "";
  const gap = site.density === "tight" ? "56px" : "104px";

  return [
    { path: "app/layout.tsx", content: `import type { Metadata } from "next";\nimport "./globals.css";\n\nexport const metadata: Metadata = {\n  title: "${site.brand}",\n  description: "${K[site.kind].body.replace(/"/g, "'")}",\n};\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}\n` },
    { path: "app/globals.css", content: `${twLine}:root {\n  --canvas: ${dk ? "#160f0a" : "#fafaf9"};\n  --ink: ${dk ? "#fafaf9" : "#160f0a"};\n  --muted: ${dk ? "#a38977" : "#6e594a"};\n  --line: ${dk ? "#514136" : "#d4c0b2"};\n  --accent: ${dk ? dark : light};\n  --section-gap: ${gap};\n}\n\nbody {\n  margin: 0;\n  background: var(--canvas);\n  color: var(--ink);\n  font-family: Manrope, system-ui, sans-serif;\n}\n\n.section, .hero, .cta { padding: var(--section-gap) 24px; }\n.button { background: var(--accent); color: var(--canvas); padding: 12px 18px; border-radius: 10px; }\n` },
    { path: "app/page.tsx", content: `${imports}\n\nexport default function Page() {\n  return (\n    <main>\n${body}\n    </main>\n  );\n}\n` },
    ...site.sections.map((s) => ({ path: `components/${s.type}.tsx`, content: componentFor(s, site) })),
    { path: "package.json", content: buildPackageJson(meta.name, meta.config, meta.framework) },
    { path: "README.md", content: `# ${site.brand}\n\nGenerated by Lyzr Architect as a local demo project.\n\n## Develop\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n` },
  ];
}

/** Merge regenerated files into the project, preserving pending local edits. */
export function mergeGenerated(existing: ProjectFile[], generated: { path: string; content: string }[]): ProjectFile[] {
  const byPath = new Map(existing.map((f) => [f.path, f]));
  const out: ProjectFile[] = [];
  const derived = (p: string) => p === "app/layout.tsx" || p === "app/globals.css" || p === "app/page.tsx" || /^components\/(nav|hero|logos|features|stats|showcase|pricing|testimonials|faq|cta|footer)\.tsx$/.test(p);

  for (const g of generated) {
    const prev = byPath.get(g.path);
    if (!prev) { out.push({ path: g.path, content: g.content, base: g.content, committed: null, changed: true }); continue; }
    const pending = prev.content !== prev.base;
    if (prev.content === g.content) { out.push(prev); continue; }
    out.push(pending
      ? { ...prev, base: g.content, changed: true }
      : { ...prev, content: g.content, base: g.content, changed: true });
  }
  const gen = new Set(generated.map((g) => g.path));
  for (const f of existing) {
    if (gen.has(f.path)) continue;
    if (derived(f.path) && f.content === f.base) continue; // removed section
    out.push(f);
  }
  // keep original ordering as much as possible
  const order = new Map(existing.map((f, i) => [f.path, i]));
  return out.sort((a, b) => (order.get(a.path) ?? 999) - (order.get(b.path) ?? 999));
}

export function defaultConfig(framework: Framework, styling: Styling): ProjectConfig {
  const dep = (name: string, version: string, kind: "runtime" | "dev" = "runtime") => ({ id: uid("dep"), name, version, kind });
  const deps = framework === "Next.js"
    ? [dep("next", "^16.0.0"), dep("react", "^19.0.0"), dep("react-dom", "^19.0.0"), dep("typescript", "^5.7.0", "dev"), dep("@types/react", "^19.0.0", "dev")]
    : [dep("react", "^19.0.0"), dep("react-dom", "^19.0.0"), dep("vite", "^6.0.0", "dev"), dep("typescript", "^5.7.0", "dev")];
  if (styling === "Tailwind CSS") deps.push(dep("tailwindcss", "^4.0.0", "dev"));
  if (styling === "styled-components") deps.push(dep("styled-components", "^6.1.0"));
  const env: EnvVar[] = [
    { id: uid("env"), key: "NEXT_PUBLIC_SITE_URL", value: "http://localhost:3000", scope: "all", secret: false },
    { id: uid("env"), key: "DATABASE_URL", value: "postgres://demo:demo@localhost:5432/app", scope: "production", secret: true },
  ];
  return {
    frameworkVersion: framework === "Next.js" ? "16.x" : framework === "React" ? "19.x" : "1.x",
    styling, buildTarget: framework === "Next.js" ? "Vercel" : "Static export", dependencies: deps, environmentVariables: env,
  };
}

export function suggestedDependencies(config: ProjectConfig) {
  const have = new Set(config.dependencies.map((d) => d.name));
  return dependencyCatalog.filter((d) => !have.has(d.name));
}

/* =====================================================================
   Building a project from a prompt / template / import
   ===================================================================== */

const now = () => new Date().toISOString();

export function baseProject(p: Partial<Project> & Pick<Project, "name" | "site">): Project {
  const framework = p.framework ?? "Next.js";
  const styling = p.styling ?? "Tailwind CSS";
  const configuration = p.configuration ?? defaultConfig(framework, styling);
  const files = p.files ?? buildFiles(p.site, { name: p.name, framework, styling, config: configuration }).map((f) => ({ path: f.path, content: f.content, base: f.content, committed: null }));
  return {
    id: p.id ?? uid("p"),
    name: p.name,
    description: p.description ?? K[p.site.kind].body,
    prompt: p.prompt,
    framework, styling,
    kind: p.site.kind,
    origin: p.origin ?? "prompt",
    importedFrom: p.importedFrom,
    status: p.status ?? "ready",
    createdAt: p.createdAt ?? now(),
    updatedAt: p.updatedAt ?? now(),
    messages: p.messages ?? [],
    files,
    site: p.site,
    agentRuns: p.agentRuns ?? [],
    workspaceMode: p.workspaceMode ?? "build",
    configuration,
    changeSets: p.changeSets ?? [],
    github: p.github,
    vercel: p.vercel,
    deployments: p.deployments ?? [],
    previewChecked: p.previewChecked,
    generation: p.generation,
    history: p.history ?? { past: [], future: [] },
    timeline: p.timeline ?? readyTimeline("Preview ready"),
  };
}

export function readyTimeline(note: string): Project["timeline"] {
  return [
    { label: "Planning", note: "Intent captured", state: "done" },
    { label: "Building UI", note: "Sections and components", state: "done" },
    { label: "Reviewing", note: "Checked for clarity", state: "done" },
    { label: "Ready to preview", note, state: "active" },
  ];
}

export const generationStages = [
  { label: "Planning", note: "Reading the brief and choosing structure", ms: 1300 },
  { label: "Building UI", note: "Writing sections and components", ms: 2000 },
  { label: "Reviewing", note: "Checking hierarchy, contrast and copy", ms: 1300 },
  { label: "Ready to preview", note: "Preview assembled", ms: 500 },
];

export function generationTimeline(stage: number): Project["timeline"] {
  return generationStages.map((s, i) => ({ label: s.label, note: i < stage ? "Done" : s.note, state: i < stage ? "done" : i === stage ? "active" : "pending" }));
}

export function projectFromPrompt(input: { prompt: string; framework: Framework; styling: Styling; chips: string[]; origin: "prompt" | "template"; kind?: ProjectKind; }): Project {
  const full = [input.prompt, ...input.chips].join(". ");
  const kind = input.kind ?? inferKind(full);
  const brand = brandFrom(input.prompt, kind);
  let site = siteFor(kind, brand);
  const chipText = input.chips.join(" ").toLowerCase();
  if (chipText.includes("dark")) site = { ...site, theme: "dark" };
  if (chipText.includes("pricing")) site = insertSection(site, makeSection("pricing", kind, brand));
  if (chipText.includes("testimonials")) site = insertSection(site, makeSection("testimonials", kind, brand));
  if (chipText.includes("mobile")) site = { ...site, mobileNav: true };
  if (chipText.includes("waitlist")) site = { ...site, sections: site.sections.map((s) => (s.type === "cta" ? { ...s, title: `Join the ${brand} waitlist.`, cta: "Join the waitlist" } : s)) };
  const accent = accentFrom(input.prompt);
  if (accent) site = { ...site, accent };
  const t = now();
  const id = uid("p");
  const project = baseProject({
    id, name: brand, site, framework: input.framework, styling: input.styling, prompt: input.prompt,
    description: K[kind].body, origin: input.origin, status: "building", createdAt: t, updatedAt: t,
    generation: { stage: 0, startedAt: t }, timeline: generationTimeline(0),
    messages: [{ id: uid("m"), author: "you", text: input.prompt, at: t }],
  });
  return project;
}

export function postGenerationMessage(project: Project) {
  const s = project.site;
  const count = s.sections.length;
  return `I built ${s.brand}: ${count} sections, ${project.files.length} files, ${project.framework} with ${project.styling}. Open the preview to look it over, then tell me what to change. Everything here is generated locally for this demo.`;
}

export function projectFromImport(input: { source: string; kind: "repo" | "zip"; framework: Framework }): Project {
  const raw = input.source.trim();
  const last = raw.replace(/\.git$/, "").replace(/\.zip$/i, "").split(/[\\/]/).filter(Boolean).pop() || "imported-project";
  const repo = slugify(last);
  const brand = titleCase(repo);
  const site = { ...siteFor("saas", brand, "ocean"), mobileNav: true };
  const t = now();
  const config = defaultConfig(input.framework, "Tailwind CSS");
  const list: { path: string; content: string }[] = [
    { path: "app/layout.tsx", content: `import "./globals.css";\nimport { Navbar } from "@/components/navbar";\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>\n        <Navbar />\n        {children}\n      </body>\n    </html>\n  );\n}\n` },
    { path: "app/page.tsx", content: `import { DataTable } from "@/components/data-table";\nimport { getRecentOrders } from "@/lib/db";\n\nexport default async function Home() {\n  const orders = await getRecentOrders();\n  return (\n    <main>\n      <h1>${brand}</h1>\n      <DataTable rows={orders} />\n    </main>\n  );\n}\n` },
    { path: "app/dashboard/page.tsx", content: `import { requireUser } from "@/lib/auth";\nimport { DataTable } from "@/components/data-table";\nimport { getRecentOrders } from "@/lib/db";\n\nexport default async function Dashboard() {\n  const user = await requireUser();\n  const orders = await getRecentOrders(user.id);\n  return <DataTable rows={orders} title={"Orders for " + user.name} />;\n}\n` },
    { path: "app/settings/page.tsx", content: `export default function Settings() {\n  return <main><h1>Settings</h1></main>;\n}\n` },
    { path: "app/api/health/route.ts", content: `export async function GET() {\n  return Response.json({ ok: true, service: "${repo}" });\n}\n` },
    { path: "components/navbar.tsx", content: `export function Navbar() {\n  return (\n    <header>\n      <a href="/">${brand}</a>\n      <a href="/dashboard">Dashboard</a>\n      <a href="/settings">Settings</a>\n    </header>\n  );\n}\n` },
    { path: "components/data-table.tsx", content: `type Row = { id: string; customer: string; total: number };\n\nexport function DataTable({ rows, title }: { rows: Row[]; title?: string }) {\n  return (\n    <section>\n      {title && <h2>{title}</h2>}\n      <table>\n        <tbody>\n          {rows.map((row) => (\n            <tr key={row.id}><td>{row.customer}</td><td>{row.total}</td></tr>\n          ))}\n        </tbody>\n      </table>\n    </section>\n  );\n}\n` },
    { path: "lib/db.ts", content: `import { neon } from "@neondatabase/serverless";\n\nconst sql = neon(process.env.DATABASE_URL!);\n\nexport async function getRecentOrders(userId?: string) {\n  return sql\`select id, customer, total from orders order by created_at desc limit 20\`;\n}\n` },
    { path: "lib/auth.ts", content: `export async function requireUser() {\n  // Reads the session cookie and returns the signed-in user.\n  return { id: "u_1", name: "Demo user" };\n}\n` },
    { path: "app/globals.css", content: `@import "tailwindcss";\n\nbody { font-family: system-ui, sans-serif; }\n` },
    { path: "package.json", content: buildPackageJson(repo, config, input.framework) },
    { path: "README.md", content: `# ${brand}\n\nImported from ${input.kind === "zip" ? "an archive" : raw}. This is a simulated import: nothing was downloaded or cloned.\n` },
  ];
  const files: ProjectFile[] = list.map((f) => ({ path: f.path, content: f.content, base: f.content, committed: f.content }));
  const github = input.kind === "repo" ? { repository: repo, branch: "main", lastCommit: hash(raw, 7) } : undefined;
  return baseProject({
    name: brand, site, framework: input.framework, styling: "Tailwind CSS", origin: "import", importedFrom: raw, files, configuration: config,
    status: "ready", createdAt: t, updatedAt: t, workspaceMode: "developer", github,
    description: `Imported ${input.kind === "zip" ? "archive" : "repository"} · ${files.length} files · ${list.filter((f) => /page\.tsx$/.test(f.path)).length} routes`,
    messages: [
      { id: uid("m"), author: "architect", at: t, text: `I read ${input.kind === "zip" ? "the archive" : raw} and mapped ${files.length} files, ${list.filter((f) => /page\.tsx$|route\.ts$/.test(f.path)).length} routes and ${config.dependencies.length} dependencies. Nothing was uploaded or cloned; this is a believable summary for the demo. Developer mode is open so you can look around.` },
    ],
    timeline: [
      { label: "Planning", note: "Repository mapped", state: "done" }, { label: "Building UI", note: "Routes indexed", state: "done" },
      { label: "Reviewing", note: "Dependencies read", state: "done" }, { label: "Ready to preview", note: "Imported project", state: "active" },
    ],
  });
}

/* =====================================================================
   Project analysis (routes, components, dependency map)
   ===================================================================== */

export function analyze(files: ProjectFile[]) {
  const routes = files.filter((f) => /^app\/(.*\/)?(page\.tsx|route\.ts)$/.test(f.path)).map((f) => {
    const seg = f.path.replace(/^app\//, "").replace(/(page\.tsx|route\.ts)$/, "").replace(/\/$/, "");
    return { path: "/" + seg, file: f.path, type: f.path.endsWith("route.ts") ? "API" : "Page" };
  });
  const components = files.filter((f) => /^components\//.test(f.path) && f.path.endsWith(".tsx")).map((f) => {
    const m = f.content.match(/export (?:default )?function (\w+)/);
    return { name: m?.[1] ?? pascal(f.path.split("/").pop()!.replace(/\.\w+$/, "")), file: f.path };
  });
  const edges: { from: string; to: string }[] = [];
  const paths = new Set(files.map((f) => f.path));
  for (const f of files) {
    for (const m of f.content.matchAll(/from\s+["']@\/([^"']+)["']/g)) {
      const target = [".tsx", ".ts", ".css", ""].map((ext) => m[1] + ext).find((p) => paths.has(p));
      if (target) edges.push({ from: f.path, to: target });
    }
  }
  return { routes, components, edges };
}

/* =====================================================================
   Simulated checks (never executes user code)
   ===================================================================== */

export type CheckKind = "lint" | "types" | "build";
export type CheckLine = { text: string; tone?: "ok" | "warn" | "err" | "dim"; file?: string; line?: number };
export type CheckResult = { kind: CheckKind; ok: boolean; lines: CheckLine[]; ms: number };

export function simulateCheck(kind: CheckKind, files: ProjectFile[], variant: "pass" | "fail"): CheckResult {
  const target = files.find((f) => f.path === "components/hero.tsx") ?? files.find((f) => f.path.startsWith("components/")) ?? files[0];
  const lineNo = Math.max(1, target ? target.content.split("\n").findIndex((l) => l.includes("return")) + 1 : 1);
  const label = { lint: "eslint .", types: "tsc --noEmit", build: "next build" }[kind];
  const lines: CheckLine[] = [{ text: `$ ${label}`, tone: "dim" }];
  if (variant === "fail" && target) {
    if (kind === "lint") lines.push({ text: `${target.path}:${lineNo}  warning  Images must have alt text  jsx-a11y/alt-text`, tone: "warn", file: target.path, line: lineNo }, { text: `${target.path}:${lineNo + 1}  error  "onClick" is assigned a value but never used  no-unused-vars`, tone: "err", file: target.path, line: lineNo + 1 }, { text: "✖ 2 problems (1 error, 1 warning)", tone: "err" });
    else if (kind === "types") lines.push({ text: `${target.path}:${lineNo}:10 - error TS2322: Type 'string' is not assignable to type 'number'.`, tone: "err", file: target.path, line: lineNo }, { text: "Found 1 error in 1 file.", tone: "err" });
    else lines.push({ text: "Creating an optimized production build ...", tone: "dim" }, { text: `Failed to compile.`, tone: "err" }, { text: `${target.path}:${lineNo}  Type error: Type 'string' is not assignable to type 'number'.`, tone: "err", file: target.path, line: lineNo });
    return { kind, ok: false, lines, ms: 900 + hash(kind).length * 40 };
  }
  if (kind === "lint") lines.push({ text: "✔ No ESLint warnings or errors", tone: "ok" });
  else if (kind === "types") lines.push({ text: "✔ 0 errors. Checked " + files.filter((f) => /\.tsx?$/.test(f.path)).length + " files", tone: "ok" });
  else lines.push({ text: "Creating an optimized production build ...", tone: "dim" }, { text: "✔ Compiled successfully", tone: "ok" }, { text: "✔ Collecting page data", tone: "ok" }, { text: `✔ Generated ${analyze(files).routes.length || 1} routes`, tone: "ok" });
  return { kind, ok: true, lines, ms: 700 };
}

/* =====================================================================
   Agent playbooks
   ===================================================================== */

export type Playbook = {
  logs: string[];
  summary: string;
  message: string;
  proposal?: Omit<ChangeSet, "id" | "createdAt" | "status" | "source">;
  needs?: { text: string; actionLabel: string; action: "connect-vercel" | "connect-github" | "confirm" };
};

function proposalFromSite(project: Project, site: Site, title: string, summary: string) {
  const gen = buildFiles(site, { name: project.name, framework: project.framework, styling: project.styling, config: project.configuration });
  const merged = mergeGenerated(project.files, gen);
  const patches = merged.filter((f) => f.content !== (project.files.find((p) => p.path === f.path)?.content ?? null)).map((f) => ({ path: f.path, before: project.files.find((p) => p.path === f.path)?.content ?? null, after: f.content }));
  return { title, summary, patches, siteAfter: site };
}

export function playbook(agentId: string, task: string, project: Project, connected: { vercel: boolean; github: boolean }): Playbook {
  const site = project.site;
  const t = task.toLowerCase();
  switch (agentId) {
    case "planner": {
      const missing = (["pricing", "testimonials", "faq"] as SectionType[]).filter((s) => !site.sections.some((x) => x.type === s));
      const plan = `# Plan for ${site.brand}\n\n## Next up\n${(missing.length ? missing : ["stats"]).map((m, i) => `${i + 1}. Add ${sectionLabel[m as SectionType] ?? m}`).join("\n")}\n\n## Before launch\n- Check the preview at mobile width\n- Connect GitHub and Vercel\n- Run lint, types and build\n`;
      return {
        logs: ["Read the project brief and current sections", `Found ${site.sections.length} sections; ${missing.length} common ones are missing`, "Ordered the work by effect on a first-time visitor", "Drafted docs/PLAN.md"],
        summary: `Drafted a ${missing.length + 3}-step plan: ${missing.length ? missing.map((m) => sectionLabel[m as SectionType].toLowerCase()).join(", ") + ", " : ""}mobile check, then ship.`,
        message: `I drafted a plan for ${site.brand}. The next moves are ${missing.length ? missing.map((m) => sectionLabel[m as SectionType].toLowerCase()).join(", ") : "stats and a launch checklist"}. The plan is proposed as docs/PLAN.md.`,
        proposal: { title: "Add project plan", summary: "New file docs/PLAN.md", patches: [{ path: "docs/PLAN.md", before: null, after: plan }] },
      };
    }
    case "designer": {
      let next: Site = { ...site, density: "tight", sections: site.sections.map((s) => (s.type === "hero" ? { ...s, title: K[site.kind].decisive } : s)) };
      const same = site.density === "tight" && heroDecisive(site);
      if (same) next = { ...site, sections: site.sections.map((s) => (s.type === "hero" ? { ...s, cta: "Start now" } : s)) };
      return {
        logs: ["Rendered the page at 1280, 768 and 375", "Measured heading contrast and section spacing", "Found the headline carries two ideas", "Prepared a small, reversible proposal"],
        summary: same ? "Design already tight. Proposed a shorter primary button." : "Proposed tighter spacing and a shorter headline.",
        message: same ? "The layout is already tight, so I only proposed a shorter primary button label." : "I reviewed the first screen. The headline carries two ideas and the vertical rhythm is loose. I proposed a shorter headline and tighter spacing.",
        proposal: proposalFromSite(project, next, same ? "Shorten the primary button" : "Tighten spacing and headline", same ? "Changes the hero button label" : "Shorter headline, 56px section gap"),
      };
    }
    case "frontend": {
      const it = interpret(task, site);
      if (it.kind === "change" && it.site) {
        return {
          logs: ["Read the request and located the affected files", `Planned: ${it.title.toLowerCase()}`, "Wrote the component and updated app/page.tsx", "Checked imports resolve"],
          summary: `${it.title}. Proposed as a reviewable change.`,
          message: `I prepared "${it.title}". Review the file changes, then accept to apply it to the preview.`,
          proposal: proposalFromSite(project, it.site, it.title, "Component added and page updated"),
        };
      }
      const container = `export function Container({ children }: { children: React.ReactNode }) {\n  return <div className="mx-auto w-full max-w-6xl px-6">{children}</div>;\n}\n`;
      return {
        logs: ["Scanned components for repeated wrappers", "Found the same max-width wrapper in every section", "Extracted components/container.tsx", "Left behaviour unchanged"],
        summary: "Extracted a shared Container component (1 new file).",
        message: "I found the same layout wrapper repeated across sections and extracted it into components/container.tsx. Nothing visual changes.",
        proposal: { title: "Extract shared Container", summary: "New components/container.tsx", patches: [{ path: "components/container.tsx", before: null, after: container }] },
      };
    }
    case "backend": {
      const route = `export async function GET() {\n  return Response.json({ ok: true, service: "${slugify(project.name)}", time: new Date().toISOString() });\n}\n`;
      const db = `// Data access for ${project.name}. Replace the stub with a real client.\nexport async function getSettings() {\n  return { theme: "${site.theme}", accent: "${site.accent}" };\n}\n`;
      return {
        logs: ["Read the routes and existing data access", "No health check found", "Drafted app/api/health/route.ts", "Drafted a typed settings reader in lib/db.ts"],
        summary: "Proposed a health endpoint and a data access stub (2 new files).",
        message: "I drafted a health check at /api/health and a small data-access module. Both are proposals; nothing runs in this demo.",
        proposal: { title: "Add health check and data access", summary: "New app/api/health/route.ts and lib/db.ts", patches: [{ path: "app/api/health/route.ts", before: null, after: route }, { path: "lib/db.ts", before: null, after: db }] },
      };
    }
    case "qa": {
      const issues = site.mobileNav ? ["Hero button touch target is 38px, below the 44px guideline (components/hero.tsx)"] : ["Navigation links overlap the button below 480px (components/nav.tsx)", "Hero button touch target is 38px, below the 44px guideline (components/hero.tsx)"];
      const fix = !site.mobileNav ? proposalFromSite(project, { ...site, mobileNav: true }, "Fix nav overlap on mobile", "Adds a mobile menu button") : undefined;
      return {
        logs: ["Opened the preview at 375, 768 and 1280", "Tabbed through every interactive element", ...issues.map((i) => "Found: " + i), "Wrote up the findings"],
        summary: `Found ${issues.length === 1 ? "one" : "two"} responsive ${issues.length === 1 ? "issue" : "issues"}.`,
        message: `QA review: ${issues.join("; ")}.${fix ? " I proposed a fix for the first." : ""}`,
        proposal: fix,
      };
    }
    default: {
      if (!connected.vercel && !project.vercel) {
        return {
          logs: ["Read the deploy checklist", "Generated project: ready", "Vercel: not connected"],
          summary: "Waiting on a Vercel connection.",
          message: "I am ready to prepare a deployment, but Vercel is not connected. Connect it and I will continue.",
          needs: { text: "Connect Vercel so the deployment can target a linked project.", actionLabel: "Connect Vercel", action: "connect-vercel" },
        };
      }
      return {
        logs: ["Read the deploy checklist", "Checked the source path: local changes to GitHub to Vercel", "Verified 2 environment variables", "Prepared a preview deployment plan"],
        summary: "Checklist verified. Ready for a preview deployment.",
        message: "The deploy checklist is clean. Open Deploy when you are ready. I will use your linked project.",
      };
    }
  }
}
