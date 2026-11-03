"use client";

import { useCallback, useEffect, useState } from "react";
import AddFaqModal from "./AddFaqModal";
import styles from "./EnquiriesTable.module.css";
import orderStyles from "./FaqTable.module.css";
import type { Faq } from "../lib/faqUtils";

export default function FaqTable() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [savedOrder, setSavedOrder] = useState<string[]>([]);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading"
  );
  const [orderStatus, setOrderStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [orderError, setOrderError] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/faqs")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load FAQs");
        return res.json();
      })
      .then((data) => {
        const loadedFaqs: Faq[] = Array.isArray(data.faqs) ? data.faqs : [];
        setFaqs((current) => {
          if (current.length === 0) return loadedFaqs;
          const byId = new Map(loadedFaqs.map((faq) => [faq._id, faq]));
          const currentOrder = current
            .map((faq) => byId.get(faq._id))
            .filter((faq): faq is Faq => faq !== undefined);
          const orderedIds = new Set(currentOrder.map((faq) => faq._id));
          return [
            ...currentOrder,
            ...loadedFaqs.filter((faq) => !orderedIds.has(faq._id)),
          ];
        });
        setSavedOrder(loadedFaqs.map((faq) => faq._id));
        setOrderStatus("idle");
        setOrderError("");
        setStatus("loaded");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (faq: Faq) => {
    setEditing(faq);
    setModalOpen(true);
  };

  const handleDelete = async (faq: Faq) => {
    if (!confirm(`Delete this FAQ — "${faq.question}"? This can't be undone.`))
      return;

    setDeletingId(faq._id);
    try {
      const response = await fetch(`/api/faqs/${faq._id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete FAQ");
      load();
    } catch {
      alert("Couldn't delete this FAQ. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const moveFaq = (sourceId: string, targetId: string) => {
    setFaqs((current) => {
      const sourceIndex = current.findIndex((faq) => faq._id === sourceId);
      const targetIndex = current.findIndex((faq) => faq._id === targetId);
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return current;
      }

      const reordered = [...current];
      const [movedFaq] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, movedFaq);
      return reordered;
    });
    setOrderStatus("idle");
    setOrderError("");
  };

  const handleSaveOrder = async () => {
    setOrderStatus("saving");
    setOrderError("");

    try {
      const response = await fetch("/api/faqs/order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faqIds: faqs.map((faq) => faq._id) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save FAQ order");

      setSavedOrder(faqs.map((faq) => faq._id));
      setOrderStatus("saved");
    } catch (error) {
      setOrderStatus("error");
      setOrderError((error as Error).message);
    }
  };

  const orderChanged =
    faqs.length !== savedOrder.length ||
    faqs.some((faq, index) => faq._id !== savedOrder[index]);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.heading}>FAQ</h1>
            <p className={styles.subheading}>
              Frequently asked questions shown on the homepage.
            </p>
          </div>
          <button
            type="button"
            className={styles.addButton}
            onClick={openAdd}
          >
            + Create New FAQ
          </button>
        </div>
      </div>

      {status === "loading" && (
        <p className={styles.message}>Loading FAQs...</p>
      )}

      {status === "error" && (
        <p className={styles.messageError}>
          Couldn&apos;t load FAQs. Please refresh the page.
        </p>
      )}

      {status === "loaded" && faqs.length === 0 && (
        <p className={styles.message}>No FAQs added yet.</p>
      )}

      {status === "loaded" && faqs.length > 0 && (
        <>
          <div className={orderStyles.orderToolbar}>
            <div>
              <p className={orderStyles.orderHelp}>
                Drag FAQs to set their homepage order. Course-page FAQs are not
                affected.
              </p>
              {orderStatus === "saved" && (
                <p className={orderStyles.orderSuccess} role="status">
                  Homepage FAQ order saved.
                </p>
              )}
              {orderStatus === "error" && (
                <p className={orderStyles.orderError} role="alert">
                  {orderError}
                </p>
              )}
            </div>
            <button
              type="button"
              className={styles.addButton}
              onClick={handleSaveOrder}
              disabled={!orderChanged || orderStatus === "saving"}
            >
              {orderStatus === "saving" ? "Saving Order..." : "Save Order"}
            </button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Question</th>
                  <th>Answer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faqs.map((faq, index) => (
                  <tr
                    key={faq._id}
                    className={[
                      draggedId === faq._id ? orderStyles.draggingRow : "",
                      dropTargetId === faq._id ? orderStyles.dropTargetRow : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setDropTargetId(faq._id);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const sourceId =
                        event.dataTransfer.getData("text/plain") || draggedId;
                      if (sourceId) moveFaq(sourceId, faq._id);
                      setDraggedId(null);
                      setDropTargetId(null);
                    }}
                  >
                    <td>
                      <div className={orderStyles.positionCell}>
                        <span className={orderStyles.positionNumber}>
                          {index + 1}
                        </span>
                        <button
                          type="button"
                          className={orderStyles.dragHandle}
                          draggable={orderStatus !== "saving"}
                          aria-label={`Drag to move FAQ ${index + 1}: ${faq.question}`}
                          title="Drag to reorder"
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", faq._id);
                            setDraggedId(faq._id);
                          }}
                          onDragEnd={() => {
                            setDraggedId(null);
                            setDropTargetId(null);
                          }}
                        >
                          ⠿
                        </button>
                        <div className={orderStyles.positionButtons}>
                          <button
                            type="button"
                            aria-label={`Move FAQ ${index + 1} up`}
                            disabled={index === 0}
                            onClick={() =>
                              moveFaq(faq._id, faqs[Math.max(index - 1, 0)]._id)
                            }
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            aria-label={`Move FAQ ${index + 1} down`}
                            disabled={index === faqs.length - 1}
                            onClick={() =>
                              moveFaq(
                                faq._id,
                                faqs[Math.min(index + 1, faqs.length - 1)]._id
                              )
                            }
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>{faq.question || "—"}</td>
                    <td className={styles.reviewCell}>{faq.answer || "—"}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.actionButton}
                          onClick={() => openEdit(faq)}
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          className={styles.actionButtonDanger}
                          onClick={() => handleDelete(faq)}
                          disabled={deletingId === faq._id}
                        >
                          {deletingId === faq._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orderChanged && (
            <p className={orderStyles.unsavedNotice} role="status">
              Unsaved order changes
            </p>
          )}
        </>
      )}

      <AddFaqModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        faq={editing}
      />
    </section>
  );
}
