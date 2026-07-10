/**
 * Seed script — creates a small set of test users and a demo league for
 * manual QA. Idempotent: running it multiple times is safe.
 *
 * Usage:
 *   npx prisma db seed
 *   # or directly:
 *   npx tsx prisma/seed.js
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { config as loadEnv } from "dotenv";

// Next.js loads .env.local before .env — mirror that here too.
loadEnv({ path: ".env.local" });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const TEST_USERS = [
  {
    email: "alice@example.com",
    displayName: "Alice",
    isAdmin: true,
  },
  {
    email: "bob@example.com",
    displayName: "Bob",
    isAdmin: false,
  },
  {
    email: "carol@example.com",
    displayName: "Carol",
    isAdmin: false,
  },
];

async function main() {
  console.log("Seeding test users…");

  const users = [];
  for (const u of TEST_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        emailVerified: new Date(),
        displayName: u.displayName,
        isAdmin: u.isAdmin,
      },
      update: {
        displayName: u.displayName,
        isAdmin: u.isAdmin,
      },
    });
    users.push(user);
    console.log(`  ✓ ${user.email} (${user.id})`);
  }

  console.log("\nSeeding demo league…");

  const alice = users[0];
  const demoLeague = await prisma.league.upsert({
    where: { joinCode: "DEMO01" },
    create: {
      name: "Demo League",
      description: "Seeded league for local QA",
      joinCode: "DEMO01",
      createdById: alice.id,
    },
    update: {
      description: "Seeded league for local QA",
    },
  });
  console.log(`  ✓ ${demoLeague.name} (code: ${demoLeague.joinCode})`);

  console.log("\nAdding league memberships…");
  for (const u of users) {
    await prisma.leagueMember.upsert({
      where: {
        leagueId_userId: { leagueId: demoLeague.id, userId: u.id },
      },
      create: {
        leagueId: demoLeague.id,
        userId: u.id,
        isAdmin: u.id === alice.id,
      },
      update: {
        isAdmin: u.id === alice.id,
      },
    });
    console.log(`  ✓ ${u.displayName} in ${demoLeague.name}`);
  }

  console.log("\nSeed complete.\n");
  console.log("Join code:  DEMO01");
  console.log("Users:");
  for (const u of users) {
    console.log(`  ${u.email.padEnd(24)} ${u.isAdmin ? "(admin)" : ""}`);
  }
  console.log(
    "\nSign in via the app using magic link to one of these emails (or the same email in a real inbox you control).",
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
