"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./SkillCreatorsPanel.module.css";
import { compressImageToDataUrl, MAX_RAW_IMAGE_BYTES } from "../lib/imageUpload";
import type { SkillCreator } from "../lib/skillCreatorUtils";

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M11.3 2.3a1.4 1.4 0 0 1 2 2L5.4 12.2l-2.7.7.7-2.7 7.9-7.9Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

export default function SkillCreatorsPanel() {
  const [skillCreators, setSkillCreators] = useState<SkillCreator[]>([]);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading"
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isEdit = editingId !== null;

  const load = useCallback(() => {
    setStatus("loading");
    fetch("/api/skill-creators")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load skill creators");
        return res.json();
      })
      .then((data) => {
        setSkillCreators(data.skillCreators || []);
        setStatus("loaded");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPosition("");
    setImage("");
    setFormError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startEdit = (creator: SkillCreator) => {
    setEditingId(creator._id);
    setName(creator.name);
    setPosition(creator.position);
    setImage(creator.image || "");
    setFormError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please choose an image file");
      return;
    }
    if (file.size > MAX_RAW_IMAGE_BYTES) {
      setFormError("Image is too large (max 10MB)");
      return;
    }

    try {
      const dataUrl = await compressImageToDataUrl(file, 500, 0.85);
      setImage(dataUrl);
      setFormError("");
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  const handleRemoveImage = () => {
    setImage("");
    setFormError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Lec. name is required");
      return;
    }
    if (!position.trim()) {
      setFormError("Lec. position is required");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const response = await fetch(
        isEdit ? `/api/skill-creators/${editingId}` : "/api/skill-creators",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, position, image }),
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to save skill creator");

      resetForm();
      load();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (creator: SkillCreator) => {
    if (!confirm(`Delete "${creator.name}"? This can't be undone.`)) return;

    setDeletingId(creator._id);
    try {
      const response = await fetch(`/api/skill-creators/${creator._id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete skill creator");
      if (editingId === creator._id) resetForm();
      load();
    } catch {
      alert("Couldn't delete this skill creator. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageHeading}>Update Skill Creators</h1>
      <div className={styles.divider} />

      <form className={styles.form} onSubmit={handleSubmit} ref={formRef}>
        <p className={styles.formTitle}>
          {isEdit ? `Editing "${name || "skill creator"}"` : "Add a new skill creator"}
        </p>

        <div className={styles.field}>
          <label htmlFor="skillcreator-name" className={styles.label}>
            Lec. Name
          </label>
          <input
            id="skillcreator-name"
            type="text"
            className={styles.input}
            placeholder="Enter lecturer name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="skillcreator-position" className={styles.label}>
            Lec. Position
          </label>
          <input
            id="skillcreator-position"
            type="text"
            className={styles.input}
            placeholder="Enter lecturer position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="skillcreator-image" className={styles.label}>
            Lec. Image
          </label>
          <div className={styles.imageRow}>
            {image && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" className={styles.imagePreview} />
                <button
                  type="button"
                  className={styles.removeImageButton}
                  onClick={handleRemoveImage}
                >
                  Remove Image
                </button>
              </>
            )}
            <input
              ref={fileInputRef}
              id="skillcreator-image"
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={handleImageChange}
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.createButton} disabled={saving}>
            {saving
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
              ? "Save Changes"
              : "+ Create Skill Creator"}
          </button>
          {isEdit && (
            <button
              type="button"
              className={styles.cancelButton}
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>

        {formError && <p className={styles.formError}>{formError}</p>}
      </form>

      <div className={styles.divider} />

      {status === "loading" && (
        <p className={styles.message}>Loading skill creators...</p>
      )}
      {status === "error" && (
        <p className={styles.messageError}>
          Couldn&apos;t load skill creators. Please refresh the page.
        </p>
      )}
      {status === "loaded" && skillCreators.length === 0 && (
        <p className={styles.message}>No skill creators added yet.</p>
      )}

      {status === "loaded" && skillCreators.length > 0 && (
        <div className={styles.grid}>
          {skillCreators.map((creator) => (
            <div
              className={`${styles.card} ${
                editingId === creator._id ? styles.cardEditing : ""
              }`}
              key={creator._id}
            >
              <div className={styles.cardIcons}>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`Update ${creator.name}`}
                  onClick={() => startEdit(creator)}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                  aria-label={`Delete ${creator.name}`}
                  onClick={() => handleDelete(creator)}
                  disabled={deletingId === creator._id}
                >
                  <TrashIcon />
                </button>
              </div>

              <div className={styles.photoWrap}>
                {creator.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={creator.image}
                    alt={creator.name}
                    className={styles.photo}
                  />
                ) : (
                  <span className={styles.photoPlaceholder}>
                    {creator.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <p className={styles.name}>{creator.name}</p>
              <p className={styles.position}>{creator.position}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
