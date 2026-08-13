import assert from "node:assert/strict";
import test from "node:test";

import {
  canRepresentativeReportMessage,
  isPartnerBanActiveAt,
  isPostgresUniqueViolation,
  isProgramOperational,
} from "./moderation-policy.js";

test("temporary bans are active before expiry and restore automatically at expiry", () => {
  const now = new Date("2026-08-13T12:00:00.000Z");

  assert.equal(
    isPartnerBanActiveAt(
      { endedAt: null, isPermanent: false, bannedUntil: "2026-08-13T12:00:01.000Z" },
      now,
    ),
    true,
  );

  assert.equal(
    isPartnerBanActiveAt(
      { endedAt: null, isPermanent: false, bannedUntil: "2026-08-13T12:00:00.000Z" },
      now,
    ),
    false,
  );
});

test("permanent and manually ended bans follow the central policy", () => {
  assert.equal(isPartnerBanActiveAt({ endedAt: null, isPermanent: true, bannedUntil: null }), true);
  assert.equal(
    isPartnerBanActiveAt({ endedAt: new Date(), isPermanent: true, bannedUntil: null }),
    false,
  );
});

test("representatives cannot report their own message but can report other participants", () => {
  assert.equal(
    canRepresentativeReportMessage({
      reporterRepresentativeId: "rep-a",
      senderType: "representative",
      senderRepresentativeId: "rep-a",
    }),
    false,
  );
  assert.equal(
    canRepresentativeReportMessage({
      reporterRepresentativeId: "rep-a",
      senderType: "representative",
      senderRepresentativeId: "rep-b",
    }),
    true,
  );
  assert.equal(
    canRepresentativeReportMessage({
      reporterRepresentativeId: "rep-a",
      senderType: "admin",
      senderRepresentativeId: null,
    }),
    true,
  );
});

test("duplicate report conflicts and Program tombstones are recognized", () => {
  assert.equal(isPostgresUniqueViolation({ code: "23505" }), true);
  assert.equal(isPostgresUniqueViolation({ code: "23503" }), false);
  assert.equal(isProgramOperational(null), true);
  assert.equal(isProgramOperational("2026-08-13T12:00:00.000Z"), false);
});
