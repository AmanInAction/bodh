import { getTopic, topics } from "@/config/topics";
import { getTopicTitle, type SupportedLanguage } from "@/lib/i18n";
import type { Lesson } from "@/types/topic";

export { getTopic, topics };

export function getLessons(
  slug: string,
  language: SupportedLanguage = "en",
): Lesson[] {
  const topic = getTopic(slug);
  if (!topic) return [];
  const isHindi = language === "hi";
  const title = getTopicTitle(slug, language);
  return Array.from({ length: topic.lessons }, (_, index) => ({
    slug: `${slug}-${index + 1}`,
    title:
      index === 0
        ? isHindi
          ? `${title} क्या है?`
          : `What is ${title}?`
        : isHindi
          ? `${title}: अवधारणा ${index + 1}`
          : `${title}: concept ${index + 1}`,
    summary: isHindi
      ? `व्यावहारिक उदाहरण के साथ ${title} का एक केंद्रित पाठ।`
      : `A focused ${topic.title.toLowerCase()} lesson with a practical example.`,
    duration: isHindi ? `${6 + index * 2} मिनट` : `${6 + index * 2} min`,
  }));
}
