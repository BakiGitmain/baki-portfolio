import {
  cloudinary,
} from "../config/cloudinary.js";

export type AvatarSource = {
  publicId:
    string |
    null |
    undefined;

  version?:
    number |
    string |
    null;

  format?:
    string |
    null;
};

export function representativeAvatarUrl(
  source:
    AvatarSource,

  size =
    512,
) {
  if (
    !source.publicId
  ) {
    return null;
  }

  const version =
    source.version === null ||
    source.version === undefined
      ? undefined
      : Number(
          source.version,
        );

  return cloudinary.url(
    source.publicId,
    {
      secure:
        true,

      version:
        Number.isFinite(
          version,
        )
          ? version
          : undefined,

      format:
        source.format ??
        undefined,

      transformation: [
        {
          width:
            size,

          height:
            size,

          crop:
            "fill",

          gravity:
            "auto",
        },

        {
          quality:
            "auto",

          fetch_format:
            "auto",
        },
      ],
    },
  );
}
