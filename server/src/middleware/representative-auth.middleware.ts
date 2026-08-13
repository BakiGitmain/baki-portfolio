import type {
  NextFunction,
  Request,
  Response,
} from "express";

import jwt, {
  type JwtPayload,
} from "jsonwebtoken";

import {
  db,
} from "../config/db.js";

import {
  env,
} from "../config/env.js";

/* =========================================================
   REQUIRE REPRESENTATIVE
   ========================================================= */

export async function requireRepresentative(
  req:
    Request,

  res:
    Response,

  next:
    NextFunction,
) {
  try {
    const token =
      req.cookies?.[
        env
          .REP_JWT_COOKIE_NAME
      ] as
        | string
        | undefined;

    if (
      !token
    ) {
      res
        .status(
          401,
        )
        .json({
          success:
            false,

          message: {
            en:
              "Representative authentication required.",

            am:
              "የSales Representative መግቢያ ያስፈልጋል።",
          },
        });

      return;
    }

    let payload:
      | string
      | JwtPayload;

    try {
      payload =
        jwt.verify(
          token,

          env.JWT_SECRET,

          {
            algorithms: [
              "HS256",
            ],
          },
        );
    } catch {
      res
        .status(
          401,
        )
        .json({
          success:
            false,

          message: {
            en:
              "Invalid or expired representative session.",

            am:
              "የRepresentative session ጊዜው አልፏል ወይም ትክክል አይደለም።",
          },
        });

      return;
    }

    if (
      typeof payload ===
        "string" ||
      !payload.sub ||
      payload.role !==
        "representative"
    ) {
      res
        .status(
          401,
        )
        .json({
          success:
            false,

          message: {
            en:
              "Invalid representative session.",

            am:
              "የRepresentative session ትክክል አይደለም።",
          },
        });

      return;
    }

    const result =
      await db.query(
        `
          SELECT
            id,
            username,
            COALESCE(
              NULLIF(TRIM(display_name), ''),
              name
            ) AS name,
            email,
            role,
            is_active,
            must_change_password,
            session_version,
            active_ban.reason AS ban_reason,
            active_ban.banned_until,
            active_ban.is_permanent AS ban_is_permanent
          FROM sales_representatives representative
          LEFT JOIN LATERAL (
            SELECT
              ban.reason,
              ban.banned_until,
              ban.is_permanent
            FROM partner_bans ban
            WHERE
              ban.representative_id = representative.id
              AND ban.ended_at IS NULL
              AND (
                ban.is_permanent = TRUE
                OR ban.banned_until > NOW()
              )
            ORDER BY ban.started_at DESC
            LIMIT 1
          ) active_ban ON TRUE
          WHERE representative.id = $1
          LIMIT 1
        `,
        [
          payload.sub,
        ],
      );

    const representative =
      result.rows[0];

    if (
      !representative ||
      !representative
        .is_active
    ) {
      res
        .status(
          401,
        )
        .json({
          success:
            false,

          message: {
            en:
              "Representative account is unavailable.",

            am:
              "የRepresentative account አይገኝም።",
          },
        });

      return;
    }

    const tokenSessionVersion =
      Number(
        payload.sessionVersion ??
          0,
      );

    const currentSessionVersion =
      Number(
        representative
          .session_version,
      );

    if (
      tokenSessionVersion !==
      currentSessionVersion
    ) {
      res
        .status(
          401,
        )
        .json({
          success:
            false,

          message: {
            en:
              "This representative session is no longer valid.",

            am:
              "ይህ Representative session ከእንግዲህ ትክክል አይደለም።",
          },
        });

      return;
    }

    if (
      representative
        .ban_reason
    ) {
      res
        .status(
          403,
        )
        .json({
          success:
            false,

          code:
            "ACCOUNT_SUSPENDED",

          message: {
            en:
              "Your Partner account is temporarily unavailable.",

            am:
              "የPartner መለያዎ ለጊዜው ታግዷል።",
          },

          suspension: {
            reason:
              representative
                .ban_reason,

            bannedUntil:
              representative
                .banned_until ??
              null,

            isPermanent:
              Boolean(
                representative
                  .ban_is_permanent,
              ),
          },
        });

      return;
    }

    req.auth = {
      id:
        representative.id,

      username:
        representative.username,

      name:
        representative.name,

      email:
        representative.email,

      role:
        "representative",

      mustChangePassword:
        Boolean(
          representative
            .must_change_password,
        ),

      sessionVersion:
        currentSessionVersion,
    };

    next();
  } catch (
    error
  ) {
    next(
      error,
    );
  }
}

/* =========================================================
   REQUIRE COMPLETED PASSWORD CHANGE
   ========================================================= */

export function requireRepresentativeReady(
  req:
    Request,

  res:
    Response,

  next:
    NextFunction,
) {
  if (
    !req.auth ||
    req.auth.role !==
      "representative"
  ) {
    res
      .status(
        401,
      )
      .json({
        success:
          false,

        message: {
          en:
            "Representative authentication required.",

          am:
            "የRepresentative መግቢያ ያስፈልጋል።",
        },
      });

    return;
  }

  if (
    req.auth
      .mustChangePassword
  ) {
    res
      .status(
        403,
      )
      .json({
        success:
          false,

        code:
          "PASSWORD_CHANGE_REQUIRED",

        message: {
          en:
            "You must change your temporary password before using the representative portal.",

          am:
            "Representative portalን ከመጠቀምዎ በፊት temporary passwordዎን መቀየር አለብዎት።",
        },
      });

    return;
  }

  next();
}
