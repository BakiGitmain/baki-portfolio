import jwt, {
  type JwtPayload,
} from "jsonwebtoken";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import {
  db,
} from "../config/db.js";

import {
  env,
} from "../config/env.js";

import {
  createChatPublicKey,
  type ChatIdentity,
  type ChatRole,
} from "./partner-chat.service.js";

const CHAT_TOKEN_AUDIENCE =
  "baki-partner-chat";

const CHAT_TOKEN_ISSUER =
  "baki-portfolio-api";

const CHAT_ACCOUNT_TICKET_KEY =
  createHash(
    "sha256",
  )
    .update(
      `${env.JWT_SECRET}:partner-chat-account-ticket`,
      "utf8",
    )
    .digest();

function encryptAccountId(
  accountId:
    string,
) {
  const iv =
    randomBytes(
      12,
    );
  const cipher =
    createCipheriv(
      "aes-256-gcm",
      CHAT_ACCOUNT_TICKET_KEY,
      iv,
    );
  const encrypted =
    Buffer.concat([
      cipher.update(
        accountId,
        "utf8",
      ),
      cipher.final(),
    ]);
  const tag =
    cipher.getAuthTag();

  return Buffer.concat([
    iv,
    tag,
    encrypted,
  ]).toString(
    "base64url",
  );
}

function decryptAccountId(
  ticket:
    unknown,
) {
  if (
    typeof ticket !==
    "string"
  ) {
    return null;
  }

  try {
    const packed =
      Buffer.from(
        ticket,
        "base64url",
      );

    if (
      packed.length <=
      28
    ) {
      return null;
    }

    const decipher =
      createDecipheriv(
        "aes-256-gcm",
        CHAT_ACCOUNT_TICKET_KEY,
        packed.subarray(
          0,
          12,
        ),
      );

    decipher.setAuthTag(
      packed.subarray(
        12,
        28,
      ),
    );

    return Buffer.concat([
      decipher.update(
        packed.subarray(
          28,
        ),
      ),
      decipher.final(),
    ]).toString(
      "utf8",
    );
  } catch {
    return null;
  }
}

export async function loadChatIdentity({
  id,
  role,
  sessionVersion,
}: {
  id:
    string;

  role:
    ChatRole;

  sessionVersion?:
    number;
}): Promise<ChatIdentity | null> {
  if (
    role ===
    "admin"
  ) {
    const result =
      await db.query(
        `
          SELECT
            id,
            name,
            username
          FROM admins
          WHERE
            id = $1::uuid
            AND is_active = TRUE
          LIMIT 1
        `,
        [
          id,
        ],
      );

    const admin =
      result.rows[0];

    if (
      !admin
    ) {
      return null;
    }

    return {
      id:
        admin.id,

      role:
        "admin",

      name:
        admin.name,

      reference:
        null,

      publicKey:
        createChatPublicKey(
          "admin",
          admin.id,
        ),

      sessionVersion:
        null,
    };
  }

  const result =
    await db.query(
      `
          SELECT
            representative.id,
            COALESCE(
              NULLIF(TRIM(representative.display_name), ''),
              representative.name
            ) AS name,
            representative.username,
          representative.session_version
        FROM sales_representatives representative
        INNER JOIN sales_representative_applications application
          ON application.id = representative.application_id
        WHERE
          representative.id = $1::uuid
          AND representative.is_active = TRUE
          AND representative.must_change_password = FALSE
          AND application.status = 'accepted'
        LIMIT 1
      `,
      [
        id,
      ],
    );

  const representative =
    result.rows[0];

  if (
    !representative
  ) {
    return null;
  }

  if (
    sessionVersion !==
      undefined &&
    Number(
      representative
        .session_version,
    ) !==
      sessionVersion
  ) {
    return null;
  }

  return {
    id:
      representative.id,

    role:
      "representative",

    name:
      representative.name,

    reference:
      representative.username,

    publicKey:
      createChatPublicKey(
        "representative",
        representative.id,
      ),

    sessionVersion:
      Number(
        representative
          .session_version,
      ),
  };
}

export function createPartnerChatSocketToken({
  identity,
  sessionVersion,
}: {
  identity:
    ChatIdentity;

  sessionVersion?:
    number;
}) {
  return jwt.sign(
    {
      role:
        identity.role,

      accountTicket:
        encryptAccountId(
          identity.id,
        ),

      sessionVersion:
        sessionVersion ??
        0,
    },
    env.JWT_SECRET,
    {
      algorithm:
        "HS256",

      subject:
        identity.publicKey,

      audience:
        CHAT_TOKEN_AUDIENCE,

      issuer:
        CHAT_TOKEN_ISSUER,

      expiresIn:
        "10m",
    },
  );
}

export async function verifyPartnerChatSocketToken(
  token:
    string,
) {
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

          audience:
            CHAT_TOKEN_AUDIENCE,

          issuer:
            CHAT_TOKEN_ISSUER,
        },
      );
  } catch {
    return null;
  }

  if (
    typeof payload ===
      "string" ||
    !payload.sub ||
    (
      payload.role !==
        "admin" &&
      payload.role !==
        "representative"
    )
  ) {
    return null;
  }

  const accountId =
    decryptAccountId(
      payload.accountTicket,
    );

  if (
    !accountId
  ) {
    return null;
  }

  const identity =
    await loadChatIdentity({
      id:
        accountId,

      role:
        payload.role,

      sessionVersion:
        payload.role ===
          "representative"
          ? Number(
              payload.sessionVersion ??
                0,
            )
          : undefined,
    });

  if (
    !identity ||
    identity.publicKey !==
      payload.sub
  ) {
    return null;
  }

  return identity;
}
