import {
  RESEND_FROM_EMAIL,
  resendClient,
} from "./resend-client.js";

/* =========================================================
   TYPES
   ========================================================= */

export type ContactInquiryEmail = {
  inquiryId:
    string;

  name:
    string;

  email:
    string;

  mobileNumber:
    string;

  projectType:
    string;

  budget:
    string;

  message:
    string;
};

export type ContactDeliveryResult = {
  ownerSent:
    boolean;

  confirmationSent:
    boolean;
};

type ContactDeliveryDependencies = {
  sendOwner?: (
    input:
      ContactInquiryEmail,
  ) => Promise<boolean>;

  sendConfirmation?: (
    input:
      ContactInquiryEmail,
  ) => Promise<boolean>;

  logFailure?: (
    delivery:
      "owner" |
      "confirmation",
  ) => void;
};

type BuiltEmail = {
  subject:
    string;

  html:
    string;

  text:
    string;
};

/* =========================================================
   SAFE CONTENT HELPERS
   ========================================================= */

function escapeHtml(
  value:
    string,
) {
  return value
    .replace(
      /&/g,
      "&amp;",
    )
    .replace(
      /</g,
      "&lt;",
    )
    .replace(
      />/g,
      "&gt;",
    )
    .replace(
      /"/g,
      "&quot;",
    )
    .replace(
      /'/g,
      "&#039;",
    );
}

