export type PartnerChatRole =
  | "representative"
  | "admin";

export type PartnerChatParticipant = {
  participantKey:
    string;

  name:
    string;

  partnerId:
    string | null;

  role:
    PartnerChatRole;

  avatarUrl:
    string | null;
};

export type PartnerChatMessage = {
  id:
    string;

  clientMessageId:
    string;

  message:
    string | null;

  sender:
    PartnerChatParticipant;

  replyTo:
    | {
        id:
          string;

        message:
          string | null;

        deleted:
          boolean;

        sender:
          PartnerChatParticipant;
      }
    | null;

  editedAt:
    string | null;

  deletedAt:
    string | null;

  createdAt:
    string;

  updatedAt:
    string;
};

export type PartnerChatSession = {
  socketToken:
    string;

  self:
    PartnerChatParticipant;

  room: {
    slug:
      string;

    name:
      string;

    retentionDays:
      number;
  };
};

type Language =
  | "en"
  | "am";

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

function chatPath(
  role:
    PartnerChatRole,
) {
  return role ===
    "admin"
    ? "/api/admin/chat"
    : "/api/representative/chat";
}

async function readError(
  response:
    Response,

  language:
    Language,
) {
  try {
    const body =
      await response.json();

    if (
      typeof body?.message ===
      "string"
    ) {
      return body.message;
    }

    if (
      typeof body
        ?.message?.[
          language
        ] ===
      "string"
    ) {
      return body.message[
        language
      ] as string;
    }

    if (
      typeof body
        ?.message?.en ===
      "string"
    ) {
      return body.message.en;
    }
  } catch {
    // Ignore invalid error payloads.
  }

  return language ===
    "am"
    ? "Partner Chatን ማግኘት አልተቻለም።"
    : "Unable to access Partner Chat.";
}

async function request<T>(
  role:
    PartnerChatRole,

  path:
    string,

  language:
    Language,

  init?:
    RequestInit,
) {
  const response =
    await fetch(
      `${getApiUrl()}${chatPath(
        role,
      )}${path}`,
      {
        ...init,

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",

          ...(
            init?.headers ??
            {}
          ),
        },
      },
    );

  if (
    !response.ok
  ) {
    throw new Error(
      await readError(
        response,
        language,
      ),
    );
  }

  return response.json() as
    Promise<T>;
}

export async function getPartnerChatSession(
  role:
    PartnerChatRole,

  language:
    Language,
) {
  const result =
    await request<{
      success:
        true;
    } & PartnerChatSession>(
      role,
      "/session",
      language,
    );

  return {
    socketToken:
      result.socketToken,

    self:
      result.self,

    room:
      result.room,
  } satisfies PartnerChatSession;
}

export async function getPartnerChatMessages(
  role:
    PartnerChatRole,

  language:
    Language,

  options?: {
    before?:
      string | null;

    limit?:
      number;
  },
) {
  const params =
    new URLSearchParams();

  params.set(
    "limit",
    String(
      options?.limit ??
        40,
    ),
  );

  if (
    options?.before
  ) {
    params.set(
      "before",
      options.before,
    );
  }

  return request<{
    success:
      true;

    messages:
      PartnerChatMessage[];

    nextCursor:
      string | null;

    hasMore:
      boolean;

    serverTime:
      string;
  }>(
    role,
    `/messages?${params.toString()}`,
    language,
  );
}

export async function synchronizePartnerChat(
  role:
    PartnerChatRole,

  language:
    Language,

  since:
    string,
) {
  const params =
    new URLSearchParams({
      since,
    });

  return request<{
    success:
      true;

    messages:
      PartnerChatMessage[];

    truncated:
      boolean;

    serverTime:
      string;
  }>(
    role,
    `/sync?${params.toString()}`,
    language,
  );
}

export async function getPartnerChatUnreadCount(
  role:
    PartnerChatRole,

  language:
    Language,
) {
  const result =
    await request<{
      success:
        true;

      unreadCount:
        number;
    }>(
      role,
      "/unread-count",
      language,
    );

  return result.unreadCount;
}

export async function markPartnerChatRead(
  role:
    PartnerChatRole,

  language:
    Language,
) {
  const result =
    await request<{
      success:
        true;

      unreadCount:
        number;

      readAt:
        string;
    }>(
      role,
      "/read",
      language,
      {
        method:
          "POST",
      },
    );

  return {
    unreadCount:
      result.unreadCount,

    readAt:
      result.readAt,
  };
}
