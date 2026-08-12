"use client";

import Hls from "hls.js";

import {
  Check,
  Gauge,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  Volume1,
  Volume2,
  VolumeX,
  Wifi,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import {
  useLanguage,
} from "@/components/providers/language-provider";

const PLAYER_COPY = {
  en: {
    auto: "Auto",
    quality: "Quality",
    original: "Original",
    adaptive: "Adaptive",
    originalStream: "Original stream",
    playVideo: "Play video",
    videoQuality: "Video quality",
    recommended: "Recommended",
    adaptiveUnavailable: "Adaptive quality is unavailable for this video.",
    playbackSpeed: "Playback speed",
    normal: "Normal",
    pause: "Pause",
    play: "Play",
    rewind: "Rewind 10 seconds",
    forward: "Forward 10 seconds",
    unmute: "Unmute",
    mute: "Mute",
    volume: "Volume",
    exitFullscreen: "Exit fullscreen",
    fullscreen: "Fullscreen",
  },
  am: {
    auto: "ራስ-ሰር",
    quality: "ጥራት",
    original: "ዋናው",
    adaptive: "ራሱን የሚያስተካክል",
    originalStream: "ዋናው ቪዲዮ",
    playVideo: "ቪዲዮውን አጫውት",
    videoQuality: "የቪዲዮ ጥራት",
    recommended: "የሚመከር",
    adaptiveUnavailable: "ለዚህ ቪዲዮ ራሱን የሚያስተካክል ጥራት አይገኝም።",
    playbackSpeed: "የማጫወቻ ፍጥነት",
    normal: "መደበኛ",
    pause: "ለአፍታ አቁም",
    play: "አጫውት",
    rewind: "10 ሰከንድ ወደኋላ",
    forward: "10 ሰከንድ ወደፊት",
    unmute: "ድምፅ ክፈት",
    mute: "ድምፅ ዝጋ",
    volume: "የድምፅ መጠን",
    exitFullscreen: "ከሙሉ ማያ ውጣ",
    fullscreen: "ሙሉ ማያ",
  },
} as const;

type QualityOption = {
  index: number;
  height: number;
  bitrate: number;
};

type PlayerMenu =
  | "quality"
  | "speed"
  | null;

type TrainingVideoPlayerProps = {
  src: string;

  title: string;

  resumeSeconds: number;

  completed: boolean;

  onProgress: (
    currentTime: number,
    duration: number,
    force?: boolean,
  ) => void;
};

/* =========================================================
   HELPERS
   ========================================================= */

function formatTime(
  value: number,
) {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return "0:00";
  }

  const totalSeconds =
    Math.floor(value);

  const hours =
    Math.floor(
      totalSeconds / 3600,
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) /
        60,
    );

  const seconds =
    totalSeconds % 60;

  if (
    hours > 0
  ) {
    return `${hours}:${String(
      minutes,
    ).padStart(
      2,
      "0",
    )}:${String(
      seconds,
    ).padStart(
      2,
      "0",
    )}`;
  }

  return `${minutes}:${String(
    seconds,
  ).padStart(
    2,
    "0",
  )}`;
}

function clampPercent(
  value: number,
) {
  if (
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      value,
    ),
  );
}

function getSafeDuration(
  video: HTMLVideoElement,
  fallback: number,
) {
  if (
    Number.isFinite(
      video.duration,
    ) &&
    video.duration > 0
  ) {
    return video.duration;
  }

  return fallback;
}

/*
  Turns:

  https://res.cloudinary.com/CLOUD/video/upload/v123/folder/video.mp4

  into:

  https://res.cloudinary.com/CLOUD/video/upload/sp_auto:maxres_1080p/v123/folder/video.m3u8
*/
function createCloudinaryHlsUrl(
  source: string,
) {
  try {
    const url =
      new URL(source);

    if (
      !url.hostname.includes(
        "cloudinary.com",
      )
    ) {
      return null;
    }

    const marker =
      "/video/upload/";

    if (
      !url.pathname.includes(
        marker,
      )
    ) {
      return null;
    }

    const parts =
      url.pathname.split(
        marker,
      );

    const prefix =
      parts[0];

    const assetPath =
      parts[1];

    if (
      !assetPath
    ) {
      return null;
    }

    const hlsAsset =
      assetPath.replace(
        /\.[^/.]+$/,
        ".m3u8",
      );

    url.pathname =
      `${prefix}${marker}sp_auto:maxres_1080p/${hlsAsset}`;

    url.search =
      "";

    url.hash =
      "";

    return url.toString();
  } catch {
    return null;
  }
}

/* =========================================================
   PLAYER
   ========================================================= */

