import type { Topic } from "@/types/topic";

export const topics: Topic[] = [
  {
    slug: "arrays",
    title: "Arrays",
    titleHi: "ऐरे (Arrays)",
    description:
      "Build confidence with the data structure behind everyday lists.",
    descriptionHi:
      "दैनिक सूचियों के पीछे के डेटा स्ट्रक्चर को आत्मविश्वास से समझें।",
    level: "Beginner",
    color: "coral",
    lessons: 6,
    mastery: 72,
  },
  {
    slug: "linked-list",
    title: "Linked Lists",
    titleHi: "लिंक्ड लिस्ट (Linked Lists)",
    description: "See how nodes connect, move, and rearrange in memory.",
    descriptionHi:
      "देखें कि मेमोरी में नोड्स कैसे जुड़ते हैं, आगे बढ़ते हैं और व्यवस्थित होते हैं।",
    level: "Beginner",
    color: "mint",
    lessons: 5,
    mastery: 48,
  },
  {
    slug: "stacks",
    title: "Stacks",
    titleHi: "स्टैक (Stacks)",
    description:
      "Understand last-in, first-out thinking through useful patterns.",
    descriptionHi:
      "लास्ट-इन, फर्स्ट-आउट (LIFO) सोच को उपयोगी पैटर्न के माध्यम से समझें।",
    level: "Beginner",
    color: "sun",
    lessons: 4,
    mastery: 86,
  },
  {
    slug: "queues",
    title: "Queues",
    titleHi: "क्यू (Queues)",
    description: "Model fair, ordered processing with queues and deques.",
    descriptionHi:
      "कतारों और डीक्यू के साथ निष्पक्ष, क्रमित प्रोसेसिंग को मॉडल करें।",
    level: "Beginner",
    color: "sky",
    lessons: 4,
    mastery: 31,
  },
  {
    slug: "binary-search",
    title: "Binary Search",
    titleHi: "बाइनरी सर्च (Binary Search)",
    description: "Turn sorted data into fast, logarithmic decisions.",
    descriptionHi:
      "सॉर्ट किए गए डेटा को त्वरित, लघुगणकीय (logarithmic) निर्णयों में बदलें।",
    level: "Intermediate",
    color: "lilac",
    lessons: 7,
    mastery: 24,
  },
  {
    slug: "recursion",
    title: "Recursion",
    titleHi: "रिकर्शन (Recursion)",
    description:
      "Learn to make a problem explain itself one smaller step at a time.",
    descriptionHi:
      "किसी समस्या को एक-एक छोटे कदम से सुलझाना सीखें।",
    level: "Intermediate",
    color: "peach",
    lessons: 6,
    mastery: 55,
  },
];

export function getTopic(slug: string) {
  return topics.find((topic) => topic.slug === slug);
}
