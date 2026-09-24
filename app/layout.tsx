import type { Metadata, Viewport } from "next";
import { Root } from "@/components/shell/Root";
import "./globals.css";
import "./ui.css";
import "./shell.css";
import "./screens.css";
import "./workspace.css";

export const metadata: Metadata = {
  title: "Lyzr Architect",
  description: "Describe an app, shape it with agents, and take it to deployment in one flow.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Root>{children}</Root>
      </body>
    </html>
  );
}
