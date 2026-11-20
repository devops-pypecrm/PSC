"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./AdmissionModal.module.css";

const emptyForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  company: "",
  enquiry: "",
};

const POPUP_DELAY_MS = 10000;

// Site-wide "Connect With Us" lead popup. Mounted once in the root layout
// so it fires exactly once per real page load (not on every client-side
// navigation, since layout.tsx isn't remounted between routes) — but it's
// skipped entirely on /admin, where it would just be noise.
export default function ConnectModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(() => setOpen(true), POPUP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [dismissed]);

  const close = () => {
    setOpen(false);
    setDismissed(true);
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (pathname?.startsWith("/admin")) return null;
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
      source: "Connect With Us Popup",
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
      aria-labelledby="connect-modal-title"
      onClick={close}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.close}
          aria-label="Close"
          onClick={close}
        >
          &times;
        </button>

        <h2 id="connect-modal-title" className={styles.heading}>
          Connect With Us
        </h2>
        <p className={styles.subheading}>
          Leave your details and our team will reach out to you shortly.
        </p>

        <form className={`${styles.form} ${styles.leadForm}`} onSubmit={handleSubmit}>
          <div className={`${styles.field} ${styles.leadField}`}>
            <label htmlFor="connect-firstName" className={styles.label}>
              First Name
            </label>
            <input
              id="connect-firstName"
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
            <label htmlFor="connect-lastName" className={styles.label}>
              Last Name
            </label>
            <input
              id="connect-lastName"
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
            <label htmlFor="connect-phone" className={styles.label}>
              Phone Number
            </label>
            <input
              id="connect-phone"
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
            <label htmlFor="connect-email" className={styles.label}>
              Email
            </label>
            <input
              id="connect-email"
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
            <label htmlFor="connect-company" className={styles.label}>
              Company
            </label>
            <input
              id="connect-company"
              name="company"
              type="text"
              placeholder="Your company (optional)"
              className={styles.input}
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>

          <div className={`${styles.field} ${styles.leadField}`}>
            <label htmlFor="connect-enquiry" className={styles.label}>
              Enquiry
            </label>
            <textarea
              id="connect-enquiry"
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
            disabled={status === "sending" || status === "sent"}
          >
            {status === "sending"
              ? "Sending..."
              : status === "sent"
              ? "Sent!"
              : "Submit"}
          </button>

          {status === "sent" && (
            <p className={`${styles.statusMessage} ${styles.leadWide}`}>
              Thanks! We&apos;ll get back to you shortly.
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
