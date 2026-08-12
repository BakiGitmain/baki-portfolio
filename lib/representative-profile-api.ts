export type RepresentativeProfile = {
  partnerId:
    string;

  legalName:
    string;

  displayName:
    string;

  effectiveName:
    string;

  email:
    string;

  phone:
    string;

  city:
    string;

  preferredLanguage:
    "en" |
    "am";

  avatarUrl:
    string |
    null;

  createdAt:
    string;

  lastLoginAt:
    string |
    null;
};

export type RepresentativeProgram = {
  id:
    string;

  title:
    string;

  description:
    string;

  startDate:
    string;

  endDate:
    string;

  effectiveStatus:
    string;

  progressPercent:
    number;

  targets:
    Array<{
      id:
        string;

      targetType:
        "reports" |
        "lessons" |
        "course_completion";

      targetValue:
        number;

      actualValue:
        number;

      courseId:
        string |
        null;

      courseTitleEn:
        string |
        null;

      courseTitleAm:
        string |
        null;
    }>;
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

async function request<T>(
  path:
    string,

  init?:
    RequestInit,
) {
  const response =
    await fetch(
      `${apiUrl()}${path}`,
      {
        ...init,

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",

          ...init?.headers,
        },
      },
    );

  if (
    !response.ok
  ) {
    let message =
      "Unable to update your profile.";

    try {
      const body =
        await response.json();

      message =
        typeof body.message ===
          "string"
          ? body.message
          : body.message?.en ??
            message;
    } catch {
      // Use fallback.
    }

    throw new Error(
      message,
    );
  }

  return response.json() as
    Promise<T>;
}

export async function getRepresentativeProfile() {
  const result =
    await request<{
      profile:
        RepresentativeProfile;
    }>(
      "/api/representative/profile",
    );

  return result.profile;
}

export async function updateRepresentativeProfile(
  input: {
    displayName:
      string;

    preferredLanguage:
      "en" |
      "am";
  },
) {
  const result =
    await request<{
      profile:
        RepresentativeProfile;
    }>(
      "/api/representative/profile",
      {
        method:
          "PATCH",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            input,
          ),
      },
    );

  return result.profile;
}

type AvatarSignature = {
  uploadUrl:
    string;

  apiKey:
    string;

  signature:
    string;

  parameters:
    Record<
      string,
      string |
      number
    >;

  constraints: {
    maxBytes:
      number;

    formats:
      string[];

    width:
      number;

    height:
      number;
  };
};

export async function uploadRepresentativeAvatar(
  file:
    File,
) {
  const signature =
    await request<
      AvatarSignature
    >(
      "/api/representative/profile/avatar/upload-signature",
      {
        method:
          "POST",
      },
    );

  if (
    file.size >
      signature.constraints.maxBytes ||
    ![
      "image/jpeg",
      "image/png",
      "image/webp",
    ].includes(
      file.type,
    )
  ) {
    throw new Error(
      "Use a JPG, PNG, or WebP image no larger than 5 MB.",
    );
  }

  const formData =
    new FormData();

  formData.append(
    "file",
    file,
  );

  formData.append(
    "api_key",
    signature.apiKey,
  );

  formData.append(
    "signature",
    signature.signature,
  );

  for (
    const [
      key,
      value,
    ] of Object.entries(
      signature.parameters,
    )
  ) {
    formData.append(
      key,
      String(
        value,
      ),
    );
  }

  const uploadResponse =
    await fetch(
      signature.uploadUrl,
      {
        method:
          "POST",

        body:
          formData,
      },
    );

  if (
    !uploadResponse.ok
  ) {
    throw new Error(
      "Unable to upload the profile picture.",
    );
  }

  const upload =
    await uploadResponse.json() as {
      public_id:
        string;

      version:
        number;

      signature:
        string;
    };

  const result =
    await request<{
      profile:
        RepresentativeProfile;
    }>(
      "/api/representative/profile/avatar/confirm",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            publicId:
              upload.public_id,

            version:
              upload.version,

            signature:
              upload.signature,
          }),
      },
    );

  return result.profile;
}

export async function deleteRepresentativeAvatar() {
  const result =
    await request<{
      profile:
        RepresentativeProfile;
    }>(
      "/api/representative/profile/avatar",
      {
        method:
          "DELETE",
      },
    );

  return result.profile;
}

export async function getRepresentativePrograms() {
  const result =
    await request<{
      programs:
        RepresentativeProgram[];
    }>(
      "/api/representative/programs",
    );

  return result.programs;
}
