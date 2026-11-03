"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  getYouTubeVideoId,
  toEmbedUrl,
  type SuccessVideo,
} from "../lib/successVideoUtils";

type YouTubePlayerInstance = {
  cueVideoById: (videoId: string) => void;
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getOptions?: (module: string) => string[];
  getPlayerState: () => number;
  loadVideoById: (videoId: string) => void;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setOption?: (module: string, option: string, value: object) => void;
  stopVideo: () => void;
};

export type YouTubePlayerControls = Pick<
  YouTubePlayerInstance,
  | "getCurrentTime"
  | "getDuration"
  | "getPlayerState"
  | "pauseVideo"
  | "playVideo"
  | "seekTo"
  | "stopVideo"
>;

type YouTubePlayerEvents = {
  onApiChange: (event: { target: YouTubePlayerInstance }) => void;
  onError: (event: { data: number }) => void;
  onReady: (event: { target: YouTubePlayerInstance }) => void;
  onStateChange: (event: {
    data: number;
    target: YouTubePlayerInstance;
  }) => void;
};

type YouTubeApi = {
  Player: new (
    element: HTMLElement,
    options: {
      height: string;
      playerVars: Record<string, number | string>;
      videoId: string;
      width: string;
      events: YouTubePlayerEvents;
    }
  ) => YouTubePlayerInstance;
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YouTubePlayerProps = {
  video: SuccessVideo;
  autoPlay?: boolean;
  className: string;
  onPlayerReady?: (player: YouTubePlayerControls | null) => void;
  onPlaybackUpdate?: (
    currentTime: number,
    duration: number,
    isPlaying: boolean
  ) => void;
};

const YOUTUBE_API_URL = "https://www.youtube.com/iframe_api";
const YOUTUBE_API_TIMEOUT_MS = 15000;
const failedScripts = new WeakSet<HTMLScriptElement>();
let youtubeApiPromise: Promise<YouTubeApi> | null = null;

function loadYouTubeApiAttempt(): Promise<YouTubeApi> {
  return new Promise<YouTubeApi>((resolve, reject) => {
    let settled = false;
    let script: HTMLScriptElement | undefined;
    let createdScript = false;
    let pollTimer = 0;
    let timeoutTimer = 0;

    const previousReadyCallback = window.onYouTubeIframeAPIReady;
    const restoreReadyCallback = () => {
      if (window.onYouTubeIframeAPIReady === readyCallback) {
        window.onYouTubeIframeAPIReady = previousReadyCallback;
      }
    };
    const cleanupListeners = () => {
      window.clearInterval(pollTimer);
      window.clearTimeout(timeoutTimer);
      script?.removeEventListener("load", checkApi);
      script?.removeEventListener("error", handleScriptError);
      restoreReadyCallback();
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanupListeners();
      if (script) failedScripts.add(script);
      if (createdScript) script?.remove();
      reject(error);
    };
    const checkApi = () => {
      const api = window.YT;
      if (settled || !api?.Player) return;
      settled = true;
      cleanupListeners();
      resolve(api);
    };
    const readyCallback = () => {
      try {
        previousReadyCallback?.();
      } finally {
        checkApi();
      }
    };
    const handleScriptError = () => {
      fail(new Error("The YouTube IFrame Player API script failed to load"));
    };

    window.onYouTubeIframeAPIReady = readyCallback;
    script = Array.from(
      document.querySelectorAll<HTMLScriptElement>("script[src]")
    ).find(
      (candidate) =>
        candidate.src.startsWith(YOUTUBE_API_URL) &&
        !failedScripts.has(candidate)
    );

    if (!script) {
      script = document.createElement("script");
      script.src = YOUTUBE_API_URL;
      script.async = true;
      createdScript = true;
      document.head.appendChild(script);
    }

    script.addEventListener("load", checkApi);
    script.addEventListener("error", handleScriptError, { once: true });
    pollTimer = window.setInterval(checkApi, 50);
    timeoutTimer = window.setTimeout(() => {
      fail(new Error("Timed out waiting for the YouTube IFrame Player API"));
    }, YOUTUBE_API_TIMEOUT_MS);
    checkApi();
  });
}

function getYouTubeApi(): Promise<YouTubeApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("The YouTube API can only load in a browser"));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = (async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await loadYouTubeApiAttempt();
      } catch (error) {
        lastError = error;
        if (attempt === 0) {
          await new Promise((resolve) => window.setTimeout(resolve, 500));
        }
      }
    }
    throw lastError;
  })().catch((error: unknown) => {
    youtubeApiPromise = null;
    throw error;
  });

  return youtubeApiPromise;
}

