import jwt from "jsonwebtoken";
import { db, } from "../config/db.js";
import { env, } from "../config/env.js";
export async function requireAdmin(req, res, next) {
    try {
        const token = req.cookies?.[env.JWT_COOKIE_NAME];
        if (!token) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }
        let payload;
        try {
            payload =
                jwt.verify(token, env.JWT_SECRET, {
                    algorithms: [
                        "HS256",
                    ],
                });
        }
        catch {
            res.status(401).json({
                success: false,
                message: "Invalid or expired session.",
            });
            return;
        }
        if (typeof payload ===
            "string" ||
            !payload.sub ||
            payload.role !==
                "admin") {
            res.status(401).json({
                success: false,
                message: "Invalid session.",
            });
            return;
        }
        const result = await db.query(`
          SELECT
            id,
            username,
            name,
            email,
            role,
            is_active
          FROM admins
          WHERE id = $1
          LIMIT 1
        `, [
            payload.sub,
        ]);
        const admin = result.rows[0];
        if (!admin ||
            !admin.is_active) {
            res.status(401).json({
                success: false,
                message: "Account unavailable.",
            });
            return;
        }
        req.auth = {
            id: admin.id,
            username: admin.username,
            name: admin.name,
            email: admin.email,
            role: "admin",
        };
        next();
    }
    catch (error) {
        next(error);
    }
}
