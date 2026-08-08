import { readdir, readFile, } from "node:fs/promises";
import { join, } from "node:path";
import { db, } from "../config/db.js";
async function migrate() {
    try {
        console.log("Preparing migrations...");
        await db.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
        const migrationsDirectory = join(process.cwd(), "migrations");
        const files = (await readdir(migrationsDirectory))
            .filter((file) => file.endsWith(".sql"))
            .sort();
        for (const file of files) {
            const existing = await db.query(`
            SELECT name
            FROM schema_migrations
            WHERE name = $1
            LIMIT 1
          `, [
                file,
            ]);
            if (existing.rowCount &&
                existing.rowCount >
                    0) {
                console.log(`↪ Skipping ${file}`);
                continue;
            }
            console.log(`→ Running ${file}`);
            const sql = await readFile(join(migrationsDirectory, file), "utf8");
            await db.query(sql);
            await db.query(`
          INSERT INTO schema_migrations (
            name
          )
          VALUES ($1)
        `, [
                file,
            ]);
            console.log(`✅ ${file}`);
        }
        console.log("✅ All migrations completed.");
    }
    catch (error) {
        console.error("❌ Migration failed:", error);
        process.exitCode =
            1;
    }
    finally {
        await db.end();
    }
}
void migrate();
