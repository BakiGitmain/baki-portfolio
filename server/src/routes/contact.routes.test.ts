import assert from "node:assert/strict";
import {
  createServer,
  type Server,
} from "node:http";
import test from "node:test";

import express from "express";

import {
  contactInquirySchema,
  createContactRouter,
  type ContactDeliveryHandler,
} from "./contact.routes.js";

const validRequest = {
  name:
    "  John Doe  ",

  email:
    "  JOHN@example.com  ",

  mobileNumber:
    "  +251 911 234 567  ",

  projectType:
    "full-stack-website",

  budget:
    "etb-35000-50000",

  message:
    "  I need a professional website for my growing business.  ",

  companyWebsite:
    "",
};

type TestServer = {
  server:
    Server;

  url:
    string;
};

async function startTestServer(
  deliver:
    ContactDeliveryHandler,
): Promise<TestServer> {
  const app =
    express();

  app.use(
    express.json(),
  );

  app.use(
    "/api/contact",
    createContactRouter({
      deliver,
    }),
  );

  const server =
    createServer(
      app,
    );

  await new Promise<void>(
    (
      resolve,
      reject,
    ) => {
      server.once(
        "error",
        reject,
      );

      server.listen(
        0,
        "127.0.0.1",
        () =>
          resolve(),
      );
    },
  );

  const address =
    server.address();

  if (
    !address ||
    typeof address ===
      "string"
  ) {
    throw new Error(
      "Test server did not bind to a TCP port.",
    );
  }

  return {
    server,
    url:
      `http://127.0.0.1:${address.port}/api/contact`,
  };
}

async function stopTestServer(
  server:
    Server,
) {
  await new Promise<void>(
    (
      resolve,
      reject,
    ) => {
      server.close(
        (
          error,
        ) => {
          if (
            error
          ) {
            reject(
              error,
            );

            return;
          }

          resolve();
        },
      );
    },
  );
}

async function postContact(
  url:
    string,

  body:
    unknown,
) {
  return fetch(
    url,
    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          body,
        ),
    },
  );
}

test("contact schema accepts stable values, trims text, and normalizes email", () => {
  const parsed =
    contactInquirySchema
      .parse(
        validRequest,
      );

  assert.equal(
    parsed.name,
    "John Doe",
  );

  assert.equal(
    parsed.email,
    "john@example.com",
  );

  assert.equal(
    parsed.mobileNumber,
    "+251 911 234 567",
  );

  assert.equal(
    parsed.message,
    "I need a professional website for my growing business.",
  );

  assert.equal(
    contactInquirySchema
      .parse({
        ...validRequest,

        mobileNumber:
          "  +1 (415) 555-2671  ",
      })
      .mobileNumber,
    "+1 (415) 555-2671",
  );
});

test("contact schema rejects invalid email, phone, missing fields, and short messages", () => {
  const invalidInputs = [
    {
      ...validRequest,
      email:
        "not-an-email",
    },
    {
      ...validRequest,
      name:
        "",
    },
    {
      ...validRequest,
      mobileNumber:
        "call-me-maybe",
    },
    {
      ...validRequest,
      mobileNumber:
        "",
    },
    {
      ...validRequest,
      mobileNumber:
        "+12345",
    },
    {
      ...validRequest,
      mobileNumber:
        "+123 456 789 012 345 678 901",
    },
    {
      ...validRequest,
      projectType:
        "",
    },
    {
      ...validRequest,
      budget:
        "",
    },
    {
      ...validRequest,
      message:
        "Too short",
    },
  ];

  for (
    const input of
      invalidInputs
  ) {
    assert.equal(
      contactInquirySchema
        .safeParse(
          input,
        ).success,
      false,
    );
  }
});

