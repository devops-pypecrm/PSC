import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import PageBackground from "../components/PageBackground";
import styles from "../students-login/page.module.css";

export const metadata: Metadata = {
  title: "Faculty Login | Professional Skill Campus",
  description: "Sign in to your Professional Skill Campus faculty account.",
  alternates: {
    canonical: "/faculty-login",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function FacultyLoginPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <PageBackground />
        <section className={styles.loginSection} aria-labelledby="faculty-login-heading">
          <div className={styles.inspiration}>
            <h1 className={styles.quote}>
              &ldquo;Your unfinished chapter is still part of your story. Keep going.&rdquo;
            </h1>
            <p className={styles.quoteNote}>Your next step starts here.</p>
          </div>

          <div className={styles.card}>
            <p className={styles.cardEyebrow}>Faculty Portal</p>
            <h2 id="faculty-login-heading" className={styles.heading}>
              Faculty Login
            </h2>
            <p className={styles.subheading}>
              Enter your details to access your faculty account.
            </p>

            <form className={styles.form}>
              <label className={styles.label} htmlFor="faculty-username">
                Faculty Email / Username
              </label>
              <input
                id="faculty-username"
                name="username"
                type="text"
                className={styles.input}
                placeholder="Enter your email or username"
                autoComplete="username"
              />

              <label className={styles.label} htmlFor="faculty-password">
                Password
              </label>
              <input
                id="faculty-password"
                name="password"
                type="password"
                className={styles.input}
                placeholder="Enter your password"
                autoComplete="current-password"
              />

              <button className={styles.button} type="button">
                Login
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
