export type VideoSourceType = "upload" | "youtube" | "instagram" | "drive";

export type SuccessVideo = {
  _id: string;
  sourceType: VideoSourceType;
  url: string; // data URI for "upload", the original link otherwise
  createdAt: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  coverImage?: string;
};

export const DEFAULT_VIDEO_THUMBNAIL = "/video-cover-fallback.svg";

// A local video clip stored as a data URI in MongoDB has to stay small —
// there's no dedicated video/blob storage wired up for this project, so
// this only suits short, low-resolution clips.
export const MAX_VIDEO_UPLOAD_BYTES = 4 * 1024 * 1024;

export function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export function getVideoThumbnailUrl(video: SuccessVideo): string {
  if (video.sourceType === "youtube") {
    const id = getYouTubeVideoId(video.url || "");
    return id
      ? `https://img.youtube.com/vi/${id}/hqdefault.jpg`
      : DEFAULT_VIDEO_THUMBNAIL;
  }

  return (
    video.coverImageUrl ||
    video.coverImage ||
    video.thumbnailUrl ||
    DEFAULT_VIDEO_THUMBNAIL
  );
}

function getDriveId(url: string): string | null {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]{10,})/) || url.match(/id=([a-zA-Z0-9_-]{10,})/);
  return m ? m[1] : null;
}

function getInstagramPath(url: string): string | null {
  const m = url.match(/instagram\.com\/(reel|p|tv)\/([a-zA-Z0-9_-]+)/);
  return m ? `${m[1]}/${m[2]}` : null;
}

export function getInstagramPermalink(video: SuccessVideo): string | null {
  if (video.sourceType !== "instagram") return null;
  const path = getInstagramPath(video.url || "");
  return path ? `https://www.instagram.com/${path}/` : null;
}

// Turns whatever link the admin pasted into an embeddable iframe URL.
// Falls back to the raw link (best-effort) if the pattern isn't recognized.
export function toEmbedUrl(video: SuccessVideo, autoPlay = false): string {
  const { sourceType, url } = video;

  if (sourceType === "youtube") {
    const id = getYouTubeVideoId(url || "");
    if (!id) return url;
    const params = new URLSearchParams();
    params.set("controls", "1");
    params.set("enablejsapi", "1");
    params.set("cc_load_policy", "0");
    params.set("playsinline", "1");
    if (autoPlay) {
      params.set("autoplay", "1");
    }
    return `https://www.youtube.com/embed/${id}${
      params.size > 0 ? `?${params.toString()}` : ""
    }`;
  }

  if (sourceType === "drive") {
    const id = getDriveId(url);
    return id ? `https://drive.google.com/file/d/${id}/preview` : url;
  }

  if (sourceType === "instagram") {
    const path = getInstagramPath(url);
    return path
      ? `https://www.instagram.com/${path}/embed${autoPlay ? "?autoplay=1" : ""}`
      : url;
  }

  return url;
}
