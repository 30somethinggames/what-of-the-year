import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import tanstackRouter from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // framer-motion and Sentry are large and change on their own schedule;
        // their own chunks keep them out of the entry and cached across releases.
        codeSplitting: {
          groups: [
            { name: "framer-motion", test: /node_modules[/\\]framer-motion[/\\]/ },
            { name: "sentry", test: /node_modules[/\\]@sentry[/\\]/ },
          ],
        },
      },
    },
    sourcemap: true,
  },
  plugins: [
    // Each route's component becomes its own lazily imported chunk.
    tanstackRouter({ autoCodeSplitting: true, routesDirectory: "src/routes" }),
    react(),
    tailwindcss(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        filesToDeleteAfterUpload: ["./dist/**/*.map"],
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ["woty.seery.app"],
  },
});
