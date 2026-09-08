import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { VitePWA } from "vite-plugin-pwa";

// L'acces a la camera (scanner QR) exige HTTPS sur mobile (Chrome/Safari).
// @vitejs/plugin-basic-ssl fournit un certificat auto-signe pratique pour
// le developpement local ; utiliser un vrai certificat en production
// (voir docs/DEPLOYMENT.md).
export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "Chemical Stock Manager",
        short_name: "ChemStock",
        description:
          "Gestion d'inventaire de produits chimiques avec QR codes et synchronisation Excel.",
        theme_color: "#16232E",
        background_color: "#F2F4F3",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Le scanner et l'ecriture Excel exigent le reseau : on ne met en
        // cache que l'app shell, jamais les reponses API (donnees produit).
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 5173,
  },
});
