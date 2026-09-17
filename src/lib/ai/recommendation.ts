import { getRecommendations } from "@/lib/learning/personalization";

export function recommend() {
  return getRecommendations();
}
