"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { setClientLanguage, type SupportedLanguage } from "@/lib/i18n";

export function LanguageToggle({
  currentLanguage,
  className,
}: {
  currentLanguage: SupportedLanguage;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const nextLang: SupportedLanguage = currentLanguage === "hi" ? "en" : "hi";
  const label = currentLanguage === "hi" ? "Switch to English" : "हिन्दी में पढ़ें";

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();

    // 1. Set persistent cookie across the entire domain
    setClientLanguage(nextLang);

    // 2. Persist to student profile in DynamoDB if session exists
    fetch("/api/student", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ language: nextLang }),
    }).catch(() => {});

    // 3. Update URL search params and refresh page smoothly
    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("language", nextLang);
      router.push(`${pathname}?${params.toString()}`);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={className ?? "lang-toggle-btn"}
      aria-label="Toggle interface language"
    >
      {isPending ? "..." : label}
    </button>
  );
}
