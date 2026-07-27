import { PublicShell } from "@/features/public/PublicShell";
import "@/features/public/styles/public-site.css";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PublicShell>{children}</PublicShell>;
}
