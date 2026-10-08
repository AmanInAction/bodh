import Link from "next/link";
import { cookies } from "next/headers";
import { LANGUAGE_COOKIE, resolveLanguage } from "@/lib/i18n";
import { Navbar } from "@/components/ui/Navbar";

export default async function OnboardingPage({
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

  const choices = isHindi
    ? [
        {
          goal: "scratch",
          title: "मैं बिल्कुल शुरुआत से सीख रहा हूँ",
          desc: "सरल उदाहरणों और बुनियादी अवधारणाओं से कदम-दर-कदम शुरुआत करें।",
        },
        {
          goal: "foundations",
          title: "मैं अपनी बुनियाद मजबूत करना चाहता हूँ",
          desc: "डेटा स्ट्रक्चर्स और एल्गोरिदम के मुख्य सिद्धांतों को गहराई से समझें।",
        },
        {
          goal: "interview",
          title: "मैं परीक्षा या इंटरव्यू की तैयारी कर रहा हूँ",
          desc: "समय-जटिलता (complexity), एज केस और सवाल हल करने के तरीकों पर ध्यान दें।",
        },
      ]
    : [
        {
          goal: "scratch",
          title: "I am starting from scratch",
          desc: "Begin with plain-language intuition and everyday analogies.",
        },
        {
          goal: "foundations",
          title: "I want stronger foundations",
          desc: "Connect visual mental models with core data structure operations.",
        },
        {
          goal: "interview",
          title: "I am preparing for exams or interviews",
          desc: "Focus on problem-solving patterns, edge cases, and trade-offs.",
        },
      ];

  return (
    <main className="onboarding">
      <Navbar
        language={language}
        backHref={`/?language=${language}`}
        backLabel={isHindi ? "← मुख्य पृष्ठ" : "← Home"}
      />
      <div className="onboarding-panel">
        <span className="eyebrow">
          {isHindi ? "चरण 1 / 2 · आपकी शुरुआत" : "Step 1 of 2 · A little context"}
        </span>
        <h1>
          {isHindi
            ? "आज आप किस लक्ष्य के साथ सीखना चाहते हैं?"
            : "What brings you here today?"}
        </h1>
        <p>
          {isHindi
            ? "हम आपके उत्तर के अनुसार आपका पहला अध्ययन सत्र तैयार करेंगे।"
            : "We will shape a calm, focused starting path around your goal."}
        </p>
        <div className="choice-grid">
          {choices.map((item) => (
            <Link
              key={item.goal}
              href={`/onboarding/language?goal=${item.goal}&language=${language}`}
            >
              <div className="choice-item-content">
                <span>{item.title}</span>
                <span className="choice-item-desc">{item.desc}</span>
              </div>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
