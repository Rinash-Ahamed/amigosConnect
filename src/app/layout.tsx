import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter, Playfair_Display } from "next/font/google";

import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AMIGOS Fashion",
    template: "%s | AMIGOS Fashion",
  },
  description:
    "Curated fashion collections for men, women, and kids at AMIGOS Fashion.",
  applicationName: "AMIGOS Fashion",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/fashion-favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/fashion-logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon-152.png", sizes: "152x152", type: "image/png" },
      { url: "/apple-touch-icon-167.png", sizes: "167x167", type: "image/png" },
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "AMIGOS Connect",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#080b10",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        {children}
        <ServiceWorkerRegistration />
        <Analytics />
      </body>
    </html>
  );
}