function clearCaptionsTrack(player: YouTubePlayerInstance) {
  try {
    const options = player.getOptions?.("captions");
    if (!options?.includes("track")) return;
    if (!player.setOption) {
      console.warn("The YouTube player does not support setting caption options");
      return;
    }
    player.setOption("captions", "track", {});
  } catch (error) {
    console.warn("Unable to clear the YouTube captions track", error);
  }
}

export default function YouTubePlayer({
  video,
  autoPlay = false,
  className,
  onPlayerReady,
  onPlaybackUpdate,
}: YouTubePlayerProps) {
  const videoId = getYouTubeVideoId(video.url || "");
  const embedUrl = toEmbedUrl(video, autoPlay);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const playerReadyRef = useRef(false);
  const currentVideoIdRef = useRef<string | null>(null);
  const videoIdRef = useRef(videoId);
  const embedUrlRef = useRef(embedUrl);
  const autoPlayRef = useRef(autoPlay);
  const onPlayerReadyRef = useRef(onPlayerReady);
  const onPlaybackUpdateRef = useRef(onPlaybackUpdate);
  const [apiStatus, setApiStatus] = useState<"loading" | "ready" | "failed">(
    "loading"
  );

  useLayoutEffect(() => {
    videoIdRef.current = videoId;
    embedUrlRef.current = embedUrl;
    autoPlayRef.current = autoPlay;
    onPlayerReadyRef.current = onPlayerReady;
    onPlaybackUpdateRef.current = onPlaybackUpdate;
  }, [autoPlay, embedUrl, onPlaybackUpdate, onPlayerReady, videoId]);

  useEffect(() => {
    let mounted = true;

    void getYouTubeApi()
      .then(() => {
        if (mounted) setApiStatus("ready");
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        console.error("Unable to load the YouTube player API", error);
        setApiStatus("failed");
      });

    return () => {
      mounted = false;
    };
  }, []);

  useLayoutEffect(() => {
    if (
      apiStatus !== "ready" ||
      !videoIdRef.current ||
      !containerRef.current
    ) {
      return;
    }

    let cancelled = false;
    let playerReady = false;
    let playerDestroyed = false;
    let player: YouTubePlayerInstance | null = null;
    let initializationTimer = 0;
    let failureTimer = 0;
    let readyTimer = 0;
    let progressTimer = 0;
    const initialVideoId = videoIdRef.current;
    const publishPlaybackUpdate = (
      target: YouTubePlayerInstance,
      isPlaying: boolean
    ) => {
      const currentTime = target.getCurrentTime();
      const duration = target.getDuration();
      onPlaybackUpdateRef.current?.(
        Number.isFinite(currentTime) ? currentTime : 0,
        Number.isFinite(duration) ? duration : 0,
        isPlaying
      );
    };
    const markPlayerUnavailable = () => {
      failureTimer = window.setTimeout(() => {
        if (!cancelled) setApiStatus("failed");
      }, 0);
    };

    const destroyPlayer = (instance: YouTubePlayerInstance) => {
      if (playerDestroyed) return;
      playerDestroyed = true;
      try {
        instance.destroy();
      } catch (error) {
        console.warn("Unable to destroy the YouTube player cleanly", error);
      }
    };

    const initializePlayer = () => {
      if (cancelled || !containerRef.current) return;
      const api = window.YT;
      if (!api?.Player) {
        console.error("The YouTube player API was not ready for initialization");
        markPlayerUnavailable();
        return;
      }

      const mountNode = document.createElement("div");
      containerRef.current.appendChild(mountNode);

      try {
        const params = new URL(embedUrlRef.current).searchParams;
        const playerVars: Record<string, number | string> = {};
        params.forEach((value, key) => {
          playerVars[key] = value;
        });
        playerVars.origin = window.location.origin;
        playerVars.controls = 0;

        player = new api.Player(mountNode, {
          height: "100%",
          width: "100%",
          videoId: initialVideoId,
          playerVars,
          events: {
            onReady: (event) => {
              playerReady = true;
              window.clearTimeout(readyTimer);
              if (cancelled) {
                destroyPlayer(event.target);
                return;
              }

              playerRef.current = event.target;
              playerReadyRef.current = true;
              currentVideoIdRef.current = initialVideoId;
              onPlayerReadyRef.current?.(event.target);
              clearCaptionsTrack(event.target);

              const latestVideoId = videoIdRef.current;
              if (latestVideoId && latestVideoId !== initialVideoId) {
                if (autoPlayRef.current) {
                  event.target.loadVideoById(latestVideoId);
                } else {
                  event.target.cueVideoById(latestVideoId);
                }
                currentVideoIdRef.current = latestVideoId;
                clearCaptionsTrack(event.target);
              } else if (autoPlayRef.current) {
                event.target.stopVideo();
                event.target.seekTo(0, true);
                event.target.playVideo();
              }
              publishPlaybackUpdate(
                event.target,
                event.target.getPlayerState() === 1
              );
            },
            onApiChange: (event) => {
              if (!cancelled) clearCaptionsTrack(event.target);
            },
            onStateChange: (event) => {
              if (cancelled || !playerReady) return;
              const isPlaying = event.data === 1;
              window.clearInterval(progressTimer);
              publishPlaybackUpdate(event.target, isPlaying);
              if (isPlaying) {
                progressTimer = window.setInterval(() => {
                  if (!cancelled) publishPlaybackUpdate(event.target, true);
                }, 250);
              }
            },
            onError: (event) => {
              if (!cancelled) {
                console.warn(
                  "YouTube player reported an error; using native controls",
                  event.data
                );
                markPlayerUnavailable();
              }
            },
          },
        });
        playerRef.current = player;
        readyTimer = window.setTimeout(() => {
          if (!cancelled && !playerReady) {
            console.warn(
              "Timed out waiting for the YouTube player; using native controls"
            );
            markPlayerUnavailable();
          }
        }, YOUTUBE_API_TIMEOUT_MS);
      } catch (error) {
        console.error("Unable to initialize the YouTube player API", error);
        markPlayerUnavailable();
      }
    };

    // Deferring initialization lets Strict Mode's setup/cleanup probe cancel
    // the first setup before the API can replace its target node.
    initializationTimer = window.setTimeout(initializePlayer, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(initializationTimer);
      window.clearTimeout(failureTimer);
      window.clearTimeout(readyTimer);
      window.clearInterval(progressTimer);
      onPlayerReadyRef.current?.(null);
      if (playerRef.current === player) {
        playerRef.current = null;
        playerReadyRef.current = false;
        currentVideoIdRef.current = null;
      }
      if (player) {
        if (playerReady) {
          try {
            player.stopVideo();
          } catch (error) {
            console.warn("Unable to stop the YouTube player cleanly", error);
          }
        }
        destroyPlayer(player);
      }
    };
  }, [apiStatus]);

  useEffect(() => {
    const player = playerRef.current;
    if (
      !player ||
      !playerReadyRef.current ||
      !videoId ||
      currentVideoIdRef.current === videoId
    ) {
      return;
    }

    if (autoPlay) {
      player.stopVideo();
      player.loadVideoById(videoId);
    } else {
      player.cueVideoById(videoId);
    }
    currentVideoIdRef.current = videoId;
    clearCaptionsTrack(player);
  }, [autoPlay, videoId]);

  if (!videoId) {
    return (
      <iframe
        src={embedUrl}
        className={className}
        allow="autoplay; encrypted-media"
        allowFullScreen
        title="YouTube video player"
      />
    );
  }

  if (apiStatus === "failed") {
    return (
      <iframe
        src={embedUrl}
        className={className}
        allow="autoplay; encrypted-media"
        allowFullScreen
        title="YouTube video player"
      />
    );
  }

  return <div ref={containerRef} className={className} />;
}