function safeSubjectPart(
  value:
    string,
) {
  return value
    .replace(
      /[\r\n\u0000-\u001f\u007f]+/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

function firstName(
  value:
    string,
) {
  return value
    .trim()
    .split(
      /\s+/,
      1,
    )[0] ||
    "there";
}

function paragraph(
  value:
    string,
) {
  return `
    <p
      style="
        margin:0 0 16px;
        color:#50574c;
        font-size:15px;
        line-height:24px;
      "
    >
      ${escapeHtml(
        value,
      )}
    </p>
  `;
}

function emailLayout({
  preheader,
  title,
  content,
  footer,
}: {
  preheader:
    string;

  title:
    string;

  content:
    string;

  footer:
    string;
}) {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    >
    <title>${escapeHtml(
      title,
    )}</title>
  </head>

  <body
    style="
      margin:0;
      padding:0;
      background:#f5f7f2;
      color:#1d211b;
      font-family:Arial,Helvetica,sans-serif;
    "
  >
    <div
      style="
        display:none;
        max-height:0;
        overflow:hidden;
        opacity:0;
        color:transparent;
      "
    >
      ${escapeHtml(
        preheader,
      )}
    </div>

    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="width:100%;background:#f5f7f2;"
    >
      <tr>
        <td
          align="center"
          style="padding:32px 16px;"
        >
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              width:100%;
              max-width:600px;
              overflow:hidden;
              border:1px solid #e4e9df;
              border-radius:18px;
              background:#ffffff;
            "
          >
            <tr>
              <td
                style="
                  height:4px;
                  background:#8fcf2f;
                  font-size:0;
                  line-height:0;
                "
              >
                &nbsp;
              </td>
            </tr>

            <tr>
              <td
                style="padding:27px 30px 6px;"
              >
                <div
                  style="
                    color:#426c2b;
                    font-size:18px;
                    font-weight:700;
                    line-height:24px;
                  "
                >
                  Baki Digital
                </div>
              </td>
            </tr>

            <tr>
              <td
                style="padding:17px 30px 30px;"
              >
                <h1
                  style="
                    margin:0 0 18px;
                    color:#171b15;
                    font-size:25px;
                    font-weight:700;
                    line-height:32px;
                  "
                >
                  ${escapeHtml(
                    title,
                  )}
                </h1>

                ${content}
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:20px 30px 24px;
                  border-top:1px solid #edf0ea;
                "
              >
                <p
                  style="
                    margin:0;
                    color:#80877c;
                    font-size:12px;
                    line-height:19px;
                  "
                >
                  ${escapeHtml(
                    footer,
                  )}
                </p>

                <p
                  style="
                    margin:8px 0 0;
                    color:#80877c;
                    font-size:12px;
                    line-height:19px;
                  "
                >
                  Baki Digital
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

function detailRow(
  label:
    string,

  value:
    string,
) {
  return `
    <tr>
      <td
        style="
          width:132px;
          padding:10px 12px;
          border-bottom:1px solid #e8ede4;
          color:#737a6e;
          font-size:12px;
          font-weight:700;
          line-height:19px;
          vertical-align:top;
        "
      >
        ${escapeHtml(
          label,
        )}
      </td>

      <td
        style="
          padding:10px 12px;
          border-bottom:1px solid #e8ede4;
          color:#2c3228;
          font-size:14px;
          line-height:21px;
          word-break:break-word;
        "
      >
        ${escapeHtml(
          value,
        )}
      </td>
    </tr>
  `;
}

/* =========================================================
   EMAIL BUILDERS

   Exported so content escaping and text fallbacks can be
   verified without sending real email.
   ========================================================= */

export function buildOwnerInquiryEmail(
  input:
    ContactInquiryEmail,
): BuiltEmail {
  const subject =
    `New project inquiry — ${safeSubjectPart(
      input.projectType,
    )} — ${safeSubjectPart(
      input.name,
    )}`;

  const safeMessage =
    escapeHtml(
      input.message,
    ).replace(
      /\r?\n/g,
      "<br>",
    );

  const html =
    emailLayout({
      preheader:
        `New ${input.projectType} inquiry from ${input.name}.`,

      title:
        "New project inquiry",

      footer:
        "This inquiry was submitted through the Baki Digital website contact form.",

      content: `
        ${paragraph(
          "A visitor submitted a new project inquiry. Replying to this email will reply directly to the visitor.",
        )}

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            width:100%;
            margin:20px 0;
            overflow:hidden;
            border:1px solid #e2e8dd;
            border-radius:12px;
            background:#f8faf6;
          "
        >
          ${detailRow(
            "Name",
            input.name,
          )}
          ${detailRow(
            "Email",
            input.email,
          )}
          ${detailRow(
            "Mobile number",
            input.mobileNumber,
          )}
          ${detailRow(
            "Project type",
            input.projectType,
          )}
          ${detailRow(
            "Budget",
            input.budget,
          )}
        </table>

        <div
          style="
            margin-top:20px;
            padding:17px 18px;
            border:1px solid #dfe7da;
            border-left:4px solid #8fcf2f;
            border-radius:12px;
            background:#fbfcfa;
          "
        >
          <div
            style="
              margin-bottom:8px;
              color:#65705f;
              font-size:11px;
              font-weight:700;
              letter-spacing:0.08em;
              line-height:16px;
              text-transform:uppercase;
            "
          >
            Message
          </div>

          <div
            style="
              color:#30362d;
              font-size:14px;
              line-height:23px;
              overflow-wrap:anywhere;
            "
          >
            ${safeMessage}
          </div>
        </div>
      `,
    });

  const text = [
    "Baki Digital",
    "",
    "New project inquiry",
    "",
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Mobile Number: ${input.mobileNumber}`,
    `Project Type: ${input.projectType}`,
    `Budget: ${input.budget}`,
    "",
    "Message:",
    input.message,
  ].join(
    "\n",
  );

  return {
    subject,
    html,
    text,
  };
}

export function buildVisitorConfirmationEmail(
  input:
    ContactInquiryEmail,
): BuiltEmail {
  const name =
    firstName(
      input.name,
    );

  const subject =
    "We received your project inquiry — Baki Digital";

  const html =
    emailLayout({
      preheader:
        "Your Baki Digital project inquiry was received successfully.",

      title:
        "Your inquiry was received",

      footer:
        "This confirmation was sent because a project inquiry was submitted with this email address on bakidigital.com.",

      content: `
        ${paragraph(
          `Hi ${name},`,
        )}

        ${paragraph(
          "Thanks for reaching out to Baki Digital. Your project inquiry was received successfully.",
        )}

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            width:100%;
            margin:20px 0;
            overflow:hidden;
            border:1px solid #e2e8dd;
            border-radius:12px;
            background:#f8faf6;
          "
        >
          ${detailRow(
            "Project type",
            input.projectType,
          )}
          ${detailRow(
            "Budget",
            input.budget,
          )}
        </table>

        ${paragraph(
          "I'll review the details and get back to you as soon as possible.",
        )}
      `,
    });

  const text = [
    "Baki Digital",
    "",
    `Hi ${name},`,
    "",
    "Thanks for reaching out to Baki Digital.",
    "Your project inquiry was received successfully.",
    "",
    `Project type: ${input.projectType}`,
    `Budget: ${input.budget}`,
    "",
    "I'll review the details and get back to you as soon as possible.",
    "",
    "Baki Digital",
  ].join(
    "\n",
  );

  return {
    subject,
    html,
    text,
  };
}

/* =========================================================
   RESEND DELIVERY
   ========================================================= */

async function sendOwnerInquiry(
  input:
    ContactInquiryEmail,
) {
  const receiver =
    process.env
      .CONTACT_RECEIVER_EMAIL
      ?.trim();

  if (
    !resendClient
  ) {
    logSafeOwnerDeliveryError({
      name:
        "ConfigurationError",

      message:
        "RESEND_API_KEY is not configured.",
    });

    return false;
  }

  if (
    !receiver
  ) {
    logSafeOwnerDeliveryError({
      name:
        "ConfigurationError",

      message:
        "CONTACT_RECEIVER_EMAIL is not configured.",
    });

    return false;
  }

  const email =
    buildOwnerInquiryEmail(
      input,
    );

  try {
    const {
      error,
    } =
      await resendClient
        .emails
        .send(
          {
            from:
              RESEND_FROM_EMAIL,

            to: [
              receiver,
            ],

            replyTo:
              input.email,

            subject:
              email.subject,

            html:
              email.html,

            text:
              email.text,

            tags: [
              {
                name:
                  "type",

                value:
                  "contact-inquiry",
              },
            ],
          },

          {
            idempotencyKey:
              `contact-owner/${input.inquiryId}`,
          },
        );

    if (
      error
    ) {
      logSafeOwnerDeliveryError(
        error,
      );

      return false;
    }

    return true;
  } catch (
    error
  ) {
    logSafeOwnerDeliveryError(
      error,
    );

    return false;
  }
}

function logSafeOwnerDeliveryError(
  error:
    unknown,
) {
  const details:
    Record<
      string,
      string | number
    > = {
      name:
        "UnknownEmailError",

      message:
        "Unknown email delivery error.",
    };

  if (
    error &&
    typeof error ===
      "object"
  ) {
    const candidate =
      error as
        Record<
          string,
          unknown
        >;

    if (
      typeof candidate.name ===
      "string"
    ) {
      details.name =
        candidate.name;
    }

    if (
      typeof candidate.message ===
      "string"
    ) {
      details.message =
        candidate.message;
    }

    if (
      typeof candidate.statusCode ===
        "string" ||
      typeof candidate.statusCode ===
        "number"
    ) {
      details.statusCode =
        candidate.statusCode;
    }

    if (
      typeof candidate.code ===
        "string" ||
      typeof candidate.code ===
        "number"
    ) {
      details.code =
        candidate.code;
    }
  } else if (
    typeof error ===
    "string"
  ) {
    details.message =
      error;
  }

  console.error(
    "Contact owner email delivery failed.",
    details,
  );
}

async function sendVisitorConfirmation(
  input:
    ContactInquiryEmail,
) {
  if (
    !resendClient
  ) {
    return false;
  }

  const email =
    buildVisitorConfirmationEmail(
      input,
    );

  try {
    const {
      error,
    } =
      await resendClient
        .emails
        .send(
          {
            from:
              RESEND_FROM_EMAIL,

            to: [
              input.email,
            ],

            subject:
              email.subject,

            html:
              email.html,

            text:
              email.text,

            tags: [
              {
                name:
                  "type",

                value:
                  "contact-confirmation",
              },
            ],
          },

          {
            idempotencyKey:
              `contact-confirmation/${input.inquiryId}`,
          },
        );

    return !error;
  } catch {
    return false;
  }
}

function logDeliveryFailure(
  delivery:
    "owner" |
    "confirmation",
) {
  if (
    delivery ===
    "owner"
  ) {
    console.error(
      "Contact owner email delivery failed.",
    );

    return;
  }

  console.warn(
    "Contact confirmation email delivery failed after the owner inquiry was delivered.",
  );
}

/* =========================================================
   OWNER-FIRST DELIVERY POLICY
   ========================================================= */

export async function deliverContactInquiry(
  input:
    ContactInquiryEmail,

  dependencies:
    ContactDeliveryDependencies =
      {},
): Promise<ContactDeliveryResult> {
  const sendOwner =
    dependencies
      .sendOwner ??
    sendOwnerInquiry;

  const sendConfirmation =
    dependencies
      .sendConfirmation ??
    sendVisitorConfirmation;

  const logFailure =
    dependencies
      .logFailure ??
    logDeliveryFailure;

  let ownerSent =
    false;

  try {
    ownerSent =
      await sendOwner(
        input,
      );
  } catch {
    ownerSent =
      false;
  }

  if (
    !ownerSent
  ) {
    logFailure(
      "owner",
    );

    return {
      ownerSent:
        false,

      confirmationSent:
        false,
    };
  }

  let confirmationSent =
    false;

  try {
    confirmationSent =
      await sendConfirmation(
        input,
      );
  } catch {
    confirmationSent =
      false;
  }

  if (
    !confirmationSent
  ) {
    logFailure(
      "confirmation",
    );
  }

  return {
    ownerSent:
      true,

    confirmationSent,
  };
}
