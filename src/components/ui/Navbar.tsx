"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UI_STRINGS, type SupportedLanguage } from "@/lib/i18n";
import { LanguageToggle } from "./LanguageToggle";
import { LogoutButton } from "./LogoutButton";
import { ButtonLink } from "./Button";
import { cn } from "@/lib/utils";

export type NavLinkItem = {
  href: string;
  label: string;
  activeMatch?: string;
};

export type NavbarProps = {
  language: SupportedLanguage;
  links?: NavLinkItem[];
  backHref?: string;
  backLabel?: string;
  ctaHref?: string;
  ctaLabel?: string;
  userName?: string;
  showLogout?: boolean;
  className?: string;
};

export function Navbar({
  language,
  links = [],
  backHref,
  backLabel,
  ctaHref,
  ctaLabel,
  userName,
  showLogout = false,
  className,
}: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const strings = UI_STRINGS[language];
  const hasMenuItems = links.length > 0 || Boolean(ctaHref) || showLogout;

  return (
    <header className={cn("ds-header", className)}>
      <div className="nav">
        {/* Zone 1: Brand wordmark */}
        <Link className="brand" href={`/?language=${language}`}>
          bodh<span>.</span>
        </Link>

        {/* Zone 2: Center navigation links or Back link */}
        {backHref && backLabel ? (
          <nav className="nav-center" aria-label="Breadcrumb navigation">
            <Link className="nav-back-link" href={backHref}>
              {backLabel}
            </Link>
          </nav>
        ) : links.length > 0 ? (
          <nav className="nav-center nav-desktop-links" aria-label="Main navigation">
            {links.map((item) => {
              const matchPath = item.activeMatch ?? item.href.split("?")[0];
              const isActive =
                matchPath === "/"
                  ? pathname === "/"
                  : pathname.startsWith(matchPath);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("nav-link", isActive && "active")}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : (
          <div />
        )}

        {/* Zone 3: Language toggle & Primary actions */}
        <div className="nav-actions">
          <Suspense fallback={null}>
            <LanguageToggle currentLanguage={language} />
          </Suspense>

          <div className="nav-desktop-actions">
            {userName && (
              <span
                className="avatar"
                title={userName}
                aria-label={`Signed in as ${userName}`}
              >
                {userName[0]?.toUpperCase() ?? "S"}
              </span>
            )}
            {showLogout && <LogoutButton language={language} />}
            {ctaHref && ctaLabel && (
              <ButtonLink href={ctaHref} variant="primary" size="sm">
                {ctaLabel}
              </ButtonLink>
            )}
          </div>

          {hasMenuItems && (
            <button
              type="button"
              className="nav-mobile-toggle"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={mobileOpen ? strings.nav.closeMenu : strings.nav.menu}
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              <span className="nav-mobile-icon" aria-hidden="true">
                {mobileOpen ? "✕" : "☰"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {hasMenuItems && mobileOpen && (
        <nav
          id="mobile-nav-drawer"
          className="nav-mobile-drawer"
          aria-label="Mobile navigation"
        >
          <div className="nav-mobile-links">
            {links.map((item) => {
              const matchPath = item.activeMatch ?? item.href.split("?")[0];
              const isActive =
                matchPath === "/"
                  ? pathname === "/"
                  : pathname.startsWith(matchPath);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("nav-mobile-link", isActive && "active")}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="nav-mobile-footer">
            {userName && (
              <div className="nav-mobile-user">
                <span className="avatar">{userName[0]?.toUpperCase() ?? "S"}</span>
                <span>{userName}</span>
              </div>
            )}
            {showLogout && <LogoutButton language={language} />}
            {ctaHref && ctaLabel && (
              <ButtonLink
                href={ctaHref}
                variant="primary"
                fullWidth
                onClick={() => setMobileOpen(false)}
              >
                {ctaLabel}
              </ButtonLink>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
