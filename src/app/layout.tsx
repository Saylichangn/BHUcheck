import type { Metadata } from "next";
import "@fontsource/source-serif-4/latin-400.css";
import "@fontsource/source-serif-4/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/noto-sans-devanagari/devanagari-400.css";
import "./globals.css";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { currentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: {
    default: "BHUcheck",
    template: "%s — BHUcheck",
  },
  description:
    "Upload Maharashtra property documents, compare the details between them, and see what still needs checking with the issuing authority.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await currentUser();

  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader email={user?.email ?? null} />
        <main
          id="main"
          className="mx-auto w-full max-w-[1080px] px-4 py-8 sm:px-6 sm:py-10"
        >
          {children}
        </main>
        <SiteFooter email={user?.email ?? null} />
      </body>
    </html>
  );
}
