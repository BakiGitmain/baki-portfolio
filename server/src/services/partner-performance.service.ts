import type {
  PoolClient,
  QueryResult,
  QueryResultRow,
} from "pg";

import {
  db,
} from "../config/db.js";

import {
  recordPartnerActivity,
} from "./partner-activity.service.js";

import {
  representativeAvatarUrl,
} from "./profile-avatar.service.js";

export const PARTNER_RANK_THRESHOLDS = {
  pro: {
    verifiedSales:
      1,

    reports:
      10,
  },

  expert: {
    verifiedSales:
      6,

    reports:
      25,
  },
} as const;

export type PartnerRank =
  | "NOOB"
  | "PRO"
  | "EXPERT";

type QueryExecutor = {
  query<T extends QueryResultRow = QueryResultRow>(
    text:
      string,

    values?:
      unknown[],
  ):
    Promise<QueryResult<T>>;
};

export function calculatePartnerRank(
  verifiedSales:
    number,

  reports:
    number,
): PartnerRank {
  if (
    verifiedSales >=
      PARTNER_RANK_THRESHOLDS.expert.verifiedSales &&
    reports >=
      PARTNER_RANK_THRESHOLDS.expert.reports
  ) {
    return "EXPERT";
  }

  if (
    verifiedSales >=
      PARTNER_RANK_THRESHOLDS.pro.verifiedSales &&
    reports >=
      PARTNER_RANK_THRESHOLDS.pro.reports
  ) {
    return "PRO";
  }

  return "NOOB";
}

export async function getPartnerPerformance(
  representativeId:
    string,

  executor:
    QueryExecutor = db,
) {
  const result =
    await executor.query<{
      verified_sales:
        number;

      reports:
        number;
    }>(
      `
        SELECT
          (
            SELECT COUNT(*)::int
            FROM partner_verified_sales sale
            WHERE
              sale.representative_id = $1::uuid
              AND sale.status = 'active'
          ) AS verified_sales,
          (
            SELECT COUNT(*)::int
            FROM representative_reports report
            WHERE report.representative_id = $1::uuid
          ) AS reports
      `,
      [
        representativeId,
      ],
    );

  const verifiedSales =
    Number(
      result.rows[0]
        ?.verified_sales ??
        0,
    );

  const reports =
    Number(
      result.rows[0]
        ?.reports ??
        0,
    );

  return {
    verifiedSales,
    reports,
    rank:
      calculatePartnerRank(
        verifiedSales,
        reports,
      ),
  };
}

export async function getPartnerVerifiedSales(
  representativeId:
    string,
) {
  const result =
    await db.query(
      `
        SELECT
          sale.id,
          sale.reference,
          sale.note,
          sale.status,
          sale.added_at,
          sale.reversed_at,
          sale.reversal_note,
          added_admin.name AS added_by_name,
          reversed_admin.name AS reversed_by_name
        FROM partner_verified_sales sale
        LEFT JOIN admins added_admin
          ON added_admin.id = sale.added_by_admin_id
        LEFT JOIN admins reversed_admin
          ON reversed_admin.id = sale.reversed_by_admin_id
        WHERE sale.representative_id = $1::uuid
        ORDER BY sale.added_at DESC, sale.id DESC
        LIMIT 100
      `,
      [
        representativeId,
      ],
    );

  return result.rows.map(
    (
      sale,
    ) => ({
      id:
        String(
          sale.id,
        ),

      reference:
        sale.reference ??
        null,

      note:
        String(
          sale.note ??
          "",
        ),

      status:
        sale.status ===
        "reversed"
          ? "reversed" as const
          : "active" as const,

      addedAt:
        sale.added_at,

      reversedAt:
        sale.reversed_at ??
        null,

      reversalNote:
        String(
          sale.reversal_note ??
          "",
        ),

      addedByName:
        sale.added_by_name ??
        null,

      reversedByName:
        sale.reversed_by_name ??
        null,
    }),
  );
}

async function recordRankChange(
  input: {
    representativeId:
      string;

    adminId:
      string;

    before:
      PartnerRank;

    after:
      PartnerRank;

    verifiedSales:
      number;

    reports:
      number;
  },
) {
  if (
    input.before ===
    input.after
  ) {
    return;
  }

  await recordPartnerActivity({
    eventType:
      "partner.rank_changed_due_to_metrics",

    actorType:
      "admin",

    representativeId:
      input.representativeId,

    adminUserId:
      input.adminId,

    metadata: {
      label:
        `${input.before} → ${input.after}`,

      previousRank:
        input.before,

      rank:
        input.after,

      verifiedSales:
        input.verifiedSales,

      reports:
        input.reports,
    },
  });
}

