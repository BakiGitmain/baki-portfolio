"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

import {
  createPortal,
} from "react-dom";

import {
  useLanguage,
} from "@/components/providers/language-provider";

import type {
  ProjectGalleryImage,
} from "@/lib/projects";

/* =========================================================
   CONSTANTS
   ========================================================= */

const AUTO_SLIDE_TIME =
  5000;

const MIN_ZOOM =
  1;

const MAX_ZOOM =
  4;

const ZOOM_STEP =
  0.4;

/* =========================================================
   ICONS
   ========================================================= */

function LeftArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 6L9 12L15 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RightArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 8V4M5 4H9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M5.7 6.6A8 8 0 1 1 4 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 3H3V8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M16 3H21V8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M8 21H3V16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M16 21H21V16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function clampZoom(
  value: number,
) {
  return Math.min(
    MAX_ZOOM,
    Math.max(
      MIN_ZOOM,
      value,
    ),
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function ProjectGallery({
  images,
  projectTitle,
}: {
  images:
    ProjectGalleryImage[];

  projectTitle:
    string;
}) {
  const {
    language,
  } = useLanguage();

  /* =======================================================
     NORMAL SLIDER
     ======================================================= */

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const [
    sliderPaused,
    setSliderPaused,
  ] = useState(false);

  /* =======================================================
     LIGHTBOX
     ======================================================= */

  const [
    lightboxOpen,
    setLightboxOpen,
  ] = useState(false);

  const [
    zoom,
    setZoom,
  ] = useState(1);

  const [
    pan,
    setPan,
  ] = useState({
    x: 0,
    y: 0,
  });

  const [
    dragging,
    setDragging,
  ] = useState(false);

  const dragRef =
    useRef({
      pointerX:
        0,

      pointerY:
        0,

      panX:
        0,

      panY:
        0,
    });

  const imageCount =
    images.length;

  const activeImage =
    images[
      activeIndex
    ];

  /* =======================================================
     COPY
     ======================================================= */

  const copy =
    language === "am"
      ? {
          open:
            "ምስሉን ክፈት",

          close:
            "ምስሉን ዝጋ",

          previous:
            "የቀድሞው ምስል",

          next:
            "ቀጣዩ ምስል",

          zoomIn:
            "አጉላ",

          zoomOut:
            "አሳንስ",

          reset:
            "Zoom reset",

          hint:
            "Scroll በማድረግ zoom ያድርጉ። Zoom ካደረጉ drag ማድረግ ይችላሉ።",
        }
      : {
          open:
            "Open image",

          close:
            "Close image",

          previous:
            "Previous image",

          next:
            "Next image",

          zoomIn:
            "Zoom in",

          zoomOut:
            "Zoom out",

          reset:
            "Reset zoom",

          hint:
            "Scroll to zoom. Drag while zoomed in.",
        };

  /* =======================================================
     AUTO SLIDER
     ======================================================= */

  useEffect(() => {
    if (
      imageCount <=
        1 ||
      sliderPaused ||
      lightboxOpen
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setActiveIndex(
            (
              current,
            ) =>
              (
                current +
                1
              ) %
              imageCount,
          );
        },
        AUTO_SLIDE_TIME,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    activeIndex,
    imageCount,
    lightboxOpen,
    sliderPaused,
  ]);

  /* =======================================================
     LIGHTBOX KEYBOARD
     ======================================================= */

  useEffect(() => {
    if (
      !lightboxOpen
    ) {
      return;
    }

    function handleKeyDown(
      event:
        KeyboardEvent,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        closeLightbox();

        return;
      }

      if (
        event.key ===
        "ArrowLeft"
      ) {
        showPreviousLightbox();

        return;
      }

      if (
        event.key ===
        "ArrowRight"
      ) {
        showNextLightbox();

        return;
      }

      if (
        event.key ===
          "+" ||
        event.key ===
          "="
      ) {
        zoomIn();

        return;
      }

      if (
        event.key ===
        "-"
      ) {
        zoomOut();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    lightboxOpen,
    imageCount,
  ]);

  /* =======================================================
     EMPTY
     ======================================================= */

  if (
    imageCount ===
    0
  ) {
    return null;
  }

  /* =======================================================
     GENERAL
     ======================================================= */

  function resetViewer() {
    setZoom(
      1,
    );

    setPan({
      x: 0,
      y: 0,
    });

    setDragging(
      false,
    );
  }

  /* =======================================================
     NORMAL SLIDER ARROWS
     ======================================================= */

  function goPrevious() {
    setActiveIndex(
      (
        current,
      ) =>
        (
          current -
          1 +
          imageCount
        ) %
        imageCount,
    );
  }

  function goNext() {
    setActiveIndex(
      (
        current,
      ) =>
        (
          current +
          1
        ) %
        imageCount,
    );
  }

  /* =======================================================
     OPEN / CLOSE
     ======================================================= */

  function openLightbox(
    index:
      number,
  ) {
    setActiveIndex(
      index,
    );

    resetViewer();

    setLightboxOpen(
      true,
    );

    document.body.style.overflow =
      "hidden";
  }

  function closeLightbox() {
    setLightboxOpen(
      false,
    );

    resetViewer();

    document.body.style.overflow =
      "";
  }

  /* =======================================================
     LIGHTBOX ARROWS
     ======================================================= */

  function showPreviousLightbox() {
    if (
      imageCount <=
      1
    ) {
      return;
    }

    setActiveIndex(
      (
        current,
      ) =>
        (
          current -
          1 +
          imageCount
        ) %
        imageCount,
    );

    resetViewer();
  }

  function showNextLightbox() {
    if (
      imageCount <=
      1
    ) {
      return;
    }

    setActiveIndex(
      (
        current,
      ) =>
        (
          current +
          1
        ) %
        imageCount,
    );

    resetViewer();
  }

  /* =======================================================
     ZOOM
     ======================================================= */

  function zoomIn() {
    setZoom(
      (
        current,
      ) =>
        clampZoom(
          current +
            ZOOM_STEP,
        ),
    );
  }

  function zoomOut() {
    setZoom(
      (
        current,
      ) => {
        const next =
          clampZoom(
            current -
              ZOOM_STEP,
          );

        if (
          next ===
          MIN_ZOOM
        ) {
          setPan({
            x: 0,
            y: 0,
          });
        }

        return next;
      },
    );
  }

  function handleWheel(
    event:
      ReactWheelEvent<HTMLDivElement>,
  ) {
    event.preventDefault();

    if (
      event.deltaY <
      0
    ) {
      setZoom(
        (
          current,
        ) =>
          clampZoom(
            current +
              0.25,
          ),
      );

      return;
    }

    setZoom(
      (
        current,
      ) => {
        const next =
          clampZoom(
            current -
              0.25,
          );

        if (
          next ===
          1
        ) {
          setPan({
            x: 0,
            y: 0,
          });
        }

        return next;
      },
    );
  }

  /* =======================================================
     PAN
     ======================================================= */

  function handlePointerDown(
    event:
      ReactPointerEvent<HTMLDivElement>,
  ) {
    if (
      zoom <=
      1
    ) {
      return;
    }

    event.preventDefault();

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );

    dragRef.current = {
      pointerX:
        event.clientX,

      pointerY:
        event.clientY,

      panX:
        pan.x,

      panY:
        pan.y,
    };

    setDragging(
      true,
    );
  }

  function handlePointerMove(
    event:
      ReactPointerEvent<HTMLDivElement>,
  ) {
    if (
      !dragging ||
      zoom <=
        1
    ) {
      return;
    }

    const differenceX =
      event.clientX -
      dragRef.current
        .pointerX;

    const differenceY =
      event.clientY -
      dragRef.current
        .pointerY;

    setPan({
      x:
        dragRef.current
          .panX +
        differenceX,

      y:
        dragRef.current
          .panY +
        differenceY,
    });
  }

  function handlePointerEnd(
    event:
      ReactPointerEvent<HTMLDivElement>,
  ) {
    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    }

    setDragging(
      false,
    );
  }

  /* =======================================================
     LIGHTBOX CONTENT
     ======================================================= */

  const lightbox =
    lightboxOpen &&
    activeImage &&
    typeof document !==
      "undefined"
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${projectTitle} image viewer`}
            className="fixed inset-0 z-[2147483647] bg-black/90"
          >
            {/* =============================================
                CLICKABLE BACKGROUND
               ============================================= */}

            <button
              type="button"
              aria-label={
                copy.close
              }
              onClick={
                closeLightbox
              }
              className="absolute inset-0 h-full w-full cursor-default"
            />

            {/* =============================================
                TOP BAR
               ============================================= */}

            <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4 sm:p-6">
              {/* COUNTER */}

              <div className="pointer-events-auto flex items-center gap-2">
                <div className="rounded-full border border-white/15 bg-black/40 px-3.5 py-2 text-[9px] font-bold tracking-[0.12em] text-white/75 backdrop-blur-xl">
                  {String(
                    activeIndex +
                      1,
                  ).padStart(
                    2,
                    "0",
                  )}

                  <span className="mx-1.5 text-white/30">
                    /
                  </span>

                  {String(
                    imageCount,
                  ).padStart(
                    2,
                    "0",
                  )}
                </div>

                <div className="rounded-full border border-white/15 bg-black/40 px-3.5 py-2 text-[9px] font-bold text-white/65 backdrop-blur-xl">
                  {
                    Math.round(
                      zoom *
                        100,
                    )
                  }
                  %
                </div>
              </div>

              {/* CLOSE */}

              <button
                type="button"
                onClick={
                  closeLightbox
                }
                aria-label={
                  copy.close
                }
                className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:rotate-90 hover:bg-white hover:text-black sm:h-12 sm:w-12"
              >
                <span className="h-5 w-5">
                  <CloseIcon />
                </span>
              </button>
            </div>

            {/* =============================================
                IMAGE AREA
               ============================================= */}

            <div
              className={`absolute inset-0 z-10 flex touch-none items-center justify-center overflow-hidden p-5 pt-20 pb-24 sm:p-8 sm:pt-24 sm:pb-28 ${
                zoom >
                1
                  ? dragging
                    ? "cursor-grabbing"
                    : "cursor-grab"
                  : "cursor-zoom-in"
              }`}
              onWheel={
                handleWheel
              }
              onPointerDown={
                handlePointerDown
              }
              onPointerMove={
                handlePointerMove
              }
              onPointerUp={
                handlePointerEnd
              }
              onPointerCancel={
                handlePointerEnd
              }
              onDoubleClick={() => {
                if (
                  zoom >
                  1
                ) {
                  resetViewer();

                  return;
                }

                setZoom(
                  2,
                );
              }}
            >
              {/* PAN WRAPPER */}

              <div
                className={
                  dragging
                    ? "will-change-transform"
                    : "transition-transform duration-200 ease-out will-change-transform"
                }
                style={{
                  transform:
                    `translate3d(${pan.x}px, ${pan.y}px, 0)`,
                }}
              >
                {/* IMAGE SCALE WRAPPER */}

                <div
                  className={
                    dragging
                      ? "will-change-transform"
                      : "transition-transform duration-200 ease-out will-change-transform"
                  }
                  style={{
                    transform:
                      `scale(${zoom})`,
                  }}
                >
                  <img
                    src={
                      activeImage.url
                    }
                    alt={
                      language ===
                        "am"
                        ? activeImage
                            .alt
                            .am ||
                          `${projectTitle} ፕሮጀክት`
                        : activeImage
                            .alt
                            .en ||
                          `${projectTitle} project`
                    }
                    draggable={
                      false
                    }
                    className="block max-h-[calc(100dvh-150px)] max-w-[calc(100vw-40px)] select-none object-contain sm:max-h-[calc(100dvh-170px)] sm:max-w-[calc(100vw-150px)]"
                  />
                </div>
              </div>
            </div>

            {/* =============================================
                PREVIOUS
               ============================================= */}

            {imageCount >
              1 && (
              <button
                type="button"
                onClick={
                  showPreviousLightbox
                }
                aria-label={
                  copy.previous
                }
                className="absolute left-3 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white hover:text-black sm:left-6 sm:h-12 sm:w-12"
              >
                <span className="h-5 w-5">
                  <LeftArrowIcon />
                </span>
              </button>
            )}

            {/* =============================================
                NEXT
               ============================================= */}

            {imageCount >
              1 && (
              <button
                type="button"
                onClick={
                  showNextLightbox
                }
                aria-label={
                  copy.next
                }
                className="absolute right-3 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white hover:text-black sm:right-6 sm:h-12 sm:w-12"
              >
                <span className="h-5 w-5">
                  <RightArrowIcon />
                </span>
              </button>
            )}

            {/* =============================================
                BOTTOM CONTROLS
               ============================================= */}

            <div className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2 sm:bottom-6">
              <div className="flex items-center gap-1 rounded-2xl border border-white/15 bg-black/55 p-1.5 shadow-[0_15px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl">
                {/* MINUS */}

                <button
                  type="button"
                  onClick={
                    zoomOut
                  }
                  disabled={
                    zoom <=
                    MIN_ZOOM
                  }
                  aria-label={
                    copy.zoomOut
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white/75 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                >
                  <span className="h-4 w-4">
                    <MinusIcon />
                  </span>
                </button>

                {/* VALUE */}

                <span className="min-w-[60px] text-center text-[9px] font-bold text-white/70">
                  {
                    Math.round(
                      zoom *
                        100,
                    )
                  }
                  %
                </span>

                {/* PLUS */}

                <button
                  type="button"
                  onClick={
                    zoomIn
                  }
                  disabled={
                    zoom >=
                    MAX_ZOOM
                  }
                  aria-label={
                    copy.zoomIn
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white/75 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                >
                  <span className="h-4 w-4">
                    <PlusIcon />
                  </span>
                </button>

                <span className="mx-1 h-5 w-px bg-white/15" />

                {/* RESET */}

                <button
                  type="button"
                  onClick={
                    resetViewer
                  }
                  disabled={
                    zoom ===
                      1 &&
                    pan.x ===
                      0 &&
                    pan.y ===
                      0
                  }
                  aria-label={
                    copy.reset
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white/75 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                >
                  <span className="h-4 w-4">
                    <ResetIcon />
                  </span>
                </button>
              </div>

              <p className="mt-2 hidden whitespace-nowrap text-center text-[8px] font-medium text-white/35 sm:block">
                {
                  copy.hint
                }
              </p>
            </div>
          </div>,

          document.body,
        )
      : null;

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <>
      {/* =================================================
          NORMAL SLIDER
         ================================================= */}

      <section
        className="mx-auto w-full max-w-[1450px]"
        onMouseEnter={() =>
          setSliderPaused(
            true,
          )
        }
        onMouseLeave={() =>
          setSliderPaused(
            false,
          )
        }
      >
        {/* ===============================================
            SLIDER WINDOW
           =============================================== */}

        <div className="group relative aspect-[16/10] overflow-hidden rounded-[24px] border border-black/[0.065] bg-[#eef1ea] shadow-[0_28px_80px_rgba(27,42,19,0.10)] sm:rounded-[30px]">
          {/* =============================================
              IMAGES
             ============================================= */}

          {images.map(
            (
              image,
              index,
            ) => {
              const active =
                index ===
                activeIndex;

              const alt =
                language ===
                  "am"
                  ? image.alt
                      .am ||
                    `${projectTitle} ፕሮጀክት`
                  : image.alt
                      .en ||
                    `${projectTitle} project`;

              return (
                <button
                  key={
                    image.publicId ||
                    `${image.url}-${index}`
                  }
                  type="button"
                  onClick={() =>
                    openLightbox(
                      index,
                    )
                  }
                  aria-label={`${copy.open}: ${alt}`}
                  className={`absolute inset-0 h-full w-full border-0 bg-transparent p-0 text-left transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    active
                      ? "pointer-events-auto scale-100 opacity-100"
                      : "pointer-events-none scale-[1.02] opacity-0"
                  }`}
                >
                  <img
                    src={
                      image.url
                    }
                    alt={
                      alt
                    }
                    draggable={
                      false
                    }
                    loading={
                      index ===
                      0
                        ? "eager"
                        : "lazy"
                    }
                    decoding="async"
                    className="h-full w-full cursor-zoom-in select-none object-cover"
                  />

                  {/* OPEN BADGE */}

                  <span className="pointer-events-none absolute bottom-5 right-5 flex translate-y-2 items-center gap-2 rounded-full border border-white/50 bg-white/95 px-3.5 py-2.5 text-[8px] font-bold text-[#315a1f] opacity-0 shadow-[0_12px_35px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:bottom-6 sm:right-6">
                    <span className="h-4 w-4">
                      <ExpandIcon />
                    </span>

                    {
                      copy.open
                    }
                  </span>
                </button>
              );
            },
          )}

          {/* =============================================
              OVERLAY
             ============================================= */}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.08] via-transparent to-transparent" />

          {/* =============================================
              COUNTER
             ============================================= */}

          <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/50 bg-white/90 px-3 py-2 text-[8px] font-extrabold tracking-[0.13em] text-[#426c2b] shadow-sm backdrop-blur-xl sm:left-6 sm:top-6">
            {String(
              activeIndex +
                1,
            ).padStart(
              2,
              "0",
            )}

            <span className="mx-1.5 text-black/20">
              /
            </span>

            {String(
              imageCount,
            ).padStart(
              2,
              "0",
            )}
          </div>

          {/* =============================================
              NORMAL SLIDER ARROWS
             ============================================= */}

          {imageCount >
            1 && (
            <>
              <button
                type="button"
                onClick={(
                  event,
                ) => {
                  event.stopPropagation();

                  goPrevious();
                }}
                aria-label={
                  copy.previous
                }
                className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/95 text-[#315a1f] shadow-[0_10px_35px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300 hover:scale-105 sm:left-6 sm:h-12 sm:w-12"
              >
                <span className="h-5 w-5">
                  <LeftArrowIcon />
                </span>
              </button>

              <button
                type="button"
                onClick={(
                  event,
                ) => {
                  event.stopPropagation();

                  goNext();
                }}
                aria-label={
                  copy.next
                }
                className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/95 text-[#315a1f] shadow-[0_10px_35px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300 hover:scale-105 sm:right-6 sm:h-12 sm:w-12"
              >
                <span className="h-5 w-5">
                  <RightArrowIcon />
                </span>
              </button>
            </>
          )}
        </div>

        {/* ===============================================
            DOTS
           =============================================== */}

        {imageCount >
          1 && (
          <div className="mt-5 flex items-center justify-center gap-2">
            {images.map(
              (
                image,
                index,
              ) => {
                const active =
                  index ===
                  activeIndex;

                return (
                  <button
                    key={`${image.publicId}-dot-${index}`}
                    type="button"
                    onClick={() =>
                      setActiveIndex(
                        index,
                      )
                    }
                    aria-label={`Show image ${index + 1}`}
                    aria-current={
                      active
                        ? "true"
                        : undefined
                    }
                    className={`relative h-[7px] overflow-hidden rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      active
                        ? "w-9 bg-[#dce8d5]"
                        : "w-[7px] bg-black/[0.13] hover:bg-[#507d33]/40"
                    }`}
                  >
                    {active && (
                      <span
                        key={
                          activeIndex
                        }
                        className="project-gallery-dot-progress absolute inset-y-0 left-0 w-full rounded-full bg-[#507d33]"
                        style={{
                          animationPlayState:
                            sliderPaused
                              ? "paused"
                              : "running",
                        }}
                      />
                    )}
                  </button>
                );
              },
            )}
          </div>
        )}
      </section>

      {/* =================================================
          PORTALED FULLSCREEN VIEWER
         ================================================= */}

      {
        lightbox
      }
    </>
  );
}