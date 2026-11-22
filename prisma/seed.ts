import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { governmentSources } from "../src/lib/domain/sources";

process.loadEnvFile(".env");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

async function main() {
  for (const source of governmentSources) {
    await prisma.source.upsert({
      where: { slug: source.slug },
      update: source,
      create: source,
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
