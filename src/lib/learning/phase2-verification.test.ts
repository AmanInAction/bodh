import { describe, it, expect } from "vitest";
import {
  calculateDailyStreak,
  computeWeakTopics,
  updateTopicScore,
  getStudentRecord,
  updateStudentProfile,
  recordLogin,
  getContentIndex,
  listContentIndices,
} from "@/lib/aws/dynamodb";
import {
  getTopicStatus,
  summarizeRoadmap,
  getRoadmap,
} from "@/lib/learning/roadmap";
import { getRecommendations } from "@/lib/learning/recommendation";
import {
  getLessonContent,
  getBlogPost,
  listBlogPosts,
  getOrGenerateMindmap,
} from "@/lib/learning/content";

describe("Phase 2 Verification Audit", () => {
  describe("1. Streak Calculations & Mastery Thresholds", () => {
    it("calculates daily streaks correctly with daily calendar comparison", () => {
      // First activity
      const s1 = calculateDailyStreak(undefined, 0);
      expect(s1.streakDays).toBe(1);
      expect(s1.lastActiveDate).toBe(new Date().toISOString().slice(0, 10));

      // Same day activity does not artificially inflate streak
      const today = new Date().toISOString().slice(0, 10);
      const s2 = calculateDailyStreak(today, 5);
      expect(s2.streakDays).toBe(5);
      expect(s2.lastActiveDate).toBe(today);

      // Consecutive calendar day increments streak
      const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const s3 = calculateDailyStreak(yesterdayDate, 3);
      expect(s3.streakDays).toBe(4);

      // Missed day resets streak to 1
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const s4 = calculateDailyStreak(fourDaysAgo, 10);
      expect(s4.streakDays).toBe(1);
    });

    it("evaluates mastery thresholds according to documented rules", () => {
      // 0 attempts is not_started
      expect(getTopicStatus(0, 0)).toBe("not_started");
      expect(getTopicStatus(90, 0)).toBe("not_started");

      // Score < 60 with attempts > 0 is needs_practice
      expect(getTopicStatus(40, 1)).toBe("needs_practice");
      expect(getTopicStatus(59, 2)).toBe("needs_practice");

      // 60 <= score < 80 with attempts > 0 is in_progress
      expect(getTopicStatus(60, 1)).toBe("in_progress");
      expect(getTopicStatus(75, 3)).toBe("in_progress");
      expect(getTopicStatus(79, 1)).toBe("in_progress");

      // score >= 80 is mastered
      expect(getTopicStatus(80, 1)).toBe("mastered");
      expect(getTopicStatus(100, 2)).toBe("mastered");
    });

    it("computes weak topics as score < 60 sorted ascending by score", () => {
      const topicsMap = {
        arrays: { score: 85, attempts: 2 },
        "linked-list": { score: 45, attempts: 1 },
        stacks: { score: 30, attempts: 2 },
        queues: { score: 70, attempts: 1 },
      };
      const weak = computeWeakTopics(topicsMap);
      expect(weak).toEqual(["stacks", "linked-list"]);
    });
  });

  describe("2. Quiz Submission Trace & State Persistence Across Refresh/Login", () => {
    it("traces quiz submission through persisted topic scores and roadmap synchronization", async () => {
      const testStudent = "audit_student_01@bodh.edu";

      // 1. Initialize profile
      await updateStudentProfile(testStudent, {
        name: "Audit Student",
        language: "en",
        goal: "interview",
      });

      // 2. Submit quiz for binary-search with score 80
      await updateTopicScore({
        studentId: testStudent,
        language: "en",
        topicSlug: "binary-search",
        score: 80,
      });

      // 3. Verify record was persisted
      const record1 = await getStudentRecord(testStudent);
      expect(record1).not.toBeNull();
      expect(record1?.topics["binary-search"]?.score).toBe(80);
      expect(record1?.topics["binary-search"]?.attempts).toBe(1);
      expect(record1?.topics["binary-search"]?.lastAttemptAt).toBeDefined();

      // 4. Verify higher score is preserved when a lower score is submitted later
      await updateTopicScore({
        studentId: testStudent,
        language: "en",
        topicSlug: "binary-search",
        score: 60,
      });
      const record2 = await getStudentRecord(testStudent);
      expect(record2?.topics["binary-search"]?.score).toBe(80); // best score kept
      expect(record2?.topics["binary-search"]?.lastScore).toBe(60); // most recent tracked
      expect(record2?.topics["binary-search"]?.attempts).toBe(2);

      // 5. Submit low score on recursion (weak topic)
      await updateTopicScore({
        studentId: testStudent,
        language: "en",
        topicSlug: "recursion",
        score: 40,
      });
      const record3 = await getStudentRecord(testStudent);
      expect(record3?.weakTopics).toContain("recursion");

      // 6. Verify roadmap and dashboard summary read from persisted state
      const roadmap = await getRoadmap(testStudent);
      const bsRoadmap = roadmap.find((r) => r.topicSlug === "binary-search");
      expect(bsRoadmap?.mastery).toBe(80);
      expect(bsRoadmap?.attempts).toBe(2);

      const summary = summarizeRoadmap(roadmap);
      expect(summary.averageMastery).toBe(60); // (80 + 40) / 2
      expect(summary.streak).toBe(1);

      // 7. Verify new session login preserves scores, goals and weak topics
      await recordLogin({ studentId: testStudent, language: "en" });
      const recordAfterLogin = await getStudentRecord(testStudent);
      expect(recordAfterLogin?.topics["binary-search"]?.score).toBe(80);
      expect(recordAfterLogin?.goal).toBe("interview");
      expect(recordAfterLogin?.weakTopics).toContain("recursion");
    });
  });

  describe("3. Learning Goals & Personalized Recommendations", () => {
    it("tailors recommendation sequence according to active goal", () => {
      const emptyRoadmap = [
        { topicSlug: "arrays", completedLessons: 0, totalLessons: 4, mastery: 0, attempts: 0 },
        { topicSlug: "linked-list", completedLessons: 0, totalLessons: 4, mastery: 0, attempts: 0 },
        { topicSlug: "stacks", completedLessons: 0, totalLessons: 4, mastery: 0, attempts: 0 },
        { topicSlug: "queues", completedLessons: 0, totalLessons: 4, mastery: 0, attempts: 0 },
        { topicSlug: "binary-search", completedLessons: 0, totalLessons: 4, mastery: 0, attempts: 0 },
        { topicSlug: "recursion", completedLessons: 0, totalLessons: 4, mastery: 0, attempts: 0 },
      ];

      // Interview goal prioritizes binary-search, recursion, stacks
      const recsInterview = getRecommendations(emptyRoadmap, "en", "interview");
      expect(recsInterview.map((r) => r.topicSlug)).toEqual([
        "binary-search",
        "recursion",
        "stacks",
      ]);
      expect(recsInterview[0].reason).toContain("Core interview pattern");

      // Scratch goal prioritizes arrays, linked-list, stacks
      const recsScratch = getRecommendations(emptyRoadmap, "en", "scratch");
      expect(recsScratch.map((r) => r.topicSlug)).toEqual([
        "arrays",
        "linked-list",
        "stacks",
      ]);
      expect(recsScratch[0].reason).toContain("starting from scratch");

      // Foundations goal prioritizes arrays, stacks, queues
      const recsFoundations = getRecommendations(emptyRoadmap, "en", "foundations");
      expect(recsFoundations.map((r) => r.topicSlug)).toEqual([
        "arrays",
        "stacks",
        "queues",
      ]);

      // Weak topics override unattempted order regardless of goal
      const recsWithWeak = getRecommendations(emptyRoadmap, "en", "interview", ["queues"]);
      expect(recsWithWeak[0].topicSlug).toBe("queues");
    });

    it("provides bilingual reasons in Hindi when requested", () => {
      const emptyRoadmap = [
        { topicSlug: "arrays", completedLessons: 0, totalLessons: 4, mastery: 0, attempts: 0 },
      ];
      const recsHi = getRecommendations(emptyRoadmap, "hi", "interview");
      expect(recsHi[0].reason).toContain("पैटर्न");
    });
  });

  describe("4. Unified Content Architecture & Language Isolation", () => {
    it("indexes content in DynamoDB and lists catalog", async () => {
      const articleIndexEn = await getContentIndex("article", "arrays", "en");
      expect(articleIndexEn).not.toBeNull();
      expect(articleIndexEn?.s3Key).toBe("articles/arrays/en.json");
      expect(articleIndexEn?.language).toBe("en");

      const blogIndexHi = await getContentIndex(
        "blog",
        "why-time-complexity-matters",
        "hi",
      );
      expect(blogIndexHi).not.toBeNull();
      expect(blogIndexHi?.s3Key).toBe("blogs/why-time-complexity-matters/hi.json");

      const blogs = await listContentIndices("blog", "en");
      expect(blogs.length).toBeGreaterThanOrEqual(3);
    });

    it("retrieves localized articles with strict language isolation", async () => {
      const articleEn = await getLessonContent("arrays", "en");
      const articleHi = await getLessonContent("arrays", "hi");

      expect(articleEn.language).toBe("en");
      expect(articleEn.title).toContain("Arrays");
      expect(articleHi.language).toBe("hi");
      expect(articleHi.title).toContain("ऐरे");

      // Cross-language isolation: headings and text must not cross-pollute
      expect(articleEn.sections[0].heading).not.toEqual(articleHi.sections[0].heading);
    });

    it("retrieves localized blogs and handles non-existent slugs gracefully", async () => {
      const blogEn = await getBlogPost("why-time-complexity-matters", "en");
      const blogHi = await getBlogPost("why-time-complexity-matters", "hi");

      expect(blogEn).not.toBeNull();
      expect(blogEn?.language).toBe("en");
      expect(blogHi).not.toBeNull();
      expect(blogHi?.language).toBe("hi");

      // Non-existent slug returns null (triggers 404 in UI)
      const missing = await getBlogPost("non-existent-blog-slug-999", "en");
      expect(missing).toBeNull();

      // Listing blogs returns all published posts
      const listEn = await listBlogPosts("en");
      expect(listEn.length).toBeGreaterThanOrEqual(3);
      expect(listEn.every((p) => p.language === "en")).toBe(true);
    });

    it("retrieves language-aware mindmaps with distinct nodes per language", async () => {
      const mmEn = await getOrGenerateMindmap("arrays", "en");
      const mmHi = await getOrGenerateMindmap("arrays", "hi");

      expect(mmEn.language).toBe("en");
      expect(mmHi.language).toBe("hi");
      expect(mmEn.nodes.length).toBeGreaterThan(0);
      expect(mmHi.nodes.length).toBeGreaterThan(0);

      // Hindi mindmap root label must be Hindi
      const rootHi = mmHi.nodes.find((n) => n.id === "root");
      expect(rootHi?.label).toContain("ऐरे");
    });

    it("handles missing topic lesson content with a non-crashing localized fallback", async () => {
      const fallbackEn = await getLessonContent("unknown-geometry", "en");
      expect(fallbackEn).toBeDefined();
      expect(fallbackEn.title).toContain("Understanding unknown-geometry");

      const fallbackHi = await getLessonContent("unknown-geometry", "hi");
      expect(fallbackHi).toBeDefined();
      expect(fallbackHi.title).toContain("को समझना");
    });
  });
});
