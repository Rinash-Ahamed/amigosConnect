import type { Metadata } from "next";

import SizeGuide from "@/features/public/pages/SizeGuide";

export const metadata: Metadata = {
  title: "Size Guide",
  description: "AMIGOS Fashion sizing reference for men, women, and kids.",
};

export default function SizeGuidePage() {
  return <SizeGuide />;
}
