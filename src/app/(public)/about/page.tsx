import type { Metadata } from "next";

import About from "@/features/public/pages/About";

export const metadata: Metadata = {
  title: "About",
  description: "The story and values behind AMIGOS Fashion.",
};

export default function AboutPage() {
  return <About />;
}
