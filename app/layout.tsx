import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ConnectModal from "./components/ConnectModal";
import WhatsAppButton from "./components/WhatsAppButton";
import { getSiteUrl } from "./lib/getSiteUrl";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: "Professional Skill Campus | Expert Training & Courses",
    template: "%s | Professional Skill Campus",
  },
  description: "Professional Skill Campus offers expert training, courses, and certifications in business, technology, and management to accelerate your career.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Professional Skill Campus | Expert Training & Courses",
    description: "Professional Skill Campus offers expert training, courses, and certifications in business, technology, and management to accelerate your career.",
    url: siteUrl || "/",
    siteName: "Professional Skill Campus",
    images: [
      {
        url: "/logo-main.png",
        width: 1200,
        height: 630,
        alt: "Professional Skill Campus Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Professional Skill Campus | Expert Training & Courses",
    description: "Professional Skill Campus offers expert training, courses, and certifications in business, technology, and management to accelerate your career.",
    images: ["/logo-main.png"],
  },
  icons: {
    icon: "/favcon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        {children}
        <ConnectModal />
        <WhatsAppButton />
      </body>
    </html>
  );
}
