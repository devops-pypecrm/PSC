import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "psc_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

const getSecret = () =>
  process.env.ADMIN_SESSION_SECRET || "psc-admin-session-secret-change-me";

export const getAdminPassword = () => process.env.ADMIN_PASSWORD || "mypsc";

export function createAdminSession(): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `admin:${expiresAt}`;
  const signature = createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

export function isValidAdminSession(value: string | undefined): boolean {
  if (!value) return false;

  const [payload, signature] = value.split(".");
  const [role, expiresAtValue] = payload?.split(":") || [];
  const expiresAt = Number(expiresAtValue);
  if (role !== "admin" || !signature || !Number.isFinite(expiresAt)) return false;
  if (expiresAt < Math.floor(Date.now() / 1000)) return false;

  const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");
  const actualBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function isAdminApiPath(pathname: string): boolean {
  return (
    pathname === "/api/programs" ||
    pathname.startsWith("/api/programs/") ||
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/api/blogs") ||
    pathname.startsWith("/api/career") ||
    pathname.startsWith("/api/certifications") ||
    pathname.startsWith("/api/contacts") ||
    pathname.startsWith("/api/directors") ||
    pathname.startsWith("/api/events") ||
    pathname.startsWith("/api/faqs") ||
    pathname.startsWith("/api/hero") ||
    pathname.startsWith("/api/notifications") ||
    pathname.startsWith("/api/page-notifications") ||
    pathname.startsWith("/api/reviews") ||
    pathname.startsWith("/api/skill-creators") ||
    pathname.startsWith("/api/success-categories") ||
    pathname.startsWith("/api/success-videos") ||
    pathname.startsWith("/api/enquiries/")
  );
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
