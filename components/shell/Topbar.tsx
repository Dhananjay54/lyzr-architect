"use client";

import {
  Bell, ChevronsUpDown, Command, ExternalLink, HelpCircle, Maximize2, MoreHorizontal, Plus, Redo2, Rocket, Search, Share2, Undo2,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Segmented, Status } from "@/components/ui/bits";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tip } from "@/components/ui/tip";
import { useApp } from "@/lib/store";
import { ago, cn } from "@/lib/utils";
import { statusLabel, statusTone } from "./Sidebar";
import { useShell } from "./shell-context";

const TITLES: [string, string][] = [
  ["/projects", "Projects"], ["/agents/new", "Agent builder"], ["/agents", "Agents"], ["/templates", "Templates"],
  ["/integrations", "Integrations"], ["/settings", "Settings"], ["/new", "New project"], ["/import", "Import project"],
];

function Notifications() {
  const { state, markNotificationsSeen } = useApp();
  const router = useRouter();
  const unread = state.activity.filter((a) => a.at > state.notificationsSeenAt).length;
  return (
    <Popover onOpenChange={(open) => { if (!open && unread) markNotificationsSeen(); }}>
      <Tip label="Activity">
        <PopoverTrigger asChild>
          <button className="btn ghost icon" aria-label={`Activity${unread ? `, ${unread} new` : ""}`}>
            <Bell size={16} />
            {unread > 0 && <span className="badge-dot" aria-hidden>{unread}</span>}
          </button>
        </PopoverTrigger>
      </Tip>
      <PopoverContent width={340} className="notif">
        <div className="notif-head"><b>Activity</b><span>{state.activity.length} events</span></div>
        <div className="notif-list">
          {state.activity.slice(0, 8).map((a) => (
            <button key={a.id} className="notif-item" onClick={() => a.projectId && router.push(`/project/${a.projectId}`)}>
              <i className={cn("notif-dot", a.tone)} aria-hidden />
              <span>{a.text}<small>{ago(a.at)}</small></span>
            </button>
          ))}
        </div>
        <Link href="/projects" className="notif-foot">View all projects</Link>
      </PopoverContent>
    </Popover>
  );
}

