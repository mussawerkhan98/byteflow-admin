import "server-only";
import { db } from "./db";
import { MARKETING_DDL, MARKETING_TABLES, unsafeStatements } from "./marketing-setup-ddl";

export { MARKETING_DDL, MARKETING_TABLES, unsafeStatements };

/**
 * Creating the marketing tables from inside the admin panel, for anyone who
 * cannot run `npm run db:migrate` from a terminal.
 *
 * Every statement is `IF NOT EXISTS`, so running this against a database that
 * already has the tables changes nothing.
 */

/** Which of the marketing tables are not in the database yet. */
export async function missingTables(): Promise<string[]> {
  const found = new Set<string>();
  try {
    const result = await db.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table'",
    );
    for (const row of result.rows) {
      found.add(String((row as unknown as Record<string, unknown>).name ?? ""));
    }
  } catch {
    // If the database cannot be read at all, treat every table as missing:
    // the screen then offers setup rather than an empty list.
    return [...MARKETING_TABLES];
  }
  return MARKETING_TABLES.filter((table) => !found.has(table));
}

export async function marketingTablesReady(): Promise<boolean> {
  return (await missingTables()).length === 0;
}

/**
 * Creates whatever is missing and reports what the database looked like
 * before and after, so the panel can say plainly what it did.
 */
export async function createMarketingTables(): Promise<{
  created: string[];
  stillMissing: string[];
}> {
  const unsafe = unsafeStatements();
  if (unsafe.length) {
    throw new Error("Refusing to run: setup contains a non-creating statement.");
  }
  const before = await missingTables();
  for (const statement of MARKETING_DDL) {
    await db.execute(statement);
  }
  const after = await missingTables();
  return {
    created: before.filter((table) => !after.includes(table)),
    stillMissing: after,
  };
}
