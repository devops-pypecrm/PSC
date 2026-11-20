"use client";

import { useEffect, useState } from "react";
import styles from "./AdmissionModal.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subheading?: string;
  submitLabel?: string;
  source?: string;
  defaultPreference?: string;
};

const emptyForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  company: "",
  enquiry: "",
};

export default function AdmissionModal({
  open,
  onClose,
  title = "Get Your Admission",
  subheading = "Share your details and our admissions team will reach out to you.",
  submitLabel = "Submit Admission",
  source = "Navbar - Get Your Admission",
  defaultPreference = "",
}: Props) {
  const [form, setForm] = useState({ ...emptyForm, enquiry: defaultPreference });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  // Close on Escape and lock body scroll while the modal is open.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Reset the form the next time the modal is opened.
  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, enquiry: defaultPreference });
      setStatus("idle");
    }
  }, [open, defaultPreference]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");

    const data = new FormData(event.currentTarget);
    const payload = {
      firstName: String(data.get("firstName") || form.firstName || ""),
      lastName: String(data.get("lastName") || form.lastName || ""),
      phone: String(data.get("phone") || form.phone || ""),
      email: String(data.get("email") || form.email || ""),
      company: String(data.get("company") || form.company || ""),
      enquiry: String(data.get("enquiry") || form.enquiry || ""),
      source,
    };

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to submit");

      setStatus("sent");
      setForm(emptyForm);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admission-modal-title"
      onClick={onClose}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.close}
          aria-label="Close"
          onClick={onClose}
        >
          &times;
        </button>

        <h2 id="admission-modal-title" className={styles.heading}>
          {title}
        </h2>
        <p className={styles.subheading}>{subheading}</p>

        <form className={`${styles.form} ${styles.leadForm}`} onSubmit={handleSubmit}>
          <div className={`${styles.field} ${styles.leadField}`}>
            <label htmlFor="admission-firstName" className={styles.label}>
              First Name
            </label>
            <input
              id="admission-firstName"
              name="firstName"
              type="text"
              placeholder="Your first name"
              className={styles.input}
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </div>

          <div className={`${styles.field} ${styles.leadField}`}>
            <label htmlFor="admission-lastName" className={styles.label}>
              Last Name
            </label>
            <input
              id="admission-lastName"
              name="lastName"
              type="text"
              placeholder="Your last name"
              className={styles.input}
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </div>

          <div className={`${styles.field} ${styles.leadField}`}>
            <label htmlFor="admission-phone" className={styles.label}>
              Phone Number
            </label>
            <input
              id="admission-phone"
              name="phone"
              type="tel"
              placeholder="10-digit mobile number"
              className={styles.input}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              pattern="[0-9]{10}"
              title="Phone number must be exactly 10 digits"
              maxLength={10}
              required
            />
          </div>

          <div className={`${styles.field} ${styles.leadField}`}>
            <label htmlFor="admission-email" className={styles.label}>
              Email
            </label>
            <input
              id="admission-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              className={styles.input}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div
            className={`${styles.field} ${styles.leadField}`}
            style={{ display: "none" }}
          >
            <label htmlFor="admission-company" className={styles.label}>
              Company
            </label>
            <input
              id="admission-company"
              name="company"
              type="text"
              placeholder="Your company (optional)"
              className={styles.input}
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>

          <div className={`${styles.field} ${styles.leadField}`}>
            <label htmlFor="admission-enquiry" className={styles.label}>
              Enquiry
            </label>
            <textarea
              id="admission-enquiry"
              name="enquiry"
              rows={3}
              placeholder="Tell us how we can help..."
              className={styles.textarea}
              value={form.enquiry}
              onChange={(e) => setForm({ ...form, enquiry: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className={`${styles.submit} ${styles.leadWide}`}
            disabled={status === "sending"}
          >
            {status === "sending" ? "Sending..." : submitLabel}
          </button>

          {status === "sent" && (
            <p className={`${styles.statusMessage} ${styles.leadWide}`}>
              Thanks! Our admissions team will get back to you shortly.
            </p>
          )}
          {status === "error" && (
            <p className={`${styles.statusMessageError} ${styles.leadWide}`}>
              Something went wrong. Please try again.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
