import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: {
    default: "System prompts",
    template: "%s · System prompts",
  },
  description:
    "A quiet place to read, compare, and understand the instructions behind AI products.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <TooltipProvider delayDuration={250} skipDelayDuration={500}>
            <a
              href="#main-content"
              className="sr-only z-50 rounded bg-card px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
            >
              Skip to content
            </a>
            <Header />
            <div className="flex min-h-[calc(100svh-4rem)]">
              <main id="main-content" className="min-w-0 flex-1">
                {children}
              </main>
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
