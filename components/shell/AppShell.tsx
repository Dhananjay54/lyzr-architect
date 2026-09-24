"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Monitor, Smartphone, Tablet, X } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DialogHost } from "@/components/dialogs/DialogHost";
import { SitePreview } from "@/components/preview/SitePreview";
import { Segmented } from "@/components/ui/bits";
import { useApp } from "@/lib/store";
import { CommandPalette } from "./CommandPalette";
import { MobileTabs, Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Tour } from "./Tour";
import { ShellCtx, type DialogState, type ShellApi } from "./shell-context";

function Presentation({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { getProject, patchProject } = useApp();
  const project = getProject(projectId);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", key);
    patchProject(projectId, (p) => ({ ...p, previewChecked: true }));
    return () => window.removeEventListener("keydown", key);
  }, [onClose, patchProject, projectId]);
  if (!project) return null;
  const width = device === "mobile" ? 390 : device === "tablet" ? 768 : 1280;
  return (
    <motion.div className="present" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-label="Presentation mode">
      <div className="present-bar">
        <b>{project.name}</b>
        <Segmented label="Device" value={device} onChange={setDevice} options={[
          { value: "desktop", label: <Monitor size={14} />, title: "Desktop" }, { value: "tablet", label: <Tablet size={14} />, title: "Tablet" }, { value: "mobile", label: <Smartphone size={14} />, title: "Mobile" },
        ]} />
        <button className="btn sm" onClick={onClose}><X size={14} /> Exit <kbd className="kbd">esc</kbd></button>
      </div>
      <div className="present-stage">
        <motion.div className="present-frame" animate={{ width }} transition={{ type: "spring", stiffness: 240, damping: 30 }}>
          <SitePreview site={project.site} />
        </motion.div>
      </div>
    </motion.div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const { setActive } = useApp();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [presenting, setPresenting] = useState(false);
  const [focus, setFocusState] = useState<ShellApi["focus"]>(null);

  const routeProject = pathname.startsWith("/project/") ? params.id : undefined;
  useEffect(() => { if (routeProject) setActive(routeProject); }, [routeProject, setActive]);
  useEffect(() => { setPresenting(false); }, [pathname]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((o) => !o); return; }
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (e.key === "?" && !typing && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setDialog({ kind: "help" }); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const api = useMemo<ShellApi>(() => ({
    openPalette: () => setPaletteOpen(true),
    dialog,
    openDialog: (d) => setDialog(d),
    closeDialog: () => setDialog(null),
    focus,
    setFocus: (f) => setFocusState({ ...f, nonce: Date.now() }),
    presenting,
    setPresenting,
  }), [dialog, focus, presenting]);

  const fullBleed = /^\/project\/[^/]+$/.test(pathname);

  return (
    <ShellCtx.Provider value={api}>
      <div className="app">
        <Sidebar />
        <div className="main">
          <Topbar />
          <motion.div key={pathname} className={fullBleed ? "page-frame bleed" : "page-frame"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: "easeOut" }}>
            {children}
          </motion.div>
        </div>
        <MobileTabs />
      </div>
      <CommandPalette open={paletteOpen} onClose={closePalette} />
      <Tour />
      <DialogHost />
      <AnimatePresence>{presenting && routeProject && <Presentation projectId={routeProject} onClose={() => setPresenting(false)} />}</AnimatePresence>
    </ShellCtx.Provider>
  );
}