export async function addPartnerVerifiedSale(
  input: {
    representativeId:
      string;

    adminId:
      string;

    reference?:
      string;

    note?:
      string;
  },
) {
  const client =
    await db.connect();

  try {
    await client.query(
      "BEGIN",
    );

    await client.query(
      `
        SELECT id
        FROM sales_representatives
        WHERE id = $1::uuid
        FOR UPDATE
      `,
      [
        input.representativeId,
      ],
    );

    const before =
      await getPartnerPerformance(
        input.representativeId,
        client as PoolClient,
      );

    const inserted =
      await client.query(
        `
          INSERT INTO partner_verified_sales (
            representative_id,
            added_by_admin_id,
            reference,
            note
          )
          VALUES (
            $1::uuid,
            $2::uuid,
            NULLIF(TRIM($3::varchar), ''),
            TRIM($4::text)
          )
          RETURNING id
        `,
        [
          input.representativeId,
          input.adminId,
          input.reference ??
            "",
          input.note ??
            "",
        ],
      );

    const after =
      await getPartnerPerformance(
        input.representativeId,
        client as PoolClient,
      );

    await client.query(
      "COMMIT",
    );

    await recordPartnerActivity({
      eventType:
        "partner.sale_added",

      actorType:
        "admin",

      representativeId:
        input.representativeId,

      adminUserId:
        input.adminId,

      metadata: {
        label:
          "Verified sale added",

        saleId:
          inserted.rows[0]
            ?.id,

        reference:
          input.reference?.trim() ||
          null,
      },
    });

    await recordRankChange({
      representativeId:
        input.representativeId,

      adminId:
        input.adminId,

      before:
        before.rank,

      after:
        after.rank,

      verifiedSales:
        after.verifiedSales,

      reports:
        after.reports,
    });

    return after;
  } catch (
    error
  ) {
    await client.query(
      "ROLLBACK",
    );

    throw error;
  } finally {
    client.release();
  }
}

export async function reversePartnerVerifiedSale(
  input: {
    representativeId:
      string;

    saleId:
      string;

    adminId:
      string;

    note?:
      string;
  },
) {
  const client =
    await db.connect();

  try {
    await client.query(
      "BEGIN",
    );

    await client.query(
      `
        SELECT id
        FROM sales_representatives
        WHERE id = $1::uuid
        FOR UPDATE
      `,
      [
        input.representativeId,
      ],
    );

    const before =
      await getPartnerPerformance(
        input.representativeId,
        client as PoolClient,
      );

    const reversed =
      await client.query(
        `
          UPDATE partner_verified_sales
          SET
            status = 'reversed',
            reversed_at = NOW(),
            reversed_by_admin_id = $3::uuid,
            reversal_note = TRIM($4::text),
            updated_at = NOW()
          WHERE
            id = $2::uuid
            AND representative_id = $1::uuid
            AND status = 'active'
          RETURNING id, reference
        `,
        [
          input.representativeId,
          input.saleId,
          input.adminId,
          input.note ??
            "",
        ],
      );

    if (
      !reversed.rows[0]
    ) {
      const error =
        new Error(
          "Verified sale not found or already reversed.",
        );

      Object.assign(
        error,
        {
          status:
            409,
        },
      );

      throw error;
    }

    const after =
      await getPartnerPerformance(
        input.representativeId,
        client as PoolClient,
      );

    await client.query(
      "COMMIT",
    );

    await recordPartnerActivity({
      eventType:
        "partner.sale_reversed",

      actorType:
        "admin",

      representativeId:
        input.representativeId,

      adminUserId:
        input.adminId,

      metadata: {
        label:
          "Verified sale reversed",

        saleId:
          input.saleId,

        reference:
          reversed.rows[0]
            .reference ??
          null,
      },
    });

    await recordRankChange({
      representativeId:
        input.representativeId,

      adminId:
        input.adminId,

      before:
        before.rank,

      after:
        after.rank,

      verifiedSales:
        after.verifiedSales,

      reports:
        after.reports,
    });

    return after;
  } catch (
    error
  ) {
    await client.query(
      "ROLLBACK",
    );

    throw error;
  } finally {
    client.release();
  }
}

export async function listTopPartners(
  limit =
    5,
) {
  const safeLimit =
    Math.max(
      1,
      Math.min(
        100,
        Math.floor(
          limit,
        ),
      ),
    );

  const result =
    await db.query(
      `
        SELECT
          representative.id,
          representative.representative_number,
          COALESCE(
            NULLIF(TRIM(representative.display_name), ''),
            representative.name
          ) AS display_name,
          representative.avatar_public_id,
          representative.avatar_format,
          representative.avatar_version,
          COUNT(DISTINCT sale.id) FILTER (
            WHERE sale.status = 'active'
          )::int AS verified_sales,
          COUNT(DISTINCT report.id)::int AS reports
        FROM sales_representatives representative
        LEFT JOIN partner_verified_sales sale
          ON sale.representative_id = representative.id
        LEFT JOIN representative_reports report
          ON report.representative_id = representative.id
        WHERE representative.is_active = TRUE
        GROUP BY representative.id
        ORDER BY
          verified_sales DESC,
          reports DESC,
          LOWER(
            COALESCE(
              NULLIF(TRIM(representative.display_name), ''),
              representative.name
            )
          ) ASC,
          representative.representative_number ASC
        LIMIT $1::int
      `,
      [
        safeLimit,
      ],
    );

  return result.rows.map(
    (
      row,
      index,
    ) => {
      const verifiedSales =
        Number(
          row.verified_sales ??
          0,
        );

      const reports =
        Number(
          row.reports ??
          0,
        );

      return {
        position:
          index +
          1,

        name:
          String(
            row.display_name,
          ),

        avatarUrl:
          representativeAvatarUrl({
            publicId:
              row.avatar_public_id,

            version:
              row.avatar_version,

            format:
              row.avatar_format,
          }),

        verifiedSales,
        reports,

        rank:
          calculatePartnerRank(
            verifiedSales,
            reports,
          ),
      };
    },
  );
}
