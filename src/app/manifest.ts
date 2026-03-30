import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gyaan Vriksh — Knowledge Tree",
    short_name: "Gyaan Vriksh",
    description: "Knowledge tree powered by AI",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFBF0",
    theme_color: "#F4A236",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
