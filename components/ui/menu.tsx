"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Menu = Dropdown.Root;
export const MenuTrigger = Dropdown.Trigger;

export function MenuContent({ children, className, align = "end", width }: { children: ReactNode; className?: string; align?: "start" | "center" | "end"; width?: number }) {
  return (
    <Dropdown.Portal>
      <Dropdown.Content className={cn("menu", className)} align={align} sideOffset={8} collisionPadding={12} style={width ? { width } : undefined}>
        {children}
      </Dropdown.Content>
    </Dropdown.Portal>
  );
}

export function MenuItem({ children, onSelect, icon, hint, danger, disabled }: { children: ReactNode; onSelect?: () => void; icon?: ReactNode; hint?: ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <Dropdown.Item className={cn("menu-item", danger && "danger")} onSelect={onSelect} disabled={disabled}>
      {icon && <span className="menu-icon">{icon}</span>}
      <span className="menu-text">{children}</span>
      {hint && <span className="menu-hint">{hint}</span>}
    </Dropdown.Item>
  );
}

export const MenuSeparator = () => <Dropdown.Separator className="menu-sep" />;
export const MenuLabel = ({ children }: { children: ReactNode }) => <Dropdown.Label className="menu-label">{children}</Dropdown.Label>;
