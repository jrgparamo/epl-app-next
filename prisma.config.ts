import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js loads .env.local before .env — mirror that precedence for the CLI.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.js",
  },
  datasource: {
    // Use process.env directly so commands that don't need a DB (e.g. `prisma generate`)
    // don't fail when DATABASE_URL is missing.
    url: process.env.DATABASE_URL ?? "",
  },
});
