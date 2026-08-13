export class RepresentativeEmailChangeError extends Error {
  code:
    string |
    null;

  retryAfterSeconds:
    number |
    null;

  constructor(
    message:
      string,

    options?: {
      code?:
        string |
        null;

      retryAfterSeconds?:
        number |
        null;
    },
  ) {
    super(
      message,
    );

    this.name =
      "RepresentativeEmailChangeError";

    this.code =
      options?.code ??
      null;

    this.retryAfterSeconds =
      options?.retryAfterSeconds ??
      null;
  }
}

export type EmailCodeDelivery = {
  maskedEmail:
    string;

  expiresInSeconds:
    number;

  resendAfterSeconds:
    number;
};

function apiUrl() {
  const value =
    process.env
      .NEXT_PUBLIC_API_URL;

  if (
    !value
  ) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured.",
    );
  }

  return value.replace(
    /\/$/,
    "",
  );
}

async function readError(
  response:
    Response,
) {
  let body:
    | {
        code?:
          string;

        message?:
          | string
          | {
              en?:
                string;

              am?:
                string;
            };
      }
    | null =
    null;

  try {
    body =
      await response.json();
  } catch {
    // Use the fallback below.
  }

  const language =
    typeof document !==
      "undefined" &&
    document.documentElement.lang ===
      "am"
      ? "am"
      : "en";

  const message =
    typeof body?.message ===
    "string"
      ? body.message
      : body?.message?.[
          language
        ] ??
        body?.message?.en ??
        (language ===
        "am"
          ? "የኢሜይል ለውጡን ማጠናቀቅ አልተቻለም።"
          : "Unable to complete the email change.");

  return new RepresentativeEmailChangeError(
    message,
    {
      code:
        body?.code ??
        null,

      retryAfterSeconds:
        Number(
          response.headers.get(
            "Retry-After",
          ) ??
          0,
        ) ||
        null,
    },
  );
}

async function request<T>(
  path:
    string,

  body?:
    Record<
      string,
      string
    >,
) {
  const response =
    await fetch(
      `${apiUrl()}/api/representative/profile/email-change${path}`,
      {
        method:
          "POST",

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",

          ...(body
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),
        },

        body:
          body
            ? JSON.stringify(
                body,
              )
            : undefined,
      },
    );

  if (
    !response.ok
  ) {
    throw await readError(
      response,
    );
  }

  return response.json() as
    Promise<T>;
}

export async function sendCurrentEmailCode() {
  return request<
    {
      success:
        true;
    } & EmailCodeDelivery
  >(
    "/current/send",
  );
}

export async function verifyCurrentEmailCode(
  code:
    string,
) {
  return request<{
    success:
      true;

    currentEmailVerified:
      true;
  }>(
    "/current/verify",
    {
      code,
    },
  );
}

export async function sendNewEmailCode(
  email:
    string,
) {
  return request<
    {
      success:
        true;
    } & EmailCodeDelivery
  >(
    "/new/send",
    {
      email,
    },
  );
}

export async function verifyNewEmailCode(
  code:
    string,
) {
  return request<{
    success:
      true;

    email:
      string;
  }>(
    "/new/verify",
    {
      code,
    },
  );
}
