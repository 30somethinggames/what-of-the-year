import tailwindcss from "@tailwindcss/vite";
import tanstackRouter from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tanstackRouter({ routesDirectory: "src/routes" }), react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
});
