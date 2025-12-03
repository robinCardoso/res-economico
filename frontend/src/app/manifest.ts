import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => ({
  name: "Rede União Nacional",
  short_name: "Rede União",
  description:
    "Sistema completo de gestão para a Rede União Nacional - Resultado econômico, importação de planilhas e análise inteligente.",
  start_url: "/",
  display: "standalone",
  background_color: "#0f172a",
  theme_color: "#0f172a",
  lang: "pt-BR",
  orientation: "portrait-primary",
  icons: [
    {
      src: "/minha-logo.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: "/minha-logo.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: "/favicon.ico",
      sizes: "48x48",
      type: "image/x-icon",
    },
  ],
});

export default manifest;

