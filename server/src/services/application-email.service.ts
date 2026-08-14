import {
  RESEND_FROM_EMAIL,
  resendClient as resend,
} from "./resend-client.js";

const SITE_URL =
  "https://bakidigital.com";

const LOGIN_URL =
  `${SITE_URL}/login`;

const PARTNER_DASHBOARD_URL =
  `${SITE_URL}/representative/dashboard`;

const ADMIN_REPORTS_URL =
  `${SITE_URL}/admin/reports`;

const ADMIN_PROGRAMS_URL =
  `${SITE_URL}/admin/programs`;

/* =========================================================
   TYPES
   ========================================================= */

type BaseApplicationEmail = {
  applicationId:
    string;

  applicationCode:
    string;

  email:
    string;

  fullName:
    string;
};

type AcceptedApplicationEmail =
  BaseApplicationEmail & {
    username:
      string;

    temporaryPassword:
      string;
  };

type RejectedApplicationEmail =
  BaseApplicationEmail & {
    reason:
      string;
  };

/* =========================================================
   HTML ESCAPE

   Applicant names / admin notes are database values.
   Never place them directly into HTML.
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

/* =========================================================
   NAME
   ========================================================= */

function firstName(
  fullName:
    string,
) {
  const clean =
    fullName.trim();

  if (
    !clean
  ) {
    return "Applicant";
  }

  return (
    clean.split(
      /\s+/,
    )[0] ||
    clean
  );
}

