import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";
import eslint from "vite-plugin-eslint2";
import { defineConfig, loadEnv } from "vite";

export default ({ mode }) => {
  // Load environment variables
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    build: {
      lib: {
        entry: path.resolve(__dirname, "src/main.tsx"),
        name: "NeoneChat", // must be a valid JS identifier
        fileName: "main",
        formats: ["es", "cjs"],
        cssFileName: "style", // optional, if you're handling CSS separately
      },
      rollupOptions: {
        external: [
          "react",
          "react-dom",
          "react-dom/server",
          "react/jsx-runtime",
          "react/jsx-dev-runtime"
        ],
        output: {
          globals: {
            react: "React",
          },
          intro: 'import "./index.css";',
        },
      },
      outDir: "../dist",
    },
    assetsInclude: ["**/*.svg", "**/*.png", "**/*.wav"],
    plugins: [
      svgr({
        svgrOptions: {
          ref: true,
        },
      }),
      react(), // no need for include option
      eslint()
    ],
    server: {
      port: 3000,
      host: true,
    },
  });
};
