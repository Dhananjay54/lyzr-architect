"use client";

import * as T from "@radix-ui/react-tabs";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Tabs = T.Root;
export const TabsContent = ({ value, children, className }: { value: string; children: ReactNode; className?: string }) => (
  <T.Content value={value} className={cn("tabs-content", className)}>{children}</T.Content>
);
export function TabsList({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return <T.List className={cn("tabs-list", className)} aria-label={label}>{children}</T.List>;
}
export const TabsTrigger = ({ value, children, count }: { value: string; children: ReactNode; count?: number }) => (
  <T.Trigger value={value} className="tab">{children}{typeof count === "number" && <span className="tab-count">{count}</span>}</T.Trigger>
);
