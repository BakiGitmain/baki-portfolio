BEGIN;

/* =========================================================
   PARTNER CHAT ROOM

   Phase 1 has one shared room. Keeping the room in its own
   table makes authorization and future room expansion clear.
   ========================================================= */

CREATE TABLE IF NOT EXISTS partner_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  slug VARCHAR(80) NOT NULL,
  name VARCHAR(160) NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS
  partner_chat_rooms_slug_unique_lower
ON partner_chat_rooms (
  LOWER(slug)
);

INSERT INTO partner_chat_rooms (
  slug,
  name
)
VALUES (
  'baki-digital-partners',
  'Baki Digital Partners'
)
ON CONFLICT DO NOTHING;

/* =========================================================
   CHAT MESSAGES

   Sender display fields are safe snapshots. They let recent
   messages remain understandable if an account is later
   removed without exposing account database IDs to clients.
   ========================================================= */

CREATE TABLE IF NOT EXISTS partner_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  room_id UUID NOT NULL
    REFERENCES partner_chat_rooms(id)
    ON DELETE CASCADE,

  client_message_id UUID NOT NULL,

  sender_type VARCHAR(24) NOT NULL,

  representative_id UUID
    REFERENCES sales_representatives(id)
    ON DELETE SET NULL,

  admin_user_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL,

  sender_public_key VARCHAR(64) NOT NULL,
  sender_display_name VARCHAR(160) NOT NULL,
  sender_reference VARCHAR(32),

  message TEXT NOT NULL,

  reply_to_message_id UUID
    REFERENCES partner_chat_messages(id)
    ON DELETE SET NULL,

  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  deleted_by_type VARCHAR(24),

  deleted_by_representative_id UUID
    REFERENCES sales_representatives(id)
    ON DELETE SET NULL,

  deleted_by_admin_user_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT partner_chat_messages_sender_type_check
    CHECK (
      sender_type IN (
        'representative',
        'admin'
      )
    ),

  CONSTRAINT partner_chat_messages_sender_shape_check
    CHECK (
      (
        sender_type = 'representative'
        AND admin_user_id IS NULL
      )
      OR
      (
        sender_type = 'admin'
        AND representative_id IS NULL
      )
    ),

  CONSTRAINT partner_chat_messages_deleted_by_type_check
    CHECK (
      deleted_by_type IS NULL
      OR deleted_by_type IN (
        'representative',
        'admin'
      )
    ),

  CONSTRAINT partner_chat_messages_message_check
    CHECK (
      CHAR_LENGTH(TRIM(message)) BETWEEN 1 AND 4000
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS
  partner_chat_messages_client_unique
ON partner_chat_messages (
  room_id,
  sender_public_key,
  client_message_id
);

CREATE INDEX IF NOT EXISTS
  partner_chat_messages_room_created_idx
ON partner_chat_messages (
  room_id,
  created_at DESC,
  id DESC
);

CREATE INDEX IF NOT EXISTS
  partner_chat_messages_created_at_idx
ON partner_chat_messages (
  created_at
);

CREATE INDEX IF NOT EXISTS
  partner_chat_messages_room_updated_idx
ON partner_chat_messages (
  room_id,
  updated_at,
  id
);

CREATE INDEX IF NOT EXISTS
  partner_chat_messages_reply_idx
ON partner_chat_messages (
  reply_to_message_id
)
WHERE reply_to_message_id IS NOT NULL;

/* =========================================================
   RETENTION-SAFE READ CURSORS

   last_read_at is independent of message rows, so hard
   deletion after seven days cannot invalidate a user's
   persisted read state.
   ========================================================= */

CREATE TABLE IF NOT EXISTS partner_chat_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  room_id UUID NOT NULL
    REFERENCES partner_chat_rooms(id)
    ON DELETE CASCADE,

  viewer_type VARCHAR(24) NOT NULL,

  representative_id UUID
    REFERENCES sales_representatives(id)
    ON DELETE CASCADE,

  admin_user_id UUID
    REFERENCES admins(id)
    ON DELETE CASCADE,

  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT partner_chat_reads_viewer_type_check
    CHECK (
      viewer_type IN (
        'representative',
        'admin'
      )
    ),

  CONSTRAINT partner_chat_reads_viewer_shape_check
    CHECK (
      (
        viewer_type = 'representative'
        AND representative_id IS NOT NULL
        AND admin_user_id IS NULL
      )
      OR
      (
        viewer_type = 'admin'
        AND representative_id IS NULL
        AND admin_user_id IS NOT NULL
      )
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS
  partner_chat_reads_representative_unique
ON partner_chat_reads (
  room_id,
  representative_id
)
WHERE viewer_type = 'representative';

CREATE UNIQUE INDEX IF NOT EXISTS
  partner_chat_reads_admin_unique
ON partner_chat_reads (
  room_id,
  admin_user_id
)
WHERE viewer_type = 'admin';

CREATE INDEX IF NOT EXISTS
  partner_chat_reads_room_cursor_idx
ON partner_chat_reads (
  room_id,
  last_read_at
);

COMMIT;
