// src/types/student-record.ts

/**
 * Shape of a single topic's performance data inside StudentRecord.
 */
export type TopicPerformance = {
  score: number;    // 0-100
  attempts: number;
};

/**
 * The DynamoDB item stored under partition key `studentId`.
 *
 * Example:
 * {
 *   "studentId": "student_001",
 *   "language": "hi",
 *   "topics": {
 *     "arrays":        { "score": 85, "attempts": 2 },
 *     "recursion":     { "score": 42, "attempts": 3 },
 *     "binary-search": { "score": 55, "attempts": 1 }
 *   },
 *   "weakTopics": ["recursion", "binary-search"]
 * }
 */
export type StudentRecord = {
  studentId: string;
  language: "en" | "hi";
  topics: Record<string, TopicPerformance>;
  weakTopics: string[];
  updatedAt?: number;    // epoch ms, set on every write
  lastLoginAt?: string;  // ISO-8601, set on every successful login
  loginCount?: number;   // incremented on every successful login
};
