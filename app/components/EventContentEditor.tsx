"use client";

import { useState } from "react";
import styles from "./EventContentEditor.module.css";
import type { EventItem, EventSection } from "../lib/eventUtils";
import { compressImageToDataUrl, MAX_RAW_IMAGE_BYTES } from "../lib/imageUpload";

type Props = {
  event: EventItem;
  allEvents: EventItem[];
  onBack: () => void;
  onSaved: () => void;
};

export default function EventContentEditor({
  event,
  allEvents,
  onBack,
  onSaved,
}: Props) {
  const [sections, setSections] = useState<EventSection[]>(
    event.sections && event.sections.length > 0
      ? event.sections
      : []
  );
  const [galleryEnabled, setGalleryEnabled] = useState(
    !!(event.gallery && event.gallery.length > 0)
  );
  const [gallery, setGallery] = useState<string[]>(event.gallery ?? []);
  const [uploaderSlots, setUploaderSlots] = useState<number[]>([0]);
  const [uploading, setUploading] = useState(false);
  const [galleryError, setGalleryError] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  const moreEvents = allEvents
    .filter((e) => e._id !== event._id)
    .slice(0, 5);

  const addSection = () => {
    setSections((current) => [...current, { heading: "", paragraph: "" }]);
  };

  const removeSection = (index: number) => {
    setSections((current) => current.filter((_, i) => i !== index));
  };

  const updateSection = (
    index: number,
    field: keyof EventSection,
    value: string
  ) => {
    setSections((current) =>
      current.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleGalleryFiles = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.currentTarget.files ?? []);
    e.currentTarget.value = "";
    if (files.length === 0) return;

    const validFiles = files.filter(
      (file) =>
        file.type.startsWith("image/") && file.size <= MAX_RAW_IMAGE_BYTES
    );
    if (validFiles.length !== files.length) {
      setGalleryError("Only image files 10MB or smaller can be added.");
    } else {
      setGalleryError("");
    }
    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      const newImages: string[] = [];
      for (const file of validFiles) {
        newImages.push(await compressImageToDataUrl(file, 900, 0.8));
      }
      setGallery((current) => [...current, ...newImages]);
    } catch (err) {
      setGalleryError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGallery((current) => current.filter((_, i) => i !== index));
  };

  const addUploaderSlot = () => {
    setUploaderSlots((current) => [
      ...current,
      (current[current.length - 1] ?? 0) + 1,
    ]);
  };

  const handleSave = async () => {
    setStatus("saving");
    setErrorMsg("");

    try {
      const response = await fetch(`/api/events/${event._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventCategory: event.eventCategory,
          eventName: event.eventName,
          image: event.image,
          sections,
          gallery,
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to save content");

      setStatus("saved");
      onSaved();
    } catch (err) {
      setStatus("error");
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          &larr; Back to Events
        </button>
        <button
          type="button"
          className={styles.saveButton}
          onClick={handleSave}
          disabled={status === "saving" || uploading}
        >
          {status === "saving" ? "Saving..." : "Save"}
        </button>
      </div>

      {status === "saved" && (
        <p className={styles.savedMessage}>
          Saved — this now shows on the event&apos;s View More page.
        </p>
      )}
      {status === "error" && (
        <p className={styles.errorMessage}>{errorMsg}</p>
      )}

      <h1 className={styles.heading}>{event.eventName}</h1>

      <div className={styles.layout}>
        <div className={styles.imageBox}>
          {event.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.image} alt={event.eventName} className={styles.image} />
          ) : (
            <span className={styles.imagePlaceholder}>No image uploaded</span>
          )}
        </div>

        <div className={styles.moreEvents}>
          <h2 className={styles.moreEventsHeading}>More Events</h2>
          {moreEvents.length === 0 ? (
            <p className={styles.moreEventsEmpty}>No other events yet.</p>
          ) : (
            <ul className={styles.moreEventsList}>
              {moreEvents.map((e) => (
                <li key={e._id} className={styles.moreEventsItem}>
                  {e.eventName}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {sections.length === 0 ? (
        <div className={styles.emptySections}>
          No sections yet. Add one to build the View More page for this
          event.
        </div>
      ) : (
        <div className={styles.sectionsList}>
          {sections.map((section, index) => (
            <div className={styles.section} key={index}>
              <button
                type="button"
                className={styles.removeSection}
                aria-label="Remove section"
                onClick={() => removeSection(index)}
              >
                &times;
              </button>

              <div className={styles.sectionField}>
                <span className={styles.sectionLabel}>Heading</span>
                <input
                  type="text"
                  className={styles.sectionInput}
                  placeholder="Add heading"
                  value={section.heading}
                  onChange={(e) =>
                    updateSection(index, "heading", e.target.value)
                  }
                />
              </div>

              <div className={styles.sectionField}>
                <span className={styles.sectionLabel}>Paragraph</span>
                <textarea
                  className={styles.sectionTextarea}
                  placeholder="Add paragraph"
                  value={section.paragraph}
                  onChange={(e) =>
                    updateSection(index, "paragraph", e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.sectionButtonsRow}>
        <button
          type="button"
          className={styles.addSectionButton}
          onClick={addSection}
        >
          + Add New Section
        </button>

        {!galleryEnabled && (
          <button
            type="button"
            className={styles.addSectionButton}
            onClick={() => setGalleryEnabled(true)}
          >
            + Add Gallery
          </button>
        )}
      </div>

      {galleryEnabled && (
        <div className={styles.gallerySection}>
          <h2 className={styles.galleryHeading}>Our Gallery</h2>

          {gallery.length > 0 && (
            <div className={styles.galleryGrid}>
              {gallery.map((src, index) => (
                <div className={styles.galleryThumb} key={index}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className={styles.galleryThumbImg} />
                  <button
                    type="button"
                    className={styles.galleryRemove}
                    aria-label="Remove image"
                    onClick={() => removeGalleryImage(index)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={styles.galleryUploaders}>
            {uploaderSlots.map((slotId) => (
              <input
                key={slotId}
                type="file"
                accept="image/*"
                multiple
                className={styles.galleryFileInput}
                onChange={handleGalleryFiles}
                disabled={uploading}
              />
            ))}
          </div>

          {uploading && (
            <p className={styles.galleryStatus}>Uploading...</p>
          )}
          {galleryError && (
            <p className={styles.errorMessage}>{galleryError}</p>
          )}

          {gallery.length > 0 && (
            <button
              type="button"
              className={styles.addImageFieldButton}
              onClick={addUploaderSlot}
            >
              + Add New Image
            </button>
          )}
        </div>
      )}
    </div>
  );
}
