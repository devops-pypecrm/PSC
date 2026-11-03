"use client";

import { useEffect, useState } from "react";
import type { AdminView } from "./AdminNavbar";
import styles from "./AdminOverview.module.css";

type Section = {
  label: string;
  endpoint: string;
  key: string;
  view: AdminView;
};

type Dataset = {
  label: string;
  view: AdminView;
  rows: Record<string, unknown>[];
  status: "loading" | "loaded" | "error";
};

const sections: Section[] = [
  { label: "Hero", endpoint: "/api/hero", key: "hero", view: "hero" },
  { label: "Enquiries", endpoint: "/api/enquiries", key: "enquiries", view: "enquiries" },
  { label: "Programs", endpoint: "/api/programs", key: "programs", view: "programs" },
  { label: "Reviews", endpoint: "/api/reviews", key: "reviews", view: "reviews" },
  { label: "FAQs", endpoint: "/api/faqs", key: "faqs", view: "faq" },
  { label: "Events", endpoint: "/api/events", key: "events", view: "events" },
  { label: "Directors", endpoint: "/api/directors", key: "directors", view: "directors" },
  { label: "Contacts", endpoint: "/api/contacts", key: "contacts", view: "contacts" },
  { label: "Skill Creators", endpoint: "/api/skill-creators", key: "skillCreators", view: "skillCreators" },
  { label: "Success Stories", endpoint: "/api/success-categories", key: "categories", view: "successStories" },
  { label: "Success Videos", endpoint: "/api/success-videos", key: "videos", view: "successVideos" },
  { label: "Notifications", endpoint: "/api/page-notifications", key: "notifications", view: "notifications" },
  { label: "Certifications", endpoint: "/api/certifications", key: "certifications", view: "certifications" },
  { label: "Blogs", endpoint: "/api/blogs", key: "blogs", view: "blogs" },
  { label: "Career", endpoint: "/api/career", key: "logos", view: "career" },
];

const toRows = (value: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
};

const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export default function AdminOverview({ onSelect }: { onSelect: (view: AdminView) => void }) {
  const [datasets, setDatasets] = useState<Dataset[]>(
    sections.map((section) => ({ ...section, rows: [], status: "loading" }))
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      sections.map(async (section) => {
        try {
          const response = await fetch(section.endpoint);
          if (!response.ok) throw new Error("Request failed");
          const data = await response.json();
          return { ...section, rows: toRows(data[section.key]), status: "loaded" as const };
        } catch {
          return { ...section, rows: [], status: "error" as const };
        }
      })
    ).then((next) => {
      if (!cancelled) setDatasets(next);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Admin Overview</p>
        <h1 className={styles.heading}>Dashboard</h1>
        <p className={styles.subheading}>Read-only summaries from every admin section. Showing the latest 10 records.</p>
      </div>

      <div className={styles.grid}>
        {datasets.map((dataset) => {
          const rows = dataset.rows.slice(0, 10);
          return (
            <article className={styles.card} key={dataset.label}>
              <div className={styles.cardHeader}>
                <div>
                  <h2>{dataset.label}</h2>
                  <span>{dataset.status === "loading" ? "Loading..." : `${dataset.rows.length} total`}</span>
                </div>
                <button type="button" className={styles.viewButton} onClick={() => onSelect(dataset.view)}>
                  View More
                </button>
              </div>
              {dataset.status === "error" ? (
                <p className={styles.empty}>Unable to load this section.</p>
              ) : rows.length === 0 && dataset.status === "loaded" ? (
                <p className={styles.empty}>No records yet.</p>
              ) : (
                <div className={styles.rows}>
                  {rows.map((row, index) => {
                    const entries = Object.entries(row)
                      .filter(([key]) => !["_id", "image", "content", "details"].includes(key))
                      .slice(0, 3);
                    return (
                      <div className={styles.row} key={String(row._id || index)}>
                        {entries.map(([key, value]) => (
                          <span key={key} title={displayValue(value)}>
                            <strong>{key}:</strong> {displayValue(value)}
                          </span>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
