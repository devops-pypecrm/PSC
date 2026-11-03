import Navbar from "../../components/Navbar";
import CourseHero from "../../components/CourseHero";
import BusinessCurriculum from "../../components/BusinessCurriculum";
import WhyChooseBusiness from "../../components/WhyChooseBusiness";
import CourseTestimonials from "../../components/CourseTestimonials";
import ProgramFaqSection from "../../components/ProgramFaqSection";
import CourseCTA from "../../components/CourseCTA";
import Footer from "../../components/Footer";
import PageBackground from "../../components/PageBackground";
import styles from "../../page.module.css";

import { getSiteUrl } from "../../lib/getSiteUrl";
import { Metadata } from "next";

const features = [
  {
    title: "Dual Expertise",
    subtitle: "Business & healthcare administration",
  },
  {
    title: "Get Certified",
    subtitle: "Certification from Professional Skill Campus",
  },
  { title: "Get Placed", subtitle: "Placement & internship support" },
];

const details = [
  { label: "Duration", value: "6 Months" },
  { label: "Mode", value: "Offline & Online" },
  { label: "Intake", value: "40" },
];

export const metadata: Metadata = {
  title: "Business Administration & Hospital Management Course | Professional Skill Campus",
  description: "Master modern business concepts and healthcare administration with Professional Skill Campus. Get certified and placement-ready.",
  alternates: {
    canonical: "/courses/business-administration-hospital-management",
  },
  openGraph: {
    title: "Business Administration & Hospital Management Course | Professional Skill Campus",
    description: "Master modern business concepts and healthcare administration with Professional Skill Campus. Get certified and placement-ready.",
    url: "/courses/business-administration-hospital-management",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Business Administration & Hospital Management Course | Professional Skill Campus",
    description: "Master modern business concepts and healthcare administration with Professional Skill Campus. Get certified and placement-ready.",
  },
};

export default function BusinessAdministrationHospitalManagement() {
  const siteUrl = getSiteUrl();
  const providerUrl = siteUrl || "https://professionalskillcampus.vercel.app";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Business Administration & Hospital Management",
    "description": "Master modern business concepts and healthcare administration with Professional Skill Campus.",
    "provider": {
      "@type": "Organization",
      "name": "Professional Skill Campus",
      "url": providerUrl
    },
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "blended",
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
      <div className={styles.pageContent}>
        <PageBackground />
        <CourseHero
          badge="Online & Offline Course · Business & Hospital Management"
          heading="Business Administration &"
          headingAccent="Hospital Management"
          subheading="Master modern business concepts and healthcare administration with Professional Skill Campus — dual expertise, real-world training, career-ready skills."
          features={features}
          details={details}
        />
        <BusinessCurriculum />
        <WhyChooseBusiness />
        <CourseTestimonials programName="Business Administration & Hospital Management" />
        <ProgramFaqSection
          programName="Business Administration & Hospital Management"
          splitIntoColumns
        />
        <CourseCTA
          programName="Business Administration & Hospital Management"
          category="Online & Offline"
        />
      </div>
      <Footer />
    </>
  );
}