export default function TrainingVideoPlayer({
  src,
  title,
  resumeSeconds,
  completed,
  onProgress,
}: TrainingVideoPlayerProps) {
  const {
    language,
  } = useLanguage();

  const copy =
    PLAYER_COPY[
      language
    ];

  const playerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null,
    );

  const hlsRef =
    useRef<Hls | null>(
      null,
    );

  const progressHandlerRef =
    useRef(
      onProgress,
    );

  const hideControlsTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(
      null,
    );

  const hasResumedRef =
    useRef(
      false,
    );

  const [
    playing,
    setPlaying,
  ] =
    useState(
      false,
    );

  const [
    buffering,
    setBuffering,
  ] =
    useState(
      false,
    );

  const [
    currentTime,
    setCurrentTime,
  ] =
    useState(
      0,
    );

  const [
    duration,
    setDuration,
  ] =
    useState(
      0,
    );

  const [
    bufferedPercent,
    setBufferedPercent,
  ] =
    useState(
      0,
    );

  const [
    volume,
    setVolume,
  ] =
    useState(
      1,
    );

  const [
    muted,
    setMuted,
  ] =
    useState(
      false,
    );

  const [
    playbackRate,
    setPlaybackRate,
  ] =
    useState(
      1,
    );

  const [
    fullscreen,
    setFullscreen,
  ] =
    useState(
      false,
    );

  const [
    controlsVisible,
    setControlsVisible,
  ] =
    useState(
      true,
    );

  const [
    openMenu,
    setOpenMenu,
  ] =
    useState<PlayerMenu>(
      null,
    );

  const [
    adaptiveAvailable,
    setAdaptiveAvailable,
  ] =
    useState(
      false,
    );

  const [
    qualityLevels,
    setQualityLevels,
  ] =
    useState<
      QualityOption[]
    >(
      [],
    );

  const [
    selectedQuality,
    setSelectedQuality,
  ] =
    useState<
      "auto" | number
    >(
      "auto",
    );

  const [
    activeQualityHeight,
    setActiveQualityHeight,
  ] =
    useState<
      number | null
    >(
      null,
    );

  const [
    usingFallback,
    setUsingFallback,
  ] =
    useState(
      false,
    );

  const hlsUrl =
    useMemo(
      () =>
        createCloudinaryHlsUrl(
          src,
        ),
      [
        src,
      ],
    );

  /* =======================================================
     LATEST PROGRESS CALLBACK
     ======================================================= */

  useEffect(
    () => {
      progressHandlerRef.current =
        onProgress;
    },
    [
      onProgress,
    ],
  );

  /* =======================================================
     TIMER CLEANUP
     ======================================================= */

  useEffect(
    () => {
      return () => {
        const timer =
          hideControlsTimerRef.current;

        if (
          timer
        ) {
          clearTimeout(
            timer,
          );
        }
      };
    },
    [],
  );

  /* =======================================================
     FULLSCREEN
     ======================================================= */

  useEffect(
    () => {
      function handleFullscreenChange() {
        setFullscreen(
          document.fullscreenElement ===
            playerRef.current,
        );
      }

      document.addEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );

      return () => {
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange,
        );
      };
    },
    [],
  );

  /* =======================================================
     HLS ADAPTIVE STREAMING
     ======================================================= */

  useEffect(
    () => {
      const initialVideo =
        videoRef.current;

      if (
        !initialVideo
      ) {
        return;
      }

      let destroyed =
        false;

      let attemptedMediaRecovery =
        false;

      /*
        Important:
        This is intentionally NOT named useSomething.

        Otherwise React thinks it is a custom Hook.
      */
      function fallbackToOriginalSource() {
        if (
          destroyed
        ) {
          return;
        }

        const currentVideo =
          videoRef.current;

        if (
          !currentVideo
        ) {
          return;
        }

        const currentHls =
          hlsRef.current;

        if (
          currentHls
        ) {
          currentHls.destroy();

          hlsRef.current =
            null;
        }

        currentVideo.src =
          src;

        currentVideo.load();

        /*
          These state changes happen from the
          HLS error callback, not synchronously
          from the effect body.
        */
        setAdaptiveAvailable(
          false,
        );

        setQualityLevels(
          [],
        );

        setSelectedQuality(
          "auto",
        );

        setActiveQualityHeight(
          null,
        );

        setUsingFallback(
          true,
        );
      }

      /* ===============================================
         HLS.JS
         =============================================== */

      if (
        hlsUrl &&
        Hls.isSupported()
      ) {
        const hls =
          new Hls({
            startLevel:
              -1,

            testBandwidth:
              true,

            capLevelToPlayerSize:
              true,

            capLevelOnFPSDrop:
              true,

            maxStarvationDelay:
              3,

            maxLoadingDelay:
              3,

            maxBufferLength:
              30,

            maxMaxBufferLength:
              90,

            backBufferLength:
              30,

            enableWorker:
              true,
          });

        hlsRef.current =
          hls;

        hls.on(
          Hls.Events.MANIFEST_PARSED,
          () => {
            if (
              destroyed
            ) {
              return;
            }

            const seenHeights =
              new Set<number>();

            const options =
              hls.levels
                .map(
                  (
                    level,
                    index,
                  ) => ({
                    index,

                    height:
                      Number(
                        level.height,
                      ) ||
                      0,

                    bitrate:
                      Number(
                        level.bitrate,
                      ) ||
                      0,
                  }),
                )
                .filter(
                  (
                    option,
                  ) => {
                    if (
                      option.height <=
                        0
                    ) {
                      return false;
                    }

                    if (
                      seenHeights.has(
                        option.height,
                      )
                    ) {
                      return false;
                    }

                    seenHeights.add(
                      option.height,
                    );

                    return true;
                  },
                )
                .sort(
                  (
                    a,
                    b,
                  ) =>
                    b.height -
                    a.height,
                );

            setQualityLevels(
              options,
            );

            setAdaptiveAvailable(
              true,
            );

            setUsingFallback(
              false,
            );
          },
        );

        hls.on(
          Hls.Events.LEVEL_SWITCHED,
          (
            _event,
            data,
          ) => {
            if (
              destroyed
            ) {
              return;
            }

            const level =
              hls.levels[
                data.level
              ];

            const nextHeight =
              Number(
                level?.height,
              );

            if (
              Number.isFinite(
                nextHeight,
              ) &&
              nextHeight > 0
            ) {
              setActiveQualityHeight(
                nextHeight,
              );
            } else {
              setActiveQualityHeight(
                null,
              );
            }
          },
        );

        hls.on(
          Hls.Events.ERROR,
          (
            _event,
            data,
          ) => {
            if (
              destroyed ||
              !data.fatal
            ) {
              return;
            }

            if (
              data.type ===
              Hls.ErrorTypes.MEDIA_ERROR
            ) {
              if (
                !attemptedMediaRecovery
              ) {
                attemptedMediaRecovery =
                  true;

                hls.recoverMediaError();

                return;
              }

              fallbackToOriginalSource();

              return;
            }

            if (
              data.type ===
              Hls.ErrorTypes.NETWORK_ERROR
            ) {
              fallbackToOriginalSource();

              return;
            }

            fallbackToOriginalSource();
          },
        );

        hls.loadSource(
          hlsUrl,
        );

        hls.attachMedia(
          initialVideo,
        );

        return () => {
          destroyed =
            true;

          hls.destroy();

          if (
            hlsRef.current ===
            hls
          ) {
            hlsRef.current =
              null;
          }
        };
      }

      /* ===============================================
         SAFARI NATIVE HLS
         =============================================== */

      if (
        hlsUrl &&
        initialVideo.canPlayType(
          "application/vnd.apple.mpegurl",
        )
      ) {
        function handleLoadedHls() {
          if (
            destroyed
          ) {
            return;
          }

          setAdaptiveAvailable(
            true,
          );

          setUsingFallback(
            false,
          );
        }

        initialVideo.addEventListener(
          "loadedmetadata",
          handleLoadedHls,
          {
            once:
              true,
          },
        );

        initialVideo.src =
          hlsUrl;

        initialVideo.load();

        return () => {
          destroyed =
            true;

          initialVideo.removeEventListener(
            "loadedmetadata",
            handleLoadedHls,
          );
        };
      }

      /* ===============================================
         NORMAL MP4 FALLBACK

         No setState here.

         React's compiler complains when state is
         synchronously updated inside an effect.
         =============================================== */

      initialVideo.src =
        src;

      initialVideo.load();

      return () => {
        destroyed =
          true;
      };
    },
    [
      hlsUrl,
      src,
    ],
  );

  /* =======================================================
     CONTROL VISIBILITY
     ======================================================= */

  function clearHideTimer() {
    const timer =
      hideControlsTimerRef.current;

    if (
      timer
    ) {
      clearTimeout(
        timer,
      );

      hideControlsTimerRef.current =
        null;
    }
  }

  function scheduleControlsHide() {
    clearHideTimer();

    hideControlsTimerRef.current =
      setTimeout(
        () => {
          setControlsVisible(
            false,
          );

          setOpenMenu(
            null,
          );
        },
        2500,
      );
  }

  function showControls() {
    setControlsVisible(
      true,
    );

    clearHideTimer();

    const video =
      videoRef.current;

    if (
      video &&
      !video.paused
    ) {
      scheduleControlsHide();
    }
  }

  /* =======================================================
     PLAYBACK
     ======================================================= */

  function togglePlayback() {
    const video =
      videoRef.current;

    if (
      !video
    ) {
      return;
    }

    setOpenMenu(
      null,
    );

    if (
      video.paused
    ) {
      void video
        .play()
        .catch(
          () => {
            //
          },
        );

      return;
    }

    video.pause();
  }

  function seekBy(
    seconds: number,
  ) {
    const video =
      videoRef.current;

    if (
      !video
    ) {
      return;
    }

    const videoDuration =
      getSafeDuration(
        video,
        duration,
      );

    if (
      videoDuration <=
      0
    ) {
      return;
    }

    const nextTime =
      Math.max(
        0,
        Math.min(
          videoDuration,
          video.currentTime +
            seconds,
        ),
      );

    video.currentTime =
      nextTime;

    setCurrentTime(
      nextTime,
    );

    showControls();
  }

  function handleSeek(
    nextTime: number,
  ) {
    const video =
      videoRef.current;

    if (
      !video
    ) {
      return;
    }

    const videoDuration =
      getSafeDuration(
        video,
        duration,
      );

    const safeTime =
      videoDuration > 0
        ? Math.max(
            0,
            Math.min(
              nextTime,
              videoDuration,
            ),
          )
        : Math.max(
            0,
            nextTime,
          );

    video.currentTime =
      safeTime;

    setCurrentTime(
      safeTime,
    );

    progressHandlerRef.current(
      safeTime,
      videoDuration,
      true,
    );
  }

  /* =======================================================
     VIDEO EVENTS
     ======================================================= */

  function handleLoadedMetadata() {
    const video =
      videoRef.current;

    if (
      !video
    ) {
      return;
    }

    const nextDuration =
      getSafeDuration(
        video,
        0,
      );

    setDuration(
      nextDuration,
    );

    /*
      If HLS was not available, this also lets
      the UI know that playback is using the
      original direct video.
    */
    if (
      !hlsRef.current &&
      !adaptiveAvailable
    ) {
      setUsingFallback(
        true,
      );
    }

    if (
      hasResumedRef.current
    ) {
      return;
    }

    hasResumedRef.current =
      true;

    if (
      completed ||
      resumeSeconds <=
        1 ||
      nextDuration <=
        0
    ) {
      return;
    }

    if (
      resumeSeconds <
      nextDuration -
        4
    ) {
      video.currentTime =
        resumeSeconds;

      setCurrentTime(
        resumeSeconds,
      );
    }
  }

  function handleTimeUpdate() {
    const video =
      videoRef.current;

    if (
      !video
    ) {
      return;
    }

    const nextCurrentTime =
      video.currentTime;

    const nextDuration =
      getSafeDuration(
        video,
        duration,
      );

    setCurrentTime(
      nextCurrentTime,
    );

    if (
      nextDuration > 0 &&
      nextDuration !==
        duration
    ) {
      setDuration(
        nextDuration,
      );
    }

    progressHandlerRef.current(
      nextCurrentTime,
      nextDuration,
      false,
    );
  }

  function handleBufferProgress() {
    const video =
      videoRef.current;

    if (
      !video
    ) {
      return;
    }

    const videoDuration =
      getSafeDuration(
        video,
        duration,
      );

    if (
      videoDuration <=
        0 ||
      video.buffered.length ===
        0
    ) {
      return;
    }

    const lastRange =
      video.buffered.length -
      1;

    const bufferedEnd =
      video.buffered.end(
        lastRange,
      );

    const nextBufferedPercent =
      clampPercent(
        (
          bufferedEnd /
          videoDuration
        ) *
          100,
      );

    setBufferedPercent(
      nextBufferedPercent,
    );
  }

  function handlePlay() {
    setPlaying(
      true,
    );

    setBuffering(
      false,
    );

    setControlsVisible(
      true,
    );

    scheduleControlsHide();
  }

  function handlePlaying() {
    setBuffering(
      false,
    );

    setPlaying(
      true,
    );

    scheduleControlsHide();
  }

  function handlePause() {
    const video =
      videoRef.current;

    setPlaying(
      false,
    );

    setBuffering(
      false,
    );

    setControlsVisible(
      true,
    );

    clearHideTimer();

    if (
      !video
    ) {
      return;
    }

    const videoDuration =
      getSafeDuration(
        video,
        duration,
      );

    progressHandlerRef.current(
      video.currentTime,
      videoDuration,
      true,
    );
  }

  function handleEnded() {
    const video =
      videoRef.current;

    setPlaying(
      false,
    );

    setBuffering(
      false,
    );

    setControlsVisible(
      true,
    );

    clearHideTimer();

    if (
      !video
    ) {
      return;
    }

    const videoDuration =
      getSafeDuration(
        video,
        duration,
      );

    const finalTime =
      videoDuration > 0
        ? videoDuration
        : video.currentTime;

    setCurrentTime(
      finalTime,
    );

    progressHandlerRef.current(
      finalTime,
      videoDuration,
      true,
    );
  }

  function handleWaiting() {
    setBuffering(
      true,
    );

    setControlsVisible(
      true,
    );

    clearHideTimer();
  }

  function handleStalled() {
    setBuffering(
      true,
    );

    setControlsVisible(
      true,
    );
  }

  /* =======================================================
     VOLUME
     ======================================================= */

  function handleVolumeChange(
    nextVolume: number,
  ) {
    const video =
      videoRef.current;

    if (
      !video
    ) {
      return;
    }

    const safeVolume =
      Math.max(
        0,
        Math.min(
          1,
          nextVolume,
        ),
      );

    video.volume =
      safeVolume;

    video.muted =
      safeVolume ===
      0;

    setVolume(
      safeVolume,
    );

    setMuted(
      safeVolume ===
        0,
    );
  }

  function toggleMute() {
    const video =
      videoRef.current;

    if (
      !video
    ) {
      return;
    }

    video.muted =
      !video.muted;

    setMuted(
      video.muted,
    );
  }

  /* =======================================================
     SPEED
     ======================================================= */

  function changePlaybackRate(
    rate: number,
  ) {
    const video =
      videoRef.current;

    if (
      !video
    ) {
      return;
    }

    video.playbackRate =
      rate;

    setPlaybackRate(
      rate,
    );

    setOpenMenu(
      null,
    );
  }

  /* =======================================================
     QUALITY
     ======================================================= */

  function changeQuality(
    quality:
      | "auto"
      | number,
  ) {
    const hls =
      hlsRef.current;

    if (
      !hls
    ) {
      setOpenMenu(
        null,
      );

      return;
    }

    if (
      quality ===
      "auto"
    ) {
      /*
        -1 returns HLS.js to automatic
        adaptive bitrate selection.
      */
      hls.currentLevel =
        -1;

      setSelectedQuality(
        "auto",
      );

      setOpenMenu(
        null,
      );

      return;
    }

    hls.currentLevel =
      quality;

    setSelectedQuality(
      quality,
    );

    setOpenMenu(
      null,
    );
  }

  /* =======================================================
     FULLSCREEN
     ======================================================= */

  async function toggleFullscreen() {
    const player =
      playerRef.current;

    if (
      !player
    ) {
      return;
    }

    try {
      if (
        document.fullscreenElement
      ) {
        await document.exitFullscreen();

        return;
      }

      await player.requestFullscreen();
    } catch {
      //
    }
  }

  /* =======================================================
     KEYBOARD
     ======================================================= */

  function handleKeyboard(
    event:
      KeyboardEvent<HTMLDivElement>,
  ) {
    const target =
      event.target;

    if (
      target instanceof
        HTMLInputElement ||
      target instanceof
        HTMLButtonElement ||
      target instanceof
        HTMLSelectElement
    ) {
      return;
    }

    switch (
      event.key.toLowerCase()
    ) {
      case " ":
      case "k":
        event.preventDefault();

        togglePlayback();

        break;

      case "arrowleft":
        event.preventDefault();

        seekBy(
          -5,
        );

        break;

      case "arrowright":
        event.preventDefault();

        seekBy(
          5,
        );

        break;

      case "j":
        event.preventDefault();

        seekBy(
          -10,
        );

        break;

      case "l":
        event.preventDefault();

        seekBy(
          10,
        );

        break;

      case "m":
        event.preventDefault();

        toggleMute();

        break;

      case "f":
        event.preventDefault();

        void toggleFullscreen();

        break;
    }
  }

  function handleVideoClick(
    event:
      MouseEvent<HTMLVideoElement>,
  ) {
    event.stopPropagation();

    togglePlayback();
  }

  /* =======================================================
     DERIVED UI
     ======================================================= */

  const playedPercent =
    duration > 0
      ? clampPercent(
          (
            currentTime /
            duration
          ) *
            100,
        )
      : 0;

  const loadedPercent =
    Math.max(
      playedPercent,
      bufferedPercent,
    );

  const selectedQualityOption =
    typeof selectedQuality ===
    "number"
      ? qualityLevels.find(
          (
            option,
          ) =>
            option.index ===
            selectedQuality,
        )
      : null;

  const qualityText =
    adaptiveAvailable
      ? selectedQuality ===
        "auto"
        ? activeQualityHeight
          ? `${copy.auto} · ${activeQualityHeight}p`
          : copy.auto
        : selectedQualityOption
          ? `${selectedQualityOption.height}p`
          : copy.quality
      : copy.original;

  const progressBackground =
    `linear-gradient(
      to right,
      #a5e46f 0%,
      #a5e46f ${playedPercent}%,
      rgba(255,255,255,0.34) ${playedPercent}%,
      rgba(255,255,255,0.34) ${loadedPercent}%,
      rgba(255,255,255,0.17) ${loadedPercent}%,
      rgba(255,255,255,0.17) 100%
    )`;

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div
      ref={
        playerRef
      }
      tabIndex={
        0
      }
      onKeyDown={
        handleKeyboard
      }
      onMouseMove={
        showControls
      }
      onMouseEnter={
        showControls
      }
      onMouseLeave={
        () => {
          if (
            playing &&
            !openMenu
          ) {
            clearHideTimer();

            setControlsVisible(
              false,
            );
          }
        }
      }
      className="group relative aspect-video w-full overflow-hidden bg-black outline-none"
    >
      {/* ===================================================
          VIDEO
          =================================================== */}

      <video
        ref={
          videoRef
        }
        playsInline
        preload="metadata"
        controls={
          false
        }
        onClick={
          handleVideoClick
        }
        onDoubleClick={
          () =>
            void toggleFullscreen()
        }
        onLoadedMetadata={
          handleLoadedMetadata
        }
        onDurationChange={
          handleLoadedMetadata
        }
        onTimeUpdate={
          handleTimeUpdate
        }
        onProgress={
          handleBufferProgress
        }
        onPlay={
          handlePlay
        }
        onPlaying={
          handlePlaying
        }
        onPause={
          handlePause
        }
        onEnded={
          handleEnded
        }
        onWaiting={
          handleWaiting
        }
        onStalled={
          handleStalled
        }
        className="h-full w-full cursor-pointer bg-black object-contain"
      />

      {/* ===================================================
          TOP GRADIENT
          =================================================== */}

      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 via-black/15 to-transparent transition-opacity duration-300 ${
          controlsVisible ||
          !playing
            ? "opacity-100"
            : "opacity-0"
        }`}
      />

      {/* ===================================================
          TITLE / STREAM STATUS
          =================================================== */}

      <div
        className={`pointer-events-none absolute left-4 right-4 top-4 flex items-start justify-between gap-3 transition-all duration-300 sm:left-5 sm:right-5 sm:top-5 ${
          controlsVisible ||
          !playing
            ? "translate-y-0 opacity-100"
            : "-translate-y-2 opacity-0"
        }`}
      >
        <div className="min-w-0">
          <p className="max-w-[70vw] truncate text-[11px] font-black text-white sm:text-[13px]">
            {title}
          </p>
        </div>

        {adaptiveAvailable ? (
          <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-black/35 px-2.5 py-1.5 text-[8px] font-black text-white/75 backdrop-blur-md">
            <Wifi className="h-3 w-3 text-[#b3ed88]" />

            {copy.adaptive}
          </div>
        ) : usingFallback ? (
          <div className="rounded-full border border-white/10 bg-black/35 px-2.5 py-1.5 text-[8px] font-bold text-white/60 backdrop-blur-md">
            {copy.originalStream}
          </div>
        ) : null}
      </div>

      {/* ===================================================
          CENTER PLAY
          =================================================== */}

      {!playing &&
      !buffering ? (
        <button
          type="button"
          aria-label={copy.playVideo}
          onClick={
            (
              event,
            ) => {
              event.stopPropagation();

              togglePlayback();
            }
          }
          className="absolute left-1/2 top-1/2 grid h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/55 text-white shadow-[0_18px_55px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:scale-105 hover:bg-black/70 sm:h-[78px] sm:w-[78px]"
        >
          <Play className="ml-1 h-7 w-7 fill-current sm:h-8 sm:w-8" />
        </button>
      ) : null}

      {/* ===================================================
          BUFFERING
          =================================================== */}

      {buffering ? (
        <div className="pointer-events-none absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/55 backdrop-blur-xl">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
        </div>
      ) : null}

      {/* ===================================================
          BOTTOM GRADIENT
          =================================================== */}

      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/95 via-black/55 to-transparent transition-opacity duration-300 ${
          controlsVisible ||
          !playing ||
          openMenu
            ? "opacity-100"
            : "opacity-0"
        }`}
      />

      {/* ===================================================
          QUALITY MENU
          =================================================== */}

      {openMenu ===
      "quality" ? (
        <div
          className="absolute bottom-[76px] right-4 z-30 w-[200px] overflow-hidden rounded-2xl border border-white/10 bg-[#181b17]/95 p-1.5 shadow-2xl backdrop-blur-xl sm:right-5"
          onClick={
            (
              event,
            ) =>
              event.stopPropagation()
          }
        >
          <div className="px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-[0.13em] text-white/40">
              {copy.videoQuality}
            </p>
          </div>

          {adaptiveAvailable ? (
            <>
              <button
                type="button"
                onClick={
                  () =>
                    changeQuality(
                      "auto",
                    )
                }
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[10px] font-bold text-white transition hover:bg-white/[0.07]"
              >
                <span>
                  {copy.auto}

                  <span className="ml-2 text-[8px] font-medium text-white/35">
                    {copy.recommended}
                  </span>
                </span>

                {selectedQuality ===
                "auto" ? (
                  <Check className="h-3.5 w-3.5 text-[#b3ed88]" />
                ) : null}
              </button>

              {qualityLevels.map(
                (
                  option,
                ) => (
                  <button
                    key={
                      option.index
                    }
                    type="button"
                    onClick={
                      () =>
                        changeQuality(
                          option.index,
                        )
                    }
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[10px] font-bold text-white transition hover:bg-white/[0.07]"
                  >
                    <span>
                      {
                        option.height
                      }
                      p
                    </span>

                    {selectedQuality ===
                    option.index ? (
                      <Check className="h-3.5 w-3.5 text-[#b3ed88]" />
                    ) : null}
                  </button>
                ),
              )}
            </>
          ) : (
            <div className="rounded-xl px-3 py-3 text-[10px] font-bold leading-5 text-white/65">
              {copy.adaptiveUnavailable}
            </div>
          )}
        </div>
      ) : null}

      {/* ===================================================
          SPEED MENU
          =================================================== */}

      {openMenu ===
      "speed" ? (
        <div
          className="absolute bottom-[76px] right-4 z-30 w-[155px] overflow-hidden rounded-2xl border border-white/10 bg-[#181b17]/95 p-1.5 shadow-2xl backdrop-blur-xl sm:right-5"
          onClick={
            (
              event,
            ) =>
              event.stopPropagation()
          }
        >
          <div className="px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-[0.13em] text-white/40">
              {copy.playbackSpeed}
            </p>
          </div>

          {[
            0.5,
            0.75,
            1,
            1.25,
            1.5,
            1.75,
            2,
          ].map(
            (
              rate,
            ) => (
              <button
                key={
                  rate
                }
                type="button"
                onClick={
                  () =>
                    changePlaybackRate(
                      rate,
                    )
                }
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-[10px] font-bold text-white transition hover:bg-white/[0.07]"
              >
                <span>
                  {rate ===
                  1
                    ? copy.normal
                    : `${rate}×`}
                </span>

                {playbackRate ===
                rate ? (
                  <Check className="h-3.5 w-3.5 text-[#b3ed88]" />
                ) : null}
              </button>
            ),
          )}
        </div>
      ) : null}

      {/* ===================================================
          CUSTOM CONTROLS
          =================================================== */}

      <div
        className={`absolute inset-x-0 bottom-0 z-20 px-3 pb-3 transition-all duration-300 sm:px-5 sm:pb-4 ${
          controlsVisible ||
          !playing ||
          openMenu
            ? "translate-y-0 opacity-100"
            : "translate-y-3 opacity-0"
        }`}
        onClick={
          (
            event,
          ) =>
            event.stopPropagation()
        }
      >
        {/* ===============================================
            SEEK BAR
            =============================================== */}

        <div className="group/seek flex h-5 items-center">
          <input
            type="range"
            min={
              0
            }
            max={
              duration > 0
                ? duration
                : 0
            }
            step={
              0.1
            }
            value={
              duration > 0
                ? Math.min(
                    currentTime,
                    duration,
                  )
                : 0
            }
            onChange={
              (
                event,
              ) =>
                handleSeek(
                  Number(
                    event.target.value,
                  ),
                )
            }
            aria-label="Video progress"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none transition-all group-hover/seek:h-2
              [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:w-3.5
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-[#b3ed88]
              [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgba(179,237,136,0.18)]
              [&::-moz-range-thumb]:h-3.5
              [&::-moz-range-thumb]:w-3.5
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:bg-[#b3ed88]"
            style={{
              background:
                progressBackground,
            }}
          />
        </div>

        {/* ===============================================
            BUTTON ROW
            =============================================== */}

        <div className="mt-1 flex items-center gap-1 text-white sm:gap-2">
          {/* PLAY */}

          <button
            type="button"
            aria-label={
              playing
                ? copy.pause
                : copy.play
            }
            onClick={
              togglePlayback
            }
            className="grid h-9 w-9 place-items-center rounded-xl transition hover:bg-white/10 sm:h-10 sm:w-10"
          >
            {playing ? (
              <Pause className="h-[18px] w-[18px] fill-current" />
            ) : (
              <Play className="ml-0.5 h-[18px] w-[18px] fill-current" />
            )}
          </button>

          {/* BACK 10 */}

          <button
            type="button"
            aria-label={copy.rewind}
            onClick={
              () =>
                seekBy(
                  -10,
                )
            }
            className="hidden h-9 w-9 place-items-center rounded-xl transition hover:bg-white/10 sm:grid sm:h-10 sm:w-10"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* FORWARD 10 */}

          <button
            type="button"
            aria-label={copy.forward}
            onClick={
              () =>
                seekBy(
                  10,
                )
            }
            className="hidden h-9 w-9 place-items-center rounded-xl transition hover:bg-white/10 sm:grid sm:h-10 sm:w-10"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          {/* =============================================
              VOLUME
              ============================================= */}

          <div className="group/volume flex items-center">
            <button
              type="button"
              aria-label={
                muted
                  ? copy.unmute
                  : copy.mute
              }
              onClick={
                toggleMute
              }
              className="grid h-9 w-9 place-items-center rounded-xl transition hover:bg-white/10 sm:h-10 sm:w-10"
            >
              {muted ||
              volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : volume < 0.5 ? (
                <Volume1 className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>

            <div className="hidden w-0 overflow-hidden transition-all duration-200 group-hover/volume:w-[76px] sm:block">
              <input
                type="range"
                min={
                  0
                }
                max={
                  1
                }
                step={
                  0.05
                }
                value={
                  muted
                    ? 0
                    : volume
                }
                onChange={
                  (
                    event,
                  ) =>
                    handleVolumeChange(
                      Number(
                        event.target.value,
                      ),
                    )
                }
                aria-label={copy.volume}
                className="ml-1 h-1 w-[68px] cursor-pointer appearance-none rounded-full bg-white/25
                  [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:w-3
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-moz-range-thumb]:h-3
                  [&::-moz-range-thumb]:w-3
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:bg-white"
              />
            </div>
          </div>

          {/* =============================================
              TIME
              ============================================= */}

          <div className="ml-1 whitespace-nowrap text-[10px] font-bold text-white/75 sm:text-[11px]">
            {formatTime(
              currentTime,
            )}{" "}

            <span className="text-white/35">
              /
            </span>{" "}

            {formatTime(
              duration,
            )}
          </div>

          {/* =============================================
              RIGHT SIDE
              ============================================= */}

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            {/* SPEED DESKTOP */}

            <button
              type="button"
              onClick={
                () => {
                  setControlsVisible(
                    true,
                  );

                  setOpenMenu(
                    openMenu ===
                      "speed"
                      ? null
                      : "speed",
                  );
                }
              }
              className={`hidden h-9 items-center justify-center rounded-xl px-2.5 text-[9px] font-black transition sm:inline-flex sm:h-10 ${
                openMenu ===
                "speed"
                  ? "bg-white/15"
                  : "hover:bg-white/10"
              }`}
            >
              {
                playbackRate
              }
              ×
            </button>

            {/* QUALITY */}

            <button
              type="button"
              onClick={
                () => {
                  setControlsVisible(
                    true,
                  );

                  setOpenMenu(
                    openMenu ===
                      "quality"
                      ? null
                      : "quality",
                  );
                }
              }
              className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-2.5 text-[9px] font-black transition sm:h-10 sm:px-3 ${
                openMenu ===
                "quality"
                  ? "bg-white/15"
                  : "hover:bg-white/10"
              }`}
            >
              <Gauge className="h-3.5 w-3.5" />

              <span className="hidden sm:inline">
                {
                  qualityText
                }
              </span>
            </button>

            {/* MOBILE SETTINGS */}

            <button
              type="button"
              aria-label={copy.playbackSpeed}
              onClick={
                () => {
                  setControlsVisible(
                    true,
                  );

                  setOpenMenu(
                    openMenu ===
                      "speed"
                      ? null
                      : "speed",
                  );
                }
              }
              className="grid h-9 w-9 place-items-center rounded-xl transition hover:bg-white/10 sm:hidden"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* FULLSCREEN */}

            <button
              type="button"
              aria-label={
                fullscreen
                  ? copy.exitFullscreen
                  : copy.fullscreen
              }
              onClick={
                () =>
                  void toggleFullscreen()
              }
              className="grid h-9 w-9 place-items-center rounded-xl transition hover:bg-white/10 sm:h-10 sm:w-10"
            >
              {fullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
