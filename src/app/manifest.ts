import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: "Lagu personal dari ceritamu untuk orang tersayang.",
    lang: "id",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7c2fc4",
    icons: [
      { src: "/brand/ceritalagu-mark.png", sizes: "246x246", type: "image/png" },
      { src: "/brand/logo-ceritalagu.png", sizes: "500x500", type: "image/png" },
    ],
  };
}
