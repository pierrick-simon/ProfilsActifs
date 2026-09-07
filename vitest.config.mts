import { defineConfig } from "vitest/config";
import path from "path";
import os from "os";
import fs from "fs";

// Isolated from the real uploads/ directory used by `next dev` — tests never touch it.
const testUploadsDir = fs.mkdtempSync(path.join(os.tmpdir(), "video-provider-tests-"));

export default defineConfig({
  test: {
    environment: "node",
    env: {
      UPLOADS_DIR: testUploadsDir,
    },
  },
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
});
