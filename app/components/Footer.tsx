import Image from "next/image";
import styles from "./Footer.module.css";

const courseLinks = [
  "Gamified AI Integrated Digital Marketing",
  "Business Administration & Hospital Management",
  "AI integrated Accounting & Taxation",
  "Professional Diploma in Training and Development",
];

const importantLinks = [
  { label: "About", href: "/about-psc" },
  { label: "Events", href: "/events" },
  { label: "Courses", href: "/#courses" },
  { label: "Blogs", href: "/blogs" },
  { label: "Success Stories", href: "/success-stories" },
  { label: "Contact Us", href: "/contact" },
  { label: "Refer & Earn", href: "/refer-and-earn" },
];

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M4 2L8 6L4 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandCol}>
          <a href="/" className={styles.logo}>
            <Image
              src="/logo-main.png"
              alt="Professional Skill Campus"
              width={160}
              height={54}
            />
          </a>
          <p className={styles.tagline}>
            Professional Skill Campus blends real-world learning with
            practical skills, shaping confident professionals for tomorrow!
          </p>
          <div className={styles.social}>
            <a href="https://x.com/proskillcampus" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="X">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.4l-5-6.5L6.1 22H3l7.3-8.4L2.8 2h6.5l4.5 6 5.1-6Zm-1.1 17.8h1.7L8.3 4H6.5l11.3 15.8Z" />
              </svg>
            </a>
            <a href="https://www.facebook.com/professionalskillcampus/?rdid=Pk7ZLW94ZB8r6Gvu" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Facebook">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13.5 22V12.9h3.1l.5-3.6h-3.6V7.1c0-1 .3-1.8 1.8-1.8h1.9V2.1C16.9 2 15.8 2 14.5 2c-2.7 0-4.6 1.7-4.6 4.7v2.6H6.8v3.6h3.1V22h3.6Z" />
              </svg>
            </a>
            <a href="https://www.instagram.com/professionalskillcampus?stkn=MmlsNWF1ZnhmbnVy" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href="https://www.youtube.com/@professionalskillcampus" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="YouTube">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22 8.5s-.2-1.6-.9-2.3c-.8-.9-1.8-.9-2.2-1C15.9 5 12 5 12 5s-3.9 0-6.9.2c-.4.1-1.4.1-2.2 1-.7.7-.9 2.3-.9 2.3S1.8 10.3 1.8 12v1.9c0 1.7.2 3.5.2 3.5s.2 1.6.9 2.3c.8.9 1.9.9 2.4 1 1.7.2 7.2.2 7.2.2s3.9 0 6.9-.2c.4-.1 1.4-.1 2.2-1 .7-.7.9-2.3.9-2.3s.2-1.7.2-3.5V12c0-1.7-.2-3.5-.2-3.5ZM9.9 15.3V8.6l6 3.4-6 3.3Z" />
              </svg>
            </a>
          </div>
        </div>

        <div className={styles.linkCol}>
          <h3 className={styles.heading}>Courses</h3>
          <span className={styles.underline}></span>
          <ul className={styles.list}>
            {courseLinks.map((label) => {
              const href = label.includes("Digital Marketing")
                ? "/courses/ai-integrated-digital-marketing"
                : label.includes("Business Administration")
                ? "/courses/business-administration-hospital-management"
                : label.includes("Accounting")
                ? "/courses/ai-integrated-accounting-taxation"
                : "/contact";
              return (
              <li key={label}>
                <a href={href} className={styles.link}>
                  <ChevronIcon />
                  <span>{label}</span>
                </a>
              </li>
              );
            })}
          </ul>
        </div>

        <div className={styles.linkCol}>
          <h3 className={styles.heading}>Important Links</h3>
          <span className={styles.underline}></span>
          <ul className={styles.list}>
            {importantLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className={styles.link}>
                  <ChevronIcon />
                  <span>{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.linkCol}>
          <h3 className={styles.heading}>Contact Us</h3>
          <span className={styles.underline}></span>
          <ul className={styles.contactList}>
            <li>
              <a href="tel:+919946556002" className={styles.contactLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M4 5c0-1 .8-2 1.8-2h2.4c.5 0 1 .3 1.1.8l1 3.3c.1.4 0 .9-.3 1.2l-1.6 1.6a12 12 0 0 0 5.7 5.7l1.6-1.6c.3-.3.8-.4 1.2-.3l3.3 1c.5.1.8.6.8 1.1v2.4c0 1-.9 1.8-1.9 1.8C10.7 20 4 13.3 4 5Z" />
                </svg>
                <span>+91 99465 56002</span>
              </a>
            </li>
            <li>
              <a href="https://wa.me/919946556002" target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.4 14.1c-.2.6-1.3 1.2-1.8 1.3-.5.1-1 .1-3.3-.7-2.7-1-4.5-3.8-4.6-4-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 1-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6c-.1.2-.2.3-.1.6.2.3.9 1.4 1.9 2.3 1.3 1.1 2.3 1.5 2.6 1.6.3.1.5.1.6-.1l.6-.8c.2-.3.4-.2.6-.1l1.9.9c.2.1.4.2.4.4 0 .2 0 .9-.2 1.5Z" />
                </svg>
                <span>+91 99465 56002</span>
              </a>
            </li>
            <li>
              <a href="mailto:professionalskillcampus@gmail.com" className={styles.contactLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
                  <path d="M3.5 6L12 13L20.5 6" />
                </svg>
                <span>professionalskillcampus@gmail.com</span>
              </a>
            </li>
            <li>
              <span className={styles.contactLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                <span>Thazhepalam, Tirur, Kerala<br />676101</span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <p>
          © {new Date().getFullYear()} Professional Skill Campus. All rights reserved.
        </p>
        <div className={styles.legalLinks}>
          <a href="/privacy-policy" className={styles.legalLink}>Privacy Policy</a>
          <a href="/terms-and-conditions" className={styles.legalLink}>Terms &amp; Conditions</a>
        </div>
      </div>
    </footer>
  );
}
