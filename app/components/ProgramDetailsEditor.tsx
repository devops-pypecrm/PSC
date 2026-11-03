"use client";

import { useRef, useState } from "react";
import { useEffect } from "react";
import type { CourseModule, Program, ProgramDetails, ProgramFaq, ProgramReview } from "../lib/programUtils";
import { compressImageToDataUrl, MAX_RAW_IMAGE_BYTES } from "../lib/imageUpload";
import styles from "./ProgramDetailsEditor.module.css";

type Props = {
  program: Program;
  onBack: () => void;
  onSaved: () => void;
};

const emptyDetails: ProgramDetails = {
  overview: "",
  curriculumHeading: "Complete Course Module",
  curriculumModules: [],
  benefitsHeading: "",
  benefitsPara: "",
  benefitsItems: [],
  intakeCount: "",
  brochureUrl: "",
  sidebarMediaUrl: "",
  courseIncludes: [],
  quickQuestions: [],
  careerOutcomesPara: "",
  careerOutcomesLogos: [],
  reviews: [],
  faqs: [],
};

const getDetails = (program: Program): ProgramDetails => ({
  ...emptyDetails,
  ...program.details,
  curriculumModules: program.details?.curriculumModules || [],
  benefitsItems:
    program.details?.benefitsItems?.length
      ? program.details.benefitsItems
      : program.details?.benefitsHeading || program.details?.benefitsPara
      ? [
          {
            heading: program.details.benefitsHeading || "",
            para: program.details.benefitsPara || "",
          },
        ]
      : [],
  courseIncludes: program.details?.courseIncludes || [],
  quickQuestions: program.details?.quickQuestions || [],
  careerOutcomesLogos: program.details?.careerOutcomesLogos || [],
  reviews: program.details?.reviews || [],
  faqs: program.details?.faqs || [],
});

