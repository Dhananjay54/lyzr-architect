"use client";

import { ArrowRight, Menu as MenuIcon, Plus, X } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type AnchorHTMLAttributes } from "react";
import { accentHex, sectionLabel } from "@/lib/engine";
import type { Section, Site } from "@/lib/types";
import { cn } from "@/lib/utils";

const InertCtx = createContext(false);

/** Anchors inside a thumbnail must not be real links: thumbnails sit inside cards that are already links. */
function A(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const inert = useContext(InertCtx);
  if (inert) { const { href, onClick, ...rest } = props; void href; void onClick; return <span {...(rest as object)} />; }
  return <a {...props} />;
}

type Props = {
  site: Site;
  inspect?: boolean;
  selectedId?: string | null;
  onSelect?: (section: Section) => void;
  className?: string;
};

export function siteVars(site: Site): CSSProperties {
  const [light, dark] = accentHex[site.accent];
  const dk = site.theme === "dark";
  return {
    ["--s-bg" as string]: dk ? "#160f0a" : "#fbfaf8",
    ["--s-surface" as string]: dk ? "#251f1b" : "#ffffff",
    ["--s-ink" as string]: dk ? "#faf7f3" : "#160f0a",
    ["--s-muted" as string]: dk ? "#b7a494" : "#6e594a",
    ["--s-line" as string]: dk ? "#403329" : "#e4d8cd",
    ["--s-accent" as string]: dk ? dark : light,
    ["--s-accent-ink" as string]: dk ? "#160f0a" : "#ffffff",
    ["--s-gap" as string]: site.density === "tight" ? "clamp(28px, 6cqw, 44px)" : "clamp(44px, 10cqw, 84px)",
  };
}

export function SitePreview({ site, inspect, selectedId, onSelect, className }: Props) {
  return (
    <div className={cn("site", className)} style={siteVars(site)} data-theme={site.theme}>
      {site.sections.map((section) => (
        <div
          key={section.id}
          className={cn("st-sec", inspect && "inspectable", selectedId === section.id && "selected")}
          data-section={section.id}
          onClick={inspect ? (e) => { e.preventDefault(); e.stopPropagation(); onSelect?.(section); } : undefined}
        >
          {inspect && <span className="st-tag">{sectionLabel[section.type]}</span>}
          <SectionView section={section} site={site} />
        </div>
      ))}
    </div>
  );
}

function SectionView({ section, site }: { section: Section; site: Site }) {
  switch (section.type) {
    case "nav": return <Nav section={section} site={site} />;
    case "hero": return (
      <section className="st-hero">
        <p className="st-eyebrow">{section.eyebrow}</p>
        <h1>{section.title}</h1>
        <p className="st-lead">{section.body}</p>
        <A className="st-btn" href="#start" onClick={(e) => e.preventDefault()}>{section.cta} <ArrowRight size={13} /></A>
      </section>
    );
    case "logos": return (
      <section className="st-logos"><p>{section.title}</p><ul>{section.items?.map((i) => <li key={i.title}>{i.title}</li>)}</ul></section>
    );
    case "features": return (
      <section className="st-block">
        <h2>{section.title}</h2>
        <div className="st-grid three">{section.items?.map((i, n) => (
          <article key={i.title} className="st-card"><span className="st-num">{String(n + 1).padStart(2, "0")}</span><h3>{i.title}</h3><p>{i.body}</p></article>
        ))}</div>
      </section>
    );
    case "stats": return (
      <section className="st-stats">{section.items?.map((i) => <div key={i.title}><strong>{i.title}</strong><span>{i.body}</span></div>)}</section>
    );
    case "showcase": return <Showcase section={section} site={site} />;
    case "pricing": return (
      <section className="st-block">
        <p className="st-eyebrow">{section.eyebrow}</p><h2>{section.title}</h2><p className="st-lead">{section.body}</p>
        <div className="st-grid three">{section.items?.map((i, n) => (
          <article key={i.title} className={cn("st-card price", n === 1 && "featured")}>
            {n === 1 && <span className="st-badge">Most chosen</span>}
            <h3>{i.title}</h3><strong className="st-price">{i.meta}</strong><p>{i.body}</p>
            <A className={cn("st-btn", n !== 1 && "ghost")} href="#start" onClick={(e) => e.preventDefault()}>Choose {i.title}</A>
          </article>
        ))}</div>
      </section>
    );
    case "testimonials": return (
      <section className="st-block">
        <p className="st-eyebrow">{section.eyebrow}</p><h2>{section.title}</h2>
        <div className="st-grid three">{section.items?.map((i) => (
          <figure key={i.title} className="st-card quote"><blockquote>“{i.title}”</blockquote><figcaption>{i.body}</figcaption></figure>
        ))}</div>
      </section>
    );
    case "faq": return <Faq section={section} />;
    case "cta": return (
      <section className="st-cta" id="start">
        <h2>{section.title}</h2><p className="st-lead">{section.body}</p>
        <A className="st-btn" href="#start" onClick={(e) => e.preventDefault()}>{section.cta} <ArrowRight size={13} /></A>
      </section>
    );
    case "footer": return (
      <footer className="st-footer"><span>{section.body}</span><nav>{section.items?.map((i) => <A key={i.title} href="#" onClick={(e) => e.preventDefault()}>{i.title}</A>)}</nav></footer>
    );
  }
}

