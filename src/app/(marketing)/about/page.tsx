import Link from "next/link";
import { cookies } from "next/headers";
import { LANGUAGE_COOKIE, resolveLanguage } from "@/lib/i18n";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

export default async function AboutPage({
  searchParams,
}: {
  searchParams?: Promise<{ language?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const cookieStore = await cookies();
  const language = resolveLanguage(
    resolvedSearchParams.language,
    cookieStore.get(LANGUAGE_COOKIE)?.value,
  );
  const isHindi = language === "hi";

  return (
    <main className="site-shell narrow">
      <nav className="nav">
        <Link className="brand" href={`/?language=${language}`}>
          bodh<span>.</span>
        </Link>
        <div>
          <LanguageToggle currentLanguage={language} />
          <Link href={`/learn?language=${language}`}>
            {isHindi ? "पाठ देखें →" : "Explore lessons →"}
          </Link>
        </div>
      </nav>
      <section className="simple-page">
        <span className="eyebrow">{isHindi ? "bodh के बारे में" : "About bodh"}</span>
        <h1>
          {isHindi
            ? "ऐसी सीख जो सोचने का अवसर दे।"
            : "Learning that leaves room for thought."}
        </h1>
        <p className="lead">
          {isHindi
            ? "bodh कंप्यूटर विज्ञान में अपनी नींव मजबूत करने वाले शिक्षार्थियों के लिए एक केंद्रित साथी है।"
            : "Bodh is a small, focused learning companion for people building their foundations in computer science."}
        </p>
        <p>
          {isHindi
            ? "हमारा मानना है कि समझ गति से अधिक स्थायी होती है। प्रत्येक पाठ आपको एक उपयोगी मानसिक मॉडल, एक ठोस उदाहरण और अपने शब्दों में अवधारणा को समझाने का अवसर देता है।"
            : "We believe understanding is more durable than speed. Every lesson gives you a useful mental model, a concrete example, and a chance to explain the idea in your own words."}
        </p>
        <Link className="button button-primary" href={`/onboarding?language=${language}`}>
          {isHindi ? "किसी विषय से शुरू करें" : "Start with a topic"}
        </Link>
      </section>
    </main>
  );
}
