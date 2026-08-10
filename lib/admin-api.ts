export type AdminUser = {
  id: string;

  username: string;

  name: string;

  email: string;

  role: "admin";
};

type LoginResponse = {
  success: boolean;

  user: AdminUser;

  redirectTo: string;
};

type CurrentAdminResponse = {
  success: boolean;

  user: AdminUser;
};

export type UpdateAdminAccountInput = {
  name: string;

  username: string;

  email: string;

  currentPassword: string;

  newPassword?: string;
};

type UpdateAdminAccountResponse = {
  success: boolean;

  user: AdminUser;

  passwordChanged: boolean;

  message: string;
};

/* =========================================================
   API URL
   ========================================================= */

function getApiUrl() {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured.",
    );
  }

  return apiUrl;
}

/* =========================================================
   ERROR MESSAGE
   ========================================================= */

async function getErrorMessage(
  response: Response,
) {
  try {
    const data =
      await response.json();

    if (
      typeof data?.message ===
      "string"
    ) {
      return data.message;
    }
  } catch {
    // Ignore JSON parse errors.
  }

  return "Something went wrong.";
}

/* =========================================================
   LOGIN
   ========================================================= */

export async function loginAdmin(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const response =
    await fetch(
      `${getApiUrl()}/api/auth/login`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        credentials:
          "include",

        body: JSON.stringify({
          username,
          password,
        }),
      },
    );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    );
  }

  return response.json();
}

/* =========================================================
   CURRENT ADMIN
   ========================================================= */

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const response =
    await fetch(
      `${getApiUrl()}/api/auth/me`,
      {
        method:
          "GET",

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",
        },
      },
    );

  /* =======================================================
     REAL LOGGED-OUT SESSION

     Only authentication failure means:
     "this visitor is not logged in".
     ======================================================= */

  if (
    response.status ===
    401
  ) {
    return null;
  }

  /* =======================================================
     TEMPORARY SERVER / NETWORK ERROR

     IMPORTANT:

     429
     500
     502
     503
     etc.

     must NOT be treated as:
     "the JWT disappeared".

     Throw instead so AdminShell can show Retry.
     ======================================================= */

  if (
    !response.ok
  ) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    );
  }

  const data:
    CurrentAdminResponse =
      await response.json();

  return data.user;
}

/* =========================================================
   UPDATE ACCOUNT
   ========================================================= */

export async function updateAdminAccount(
  input: UpdateAdminAccountInput,
): Promise<UpdateAdminAccountResponse> {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/account`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json",
        },

        credentials:
          "include",

        body:
          JSON.stringify(
            input,
          ),
      },
    );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    );
  }

  return response.json();
}

/* =========================================================
   LOGOUT
   ========================================================= */

export async function logoutAdmin() {
  const response =
    await fetch(
      `${getApiUrl()}/api/auth/logout`,
      {
        method: "POST",

        credentials:
          "include",
      },
    );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    );
  }
}