function Nav({ section, site }: { section: Section; site: Site }) {
  const [open, setOpen] = useState(false);
  return (
    <header className={cn("st-nav", site.mobileNav && "has-menu")}>
      <A className="st-brand" href="#" onClick={(e) => e.preventDefault()}>{site.brand}</A>
      <nav aria-label="Preview navigation">{section.items?.map((i) => <A key={i.title} href="#" onClick={(e) => e.preventDefault()}>{i.title}</A>)}</nav>
      <A className="st-btn small" href="#" onClick={(e) => e.preventDefault()}>{section.cta}</A>
      {site.mobileNav && (
        <button type="button" className="st-menu" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}>
          {open ? <X size={16} /> : <MenuIcon size={16} />}
        </button>
      )}
      {site.mobileNav && open && (
        <div className="st-drawer">{section.items?.map((i) => <A key={i.title} href="#" onClick={(e) => e.preventDefault()}>{i.title}</A>)}</div>
      )}
    </header>
  );
}

function Faq({ section }: { section: Section }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="st-block">
      <p className="st-eyebrow">{section.eyebrow}</p><h2>{section.title}</h2>
      <div className="st-faq">{section.items?.map((i, n) => (
        <div key={i.title} className={cn("st-q", open === n && "open")}>
          <button type="button" aria-expanded={open === n} onClick={(e) => { e.stopPropagation(); setOpen(open === n ? null : n); }}>{i.title}<Plus size={14} /></button>
          {open === n && <p>{i.body}</p>}
        </div>
      ))}</div>
    </section>
  );
}

const TONES = [12, 32, 160, 210, 280, 340];

function Showcase({ section, site }: { section: Section; site: Site }) {
  const items = section.items ?? [];
  const head = (
    <>
      <p className="st-eyebrow">{section.eyebrow}</p><h2>{section.title}</h2><p className="st-lead">{section.body}</p>
    </>
  );
  if (site.kind === "saas") {
    const bars = [38, 52, 44, 66, 58, 74, 70, 88];
    return (
      <section className="st-block">{head}
        <div className="st-dash">
          <div className="st-kpis">{items.map((i) => <div key={i.title} className="st-kpi"><span>{i.title}</span><strong>{i.meta}</strong><em className={i.body?.startsWith("-") ? "down" : "up"}>{i.body?.startsWith("-") ? "▼" : "▲"} {i.body}</em></div>)}</div>
          <div className="st-chart" role="img" aria-label="Weekly signups chart">{bars.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
        </div>
      </section>
    );
  }
  if (site.kind === "marketplace") {
    return (
      <section className="st-block">{head}
        <div className="st-grid four">{items.map((i, n) => (
          <article key={i.title} className="st-card listing"><div className="st-thumb" style={{ ["--t" as string]: TONES[n % TONES.length] }} /><h3>{i.title}</h3><p>{i.body}</p><strong>{i.meta}</strong></article>
        ))}</div>
      </section>
    );
  }
  if (site.kind === "support") {
    return (
      <section className="st-block">{head}
        <div className="st-chat">{items.map((i) => <div key={i.title} className={cn("st-msg", i.meta === "agent" && "agent")}><small>{i.meta === "agent" ? `${site.brand} agent` : "Customer"}</small><p>{i.title}</p></div>)}</div>
      </section>
    );
  }
  if (site.kind === "portfolio") {
    return (
      <section className="st-block">{head}
        <div className="st-grid two">{items.map((i, n) => (
          <article key={i.title} className="st-card work"><div className="st-thumb wide" style={{ ["--t" as string]: TONES[(n + 2) % TONES.length] }} /><div className="st-row"><h3>{i.title}</h3><span>{i.meta}</span></div><p>{i.body}</p></article>
        ))}</div>
      </section>
    );
  }
  return (
    <section className="st-block">{head}
      <div className="st-grid four">{items.map((i) => <article key={i.title} className="st-card"><span className="st-num">{i.meta}</span><h3>{i.title}</h3><p>{i.body}</p></article>)}</div>
    </section>
  );
}

/** A fixed-width render scaled to fill its container, for cards and thumbnails. */
export function SiteThumb({ site, ratio = 0.62 }: { site: Site; ratio?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / 1100);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="thumb" ref={ref} style={{ aspectRatio: `1 / ${ratio}` }} aria-hidden>
      <div style={{ width: 1100, transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none" }}>
        <InertCtx.Provider value><SitePreview site={{ ...site, mobileNav: false }} /></InertCtx.Provider>
      </div>
    </div>
  );
}
