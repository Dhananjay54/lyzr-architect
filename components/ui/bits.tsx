"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useId, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const LOGO_URL = "https://b3591924.assetcdn.net/2.0/3591924/wp-content/uploads/2026/09/logo-lyzr-white.webp?lossy=1&strip=1&webp=1";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_URL} alt="Lyzr" />
      {!compact && <span className="architect">/ architect</span>}
    </div>
  );
}

/** A card whose surface follows the pointer with a soft terracotta glow. */
export function Spotlight<T extends ElementType = "div">({ as, className, children, ...rest }: { as?: T; className?: string; children: ReactNode } & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">) {
  const Comp = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  return (
    <Comp
      ref={ref}
      className={cn("spot", className)}
      onMouseMove={(e: React.MouseEvent<HTMLElement>) => {
        const el = ref.current; if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

export type Tone = "neutral" | "success" | "warn" | "danger" | "accent" | "info";

/** Status is never colour-only: every state has an icon or glyph and a label. */
export function Status({ tone = "neutral", children, dot = true, busy }: { tone?: Tone; children: ReactNode; dot?: boolean; busy?: boolean }) {
  return (
    <span className={cn("status", `tone-${tone}`)}>
      {busy ? <Loader2 size={11} className="spin" /> : dot ? <i className="status-glyph" aria-hidden /> : null}
      {children}
    </span>
  );
}

export const Kbd = ({ children }: { children: ReactNode }) => <kbd className="kbd">{children}</kbd>;

export function Empty({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      {icon && <div className="empty-icon">{icon}</div>}
      <h4>{title}</h4>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; title?: string }[]; label: string; className?: string }) {
  const id = useId();
  return (
    <div className={cn("seg", className)} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} aria-label={o.title} title={o.title} className={value === o.value ? "on" : ""} onClick={() => onChange(o.value)}>
          {value === o.value && <motion.span layoutId={`seg-${id}`} className="seg-pill" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
          <span className="seg-label">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, children, style }: { label: string; hint?: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <label className="field" style={style}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Progress({ value, tone = "accent" }: { value: number; tone?: "accent" | "success" }) {
  return (
    <div className={cn("progress", tone)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <motion.i animate={{ width: `${value}%` }} transition={{ type: "spring", stiffness: 120, damping: 24 }} />
    </div>
  );
}

export const StepGlyph = ({ state }: { state: "done" | "active" | "pending" | "error" }) => (
  <span className={cn("step", state)}>{state === "done" ? <Check size={11} /> : state === "active" ? <Loader2 size={11} className="spin" /> : state === "error" ? "!" : null}</span>
);

/** Monogram tile for a connector. Custom marks avoid reproducing third-party logos. */
export function ConnectorMark({ mark, hue, size = 40 }: { mark: string; hue: number; size?: number }) {
  return (
    <span className="cmark" style={{ width: size, height: size, ["--h" as string]: hue, ["--sat" as string]: hue === 0 ? "0%" : "70%", ["--sat2" as string]: hue === 0 ? "0%" : "55%", fontSize: size * 0.34 }} aria-hidden>{mark}</span>
  );
}

export function useReducedMotionSafe() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
