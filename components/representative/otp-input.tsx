"use client";

import {
  useEffect,
  useRef,
} from "react";

export default function OtpInput({
  value,
  onChange,
  onSubmit,
  label,
  disabled =
    false,
  invalid =
    false,
  autoFocus =
    true,
}: {
  value:
    string;

  onChange:
    (
      value:
        string,
    ) =>
      void;

  onSubmit:
    () =>
      void;

  label:
    string;

  disabled?:
    boolean;

  invalid?:
    boolean;

  autoFocus?:
    boolean;
}) {
  const inputs =
    useRef<
      Array<
        HTMLInputElement |
        null
      >
    >(
      [],
    );

  useEffect(
    () => {
      if (
        autoFocus &&
        !disabled
      ) {
        inputs.current[0]
          ?.focus();
      }
    },
    [
      autoFocus,
      disabled,
    ],
  );

  function applyDigits(
    start:
      number,

    raw:
      string,
  ) {
    const digits =
      raw
        .replace(
          /\D/g,
          "",
        )
        .slice(
          0,
          4 -
            start,
        );

    if (
      !digits
    ) {
      return;
    }

    const next =
      value
        .padEnd(
          4,
          " ",
        )
        .split(
          "",
        );

    digits
      .split(
        "",
      )
      .forEach(
        (
          digit,
          offset,
        ) => {
          next[
            start +
              offset
          ] =
            digit;
        },
      );

    const nextValue =
      next
        .join(
          "",
        )
        .trimEnd();

    onChange(
      nextValue,
    );

    const focusIndex =
      Math.min(
        3,
        start +
          digits.length,
      );

    inputs.current[
      focusIndex
    ]?.focus();
  }

  return (
    <div
      role="group"
      aria-label={label}
      className={`flex justify-center gap-2.5 ${invalid ? "animate-pulse" : ""}`}
      onPaste={(
        event,
      ) => {
        event.preventDefault();
        applyDigits(
          0,
          event.clipboardData.getData(
            "text",
          ),
        );
      }}
    >
      {Array.from({
        length:
          4,
      }).map(
        (
          _,
          index,
        ) => (
          <input
            key={index}
            ref={(
              node,
            ) => {
              inputs.current[
                index
              ] =
                node;
            }}
            value={
              value[index] ??
              ""
            }
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={
              index ===
              0
                ? "one-time-code"
                : "off"
            }
            maxLength={1}
            disabled={disabled}
            aria-label={`${label}, ${index + 1} of 4`}
            aria-invalid={invalid}
            className={`h-14 w-12 rounded-[15px] border bg-[var(--portal-surface-2)] text-center text-[20px] font-black text-[var(--portal-text)] outline-none transition focus:ring-4 sm:h-16 sm:w-14 ${
              invalid
                ? "border-red-400 focus:border-red-400 focus:ring-red-500/10"
                : "border-[var(--portal-border)] focus:border-[var(--portal-green)]/40 focus:ring-[var(--portal-green)]/10"
            }`}
            onFocus={(
              event,
            ) =>
              event.currentTarget.select()
            }
            onChange={(
              event,
            ) => {
              const raw =
                event.target.value;

              if (
                raw.length >
                1
              ) {
                applyDigits(
                  index,
                  raw,
                );
                return;
              }

              const digit =
                raw.replace(
                  /\D/g,
                  "",
                );

              const next =
                value
                  .padEnd(
                    4,
                    " ",
                  )
                  .split(
                    "",
                  );

              next[index] =
                digit ||
                " ";

              onChange(
                next
                  .join(
                    "",
                  )
                  .trimEnd(),
              );

              if (
                digit &&
                index <
                  3
              ) {
                inputs.current[
                  index +
                    1
                ]?.focus();
              }
            }}
            onKeyDown={(
              event,
            ) => {
              if (
                event.key ===
                  "Backspace" &&
                !value[index] &&
                index >
                  0
              ) {
                event.preventDefault();

                const next =
                  value
                    .padEnd(
                      4,
                      " ",
                    )
                    .split(
                      "",
                    );

                next[
                  index -
                    1
                ] =
                  " ";

                onChange(
                  next
                    .join(
                      "",
                    )
                    .trimEnd(),
                );

                inputs.current[
                  index -
                    1
                ]?.focus();
              } else if (
                event.key ===
                  "ArrowLeft" &&
                index >
                  0
              ) {
                inputs.current[
                  index -
                    1
                ]?.focus();
              } else if (
                event.key ===
                  "ArrowRight" &&
                index <
                  3
              ) {
                inputs.current[
                  index +
                    1
                ]?.focus();
              } else if (
                event.key ===
                  "Enter" &&
                value.length ===
                  4
              ) {
                event.preventDefault();
                onSubmit();
              }
            }}
          />
        ),
      )}
    </div>
  );
}
