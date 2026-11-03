"use client";

import { useEffect, useState } from "react";
import type { ProgramFaq } from "../lib/programUtils";
import SketchFrame from "./SketchFrame";
import styles from "./ProgramDetailsSection.module.css";

type Props = {
  programName: string;
  splitIntoColumns?: boolean;
};

export default function ProgramFaqSection({
  programName,
  splitIntoColumns = false,
}: Props) {
  const [faqs, setFaqs] = useState<ProgramFaq[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/programs")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        const program = (data.programs || []).find(
          (item: { name?: string }) =>
            String(item.name || "").toLowerCase() === programName.toLowerCase()
        );
        const savedFaqs = Array.isArray(program?.details?.faqs)
          ? program.details.faqs
          : [];
        setFaqs(savedFaqs);
      })
      .catch(() => setFaqs([]));
  }, [programName]);

  if (faqs.length === 0) return null;

  const midpoint = Math.ceil(faqs.length / 2);
  const renderFaq = (faq: ProgramFaq, index: number) => {
    const isOpen = openFaq === index;
    return (
      <article className={styles.programFaqItem} key={`${faq.question}-${index}`}>
        <SketchFrame className={styles.programFaqSketchFrame} rx={12} />
        <button
          type="button"
          className={styles.programFaqTrigger}
          onClick={() => setOpenFaq(isOpen ? null : index)}
          aria-expanded={isOpen}
        >
          <span>{faq.question}</span>
          <span className={styles.programFaqIcon}>{isOpen ? "−" : "+"}</span>
        </button>
        {isOpen && <p className={styles.programFaqAnswer}>{faq.answer}</p>}
      </article>
    );
  };

  return (
    <section className={styles.programFaqSection} aria-labelledby="program-faq-heading">
      <h2 id="program-faq-heading" className={styles.programFaqHeading}>
        Frequently Asked Questions
      </h2>
      <div className={splitIntoColumns ? styles.programFaqColumns : styles.programFaqGrid}>
        {splitIntoColumns ? (
          <>
            <div className={styles.programFaqColumn}>
              {faqs.slice(0, midpoint).map(renderFaq)}
            </div>
            <div className={styles.programFaqColumn}>
              {faqs.slice(midpoint).map((faq, index) => renderFaq(faq, midpoint + index))}
            </div>
          </>
        ) : (
          faqs.map(renderFaq)
        )}
      </div>
    </section>
  );
}
