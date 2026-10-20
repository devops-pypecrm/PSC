"use client";

import { useCallback, useEffect, useState } from "react";
import AddProgramModal from "./AddProgramModal";
import ProgramDetailsEditor from "./ProgramDetailsEditor";
import styles from "./EnquiriesTable.module.css";
import type { Program } from "../lib/programUtils";

export default function ProgramsTable({ initialPrograms }: { initialPrograms?: Program[] }) {
  const [programs, setPrograms] = useState<Program[]>(initialPrograms || []);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    initialPrograms ? "loaded" : "loading"
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [detailsProgram, setDetailsProgram] = useState<Program | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setStatus("loading");
    fetch("/api/programs")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load programs");
        return res.json();
      })
      .then((data) => {
        setPrograms(data.programs || []);
        setStatus("loaded");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    if (initialPrograms) return;

    fetch("/api/programs")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load programs");
        return res.json();
      })
      .then((data) => {
        setPrograms(data.programs || []);
        setStatus("loaded");
      })
      .catch(() => setStatus("error"));
  }, [initialPrograms, load]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (program: Program) => {
    setEditing(program);
    setModalOpen(true);
  };

  const openDetails = (program: Program) => {
    setDetailsProgram(program);
  };

  const handleDelete = async (program: Program) => {
    if (!confirm(`Delete "${program.name}"? This can't be undone.`)) return;

    setDeletingId(program._id);
    try {
      const response = await fetch(`/api/programs/${program._id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete program");
      load();
    } catch {
      alert("Couldn't delete this program. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (detailsProgram) {
    return (
      <ProgramDetailsEditor
        program={detailsProgram}
        onBack={() => setDetailsProgram(null)}
        onSaved={load}
      />
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.heading}>Programs</h1>
            <p className={styles.subheading}>
              Programs offered, grouped by Online and Offline categories.
            </p>
          </div>
          <button
            type="button"
            className={styles.addButton}
            onClick={openAdd}
          >
            + Add Program
          </button>
        </div>
      </div>

      {status === "loading" && (
        <p className={styles.message}>Loading programs...</p>
      )}

      {status === "error" && (
        <p className={styles.messageError}>
          Couldn&apos;t load programs. Please refresh the page.
        </p>
      )}

      {status === "loaded" && programs.length === 0 && (
        <p className={styles.message}>No programs added yet.</p>
      )}

      {status === "loaded" && programs.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Program Category</th>
                <th>Program Name</th>
                <th>Hero Heading</th>
                <th>About</th>
                <th className={styles.heroParaCell}>Hero Para</th>
                <th>Duration</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((program) => (
                <tr key={program._id}>
                  <td>
                    {program.category ? (
                      <span
                        className={`${styles.categoryBadge} ${
                          program.category === "Online"
                            ? styles.categoryOnline
                            : styles.categoryOffline
                        }`}
                      >
                        {program.category}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{program.name || "—"}</td>
                  <td>{program.heroHeading || "—"}</td>
                  <td>{program.heroAbout || "—"}</td>
                  <td className={styles.heroParaCell}>{program.heroPara || "—"}</td>
                  <td>{program.duration || "—"}</td>
                  <td>
                    {program.createdAt
                      ? new Date(program.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td>
                    <div className={styles.actionsColumn}>
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => openDetails(program)}
                      >
                        Add Details
                      </button>
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => openEdit(program)}
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        className={styles.actionButtonDanger}
                        onClick={() => handleDelete(program)}
                        disabled={deletingId === program._id}
                      >
                        {deletingId === program._id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddProgramModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        program={editing}
      />
    </section>
  );
}
