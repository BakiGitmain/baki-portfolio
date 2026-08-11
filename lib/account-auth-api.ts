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

async function getErrorMessage(
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
      return body.message;
    }

    if (
      typeof body
        ?.message
        ?.en ===
      "string"
    ) {
      return body
        .message
        .en;
    }
  } catch {
    //
  }

  return "Unable to sign in.";
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
    throw new Error(
      await getErrorMessage(
        response,
      ),
    );
  }

  return response.json();
}