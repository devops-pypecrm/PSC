"use client";

import { useState } from "react";
import AdmissionModal from "./AdmissionModal";
import styles from "./Hero.module.css";
import type { HeroContent } from "../lib/heroUtils";

export default function Hero({ heroContent }: { heroContent: HeroContent }) {
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
  const [consultationOpen, setConsultationOpen] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("enquiry clicked");
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
      source: "Home - Make Your Enquiry",
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
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.content}>
          <div className={styles.rating}>
            <span className={styles.ratingScore}>4.9</span>
            <div className={styles.ratingDetails}>
              <span className={styles.ratingLabel}>Star Rating</span>
              <span className={styles.ratingSource}>Google ★★★★★</span>
            </div>
          </div>

          <p className={styles.eyebrow}>{heroContent.tag}</p>

          <h1 className={styles.heading}>{heroContent.heading}</h1>

          <ul className={styles.features}>
            {heroContent.children
              .filter((child) => child.visible !== false)
              .map((child, i) => (
              <li key={i} className={styles.feature}>
                <span className={styles.featureTitle}>{child.heading}</span>
                <span className={styles.featureSubtitle}>
                  {child.paragraph}
                </span>
              </li>
            ))}
          </ul>

          <div className={styles.actions}>
            <a
              href="https://findyouruniversity.com/"
              target="_self"
              className={styles.primaryButton}
            >
              Find Your University
            </a>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setConsultationOpen(true)}
            >
              Book a Free Consultation
            </button>
          </div>
        </div>

        <div className={styles.media}>
          <form className={styles.enquiryCard} onSubmit={handleSubmit}>
            <h2 className={styles.enquiryHeading}>Make Your Enquiry</h2>

            <div className={styles.enquiryField}>
              <label htmlFor="enquiry-firstName" className={styles.enquiryLabel}>
                First Name
              </label>
              <input
                id="enquiry-firstName"
                name="firstName"
                type="text"
                placeholder="Your first name"
                className={styles.enquiryInput}
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </div>

            <div className={styles.enquiryField}>
              <label htmlFor="enquiry-lastName" className={styles.enquiryLabel}>
                Last Name
              </label>
              <input
                id="enquiry-lastName"
                name="lastName"
                type="text"
                placeholder="Your last name"
                className={styles.enquiryInput}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </div>

            <div className={styles.enquiryField}>
              <label htmlFor="enquiry-phone" className={styles.enquiryLabel}>
                Phone
              </label>
              <input
                id="enquiry-phone"
                name="phone"
                type="tel"
                placeholder="10-digit mobile number"
                className={styles.enquiryInput}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                pattern="[0-9]{10}"
                title="Phone number must be exactly 10 digits"
                maxLength={10}
                required
              />
            </div>

            <div className={styles.enquiryField}>
              <label htmlFor="enquiry-email" className={styles.enquiryLabel}>
                Email
              </label>
              <input
                id="enquiry-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className={styles.enquiryInput}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className={styles.enquiryField} style={{ display: "none" }}>
              <label htmlFor="enquiry-company" className={styles.enquiryLabel}>
                Company
              </label>
              <input
                id="enquiry-company"
                name="company"
                type="text"
                placeholder="Your company (optional)"
                className={styles.enquiryInput}
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>

            <div className={`${styles.enquiryField} ${styles.enquiryWide}`}>
              <label htmlFor="enquiry-enquiry" className={styles.enquiryLabel}>
                Enquiry
              </label>
              <textarea
                id="enquiry-enquiry"
                name="enquiry"
                rows={3}
                placeholder="Tell us how we can help..."
                className={styles.enquiryInput}
                value={form.enquiry}
                onChange={(e) => setForm({ ...form, enquiry: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className={styles.enquireButton}
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending..." : "Enquire Now"}
            </button>

            {status === "sent" && (
              <p className={styles.enquiryStatus}>
                Thanks! We&apos;ll get back to you shortly.
              </p>
            )}
            {status === "error" && (
              <p className={styles.enquiryStatusError}>
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        </div>
      </div>
      <AdmissionModal
        open={consultationOpen}
        onClose={() => setConsultationOpen(false)}
        title="Get Your Admission"
        subheading="Share your contact details for a consultation and our team will reach out to you."
        submitLabel="Submit Consultation"
        source="Home - Book a Free Consultation"
      />
    </section>
  );
}
