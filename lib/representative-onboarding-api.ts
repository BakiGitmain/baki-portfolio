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

  return "Unable to create representative account.";
}

export type RepresentativeCredentials = {
  username:
    string;

  temporaryPassword:
    string;

  mustChangePassword:
    true;
};

export async function acceptRepresentativeApplication(
  applicationId:
    string,
) {
  const response =
    await fetch(
      `${getApiUrl()}/api/admin/applications/${encodeURIComponent(
        applicationId,
      )}/accept-representative`,

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
        },
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

  return response.json() as Promise<{
    success:
      true;

    representative: {
      id:
        string;

      username:
        string;

      name:
        string;

      email:
        string;
    };

    credentials:
      RepresentativeCredentials;
  }>;
}