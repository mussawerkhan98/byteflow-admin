import { readFileSync } from "node:fs";
import { join } from "node:path";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  MARKETING_DDL,
  MARKETING_TABLES,
  unsafeStatements,
} from "../app/lib/marketing-setup-ddl";

/**
 * The setup button repeats the marketing DDL so a serverless function does
 * not have to read a file from `scripts/`. These tests are what stop the two
 * copies drifting apart, and what stop anything destructive being added.
 */

const schema = readFileSync(
  join(process.cwd(), "scripts", "cms-schema.sql"),
  "utf8",
);

/** Whitespace and trailing semicolons differ harmlessly between the two. */
const normalise = (sql: string) =>
  sql.replace(/--[^\n]*/g, " ").replace(/\s+/g, " ").replace(/;\s*$/, "").trim();

test("every statement only ever creates", () => {
  assert.deepEqual(unsafeStatements(), []);
});

test("nothing in the setup DDL can drop, alter or delete", () => {
  for (const statement of MARKETING_DDL) {
    // `ON DELETE CASCADE` and `ON UPDATE` are foreign-key referential actions,
    // not commands, so they are removed before looking for real ones.
    const body = statement.replace(/\bON\s+(DELETE|UPDATE)\s+\w+(\s+\w+)?/gi, " ");
    assert.ok(
      !/\b(DROP|DELETE|TRUNCATE|ALTER|REPLACE\s+INTO|UPDATE|INSERT)\b/i.test(body),
      `destructive keyword in: ${statement.slice(0, 60)}`,
    );
  }
});

test("each marketing table has a CREATE statement", () => {
  for (const table of MARKETING_TABLES) {
    assert.ok(
      MARKETING_DDL.some((statement) =>
        new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`, "i").test(statement),
      ),
      `no CREATE for ${table}`,
    );
  }
});

test("the inlined DDL matches scripts/cms-schema.sql", () => {
  const fromFile = schema
    .split(";")
    .map(normalise)
    .filter((statement) => /^CREATE (TABLE|INDEX) IF NOT EXISTS/i.test(statement))
    .filter((statement) =>
      MARKETING_TABLES.some((table) =>
        new RegExp(`\\b${table}\\b`, "i").test(statement),
      ),
    );

  for (const statement of MARKETING_DDL) {
    assert.ok(
      fromFile.includes(normalise(statement)),
      `not found in cms-schema.sql: ${normalise(statement).slice(0, 80)}`,
    );
  }
  assert.equal(
    MARKETING_DDL.length,
    fromFile.length,
    "cms-schema.sql has marketing statements the setup button would not create",
  );
});
