import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const cwd = process.cwd();
const clientDir = existsSync(path.join(cwd, "vite.config.js")) ? cwd : path.join(cwd, "client");
const result = spawnSync("npm", ["run", "build"], {
  cwd: clientDir,
  stdio: "inherit",
  shell: true,
  env: process.env,
});
process.exit(result.status ?? 1);
