"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SketchFrame from "./SketchFrame";
import styles from "./CertificationsPanel.module.css";
import { compressImageToDataUrl, MAX_RAW_IMAGE_BYTES } from "../lib/imageUpload";
import type { Certification } from "../lib/certificationUtils";

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

function RibbonIcon() {
  return (
    <svg width="28" height="34" viewBox="0 0 28 34" fill="none" aria-hidden="true">
      <circle cx="14" cy="12" r="10" stroke="#c8a13a" strokeWidth="1.5" />
      <path
        d="M8 20L6 32L14 27L22 32L20 20"
        stroke="#c8a13a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CertificationsPanel() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
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
    fetch("/api/certifications")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load certifications");
        return res.json();
      })
      .then((data) => {
        setCertifications(data.certifications || []);
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

  const startEdit = (certification: Certification) => {
    setEditingId(certification._id);
    setName(certification.name);
    setImage(certification.image || "");
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
      const dataUrl = await compressImageToDataUrl(file, 700, 0.85);
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
      setFormError("Certificate name is required");
      return;
    }
    if (!isEdit && !image) {
      setFormError("Certificate image is required");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const response = await fetch(
        isEdit ? `/api/certifications/${editingId}` : "/api/certifications",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, image }),
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to save certificate");

      resetForm();
      load();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (certification: Certification) => {
    if (!confirm(`Delete "${certification.name}"? This can't be undone.`))
      return;

    setDeletingId(certification._id);
    try {
      const response = await fetch(
        `/api/certifications/${certification._id}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete certificate");
      if (editingId === certification._id) resetForm();
      load();
    } catch {
      alert("Couldn't delete this certificate. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageHeading}>Certifications</h1>
      <div className={styles.divider} />

      <form className={styles.form} onSubmit={handleSubmit} ref={formRef}>
        <p className={styles.formTitle}>
          {isEdit
            ? `Editing "${name || "certificate"}"`
            : "Add a new certificate"}
        </p>

        <div className={styles.field}>
          <label htmlFor="cert-name" className={styles.label}>
            Certificate Name
          </label>
          <input
            id="cert-name"
            type="text"
            className={styles.input}
            placeholder="Enter certificate name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="cert-image" className={styles.label}>
            Certificate Image
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
              id="cert-image"
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
              : "+ Create Certificate"}
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
        <p className={styles.message}>Loading certifications...</p>
      )}
      {status === "error" && (
        <p className={styles.messageError}>
          Couldn&apos;t load certifications. Please refresh the page.
        </p>
      )}
      {status === "loaded" && certifications.length === 0 && (
        <p className={styles.message}>No certifications added yet.</p>
      )}

      {status === "loaded" && certifications.length > 0 && (
        <div className={styles.grid}>
          {certifications.map((certification) => (
            <div
              className={`${styles.card} ${
                editingId === certification._id ? styles.cardEditing : ""
              }`}
              key={certification._id}
            >
              <SketchFrame />

              <div className={styles.ribbon}>
                <RibbonIcon />
              </div>

              <div className={styles.imageWrap}>
                {certification.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={certification.image}
                    alt={certification.name}
                    className={styles.image}
                  />
                )}
              </div>

              <p className={styles.name}>{certification.name}</p>

              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={styles.updateButton}
                  onClick={() => startEdit(certification)}
                >
                  Update
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  aria-label={`Delete ${certification.name}`}
                  onClick={() => handleDelete(certification)}
                  disabled={deletingId === certification._id}
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
