import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  root: "client",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": `http://127.0.0.1:${process.env.API_PORT || 4000}` },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("recharts") ||
              id.includes("d3-") ||
              id.includes("victory")
            )
              return "charts";
            if (id.includes("@mui/") || id.includes("@emotion/")) return "ui";
            if (id.includes("@phosphor-icons")) return "icons";
            return "vendor";
          }
        },
      },
    },
  },
});
