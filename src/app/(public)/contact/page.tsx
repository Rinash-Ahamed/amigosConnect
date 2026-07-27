import type { Metadata } from "next";

import Contact from "@/features/public/pages/Contact";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact AMIGOS Fashion for products, sizing, and availability.",
};

export default function ContactPage() {
  return <Contact />;
}
