import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageBackground from "../components/PageBackground";
import styles from "../components/LegalPage.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Professional Skill Campus.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <div className={styles.pageContent}>
        <PageBackground />
        <main className={styles.page}>
          <div className={styles.container}>
            <p className={styles.eyebrow}>Privacy Policy</p>
            <h1 className={styles.heading}>Privacy Policy</h1>
            <p className={styles.notice}>Privacy Policy will be updated shortly.</p>
            <p className={styles.text}>
              PROFESSIONAL SKILL CAMPUS is committed to protecting your privacy. This Privacy
              Policy explains how we collect, use, and share your personal information.
            </p>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
