"use client";

import { Boxes, ChevronDown, ChevronRight, FileCode2, FilePlus2, Folder, FolderOpen, Network, Route, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useShell } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tip } from "@/components/ui/tip";
import { analyze } from "@/lib/engine";
import { useApp } from "@/lib/store";
import type { Project, ProjectFile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { bezier, bezierPath } from "@/lib/workflow-layout";

type Node = { name: string; path: string; children: Node[]; file?: ProjectFile };

function buildTree(files: ProjectFile[]): Node {
  const root: Node = { name: "", path: "", children: [] };
  for (const f of files) {
    const parts = f.path.split("/");
    let cur = root;
    parts.forEach((part, i) => {
      const path = parts.slice(0, i + 1).join("/");
      let next = cur.children.find((c) => c.name === part);
      if (!next) { next = { name: part, path, children: [], file: i === parts.length - 1 ? f : undefined }; cur.children.push(next); }
      cur = next;
    });
  }
  const sort = (n: Node) => { n.children.sort((a, b) => Number(!!a.file) - Number(!!b.file) || a.name.localeCompare(b.name)); n.children.forEach(sort); };
  sort(root);
  return root;
}

function TreeRow({ node, depth, active, onOpen, onDelete, open, toggle }: { node: Node; depth: number; active: string; onOpen: (p: string) => void; onDelete: (p: string) => void; open: Record<string, boolean>; toggle: (p: string) => void }) {
  if (node.file) {
    const dirty = node.file.content !== node.file.base;
    return (
      <div className={cn("tree-row", active === node.path && "on")} style={{ paddingLeft: 10 + depth * 14 }}>
        <button className="tree-main" onClick={() => onOpen(node.path)} title={node.path}>
          <FileCode2 size={13} /><span>{node.name}</span>{dirty && <i className="dirty" aria-label="Unreviewed edit" />}
        </button>
        <button className="tree-del btn ghost icon sm" aria-label={`Delete ${node.path}`} onClick={() => onDelete(node.path)}><Trash2 size={12} /></button>
      </div>
    );
  }
  const isOpen = open[node.path] !== false;
  return (
    <>
      <button className="tree-row folder" style={{ paddingLeft: 6 + depth * 14 }} onClick={() => toggle(node.path)} aria-expanded={isOpen}>
        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}{isOpen ? <FolderOpen size={13} /> : <Folder size={13} />}<span>{node.name}</span>
      </button>
      {isOpen && node.children.map((c) => <TreeRow key={c.path} node={c} depth={depth + 1} active={active} onOpen={onOpen} onDelete={onDelete} open={open} toggle={toggle} />)}
    </>
  );
}

export function DependencyMap({ project, onOpen }: { project: Project; onOpen: (path: string) => void }) {
  const info = useMemo(() => analyze(project.files), [project.files]);
  const [hover, setHover] = useState<string | null>(null);
  const cols = [
    project.files.filter((f) => f.path.startsWith("app/") && /\.(tsx|ts)$/.test(f.path)),
    project.files.filter((f) => f.path.startsWith("components/")),
    project.files.filter((f) => !f.path.startsWith("app/") && !f.path.startsWith("components/") && /\.(tsx|ts|css)$/.test(f.path)).concat(project.files.filter((f) => f.path === "app/globals.css")),
  ];
  const W = 760; const rowH = 34; const H = Math.max(...cols.map((c) => c.length), 3) * rowH + 40;
  const pos = new Map<string, { x: number; y: number }>();
  cols.forEach((c, ci) => c.forEach((f, ri) => pos.set(f.path, { x: 90 + ci * ((W - 180) / 2), y: 30 + ri * rowH + (H - 40 - c.length * rowH) / 2 })));
  const rel = (p: string) => hover && (p === hover || info.edges.some((e) => (e.from === hover && e.to === p) || (e.to === hover && e.from === p)));
  return (
    <div className="depmap">
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Dependency map">
        {info.edges.map((e, i) => { const a = pos.get(e.from); const b = pos.get(e.to); if (!a || !b || a.x === b.x) return null; const lit = hover && (e.from === hover || e.to === hover); return <path key={i} d={bezierPath(bezier({ x: a.x + 80, y: a.y }, { x: b.x - 80, y: b.y }))} className={cn("dm-edge", lit && "lit", hover && !lit && "dim")} />; })}
        {Array.from(pos.entries()).map(([path, p]) => (
          <g key={path} className={cn("dm-node", hover && !rel(path) && "dim", hover === path && "on")} transform={`translate(${p.x - 80},${p.y - 12})`} onMouseEnter={() => setHover(path)} onMouseLeave={() => setHover(null)} onClick={() => onOpen(path)} tabIndex={0} onFocus={() => setHover(path)} onBlur={() => setHover(null)} onKeyDown={(e) => e.key === "Enter" && onOpen(path)} role="button" aria-label={`Open ${path}`}>
            <rect width={160} height={24} rx={7} /><text x={10} y={16}>{path.length > 24 ? "…" + path.slice(-23) : path}</text>
          </g>
        ))}
        {["Routes and pages", "Components", "Libraries and styles"].map((t, i) => <text key={t} x={90 + i * ((W - 180) / 2)} y={14} textAnchor="middle" className="dm-col">{t}</text>)}
      </svg>
      <p className="note">{info.edges.length} imports between {project.files.length} files. Hover a file to see what it touches.</p>
    </div>
  );
}