export default function ProgramDetailsEditor({ program, onBack, onSaved }: Props) {
  const [details, setDetails] = useState<ProgramDetails>(() => getDetails(program));
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState("");
  const [careerLogos, setCareerLogos] = useState<string[]>([]);
  const [careerPickerOpen, setCareerPickerOpen] = useState(false);
  const reviewFileRefs = useRef<Array<HTMLInputElement | null>>([]);
  const brochureInputRef = useRef<HTMLInputElement | null>(null);
  const sidebarMediaInputRef = useRef<HTMLInputElement | null>(null);
  const [faqSavingIndex, setFaqSavingIndex] = useState<number | null>(null);
  const [faqDraft, setFaqDraft] = useState<ProgramFaq | null>(null);
  const [faqEditingIndex, setFaqEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/career")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        const titles = Array.isArray(data.logos)
          ? data.logos.map((logo: { title?: unknown }) => String(logo.title || ""))
          : [];
        setCareerLogos(titles);
      })
      .catch(() => setCareerLogos([]));
  }, []);

  const updateDetails = <K extends keyof ProgramDetails>(
    field: K,
    value: ProgramDetails[K]
  ) => setDetails((current) => ({ ...current, [field]: value }));

  const addModule = () => {
    const module: CourseModule = { heading: "", para: "" };
    updateDetails("curriculumModules", [...details.curriculumModules, module]);
  };

  const updateModule = (
    index: number,
    field: keyof CourseModule,
    value: string
  ) => {
    updateDetails(
      "curriculumModules",
      details.curriculumModules.map((module, moduleIndex) =>
        moduleIndex === index ? { ...module, [field]: value } : module
      )
    );
  };

  const removeModule = (index: number) => {
    updateDetails(
      "curriculumModules",
      details.curriculumModules.filter((_, moduleIndex) => moduleIndex !== index)
    );
  };

  const addBenefit = () => {
    updateDetails("benefitsItems", [
      ...details.benefitsItems,
      { heading: "", para: "" },
    ]);
  };

  const updateBenefit = (
    index: number,
    field: "heading" | "para",
    value: string
  ) => {
    updateDetails(
      "benefitsItems",
      details.benefitsItems.map((benefit, benefitIndex) =>
        benefitIndex === index ? { ...benefit, [field]: value } : benefit
      )
    );
  };

  const removeBenefit = (index: number) => {
    updateDetails(
      "benefitsItems",
      details.benefitsItems.filter((_, benefitIndex) => benefitIndex !== index)
    );
  };

  const addInclude = () =>
    updateDetails("courseIncludes", [...details.courseIncludes, ""]);

  const updateInclude = (index: number, value: string) =>
    updateDetails(
      "courseIncludes",
      details.courseIncludes.map((item, itemIndex) =>
        itemIndex === index ? value : item
      )
    );

  const removeInclude = (index: number) =>
    updateDetails(
      "courseIncludes",
      details.courseIncludes.filter((_, itemIndex) => itemIndex !== index)
    );

  const addQuestion = () =>
    updateDetails("quickQuestions", [
      ...details.quickQuestions,
      { heading: "", para: "" },
    ]);

  const updateQuestion = (
    index: number,
    field: keyof CourseModule,
    value: string
  ) =>
    updateDetails(
      "quickQuestions",
      details.quickQuestions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, [field]: value } : question
      )
    );

  const removeQuestion = (index: number) =>
    updateDetails(
      "quickQuestions",
      details.quickQuestions.filter((_, questionIndex) => questionIndex !== index)
    );

  const handleBrochureChange = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Brochure must be smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => updateDetails("brochureUrl", String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleSidebarMediaChange = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setError("Sidebar media must be an image or video file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Sidebar media must be smaller than 20 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateDetails("sidebarMediaUrl", String(reader.result || ""));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const toggleCareerLogo = (title: string) => {
    updateDetails(
      "careerOutcomesLogos",
      details.careerOutcomesLogos.includes(title)
        ? details.careerOutcomesLogos.filter((item) => item !== title)
        : [...details.careerOutcomesLogos, title]
    );
  };

  const addReview = () =>
    updateDetails("reviews", [...details.reviews, { name: "", review: "", image: "" }]);

  const updateReview = (
    index: number,
    field: keyof ProgramReview,
    value: string
  ) =>
    updateDetails(
      "reviews",
      details.reviews.map((review, reviewIndex) =>
        reviewIndex === index ? { ...review, [field]: value } : review
      )
    );

  const removeReview = (index: number) =>
    updateDetails(
      "reviews",
      details.reviews.filter((_, reviewIndex) => reviewIndex !== index)
    );

  const addFaq = () => {
    setFaqEditingIndex(null);
    setFaqDraft({ question: "", answer: "" });
  };

  const saveProgramDetails = async (nextDetails = details) => {
    const response = await fetch(`/api/programs/${program._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: program.category,
        name: program.name,
        duration: program.duration,
        heroPara: program.heroPara || "",
        heroHeading: program.heroHeading || "",
        heroAbout: program.heroAbout || "",
        heroPoints: program.heroPoints || [],
        details: nextDetails,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to save details");
    onSaved();
  };

  const deleteSidebarUpload = async (
    field: "brochureUrl" | "sidebarMediaUrl"
  ) => {
    const label = field === "brochureUrl" ? "brochure" : "sidebar media";
    if (!window.confirm(`Delete the uploaded ${label}? This cannot be undone.`)) {
      return;
    }

    const nextDetails = { ...details, [field]: "" };
    setStatus("saving");
    setError("");
    try {
      await saveProgramDetails(nextDetails);
      setDetails((current) => ({ ...current, [field]: "" }));
      if (field === "brochureUrl" && brochureInputRef.current) {
        brochureInputRef.current.value = "";
      }
      if (field === "sidebarMediaUrl" && sidebarMediaInputRef.current) {
        sidebarMediaInputRef.current.value = "";
      }
      setStatus("idle");
    } catch (saveError) {
      setStatus("error");
      setError((saveError as Error).message);
    }
  };

  const saveFaq = async (index: number) => {
    const faq = faqDraft || details.faqs[index];
    if (!faq) return;
    if (!faq.question.trim() || !faq.answer.trim()) {
      setError("Add both a question and an answer before saving the FAQ.");
      return;
    }

    setFaqSavingIndex(index);
    setError("");
    try {
      const nextFaqs =
        faqEditingIndex === null
          ? [...details.faqs, faq]
          : details.faqs.map((item, itemIndex) =>
              itemIndex === faqEditingIndex ? faq : item
            );
      const nextDetails = { ...details, faqs: nextFaqs };
      await saveProgramDetails(nextDetails);
      setDetails(nextDetails);
      setFaqDraft(null);
      setFaqEditingIndex(null);
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setFaqSavingIndex(null);
    }
  };

  const updateFaqDraft = (field: keyof ProgramFaq, value: string) =>
    setFaqDraft((current) => (current ? { ...current, [field]: value } : current));

  const deleteFaq = async (index: number) => {
    const nextDetails = {
      ...details,
      faqs: details.faqs.filter((_, faqIndex) => faqIndex !== index),
    };
    setFaqSavingIndex(index);
    setError("");
    try {
      await saveProgramDetails(nextDetails);
      setDetails(nextDetails);
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setFaqSavingIndex(null);
    }
  };

  const handleReviewImageChange = async (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Review image must be an image file.");
      return;
    }
    if (file.size > MAX_RAW_IMAGE_BYTES) {
      setError("Review image must be smaller than 10 MB.");
      return;
    }

    try {
      const image = await compressImageToDataUrl(file);
      updateReview(index, "image", image);
      setError("");
    } catch (imageError) {
      setError((imageError as Error).message);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("saving");
    setError("");

    try {
      await saveProgramDetails();
      setStatus("idle");
    } catch (saveError) {
      setStatus("error");
      setError((saveError as Error).message);
    }
  };

  return (
    <section className={styles.section}>
      <button type="button" className={styles.backButton} onClick={onBack}>
        ← Back to Programs
      </button>

      <div className={styles.header}>
        <p className={styles.eyebrow}>Program Details</p>
        <h1 className={styles.heading}>{program.name}</h1>
        <p className={styles.subheading}>
          Build the Overview, Curriculum, and Benefits sections for this program page.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.formSection}>
          <h2 className={styles.sectionHeading}>What you will learn?</h2>
          <label className={styles.label} htmlFor="program-overview">
            Overview
          </label>
          <textarea
            id="program-overview"
            className={styles.textarea}
            rows={9}
            value={details.overview}
            placeholder="Add the overview content shown in the Overview tab."
            onChange={(event) => updateDetails("overview", event.target.value)}
          />
        </section>

        <section className={styles.formSection}>
          <h2 className={styles.sectionHeading}>Curriculum</h2>
          <label className={styles.label} htmlFor="curriculum-heading">
            Section Heading
          </label>
          <input
            id="curriculum-heading"
            className={styles.input}
            value={details.curriculumHeading}
            placeholder="Complete Course Module"
            onChange={(event) =>
              updateDetails("curriculumHeading", event.target.value)
            }
          />

          <div className={styles.moduleHeader}>
            <h3>Course Modules</h3>
            <button type="button" className={styles.addButton} onClick={addModule}>
              + Add Module
            </button>
          </div>

          {details.curriculumModules.length === 0 && (
            <p className={styles.empty}>No modules added yet.</p>
          )}

          <div className={styles.modules}>
            {details.curriculumModules.map((module, index) => (
              <div className={styles.module} key={`module-${index}`}>
                <div className={styles.moduleTopline}>
                  <strong>Module {index + 1}</strong>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => removeModule(index)}
                  >
                    Delete Module
                  </button>
                </div>
                <label className={styles.label} htmlFor={`module-heading-${index}`}>
                  Module Heading
                </label>
                <input
                  id={`module-heading-${index}`}
                  className={styles.input}
                  value={module.heading}
                  placeholder="Module 1: Life Lab & Digital Foundation"
                  onChange={(event) =>
                    updateModule(index, "heading", event.target.value)
                  }
                />
                <label className={styles.label} htmlFor={`module-para-${index}`}>
                  Module Paragraph
                </label>
                <textarea
                  id={`module-para-${index}`}
                  className={styles.textarea}
                  rows={5}
                  value={module.para}
                  placeholder="Describe what students learn in this module."
                  onChange={(event) => updateModule(index, "para", event.target.value)}
                />
              </div>
            ))}
          </div>

        </section>

        <section className={styles.formSection}>
          <h2 className={styles.sectionHeading}>Benefits</h2>
          <div className={styles.moduleHeader}>
            <h3>Benefit Items</h3>
            <button type="button" className={styles.addButton} onClick={addBenefit}>
              + Add Benefit
            </button>
          </div>

          {details.benefitsItems.length === 0 && (
            <p className={styles.empty}>No benefits added yet.</p>
          )}

          <div className={styles.modules}>
            {details.benefitsItems.map((benefit, index) => (
              <div className={styles.module} key={`benefit-${index}`}>
                <div className={styles.moduleTopline}>
                  <strong>Benefit {index + 1}</strong>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => removeBenefit(index)}
                  >
                    Delete Benefit
                  </button>
                </div>
                <label className={styles.label} htmlFor={`benefit-heading-${index}`}>
                  Benefit Heading
                </label>
                <input
                  id={`benefit-heading-${index}`}
                  className={styles.input}
                  value={benefit.heading}
                  placeholder="SEO Specialist / SEO Executive"
                  onChange={(event) => updateBenefit(index, "heading", event.target.value)}
                />
                <label className={styles.label} htmlFor={`benefit-para-${index}`}>
                  Benefit Paragraph
                </label>
                <textarea
                  id={`benefit-para-${index}`}
                  className={styles.textarea}
                  rows={4}
                  value={benefit.para}
                  placeholder="Describe this benefit or career outcome."
                  onChange={(event) => updateBenefit(index, "para", event.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.formSection}>
          <h2 className={styles.sectionHeading}>Right Sidebar</h2>
          <label className={styles.label} htmlFor="intake-count">
            Intake Count
          </label>
          <input
            id="intake-count"
            className={styles.input}
            type="number"
            min="0"
            value={details.intakeCount}
            placeholder="30"
            onChange={(event) => updateDetails("intakeCount", event.target.value)}
          />

          <label className={styles.label} htmlFor="brochure-upload">
            Upload Brochure
          </label>
          <input
            id="brochure-upload"
            ref={brochureInputRef}
            className={styles.input}
            type="file"
            accept=".pdf,.doc,.docx"
            disabled={status === "saving"}
            onChange={(event) => handleBrochureChange(event.target.files?.[0])}
          />
          {details.brochureUrl && (
            <div className={styles.moduleTopline}>
              <p className={styles.uploaded}>Brochure selected and ready to save.</p>
              <button
                type="button"
                className={styles.deleteButton}
                disabled={status === "saving"}
                onClick={() => deleteSidebarUpload("brochureUrl")}
              >
                Delete Brochure
              </button>
            </div>
          )}

          <label className={styles.label} htmlFor="sidebar-media-upload">
            Sidebar Media
          </label>
          <input
            id="sidebar-media-upload"
            ref={sidebarMediaInputRef}
            className={styles.input}
            type="file"
            accept="image/*,video/*"
            disabled={status === "saving"}
            onChange={(event) => handleSidebarMediaChange(event.target.files?.[0])}
          />
          {details.sidebarMediaUrl && (
            <div className={styles.moduleTopline}>
              <p className={styles.uploaded}>Sidebar media selected and ready to save.</p>
              <button
                type="button"
                className={styles.deleteButton}
                disabled={status === "saving"}
                onClick={() => deleteSidebarUpload("sidebarMediaUrl")}
              >
                Delete Media
              </button>
            </div>
          )}

          <div className={styles.moduleHeader}>
            <h3>This Course Includes</h3>
            <button type="button" className={styles.addButton} onClick={addInclude}>
              + Add Item
            </button>
          </div>
          <div className={styles.modules}>
            {details.courseIncludes.map((item, index) => (
              <div className={styles.inlineRow} key={`include-${index}`}>
                <input
                  className={styles.input}
                  value={item}
                  placeholder="Certificate of completion"
                  onChange={(event) => updateInclude(index, event.target.value)}
                />
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => removeInclude(index)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          <div className={styles.moduleHeader}>
            <h3>Quick Questions</h3>
            <button type="button" className={styles.addButton} onClick={addQuestion}>
              + Add Question
            </button>
          </div>
          <div className={styles.modules}>
            {details.quickQuestions.map((question, index) => (
              <div className={styles.module} key={`question-${index}`}>
                <div className={styles.moduleTopline}>
                  <strong>Question {index + 1}</strong>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => removeQuestion(index)}
                  >
                    Delete Question
                  </button>
                </div>
                <label className={styles.label} htmlFor={`question-heading-${index}`}>
                  Question Heading
                </label>
                <input
                  id={`question-heading-${index}`}
                  className={styles.input}
                  value={question.heading}
                  placeholder="Do I need prior experience?"
                  onChange={(event) => updateQuestion(index, "heading", event.target.value)}
                />
                <label className={styles.label} htmlFor={`question-para-${index}`}>
                  Question Paragraph
                </label>
                <textarea
                  id={`question-para-${index}`}
                  className={styles.textarea}
                  rows={3}
                  value={question.para}
                  placeholder="Answer the question here."
                  onChange={(event) => updateQuestion(index, "para", event.target.value)}
                />
              </div>
            ))}
          </div>

        </section>

        <section className={styles.formSection}>
          <h2 className={styles.sectionHeading}>Career Outcomes</h2>
          <label className={styles.label} htmlFor="career-outcomes-para">
            Career Outcomes Paragraph
          </label>
          <textarea
            id="career-outcomes-para"
            className={styles.textarea}
            rows={6}
            value={details.careerOutcomesPara}
            placeholder="Describe the career outcomes students can expect from this program."
            onChange={(event) =>
              updateDetails("careerOutcomesPara", event.target.value)
            }
          />
          <p className={styles.helperText}>
            Choose the career logos to show on this program page.
          </p>
          <button
            type="button"
            className={styles.addButton}
            onClick={() => setCareerPickerOpen(true)}
          >
            Add Career Logo
          </button>
          <div className={styles.selectedLogos}>
            {details.careerOutcomesLogos.map((logo) => (
              <div className={styles.selectedLogo} key={logo}>
                <span>{logo}</span>
                <button type="button" className={styles.deleteButton} onClick={() => toggleCareerLogo(logo)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          {careerPickerOpen && (
            <div className={styles.logoPickerOverlay} onClick={() => setCareerPickerOpen(false)}>
              <div className={styles.logoPicker} onClick={(event) => event.stopPropagation()}>
                <div className={styles.moduleTopline}>
                  <h3>Career Logos</h3>
                  <button type="button" className={styles.deleteButton} onClick={() => setCareerPickerOpen(false)}>
                    Close
                  </button>
                </div>
                <div className={styles.logoPickerList}>
                  {careerLogos.map((logo) => {
                    const selected = details.careerOutcomesLogos.includes(logo);
                    return (
                      <button
                        type="button"
                        key={logo}
                        className={`${styles.logoPickerItem} ${selected ? styles.logoPickerItemSelected : ""}`}
                        onClick={() => toggleCareerLogo(logo)}
                      >
                        <span>{logo}</span>
                        <span>{selected ? "Selected" : "Add"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </section>

        <section className={styles.formSection}>

          <h2 className={styles.sectionHeading}>Reviews</h2>
          <div className={styles.moduleHeader}>
            <button type="button" className={styles.addButton} onClick={addReview}>
              Add Review
            </button>
          </div>
          <p className={styles.helperText}>
            Add student reviews to display below Career Outcomes on this program page.
          </p>
          <div className={styles.modules}>
            {details.reviews.map((review, index) => (
              <div className={styles.module} key={`review-${index}`}>
                <div className={styles.moduleTopline}>
                  <strong>Review {index + 1}</strong>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => removeReview(index)}
                  >
                    Delete Review
                  </button>
                </div>
                <label className={styles.label} htmlFor={`program-review-name-${index}`}>
                  Name
                </label>
                <input
                  id={`program-review-name-${index}`}
                  className={styles.input}
                  value={review.name}
                  placeholder="Student name"
                  onChange={(event) => updateReview(index, "name", event.target.value)}
                />
                <label className={styles.label} htmlFor={`program-review-text-${index}`}>
                  Review
                </label>
                <textarea
                  id={`program-review-text-${index}`}
                  className={styles.textarea}
                  rows={4}
                  value={review.review}
                  placeholder="What did the student say?"
                  onChange={(event) => updateReview(index, "review", event.target.value)}
                />
                <label className={styles.label} htmlFor={`program-review-image-${index}`}>
                  Image
                </label>
                <div className={styles.reviewImageField}>
                  {review.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={review.image} alt="" className={styles.reviewImagePreview} />
                  )}
                  <input
                    ref={(element) => { reviewFileRefs.current[index] = element; }}
                    id={`program-review-image-${index}`}
                    type="file"
                    accept="image/*"
                    className={styles.fileInput}
                    onChange={(event) => handleReviewImageChange(index, event)}
                  />
                  {review.image && (
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => {
                        updateReview(index, "image", "");
                        const input = reviewFileRefs.current[index];
                        if (input) input.value = "";
                      }}
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </section>

        <section className={styles.formSection}>

          <h2 className={styles.sectionHeading}>FAQ</h2>
          <div className={styles.moduleHeader}>
            <button type="button" className={styles.addButton} onClick={addFaq}>
              Add FAQ
            </button>
          </div>
          <p className={styles.helperText}>
            Add questions and answers to display below the student reviews on this program page.
          </p>
          {faqDraft && (
            <div className={styles.faqDraft}>
              <label className={styles.label} htmlFor="program-faq-draft-question">Question</label>
              <input
                id="program-faq-draft-question"
                className={styles.input}
                value={faqDraft.question}
                placeholder="Enter the question"
                onChange={(event) => updateFaqDraft("question", event.target.value)}
              />
              <label className={styles.label} htmlFor="program-faq-draft-answer">Answer</label>
              <textarea
                id="program-faq-draft-answer"
                className={styles.textarea}
                rows={4}
                value={faqDraft.answer}
                placeholder="Enter the answer"
                onChange={(event) => updateFaqDraft("answer", event.target.value)}
              />
              <div className={styles.faqActions}>
                <button type="button" className={styles.addButton} onClick={() => saveFaq(-1)}>
                  Save FAQ
                </button>
                <button type="button" className={styles.deleteButton} onClick={() => setFaqDraft(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          <div className={styles.faqTableWrap}>
            <table className={styles.faqTable}>
              <thead><tr><th>Question</th><th>Answer</th><th>Actions</th></tr></thead>
              <tbody>
                {details.faqs.map((faq, index) => (
                  <tr key={`program-faq-${index}`}>
                    <td>{faq.question || "-"}</td>
                    <td>{faq.answer || "-"}</td>
                    <td>
                      <div className={styles.faqActions}>
                        <button type="button" className={styles.addButton} onClick={() => { setFaqEditingIndex(index); setFaqDraft(faq); }}>
                          Update
                        </button>
                        <button type="button" className={styles.deleteButton} onClick={() => deleteFaq(index)} disabled={faqSavingIndex === index}>
                          {faqSavingIndex === index ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <button type="submit" className={styles.saveButton} disabled={status === "saving"}>
          {status === "saving" ? "Saving Details..." : "Save Program Details"}
        </button>
        {status === "error" && <p className={styles.error}>{error}</p>}
      </form>
    </section>
  );
}
