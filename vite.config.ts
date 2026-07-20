import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { sites } from "./build/sites-vite-plugin";

export default defineConfig({
  plugins: [react(), sites()],
  server: { port: 3000 },
  preview: { port: 4173 },
  build: { outDir: "dist", sourcemap: false },
});