export function DevExplorer({ project, active, onOpen }: { project: Project; active: string; onOpen: (path: string) => void }) {
  const { deleteFile } = useApp();
  const { openDialog } = useShell();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [del, setDel] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const tree = useMemo(() => buildTree(project.files), [project.files]);
  const info = useMemo(() => analyze(project.files), [project.files]);

  return (
    <div className="explorer">
      <div className="panel-head">
        <span>Explorer</span>
        <span className="row tight">
          <Tip label="New component"><button className="btn ghost icon sm" aria-label="New component" onClick={() => openDialog({ kind: "newComponent", projectId: project.id })}><FilePlus2 size={14} /></button></Tip>
          <Tip label="Add route"><button className="btn ghost icon sm" aria-label="Add route" onClick={() => openDialog({ kind: "newRoute", projectId: project.id })}><Route size={14} /></button></Tip>
        </span>
      </div>
      <Tabs defaultValue="files">
        <TabsList label="Explorer views"><TabsTrigger value="files">Files</TabsTrigger><TabsTrigger value="routes" count={info.routes.length}>Routes</TabsTrigger><TabsTrigger value="components" count={info.components.length}>Parts</TabsTrigger><TabsTrigger value="map">Map</TabsTrigger></TabsList>
        <TabsContent value="files"><div className="tree" role="tree">{tree.children.map((n) => <TreeRow key={n.path} node={n} depth={0} active={active} onOpen={onOpen} onDelete={setDel} open={open} toggle={(p) => setOpen({ ...open, [p]: open[p] === false })} />)}</div></TabsContent>
        <TabsContent value="routes">
          <ul className="ex-list">{info.routes.map((r) => <li key={r.file}><button onClick={() => onOpen(r.file)}><Route size={13} /><span className="mono">{r.path}</span><i className={cn("tag small", r.type === "API" && "alt")}>{r.type}</i></button></li>)}</ul>
          {info.routes.length === 0 && <p className="muted small pad">No routes yet. Use “Add route”.</p>}
        </TabsContent>
        <TabsContent value="components">
          <ul className="ex-list">{info.components.map((c) => <li key={c.file}><button onClick={() => onOpen(c.file)}><Boxes size={13} /><span>{c.name}</span><small className="muted">{c.file.split("/").pop()}</small></button></li>)}</ul>
          {info.components.length === 0 && <p className="muted small pad">No components yet. Use “New component”.</p>}
        </TabsContent>
        <TabsContent value="map">
          <div className="map-summary"><Network size={18} /><b>{info.edges.length}</b><span>imports across {project.files.length} files</span></div>
          <ul className="ex-list">{Array.from(new Set(info.edges.map((e) => e.to))).slice(0, 5).map((t) => <li key={t}><button onClick={() => onOpen(t)}><span className="mono">{t}</span><small className="muted">×{info.edges.filter((e) => e.to === t).length}</small></button></li>)}</ul>
          <div className="pad"><Button size="sm" onClick={() => setMapOpen(true)}><Network size={13} /> Open dependency map</Button></div>
        </TabsContent>
      </Tabs>
      <Modal open={mapOpen} onOpenChange={setMapOpen} className="wide" eyebrow="Generated" title="Dependency map" description="Who imports whom. Click a file to open it."><DependencyMap project={project} onOpen={(p) => { setMapOpen(false); onOpen(p); }} /></Modal>
      <Modal open={!!del} onOpenChange={(o) => !o && setDel(null)} title={`Delete ${del ?? ""}?`} description="Removes the file from the local project. Undo is not available for file deletes." footer={<><Button onClick={() => setDel(null)}>Cancel</Button><Button variant="danger" onClick={() => { if (del) { deleteFile(project.id, del); toast.success(`Deleted ${del}`); } setDel(null); }}>Delete file</Button></>}><span /></Modal>
    </div>
  );
}
