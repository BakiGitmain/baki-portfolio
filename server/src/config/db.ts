import pg from "pg";

import { env } from "./env.js";

const {
  Pool,
} = pg;

export const db =
  new Pool({
    connectionString:
      env.DATABASE_URL,

    max: 5,

    idleTimeoutMillis:
      30_000,

    connectionTimeoutMillis:
      10_000,
  });

db.on(
  "error",
  (error) => {
    console.error(
      "Unexpected PostgreSQL error:",
      error,
    );
  },
);

export async function testDatabaseConnection() {
  const result =
    await db.query<{
      now: Date;
    }>(
      "SELECT NOW() AS now",
    );

  return result.rows[0]?.now;
}