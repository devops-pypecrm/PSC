"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./Navbar.module.css";
import {
  usePrograms,
  programSlug,
  type Program,
  type ProgramGroup,
} from "../hooks/usePrograms";

const navLinksBeforeLogin = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about-psc" },
  { label: "Events", href: "/events" },
  { label: "Our Gallery", href: "/gallery" },
];

const navLinksAfterLogin = [
  { label: "Blogs", href: "/blogs" },
  { label: "Contact us", href: "/contact" },
];

const STUDENTS_LOGIN_URL = "/students-login";
const FACULTY_LOGIN_URL = "/faculty-login";

function LoginDropdown({ onSelect }: { onSelect: () => void }) {
  return (
    <ul className={styles.loginDropdown} role="menu" aria-label="Login options">
      <li role="none">
        <Link
          href={STUDENTS_LOGIN_URL}
          className={styles.loginDropdownLink}
          role="menuitem"
          onClick={onSelect}
        >
          Student
        </Link>
      </li>
      <li role="none">
        <Link
          href={FACULTY_LOGIN_URL}
          className={styles.loginDropdownLink}
          role="menuitem"
          onClick={onSelect}
        >
          Faculty
        </Link>
      </li>
    </ul>
  );
}

function ChevronDown({ className }: { className?: string } = {}) {
  return (
    <svg
      className={className ?? styles.chevron}
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 1L5 5L9 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="none" aria-hidden="true">
      <path
        d="M1.5 1L6.5 6L1.5 11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CoursesDropdown({ groups }: { groups: ProgramGroup[] }) {
  return (
    <ul className={styles.dropdown}>
      {groups.map((group) => (
        <li key={group.label} className={styles.dropdownItem}>
          <span>{group.label}</span>
          <ChevronRight />

          <ul className={styles.submenu}>
            {group.programs.length === 0 && (
              <li>
                <span className={styles.submenuLink}>Coming soon</span>
              </li>
            )}
            {group.programs.map((program) => (
              <li key={program._id}>
                <a
                  href={`/courses/${programSlug(program.name)}`}
                  className={styles.submenuLink}
                >
                  {program.name}
                </a>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

export default function Navbar({ initialPrograms }: { initialPrograms?: Program[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileProgramsOpen, setMobileProgramsOpen] = useState(false);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const { groups: programGroups, reload: reloadPrograms } = usePrograms(
    initialPrograms,
    false,
    true
  );
  const pathname = usePathname();
  const router = useRouter();
  const logoClickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-login-menu]")
      ) {
        return;
      }
      setLoginMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLoginMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const isActive = (href: string) => href !== "#" && pathname === href;
  const linkClass = (href: string) =>
    `${styles.navLink} ${isActive(href) ? styles.navLinkActive : ""}`;
  const loadPrograms = () => {
    void reloadPrograms();
  };
  const handleProgramsClick = () => {
    loadPrograms();
    setMobileProgramsOpen((open) => !open);
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <a
          href="/"
          className={styles.logo}
          onClick={(event) => {
            event.preventDefault();
            if (logoClickTimeout.current) {
              clearTimeout(logoClickTimeout.current);
              logoClickTimeout.current = null;
              return;
            }
            logoClickTimeout.current = setTimeout(() => {
              logoClickTimeout.current = null;
              router.push("/");
            }, 250);
          }}
          onDoubleClick={(event) => {
            event.preventDefault();
            router.push("/admin");
          }}
        >
          <Image
            src="/logo-main.png"
            alt="Professional Skill Campus"
            width={142}
            height={48}
            priority
          />
        </a>

        <nav className={styles.nav}>
          <a href="/" className={linkClass("/")}>
            Home
          </a>
          <a href="/about-psc" className={linkClass("/about-psc")}>
            About
          </a>

          <div
            className={styles.navItem}
            onMouseEnter={loadPrograms}
            onFocus={loadPrograms}
          >
            <button
              type="button"
              className={`${styles.navLink} ${
                pathname.startsWith("/courses") ? styles.navLinkActive : ""
              }`}
              onClick={loadPrograms}
            >
              Programs
              <ChevronDown />
            </button>
            <CoursesDropdown groups={programGroups} />
          </div>

          <a href="/events" className={linkClass("/events")}>
            Events
          </a>
          <a href="/gallery" className={linkClass("/gallery")}>
            Our Gallery
          </a>
          <a href="/blogs" className={linkClass("/blogs")}>
            Blogs
          </a>
          <a href="/contact" className={linkClass("/contact")}>
            Contact us
          </a>
        </nav>

        <div className={styles.loginMenu} data-login-menu>
          <button
            type="button"
            className={styles.cta}
            aria-haspopup="menu"
            aria-expanded={loginMenuOpen}
            onClick={() => setLoginMenuOpen((open) => !open)}
          >
            Login
          </button>
          {loginMenuOpen && (
            <LoginDropdown
              onSelect={() => {
                setLoginMenuOpen(false);
                setIsOpen(false);
              }}
            />
          )}
        </div>

        <button
          type="button"
          className={styles.menuToggle}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span
            className={`${styles.bar} ${isOpen ? styles.barTopOpen : ""}`}
          ></span>
          <span
            className={`${styles.bar} ${isOpen ? styles.barMidOpen : ""}`}
          ></span>
          <span
            className={`${styles.bar} ${isOpen ? styles.barBottomOpen : ""}`}
          ></span>
        </button>
      </div>

      <div className={`${styles.mobileMenu} ${isOpen ? styles.open : ""}`}>
        <nav className={styles.mobileNav}>
          {navLinksBeforeLogin.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`${styles.mobileNavLink} ${
                isActive(link.href) ? styles.mobileNavLinkActive : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </a>
          ))}

          {navLinksAfterLogin.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`${styles.mobileNavLink} ${
                isActive(link.href) ? styles.mobileNavLinkActive : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </a>
          ))}

          <button
            type="button"
            className={`${styles.mobileNavLink} ${styles.mobileProgramsToggle}`}
            aria-expanded={mobileProgramsOpen}
            onClick={handleProgramsClick}
          >
            Programs
            <ChevronDown
              className={`${styles.chevron} ${
                mobileProgramsOpen ? styles.chevronOpen : ""
              }`}
            />
          </button>
          {mobileProgramsOpen && (
            <div className={styles.mobileCourses}>
              {programGroups.map((group) => (
                <div key={group.label} className={styles.mobileCourseGroup}>
                  <p className={styles.mobileCourseCategory}>{group.label}</p>
                  {group.programs.length === 0 && (
                    <span className={styles.mobileCourseLink}>Coming soon</span>
                  )}
                  {group.programs.map((program) => (
                    <a
                      key={program._id}
                      href={`/courses/${programSlug(program.name)}`}
                      className={styles.mobileCourseLink}
                      onClick={() => setIsOpen(false)}
                    >
                      {program.name}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          )}
        </nav>
        <div className={styles.mobileLoginMenu} data-login-menu>
          <button
            type="button"
            className={styles.mobileCta}
            aria-haspopup="menu"
            aria-expanded={loginMenuOpen}
            onClick={() => setLoginMenuOpen((open) => !open)}
          >
            Login
          </button>
          {loginMenuOpen && (
            <LoginDropdown
              onSelect={() => {
                setLoginMenuOpen(false);
                setIsOpen(false);
              }}
            />
          )}
        </div>
      </div>

    </header>
  );
}
