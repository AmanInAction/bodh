import Link from "next/link";
import { cookies } from "next/headers";
import { topics } from "@/config/topics";
import { TopicCard } from "@/components/learning/TopicCard";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { LANGUAGE_COOKIE, resolveLanguage } from "@/lib/i18n";

const FEATURES_EN = [
  {
    icon: "🌐",
    title: "Regional Languages",
    body: "Learn in Hindi or English — not a translation, a full bilingual experience.",
  },
  {
    icon: "🤖",
    title: "Adaptive AI Teacher",
    body: "Four teaching styles: Simple, Socratic, Visual, and Interview-ready.",
  },
  {
    icon: "📊",
    title: "Concept-level Diagnosis",
    body: "Wrong answers map to specific weak concepts, not just a score.",
  },
  {
    icon: "🗺️",
    title: "Visual Mind Maps",
    body: "See the full structure of each topic at a glance before diving in.",
  },
];

const FEATURES_HI = [
  {
    icon: "🌐",
    title: "क्षेत्रीय भाषाएँ",
    body: "हिन्दी या अंग्रेजी में सीखें — केवल अनुवाद नहीं, बल्कि एक पूर्ण द्विभाषी अनुभव।",
  },
  {
    icon: "🤖",
    title: "अनुकूली AI शिक्षक",
    body: "चार शिक्षण शैलियाँ: सरल, सवाल-जवाब, दृश्य, और इंटरव्यू-तैयार।",
  },
  {
    icon: "📊",
    title: "अवधारणा-स्तरीय निदान",
    body: "गलत उत्तर केवल एक अंक नहीं, बल्कि विशिष्ट कमजोर अवधारणाओं को पहचानते हैं।",
  },
  {
    icon: "🗺️",
    title: "दृश्य माइंड मैप्स",
    body: "गहराई में जाने से पहले प्रत्येक विषय की पूरी रूपरेखा एक नज़र में देखें।",
  },
];

export default async function MarketingPage({
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
  const features = isHindi ? FEATURES_HI : FEATURES_EN;

  return (
    <main className="site-shell">
      <nav className="nav">
        <strong className="brand">
          bodh<span>.</span>
        </strong>
        <div>
          <Link href={`/about?language=${language}`}>
            {isHindi ? "के बारे में" : "About"}
          </Link>
          <Link href={`/auth?language=${language}`}>
            {isHindi ? "साइन इन" : "Sign in"}
          </Link>
          <LanguageToggle currentLanguage={language} />
          <Link className="nav-cta" href={`/onboarding?language=${language}`}>
            {isHindi ? "सीखना शुरू करें" : "Start learning"}
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="hero">
        <div>
          <span className="eyebrow">
            {isHindi
              ? "आपकी भाषा में AI-संचालित DSA शिक्षा"
              : "AI-powered DSA education in your language"}
          </span>
          <h1>
            {isHindi ? (
              <>
                अपनी भाषा में <em>DSA सीखें।</em>
              </>
            ) : (
              <>
                Learn DSA <em>in your language.</em>
              </>
            )}
          </h1>
          <p>
            {isHindi ? (
              <>
                सीखें &bull; अभ्यास करें &bull; सुधारें — <strong>हिन्दी</strong> या{" "}
                <strong>English</strong> में। केवल अनुवाद नहीं — ऐसा व्यक्तिगत
                शिक्षण जो आपके सीखने के तरीके के अनुसार ढलता है।
              </>
            ) : (
              <>
                Learn &bull; Practice &bull; Improve — in{" "}
                <strong>Hindi</strong> or <strong>English</strong>. Not just
                translated content — adaptive teaching that changes based on how
                you learn.
              </>
            )}
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link className="button button-primary" href={`/onboarding?language=${language}`}>
              {isHindi ? "सीखना शुरू करें →" : "Start Learning →"}
            </Link>
            <Link
              className="button"
              href="/learn/binary-search/quiz?language=hi"
            >
              {isHindi ? "हिन्दी क्विज़ आज़माएं" : "Try a Hindi quiz"}
            </Link>
          </div>
        </div>
        <div className="hero-orbit">
          <div className="orbit-card orbit-main">
            सीखें
            <br />
            <strong>समझें</strong>
          </div>
          <div className="orbit-card orbit-small">
            Learn
            <br />
            <strong>Improve</strong>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{isHindi ? "bodh. क्यों" : "Why bodh."}</span>
            <h2>
              {isHindi
                ? "केवल एक अनुवाद से कहीं अधिक।"
                : "More than a translation."}
            </h2>
          </div>
        </div>
        <div className="topic-grid">
          {features.map((f) => (
            <div key={f.title} className="card">
              <span style={{ fontSize: "2rem" }}>{f.icon}</span>
              <h3 style={{ margin: "8px 0 4px" }}>{f.title}</h3>
              <p style={{ margin: 0, opacity: 0.75, fontSize: "0.9rem" }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Topic Library ─────────────────────────────────────────────── */}
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{isHindi ? "लाइब्रेरी" : "The library"}</span>
            <h2>
              {isHindi
                ? "छह मुख्य डीएसए विषय।"
                : "Six core DSA topics."}
            </h2>
          </div>
          <Link className="text-link" href={`/learn?language=${language}`}>
            {isHindi ? "सभी विषय देखें →" : "View all topics →"}
          </Link>
        </div>
        <div className="topic-grid">
          {topics.slice(0, 3).map((topic) => (
            <Link key={topic.slug} href={`/learn/${topic.slug}?language=${language}`}>
              <TopicCard topic={topic} language={language} />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Demo CTA ──────────────────────────────────────────────────── */}
      <section className="section" style={{ textAlign: "center", paddingBottom: "80px" }}>
        <span className="eyebrow">{isHindi ? "डेमो अनुभव" : "Demo flow"}</span>
        <h2>
          {isHindi
            ? "पूरे सीखने के चक्र को देखें।"
            : "See the full loop in action."}
        </h2>
        <p style={{ maxWidth: "520px", margin: "0 auto 24px", opacity: 0.75 }}>
          {isHindi
            ? "हिन्दी चुनें → बाइनरी सर्च चुनें → लेख पढ़ें → क्विज़ लें → AI निदान प्राप्त करें → अगला अनुशंसित पाठ देखें।"
            : "Choose Hindi → Pick Binary Search → Read the article → Take the quiz → Get an AI diagnosis → See your recommended next lesson."}
        </p>
        <Link className="button button-primary" href="/learn/binary-search/article?language=hi">
          {isHindi ? "डेमो चलाएं →" : "Run the demo →"}
        </Link>
      </section>
    </main>
  );
}
