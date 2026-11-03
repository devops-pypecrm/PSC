"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./SuccessVideosPanel.module.css";
import {
  toEmbedUrl,
  MAX_VIDEO_UPLOAD_BYTES,
  type SuccessVideo,
  type VideoSourceType,
} from "../lib/successVideoUtils";
import YouTubePlayer from "./YouTubePlayer";
import {
  compressImageToDataUrl,
  MAX_RAW_IMAGE_BYTES,
} from "../lib/imageUpload";

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 4.5h11M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M6.7 7.5v4M9.3 7.5v4M3.5 4.5l.6 8a1.5 1.5 0 0 0 1.5 1.4h4.8a1.5 1.5 0 0 0 1.5-1.4l.6-8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="10" stroke="#ffffff" strokeWidth="1.5" />
      <path d="M9 7L15 11L9 15V7Z" fill="#ffffff" />
    </svg>
  );
}

const SOURCE_OPTIONS: { id: VideoSourceType; label: string }[] = [
  { id: "upload", label: "Local Storage" },
  { id: "youtube", label: "YouTube Link" },
  { id: "instagram", label: "Instagram Link" },
  { id: "drive", label: "Google Drive Link" },
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Couldn't read that file"));
    reader.readAsDataURL(file);
  });
}

export default function SuccessVideosPanel() {
  const [videos, setVideos] = useState<SuccessVideo[]>([]);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading"
  );

  const [sourceType, setSourceType] = useState<VideoSourceType>("youtube");
  const [linkValue, setLinkValue] = useState<string>("");
  const [fileDataUrl, setFileDataUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState("");
  const [pendingCoverImage, setPendingCoverImage] = useState("");
  const [savingCoverImage, setSavingCoverImage] = useState(false);
  const [removingCoverImage, setRemovingCoverImage] = useState(false);
  const [coverImageError, setCoverImageError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const load = useCallback(() => {
    setStatus("loading");
    fetch("/api/success-videos")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load videos");
        return res.json();
      })
      .then((data) => {
        setVideos(data.videos || []);
        setCoverImage(data.coverImage || "");
        setStatus("loaded");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!playingId) return;
    const player = videoRefs.current[playingId];
    if (!player) return;

    player.currentTime = 0;
    void player.play().catch((error: unknown) => {
      console.error("Failed to play success video", error);
      setPlayingId((current) => (current === playingId ? null : current));
    });

    return () => {
      player.pause();
      player.currentTime = 0;
    };
  }, [playingId]);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setFormError("Please choose a video file");
      return;
    }
    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      setFormError(
        `That file is too large — local uploads are capped at ${Math.round(
          MAX_VIDEO_UPLOAD_BYTES / (1024 * 1024)
        )}MB since there's no video hosting service wired up. Use a YouTube/Drive/Instagram link for longer clips.`
      );
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFileDataUrl(dataUrl);
      setFileName(file.name);
      setFormError("");
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const url = sourceType === "upload" ? fileDataUrl : linkValue.trim();

    if (!url) {
      setFormError(
        sourceType === "upload"
          ? "Choose a video file to upload"
          : "Paste a video link"
      );
      return;
    }

    setCreating(true);
    setFormError("");
    try {
      const response = await fetch("/api/success-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType, url }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to add video");

      setLinkValue("");
      setFileDataUrl("");
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      load();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (video: SuccessVideo) => {
    if (!confirm("Delete this video? This can't be undone.")) return;

    setDeletingId(video._id);
    try {
      const response = await fetch(`/api/success-videos/${video._id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete video");
      if (playingId === video._id) setPlayingId(null);
      load();
    } catch {
      alert("Couldn't delete this video. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCoverImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCoverImageError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_RAW_IMAGE_BYTES) {
      setCoverImageError("The selected image must be 10MB or smaller.");
      return;
    }

    try {
      const dataUrl = await compressImageToDataUrl(file, 900, 0.8);
      setPendingCoverImage(dataUrl);
      setCoverImageError("");
    } catch (error) {
      setCoverImageError(
        error instanceof Error ? error.message : "Couldn't process that image."
      );
    }
  };

  const saveCoverImage = async () => {
    if (!pendingCoverImage) return;

    setSavingCoverImage(true);
    setCoverImageError("");
    try {
      const response = await fetch("/api/success-videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImage: pendingCoverImage }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Couldn't save the cover image.");
      }

      setCoverImage(pendingCoverImage);
      setPendingCoverImage("");
      if (coverImageInputRef.current) {
        coverImageInputRef.current.value = "";
      }
    } catch (error) {
      setCoverImageError(
        error instanceof Error ? error.message : "Couldn't save the cover image."
      );
    } finally {
      setSavingCoverImage(false);
    }
  };

  const removeCoverImage = async () => {
    if (!coverImage || !confirm("Remove the common cover image?")) return;

    setRemovingCoverImage(true);
    setCoverImageError("");
    try {
      const response = await fetch("/api/success-videos", {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Couldn't remove the cover image.");
      }

      setCoverImage("");
      setPendingCoverImage("");
      if (coverImageInputRef.current) {
        coverImageInputRef.current.value = "";
      }
    } catch (error) {
      setCoverImageError(
        error instanceof Error ? error.message : "Couldn't remove the cover image."
      );
    } finally {
      setRemovingCoverImage(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageHeading}>Add Success</h1>
      <div className={styles.divider} />

      <section className={styles.coverSection} aria-labelledby="video-cover-heading">
        <div className={styles.coverPreview}>
          {(pendingCoverImage || coverImage) ? (
            <Image
              src={pendingCoverImage || coverImage}
              alt="Common success video cover preview"
              width={180}
              height={280}
              unoptimized
            />
          ) : (
            <p>No common cover image selected.</p>
          )}
        </div>
        <div className={styles.coverControls}>
          <h2 id="video-cover-heading" className={styles.label}>
            Common Video Cover
          </h2>
          <p className={styles.fileHint}>
            This image appears on every success video card before playback.
          </p>
          <input
            ref={coverImageInputRef}
            id="success-video-cover"
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={handleCoverImageChange}
          />
          <div className={styles.coverActions}>
            <button
              type="button"
              className={styles.createButton}
              onClick={saveCoverImage}
              disabled={!pendingCoverImage || savingCoverImage || removingCoverImage}
            >
              {savingCoverImage ? "Saving cover..." : "Save Common Cover"}
            </button>
            {coverImage && (
              <button
                type="button"
                className={styles.removeButton}
                onClick={removeCoverImage}
                disabled={savingCoverImage || removingCoverImage}
              >
                {removingCoverImage ? "Removing cover..." : "Remove Cover Image"}
              </button>
            )}
          </div>
          {coverImageError && (
            <p className={styles.formError} role="alert">
              {coverImageError}
            </p>
          )}
        </div>
      </section>

      <div className={styles.divider} />

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Video Source</label>
          <div className={styles.sourceRow}>
            {SOURCE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`${styles.sourceButton} ${
                  sourceType === option.id ? styles.sourceButtonActive : ""
                }`}
                onClick={() => {
                  setSourceType(option.id);
                  setFormError("");
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {sourceType === "upload" ? (
          <div className={styles.field}>
            <label htmlFor="video-file" className={styles.label}>
              Upload Video
            </label>
            <input
              key="video-file"
              ref={fileInputRef}
              id="video-file"
              type="file"
              accept="video/*"
              className={styles.fileInput}
              onChange={handleFileChange}
            />
            {fileName && (
              <p className={styles.fileHint}>Selected: {fileName}</p>
            )}
          </div>
        ) : (
          <div className={styles.field}>
            <label htmlFor="video-link" className={styles.label}>
              {sourceType === "youtube" && "YouTube Link"}
              {sourceType === "instagram" && "Instagram Link"}
              {sourceType === "drive" && "Google Drive Link"}
            </label>
            <input
              key="video-link"
              id="video-link"
              type="url"
              className={styles.input}
              placeholder={
                sourceType === "youtube"
                  ? "https://youtube.com/watch?v=..."
                  : sourceType === "instagram"
                  ? "https://instagram.com/reel/..."
                  : "https://drive.google.com/file/d/.../view"
              }
              value={linkValue ?? ""}
              onChange={(e) => setLinkValue(e.target.value)}
            />
          </div>
        )}

        <button type="submit" className={styles.createButton} disabled={creating}>
          {creating ? "Adding..." : "+ Add Video"}
        </button>

        {formError && <p className={styles.formError}>{formError}</p>}
      </form>

      <div className={styles.divider} />

      {status === "loading" && (
        <p className={styles.message}>Loading videos...</p>
      )}
      {status === "error" && (
        <p className={styles.messageError}>
          Couldn&apos;t load videos. Please refresh the page.
        </p>
      )}
      {status === "loaded" && videos.length === 0 && (
        <p className={styles.message}>No videos added yet.</p>
      )}

      {status === "loaded" && videos.length > 0 && (
        <div className={styles.grid}>
          {videos.map((video) => (
            <div className={styles.card} key={video._id}>
              <button
                type="button"
                className={styles.deleteButton}
                aria-label="Delete video"
                onClick={() => handleDelete(video)}
                disabled={deletingId === video._id}
              >
                <TrashIcon />
              </button>

              <div className={styles.cardMedia}>
                <div className={styles.cardBrand}>
                  <Image
                    src="/logo-main.png"
                    alt="Professional Skill Campus"
                    width={96}
                    height={32}
                  />
                </div>
                {playingId === video._id ? (
                  video.sourceType === "upload" ? (
                    <video
                      src={video.url}
                      controls
                      ref={(player) => {
                        videoRefs.current[video._id] = player;
                      }}
                      className={styles.player}
                    />
                  ) : (
                    video.sourceType === "youtube" ? (
                      <YouTubePlayer
                        video={video}
                        autoPlay
                        className={styles.player}
                      />
                    ) : (
                      <iframe
                        src={toEmbedUrl(video)}
                        className={styles.player}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                      />
                    )
                  )
                ) : (
                  <button
                    type="button"
                    className={styles.playButton}
                    onClick={() => setPlayingId(video._id)}
                    aria-label="Play video"
                  >
                    <PlayIcon />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
