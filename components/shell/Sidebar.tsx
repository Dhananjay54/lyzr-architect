"use client";

import { motion } from "framer-motion";
import {
  Bot, Box, ChevronsLeft, ChevronsRight, HelpCircle, Home, Laptop, LayoutTemplate, LogOut, Moon,
  PanelsTopLeft, RotateCcw, Settings, Sparkles, Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo, Segmented, Status } from "@/components/ui/bits";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Tip } from "@/components/ui/tip";
import { useApp } from "@/lib/store";
import type { ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useShell } from "./shell-context";

export const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/projects", label: "Projects", icon: PanelsTopLeft },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/integrations", label: "Integrations", icon: Box },
];

export const statusTone: Record<ProjectStatus, "neutral" | "accent" | "success" | "info"> = { draft: "neutral", building: "accent", ready: "success", deployed: "info" };
export const statusLabel: Record<ProjectStatus, string> = { draft: "Draft", building: "Building", ready: "Ready", deployed: "Deployed" };

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function UserMenu({ children, side = "right" }: { children: React.ReactNode; side?: "right" | "top" }) {
  const { state, setTheme, signOut, resetDemo, openTour } = useApp();
  const { openDialog } = useShell();
  const router = useRouter();
  const theme = state.preferences.theme;
  return (
    <Menu>
      <MenuTrigger asChild>{children}</MenuTrigger>
      <MenuContent align={side === "top" ? "end" : "start"} width={260}>
        <div className="menu-user">
          <span className="avatar">{state.user?.name.slice(0, 2).toUpperCase()}</span>
          <span><b>{state.user?.name}</b><small>{state.user?.email ?? "Guest session"}</small></span>
        </div>
        <MenuSeparator />
        <MenuLabel>Appearance</MenuLabel>
        <div className="menu-theme" onPointerDown={(e) => e.stopPropagation()}>
          <Segmented
            label="Theme"
            value={theme}
            onChange={setTheme}
            options={[
              { value: "light", label: <><Sun size={13} /> Light</>, title: "Light theme" },
              { value: "dark", label: <><Moon size={13} /> Dark</>, title: "Dark theme" },
              { value: "system", label: <><Laptop size={13} /> System</>, title: "System theme" },
            ]}
          />
        </div>
        <MenuSeparator />
        <MenuItem icon={<Settings size={14} />} onSelect={() => router.push("/settings")}>Settings</MenuItem>
        <MenuItem icon={<Sparkles size={14} />} onSelect={() => { const p = state.projects.find((x) => x.id === state.activeProjectId) ?? state.projects[0]; if (p) router.push(`/project/${p.id}`); openTour(); }}>Replay workspace tour</MenuItem>
        <MenuItem icon={<HelpCircle size={14} />} hint="?" onSelect={() => openDialog({ kind: "help" })}>Help and shortcuts</MenuItem>
        <MenuSeparator />
        <MenuItem icon={<RotateCcw size={14} />} onSelect={resetDemo}>Reset demo data</MenuItem>
        <MenuItem icon={<LogOut size={14} />} onSelect={signOut}>Sign out</MenuItem>
      </MenuContent>
    </Menu>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { state } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try { setCollapsed(sessionStorage.getItem("architect2:sidebar") === "1"); } catch { /* ignore */ }
  }, []);
  const toggle = () => setCollapsed((c) => { try { sessionStorage.setItem("architect2:sidebar", c ? "0" : "1"); } catch { /* ignore */ } return !c; });
  const recent = [...state.projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);

  return (
    <aside className={cn("sidebar", collapsed && "collapsed")} data-tour="nav" aria-label="Primary">
      <div className="sidebar-top">
        <Link href="/" aria-label="Lyzr Architect home"><Logo compact={collapsed} /></Link>
        <Tip label={collapsed ? "Expand sidebar" : "Collapse sidebar"} side="right">
          <button className="btn ghost icon sm collapse-btn" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={toggle}>
            {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
          </button>
        </Tip>
      </div>
      <nav className="nav">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          const link = (
            <Link key={href} href={href} className={cn("nav-item", active && "active")} aria-current={active ? "page" : undefined}>
              {active && <motion.span layoutId="nav-active" className="nav-pill" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
              <Icon size={16} /><span className="nav-label">{label}</span>
            </Link>
          );
          return collapsed ? <Tip key={href} label={label} side="right">{link}</Tip> : link;
        })}
      </nav>
      {!collapsed && (
        <div className="recent">
          <div className="section-label">Recent</div>
          {recent.map((p) => (
            <Link key={p.id} href={`/project/${p.id}`} className={cn("recent-item", pathname.startsWith(`/project/${p.id}`) && "active")}>
              <span className={cn("dot", `dot-${p.status}`)} aria-hidden />
              <span className="recent-name">{p.name}</span>
              <Status tone={statusTone[p.status]} dot={false} busy={p.status === "building"}>{statusLabel[p.status]}</Status>
            </Link>
          ))}
        </div>
      )}
      <div className="sidebar-bottom">
        <UserMenu>
          <button className="profile" aria-label="Account menu">
            <span className="avatar">{state.user?.name.slice(0, 2).toUpperCase()}</span>
            {!collapsed && <span className="profile-text"><b>{state.user?.name}</b><small>Personal workspace</small></span>}
          </button>
        </UserMenu>
      </div>
    </aside>
  );
}

export function MobileTabs() {
  const pathname = usePathname();
  return (
    <nav className="mobile-tabs" aria-label="Primary">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={cn(isActive(pathname, href) && "active")} aria-current={isActive(pathname, href) ? "page" : undefined}>
          <Icon size={18} /><span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
