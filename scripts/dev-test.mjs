#!/usr/bin/env node
/**
 * Starts `next dev` bound to the TEST database.
 *
 * Loads .env.test via the dotenv library (not Node's --env-file, which is
 * rejected in NODE_OPTIONS when Next spawns its worker processes).
 */
import { config } from "dotenv";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
config({ path: path.join(root, ".env.test") });

if ((process.env.DATABASE_URL ?? "").includes("1249d9f4")) {
  console.error("✗ Refusing: DATABASE_URL points at the PRODUCTION DB.");
  process.exit(1);
}
console.log(
  `dev:test → DB cred ${process.env.DATABASE_URL?.split("//")[1]?.slice(0, 8)}…`,
);

const bin = path.join(root, "node_modules", ".bin", "next");
const child = spawn(bin, ["dev"], {
  stdio: "inherit",
  env: process.env,
  cwd: root,
});
child.on("exit", (code) => process.exit(code ?? 0));
