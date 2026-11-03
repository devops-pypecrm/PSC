import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import PageBackground from "../../components/PageBackground";
import getClientPromise from "../../../lib/mongodb";
import {
  blogSlug,
  formatBlogDate,
  type BlogItem,
} from "../../lib/blogUtils";
import { getSiteUrl } from "../../lib/getSiteUrl";
import pageStyles from "../../page.module.css";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function toBlogItem(doc: Record<string, unknown>): BlogItem {
  return {
    _id: String(doc._id),
    topic: String(doc.topic ?? ""),
    subject: String(doc.subject ?? ""),
    uploadedDate: String(doc.uploadedDate ?? ""),
    sectionPara: String(doc.sectionPara ?? ""),
    image: String(doc.image ?? ""),
    sections: Array.isArray(doc.sections)
      ? (doc.sections as BlogItem["sections"])
      : [],
    gallery: Array.isArray(doc.gallery) ? (doc.gallery as string[]) : [],
    createdAt: (doc.createdAt as Date | undefined)?.toISOString?.() ?? "",
  };
}

async function loadBlogs(): Promise<BlogItem[]> {
  try {
    const client = await getClientPromise();
    const docs = await client
      .db("psc")
      .collection("blogs")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map(toBlogItem);
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
  const blogs = await loadBlogs();
  const blog = blogs.find((b) => blogSlug(b.subject) === slug);
  const name = blog?.subject ?? titleFromSlug(slug);

  const title = `${name} | Blog`;
  const description = blog?.sectionPara?.substring(0, 150) || `Read ${name} on the Professional Skill Campus blog.`;
  const image = blog?.image || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `/blogs/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/blogs/${slug}`,
      type: "article",
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

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blogs = await loadBlogs();
  const blog = blogs.find((b) => blogSlug(b.subject) === slug) ?? null;
  const name = blog?.subject ?? titleFromSlug(slug);
  const sections = (blog?.sections ?? []).filter(
    (s) => s.heading.trim() || s.paragraph.trim()
  );
  const gallery = blog?.gallery ?? [];

  // "More Blogs" = the 5 blogs that come after this one in the same order
  // shown on /blogs (newest first). If fewer than 5 remain after it, wrap
  // around from the start so the sidebar still shows 5 when there are
  // enough blogs overall.
  const currentIndex = blog ? blogs.findIndex((b) => b._id === blog._id) : -1;
  const moreBlogs: BlogItem[] = [];
  if (currentIndex !== -1) {
    for (let i = 1; i <= blogs.length - 1 && moreBlogs.length < 5; i++) {
      moreBlogs.push(blogs[(currentIndex + i) % blogs.length]);
    }
  }

  const siteUrl = getSiteUrl();
  const providerUrl = siteUrl || "https://professionalskillcampus.vercel.app";
  const publishedDate = blog?.uploadedDate
    ? new Date(blog.uploadedDate)
    : null;
  const validPublishedDate = publishedDate && !Number.isNaN(publishedDate.getTime())
    ? publishedDate.toISOString()
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": name,
    "description": blog?.sectionPara || name,
    "image": blog?.image || "",
    ...(validPublishedDate ? { "datePublished": validPublishedDate } : {}),
    "url": `${providerUrl}/blogs/${slug}`,
    "mainEntityOfPage": `${providerUrl}/blogs/${slug}`,
    "author": {
      "@type": "Organization",
      "name": "Professional Skill Campus",
      "url": providerUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": "Professional Skill Campus",
      "logo": {
        "@type": "ImageObject",
        "url": `${providerUrl}/logo-main.png`
      }
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
              {blog?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={blog.image} alt={name} className={styles.image} />
              ) : (
                <span className={styles.imagePlaceholder}>No image</span>
              )}
              {blog?.topic && (
                <span className={styles.badge}>{blog.topic}</span>
              )}
              {blog?.uploadedDate && (
                <span className={styles.dateBadge}>
                  {formatBlogDate(blog.uploadedDate)}
                </span>
              )}
            </div>

            <aside className={styles.sidebar}>
              <h2 className={styles.sidebarHeading}>More Blogs</h2>
              {moreBlogs.length === 0 ? (
                <p className={styles.sidebarEmpty}>No other blogs yet.</p>
              ) : (
                <ul className={styles.sidebarList}>
                  {moreBlogs.map((b) => {
                    const href = `/blogs/${blogSlug(b.subject)}`;
                    return (
                      <li key={b._id} className={styles.sidebarItem}>
                        <Link href={href} className={styles.sidebarLink}>
                          {b.subject}
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

          {blog?.sectionPara && (
            <p className={styles.intro}>{blog.sectionPara}</p>
          )}

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
