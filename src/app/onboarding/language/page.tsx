"use client";

import Link from "next/link";
import { languages } from "@/config/languages";
import { setClientLanguage } from "@/lib/i18n";

export default function LanguagePage() {
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
      <div className="onboarding-mark">
        bodh<span>.</span>
      </div>
      <div className="onboarding-panel">
        <span className="eyebrow">One last thing</span>
        <h1>Choose your learning language.</h1>
        <p>You can change this later in your profile.</p>
        <div className="language-list">
          {languages.map((language) => (
            <Link
              key={language.code}
              href={`/learn?language=${language.code}`}
              onClick={() => handleSelect(language.code)}
            >
              <span>{language.nativeName}</span>
              {language.name}
              <span>→</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
