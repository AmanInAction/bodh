export type TopicProgress = {
  topicSlug: string;
  completedLessons: number;
  totalLessons: number;
  mastery: number;
  attempts: number;
  lastAttemptAt?: string;
  teachingStyle?: string;
};

export type ProgressSummary = {
  streak: number;
  lessonsCompleted: number;
  minutesLearned: number;
  averageMastery: number;
};
