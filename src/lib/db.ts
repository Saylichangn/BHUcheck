import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "@/lib/env";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

let client: PrismaClient | undefined;

function getClient() {
  if (!client) {
    client =
      globalForPrisma.prisma ??
      new PrismaClient({
        adapter: new PrismaPg(getEnv().DATABASE_URL),
      });

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = client;
    }
  }

  return client;
}

/**
 * Lazily created Prisma client.
 *
 * The client connects on first property access rather than at module load, so
 * `next build` does not need DATABASE_URL while it collects page data. At
 * runtime the first query still requires DATABASE_URL and will fail clearly
 * if it is not configured.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const activeClient = getClient();
    const value = Reflect.get(activeClient, property);

    return typeof value === "function" ? value.bind(activeClient) : value;
  },
});
