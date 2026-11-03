import styles from "./WhyUs.module.css";

export default function ProfessionalSkillCampusIntro() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <h2 className={styles.heading}>What is Professional Skill Campus?</h2>
        </div>

        <div className={styles.right}>
          <p className={styles.paragraph}>
            Professional Skill Campus is a renowned skill-based learning hub in
            Kochi, Kerala, that helps students and professionals develop
            real-world skills and jobs. We equip learners to succeed in today&apos;s
            competitive labor market by providing expert guidance, hands-on
            training, and industry-aligned programs.
          </p>

          <p className={styles.paragraph}>
            Professional Skill Campus takes learning beyond textbooks. We
            prioritize hands-on skill development, career readiness, and
            personal improvement, making us one of Kerala&apos;s most reputable
            skill development academies.
          </p>

          <p className={styles.paragraph}>
            These collaborations ensure that our students are equipped with the
            latest tools, technology, and techniques used in real-world
            professional settings.
          </p>
        </div>
      </div>
    </section>
  );
}