test("valid contact submissions deliver normalized, human-readable inquiry details", async () => {
  const delivered:
    Parameters<
      ContactDeliveryHandler
    >[0][] =
    [];

  const testServer =
    await startTestServer(
      async (
        input,
      ) => {
        delivered.push(
          input,
        );

        return {
          ownerSent:
            true,

          confirmationSent:
            true,
        };
      },
    );

  try {
    const response =
      await postContact(
        testServer.url,
        validRequest,
      );

    const body =
      await response.json() as {
        success:
          boolean;
      };

    assert.equal(
      response.status,
      200,
    );

    assert.equal(
      body.success,
      true,
    );

    const deliveredInquiry =
      delivered[0];

    assert.ok(
      deliveredInquiry,
    );

    assert.equal(
      deliveredInquiry.name,
      "John Doe",
    );

    assert.equal(
      deliveredInquiry.email,
      "john@example.com",
    );

    assert.equal(
      deliveredInquiry.mobileNumber,
      "+251 911 234 567",
    );

    assert.equal(
      deliveredInquiry.projectType,
      "Full-stack Website",
    );

    assert.equal(
      deliveredInquiry.budget,
      "ETB 35,000 – 50,000",
    );
  } finally {
    await stopTestServer(
      testServer.server,
    );
  }
});

test("filled honeypot returns normal success without email delivery", async () => {
  let deliveryCalls =
    0;

  const testServer =
    await startTestServer(
      async () => {
        deliveryCalls +=
          1;

        return {
          ownerSent:
            true,

          confirmationSent:
            true,
        };
      },
    );

  try {
    const response =
      await postContact(
        testServer.url,
        {
          companyWebsite:
            "https://spam.example",
        },
      );

    const body =
      await response.json() as {
        success:
          boolean;
      };

    assert.equal(
      response.status,
      200,
    );

    assert.equal(
      body.success,
      true,
    );

    assert.equal(
      deliveryCalls,
      0,
    );
  } finally {
    await stopTestServer(
      testServer.server,
    );
  }
});

test("owner delivery failure returns a safe unavailable response", async () => {
  const testServer =
    await startTestServer(
      async () => ({
        ownerSent:
          false,

        confirmationSent:
          false,
      }),
    );

  try {
    const response =
      await postContact(
        testServer.url,
        validRequest,
      );

    const body =
      await response.json() as {
        code:
          string;
      };

    assert.equal(
      response.status,
      503,
    );

    assert.equal(
      body.code,
      "CONTACT_DELIVERY_UNAVAILABLE",
    );
  } finally {
    await stopTestServer(
      testServer.server,
    );
  }
});

test("confirmation failure still returns success after owner delivery", async () => {
  const testServer =
    await startTestServer(
      async () => ({
        ownerSent:
          true,

        confirmationSent:
          false,
      }),
    );

  try {
    const response =
      await postContact(
        testServer.url,
        validRequest,
      );

    const body =
      await response.json() as {
        success:
          boolean;
      };

    assert.equal(
      response.status,
      200,
    );

    assert.equal(
      body.success,
      true,
    );
  } finally {
    await stopTestServer(
      testServer.server,
    );
  }
});

test("contact limiter allows five submissions per hour and rejects the sixth", async () => {
  const testServer =
    await startTestServer(
      async () => ({
        ownerSent:
          true,

        confirmationSent:
          true,
      }),
    );

  try {
    for (
      let attempt =
        1;
      attempt <=
      5;
      attempt +=
        1
    ) {
      const response =
        await postContact(
          testServer.url,
          validRequest,
        );

      assert.equal(
        response.status,
        200,
      );
    }

    const limitedResponse =
      await postContact(
        testServer.url,
        validRequest,
      );

    const body =
      await limitedResponse
        .json() as {
          code:
            string;
        };

    assert.equal(
      limitedResponse.status,
      429,
    );

    assert.equal(
      body.code,
      "CONTACT_RATE_LIMITED",
    );
  } finally {
    await stopTestServer(
      testServer.server,
    );
  }
});
