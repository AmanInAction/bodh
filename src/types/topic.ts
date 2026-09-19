export type Topic = {
  slug: string;
  title: string;
  description: string;
  level: "Beginner" | "Intermediate";
  color: string;
  lessons: number;
  mastery: number;
};

export type Lesson = {
  slug: string;
  title: string;
  summary: string;
  duration: string;
};
