"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { setClientLanguage, type SupportedLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle({
  currentLanguage,
  className,
  compact = false,
}: {
  currentLanguage: SupportedLanguage;
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function selectLanguage(nextLang: SupportedLanguage) {
    if (nextLang === currentLanguage || isPending) return;

    // 1. Set persistent cookie across the entire domain
    setClientLanguage(nextLang);

    // 2. Persist to student profile if session exists
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
    <div
      className={cn("lang-segmented", isPending && "is-pending", className)}
      role="group"
      aria-label={
        currentLanguage === "hi"
          ? "भाषा चुनें (Choose language)"
          : "Choose language (भाषा चुनें)"
      }
    >
      <button
        type="button"
        onClick={() => selectLanguage("en")}
        disabled={isPending}
        aria-pressed={currentLanguage === "en"}
        className={cn(
          "lang-seg-btn",
          currentLanguage === "en" && "active",
        )}
        title="Switch to English"
      >
        {compact ? "EN" : "English"}
      </button>
      <button
        type="button"
        onClick={() => selectLanguage("hi")}
        disabled={isPending}
        aria-pressed={currentLanguage === "hi"}
        className={cn(
          "lang-seg-btn",
          currentLanguage === "hi" && "active",
        )}
        title="हिन्दी में पढ़ें"
      >
        {compact ? "हि" : "हिंदी"}
      </button>
    </div>
  );
}
