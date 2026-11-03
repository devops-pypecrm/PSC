"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./DirectorsPanel.module.css";
import { compressImageToDataUrl, MAX_RAW_IMAGE_BYTES } from "../lib/imageUpload";
import type { Director } from "../lib/directorUtils";

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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

export default function DirectorsPanel() {
  const [directors, setDirectors] = useState<Director[]>([]);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading"
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isEdit = editingId !== null;

  const load = useCallback(() => {
    setStatus("loading");
    fetch("/api/directors")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load directors");
        return res.json();
      })
      .then((data) => {
        setDirectors(data.directors || []);
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
    setImage("");
    setFormError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startEdit = (director: Director) => {
    setEditingId(director._id);
    setName(director.name);
    setImage(director.image || "");
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
      setFormError("Director name is required");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const response = await fetch(
        isEdit ? `/api/directors/${editingId}` : "/api/directors",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, image }),
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to save director");

      resetForm();
      load();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (director: Director) => {
    if (!confirm(`Delete "${director.name}"? This can't be undone.`)) return;

    setDeletingId(director._id);
    try {
      const response = await fetch(`/api/directors/${director._id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete director");
      if (editingId === director._id) resetForm();
      load();
    } catch {
      alert("Couldn't delete this director. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageHeading}>Update Our Directors</h1>
      <div className={styles.divider} />

      <form className={styles.form} onSubmit={handleSubmit} ref={formRef}>
        <p className={styles.formTitle}>
          {isEdit ? `Editing "${name || "director"}"` : "Add a new director"}
        </p>

        <div className={styles.field}>
          <label htmlFor="director-name" className={styles.label}>
            Director Name
          </label>
          <input
            id="director-name"
            type="text"
            className={styles.input}
            placeholder="Enter director name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="director-image" className={styles.label}>
            Director Image
          </label>
          <div className={styles.imageRow}>
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className={styles.imagePreview} />
            )}
            {image && (
              <button
                type="button"
                className={styles.removeImageButton}
                onClick={handleRemoveImage}
              >
                Remove Image
              </button>
            )}
            <input
              ref={fileInputRef}
              id="director-image"
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
              : "+ Create Director"}
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
        <p className={styles.message}>Loading directors...</p>
      )}
      {status === "error" && (
        <p className={styles.messageError}>
          Couldn&apos;t load directors. Please refresh the page.
        </p>
      )}
      {status === "loaded" && directors.length === 0 && (
        <p className={styles.message}>No directors added yet.</p>
      )}

      {status === "loaded" && directors.length > 0 && (
        <div className={styles.grid}>
          {directors.map((director) => (
            <div
              className={`${styles.card} ${
                editingId === director._id ? styles.cardEditing : ""
              }`}
              key={director._id}
            >
              <div className={styles.photoWrap}>
                {director.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={director.image}
                    alt={director.name}
                    className={styles.photo}
                  />
                ) : (
                  <span className={styles.photoPlaceholder}>
                    {director.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <p className={styles.name}>{director.name}</p>

              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={styles.updateButton}
                  onClick={() => startEdit(director)}
                >
                  Update
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  aria-label={`Delete ${director.name}`}
                  onClick={() => handleDelete(director)}
                  disabled={deletingId === director._id}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
