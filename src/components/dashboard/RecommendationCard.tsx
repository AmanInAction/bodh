import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { Recommendation } from "@/types/ai";
export function RecommendationCard({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  return (
    <Card>
      <span className="eyebrow">Recommended</span>
      <h3>{recommendation.title}</h3>
      <p>{recommendation.reason}</p>
      <Link className="text-link" href={recommendation.href}>
        Continue learning →
      </Link>
    </Card>
  );
}
