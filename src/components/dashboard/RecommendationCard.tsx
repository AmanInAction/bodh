import Link from "next/link";
import type { Recommendation } from "@/lib/learning/recommendation";
import { getTopicTitle, UI_STRINGS } from "@/lib/i18n";

type RecommendationCardProps = {
  recommendation: Recommendation;
  language?: "en" | "hi";
};

const REASON_HI: Record<string, string> = {
  "Reinforce the core concept before moving on.":
    "आगे बढ़ने से पहले मुख्य अवधारणा को दोहराएं।",
  "A new topic to keep your learning path moving.":
    "अपने सीखने के सफर को आगे बढ़ाने के लिए एक नया विषय।",
  "A little more practice can strengthen this skill.":
    "थोड़ा और अभ्यास इस कौशल को मजबूत कर सकता है।",
};

export function RecommendationCard({
  recommendation,
  language = "en",
}: RecommendationCardProps) {
  const isHindi = language === "hi";
  const title = getTopicTitle(recommendation.topicSlug, language);
  const reason = isHindi
    ? REASON_HI[recommendation.reason] ?? recommendation.reason
    : recommendation.reason;
  const strings = UI_STRINGS[language];

  return (
    <Link
      href={`/learn/${recommendation.topicSlug}?language=${language}`}
      className="rec-card"
    >
      <span className="eyebrow">{strings.dashboardPage.recommendedNext}</span>
      <div className="rec-card-body">
        <div>
          <h3 className="rec-card-title">{title}</h3>
          <p className="rec-card-desc">{reason}</p>
        </div>
        <span className="rec-card-arrow" aria-hidden="true">
          →
        </span>
      </div>
    </Link>
  );
}
