"use client";

import { Check, PanelRightClose, PanelRightOpen, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { toast } from "sonner";
import { SitePreview } from "@/components/preview/SitePreview";
import { Hint } from "@/components/shell/Hint";
import { useShell } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/bits";
import { Tip } from "@/components/ui/tip";
import { useMedia } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CodeEditor, DiffView } from "./CodeEditor";
import { ControlRoom } from "./ControlRoom";
import { DevDock, type DockPanel } from "./DevDock";
import { DevExplorer } from "./DevExplorer";
import { DeviceFrame, type Device } from "./DeviceFrame";

const LANG: Record<string, string> = { tsx: "TypeScript React", ts: "TypeScript", css: "CSS", json: "JSON", md: "Markdown" };

function EditorArea({ project, openTabs, active, setActive, closeTab, reveal, onViewDiff, diffMode, setDiffMode }: {
  project: Project; openTabs: string[]; active: string; setActive: (p: string) => void; closeTab: (p: string) => void;
  reveal: { line: number; nonce: number } | null; onViewDiff: (p: string) => void; diffMode: Record<string, boolean>; setDiffMode: (p: string, v: boolean) => void;
}) {
  const { editFile, acceptFile, discardFile } = useApp();
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const file = project.files.find((f) => f.path === active);
  const dirty = !!file && file.content !== file.base;
  const showDiff = !!diffMode[active];
  return (
    <div className="editor">
      <div className="editor-tabs" role="tablist" aria-label="Open files">
        {openTabs.map((p) => {
          const f = project.files.find((x) => x.path === p); if (!f) return null;
          return (
            <div key={p} role="tab" aria-selected={p === active} className={cn("etab", p === active && "on")}>
              <button onClick={() => setActive(p)} title={p}>{p.split("/").pop()}{f.content !== f.base && <i className="dirty" aria-label="Unreviewed edit" />}</button>
              <button className="etab-x" aria-label={`Close ${p}`} onClick={() => closeTab(p)}><X size={11} /></button>
            </div>
          );
        })}
      </div>
      {file ? (
        <>
          <div className="editor-path mono">{file.path}</div>
          <div className="editor-surface">
            {showDiff ? <div className="diff-wrap"><DiffView before={file.base} after={file.content} path={file.path} /></div> : <CodeEditor key={file.path} path={file.path} value={file.content} onChange={(v) => editFile(project.id, file.path, v)} revealLine={reveal} onCursor={(line, col) => setCursor({ line, col })} />}
          </div>
          <div className="editor-status">
            <span className="mono">Ln {cursor.line}, Col {cursor.col}</span>
            <span>{LANG[file.path.split(".").pop() ?? ""] ?? "Plain text"}</span>
            <span className={cn("save-state", dirty && "dirty")}>{dirty ? "Unreviewed edit" : <><Check size={12} /> Saved to this session</>}</span>
            <span className="spacer" />
            {dirty && <><Button size="sm" onClick={() => { acceptFile(project.id, file.path); toast.success(`Accepted ${file.path}`); }}><Check size={12} /> Accept</Button><Button size="sm" onClick={() => { discardFile(project.id, file.path); setDiffMode(file.path, false); }}>Discard</Button></>}
            <Segmented label="Editor view" value={showDiff ? "diff" : "code"} onChange={(v) => setDiffMode(file.path, v === "diff")} options={[{ value: "code", label: "Code" }, { value: "diff", label: "Diff" }]} />
          </div>
        </>
      ) : <div className="editor-empty">Open a file from the explorer.</div>}
    </div>
  );
}

function PreviewPane({ project }: { project: Project }) {
  const [device, setDevice] = useState<Device>(() => (typeof window !== "undefined" && window.innerWidth < 720 ? "mobile" : "desktop"));
  return (
    <div className="preview dev-preview" data-tour="preview">
      <div className="preview-bar"><span className="panel-head-inline">Live preview</span><Segmented label="Device" value={device} onChange={setDevice} options={[{ value: "desktop", label: "Desktop" }, { value: "mobile", label: "Mobile" }]} /></div>
      <DeviceFrame device={device} url={`${project.name.toLowerCase().replace(/\s+/g, "-")}.local`}><SitePreview site={project.site} /></DeviceFrame>
    </div>
  );
}

