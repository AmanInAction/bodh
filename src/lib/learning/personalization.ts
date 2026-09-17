import type { Recommendation } from "@/types/ai";

export function getRecommendations(): Recommendation[] {
  return [
    {
      title: "Binary Search",
      reason: "A short practice set can strengthen your newest weak spot.",
      href: "/learn/binary-search",
    },
    {
      title: "Queues",
      reason: "Keep your momentum with a quick five-minute review.",
      href: "/learn/queues",
    },
  ];
}
