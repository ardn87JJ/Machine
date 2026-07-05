import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const env = (
  globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
    };
  }
).process?.env;

function resolveBasePath() {
  if (env?.GITHUB_ACTIONS !== "true") {
    return "/";
  }

  const repositoryName = env.GITHUB_REPOSITORY?.split("/")[1];

  if (!repositoryName || repositoryName.endsWith(".github.io")) {
    return "/";
  }

  return `/${repositoryName}/`;
}

export default defineConfig({
  base: resolveBasePath(),
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    restoreMocks: true,
  },
});
