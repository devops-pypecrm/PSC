"use client";

import { useState } from "react";
import SketchFrame from "./SketchFrame";
import styles from "./ContactFormSection.module.css";

export default function ContactFormSection() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    company: "",
    enquiry: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");

    // Read straight from the DOM via FormData rather than the React state
    // alone — some browsers fill fields (autofill, password managers) in a
    // way that satisfies `required` without firing React's onChange, which
    // would otherwise leave the component state empty at submit time.
    const data = new FormData(event.currentTarget);
    const payload = {
      firstName: String(data.get("firstName") || form.firstName || ""),
      lastName: String(data.get("lastName") || form.lastName || ""),
      phone: String(data.get("phone") || form.phone || ""),
      email: String(data.get("email") || form.email || ""),
      company: String(data.get("company") || form.company || ""),
      enquiry: String(data.get("enquiry") || form.enquiry || ""),
      source: "Contact - Send your Query",
    };

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to submit");

      setStatus("sent");
      setForm({ firstName: "", lastName: "", phone: "", email: "", company: "", enquiry: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <SketchFrame rx={24} className={styles.sketch} />

        <h2 className={styles.heading}>Send your Query</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldRow}>
            <input type="text" name="firstName" placeholder="First Name" className={styles.input} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <input type="text" name="lastName" placeholder="Last Name" className={styles.input} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </div>
          <div className={styles.fieldRow}>
            <input type="tel" name="phone" placeholder="10-digit mobile number" className={styles.input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} pattern="[0-9]{10}" title="Phone number must be exactly 10 digits" maxLength={10} required />
            <input type="email" name="email" placeholder="Email" className={styles.input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}" title="Please enter a valid email address" required />
          </div>
          <input type="text" name="company" placeholder="Company (optional)" className={styles.input} style={{ display: "none" }} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <textarea name="enquiry" placeholder="Enquiry" rows={5} className={styles.textarea} value={form.enquiry} onChange={(e) => setForm({ ...form, enquiry: e.target.value })}></textarea>

          <button
            type="submit"
            className={styles.submit}
            disabled={status === "sending"}
          >
            {status === "sending" ? "Sending..." : "Send"}
          </button>

          {status === "sent" && (
            <p className={styles.statusMessage}>
              Thanks! We&apos;ll get back to you shortly.
            </p>
          )}
          {status === "error" && (
            <p className={styles.statusMessageError}>
              Something went wrong. Please try again.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
