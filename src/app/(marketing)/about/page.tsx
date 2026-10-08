import { cookies } from "next/headers";
import { LANGUAGE_COOKIE, resolveLanguage, UI_STRINGS } from "@/lib/i18n";
import { Navbar } from "@/components/ui/Navbar";
import { ButtonLink } from "@/components/ui/Button";

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
  const strings = UI_STRINGS[language];

  return (
    <main className="site-shell">
      <Navbar
        language={language}
        links={[
          { href: `/learn?language=${language}`, label: strings.nav.learn, activeMatch: "/learn" },
          { href: `/about?language=${language}`, label: strings.nav.about, activeMatch: "/about" },
          { href: `/auth?language=${language}`, label: strings.nav.signIn, activeMatch: "/auth" },
        ]}
        ctaHref={`/onboarding?language=${language}`}
        ctaLabel={strings.nav.startLearning}
      />
      <section className="simple-page">
        <span className="eyebrow">
          {isHindi ? "bodh. के बारे में" : "About bodh."}
        </span>
        <h1>
          {isHindi
            ? "ऐसी सीख जो सोचने का अवसर दे।"
            : "Learning that leaves room for thought."}
        </h1>
        <p className="lead">
          {isHindi
            ? "bodh. कंप्यूटर विज्ञान और प्रोग्रामिंग में अपनी नींव मजबूत करने वाले विद्यार्थियों के लिए एक शांत और स्पष्ट अध्ययन साथी है।"
            : "bodh. is a calm, focused learning companion for students building their foundations in programming and computer science."}
        </p>
        <p>
          {isHindi
            ? "हमारा मानना है कि समझ गति से अधिक स्थायी होती है। प्रत्येक पाठ आपको एक उपयोगी मानसिक मॉडल, एक ठोस उदाहरण और अपने तरीके से अवधारणा को समझने का अवसर देता है।"
            : "We believe clear understanding lasts longer than memorization. Every topic gives you an intuitive mental model, a concrete example, and multiple ways to explore the idea until it clicks."}
        </p>
        <ButtonLink variant="primary" size="lg" href={`/onboarding?language=${language}`}>
          {isHindi ? "किसी विषय से शुरू करें →" : "Start with a topic →"}
        </ButtonLink>
      </section>
    </main>
  );
}
