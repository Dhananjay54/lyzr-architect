"use client";

import * as P from "@radix-ui/react-popover";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Popover = P.Root;
export const PopoverTrigger = P.Trigger;
export function PopoverContent({ children, className, align = "end", width }: { children: ReactNode; className?: string; align?: "start" | "center" | "end"; width?: number }) {
  return (
    <P.Portal>
      <P.Content className={cn("popover", className)} align={align} sideOffset={8} collisionPadding={12} style={width ? { width } : undefined}>{children}</P.Content>
    </P.Portal>
  );
}
