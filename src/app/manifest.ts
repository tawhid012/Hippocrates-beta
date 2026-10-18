import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hippocrates AI — Clinical Intelligence Platform",
    short_name: "Hippocrates",
    description: "Dual-Engine Clinical Intelligence: Aegis for Patients and Oracle for Physicians.",
    start_url: "/",
    display: "standalone",
    background_color: "#fcfdfe",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/logo.jpg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        src: "/logo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  };
}
