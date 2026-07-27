import type { Metadata } from "next";

import Home from "@/features/public/pages/Home";

export const metadata: Metadata = {
  title: {
    absolute: "AMIGOS Fashion",
  },
  description:
    "Discover curated fashion collections for men, women, and kids at AMIGOS Fashion.",
};

export default function PublicHomePage() {
  return <Home />;
}
