import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// IMPORTANT: GitHub Pages serves this app from a subpath like
//   https://USERNAME.github.io/REPO/
// Set `base` to "/<your-repo-name>/" (keep the leading and trailing slash).
// Change "im-blumenladen" below to your actual repository name.
const base = "/im-blumenladen/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Precache the app shell so the app runs fully offline once installed.
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2}"],
      },
      manifest: {
        name: "Im Blumenladen",
        short_name: "Blumenladen",
        description: "Learn the German you need to work in a German flower shop.",
        // Relative scope/start_url so the PWA installs correctly under the
        // GitHub Pages subpath (not hard-coded to "/").
        scope: ".",
        start_url: ".",
        display: "standalone",
        background_color: "#FBFAF5",
        theme_color: "#2F4A3C",
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
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});
