import type { Metadata } from "next";

import "../styles/globals.css";

import { Inter as FontSans } from "next/font/google";
import localFont from "next/font/local";
import { getServerSession } from "next-auth";
import { Toaster } from "sonner";

import { siteConfig } from "@/config/site";
import { authOptions } from "@/lib/authOptions";
import { cn } from "@/lib/utils";
import { TailwindIndicator } from "@/components/ui/tailwind-indicator";
import { Providers } from "@/components/providers";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontHeading = localFont({
  src: "./fonts/CalSans-SemiBold.woff2",
  variable: "--font-heading",
});

export const metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "Tsuki Card Bot",
    "Jotsuki from SVT",
    "K-Pop card collecting",
    "Virtual trading cards",
    "Forest-themed gameplay",
    "Gorgeous cards",
    "Exclusive perks",
    "Cute roles",
    "K-Pop community",
    "Card collector bot",
    "Fun commands",
    "Booster perks",
  ],
  authors: [
    {
      name: "jomo",
      url: "https://github.com/Jomo178",
    },
  ],
  creator: "jomo",
  // themeColor: [
  //   { media: "(prefers-color-scheme: dark)", color: "#000000" },
  //   { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  // ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [{ url: `${siteConfig.url}/og.png`, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [`${siteConfig.url}/og.png`],
    creator: "@jomo",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: `${siteConfig.url}site.webmanifest`,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.querySelector('meta[name="theme-color"]').setAttribute('content', '#09090b')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontHeading.variable
        )}
      >
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">
            <Providers session={session}>
              <div vaul-drawer-wrapper="" className="bg-background">
                {children}
                <Toaster
                  position="top-right"
                  richColors
                  toastOptions={{
                    actionButtonStyle: {
                      background: "hsl(var(--primary))",
                      height: "2rem",
                    },
                  }}
                />
                <TailwindIndicator />
              </div>
            </Providers>
          </main>
        </div>
      </body>
    </html>
  );
}
