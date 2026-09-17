import type { Topic } from "@/types/topic";

export const topics: Topic[] = [
  {
    slug: "arrays",
    title: "Arrays",
    description:
      "Build confidence with the data structure behind everyday lists.",
    level: "Beginner",
    color: "coral",
    lessons: 6,
    mastery: 72,
  },
  {
    slug: "linked-list",
    title: "Linked Lists",
    description: "See how nodes connect, move, and rearrange in memory.",
    level: "Beginner",
    color: "mint",
    lessons: 5,
    mastery: 48,
  },
  {
    slug: "stacks",
    title: "Stacks",
    description:
      "Understand last-in, first-out thinking through useful patterns.",
    level: "Beginner",
    color: "sun",
    lessons: 4,
    mastery: 86,
  },
  {
    slug: "queues",
    title: "Queues",
    description: "Model fair, ordered processing with queues and deques.",
    level: "Beginner",
    color: "sky",
    lessons: 4,
    mastery: 31,
  },
  {
    slug: "binary-search",
    title: "Binary Search",
    description: "Turn sorted data into fast, logarithmic decisions.",
    level: "Intermediate",
    color: "lilac",
    lessons: 7,
    mastery: 24,
  },
  {
    slug: "recursion",
    title: "Recursion",
    description:
      "Learn to make a problem explain itself one smaller step at a time.",
    level: "Intermediate",
    color: "peach",
    lessons: 6,
    mastery: 55,
  },
];

export function getTopic(slug: string) {
  return topics.find((topic) => topic.slug === slug);
}
