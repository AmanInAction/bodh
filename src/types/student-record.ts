export type LearningGoal = "scratch" | "foundations" | "interview";
export type TeachingStyle = "simple" | "socratic" | "visual" | "interview";
export type SupportedLanguage = "en" | "hi";

/**
 * Shape of a single topic's performance data inside StudentRecord.
 */
export type TopicPerformance = {
  score: number;              // Best mastery score (0-100)
  lastScore?: number;         // Most recent quiz score (0-100)
  attempts: number;           // Total quiz attempts
  completedLessons?: number;  // Completed lessons count
  lastAttemptAt?: string;     // ISO-8601 timestamp
  missedConcepts?: string[];  // Concepts missed in recent attempt
  teachingStyle?: TeachingStyle;
};

/**
 * Canonical StudentRecord stored under partition key `studentId`.
 * Single source of truth for learner profile, language preference, and progress.
 */
export type StudentRecord = {
  studentId: string;
  name?: string;
  email?: string;
  language: SupportedLanguage;
  preferredStyle?: TeachingStyle;
  goal?: LearningGoal;
  topics: Record<string, TopicPerformance>;
  weakTopics: string[];
  streakDays?: number;
  lastActiveDate?: string;
  updatedAt?: number;
  lastLoginAt?: string;
  loginCount?: number;
  createdAt?: string;
};
