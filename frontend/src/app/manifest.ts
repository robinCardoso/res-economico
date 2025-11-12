import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => ({
  name: "Resultado Econômico",
  short_name: "ResEco",
  description:
    "Sistema de resultado econômico com importação de planilhas e análise inteligente.",
  start_url: "/",
  display: "standalone",
  background_color: "#0f172a",
  theme_color: "#0f172a",
  lang: "pt-BR",
  orientation: "portrait-primary",
  icons: [
    {
      src: "/icons/icon-192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/icons/icon-512.png",
      sizes: "512x512",
      type: "image/png",
    },
    {
      src: "/favicon.ico",
      sizes: "48x48",
      type: "image/x-icon",
    },
  ],
});

export default manifest;

