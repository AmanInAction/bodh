"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { languages } from "@/config/languages";
import { resolveLanguage, setClientLanguage } from "@/lib/i18n";
import { Navbar } from "@/components/ui/Navbar";

function LanguageSelectionContent() {
  const searchParams = useSearchParams();
  const currentLang = resolveLanguage(searchParams.get("language"));
  const isHindi = currentLang === "hi";

  function handleSelect(code: string) {
    setClientLanguage(code);
    fetch("/api/student", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ language: code }),
    }).catch(() => {});
  }

  return (
    <main className="onboarding">
      <Navbar
        language={currentLang}
        backHref={`/onboarding?language=${currentLang}`}
        backLabel={isHindi ? "← पीछे जाएं" : "← Back"}
      />
      <div className="onboarding-panel">
        <span className="eyebrow">
          {isHindi ? "चरण 2 / 2 · भाषा" : "Step 2 of 2 · Language"}
        </span>
        <h1>
          {isHindi
            ? "अपनी सीखने की भाषा चुनें।"
            : "Choose your learning language."}
        </h1>
        <p>
          {isHindi
            ? "आप इसे किसी भी समय ऊपर दिए गए बटन से बदल सकते हैं।"
            : "You can switch between English and Hindi anytime from the top bar."}
        </p>
        <div className="language-list">
          {languages.map((language) => (
            <Link
              key={language.code}
              href={`/learn?language=${language.code}`}
              onClick={() => handleSelect(language.code)}
            >
              <span>{language.nativeName}</span>
              <span>{language.name}</span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function LanguagePage() {
  return (
    <Suspense>
      <LanguageSelectionContent />
    </Suspense>
  );
}
