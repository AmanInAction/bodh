import Link from "next/link";
import type { Recommendation } from "@/lib/learning/recommendation";
import { getTopicTitle } from "@/lib/i18n";

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

  return (
    <Link
      href={`/learn/${recommendation.topicSlug}?language=${language}`}
      className="group block rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <p className="text-sm font-medium text-primary">
        {isHindi ? "आगे अनुशंसित" : "Recommended next"}
      </p>

      <div className="mt-1 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {reason}
          </p>
        </div>

        <span className="shrink-0 text-lg transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
    </Link>
  );
}
