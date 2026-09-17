export type TopicProgress = {
  topicSlug: string;
  completedLessons: number;
  totalLessons: number;
  mastery: number;
};

export type ProgressSummary = {
  streak: number;
  lessonsCompleted: number;
  minutesLearned: number;
  averageMastery: number;
};
