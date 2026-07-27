import type { Metadata } from "next";
import { Suspense } from "react";

import Collections from "@/features/public/pages/Collections";

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore AMIGOS Fashion collections for men, women, and kids.",
};

export default function CollectionsPage() {
  return (
    <Suspense fallback={null}>
      <Collections />
    </Suspense>
  );
}
