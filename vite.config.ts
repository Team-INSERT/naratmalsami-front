import { defineConfig } from "vite";
import * as path from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    dedupe: ["@ckeditor/ckeditor5-core", "@ckeditor/ckeditor5-engine", "@ckeditor/ckeditor5-utils"],
  },
  server: {
    allowedHosts: ["local.jhnara.asuscomm.com"],
  },
});
