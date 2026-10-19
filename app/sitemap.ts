import { MetadataRoute } from 'next';
import getClientPromise from '../lib/mongodb';
import { blogSlug } from './lib/blogUtils';
import { eventSlug } from './lib/eventUtils';
import { programSlug } from './lib/programUtils';
import { getSiteUrl } from './lib/getSiteUrl';

const DB_NAME = 'psc';

// Revalidate once every hour (3600s) instead of hitting MongoDB on every request.
// If you strictly need real-time generation, you can keep: export const dynamic = 'force-dynamic';
export const revalidate = 3600;

// Helper to safely parse dates and prevent Next.js XML serialization RangeError
function toValidDate(value?: unknown, fallback: Date = new Date()): Date {
  if (!value) return fallback;
  const date = new Date(value as string | number | Date);
  return isNaN(date.getTime()) ? fallback : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Ensure absolute URL without a trailing slash
  const rawSiteUrl = getSiteUrl() || process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';
  const siteUrl = rawSiteUrl.replace(/\/+$/, '');

  // Use a Map to automatically prevent duplicate URLs
  const urlMap = new Map<string, MetadataRoute.Sitemap[number]>();

  // Helper to add or update routes
  const addUrl = (entry: MetadataRoute.Sitemap[number]) => {
    urlMap.set(entry.url, entry);
  };

  // 1. Static Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/about-psc`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/contact`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/blogs`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/events`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/gallery`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/notification`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${siteUrl}/success-stories`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/refer-and-earn`, changeFrequency: 'monthly', priority: 0.6 },
    // If these courses are also in your MongoDB `programs` collection,
    // remove them from here to avoid duplicate entries:
    { url: `${siteUrl}/courses/ai-integrated-accounting-taxation`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/courses/ai-integrated-digital-marketing`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/courses/business-administration-hospital-management`, changeFrequency: 'weekly', priority: 0.8 },
  ];

  staticRoutes.forEach(addUrl);

  try {
    const client = await getClientPromise();
    const db = client.db(DB_NAME);

    // 2. Fetch in parallel using Promise.all & use projections to only fetch required fields
    const [programs, blogs, events] = await Promise.all([
      db
        .collection('programs')
        .find(
          { name: { $exists: true, $ne: '' } },
          { projection: { name: 1, slug: 1, updatedAt: 1, createdAt: 1 } }
        )
        .toArray(),

      db
        .collection('blogs')
        .find(
          { subject: { $exists: true, $ne: '' } }, // filter out drafts if you have a status field: { isPublished: true }
          { projection: { subject: 1, slug: 1, updatedAt: 1, createdAt: 1 } }
        )
        .toArray(),

      db
        .collection('events')
        .find(
          { eventName: { $exists: true, $ne: '' } },
          { projection: { eventName: 1, slug: 1, updatedAt: 1, createdAt: 1 } }
        )
        .toArray(),
    ]);

    // 3. Process Programs
    for (const program of programs) {
      const slug = program.slug || programSlug(String(program.name));
      addUrl({
        url: `${siteUrl}/courses/${encodeURIComponent(slug).replace(/%2F/g, '/')}`,
        lastModified: toValidDate(program.updatedAt || program.createdAt),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    // 4. Process Blogs
    for (const blog of blogs) {
      const slug = blog.slug || blogSlug(String(blog.subject));
      addUrl({
        url: `${siteUrl}/blogs/${encodeURIComponent(slug).replace(/%2F/g, '/')}`,
        lastModified: toValidDate(blog.updatedAt || blog.createdAt),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }

    // 5. Process Events
    for (const event of events) {
      const slug = event.slug || eventSlug(String(event.eventName));
      addUrl({
        url: `${siteUrl}/events/${encodeURIComponent(slug).replace(/%2F/g, '/')}`,
        lastModified: toValidDate(event.updatedAt || event.createdAt),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  } catch (error) {
    console.error('Error generating sitemap dynamic routes:', error);
    // Returns whatever static routes we have if database fails
  }

  return Array.from(urlMap.values());
}