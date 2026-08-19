import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (result.status) process.exit(result.status);
}

if (process.env.RENDER) {
  console.log("Render detected — starting production API (not Vite)");
  run("npx", ["prisma", "migrate", "deploy"]);
  run("node", ["server/src/index.js"]);
  process.exit(0);
}

run("npx", [
  "concurrently",
  "-n",
  "api,web",
  "-c",
  "cyan,magenta",
  "npm run dev -w server",
  "npm run dev -w client",
]);
