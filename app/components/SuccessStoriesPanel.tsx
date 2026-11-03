"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./SuccessStoriesPanel.module.css";
import { compressImageToDataUrl, MAX_RAW_IMAGE_BYTES } from "../lib/imageUpload";
import type { SuccessCategory } from "../lib/successStoryUtils";

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
  dataUrl?: string;
};

type UploadProgress = {
  categoryId: string;
  completed: number;
  total: number;
  fileName: string;
  preparing: boolean;
};

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getFileValidationError(file: File): string | null {
  if (file.size === 0) return "the file is empty";
  if (file.size > MAX_RAW_IMAGE_BYTES) return "the file exceeds the 10MB limit";

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !["jpg", "jpeg", "png", "webp"].includes(extension)) {
    return "only JPG, JPEG, PNG, and WebP images are allowed";
  }
  if (file.type && !ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
    return "only JPG, JPEG, PNG, and WebP images are allowed";
  }
  return null;
}

export default function SuccessStoriesPanel() {
  const previewUrls = useRef(new Set<string>());
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const uploadLock = useRef(false);
  const [categories, setCategories] = useState<SuccessCategory[]>([]);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading"
  );

  const [newCategoryName, setNewCategoryName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingName, setEditingName] = useState("");

  const [busyCategoryId, setBusyCategoryId] = useState<string | null>(null);
  const [busyImageId, setBusyImageId] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<
    Record<string, PendingImage[]>
  >({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );

  useEffect(
    () => () => {
      for (const url of previewUrls.current) URL.revokeObjectURL(url);
      previewUrls.current.clear();
    },
    []
  );

  const load = useCallback(() => {
    fetch("/api/success-categories", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load categories");
        return res.json();
      })
      .then((data) => {
        const loadedCategories = Array.isArray(data.categories)
          ? data.categories.map((category: SuccessCategory) => ({
              ...category,
              images: Array.isArray(category.images)
                ? category.images
                    .filter((image) => image && typeof image.id === "string")
                    .map((image) => ({
                      id: image.id,
                      src: typeof image.src === "string" ? image.src : "",
                    }))
                : [],
            }))
          : [];
        setCategories(loadedCategories);
        setStatus("loaded");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateCategory = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setCreateError("Category name is required");
      return;
    }

    setCreating(true);
    setCreateError("");
    try {
      const response = await fetch("/api/success-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to create category");

      setNewCategoryName("");
      load();
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const startRename = (category: SuccessCategory) => {
    setEditingCategoryId(category._id);
    setEditingName(category.name);
  };

  const saveRename = async (id: string) => {
    if (!editingName.trim()) return;
    setBusyCategoryId(id);
    try {
      const response = await fetch(`/api/success-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName }),
      });
      if (!response.ok) throw new Error("Failed to rename category");
      setEditingCategoryId(null);
      load();
    } catch {
      alert("Couldn't rename this category. Please try again.");
    } finally {
      setBusyCategoryId(null);
    }
  };

  const deleteCategory = async (category: SuccessCategory) => {
    if (
      !confirm(
        `Delete the "${category.name}" category and all its images? This can't be undone.`
      )
    )
      return;

    setBusyCategoryId(category._id);
    try {
      const response = await fetch(
        `/api/success-categories/${category._id}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete category");
      for (const image of pendingImages[category._id] || []) {
        URL.revokeObjectURL(image.previewUrl);
        previewUrls.current.delete(image.previewUrl);
      }
      setPendingImages((current) => {
        const next = { ...current };
        delete next[category._id];
        return next;
      });
      load();
    } catch {
      alert("Couldn't delete this category. Please try again.");
    } finally {
      setBusyCategoryId(null);
    }
  };

  const handleAddImages = async (
    categoryId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const accepted: PendingImage[] = [];
    const errors: string[] = [];
    for (const file of files) {
      const validationError = getFileValidationError(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}.`);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.add(previewUrl);
      accepted.push({ id: crypto.randomUUID(), file, previewUrl });
    }

    if (accepted.length > 0) {
      setPendingImages((current) => ({
        ...current,
        [categoryId]: [...(current[categoryId] || []), ...accepted],
      }));
    }
    setUploadErrors((current) => ({
      ...current,
      [categoryId]: errors.join(" "),
    }));
  };

  const removePendingImage = (categoryId: string, imageId: string) => {
    const image = pendingImages[categoryId]?.find((item) => item.id === imageId);
    if (image) {
      URL.revokeObjectURL(image.previewUrl);
      previewUrls.current.delete(image.previewUrl);
    }
    setPendingImages((current) => ({
      ...current,
      [categoryId]: (current[categoryId] || []).filter(
        (item) => item.id !== imageId
      ),
    }));
  };

  const uploadPendingImages = async (categoryId: string) => {
    if (uploadLock.current) return;
    const selected = pendingImages[categoryId] || [];
    if (selected.length === 0) return;

    uploadLock.current = true;
    setBusyCategoryId(categoryId);
    setUploadErrors((current) => ({ ...current, [categoryId]: "" }));
    let uploaded = 0;

    try {
      for (const image of selected) {
        setUploadProgress({
          categoryId,
          completed: uploaded,
          total: selected.length,
          fileName: image.file.name,
          preparing: true,
        });
        const src =
          image.dataUrl ||
          (await compressImageToDataUrl(image.file, 900, 0.8));
        if (!image.dataUrl) {
          setPendingImages((current) => ({
            ...current,
            [categoryId]: (current[categoryId] || []).map((item) =>
              item.id === image.id ? { ...item, dataUrl: src } : item
            ),
          }));
        }

        setUploadProgress((current) =>
          current
            ? { ...current, preparing: false }
            : current
        );
        const response = await fetch(
          `/api/success-categories/${categoryId}/images`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ images: [{ id: image.id, src }] }),
          }
        );
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            data?.error || `Upload failed (${response.status})`
          );
        }

        uploaded += 1;
        URL.revokeObjectURL(image.previewUrl);
        previewUrls.current.delete(image.previewUrl);
        setPendingImages((current) => ({
          ...current,
          [categoryId]: (current[categoryId] || []).filter(
            (item) => item.id !== image.id
          ),
        }));
      }
      load();
    } catch (error) {
      if (uploaded > 0) load();
      const failedFile = selected[uploaded]?.file.name;
      const reason =
        error instanceof Error ? error.message : "Please try again.";
      setUploadErrors((current) => ({
        ...current,
        [categoryId]: `Couldn't upload ${failedFile || "the selected image"}: ${reason}${
          uploaded > 0 ? ` ${uploaded} image${uploaded === 1 ? " was" : "s were"} already saved.` : ""
        }`,
      }));
    } finally {
      uploadLock.current = false;
      setBusyCategoryId(null);
      setUploadProgress(null);
    }
  };

  const handleReplaceImage = async (
    categoryId: string,
    imageId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = getFileValidationError(file);
    if (validationError) {
      alert(`${file.name}: ${validationError}.`);
      return;
    }

    setBusyImageId(imageId);
    try {
      const dataUrl = await compressImageToDataUrl(file, 900, 0.8);
      const response = await fetch(
        `/api/success-categories/${categoryId}/images/${imageId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update image");
      }
      load();
    } catch {
      alert("Couldn't update this image. Please try again.");
    } finally {
      setBusyImageId(null);
    }
  };

  const deleteImage = async (categoryId: string, imageId: string) => {
    if (!confirm("Delete this image? This can't be undone.")) return;

    setBusyImageId(imageId);
    try {
      const response = await fetch(
        `/api/success-categories/${categoryId}/images/${imageId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete image");
      load();
    } catch {
      alert("Couldn't delete this image. Please try again.");
    } finally {
      setBusyImageId(null);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageHeading}>Our Success</h1>
      <div className={styles.divider} />

      <form className={styles.form} onSubmit={handleCreateCategory}>
        <div className={styles.field}>
          <label htmlFor="new-category-name" className={styles.label}>
            Create New Category
          </label>
          <input
            id="new-category-name"
            type="text"
            className={styles.input}
            placeholder="e.g. Placement Success Stories"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
        </div>
        <button type="submit" className={styles.createButton} disabled={creating}>
          {creating ? "Creating..." : "Create"}
        </button>
        {createError && <p className={styles.formError}>{createError}</p>}
      </form>

      <div className={styles.divider} />

      {status === "loading" && (
        <p className={styles.message}>Loading categories...</p>
      )}
      {status === "error" && (
        <p className={styles.messageError}>
          Couldn&apos;t load categories. Please refresh the page.
        </p>
      )}
      {status === "loaded" && categories.length === 0 && (
        <p className={styles.message}>No categories added yet.</p>
      )}

      {status === "loaded" && categories.length > 0 && (
        <div className={styles.categoryList}>
          {categories.map((category) => (
            <section className={styles.categoryCard} key={category._id}>
              <div className={styles.categoryHeader}>
                {editingCategoryId === category._id ? (
                  <div className={styles.renameRow}>
                    <input
                      type="text"
                      className={styles.input}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className={styles.smallButton}
                      onClick={() => saveRename(category._id)}
                      disabled={busyCategoryId === category._id}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className={styles.smallButtonGhost}
                      onClick={() => setEditingCategoryId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className={styles.categoryName}>{category.name}</h2>
                    <div className={styles.categoryActions}>
                      <button
                        type="button"
                        className={styles.iconButton}
                        aria-label={`Update ${category.name}`}
                        onClick={() => startRename(category)}
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                        aria-label={`Delete ${category.name}`}
                        onClick={() => deleteCategory(category)}
                        disabled={busyCategoryId === category._id}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {(category.images.length > 0 ||
                (pendingImages[category._id]?.length || 0) > 0) && (
                <div className={styles.imageGrid}>
                  {category.images.map((image) => (
                    <div className={styles.imageThumb} key={image.id}>
                      {image.src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image.src} alt="" className={styles.imageThumbImg} />
                      ) : (
                        <span className={styles.missingImage}>Image unavailable</span>
                      )}
                      <div className={styles.imageThumbActions}>
                        <label className={styles.imageIconButton} title="Update image">
                          <EditIcon />
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                            className={styles.hiddenFileInput}
                            onChange={(e) =>
                              handleReplaceImage(category._id, image.id, e)
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className={`${styles.imageIconButton} ${styles.imageIconButtonDanger}`}
                          title="Delete image"
                          onClick={() => deleteImage(category._id, image.id)}
                          disabled={busyImageId === image.id}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(pendingImages[category._id] || []).map((image) => (
                    <div className={styles.imageThumb} key={image.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.previewUrl}
                        alt={image.file.name}
                        className={styles.imageThumbImg}
                      />
                      <span className={styles.pendingFileName} title={image.file.name}>
                        {image.file.name}
                      </span>
                      <button
                        type="button"
                        className={`${styles.imageIconButton} ${styles.imageIconButtonDanger} ${styles.pendingImageRemove}`}
                        title={`Remove ${image.file.name}`}
                        aria-label={`Remove ${image.file.name}`}
                        onClick={() => removePendingImage(category._id, image.id)}
                        disabled={busyCategoryId === category._id}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className={styles.addImagesButton}
                onClick={() => fileInputRefs.current[category._id]?.click()}
                disabled={busyCategoryId === category._id}
              >
                + Add Images
              </button>
              <input
                ref={(element) => {
                  fileInputRefs.current[category._id] = element;
                }}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                multiple
                className={styles.hiddenFileInput}
                onChange={(e) => handleAddImages(category._id, e)}
                disabled={busyCategoryId === category._id}
              />
              {(pendingImages[category._id]?.length || 0) > 0 && (
                <div className={styles.pendingUploadActions}>
                  <button
                    type="button"
                    className={styles.smallButton}
                    onClick={() => uploadPendingImages(category._id)}
                    disabled={busyCategoryId === category._id}
                  >
                    {busyCategoryId === category._id
                      ? "Uploading..."
                      : `Upload ${pendingImages[category._id].length} image${
                          pendingImages[category._id].length === 1 ? "" : "s"
                        }`}
                  </button>
                  {uploadProgress?.categoryId === category._id && (
                    <span className={styles.uploadProgressText} aria-live="polite">
                      {uploadProgress.preparing ? "Preparing" : "Uploading"}{" "}
                      {uploadProgress.fileName} ({uploadProgress.completed + 1}/
                      {uploadProgress.total})
                      <progress
                        className={styles.uploadProgress}
                        value={uploadProgress.completed}
                        max={uploadProgress.total}
                      />
                    </span>
                  )}
                </div>
              )}
              {uploadErrors[category._id] && (
                <p className={styles.uploadError} role="alert">
                  {uploadErrors[category._id]}
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
