import Link from "next/link";
import { languages } from "@/config/languages";
export default function LanguagePage() {
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
            <Link key={language.code} href="/dashboard">
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
