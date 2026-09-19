"use client";

import Link from "next/link";
import type { Recommendation } from "@/lib/learning/recommendation";

type RecommendationCardProps = {
  recommendation: Recommendation;
};

export function RecommendationCard({
  recommendation,
}: RecommendationCardProps) {
  return (
    <Link
      href={`/learn/${recommendation.topicSlug}`}
      className="group block rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">
            Recommended next
          </p>

          <h3 className="mt-1 text-lg font-semibold text-foreground">
            {recommendation.topicSlug}
          </h3>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {recommendation.reason}
          </p>
        </div>

        <span className="shrink-0 text-lg transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
    </Link>
  );
}
