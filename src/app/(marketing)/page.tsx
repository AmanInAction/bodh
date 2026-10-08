import Link from "next/link";
import { cookies } from "next/headers";
import { topics } from "@/config/topics";
import { TopicCard } from "@/components/learning/TopicCard";
import { Navbar } from "@/components/ui/Navbar";
import { ButtonLink } from "@/components/ui/Button";
import { LANGUAGE_COOKIE, resolveLanguage, UI_STRINGS } from "@/lib/i18n";

const FEATURES_EN = [
  {
    num: "01",
    title: "Learn in Hindi or English",
    body: "Switch languages anytime. Explanations, examples, and practice questions are written for natural comprehension.",
  },
  {
    num: "02",
    title: "Four Ways to Understand",
    body: "Stuck on an idea? Choose between simple analogies, guided questions, visual mental models, or interview practice.",
  },
  {
    num: "03",
    title: "Focus on What Matters",
    body: "Quick 5-question checks highlight the exact step or concept to review next — not just a raw score.",
  },
  {
    num: "04",
    title: "Visual Concept Maps",
    body: "See how every part of a topic connects at a glance before diving into code and problem solving.",
  },
];

const FEATURES_HI = [
  {
    num: "01",
    title: "हिन्दी या अंग्रेजी में सीखें",
    body: "किसी भी समय भाषा बदलें। पाठ, उदाहरण और अभ्यास प्रश्न सहज समझ के लिए तैयार किए गए हैं।",
  },
  {
    num: "02",
    title: "समझने के चार तरीके",
    body: "कोई बात कठिन लगे तो सरल उदाहरण, सवाल-जवाब, विज़ुअल मॉडल या इंटरव्यू अभ्यास में से चुनें।",
  },
  {
    num: "03",
    title: "सटीक अभ्यास और सुधार",
    body: "5 छोटे प्रश्नों की जाँच से केवल अंक नहीं, बल्कि यह पता चलता है कि किस हिस्से को दोबारा समझना है।",
  },
  {
    num: "04",
    title: "विज़ुअल कॉन्सेप्ट मैप्स",
    body: "कोड और सवालों में जाने से पहले पूरे विषय की संरचना एक नज़र में साफ़ देखें।",
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
  const strings = UI_STRINGS[language];
  const features = isHindi ? FEATURES_HI : FEATURES_EN;

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

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="hero">
        <div>
          <span className="eyebrow">
            {isHindi
              ? "कक्षा 10–12 के विद्यार्थियों के लिए प्रोग्रामिंग और DSA"
              : "Programming & DSA for Class 10–12 students"}
          </span>
          <h1>
            {isHindi ? (
              <>
                कठिन विचारों को <em>आसानी से समझें।</em>
              </>
            ) : (
              <>
                Make difficult ideas <em>easy to grasp.</em>
              </>
            )}
          </h1>
          <p>
            {isHindi ? (
              <>
                सीखें · अभ्यास करें · समझ पक्की करें — <strong>हिन्दी</strong> या{" "}
                <strong>English</strong> में। आपकी गति और सीखने की शैली के अनुसार
                चलने वाला एक शांत अध्ययन साथी।
              </>
            ) : (
              <>
                Learn · Practice · Understand — in <strong>English</strong> or{" "}
                <strong>Hindi</strong>. A calm, step-by-step study companion that
                adapts to how you think best.
              </>
            )}
          </p>
          <div className="hero-actions">
            <ButtonLink
              variant="primary"
              size="lg"
              href={`/onboarding?language=${language}`}
            >
              {isHindi ? "सीखना शुरू करें →" : "Start learning →"}
            </ButtonLink>
            <ButtonLink
              variant="secondary"
              size="lg"
              href={`/learn/binary-search?language=${language}`}
            >
              {isHindi ? "एक पाठ देखें" : "Explore a sample topic"}
            </ButtonLink>
          </div>
        </div>

        <div className="hero-showcase" aria-label={isHindi ? "सीखने की झलक" : "Learning preview"}>
          <div className="hero-showcase-header">
            <span>{isHindi ? "बाइनरी सर्च · अध्याय 05" : "Binary Search · Topic 05"}</span>
            <span>{isHindi ? "English | हिंदी" : "English | हिंदी"}</span>
          </div>
          <div className="hero-showcase-step">
            <span className="eyebrow">
              {isHindi ? "मुख्य विचार" : "Core intuition"}
            </span>
            <strong>
              {isHindi
                ? "हर कदम पर खोज का दायरा आधा करें"
                : "Cut the search space in half at every step"}
            </strong>
            <p>
              {isHindi
                ? "जब सूची क्रम में हो, तो बीच के तत्व को देखकर तुरंत तय करें कि बाएँ जाना है या दाएँ।"
                : "When a list is sorted, checking the middle item tells you immediately which half holds the answer."}
            </p>
          </div>
          <div className="hero-showcase-modes">
            <div className="hero-showcase-mode active">
              {isHindi ? "सरल भाषा में समझें" : "Explain simply"}
            </div>
            <div className="hero-showcase-mode">
              {isHindi ? "सवालों से खुद समझें" : "Help me figure it out"}
            </div>
            <div className="hero-showcase-mode">
              {isHindi ? "चित्र रूप में समझें" : "Show me visually"}
            </div>
            <div className="hero-showcase-mode">
              {isHindi ? "इंटरव्यू की तैयारी" : "Prepare for interviews"}
            </div>
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
                ? "रटने के बजाय समझकर सीखने के लिए।"
                : "Built for understanding, not memorization."}
            </h2>
          </div>
        </div>
        <div className="feature-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <span className="feature-card-num">{f.num}</span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Topic Library ─────────────────────────────────────────────── */}
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{isHindi ? "अध्ययन पथ" : "Curriculum"}</span>
            <h2>
              {isHindi
                ? "छह बुनियादी DSA विषय।"
                : "Six foundational DSA topics."}
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

      {/* ── Guided Tour CTA ───────────────────────────────────────────── */}
      <section className="section">
        <div className="card card-tint" style={{ textAlign: "center", padding: "40px 24px" }}>
          <span className="eyebrow">
            {isHindi ? "सीखने का चक्र" : "How a session works"}
          </span>
          <h2 style={{ margin: "8px auto 12px", maxWidth: "540px", fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}>
            {isHindi
              ? "पढ़ें, नक्शा देखें, अभ्यास करें और आगे बढ़ें।"
              : "Read, visualize, practice, and improve."}
          </h2>
          <p style={{ maxWidth: "540px", margin: "0 auto 24px", color: "var(--text-secondary)" }}>
            {isHindi
              ? "अवधारणा पढ़ें → विज़ुअल मैप देखें → 5 प्रश्नों का अभ्यास करें → जानें कि आगे किस हिस्से पर ध्यान देना है।"
              : "Read a concise note → Explore the visual map → Answer 5 quick questions → See exactly what to review next."}
          </p>
          <ButtonLink variant="primary" size="lg" href={`/learn/binary-search/article?language=${language}`}>
            {isHindi ? "पहला पाठ खोलें →" : "Open a sample lesson →"}
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