export function Topbar() {
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const { state, getProject, setMode, undo, redo } = useApp();
  const { openPalette, openDialog, setPresenting } = useShell();

  const onProject = pathname.startsWith("/project/") && params.id;
  const project = onProject ? getProject(params.id) : undefined;
  const onWorkspace = !!project && pathname === `/project/${project.id}`;
  const title = TITLES.find(([p]) => pathname === p || pathname.startsWith(p + "/"))?.[1] ?? (pathname === "/" ? "Home" : "");
  const building = project?.status === "building";

  const openPreview = () => {
    if (!project) return;
    const latest = project.deployments[0];
    if (latest) window.open(`/deployed/${latest.id}`, "_blank");
    else toast("No deployment yet", { description: "Deploy first, then the static preview opens here.", action: { label: "Deploy", onClick: () => router.push(`/project/${project.id}/deploy`) } });
  };

  return (
    <header className="topbar">
      <div className="tb-left">
        {project ? (
          <Menu>
            <MenuTrigger asChild>
              <button className="proj-switch" aria-label="Switch project">
                <span className="proj-name">{project.name}</span>
                <ChevronsUpDown size={14} />
              </button>
            </MenuTrigger>
            <MenuContent align="start" width={280}>
              <MenuLabel>Projects</MenuLabel>
              {state.projects.map((p) => (
                <MenuItem key={p.id} onSelect={() => router.push(`/project/${p.id}`)} hint={<Status tone={statusTone[p.status]} dot={false}>{statusLabel[p.status]}</Status>}>{p.name}</MenuItem>
              ))}
              <MenuSeparator />
              <MenuItem icon={<Plus size={14} />} onSelect={() => router.push("/new")}>New project</MenuItem>
              <MenuItem onSelect={() => router.push("/projects")}>All projects</MenuItem>
            </MenuContent>
          </Menu>
        ) : (
          <h2 className="tb-title">{title}</h2>
        )}
        {project && <Status tone={statusTone[project.status]} busy={building}>{statusLabel[project.status]}</Status>}
        {project && onWorkspace && !building && (
          <div className="tb-history">
            <Tip label="Undo last change"><button className="btn ghost icon sm" aria-label="Undo" disabled={!project.history.past.length} onClick={() => undo(project.id)}><Undo2 size={15} /></button></Tip>
            <Tip label="Redo"><button className="btn ghost icon sm" aria-label="Redo" disabled={!project.history.future.length} onClick={() => redo(project.id)}><Redo2 size={15} /></button></Tip>
          </div>
        )}
      </div>

      <div className="tb-right" data-tour="actions">
        {project && onWorkspace && !building && !(project.origin === "import" && !project.importReviewed) && (
          <Segmented
            className="tb-mode"
            label="Workspace mode"
            value={project.workspaceMode}
            onChange={(m) => setMode(project.id, m)}
            options={[{ value: "build", label: "Build" }, { value: "developer", label: "Developer" }]}
          />
        )}
        <button className="search-pill" onClick={openPalette} aria-label="Search or run a command">
          <Search size={14} /><span>Search or run…</span><kbd className="kbd">⌘K</kbd>
        </button>
        {project && !building && (
          <>
            <Tip label="Present preview"><button className="btn ghost icon tb-desktop" aria-label="Present preview" onClick={() => { if (pathname !== `/project/${project.id}`) router.push(`/project/${project.id}`); setPresenting(true); }}><Maximize2 size={16} /></button></Tip>
            <Tip label="Open deployed preview"><button className="btn ghost icon tb-desktop" aria-label="Open deployed preview" onClick={openPreview}><ExternalLink size={16} /></button></Tip>
            <Button className="tb-desktop" onClick={() => openDialog({ kind: "share", projectId: project.id })}><Share2 size={14} /> Share</Button>
          </>
        )}
        <Notifications />
        <Tip label="Help and shortcuts"><button className="btn ghost icon tb-desktop" aria-label="Help" onClick={() => openDialog({ kind: "help" })}><HelpCircle size={16} /></button></Tip>
        {!project && <Button variant="primary" onClick={() => router.push("/new")}><Plus size={15} /> <span className="hide-sm">New project</span></Button>}
        {project && !building && pathname !== `/project/${project.id}/deploy` && (
          <Button variant="primary" onClick={() => router.push(`/project/${project.id}/deploy`)} data-tour="deploy"><Rocket size={15} /> Deploy</Button>
        )}
        <Menu>
          <MenuTrigger asChild><button className="btn ghost icon tb-mobile" aria-label="More actions"><MoreHorizontal size={17} /></button></MenuTrigger>
          <MenuContent width={230}>
            <MenuItem icon={<Command size={14} />} onSelect={openPalette}>Search or run…</MenuItem>
            {project && onWorkspace && (
              <>
                <MenuItem icon={<Undo2 size={14} />} disabled={!project.history.past.length} onSelect={() => undo(project.id)}>Undo</MenuItem>
                <MenuItem icon={<Redo2 size={14} />} disabled={!project.history.future.length} onSelect={() => redo(project.id)}>Redo</MenuItem>
                <MenuItem onSelect={() => setMode(project.id, project.workspaceMode === "build" ? "developer" : "build")}>Switch to {project.workspaceMode === "build" ? "Developer" : "Build"} mode</MenuItem>
                <MenuItem icon={<Maximize2 size={14} />} onSelect={() => setPresenting(true)}>Present preview</MenuItem>
              </>
            )}
            {project && <MenuItem icon={<Share2 size={14} />} onSelect={() => openDialog({ kind: "share", projectId: project.id })}>Share</MenuItem>}
            <MenuItem icon={<HelpCircle size={14} />} onSelect={() => openDialog({ kind: "help" })}>Help and shortcuts</MenuItem>
          </MenuContent>
        </Menu>
      </div>
    </header>
  );
}
