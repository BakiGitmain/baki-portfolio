export type AccountRole =
  | "admin"
  | "representative";

export type LoggedInAccount = {
  id:
    string;

  username:
    string;

  name:
    string;

  email:
    string;

  role:
    AccountRole;

  mustChangePassword?:
    boolean;
};

export type AccountLoginResponse = {
  success:
    true;

  user:
    LoggedInAccount;

  redirectTo:
    string;
};

export class AccountLoginError extends Error {
  code?: string;
  suspension?: {
    reason: string;
    bannedUntil: string | null;
    isPermanent: boolean;
  };

  constructor(
    message: string,
    options?: {
      code?: string;
      suspension?: {
        reason: string;
        bannedUntil: string | null;
        isPermanent: boolean;
      };
    },
  ) {
    super(message);
    this.name = "AccountLoginError";
    this.code = options?.code;
    this.suspension = options?.suspension;
  }
}

/* =========================================================
   API URL
   ========================================================= */

function getApiUrl() {
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

/* =========================================================
   ERROR
   ========================================================= */

async function getLoginError(
  response:
    Response,
) {
  try {
    const body =
      await response.json();

    if (
      typeof body
        ?.message ===
      "string"
    ) {
      return new AccountLoginError(body.message, {
        code: typeof body?.code === "string" ? body.code : undefined,
        suspension: body?.suspension && typeof body.suspension.reason === "string"
          ? {
              reason: body.suspension.reason,
              bannedUntil: typeof body.suspension.bannedUntil === "string" ? body.suspension.bannedUntil : null,
              isPermanent: Boolean(body.suspension.isPermanent),
            }
          : undefined,
      });
    }

    if (
      typeof body
        ?.message
        ?.en ===
      "string"
    ) {
      return new AccountLoginError(body.message.en, {
        code: typeof body?.code === "string" ? body.code : undefined,
        suspension: body?.suspension && typeof body.suspension.reason === "string"
          ? {
              reason: body.suspension.reason,
              bannedUntil: typeof body.suspension.bannedUntil === "string" ? body.suspension.bannedUntil : null,
              isPermanent: Boolean(body.suspension.isPermanent),
            }
          : undefined,
      });
    }
  } catch {
    //
  }

  return new AccountLoginError("Unable to sign in.");
}

/* =========================================================
   LOGIN
   ========================================================= */

export async function loginAccount(
  username:
    string,

  password:
    string,
): Promise<AccountLoginResponse> {
  const response =
    await fetch(
      `${getApiUrl()}/api/account-auth/login`,

      {
        method:
          "POST",

        credentials:
          "include",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        body:
          JSON.stringify({
            username,
            password,
          }),
      },
    );

  if (
    !response.ok
  ) {
    throw await getLoginError(response);
  }

  return response.json();
}
