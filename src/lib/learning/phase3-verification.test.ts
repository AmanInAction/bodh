import { describe, it, expect } from "vitest";
import {
  generateQuiz,
  toPublicQuestions,
  createQuizSessionToken,
  resolveAuthoritativeQuestions,
  gradeQuizSubmission,
  generateTargetedRetestQuestion,
} from "@/lib/ai/quiz";
import {
  generateFeedback,
  selectEvidenceBasedStyle,
} from "@/lib/ai/feedback";
import {
  runTeachingTeam,
} from "@/lib/agentcore/teaching";
import {
  getLessonContent,
} from "@/lib/learning/content";
import {
  updateTopicScore,
  getStudentRecord,
} from "@/lib/aws/dynamodb";
import { getRecommendations } from "@/lib/learning/recommendation";
import { getBedrockModelId } from "@/lib/aws/bedrock";

describe("Phase 3 Verification — Adaptive AI Teaching System & Learning Intelligence", () => {
  describe("Objective A: Bedrock Model Provider & Service Standardization", () => {
    it("provides task-specific configurable Bedrock model IDs", () => {
      const quizModel = getBedrockModelId("quiz");
      const assessModel = getBedrockModelId("assessment");
      const teachModel = getBedrockModelId("explanation");
      const recModel = getBedrockModelId("recommendation");

      expect(quizModel).toBeDefined();
      expect(assessModel).toBeDefined();
      expect(teachModel).toBeDefined();
      expect(recModel).toBeDefined();
    });
  });

  describe("Objective B: Zero Mind Maps in Product", () => {
    it("ensures lesson content has no mindmap references", async () => {
      const articleEn = await getLessonContent("arrays", "en");
      const articleHi = await getLessonContent("arrays", "hi");

      expect(JSON.stringify(articleEn)).not.toContain("mindmap");
      expect(JSON.stringify(articleHi)).not.toContain("mindmap");
    });
  });

  describe("Objective C — Agent 1: Quiz & Testing", () => {
    it("generates grounded quiz questions with learning objectives and concept metadata", async () => {
      const questions = await generateQuiz("arrays", "en");
      expect(questions.length).toBe(5);

      for (const q of questions) {
        expect(q.id).toBeDefined();
        expect(q.prompt).toBeTruthy();
        expect(q.options.length).toBe(4);
        expect(typeof q.answer).toBe("number");
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(4);
        expect(q.concept).toBeTruthy();
        expect(q.explanation).toBeTruthy();
      }
    });

    it("masks answers on the client via toPublicQuestions", async () => {
      const questions = await generateQuiz("stacks", "en");
      const publicQs = toPublicQuestions(questions);

      expect(publicQs.length).toBe(questions.length);
      for (const pq of publicQs) {
        expect(pq.id).toBeTruthy();
        expect(pq.prompt).toBeTruthy();
        expect(pq.options.length).toBe(4);
        expect(pq.concept).toBeTruthy();
        // Crucial: answer key and explanation must NOT be exposed
        expect((pq as unknown as Record<string, unknown>).answer).toBeUndefined();
        expect((pq as unknown as Record<string, unknown>).explanation).toBeUndefined();
      }
    });

    it("creates a signed JWT quiz token and grades submissions server-side authoritatively", async () => {
      const questions = await generateQuiz("queues", "en");
      const token = await createQuizSessionToken("queues", "en", questions);

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(20);

      const resolved = await resolveAuthoritativeQuestions("queues", "en", token);
      expect(resolved.length).toBe(5);

      // Student answers: Q0 correct, Q1 wrong, Q2 correct, Q3 wrong, Q4 correct
      const submittedAnswers: number[] = [
        resolved[0].answer,
        (resolved[1].answer + 1) % 4, // wrong
        resolved[2].answer,
        (resolved[3].answer + 1) % 4, // wrong
        resolved[4].answer,
      ];

      const graded = gradeQuizSubmission(resolved, submittedAnswers);
      expect(graded.score).toBe(60); // 3 out of 5 = 60%
      expect(graded.correct).toBe(3);
      expect(graded.total).toBe(5);
      expect(graded.gradedQuestions.length).toBe(5);
      expect(graded.missedConcepts).toContain(resolved[1].concept);
      expect(graded.missedConcepts).toContain(resolved[3].concept);
    });

    it("generates a targeted re-test question for a specific weak concept", async () => {
      const retest = await generateTargetedRetestQuestion(
        "binary-search",
        "mid calculation",
        "en",
        "Integer overflow with (low + high) / 2",
      );

      expect(retest.id).toBeTruthy();
      expect(retest.prompt).toBeTruthy();
      expect(retest.options.length).toBe(4);
      expect(retest.concept.toLowerCase()).toContain("mid calculation");
      expect(typeof retest.answer).toBe("number");
      expect(retest.explanation).toBeTruthy();
    });
  });

  describe("Objective C — Agent 2: Evidence-Based Assessment", () => {
    it("generates structured assessment contract without hallucinating misconceptions", async () => {
      const assessment = await generateFeedback(
        "arrays",
        50,
        1,
        2,
        "en",
        ["dynamic resizing"],
        {
          masteredConcepts: ["index access"],
          goal: "foundations",
        },
      );

      expect(assessment.strengths.length).toBeGreaterThan(0);
      expect(assessment.weakConcepts).toContain("dynamic resizing");
      expect(assessment.recommendedAction).toBeDefined();
      expect(assessment.masteryEvidence).toBeDefined();
      expect(assessment.confidence).toBeGreaterThanOrEqual(0);
      expect(assessment.confidence).toBeLessThanOrEqual(100);
      expect(assessment.reasoningSummary).toBeTruthy();
    });

    it("selects evidence-based teaching style tailored to student situation", () => {
      // 0 score or beginner -> simple
      const style1 = selectEvidenceBasedStyle(0, ["all"], undefined, "scratch");
      expect(style1).toBe("simple");

      // Interview prep goal with moderate score -> interview style
      const style2 = selectEvidenceBasedStyle(60, ["trade-offs"], undefined, "interview");
      expect(style2).toBe("interview");

      // Visual mental model for pointer / boundary concepts
      const style3 = selectEvidenceBasedStyle(40, ["pointer traversal"], undefined, "foundations");
      expect(style3).toBe("visual");

      // Socratic style for high score refinement
      const style4 = selectEvidenceBasedStyle(85, ["invariants"], "interview", "foundations");
      expect(style4).toBe("socratic");
    });
  });

  describe("Objective C — Agent 3: Explain Differently (4 Distinct Styles)", () => {
    it("produces style-differentiated explanations without mind-map references", async () => {
      const styles = ["simple", "socratic", "visual", "interview"] as const;

      for (const style of styles) {
        const teaching = await runTeachingTeam(
          "Why is stack LIFO?",
          "stacks",
          style,
          "en",
          {
            weakConcepts: ["LIFO ordering"],
            assessment: {
              strengths: ["Array basics"],
              weakConcepts: ["LIFO ordering"],
              misconceptions: ["Confusing stack with FIFO queue"],
              recommendedAction: "explain_differently",
              masteryEvidence: {
                score: 40,
                correct: 2,
                total: 5,
              },
              confidence: 80,
              reasoningSummary: "Needs clear understanding of Last-In First-Out operations.",
            },
          },
        );

        expect(teaching.explanation).toBeTruthy();
        expect(teaching.explanation.toLowerCase()).not.toContain("mindmap");
        expect(teaching.explanation.toLowerCase()).not.toContain("mind map");

        if (style === "socratic") {
          // Guided questions or thoughts
          expect(teaching.explanation).toMatch(/\?|\bthink\b|\bwhat\b|\bconsider\b|\bimagine\b/i);
        }
      }
    });

    it("supports Hindi bilingual explanations with preserved technical terminology", async () => {
      const teachingHi = await runTeachingTeam(
        "Stack क्या है?",
        "stacks",
        "simple",
        "hi",
      );

      expect(teachingHi.explanation).toBeTruthy();
      // Contains Hindi characters
      expect(/[\u0900-\u097F]/.test(teachingHi.explanation)).toBe(true);
    });
  });

  describe("Objective D: Closed Learning Feedback Loop & Atomic Persistence", () => {
    it("traces quiz submit -> assessment -> updateTopicScore -> concept history persistence", async () => {
      const testStudent = "p3_loop_student@bodh.edu";

      await updateTopicScore({
        studentId: testStudent,
        language: "en",
        topicSlug: "recursion",
        score: 40,
        teachingStyle: "socratic",
        missedConcepts: ["base case termination"],
        masteredConcepts: ["call stack visualization"],
        assessment: {
          strengths: ["Call stack"],
          weakConcepts: ["base case termination"],
          misconceptions: ["Infinite recursion on negative inputs"],
          recommendedAction: "explain_differently",
          masteryEvidence: {
            score: 40,
            correct: 2,
            total: 5,
          },
          confidence: 80,
          reasoningSummary: "Missed the base case condition.",
        },
      });

      const record = await getStudentRecord(testStudent);
      expect(record).not.toBeNull();
      expect(record?.topics["recursion"]?.score).toBe(40);
      expect(record?.topics["recursion"]?.weakConcepts).toContain("base case termination");
      expect(record?.topics["recursion"]?.masteredConcepts).toContain("call stack visualization");
      expect(record?.topics["recursion"]?.lastAssessment?.weakConcepts).toContain("base case termination");

      // Verify recommendation incorporates weak concepts
      const recs = getRecommendations(
        [
          { topicSlug: "arrays", completedLessons: 1, totalLessons: 1, mastery: 90, attempts: 1 },
          { topicSlug: "recursion", completedLessons: 0, totalLessons: 1, mastery: 40, attempts: 1 },
        ],
        "en",
        "foundations",
        record?.weakTopics,
      );

      expect(recs[0].topicSlug).toBe("recursion");
    });
  });
});
