import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Standalone scout SaaS frontend. The same package also publishes its src as a
// component library (package.json `exports`); this vite app is the host that
// mounts the shell with the built-in "scout" mission.
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: ["vue", "vue-router"],
  },
  server: {
    port: 5190,
    host: true,
    proxy: {
      "/api": { target: "http://localhost:8100", changeOrigin: true },
    },
  },
  build: { outDir: "dist" },
});
