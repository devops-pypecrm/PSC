import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import ProfessionalSkillCampusIntro from "./components/ProfessionalSkillCampusIntro";
import MissionVision from "./components/MissionVision";
import SuccessStories from "./components/SuccessStories";
import AboutUs from "./components/AboutUs";
import WhyUs from "./components/WhyUs";
import Reviews from "./components/Reviews";
import Directors from "./components/Directors";
import SuccessStoriesGallery from "./components/SuccessStoriesGallery";
import Certifications from "./components/Certifications";
import SkillCreators from "./components/SkillCreators";
import Courses from "./components/Courses";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import PageBackground from "./components/PageBackground";
import { Metadata } from "next";
import { getSiteUrl } from "./lib/getSiteUrl";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Expert IT & Business Training Courses | Professional Skill Campus",
  description: "Accelerate your career with our industry-recognized courses in AI, Accounting, Digital Marketing, and Hospital Management. Get certified and hired today.",
  keywords: ["IT Training", "Business Training", "Digital Marketing Course", "Accounting Course", "Hospital Management Course", "Kerala", "Professional Skill Campus", "PSC"],
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const siteUrl = getSiteUrl();
  const providerUrl = siteUrl || "https://professionalskillcampus.vercel.app";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": "Professional Skill Campus",
      "url": providerUrl,
      "logo": `${providerUrl}/logo-main.png`,
      "description": "Expert training in IT and Business sectors.",
      "telephone": "+91 99465 56002",
      "email": "professionalskillcampus@gmail.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Thazhepalam",
        "addressLocality": "Tirur",
        "addressRegion": "Kerala",
        "postalCode": "676101",
        "addressCountry": "IN"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+91 99465 56002",
        "contactType": "customer service",
        "email": "professionalskillcampus@gmail.com"
      },
      "sameAs": [
        "https://x.com/proskillcampus",
        "https://www.facebook.com/professionalskillcampus/?rdid=Pk7ZLW94ZB8r6Gvu",
        "https://www.instagram.com/professionalskillcampus?stkn=MmlsNWF1ZnhmbnVy",
        "https://www.youtube.com/@professionalskillcampus"
      ]
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <div className={styles.pageContent}>
        <PageBackground />
        <Hero />
        <Marquee />
        <ProfessionalSkillCampusIntro />
        <MissionVision />
        <Courses />
        <AboutUs />
        <Certifications />
        <SkillCreators />
        <Directors />
        <WhyUs />
        <SuccessStories />
        <SuccessStoriesGallery />
        <Reviews />
        <FAQ />
      </div>
      <Footer />
    </>
  );
}
