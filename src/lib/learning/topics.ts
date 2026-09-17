import { getTopic, topics } from "@/config/topics";
import type { Lesson } from "@/types/topic";

export { getTopic, topics };

export function getLessons(slug: string): Lesson[] {
  const topic = getTopic(slug);
  if (!topic) return [];
  return Array.from({ length: topic.lessons }, (_, index) => ({
    slug: `${slug}-${index + 1}`,
    title:
      index === 0
        ? `What is ${topic.title}?`
        : `${topic.title}: concept ${index + 1}`,
    summary: `A focused ${topic.title.toLowerCase()} lesson with a practical example.`,
    duration: `${6 + index * 2} min`,
  }));
}
