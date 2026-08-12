"use client";

import {
  CornerUpLeft,
  Loader2,
  Pencil,
  Send,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import styles from "./partner-chat.module.css";

import type {
  PartnerChatMessage,
} from "@/lib/partner-chat-api";

export default function ChatComposer({
  language,
  value,
  replyTo,
  editing,
  busy,
  connected,
  onChange,
  onSubmit,
  onCancelContext,
  onBlur,
}: {
  language:
    | "en"
    | "am";

  value:
    string;

  replyTo:
    PartnerChatMessage | null;

  editing:
    PartnerChatMessage | null;

  busy:
    boolean;

  connected:
    boolean;

  onChange: (
    value: string,
  ) => void;

  onSubmit: () => void;

  onCancelContext: () => void;

  onBlur: () => void;
}) {
  const textareaRef =
    useRef<HTMLTextAreaElement>(
      null,
    );

  useEffect(
    () => {
      if (
        replyTo ||
        editing
      ) {
        textareaRef.current?.focus();
      }
    },
    [
      editing,
      replyTo,
    ],
  );

  useEffect(
    () => {
      const textarea =
        textareaRef.current;

      if (!textarea) {
        return;
      }

      textarea.style.height =
        "auto";
      textarea.style.height =
        `${Math.min(textarea.scrollHeight, 120)}px`;
      textarea.style.overflowY =
        textarea.scrollHeight > 120
          ? "auto"
          : "hidden";
    },
    [
      value,
    ],
  );

  const copy =
    language ===
    "am"
      ? {
          reply:
            "ምላሽ ለ",
          edit:
            "መልዕክት በማስተካከል ላይ",
          deleted:
            "የተሰረዘ መልዕክት",
          placeholder:
            connected
              ? "ለአጋሮች መልዕክት ይጻፉ…"
              : "ግንኙነቱ እስኪመለስ ይጠብቁ…",
          hint:
            "ለመላክ Enter፣ ለአዲስ መስመር Shift + Enter",
          cancel:
            "ይቅር",
          send:
            editing
              ? "ማስተካከያውን አስቀምጥ"
              : "መልዕክት ላክ",
        }
      : {
          reply:
            "Replying to",
          edit:
            "Editing message",
          deleted:
            "Deleted message",
          placeholder:
            connected
              ? "Write a message to the partner group…"
              : "Waiting for the connection to return…",
          hint:
            "Enter to send · Shift + Enter for a new line",
          cancel:
            "Cancel",
          send:
            editing
              ? "Save message"
              : "Send message",
        };

  function submit(
    event:
      FormEvent,
  ) {
    event.preventDefault();
    onSubmit();
  }

  function handleKeyDown(
    event:
      KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key ===
        "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent
        .isComposing
    ) {
      event.preventDefault();
      onSubmit();
    }
  }

  const contextMessage =
    editing ??
    replyTo;

  return (
    <form
      className={styles.composer}
      onSubmit={submit}
    >
      {contextMessage && (
        <div className={styles.composerContext}>
          <span className={styles.composerContextIcon}>
            {editing ? (
              <Pencil
                size={14}
                aria-hidden="true"
              />
            ) : (
              <CornerUpLeft
                size={15}
                aria-hidden="true"
              />
            )}
          </span>

          <div>
            <strong>
              {editing
                ? copy.edit
                : `${copy.reply} ${contextMessage.sender.name}`}
            </strong>
            <span>
              {contextMessage.deletedAt
                ? copy.deleted
                : contextMessage.message}
            </span>
          </div>

          <button
            type="button"
            onClick={onCancelContext}
            aria-label={copy.cancel}
            title={copy.cancel}
          >
            <X
              size={16}
              aria-hidden="true"
            />
          </button>
        </div>
      )}

      <div className={styles.composerInputRow}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(
            event,
          ) =>
            onChange(
              event.target.value,
            )
          }
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          placeholder={copy.placeholder}
          maxLength={4000}
          rows={1}
          disabled={!connected || busy}
          aria-label={copy.placeholder}
        />

        <button
          type="submit"
          className={styles.sendButton}
          disabled={
            !connected ||
            busy ||
            value.trim().length ===
              0
          }
          aria-label={copy.send}
          title={copy.send}
        >
          {busy ? (
            <Loader2
              size={18}
              className={styles.spinner}
              aria-hidden="true"
            />
          ) : (
            <Send
              size={18}
              aria-hidden="true"
            />
          )}
        </button>
      </div>

      <div className={styles.composerFooter}>
        <span>{copy.hint}</span>
        <span>
          {value.length.toLocaleString()}
          /4,000
        </span>
      </div>
    </form>
  );
}
