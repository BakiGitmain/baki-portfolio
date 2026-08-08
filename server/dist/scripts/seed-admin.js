import bcrypt from "bcryptjs";
import { db, } from "../config/db.js";
import { env, } from "../config/env.js";
async function seedAdmin() {
    try {
        const name = env.ADMIN_SEED_NAME;
        const username = env.ADMIN_SEED_USERNAME;
        const email = env.ADMIN_SEED_EMAIL;
        const password = env.ADMIN_SEED_PASSWORD;
        if (!name ||
            !username ||
            !email ||
            !password) {
            throw new Error("Missing ADMIN_SEED_* environment variables.");
        }
        if (password.length < 12) {
            throw new Error("Admin password must be at least 12 characters.");
        }
        const existing = await db.query(`
          SELECT id
          FROM admins
          WHERE
            LOWER(username) = LOWER($1)
            OR LOWER(email) = LOWER($2)
          LIMIT 1
        `, [
            username,
            email,
        ]);
        if (existing.rowCount &&
            existing.rowCount > 0) {
            console.log("Admin already exists.");
            return;
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const result = await db.query(`
          INSERT INTO admins (
            username,
            name,
            email,
            password_hash
          )
          VALUES (
            $1,
            $2,
            $3,
            $4
          )
          RETURNING
            id,
            username,
            name,
            email,
            role,
            created_at
        `, [
            username.trim(),
            name.trim(),
            email
                .trim()
                .toLowerCase(),
            passwordHash,
        ]);
        console.log("✅ Admin created:", result.rows[0]);
    }
    catch (error) {
        console.error("❌ Admin seed failed:", error);
        process.exitCode = 1;
    }
    finally {
        await db.end();
    }
}
void seedAdmin();
