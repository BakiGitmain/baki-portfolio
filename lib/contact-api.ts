export type ContactLanguage =
  | "en"
  | "am";

export const CONTACT_PROJECT_TYPES = [
  "full-stack-website",
  "landing-page",
  "web-application",
  "admin-dashboard",
  "ui-ux-redesign",
  "other",
] as const;

export const CONTACT_BUDGETS = [
  "etb-35000-50000",
  "etb-50000-80000",
  "etb-80000-100000-plus",
  "discuss",
] as const;

export type ContactProjectType =
  (typeof CONTACT_PROJECT_TYPES)[number];

export type ContactBudget =
  (typeof CONTACT_BUDGETS)[number];

export type ContactInquiryInput = {
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

  companyWebsite:
    string;
};

export type ContactField =
  | "name"
  | "email"
  | "mobileNumber"
  | "projectType"
  | "budget"
  | "message";

export type ContactValidationErrors =
  Partial<
    Record<
      ContactField,
      string
    >
  >;

type LocalizedMessage = {
  en?:
    string;

  am?:
    string;
};

type ContactResponse = {
  success?:
    boolean;

  message?:
    | string
    | LocalizedMessage;
};

const VALIDATION_COPY = {
  en: {
    nameRequired:
      "Enter your name.",

    nameLength:
      "Name must be between 2 and 100 characters.",

    emailRequired:
      "Enter your email address.",

    emailInvalid:
      "Enter a valid email address.",

    mobileNumberRequired:
      "Enter your mobile number.",

    mobileNumberInvalid:
      "Enter a valid mobile number, including the country code when applicable.",

    projectType:
      "Select a project type.",

    budget:
      "Select a budget range.",

    messageRequired:
      "Tell me a little about your project.",

    messageLength:
      "Message must be between 20 and 3,000 characters.",
  },

  am: {
    nameRequired:
      "ስምዎን ያስገቡ።",

    nameLength:
      "ስምዎ ከ2 እስከ 100 ፊደላት መሆን አለበት።",

    emailRequired:
      "የኢሜይል አድራሻዎን ያስገቡ።",

    emailInvalid:
      "ትክክለኛ የኢሜይል አድራሻ ያስገቡ።",

    mobileNumberRequired:
      "የሞባይል ቁጥርዎን ያስገቡ።",

    mobileNumberInvalid:
      "እባክዎ ትክክለኛ የሞባይል ቁጥር ያስገቡ፤ አስፈላጊ ከሆነ የአገር ኮድን ያካትቱ።",

    projectType:
      "የፕሮጀክት ዓይነት ይምረጡ።",

    budget:
      "የበጀት መጠን ይምረጡ።",

    messageRequired:
      "ስለፕሮጀክትዎ አጭር መረጃ ይጻፉ።",

    messageLength:
      "መልዕክቱ ከ20 እስከ 3,000 ፊደላት መሆን አለበት።",
  },
} as const;

const PHONE_CHARACTERS =
  /^\+?[0-9](?:[0-9 ().-]*[0-9])?$/;

function isReasonablePhoneNumber(
  value:
    string,
) {
  const digitCount =
    value.replace(
      /\D/g,
      "",
    ).length;

  return (
    value.length <=
      30 &&
    digitCount >=
      7 &&
    digitCount <=
      15 &&
    PHONE_CHARACTERS.test(
      value,
    )
  );
}

/* =========================================================
   FRONTEND VALIDATION

   This improves UX only. The backend Zod schema remains the
   source of truth.
   ========================================================= */

export function validateContactInquiry(
  input:
    ContactInquiryInput,

  language:
    ContactLanguage,
): ContactValidationErrors {
  const copy =
    VALIDATION_COPY[
      language
    ];

  const errors:
    ContactValidationErrors =
    {};

  const name =
    input.name.trim();

  if (
    !name
  ) {
    errors.name =
      copy.nameRequired;
  } else if (
    name.length <
      2 ||
    name.length >
      100
  ) {
    errors.name =
      copy.nameLength;
  }

  const email =
    input.email.trim();

  if (
    !email
  ) {
    errors.email =
      copy.emailRequired;
  } else if (
    email.length >
      254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  ) {
    errors.email =
      copy.emailInvalid;
  }

  const mobileNumber =
    input.mobileNumber
      .trim();

  if (
    !mobileNumber
  ) {
    errors.mobileNumber =
      copy.mobileNumberRequired;
  } else if (
    !isReasonablePhoneNumber(
      mobileNumber,
    )
  ) {
    errors.mobileNumber =
      copy.mobileNumberInvalid;
  }

  if (
    !(
      CONTACT_PROJECT_TYPES as
        readonly string[]
    ).includes(
      input.projectType,
    )
  ) {
    errors.projectType =
      copy.projectType;
  }

  if (
    !(
      CONTACT_BUDGETS as
        readonly string[]
    ).includes(
      input.budget,
    )
  ) {
    errors.budget =
      copy.budget;
  }

  const message =
    input.message.trim();

  if (
    !message
  ) {
    errors.message =
      copy.messageRequired;
  } else if (
    message.length <
      20 ||
    message.length >
      3000
  ) {
    errors.message =
      copy.messageLength;
  }

  return errors;
}

/* =========================================================
   API HELPERS
   ========================================================= */

function getApiUrl() {
  const apiUrl =
    process.env
      .NEXT_PUBLIC_API_URL;

  if (
    !apiUrl
  ) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured.",
    );
  }

  return apiUrl.replace(
    /\/$/,
    "",
  );
}

function localizedMessage(
  message:
    ContactResponse["message"],

  language:
    ContactLanguage,
) {
  if (
    typeof message ===
    "string"
  ) {
    return message;
  }

  if (
    message &&
    typeof message[
      language
    ] ===
      "string"
  ) {
    return message[
      language
    ] as string;
  }

  if (
    message &&
    typeof message.en ===
      "string"
  ) {
    return message.en;
  }

  return null;
}

function fallbackError(
  language:
    ContactLanguage,
) {
  return language ===
    "am"
    ? "መልዕክትዎን መላክ አልተቻለም። እባክዎ እንደገና ይሞክሩ።"
    : "Unable to send your message. Please try again.";
}

export async function submitContactInquiry(
  input:
    ContactInquiryInput,

  language:
    ContactLanguage,

  signal:
    AbortSignal,
) {
  let response:
    Response;

  try {
    response =
      await fetch(
        `${getApiUrl()}/api/contact`,
        {
          method:
            "POST",

          cache:
            "no-store",

          signal,

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              name:
                input.name
                  .trim(),

              email:
                input.email
                  .trim(),

              mobileNumber:
                input.mobileNumber
                  .trim(),

              projectType:
                input.projectType,

              budget:
                input.budget,

              message:
                input.message
                  .trim(),

              companyWebsite:
                input.companyWebsite
                  .trim(),
            }),
        },
      );
  } catch (
    error
  ) {
    if (
      error instanceof
        DOMException &&
      error.name ===
        "AbortError"
    ) {
      throw error;
    }

    throw new Error(
      fallbackError(
        language,
      ),
    );
  }

  let body:
    ContactResponse | null =
    null;

  try {
    body =
      await response
        .json() as
        ContactResponse;
  } catch {
    body =
      null;
  }

  const message =
    localizedMessage(
      body?.message,
      language,
    );

  if (
    !response.ok ||
    body?.success !==
      true
  ) {
    throw new Error(
      message ??
        fallbackError(
          language,
        ),
    );
  }

  return message;
}
