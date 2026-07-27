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
      { url: "/fashion-favicon.svg", type: "image/svg+xml" },
      { url: "/fashion-logo.png", type: "image/png" },
    ],
    apple: "/fashion-logo.png",
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
