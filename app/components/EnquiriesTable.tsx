"use client";

import { useEffect, useState } from "react";
import styles from "./EnquiriesTable.module.css";

type Enquiry = {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  company?: string;
  message: string;
  source: string;
  createdAt: string;
};

export default function EnquiriesTable() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading"
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  const loadEnquiries = () => {
    fetch("/api/enquiries")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load enquiries");
        return res.json();
      })
      .then((data) => {
        setEnquiries(data.enquiries || []);
        setStatus("loaded");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(() => {
    loadEnquiries();
  }, []);

  const handleDelete = async (enquiry: Enquiry) => {
    const displayName = enquiry.firstName
      ? `${enquiry.firstName} ${enquiry.lastName || ""}`.trim()
      : enquiry.name || enquiry.email;

    if (!window.confirm(`Are you sure you want to delete the enquiry from ${displayName}?`)) {
      return;
    }

    setDeletingId(enquiry._id);
    try {
      const response = await fetch(`/api/enquiries/${enquiry._id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete enquiry");
      }

      setEnquiries((prev) => prev.filter((item) => item._id !== enquiry._id));
      if (selectedEnquiry?._id === enquiry._id) {
        setSelectedEnquiry(null);
      }
    } catch (err) {
      alert((err as Error).message || "Couldn't delete this enquiry. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Enquiries</h1>
        <p className={styles.subheading}>
          Submissions from the Make Your Enquiry, Get a Free Consultation,
          and Send your Query forms.
        </p>
      </div>

      {status === "loading" && (
        <p className={styles.message}>Loading enquiries...</p>
      )}

      {status === "error" && (
        <p className={styles.messageError}>
          Couldn&apos;t load enquiries. Please refresh the page.
        </p>
      )}

      {status === "loaded" && enquiries.length === 0 && (
        <p className={styles.message}>No enquiries submitted yet.</p>
      )}

      {status === "loaded" && enquiries.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Company</th>
                <th>Enquiry</th>
                <th>Source</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enquiry) => (
                <tr key={enquiry._id}>
                  <td>{enquiry.firstName || enquiry.name || "—"}</td>
                  <td>{enquiry.lastName || "—"}</td>
                  <td>
                    <a
                      href={`tel:${enquiry.phone}`}
                      className={styles.detailLink}
                    >
                      {enquiry.phone}
                    </a>
                  </td>
                  <td>
                    <a
                      href={`mailto:${enquiry.email}`}
                      className={styles.detailLink}
                    >
                      {enquiry.email}
                    </a>
                  </td>
                  <td>{enquiry.company || "—"}</td>
                  <td className={styles.messageCell} title={enquiry.message || ""}>
                    {enquiry.message || "—"}
                  </td>
                  <td>{enquiry.source || "—"}</td>
                  <td>
                    {enquiry.createdAt
                      ? new Date(enquiry.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => setSelectedEnquiry(enquiry)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className={styles.actionButtonDanger}
                        onClick={() => handleDelete(enquiry)}
                        disabled={deletingId === enquiry._id}
                      >
                        {deletingId === enquiry._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedEnquiry && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedEnquiry(null)}
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setSelectedEnquiry(null)}
              aria-label="Close modal"
            >
              ×
            </button>

            <h2 className={styles.modalTitle}>Enquiry Details</h2>
            <p className={styles.modalSubtitle}>
              Submitted on{" "}
              {selectedEnquiry.createdAt
                ? new Date(selectedEnquiry.createdAt).toLocaleString()
                : "Unknown date"}
            </p>

            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>First Name</span>
                <span className={styles.detailValue}>
                  {selectedEnquiry.firstName || selectedEnquiry.name || "—"}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Last Name</span>
                <span className={styles.detailValue}>
                  {selectedEnquiry.lastName || "—"}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Phone</span>
                <a
                  href={`tel:${selectedEnquiry.phone}`}
                  className={`${styles.detailValue} ${styles.detailLink}`}
                >
                  {selectedEnquiry.phone}
                </a>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Email</span>
                <a
                  href={`mailto:${selectedEnquiry.email}`}
                  className={`${styles.detailValue} ${styles.detailLink}`}
                >
                  {selectedEnquiry.email}
                </a>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Company</span>
                <span className={styles.detailValue}>
                  {selectedEnquiry.company || "—"}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Source</span>
                <span className={styles.detailValue}>
                  {selectedEnquiry.source || "—"}
                </span>
              </div>

              <div className={styles.detailItemFull}>
                <span className={styles.detailLabel}>Message / Query</span>
                <div className={styles.messageBox}>
                  {selectedEnquiry.message || "No message provided."}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.actionButtonDanger}
                onClick={() => handleDelete(selectedEnquiry)}
                disabled={deletingId === selectedEnquiry._id}
              >
                {deletingId === selectedEnquiry._id ? "Deleting..." : "Delete Enquiry"}
              </button>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => setSelectedEnquiry(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
