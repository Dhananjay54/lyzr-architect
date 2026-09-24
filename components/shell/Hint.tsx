"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, X } from "lucide-react";
import type { ReactNode } from "react";
import { useApp } from "@/lib/store";

/** A compact, independently dismissible first-use hint. Remembered in session state. */
export function Hint({ id, title, children, action }: { id: string; title: string; children: ReactNode; action?: ReactNode }) {
  const { state, markHint } = useApp();
  const seen = state.onboarding.seenHints.includes(id);
  return (
    <AnimatePresence initial={false}>
      {!seen && (
        <motion.div className="hint" initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }} role="note">
          <Lightbulb size={15} aria-hidden />
          <div><b>{title}</b> <span>{children}</span></div>
          {action}
          <button className="btn ghost icon sm" aria-label="Dismiss hint" onClick={() => markHint(id)}><X size={13} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