export function DeveloperWorkspace({ project }: { project: Project }) {
  const { focus } = useShell();
  const wide = useMedia("(min-width: 1180px)", true);
  const first = project.files.find((f) => f.path === "app/page.tsx")?.path ?? project.files[0]?.path ?? "";
  const [openTabs, setOpenTabs] = useState<string[]>(first ? [first] : []);
  const [active, setActive] = useState(first);
  const [diffMode, setDiffModeState] = useState<Record<string, boolean>>({});
  const [reveal, setReveal] = useState<{ line: number; nonce: number } | null>(null);
  const [panel, setPanel] = useState<DockPanel>("changes");
  const [view, setView] = useState<"editor" | "split" | "preview">("split");
  const [control, setControl] = useState(true);
  const [pane, setPane] = useState<"files" | "editor" | "preview" | "dock" | "control">("editor");
  const lastFocus = useRef<number>(0);

  // Drop tabs for files that no longer exist.
  const existing = useMemo(() => new Set(project.files.map((f) => f.path)), [project.files]);
  useEffect(() => {
    setOpenTabs((tabs) => tabs.filter((t) => existing.has(t)));
    if (!existing.has(active)) setActive(project.files[0]?.path ?? "");
  }, [existing, active, project.files]);

  const open = (path: string, line?: number) => {
    if (!existing.has(path)) return;
    setOpenTabs((t) => (t.includes(path) ? t : [...t, path]));
    setActive(path);
    setDiffModeState((d) => ({ ...d, [path]: false }));
    if (line) setReveal({ line, nonce: Date.now() });
    if (!wide) setPane("editor");
  };
  const viewDiff = (path: string) => { open(path); setDiffModeState((d) => ({ ...d, [path]: true })); };

  // Requests from the command palette, dialogs and preview.
  useEffect(() => {
    if (!focus || focus.nonce === lastFocus.current) return;
    lastFocus.current = focus.nonce;
    if (focus.panel === "explorer") { if (!wide) setPane("files"); }
    else if (focus.panel) { setPanel(focus.panel); if (!wide) setPane("dock"); }
    if (focus.file) window.setTimeout(() => open(focus.file!, focus.line), 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  const editor = <EditorArea project={project} openTabs={openTabs} active={active} setActive={(p) => { setActive(p); }} closeTab={(p) => { setOpenTabs((t) => { const next = t.filter((x) => x !== p); if (p === active) setActive(next[next.length - 1] ?? ""); return next; }); }} reveal={reveal} onViewDiff={viewDiff} diffMode={diffMode} setDiffMode={(p, v) => setDiffModeState((d) => ({ ...d, [p]: v }))} />;
  const dock = <DevDock project={project} panel={panel} onPanel={setPanel} onOpenFile={open} onViewDiff={viewDiff} />;
  const explorer = <DevExplorer project={project} active={active} onOpen={open} />;

  const toolbar = (
    <div className="dev-toolbar">
      <Segmented label="Layout" value={view} onChange={setView} options={[{ value: "editor", label: "Editor" }, { value: "split", label: "Split" }, { value: "preview", label: "Preview" }]} />
      <span className="spacer" />
      <Tip label={control ? "Hide Control Room" : "Dock Control Room"}><button className="btn ghost sm" aria-pressed={control} onClick={() => setControl(!control)}>{control ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />} Control Room</button></Tip>
    </div>
  );

  const center = (
    <Group orientation="vertical" className="rp-group" id="dev-vertical">
      <Panel id="dev-top" defaultSize="64%" minSize="25%" className="rp-panel">
        <div className="dev-top">
          {toolbar}
          <div className="dev-top-body">
            {view === "split" ? (
              <Group orientation="horizontal" className="rp-group" id="dev-split">
                <Panel id="ed" defaultSize="56%" minSize="30%" className="rp-panel">{editor}</Panel>
                <Separator className="rp-sep" />
                <Panel id="pv" defaultSize="44%" minSize="20%" className="rp-panel"><PreviewPane project={project} /></Panel>
              </Group>
            ) : view === "editor" ? editor : <PreviewPane project={project} />}
          </div>
        </div>
      </Panel>
      <Separator className="rp-sep horizontal" />
      <Panel id="dev-dock" defaultSize="36%" minSize="14%" className="rp-panel">{dock}</Panel>
    </Group>
  );

  return (
    <div className="dev">
      <Hint id="developer" title="Developer mode.">Explore files, edit code, review diffs and run simulated checks. Everything here is local to this demo.</Hint>
      <div className="dev-frame">
        {wide ? (
          <Group orientation="horizontal" className="rp-group" id="dev-layout">
            <Panel id="explorer" defaultSize="17%" minSize="12%" maxSize="30%" className="rp-panel">{explorer}</Panel>
            <Separator className="rp-sep" />
            <Panel id="center" defaultSize={control ? "58%" : "83%"} minSize="35%" className="rp-panel">{center}</Panel>
            {control && <Separator className="rp-sep" />}
            {control && <Panel id="control" defaultSize="25%" minSize="18%" maxSize="40%" className="rp-panel"><ControlRoom project={project} /></Panel>}
          </Group>
        ) : (
          <>
            <div className="pane-switch scroll"><Segmented label="Developer pane" value={pane} onChange={setPane} options={[{ value: "files", label: "Files" }, { value: "editor", label: "Editor" }, { value: "preview", label: "Preview" }, { value: "dock", label: "Panels" }, { value: "control", label: "Control" }]} /></div>
            <div className="pane-body">
              {pane === "files" && explorer}{pane === "editor" && editor}{pane === "preview" && <PreviewPane project={project} />}{pane === "dock" && dock}{pane === "control" && <ControlRoom project={project} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
