import type { Metadata } from "next";

import { AppClient } from "@/features/connect/AppClient";

export const metadata: Metadata = {
  title: "Connect",
  description: "Secure AMIGOS staff and management portal.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConnectPage() {
  return <div className="connect-site"><AppClient /></div>;
}