/* =========================================================
   EMAIL WRAPPER

   Intentionally:
   - no images
   - no external fonts
   - no tracking pixels
   - no unnecessary links
   - no promotional language
   ========================================================= */

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

  footer?:
    string;
}) {
  const safePreheader =
    escapeHtml(
      preheader,
    );

  const safeTitle =
    escapeHtml(
      title,
    );

  const safeFooter =
    escapeHtml(
      footer ??
        "This email was sent because you submitted a Sales Partner application through bakidigital.com.",
    );

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    >
    <title>${safeTitle}</title>
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
      ${safePreheader}
    </div>

    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="
        width:100%;
        background:#f5f7f2;
      "
    >
      <tr>
        <td
          align="center"
          style="
            padding:32px 16px;
          "
        >
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              width:100%;
              max-width:560px;
              background:#ffffff;
              border:1px solid #e5e9e1;
              border-radius:18px;
              overflow:hidden;
            "
          >
            <tr>
              <td
                style="
                  height:4px;
                  background:#4f7c36;
                  font-size:0;
                  line-height:0;
                "
              >
                &nbsp;
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:28px 30px 8px;
                "
              >
                <div
                  style="
                    font-size:18px;
                    line-height:24px;
                    font-weight:700;
                    color:#315520;
                  "
                >
                  Baki Digital
                </div>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:18px 30px 30px;
                "
              >
                <h1
                  style="
                    margin:0 0 16px;
                    font-size:25px;
                    line-height:32px;
                    color:#171b15;
                    font-weight:700;
                  "
                >
                  ${safeTitle}
                </h1>

                ${content}
              </td>
            </tr>

            <tr>
              <td
                style="
                  border-top:1px solid #edf0ea;
                  padding:20px 30px 24px;
                "
              >
                <p
                  style="
                    margin:0;
                    font-size:12px;
                    line-height:19px;
                    color:#82877e;
                  "
                >
                  ${safeFooter}
                </p>

                <p
                  style="
                    margin:8px 0 0;
                    font-size:12px;
                    line-height:19px;
                    color:#82877e;
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

/* =========================================================
   COMMON UI
   ========================================================= */

function paragraph(
  value:
    string,
) {
  return `
    <p
      style="
        margin:0 0 16px;
        font-size:15px;
        line-height:24px;
        color:#555b51;
      "
    >
      ${escapeHtml(
        value,
      )}
    </p>
  `;
}

function applicationCodeBox(
  applicationCode:
    string,
) {
  return `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="
        margin:22px 0;
        width:100%;
        background:#f6f8f3;
        border:1px solid #e3e8de;
        border-radius:12px;
      "
    >
      <tr>
        <td
          style="
            padding:16px 18px;
          "
        >
          <div
            style="
              margin-bottom:5px;
              font-size:11px;
              line-height:16px;
              color:#858b81;
              text-transform:uppercase;
              letter-spacing:0.7px;
            "
          >
            Application ID
          </div>

          <div
            style="
              font-family:Arial,Helvetica,sans-serif;
              font-size:18px;
              line-height:24px;
              font-weight:700;
              color:#315520;
            "
          >
            ${escapeHtml(
              applicationCode,
            )}
          </div>
        </td>
      </tr>
    </table>
  `;
}

function credentialBox(
  label:
    string,

  value:
    string,

  options?: {
    loginUsername?:
      boolean;
  },
) {
  const safeLabel =
    escapeHtml(
      label,
    );

  const safeValue =
    escapeHtml(
      value,
    );

  const loginUrl =
    options?.loginUsername
      ? `${LOGIN_URL}?username=${encodeURIComponent(
          value,
        )}`
      : null;

  return `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="
        margin:0 0 12px;
        width:100%;
        background:#f6f8f3;
        border:1px solid #e3e8de;
        border-radius:12px;
      "
    >
      <tr>
        <td
          style="
            padding:15px 18px;
          "
        >
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
          >
            <tr>
              <td
                valign="middle"
              >
                <div
                  style="
                    margin-bottom:5px;
                    font-size:11px;
                    line-height:16px;
                    color:#858b81;
                    text-transform:uppercase;
                    letter-spacing:0.7px;
                  "
                >
                  ${safeLabel}
                </div>

                <div
                  style="
                    font-family:Courier New,Courier,monospace;
                    font-size:18px;
                    line-height:25px;
                    font-weight:700;
                    color:#253a1a;
                    word-break:break-all;
                    user-select:all;
                  "
                >
                  ${safeValue}
                </div>
              </td>

              ${
                loginUrl
                  ? `
                    <td
                      width="46"
                      align="right"
                      valign="middle"
                    >
                      <a
                        href="${loginUrl}"
                        title="Use this username"
                        style="
                          display:inline-block;
                          width:38px;
                          height:38px;
                          line-height:38px;
                          text-align:center;
                          text-decoration:none;
                          border:1px solid #dce4d7;
                          border-radius:10px;
                          background:#ffffff;
                          color:#426c2b;
                          font-size:17px;
                        "
                      >
                        &#10697;
                      </a>
                    </td>
                  `
                  : ""
              }
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function loginButton() {
  return `
    <table
      role="presentation"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="
        margin-top:22px;
      "
    >
      <tr>
        <td
          align="center"
          bgcolor="#426c2b"
          style="
            border-radius:11px;
          "
        >
          <a
            href="${LOGIN_URL}"
            style="
              display:inline-block;
              padding:13px 22px;
              font-size:14px;
              line-height:18px;
              font-weight:700;
              text-decoration:none;
              color:#ffffff;
              background:#426c2b;
              border-radius:11px;
            "
          >
            Go to Login
          </a>
        </td>
      </tr>
    </table>
  `;
}

/* =========================================================
   SAFE SEND

   Email delivery must NEVER undo:
   - application submission
   - rejection
   - acceptance
   - representative creation
   ========================================================= */

async function sendSafely({
  to,
  subject,
  html,
  text,
  idempotencyKey,
  tagType =
    "application",
}: {
  to:
    string;

  subject:
    string;

  html:
    string;

  text:
    string;

  idempotencyKey:
    string;

  tagType?:
    string;
}) {
  if (
    !resend
  ) {
    console.error(
      "Application email not sent: RESEND_API_KEY is not configured.",
    );

    return false;
  }

  try {
    const {
      error,
    } =
      await resend.emails.send(
        {
          from:
            RESEND_FROM_EMAIL,

          to: [
            to,
          ],

          subject,

          html,

          text,

          tags: [
            {
              name:
                "type",

              value:
                tagType,
            },
          ],
        },

        {
          idempotencyKey,
        },
      );

    if (
      error
    ) {
      console.error(
        "Unable to send application email:",
        error.message,
      );

      return false;
    }

    return true;
  } catch (
    error
  ) {
    console.error(
      "Unable to send application email:",
      error instanceof
        Error
        ? error.message
        : "Unknown email error.",
    );

    return false;
  }
}

/* =========================================================
   APPLICATION SUBMITTED
   ========================================================= */

export async function sendApplicationSubmittedEmail(
  input:
    BaseApplicationEmail,
) {
  const name =
    firstName(
      input.fullName,
    );

  const subject =
    `Application received - ${input.applicationCode}`;

  const html =
    emailLayout({
      preheader:
        `Your Baki Digital application ${input.applicationCode} was received.`,

      title:
        "Application received",

      content: `
        ${paragraph(
          `Hi ${name},`,
        )}

        ${paragraph(
          "Your Sales Partner application was submitted successfully.",
        )}

        ${applicationCodeBox(
          input.applicationCode,
        )}

        ${paragraph(
          "Please keep this application ID for reference. Your application will be reviewed and you will receive another email when there is an update.",
        )}

        ${paragraph(
          "No action is required from you right now. Please wait for a response.",
        )}
      `,
    });

  const text = [
    "Baki Digital",
    "",
    `Hi ${name},`,
    "",
    "Your Sales Partner application was submitted successfully.",
    "",
    `Application ID: ${input.applicationCode}`,
    "",
    "Please keep this application ID for reference.",
    "Your application will be reviewed and you will receive another email when there is an update.",
    "",
    "No action is required right now. Please wait for a response.",
    "",
    "Baki Digital",
  ].join(
    "\n",
  );

  return sendSafely({
    to:
      input.email,

    subject,

    html,

    text,

    idempotencyKey:
      `application-submitted/${input.applicationId}`,
  });
}

/* =========================================================
   APPLICATION UNDER REVIEW
   ========================================================= */

export async function sendApplicationUnderReviewEmail(
  input:
    BaseApplicationEmail & {
      eventId:
        string;
    },
) {
  const name =
    firstName(
      input.fullName,
    );

  const subject =
    `Application under review - ${input.applicationCode}`;

  const html =
    emailLayout({
      preheader:
        `Your application ${input.applicationCode} is under review.`,

      title:
        "Your application is under review",

      content: `
        ${paragraph(
          `Hi ${name},`,
        )}

        ${paragraph(
          "Your Sales Partner application is currently under review.",
        )}

        ${applicationCodeBox(
          input.applicationCode,
        )}

        ${paragraph(
          "You do not need to submit another application. Please wait while the application is reviewed.",
        )}

        ${paragraph(
          "You will receive another email when a final decision or important update is available.",
        )}
      `,
    });

  const text = [
    "Baki Digital",
    "",
    `Hi ${name},`,
    "",
    "Your Sales Partner application is currently under review.",
    "",
    `Application ID: ${input.applicationCode}`,
    "",
    "You do not need to submit another application.",
    "Please wait while the application is reviewed.",
    "",
    "You will receive another email when there is an update.",
    "",
    "Baki Digital",
  ].join(
    "\n",
  );

  return sendSafely({
    to:
      input.email,

    subject,

    html,

    text,

    idempotencyKey:
      `application-reviewing/${input.applicationId}/${input.eventId}`,
  });
}

/* =========================================================
   APPLICATION REJECTED
   ========================================================= */

export async function sendApplicationRejectedEmail(
  input:
    RejectedApplicationEmail & {
      eventId:
        string;
    },
) {
  const name =
    firstName(
      input.fullName,
    );

  const safeReason =
    escapeHtml(
      input.reason,
    ).replace(
      /\n/g,
      "<br>",
    );

  const subject =
    `Application update - ${input.applicationCode}`;

  const html =
    emailLayout({
      preheader:
        `There is an update for application ${input.applicationCode}.`,

      title:
        "Application decision",

      content: `
        ${paragraph(
          `Hi ${name},`,
        )}

        ${paragraph(
          "Thank you for taking the time to apply for the Baki Digital Sales Partner opportunity.",
        )}

        ${applicationCodeBox(
          input.applicationCode,
        )}

        ${paragraph(
          "After reviewing your application, it was not accepted at this time.",
        )}

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            margin:20px 0;
            width:100%;
            background:#faf7f3;
            border:1px solid #eee4d8;
            border-radius:12px;
          "
        >
          <tr>
            <td
              style="
                padding:16px 18px;
              "
            >
              <div
                style="
                  margin-bottom:7px;
                  font-size:11px;
                  line-height:16px;
                  color:#8a8176;
                  text-transform:uppercase;
                  letter-spacing:0.7px;
                "
              >
                Reason
              </div>

              <div
                style="
                  font-size:14px;
                  line-height:22px;
                  color:#554c43;
                "
              >
                ${safeReason}
              </div>
            </td>
          </tr>
        </table>

        ${paragraph(
          "Thank you again for your interest and for the time you spent completing the application.",
        )}
      `,
    });

  const text = [
    "Baki Digital",
    "",
    `Hi ${name},`,
    "",
    "Thank you for applying for the Baki Digital Sales Partner opportunity.",
    "",
    `Application ID: ${input.applicationCode}`,
    "",
    "After reviewing your application, it was not accepted at this time.",
    "",
    "Reason:",
    input.reason,
    "",
    "Thank you again for your interest.",
    "",
    "Baki Digital",
  ].join(
    "\n",
  );

  return sendSafely({
    to:
      input.email,

    subject,

    html,

    text,

    idempotencyKey:
      `application-rejected/${input.applicationId}/${input.eventId}`,
  });
}

/* =========================================================
   APPLICATION ACCEPTED
   ========================================================= */

export async function sendApplicationAcceptedEmail(
  input:
    AcceptedApplicationEmail,
) {
  const name =
    firstName(
      input.fullName,
    );

  const subject =
    `Application accepted - ${input.applicationCode}`;

  const html =
    emailLayout({
      preheader:
        `Your Baki Digital application ${input.applicationCode} has been accepted.`,

      title:
        "Your application was accepted",

      content: `
        ${paragraph(
          `Hi ${name},`,
        )}

        ${paragraph(
          "Your application to join Baki Digital as a Sales Partner has been accepted.",
        )}

        ${applicationCodeBox(
          input.applicationCode,
        )}

        ${paragraph(
          "Your account has been created. Use the credentials below for your first login.",
        )}

        ${credentialBox(
          "Username",
          input.username,
        )}

        ${credentialBox(
          "First-login password",
          input.temporaryPassword,
        )}

        ${paragraph(
          "After signing in, you will be asked to create your own password before entering the Partner Portal.",
        )}

        ${loginButton()}

        <p
          style="
            margin:18px 0 0;
            font-size:12px;
            line-height:19px;
            color:#82877e;
          "
        >
          Login address:
          <br>
          <a
            href="${LOGIN_URL}"
            style="
              color:#426c2b;
              text-decoration:underline;
            "
          >
            ${LOGIN_URL}
          </a>
        </p>
      `,
    });

  const text = [
    "Baki Digital",
    "",
    `Hi ${name},`,
    "",
    "Your application to join Baki Digital as a Sales Partner has been accepted.",
    "",
    `Application ID: ${input.applicationCode}`,
    "",
    `Username: ${input.username}`,
    `First-login password: ${input.temporaryPassword}`,
    "",
    "After signing in, you will be asked to create your own password.",
    "",
    `Login: ${LOGIN_URL}`,
    "",
    "Baki Digital",
  ].join(
    "\n",
  );

  return sendSafely({
    to:
      input.email,

    subject,

    html,

    text,

    idempotencyKey:
      `application-accepted/${input.applicationId}`,
  });
}

/* =========================================================
   REPRESENTATIVE REPORT REMINDER

   The reminder is bilingual because it is generated by the
   backend without knowing the representative's current UI
   language preference.
   ========================================================= */

export async function sendRepresentativeReportReminderEmail(
  input: {
    representativeId:
      string;

    email:
      string;

    fullName:
      string;

    idempotencyKey:
      string;
  },
) {
  const name =
    firstName(
      input.fullName,
    );

  const subject =
    "Activity report reminder | የሪፖርት ማስታወሻ";

  const html =
    emailLayout({
      preheader:
        "Please send a short update from your Baki Digital Partner Dashboard.",

      title:
        "Please send a short report",

      footer:
        "This reminder was sent to an active Baki Digital Sales Partner. ይህ ማስታወሻ ለንቁ የBaki Digital Sales Partner ተልኳል።",

      content: `
        ${paragraph(
          `Hi ${name},`,
        )}

        ${paragraph(
          "We have not received an update from you recently. Please open your Baki Digital Partner Dashboard and send a short report about your recent activity, leads, progress, problems, or anything important.",
        )}

        ${paragraph(
          "This helps us understand how things are going and support you if needed.",
        )}

        <div
          style="
            margin:24px 0;
            padding-top:22px;
            border-top:1px solid #e7ebe3;
          "
        >
          ${paragraph(
            `ሰላም ${name}፣`,
          )}

          ${paragraph(
            "በቅርብ ጊዜ ከእርስዎ ሪፖርት አልደረሰንም። እባክዎ የBaki Digital Partner Dashboardን በመክፈት ስለቅርብ ጊዜ እንቅስቃሴዎ፣ ሊዶች፣ እድገት፣ ችግሮች ወይም አስፈላጊ መረጃ አጭር ሪፖርት ይላኩ።",
          )}

          ${paragraph(
            "ይህ ሥራው እንዴት እየሄደ እንደሆነ እንድንረዳ እና ካስፈለገ ድጋፍ እንድናደርግልዎ ይረዳናል።",
          )}
        </div>

        <table
          role="presentation"
          cellspacing="0"
          cellpadding="0"
          border="0"
        >
          <tr>
            <td
              bgcolor="#426c2b"
              style="border-radius:11px;"
            >
              <a
                href="${PARTNER_DASHBOARD_URL}"
                style="
                  display:inline-block;
                  padding:13px 22px;
                  font-size:14px;
                  line-height:18px;
                  font-weight:700;
                  text-decoration:none;
                  color:#ffffff;
                  background:#426c2b;
                  border-radius:11px;
                "
              >
                Open Partner Dashboard
              </a>
            </td>
          </tr>
        </table>
      `,
    });

  const text = [
    "Baki Digital",
    "",
    `Hi ${name},`,
    "",
    "We have not received an update from you recently.",
    "Please open your Partner Dashboard and send a short report about your recent activity, leads, progress, problems, or anything important.",
    "",
    "This helps us understand how things are going and support you if needed.",
    "",
    `ሰላም ${name}፣`,
    "",
    "በቅርብ ጊዜ ከእርስዎ ሪፖርት አልደረሰንም።",
    "እባክዎ የPartner Dashboardን በመክፈት ስለቅርብ ጊዜ እንቅስቃሴዎ፣ ሊዶች፣ እድገት፣ ችግሮች ወይም አስፈላጊ መረጃ አጭር ሪፖርት ይላኩ።",
    "",
    PARTNER_DASHBOARD_URL,
    "",
    "Baki Digital",
  ].join(
    "\n",
  );

  return sendSafely({
    to:
      input.email,

    subject,

    html,

    text,

    idempotencyKey:
      input.idempotencyKey,

    tagType:
      "representative-reminder",
  });
}

/* =========================================================
   NEW PARTNER REPORT -> ACTIVE ADMIN
   ========================================================= */

export async function sendNewPartnerReportAdminEmail(
  input: {
    reportId:
      string;

    adminEmail:
      string;

    adminName:
      string;

    representativeName:
      string;

    partnerId:
      string;

    reportMessage:
      string;

    createdAt:
      Date;
  },
) {
  const adminName =
    firstName(
      input.adminName,
    );

  const subject =
    `New Partner Report - ${input.representativeName} (${input.partnerId})`;

  const submittedAt =
    input.createdAt.toLocaleString(
      "en-US",
      {
        timeZone:
          "Africa/Nairobi",

        dateStyle:
          "medium",

        timeStyle:
          "short",
      },
    );

  const html =
    emailLayout({
      preheader:
        `${input.representativeName} submitted a new Partner report.`,

      title:
        "New Partner report",

      footer:
        "This operational notification was sent to an active Baki Digital administrator.",

      content: `
        ${paragraph(
          `Hi ${adminName},`,
        )}

        ${paragraph(
          `${input.representativeName} (${input.partnerId}) submitted a new work report at ${submittedAt}.`,
        )}

        ${paragraph(
          "Report:",
        )}

        <div
          style="
            margin:0 0 18px;
            padding:16px 18px;
            border:1px solid #e3eadf;
            border-radius:12px;
            background:#f7faf5;
            color:#343a31;
            font-size:14px;
            line-height:22px;
            white-space:pre-wrap;
          "
        >${escapeHtml(
          input.reportMessage,
        )}</div>

        ${paragraph(
          "Open the authenticated Reports workspace to review and reply.",
        )}

        <table
          role="presentation"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="margin-top:22px;"
        >
          <tr>
            <td
              bgcolor="#426c2b"
              style="border-radius:11px;"
            >
              <a
                href="${ADMIN_REPORTS_URL}"
                style="
                  display:inline-block;
                  padding:13px 22px;
                  font-size:14px;
                  line-height:18px;
                  font-weight:700;
                  text-decoration:none;
                  color:#ffffff;
                  background:#426c2b;
                  border-radius:11px;
                "
              >
                View Report
              </a>
            </td>
          </tr>
        </table>
      `,
    });

  const text = [
    "Baki Digital",
    "",
    `Hi ${adminName},`,
    "",
    `${input.representativeName} (${input.partnerId}) submitted a new work report at ${submittedAt}.`,
    "",
    "Report:",
    input.reportMessage,
    "",
    `View Report: ${ADMIN_REPORTS_URL}`,
    "",
    "Baki Digital",
  ].join(
    "\n",
  );

  return sendSafely({
    to:
      input.adminEmail,

    subject,

    html,

    text,

    idempotencyKey:
      `partner-report-created/${input.reportId}`,

    tagType:
      "partner-report-created",
  });
}

/* =========================================================
   NEW VERIFIED PROGRAM SUBMISSION -> ACTIVE ADMIN

   Delivery is best-effort. The saved submission remains the
   source of truth if Resend is unavailable.
   ========================================================= */

export async function sendNewProgramSubmissionAdminEmail(
  input: {
    submissionId: string;
    adminEmail: string;
    adminName: string;
    programTitle: string;
    representativeName: string;
    partnerId: string;
    businessName: string | null;
    needSummary: string | null;
    contactMethod: string | null;
    notes: string;
  },
) {
  const adminName = firstName(input.adminName);
  const subject = `New Program Submission - ${input.programTitle}`;
  const details = [
    `Partner: ${input.representativeName} (${input.partnerId})`,
    input.businessName ? `Business: ${input.businessName}` : null,
    input.needSummary ? `Need: ${input.needSummary}` : null,
    input.contactMethod ? `Contact: ${input.contactMethod}` : null,
    input.notes ? `Notes: ${input.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const html = emailLayout({
    preheader: `${input.representativeName} submitted proof for ${input.programTitle}.`,
    title: "New Program submission",
    footer: "This operational notification was sent to an active Baki Digital administrator.",
    content: `
      ${paragraph(`Hi ${adminName},`)}
      ${paragraph(`${input.representativeName} (${input.partnerId}) submitted a verified challenge for review.`)}
      ${paragraph(`Program: ${input.programTitle}`)}
      <div style="margin:0 0 18px;padding:16px 18px;border:1px solid #e3eadf;border-radius:12px;background:#f7faf5;color:#343a31;font-size:14px;line-height:22px;white-space:pre-wrap;">${escapeHtml(details)}</div>
      ${paragraph("Open the authenticated Programs workspace to approve or reject it.")}
      <p style="margin-top:22px;"><a href="${ADMIN_PROGRAMS_URL}" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:700;text-decoration:none;color:#ffffff;background:#426c2b;border-radius:11px;">Review Submission</a></p>
    `,
  });

  const text = [
    "Baki Digital",
    "",
    `Hi ${adminName},`,
    "",
    `New Program submission: ${input.programTitle}`,
    details,
    "",
    `Review: ${ADMIN_PROGRAMS_URL}`,
  ].join("\n");

  return sendSafely({
    to: input.adminEmail,
    subject,
    html,
    text,
    idempotencyKey: `partner-program-submission/${input.submissionId}`,
    tagType: "partner-program-submission",
  });
}

/* =========================================================
   PROGRAM COMPLETION -> PARTNER
   ========================================================= */

export async function sendPartnerProgramCompletionEmail(
  input: {
    representativeId:
      string;

    email:
      string;

    fullName:
      string;

    programId:
      string;

    programTitle:
      string;

    goalSummary:
      string;

    reward:
      | {
          description:
            string;

          label:
            string;
        }
      | null;
  },
) {
  const name =
    firstName(
      input.fullName,
    );

  const subject =
    `Well done — you completed ${input.programTitle} 🎉`;

  const rewardHtml =
    input.reward
      ? `
          <div style="margin:4px 0 18px;padding:16px 18px;border:1px solid #dce8d5;border-radius:12px;background:#f4f8f1;">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#4f7c36;">Reward earned</div>
            <div style="margin-top:8px;font-size:15px;line-height:23px;color:#343a31;">${escapeHtml(input.reward.description)}</div>
            <div style="margin-top:8px;font-size:13px;font-weight:700;color:#4f7c36;">${escapeHtml(input.reward.label)}</div>
          </div>
        `
      : paragraph(
          "Great work completing the challenge.",
        );

  const html =
    emailLayout({
      preheader:
        `You completed ${input.programTitle}.`,

      title:
        "Program completed",

      footer:
        "This achievement email was sent because you completed an assigned Baki Digital Partner Program.",

      content: `
        ${paragraph(`Hi ${name},`)}
        ${paragraph("Well done! You've completed:")}
        <div style="margin:0 0 18px;font-size:20px;line-height:28px;font-weight:700;color:#26311f;">${escapeHtml(input.programTitle)}</div>
        <div style="margin:0 0 18px;padding:14px 16px;border-radius:11px;background:#f7f9f5;color:#4d5548;font-size:14px;line-height:22px;white-space:pre-wrap;"><strong>Goal completed:</strong><br>${escapeHtml(input.goalSummary)}</div>
        ${rewardHtml}
      `,
    });

  const text = [
    "Baki Digital",
    "",
    `Hi ${name},`,
    "",
    "Well done! You've completed:",
    input.programTitle,
    "",
    "Goal completed:",
    input.goalSummary,
    ...(input.reward
      ? [
          "",
          "Reward earned:",
          input.reward.description,
          `Your reward status: ${input.reward.label}`,
        ]
      : [
          "",
          "Great work completing the challenge.",
        ]),
    "",
    "Baki Digital",
  ].join(
    "\n",
  );

  return sendSafely({
    to:
      input.email,

    subject,
    html,
    text,

    idempotencyKey:
      `partner-program-completed/${input.programId}/${input.representativeId}`,

    tagType:
      "partner-program-completed",
  });
}

/* =========================================================
   REPRESENTATIVE EMAIL-CHANGE SECURITY MESSAGES
   ========================================================= */

export async function sendRepresentativeEmailVerificationCode(
  input: {
    challengeId:
      string;

    stage:
      "current" |
      "new";

    email:
      string;

    fullName:
      string;

    code:
      string;

    sendVersion:
      number;
  },
) {
  const name =
    firstName(
      input.fullName,
    );

  const subject =
    "Your Baki Digital verification code";

  const codeBox = `
    <div style="margin:22px 0;padding:18px;border:1px solid #dce8d5;border-radius:12px;background:#f4f8f1;text-align:center;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#668253;">Verification code</div>
      <div style="margin-top:8px;font-size:32px;line-height:38px;font-weight:800;letter-spacing:.22em;color:#315520;">${escapeHtml(input.code)}</div>
    </div>
  `;

  const html =
    emailLayout({
      preheader:
        "Use this code to continue changing your account email.",

      title:
        "Verify your email",

      footer:
        "If you did not request an email change, you can ignore this message.",

      content: `
        ${paragraph(`Hi ${name},`)}
        ${paragraph("Use the verification code below to continue changing your Baki Digital account email.")}
        ${codeBox}
        ${paragraph("This code expires in 10 minutes.")}
      `,
    });

  const text = [
    "Baki Digital",
    "",
    `Hi ${name},`,
    "",
    "Your verification code is:",
    input.code,
    "",
    "This code expires in 10 minutes.",
    "",
    "If you didn't request an email change, you can ignore this message.",
  ].join(
    "\n",
  );

  return sendSafely({
    to:
      input.email,

    subject,
    html,
    text,

    idempotencyKey:
      `representative-email-change/${input.challengeId}/${input.stage}/${input.sendVersion}`,

    tagType:
      "representative-email-change",
  });
}

export async function sendRepresentativeEmailChangedNotice(
  input: {
    challengeId:
      string;

    oldEmail:
      string;

    fullName:
      string;
  },
) {
  const name =
    firstName(
      input.fullName,
    );

  const subject =
    "Your Baki Digital account email was changed";

  const html =
    emailLayout({
      preheader:
        "A security change was completed on your Baki Digital account.",

      title:
        "Account email changed",

      footer:
        "This security notice was sent to the previous email address on your Baki Digital Partner account.",

      content: `
        ${paragraph(`Hi ${name},`)}
        ${paragraph("Your Baki Digital account email was changed successfully.")}
        ${paragraph("If you did not make this change, contact Baki Digital immediately.")}
      `,
    });

  const text = [
    "Baki Digital",
    "",
    `Hi ${name},`,
    "",
    "Your Baki Digital account email was changed successfully.",
    "",
    "If you did not make this change, contact Baki Digital immediately.",
  ].join(
    "\n",
  );

  return sendSafely({
    to:
      input.oldEmail,

    subject,
    html,
    text,

    idempotencyKey:
      `representative-email-changed/${input.challengeId}`,

    tagType:
      "representative-email-changed",
  });
}
