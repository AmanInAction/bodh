export type LearningGoal = "scratch" | "foundations" | "interview";
export type TeachingStyle = "simple" | "socratic" | "visual" | "interview";
export type SupportedLanguage = "en" | "hi";

export type ConceptEvidence = {
  concept: string;
  correctCount: number;
  incorrectCount: number;
  lastTestedAt: string;
  resolved?: boolean;
};

/**
 * Structured assessment contract produced by Agent 2 (Assessment Agent)
 * and persisted on the student's topic performance record.
 */
export type StructuredAssessment = {
  strengths: string[];
  weakConcepts: string[];
  misconceptions: string[];
  recommendedAction: "advance" | "practice" | "explain_differently" | "review_prerequisite";
  recommendedStyle: TeachingStyle;
  prerequisiteTopicSlug?: string;
  masteryEvidence: {
    score: number;
    correct: number;
    total: number;
    isRetest?: boolean;
    improvedConcepts?: string[];
  };
  confidence: number;
  reasoningSummary: string;
  nextStep: string;
};

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
  weakConcepts?: string[];    // Ongoing weak sub-concepts needing reinforcement
  masteredConcepts?: string[]; // Sub-concepts demonstrated accurately
  conceptHistory?: Record<string, ConceptEvidence>;
  lastAssessment?: StructuredAssessment;
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
