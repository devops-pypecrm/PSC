"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Script from "next/script";
import styles from "./SuccessStories.module.css";
import {
  DEFAULT_VIDEO_THUMBNAIL,
  getInstagramPermalink,
  getVideoThumbnailUrl,
  toEmbedUrl,
  type SuccessVideo,
} from "../lib/successVideoUtils";
import YouTubePlayer, {
  type YouTubePlayerControls,
} from "./YouTubePlayer";
import { useSectionVisible } from "../hooks/useSectionVisible";

declare global {
  interface Window {
    instgrm?: {
      Embeds?: {
        process: () => void;
      };
    };
  }
}

type ActiveVideo = {
  id: string;
  sourceType: SuccessVideo["sourceType"];
};

function formatPlaybackTime(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function SuccessStories() {
  const { ref: sectionRef, visible } = useSectionVisible<HTMLElement>();
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const youtubePlayerRef = useRef<YouTubePlayerControls | null>(null);
  const instagramEmbedRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const instagramIframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
  const instagramEmbedObservers = useRef<Record<string, MutationObserver>>({});
  const instagramIframeListeners = useRef<
    Record<
      string,
      {
        iframe: HTMLIFrameElement;
        onLoad: () => void;
        onError: () => void;
      }
    >
  >({});
  const instagramEmbedTimeouts = useRef<Record<string, number>>({});
  const [videos, setVideos] = useState<SuccessVideo[]>([]);
  const [commonCoverImage, setCommonCoverImage] = useState("");
  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(null);
  const [instagramEmbedIds, setInstagramEmbedIds] = useState<string[]>([]);
  const [instagramEmbedErrors, setInstagramEmbedErrors] = useState<
    Record<string, boolean>
  >({});
  const [instagramEmbedLoading, setInstagramEmbedLoading] = useState<
    Record<string, boolean>
  >({});
  const [instagramScriptReady, setInstagramScriptReady] = useState(false);
  const [instagramScriptFailed, setInstagramScriptFailed] = useState(false);
  const [isActiveVideoPaused, setIsActiveVideoPaused] = useState(true);
  const [isYouTubePlayerReady, setIsYouTubePlayerReady] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [thumbnailFallbackMap, setThumbnailFallbackMap] = useState<
    Record<string, boolean>
  >({});
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading"
  );

  const stopActiveVideo = () => {
    if (!activeVideo) return;

    if (activeVideo.sourceType === "upload") {
      const player = videoRefs.current[activeVideo.id];
      if (player) {
        player.pause();
        player.currentTime = 0;
      }
    } else if (activeVideo.sourceType === "youtube") {
      youtubePlayerRef.current?.stopVideo();
    }

    setIsActiveVideoPaused(true);
  };

  const togglePlayPause = (id: string) => {
    if (activeVideo?.id === id && activeVideo.sourceType === "youtube") {
      const player = youtubePlayerRef.current;
      if (!player) return;
      if (player.getPlayerState() === 1) {
        player.pauseVideo();
      } else {
        if (player.getPlayerState() === 0) player.seekTo(0, true);
        player.playVideo();
      }
      return;
    }

    const el = videoRefs.current[id];
    if (!el) return;
    if (el.paused) el.play();
    else el.pause();
  };

  const seekVideo = (id: string, value: number) => {
    const seekTime = Math.max(0, Math.min(value, playbackDuration));
    setPlaybackTime(seekTime);
    if (activeVideo?.id === id && activeVideo.sourceType === "youtube") {
      youtubePlayerRef.current?.seekTo(seekTime, true);
      return;
    }
    const player = videoRefs.current[id];
    if (player && Number.isFinite(player.duration)) {
      player.currentTime = seekTime;
    }
  };

  const handleVolumeChange = (id: string, value: number) => {
    const el = videoRefs.current[id];
    if (el) el.volume = value;
  };

  const startVideo = (id: string) => {
    const video = videos.find((item) => item._id === id);
    if (!video || activeVideo?.id === id) return;
    stopActiveVideo();
    setIsActiveVideoPaused(true);
    setPlaybackTime(0);
    setPlaybackDuration(0);
    setIsYouTubePlayerReady(false);
    setActiveVideo({ id, sourceType: video.sourceType });
  };

  const stopVideo = (id: string) => {
    if (activeVideo?.id !== id) return;
    stopActiveVideo();
    setIsYouTubePlayerReady(false);
    setActiveVideo(null);
  };

  const startInstagramVideo = (id: string) => {
    const video = videos.find((item) => item._id === id);
    if (video?.sourceType !== "instagram" || activeVideo?.id === id) return;
    stopActiveVideo();
    window.clearTimeout(instagramEmbedTimeouts.current[id]);
    delete instagramEmbedTimeouts.current[id];
    setInstagramEmbedErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setInstagramEmbedIds((current) =>
      current.includes(id) ? current : [...current, id]
    );
    setInstagramEmbedLoading((current) => ({ ...current, [id]: true }));
    instagramEmbedTimeouts.current[id] = window.setTimeout(() => {
      delete instagramEmbedTimeouts.current[id];
      setInstagramEmbedLoading((current) => ({ ...current, [id]: false }));
      setInstagramEmbedErrors((current) => ({ ...current, [id]: true }));
    }, 15000);
    setIsActiveVideoPaused(true);
    setPlaybackTime(0);
    setPlaybackDuration(0);
    setIsYouTubePlayerReady(false);
    setActiveVideo({ id, sourceType: "instagram" });
  };

  const renderPlaybackControls = (
    id: string,
    sourceType: SuccessVideo["sourceType"]
  ) => (
    <div className={styles.customControls}>
      <div className={styles.controlsRow}>
        <button
          type="button"
          className={styles.controlButton}
          onClick={() => togglePlayPause(id)}
          aria-label={isActiveVideoPaused ? "Play video" : "Pause video"}
        >
          {isActiveVideoPaused ? (
            <svg width="12" height="12" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path d="M6 4L18 11L6 18V4Z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <rect x="5" y="4" width="4" height="14" fill="currentColor" />
              <rect x="13" y="4" width="4" height="14" fill="currentColor" />
            </svg>
          )}
        </button>
        <input
          type="range"
          className={styles.progressSlider}
          min={0}
          max={playbackDuration || 1}
          step={0.1}
          value={Math.min(playbackTime, playbackDuration || 0)}
          disabled={playbackDuration <= 0}
          aria-label="Seek video"
          onChange={(event) => seekVideo(id, Number(event.target.value))}
        />
        <span className={styles.timeDisplay} aria-live="off">
          {formatPlaybackTime(playbackTime)} / {formatPlaybackTime(playbackDuration)}
        </span>
      </div>
      {sourceType === "upload" && (
        <div className={styles.volumeRow}>
          <input
            type="range"
            className={styles.volumeSlider}
            min={0}
            max={1}
            step={0.05}
            defaultValue={1}
            aria-label="Volume"
            onChange={(event) => {
              const value = Number(event.target.value);
              handleVolumeChange(id, value);
              const player = videoRefs.current[id];
              if (player) player.muted = value === 0;
            }}
          />
        </div>
      )}
    </div>
  );

  useEffect(() => {
    if (!visible) return;
    fetch("/api/success-videos")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load videos");
        return res.json();
      })
      .then((data) => {
        setVideos(Array.isArray(data.videos) ? data.videos : []);
        setCommonCoverImage(
          typeof data.coverImage === "string" ? data.coverImage : ""
        );
        setStatus("loaded");
      })
      .catch(() => setStatus("error"));
  }, [visible]);

  useEffect(() => {
    if (activeVideo?.sourceType !== "upload") return;
    const video = videos.find((item) => item._id === activeVideo.id);
    if (video?.sourceType !== "upload") return;
    const player = videoRefs.current[activeVideo.id];
    if (!player) return;

    player.currentTime = 0;
    void player.play().catch((error: unknown) => {
      console.error("Failed to play success video", error);
      setActiveVideo((current) =>
        current?.id === activeVideo.id ? null : current
      );
    });
  }, [activeVideo, videos]);

  useEffect(() => {
    const id =
      activeVideo?.sourceType === "instagram" ? activeVideo.id : null;
    if (!instagramScriptReady || !id) return;

    const container = instagramEmbedRefs.current[id];
    if (!container) return;

    const detachIframeListeners = () => {
      const listeners = instagramIframeListeners.current[id];
      if (!listeners) return;
      listeners.iframe.removeEventListener("load", listeners.onLoad);
      listeners.iframe.removeEventListener("error", listeners.onError);
      delete instagramIframeListeners.current[id];
      if (instagramIframeRefs.current[id] === listeners.iframe) {
        delete instagramIframeRefs.current[id];
      }
    };

    const attachIframeListeners = () => {
      const iframe = container.querySelector("iframe");
      if (!iframe || instagramIframeRefs.current[id] === iframe) return;
      detachIframeListeners();
      instagramIframeRefs.current[id] = iframe;

      const onLoad = () => {
        if (instagramIframeRefs.current[id] !== iframe) return;
        window.clearTimeout(instagramEmbedTimeouts.current[id]);
        delete instagramEmbedTimeouts.current[id];
        setInstagramEmbedLoading((current) => ({ ...current, [id]: false }));
      };
      const onError = () => {
        if (instagramIframeRefs.current[id] !== iframe) return;
        window.clearTimeout(instagramEmbedTimeouts.current[id]);
        delete instagramEmbedTimeouts.current[id];
        setInstagramEmbedLoading((current) => ({ ...current, [id]: false }));
        setInstagramEmbedErrors((current) => ({ ...current, [id]: true }));
      };

      instagramIframeListeners.current[id] = { iframe, onLoad, onError };
      iframe.addEventListener("load", onLoad);
      iframe.addEventListener("error", onError);
    };

    const observer = new MutationObserver(attachIframeListeners);
    observer.observe(container, { childList: true, subtree: true });
    instagramEmbedObservers.current[id] = observer;
    attachIframeListeners();
    window.instgrm?.Embeds?.process();

    return () => {
      observer.disconnect();
      if (instagramEmbedObservers.current[id] === observer) {
        delete instagramEmbedObservers.current[id];
      }
      detachIframeListeners();
      window.clearTimeout(instagramEmbedTimeouts.current[id]);
      delete instagramEmbedTimeouts.current[id];
    };
  }, [activeVideo?.id, activeVideo?.sourceType, instagramScriptReady]);

  useEffect(
    () => () => {
      Object.values(instagramEmbedObservers.current).forEach((observer) =>
        observer.disconnect()
      );
      Object.values(instagramIframeListeners.current).forEach(
        ({ iframe, onLoad, onError }) => {
          iframe.removeEventListener("load", onLoad);
          iframe.removeEventListener("error", onError);
        }
      );
      Object.values(instagramEmbedTimeouts.current).forEach((timeout) =>
        window.clearTimeout(timeout)
      );
      instagramEmbedObservers.current = {};
      instagramIframeRefs.current = {};
      instagramIframeListeners.current = {};
      instagramEmbedTimeouts.current = {};
    },
    []
  );

  const scroll = (direction: "left" | "right") => {
    const track = trackRef.current;
    if (!track) return;
    const amount = track.clientWidth * 0.8;
    track.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (!visible || status !== "loaded" || videos.length === 0) {
    return <section ref={sectionRef} className={styles.section} aria-hidden="true" />;
  }

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Stories</h2>
        <p className={styles.subheading}>
          Authentic voices speak of trust, growth, and fulfilled promises!
        </p>
      </div>

      <div className={styles.carousel}>
        {instagramEmbedIds.length > 0 && (
          <Script
            id="instagram-embed-script"
            src="https://www.instagram.com/embed.js"
            strategy="afterInteractive"
            onReady={() => setInstagramScriptReady(true)}
            onError={() => setInstagramScriptFailed(true)}
          />
        )}

        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowLeft}`}
          aria-label="Previous story"
          onClick={() => scroll("left")}
        >
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden="true">
            <path
              d="M10 2L2 10L10 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className={styles.track} ref={trackRef}>
          {videos.map((video) => {
            const instagramPermalink = getInstagramPermalink(video);
            const isActiveInstagramVideo =
              activeVideo?.id === video._id &&
              activeVideo.sourceType === "instagram";
            const hasInstagramEmbed = instagramEmbedIds.includes(video._id);
            return (
              <div className={styles.card} key={video._id}>
              <div className={styles.cardMedia}>
                {hasInstagramEmbed && isActiveInstagramVideo && (
                  <div
                    ref={(el) => {
                      instagramEmbedRefs.current[video._id] = el;
                    }}
                    className={styles.instagramEmbed}
                  >
                    {(instagramEmbedLoading[video._id] ||
                      instagramScriptFailed ||
                      instagramEmbedErrors[video._id] ||
                      !instagramPermalink) && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={
                          thumbnailFallbackMap[video._id]
                            ? DEFAULT_VIDEO_THUMBNAIL
                            : commonCoverImage || getVideoThumbnailUrl(video)
                        }
                        alt=""
                        className={styles.thumbnail}
                        onError={() =>
                          setThumbnailFallbackMap((map) => ({
                            ...map,
                            [video._id]: true,
                          }))
                        }
                      />
                    )}
                    {instagramScriptFailed ||
                    instagramEmbedErrors[video._id] ||
                    !instagramPermalink ? (
                      <div className={styles.instagramEmbedError} role="alert">
                        <p>Instagram couldn&apos;t load this Reel.</p>
                        <p>
                          The Reel may be private or unavailable. You can still
                          view it on Instagram.
                        </p>
                        {instagramPermalink && (
                          <a
                            href={instagramPermalink}
                            className={styles.instagramFallbackLink}
                          >
                            View this Reel on Instagram
                          </a>
                        )}
                      </div>
                    ) : (
                      <blockquote
                        className="instagram-media"
                        data-instgrm-permalink={instagramPermalink}
                        data-instgrm-version="14"
                        onClick={(event) => {
                          if (
                            event.target instanceof Element &&
                            event.target.closest("a")
                          ) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <a href={instagramPermalink}>
                          View this Reel on Instagram
                        </a>
                      </blockquote>
                    )}
                  </div>
                )}
                {isActiveInstagramVideo ? (
                  <>
                    <button
                      type="button"
                      className={styles.stopButton}
                      onClick={() => stopVideo(video._id)}
                      aria-label="Return to thumbnail"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <rect x="3" y="3" width="10" height="10" fill="currentColor" />
                      </svg>
                    </button>
                  </>
                ) : activeVideo?.id === video._id &&
                  video.sourceType === "upload" ? (
                  <>
                    <video
                      ref={(el) => {
                        videoRefs.current[video._id] = el;
                      }}
                      src={video.url}
                      playsInline
                      preload="metadata"
                      disablePictureInPicture
                      controlsList="nofullscreen nodownload noremoteplayback"
                      className={styles.player}
                      onPlay={() => setIsActiveVideoPaused(false)}
                      onPause={() => setIsActiveVideoPaused(true)}
                      onLoadedMetadata={(event) => {
                        setPlaybackDuration(event.currentTarget.duration || 0);
                      }}
                      onTimeUpdate={(event) => {
                        setPlaybackTime(event.currentTarget.currentTime);
                        setPlaybackDuration(event.currentTarget.duration || 0);
                      }}
                      onSeeked={(event) => {
                        setPlaybackTime(event.currentTarget.currentTime);
                      }}
                      onEnded={() => stopVideo(video._id)}
                    />
                    <button
                      type="button"
                      className={styles.stopButton}
                      onClick={() => stopVideo(video._id)}
                      aria-label="Stop video"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <rect x="3" y="3" width="10" height="10" fill="currentColor" />
                      </svg>
                    </button>
                    {renderPlaybackControls(video._id, "upload")}
                  </>
                ) : activeVideo?.id === video._id ? (
                  <>
                    {video.sourceType === "youtube" ? (
                      <YouTubePlayer
                        video={video}
                        autoPlay
                        className={styles.player}
                        onPlayerReady={(player) => {
                          youtubePlayerRef.current = player;
                          setIsYouTubePlayerReady(Boolean(player));
                        }}
                        onPlaybackUpdate={(currentTime, duration, isPlaying) => {
                          setPlaybackTime(currentTime);
                          setPlaybackDuration(duration);
                          setIsActiveVideoPaused(!isPlaying);
                        }}
                      />
                    ) : (
                      <iframe
                        src={toEmbedUrl(video, true)}
                        className={styles.player}
                        loading="lazy"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                      />
                    )}
                    <button
                      type="button"
                      className={styles.stopButton}
                      onClick={() => stopVideo(video._id)}
                      aria-label="Stop video"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <rect x="3" y="3" width="10" height="10" fill="currentColor" />
                      </svg>
                    </button>
                    {video.sourceType === "youtube" &&
                      isYouTubePlayerReady &&
                      renderPlaybackControls(video._id, "youtube")}
                  </>
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        thumbnailFallbackMap[video._id]
                          ? DEFAULT_VIDEO_THUMBNAIL
                          : commonCoverImage || getVideoThumbnailUrl(video)
                      }
                      alt=""
                      className={styles.thumbnail}
                      onError={() =>
                        setThumbnailFallbackMap((map) => ({
                          ...map,
                          [video._id]: true,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className={styles.playButton}
                      onClick={() =>
                        video.sourceType === "instagram"
                          ? startInstagramVideo(video._id)
                          : startVideo(video._id)
                      }
                      aria-label="Play video"
                    >
                      <svg width="16" height="16" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                        <path d="M6 4L18 11L6 18V4Z" fill="currentColor" />
                      </svg>
                    </button>
                  </>
                )}
              <div className={styles.cardBrand}>
                <Image
                  src="/logo-main.png"
                  alt="Professional Skill Campus"
                  width={96}
                  height={32}
                />
              </div>
              </div>

              </div>
            );
          })}
        </div>

        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowRight}`}
          aria-label="Next story"
          onClick={() => scroll("right")}
        >
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden="true">
            <path
              d="M2 2L10 10L2 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
