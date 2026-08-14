import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOwnerInquiryEmail,
  buildVisitorConfirmationEmail,
  deliverContactInquiry,
  type ContactInquiryEmail,
} from "./contact-email.service.js";

const inquiry:
  ContactInquiryEmail = {
    inquiryId:
      "4b1a2a8d-a7d2-4ef8-899e-0a9c4ad2f588",

    name:
      "John Doe",

    email:
      "john@example.com",

    mobileNumber:
      "+251 911 234 567",

    projectType:
      "Full-stack Website",

    budget:
      "ETB 50,000 – 80,000",

    message:
      "I need a professional website for my growing business.",
  };

test("owner inquiry email escapes visitor content and includes a text fallback", () => {
  const email =
    buildOwnerInquiryEmail({
      ...inquiry,

      name:
        "John\r\nBcc: bad@example.com <script>",

      message:
        "First line\n<img src=x onerror=alert(1)>",
    });

  assert.equal(
    email.subject.includes(
      "\r",
    ),
    false,
  );

  assert.equal(
    email.subject.includes(
      "\n",
    ),
    false,
  );

  assert.match(
    email.html,
    /&lt;script&gt;/,
  );

  assert.match(
    email.html,
    /&lt;img src=x onerror=alert\(1\)&gt;/,
  );

  assert.doesNotMatch(
    email.html,
    /<script>/,
  );

  assert.match(
    email.text,
    /Project Type: Full-stack Website/,
  );

  assert.match(
    email.html,
    /\+251 911 234 567/,
  );

  assert.match(
    email.text,
    /Mobile Number: \+251 911 234 567/,
  );

  assert.match(
    email.text,
    /First line/,
  );
});

test("visitor confirmation stays concise and includes the selected project and budget", () => {
  const email =
    buildVisitorConfirmationEmail(
      inquiry,
    );

  assert.equal(
    email.subject,
    "We received your project inquiry — Baki Digital",
  );

  assert.match(
    email.text,
    /Hi John,/,
  );

  assert.match(
    email.text,
    /Full-stack Website/,
  );

  assert.match(
    email.text,
    /ETB 50,000 – 80,000/,
  );

  assert.doesNotMatch(
    email.text,
    /\+251 911 234 567/,
  );
});

test("owner delivery failure stops confirmation and reports failure", async () => {
  let confirmationCalls =
    0;

  const failures:
    string[] =
    [];

  const result =
    await deliverContactInquiry(
      inquiry,
      {
        sendOwner:
          async () =>
            false,

        sendConfirmation:
          async () => {
            confirmationCalls +=
              1;

            return true;
          },

        logFailure:
          (
            delivery,
          ) => {
            failures.push(
              delivery,
            );
          },
      },
    );

  assert.deepEqual(
    result,
    {
      ownerSent:
        false,

      confirmationSent:
        false,
    },
  );

  assert.equal(
    confirmationCalls,
    0,
  );

  assert.deepEqual(
    failures,
    [
      "owner",
    ],
  );
});

test("confirmation failure preserves a successful owner delivery", async () => {
  const failures:
    string[] =
    [];

  const result =
    await deliverContactInquiry(
      inquiry,
      {
        sendOwner:
          async () =>
            true,

        sendConfirmation:
          async () =>
            false,

        logFailure:
          (
            delivery,
          ) => {
            failures.push(
              delivery,
            );
          },
      },
    );

  assert.deepEqual(
    result,
    {
      ownerSent:
        true,

      confirmationSent:
        false,
    },
  );

  assert.deepEqual(
    failures,
    [
      "confirmation",
    ],
  );
});
