"use client";

import { useState } from "react";
import SketchFrame from "./SketchFrame";
import styles from "./ConsultationForm.module.css";

export default function ConsultationForm() {
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
      source: "About - Get a Free Consultation",
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
      <div className={styles.header}>
        <p className={styles.label}>Free Consultation</p>
        <h2 className={styles.heading}>Get a Free Consultation</h2>
        <p className={styles.subheading}>
          Fill in your details and a career counsellor will get back to you
          within 24 hours — no cost, no obligation.
        </p>
      </div>

      <div className={styles.card}>
        <SketchFrame rx={24} />

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="consult-firstName" className={styles.fieldLabel}>
                First Name
              </label>
              <input
                id="consult-firstName"
                name="firstName"
                type="text"
                placeholder="Your first name"
                className={styles.input}
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="consult-lastName" className={styles.fieldLabel}>
                Last Name
              </label>
              <input
                id="consult-lastName"
                name="lastName"
                type="text"
                placeholder="Your last name"
                className={styles.input}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="consult-phone" className={styles.fieldLabel}>
                Phone
              </label>
              <input
                id="consult-phone"
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

            <div className={styles.field}>
              <label htmlFor="consult-email" className={styles.fieldLabel}>
                Email
              </label>
              <input
                id="consult-email"
                name="email"
                type="email"
                placeholder="your@email.com"
                className={styles.input}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className={styles.field} style={{ display: "none" }}>
            <label htmlFor="consult-company" className={styles.fieldLabel}>
              Company
            </label>
            <input
              id="consult-company"
              name="company"
              type="text"
              placeholder="Your company (optional)"
              className={styles.input}
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="consult-enquiry" className={styles.fieldLabel}>
              Enquiry
            </label>
            <textarea
              id="consult-enquiry"
              name="enquiry"
              rows={4}
              placeholder="Tell us how we can help..."
              className={styles.textarea}
              value={form.enquiry}
              onChange={(e) => setForm({ ...form, enquiry: e.target.value })}
            ></textarea>
          </div>

          <button
            type="submit"
            className={styles.submit}
            disabled={status === "sending"}
          >
            {status === "sending" ? "Sending..." : "Send Message"}
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
