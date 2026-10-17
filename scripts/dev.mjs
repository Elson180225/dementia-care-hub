import { spawn } from "node:child_process";
if (process.argv.includes("--demo")) process.env.DATABASE_MODE = "embedded";
const nodeArgs = ["--env-file-if-exists=.env"];
async function run(file) {
  await new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [...nodeArgs, file], {
      stdio: "inherit",
      env: process.env,
    });
    p.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${file} exited ${code}`)),
    );
  });
}
if (process.argv.includes("--demo")) await run("database/seed.mjs");
const children = [
  spawn(process.execPath, [...nodeArgs, "server/index.js"], {
    stdio: "inherit",
    env: process.env,
  }),
  spawn(process.execPath, ["node_modules/vite/bin/vite.js"], {
    stdio: "inherit",
    env: process.env,
  }),
];
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
}
for (const child of children)
  child.on("exit", (code) => {
    stop();
    process.exitCode = code || 0;
  });
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
