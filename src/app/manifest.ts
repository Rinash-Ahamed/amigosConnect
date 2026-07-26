import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AMIGOS Connect",
    short_name: "AMIGOS",
    description: "Staff management, attendance, leave, advances, and payroll.",
    start_url: "/",
    display: "standalone",
    background_color: "#080b10",
    theme_color: "#080b10",
    orientation: "any",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
