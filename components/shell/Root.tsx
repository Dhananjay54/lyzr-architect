"use client";

import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TipProvider } from "@/components/ui/tip";
import { AppProvider, useApp } from "@/lib/store";
import { Welcome } from "./Welcome";

function Gate({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  if (!state.user) return <Welcome />;
  return <>{children}</>;
}

export function Root({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MotionConfig reducedMotion="user">
        <TipProvider>
          <AppProvider>
            <Gate>{children}</Gate>
          </AppProvider>
        </TipProvider>
      </MotionConfig>
      <Toaster position="bottom-right" closeButton toastOptions={{ className: "toast" }} />
    </ThemeProvider>
  );
}
