"use client";

import { LayoutGrid, List, MoreHorizontal, Pencil, Plus, Search, Trash2, Copy, ArrowUpRight, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SiteThumb } from "@/components/preview/SitePreview";
import { statusLabel, statusTone } from "@/components/shell/Sidebar";
import { Button } from "@/components/ui/button";
import { Empty, Field, Segmented, Spotlight, Status } from "@/components/ui/bits";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Modal } from "@/components/ui/overlay";
import { useApp } from "@/lib/store";
import type { Project, ProjectStatus } from "@/lib/types";
import { ago } from "@/lib/utils";

export function ProjectsPage() {
  const router = useRouter();
  const { state, deleteProject, duplicateProject, renameProject } = useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | ProjectStatus>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [renaming, setRenaming] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [deleting, setDeleting] = useState<Project | null>(null);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.projects
      .filter((p) => (filter === "all" || p.status === filter) && (!term || `${p.name} ${p.description} ${p.framework}`.toLowerCase().includes(term)))
      .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : b.updatedAt.localeCompare(a.updatedAt)));
  }, [state.projects, q, filter, sort]);

  const rowMenu = (p: Project) => (
    <Menu>
      <MenuTrigger asChild><button className="btn ghost icon sm" aria-label={`Actions for ${p.name}`} onClick={(e) => e.stopPropagation()}><MoreHorizontal size={16} /></button></MenuTrigger>
      <MenuContent width={200}>
        <MenuItem icon={<ArrowUpRight size={14} />} onSelect={() => router.push(`/project/${p.id}`)}>Open workspace</MenuItem>
        <MenuItem icon={<Pencil size={14} />} onSelect={() => { setRenaming(p); setName(p.name); }}>Rename</MenuItem>
        <MenuItem icon={<Copy size={14} />} onSelect={() => { const id = duplicateProject(p.id); toast.success(`Duplicated ${p.name}`, { action: id ? { label: "Open", onClick: () => router.push(`/project/${id}`) } : undefined }); }}>Duplicate</MenuItem>
        <MenuSeparator />
        <MenuItem icon={<Trash2 size={14} />} danger onSelect={() => setDeleting(p)}>Delete</MenuItem>
      </MenuContent>
    </Menu>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div><p className="eyebrow">Your work</p><h1>Projects with room to move.</h1><p className="lede">Start a new direction, import something you already have, or open a workspace and carry on.</p></div>
        <div className="row"><Button onClick={() => router.push("/import")}><Upload size={15} /> Import</Button><Button variant="primary" onClick={() => router.push("/new")}><Plus size={15} /> New project</Button></div>
      </div>

      <div className="toolbar">
        <label className="search-field"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects" aria-label="Search projects" /></label>
        <Segmented label="Filter by status" value={filter} onChange={setFilter} options={[
          { value: "all", label: "All" }, { value: "ready", label: "Ready" }, { value: "deployed", label: "Deployed" }, { value: "building", label: "Building" }, { value: "draft", label: "Draft" },
        ]} />
        <span className="spacer" />
        <Segmented label="Sort" value={sort} onChange={setSort} options={[{ value: "recent", label: "Recent" }, { value: "name", label: "Name" }]} />
        <Segmented label="View" value={view} onChange={setView} options={[{ value: "grid", label: <LayoutGrid size={14} />, title: "Grid" }, { value: "list", label: <List size={14} />, title: "List" }]} />
      </div>

      {list.length === 0 ? (
        <Empty icon={<Search size={20} />} title="No projects match" body={q ? `Nothing matches “${q}” with this filter.` : "There are no projects with this status yet."} action={<Button onClick={() => { setQ(""); setFilter("all"); }}>Clear filters</Button>} />
      ) : view === "grid" ? (
        <div className="grid-cards">
          {list.map((p) => (
            <Spotlight key={p.id} as="article" className="project-card">
              <Link href={`/project/${p.id}`} className="pc-link" aria-label={`Open ${p.name}`}><SiteThumb site={p.site} /></Link>
              <div className="pc-body">
                <div className="pc-top"><h3><Link href={`/project/${p.id}`}>{p.name}</Link></h3>{rowMenu(p)}</div>
                <p>{p.description}</p>
                <div className="pc-meta"><Status tone={statusTone[p.status]} busy={p.status === "building"}>{statusLabel[p.status]}</Status><span className="tag">{p.framework}</span><span>{ago(p.updatedAt)}</span></div>
              </div>
            </Spotlight>
          ))}
        </div>
      ) : (
        <div className="table">
          <div className="tr th"><span>Project</span><span>Status</span><span>Framework</span><span>Updated</span><span /></div>
          {list.map((p) => (
            <div key={p.id} className="tr" onClick={() => router.push(`/project/${p.id}`)} role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") router.push(`/project/${p.id}`); }}>
              <span className="tr-name"><b>{p.name}</b><small>{p.description}</small></span>
              <span><Status tone={statusTone[p.status]} busy={p.status === "building"}>{statusLabel[p.status]}</Status></span>
              <span><span className="tag">{p.framework}</span></span>
              <span className="muted">{ago(p.updatedAt)}</span>
              <span>{rowMenu(p)}</span>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)} title="Rename project" footer={<><Button onClick={() => setRenaming(null)}>Cancel</Button><Button variant="primary" disabled={!name.trim()} onClick={() => { if (renaming) { renameProject(renaming.id, name.trim()); toast.success("Project renamed"); } setRenaming(null); }}>Save</Button></>}>
        <Field label="PROJECT NAME"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && name.trim() && renaming) { renameProject(renaming.id, name.trim()); setRenaming(null); toast.success("Project renamed"); } }} /></Field>
      </Modal>
      <Modal open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title={`Delete ${deleting?.name ?? ""}?`} description="This removes the project from this session. Seeded projects return if you reset demo data." footer={<><Button onClick={() => setDeleting(null)}>Keep it</Button><Button variant="danger" onClick={() => { if (deleting) { deleteProject(deleting.id); toast.success(`Deleted ${deleting.name}`); } setDeleting(null); }}>Delete project</Button></>}>
        <p className="note">{deleting?.deployments.length ? `${deleting.deployments.length} simulated deployment(s) will also be removed.` : "No deployments are attached."}</p>
      </Modal>
    </div>
  );
}
