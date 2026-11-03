import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import PageBackground from "../../components/PageBackground";
import getClientPromise from "../../../lib/mongodb";
import { eventSlug, type EventItem } from "../../lib/eventUtils";
import { getSiteUrl } from "../../lib/getSiteUrl";
import pageStyles from "../../page.module.css";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function toEventItem(doc: Record<string, unknown>): EventItem {
  return {
    _id: String(doc._id),
    eventCategory: String(doc.eventCategory ?? ""),
    eventName: String(doc.eventName ?? ""),
    image: String(doc.image ?? ""),
    sections: Array.isArray(doc.sections)
      ? (doc.sections as EventItem["sections"])
      : [],
    gallery: Array.isArray(doc.gallery) ? (doc.gallery as string[]) : [],
    createdAt:
      (doc.createdAt as Date | undefined)?.toISOString?.() ?? "",
  };
}

async function loadEvents(): Promise<EventItem[]> {
  try {
    const client = await getClientPromise();
    const docs = await client
      .db("psc")
      .collection("events")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map(toEventItem);
  } catch {
    // If the DB is unreachable, fall back to an empty list rather than
    // showing an error page.
    return [];
  }
}

const titleFromSlug = (slug: string) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const events = await loadEvents();
  const event = events.find((e) => eventSlug(e.eventName) === slug);
  const name = event?.eventName ?? titleFromSlug(slug);

  const title = `${name} | Events`;
  const description = event?.sections?.[0]?.paragraph?.substring(0, 150) || `Check out ${name} at Professional Skill Campus. View event details and gallery.`;
  const image = event?.image || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `/events/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/events/${slug}`,
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const events = await loadEvents();
  const event = events.find((e) => eventSlug(e.eventName) === slug) ?? null;
  const name = event?.eventName ?? titleFromSlug(slug);
  const sections = (event?.sections ?? []).filter(
    (s) => s.heading.trim() || s.paragraph.trim()
  );
  const gallery = event?.gallery ?? [];

  // "More Events" = the 5 events that come after this one in the same
  // order shown on /events (newest first). If fewer than 5 remain after
  // it, wrap around from the start so the sidebar still shows 5 when
  // there are enough events overall.
  const currentIndex = event ? events.findIndex((e) => e._id === event._id) : -1;
  const moreEvents: EventItem[] = [];
  if (currentIndex !== -1) {
    for (let i = 1; i <= events.length - 1 && moreEvents.length < 5; i++) {
      moreEvents.push(events[(currentIndex + i) % events.length]);
    }
  }

  const siteUrl = getSiteUrl();
  const providerUrl = siteUrl || "https://professionalskillcampus.vercel.app";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": name,
    "description": sections[0]?.paragraph || name,
    ...(event?.image ? { "image": event.image } : {}),
    "location": {
      "@type": "Place",
      "name": "Professional Skill Campus",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Tirur",
        "addressRegion": "Kerala",
        "postalCode": "676101",
        "addressCountry": "IN"
      }
    },
    "organizer": {
      "@type": "Organization",
      "name": "Professional Skill Campus",
      "url": providerUrl
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <div className={pageStyles.pageContent}>
        <PageBackground />

        <div className={styles.page}>
          <h1 className={styles.heading}>{name}</h1>

          <div className={styles.topRow}>
            <div className={styles.imageBox}>
              {event?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.image} alt={name} className={styles.image} />
              ) : (
                <span className={styles.imagePlaceholder}>No image</span>
              )}
              {event?.eventCategory && (
                <span className={styles.badge}>{event.eventCategory}</span>
              )}
            </div>

            <aside className={styles.sidebar}>
              <h2 className={styles.sidebarHeading}>More Events</h2>
              {moreEvents.length === 0 ? (
                <p className={styles.sidebarEmpty}>No other events yet.</p>
              ) : (
                <ul className={styles.sidebarList}>
                  {moreEvents.map((e) => {
                    const href = `/events/${eventSlug(e.eventName)}`;
                    return (
                      <li key={e._id} className={styles.sidebarItem}>
                        <Link href={href} className={styles.sidebarLink}>
                          {e.eventName}
                        </Link>
                        <Link href={href} className={styles.sidebarReadMore}>
                          Read More »
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>
          </div>

          {sections.length > 0 && (
            <div className={styles.contentSections}>
              {sections.map((s, i) => (
                <div className={styles.contentSection} key={i}>
                  {s.heading && (
                    <h2 className={styles.sectionHeading}>{s.heading}</h2>
                  )}
                  {s.paragraph && (
                    <p className={styles.sectionParagraph}>{s.paragraph}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {gallery.length > 0 && (
            <div className={styles.gallerySection}>
              <h2 className={styles.galleryHeading}>Our Gallery</h2>
              <div className={styles.galleryGrid}>
                {gallery.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={`${name} gallery ${i + 1}`}
                    className={styles.galleryImage}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
