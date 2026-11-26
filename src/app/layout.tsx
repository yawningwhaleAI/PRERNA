import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Shell } from "@/components/shell";
import { existsSync } from "node:fs";
import path from "node:path";

/** The UP Government emblem is shown only if public/up-emblem.png exists (checked at build). */
const HAS_UP_EMBLEM = existsSync(path.join(process.cwd(), "public", "up-emblem.png"));

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Prerna 360",
  description: "Decision support for the Prerna Aggregation Centres (UPSRLM × GDi)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <StoreProvider>
          <Shell hasUpEmblem={HAS_UP_EMBLEM}>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
