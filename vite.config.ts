import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  build: {
    lib: {
      entry: { index: fileURLToPath(new URL("./src/index.ts", import.meta.url)), core: fileURLToPath(new URL("./src/core.ts", import.meta.url)) },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: { external: ["react", "react/jsx-runtime"], output: { chunkFileNames: "chunks/[name]-[hash].js", banner: chunk => chunk.name === "index" ? '"use client";' : "" } },
    sourcemap: true,
  },
});
