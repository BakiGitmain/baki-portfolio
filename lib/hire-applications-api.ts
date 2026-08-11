/* =========================================================
   SALES REPRESENTATIVE APPLICATION API
   ========================================================= */

export type SupportedLanguage =
  | "en"
  | "am";

/* =========================================================
   TYPES
   ========================================================= */

type LocalizedMessage = {
  en:
    string;

  am:
    string;
};

type UploadAssetSignature = {
  publicId:
    string;

  timestamp:
    number;

  signature:
    string;

  type:
    "authenticated";

  overwrite:
    boolean;
};

type UploadSignatureResponse = {
  success:
    true;

  uploadId:
    string;

  cloudName:
    string;

  apiKey:
    string;

  uploadUrl:
    string;

  assets: {
    front:
      UploadAssetSignature;

    back:
      UploadAssetSignature;
  };
};

type CloudinaryUploadResponse = {
  public_id?:
    string;

  resource_type?:
    string;

  type?:
    string;

  format?:
    string;

  bytes?:
    number;

  secure_url?:
    string;

  error?: {
    message?:
      string;
  };
};

export type SubmitHireApplicationInput = {
  fullName:
    string;

  fatherName:
    string;

  email:
    string;

  phone:
    string;

  city:
    string;

  address:
    string;

  telegram:
    string;

  whatsapp:
    string;

  motivation:
    string;

  idType:
    string;

  idFront:
    File;

  idBack:
    File;

  acceptedRules:
    true;
};

export type SubmittedHireApplication = {
  id:
    string;

  applicationCode:
    string;

  status:
    string;

  submittedAt:
    string;
};

type SubmitApplicationResponse = {
  success:
    true;

  application:
    SubmittedHireApplication;

  message:
    LocalizedMessage;
};

/* =========================================================
   API URL
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

/* =========================================================
   ERROR MESSAGE
   ========================================================= */

async function getErrorMessage(
  response:
    Response,

  language:
    SupportedLanguage,
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

    if (
      data?.message &&
      typeof data.message ===
        "object"
    ) {
      const localized =
        data.message[
          language
        ];

      if (
        typeof localized ===
        "string"
      ) {
        return localized;
      }

      if (
        typeof data
          .message
          .en ===
        "string"
      ) {
        return data
          .message
          .en;
      }
    }

    if (
      typeof data?.error?.message ===
      "string"
    ) {
      return data.error.message;
    }
  } catch {
    // Ignore malformed response bodies.
  }

  return language ===
    "am"
    ? "ማመልከቻውን ማስገባት አልተቻለም። እባክዎ እንደገና ይሞክሩ።"
    : "Unable to submit the application. Please try again.";
}

/* =========================================================
   UPLOAD SIGNATURE
   ========================================================= */

async function getUploadSignature(
  language:
    SupportedLanguage,
): Promise<UploadSignatureResponse> {
  const response =
    await fetch(
      `${getApiUrl()}/api/applications/upload-signature`,
      {
        method:
          "POST",

        headers: {
          Accept:
            "application/json",
        },

        cache:
          "no-store",
      },
    );

  if (
    !response.ok
  ) {
    throw new Error(
      await getErrorMessage(
        response,
        language,
      ),
    );
  }

  return response.json();
}

/* =========================================================
   CLOUDINARY AUTHENTICATED IMAGE UPLOAD
   ========================================================= */

async function uploadAuthenticatedImage(
  file:
    File,

  uploadUrl:
    string,

  apiKey:
    string,

  asset:
    UploadAssetSignature,
) {
  const body =
    new FormData();

  /* =======================================================
     FILE
     ======================================================= */

  body.append(
    "file",
    file,
  );

  /* =======================================================
     API KEY

     API secret is NEVER sent to the browser.
     ======================================================= */

  body.append(
    "api_key",
    apiKey,
  );

  /* =======================================================
     SIGNED PARAMETERS

     These must exactly match the values used by
     api_sign_request() on the backend.
     ======================================================= */

  body.append(
    "timestamp",
    String(
      asset.timestamp,
    ),
  );

  body.append(
    "public_id",
    asset.publicId,
  );

  body.append(
    "type",
    asset.type,
  );

  body.append(
    "overwrite",
    String(
      asset.overwrite,
    ),
  );

  body.append(
    "signature",
    asset.signature,
  );

  /* =======================================================
     UPLOAD
     ======================================================= */

  let response:
    Response;

  try {
    response =
      await fetch(
        uploadUrl,
        {
          method:
            "POST",

          body,
        },
      );
  } catch {
    throw new Error(
      "Unable to connect to the secure image upload service. Please try again.",
    );
  }

  let result:
    CloudinaryUploadResponse;

  try {
    result =
      await response.json();
  } catch {
    throw new Error(
      "The secure image upload returned an invalid response.",
    );
  }

  if (
    !response.ok
  ) {
    throw new Error(
      result.error
        ?.message ??
        "Unable to upload identification image.",
    );
  }

  /* =======================================================
     VERIFY RESPONSE
     ======================================================= */

  if (
    !result.public_id
  ) {
    throw new Error(
      "The identification upload did not return a valid asset.",
    );
  }

  if (
    result.public_id !==
    asset.publicId
  ) {
    throw new Error(
      "The uploaded identification asset did not match the signed upload.",
    );
  }

  if (
    result.type !==
    "authenticated"
  ) {
    throw new Error(
      "The identification image was not stored as a protected asset.",
    );
  }

  return result.public_id;
}

/* =========================================================
   SUBMIT APPLICATION
   ========================================================= */

export async function submitHireApplication(
  input:
    SubmitHireApplicationInput,

  language:
    SupportedLanguage,
): Promise<SubmittedHireApplication> {
  /* =======================================================
     1. GET SIGNATURE
     ======================================================= */

  const upload =
    await getUploadSignature(
      language,
    );

  /* =======================================================
     2. UPLOAD BOTH ID IMAGES
     ======================================================= */

  const [
    idFrontPublicId,
    idBackPublicId,
  ] =
    await Promise.all([
      uploadAuthenticatedImage(
        input.idFront,

        upload.uploadUrl,

        upload.apiKey,

        upload.assets
          .front,
      ),

      uploadAuthenticatedImage(
        input.idBack,

        upload.uploadUrl,

        upload.apiKey,

        upload.assets
          .back,
      ),
    ]);

  /* =======================================================
     3. CREATE APPLICATION
     ======================================================= */

  const response =
    await fetch(
      `${getApiUrl()}/api/applications`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        body:
          JSON.stringify({
            fullName:
              input.fullName
                .trim(),

            fatherName:
              input.fatherName
                .trim(),

            email:
              input.email
                .trim(),

            phone:
              input.phone
                .trim(),

            city:
              input.city
                .trim(),

            address:
              input.address
                .trim(),

            telegram:
              input.telegram
                .trim(),

            whatsapp:
              input.whatsapp
                .trim(),

            motivation:
              input.motivation
                .trim(),

            idType:
              input.idType,

            idUploadId:
              upload.uploadId,

            idFrontPublicId,

            idBackPublicId,

            acceptedRules:
              input.acceptedRules,
          }),
      },
    );

  if (
    !response.ok
  ) {
    throw new Error(
      await getErrorMessage(
        response,
        language,
      ),
    );
  }

  const result:
    SubmitApplicationResponse =
      await response.json();

  return result
    .application;
}