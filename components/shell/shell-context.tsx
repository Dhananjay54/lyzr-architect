"use client";

import { createContext, useContext } from "react";

export type DialogState =
  | { kind: "github"; projectId?: string; tab?: "connection" | "repository" | "commit" }
  | { kind: "vercel"; projectId?: string }
  | { kind: "share"; projectId: string }
  | { kind: "help" }
  | { kind: "newComponent"; projectId: string }
  | { kind: "newRoute"; projectId: string }
  | { kind: "agentTask"; projectId?: string; agentId?: string; task?: string }
  | null;

export type ShellApi = {
  openPalette: () => void;
  dialog: DialogState;
  openDialog: (d: NonNullable<DialogState>) => void;
  closeDialog: () => void;
  /** Ask the developer workspace to focus a panel or file. */
  focus: { panel?: "changes" | "run" | "agent" | "explorer"; file?: string; line?: number; nonce: number } | null;
  setFocus: (f: { panel?: "changes" | "run" | "agent" | "explorer"; file?: string; line?: number }) => void;
  presenting: boolean;
  setPresenting: (v: boolean) => void;
};

export const ShellCtx = createContext<ShellApi | null>(null);
export function useShell() {
  const v = useContext(ShellCtx);
  if (!v) throw new Error("useShell outside shell");
  return v;
}
