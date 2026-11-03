import SketchFrame from "./SketchFrame";
import styles from "./MissionVision.module.css";

function EyeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12C4 7 8 4.5 12 4.5S20 7 22 12C20 17 16 19.5 12 19.5S4 17 2 12Z"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.2" stroke="#ffffff" strokeWidth="1.8" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="#ffffff" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="5.5" stroke="#ffffff" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2" stroke="#ffffff" strokeWidth="1.8" />
      <path
        d="M21 3 12 12m0 0 1-3.8 2.8 2.8L12 12Z"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const cards = [
  {
    title: "Our Vision",
    text: "To be a leading global platform for skill-based learning, bridging the gap between academic knowledge and industry requirements by empowering learners to become confident, competent, and career-ready professionals. We envision creating a learning environment where every individual has access to quality education, practical training, and opportunities to discover and develop their potential. Through continuous innovation, industry collaborations, and modern teaching methods, we aim to shape a skilled workforce capable of adapting to changing technologies and evolving workplace demands. Our vision is to build a future where learning goes beyond traditional classrooms and every learner is equipped to achieve professional excellence, personal growth, and long-term career success.",
    icon: <EyeIcon />,
  },
  {
    title: "Our Mission",
    text: "To empower learners with practical, future-ready skills through accessible, industry-oriented, and impactful education. We aim to bridge the gap between education and employment by combining academic learning with hands-on experience, professional development, and real-world workplace exposure. We are committed to delivering high-quality training through experienced mentors, updated learning resources, practical projects, and industry-relevant programs. By encouraging creativity, critical thinking, communication, and problem-solving abilities, we help learners build confidence and become prepared for real professional challenges. Our mission is to support every learner throughout their career journey by providing the knowledge, skills, guidance, and opportunities needed to succeed in today's competitive job market.",
    icon: <TargetIcon />,
  },
];

export default function MissionVision() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <p className={styles.label}>Purpose &amp; Direction</p>
        <h2 className={styles.heading}>What Drives Us Forward</h2>
      </div>

      <div className={styles.panel}>
        <SketchFrame rx={24} />

        {cards.map((card, index) => (
          <div key={card.title} className={styles.column}>
            <span className={styles.iconCircle}>{card.icon}</span>
            <h3 className={styles.title}>{card.title}</h3>
            <p className={styles.text}>{card.text}</p>
            {index === 0 && <span className={styles.divider}></span>}
          </div>
        ))}
      </div>
    </section>
  );
}
