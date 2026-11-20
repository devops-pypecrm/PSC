import Image from "next/image";
import styles from "./AppDownload.module.css";

function GooglePlayIcon() {
  return (
    <svg
      className={styles.playIcon}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Google Play"
    >
      <path d="M4.6 3.5c-.7.4-1.1 1.2-1.1 2.2v36.6c0 1 .4 1.8 1.1 2.2L26.8 24 4.6 3.5Z" fill="#00D7FE" />
      <path d="M4.6 3.5 31.7 17.4 24 24 4.6 3.5Z" fill="#00F076" />
      <path d="m31.7 17.4 12 6.1a.6.6 0 0 1 0 1.1l-12 6.1L24 24l7.7-6.6Z" fill="#FFCA00" />
      <path d="M4.6 44.5 31.7 30.6 24 24 4.6 44.5Z" fill="#FF3A44" />
    </svg>
  );
}

function GooglePlayBadge({ playStoreUrl }: { playStoreUrl: string }) {
  const badgeContent = (
    <>
      <GooglePlayIcon />
      <span className={styles.badgeText}>
        <span className={styles.badgeEyebrow}>GET IT ON</span>
        <span className={styles.badgeStore}>Google Play</span>
      </span>
    </>
  );

  return (
    <a
      className={styles.badge}
      href={playStoreUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Get the PSC app on Google Play"
    >
      {badgeContent}
    </a>
  );
}

export default function AppDownload({
  playStoreUrl,
}: {
  playStoreUrl: string;
}) {
  return (
    <section className={styles.section} aria-labelledby="app-download-heading">
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>Learning that moves with you</p>
          <h2 className={styles.heading} id="app-download-heading">
            Get the PSC App
          </h2>
          <p className={styles.description}>
            Take your learning experience to the next level with the
            Professional Skill Campus mobile app. Access learning resources,
            explore skill development programs, and stay connected with your
            learning journey anytime, anywhere.
          </p>
          <GooglePlayBadge playStoreUrl={playStoreUrl} />
        </div>

        <div className={styles.imageWrap}>
          <div className={styles.phoneFrame}>
            <Image
              className={styles.appImage}
              src="/psc-mobile-app.jpg"
              alt="Professional Skill Campus mobile app"
              width={716}
              height={1599}
              sizes="(max-width: 720px) 208px, 284px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
