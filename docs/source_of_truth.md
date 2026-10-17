# bodh. — Architectural Source of Truth

> **Status:** Active Specification (Phase 3 Complete)  
> **Purpose:** Canonical reference for domain models, AI architecture (Amazon Bedrock), storage contracts, security boundaries, and API specifications for **bodh.**

---

## 1. Product Vision & Core Principles

**bodh.** ("understanding" / "perception") is a calm, bilingual (English & Hindi) AI-powered computer science learning platform focused on Data Structures & Algorithms (DSA) for Indian students in Classes 10–12.

1. **Bilingual by Design (`en` | `hi`)**: Hindi is a first-class pedagogical experience (natural Hinglish/Devanagari technical explanations with preserved English DSA terminology), never an afterthought. Every article, quiz, assessment, and AI coaching session is language-aware.
2. **Concept-Level Diagnosis**: Assessments diagnose *specific sub-concepts* (e.g., `"mid calculation"`, `"base case termination"`, `"pointer reassignment"`), not just aggregate percentages.
3. **Adaptive Pedagogy**: Four teaching styles adapt to the learner's goal and evidence-based assessment:
   - `simple`: Plain-language intuition and everyday analogies.
   - `socratic`: Guided questions and hints that prompt the learner to derive the insight.
   - `visual`: Verbal spatial models, ASCII/box diagrams, and step-by-step state traces. (Mind maps are completely removed).
   - `interview`: Complexity trade-offs, edge cases, and structured technical communication.
4. **Three-Agent Workflow & Closed Feedback Loop**:
   - **Agent 1 (Quiz & Testing)**: Grounded MCQs + signed session tokens + server-side authoritative grading + targeted re-test questions.
   - **Agent 2 (Assessment)**: Strict structured assessment contract (`strengths`, `weakConcepts`, `misconceptions`, `recommendedAction`, `masteryEvidence`, `confidence`, `reasoningSummary`) without hallucinated misconceptions.
   - **Agent 3 (Explain Differently)**: Multi-style targeted explanations addressing specific weak concepts and accompanied by a targeted re-test question.
5. **Zero-Crash Resilience**: Every external service (Amazon Bedrock, S3, DynamoDB, Resend) has a deterministic, schema-compliant fallback so the learning loop never breaks.

---

## 2. Tech Stack & Infrastructure

| Layer | Technology | Role & Standard |
|-------|------------|-----------------|
| **Framework** | Next.js 16 (App Router, TypeScript 5) | Server Components by default; Client Components only at interactive leaves |
| **AI Engine** | **Amazon Bedrock (`@aws-sdk/client-bedrock-runtime`)** | Converse and ConverseStream APIs via server-side AWS credentials. Configurable task-specific models |
| **Default Bedrock Model** | `amazon.nova-lite-v1:0` / `anthropic.claude-3-haiku-20240307-v1:0` | Configured per task: `quiz`, `assessment`, `explanation`, `recommendation` |
| **Database** | AWS DynamoDB (with In-Memory Fallback) | Consolidated student state (`students-records`), OTP auth codes (`bodh-auth`), content index (`bodh-content-index`) |
| **Content Object Store** | AWS S3 + Local Seed JSON (`content/seed/`) | Bilingual articles (`articles/<slug>/<lang>.json`) and blogs (`blogs/<slug>/<lang>.json`) |
| **Authentication** | Passwordless Email OTP (`jose` + `resend`) | 6-digit OTP via Resend + HTTP-only HS256 JWT session cookie (`bodh_session`) |

---

## 3. Amazon Bedrock AI Architecture (`src/lib/aws/bedrock.ts`)

### 3.1 SDK & Configuration Contract
- **Package**: `@aws-sdk/client-bedrock-runtime` (strictly server-side; never exposed to browser).
- **Environment Variables**:
  - `AWS_REGION` (default: `ap-south-1`)
  - `BEDROCK_MODEL_ID` (general default)
  - `BEDROCK_QUIZ_MODEL_ID` (task override for Agent 1)
  - `BEDROCK_ASSESSMENT_MODEL_ID` (task override for Agent 2)
  - `BEDROCK_TEACHING_MODEL_ID` (task override for Agent 3)
  - `BEDROCK_RECOMMENDATION_MODEL_ID` (task override for recommendations)
- **Converse API**: Structured generation with JSON validation and clean fallback to deterministic topic pools and algorithms if credentials or quotas are unavailable.

### 3.2 The Three-Agent Learning Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Student reads article with explicit learning objectives   │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Agent 1 (Quiz & Testing)                                 │
│    - Grounded 5-Q MCQ pool matching objectives & language   │
│    - Answer keys masked from client (toPublicQuestions)     │
│    - Signed JWT quizToken holding authoritative state       │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Server-side Authoritative Grading                        │
│    - Evaluates answers against verified question keys       │
│    - Computes score, correctCount, missed & mastered concepts│
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Agent 2 (Assessment)                                     │
│    - Generates StructuredAssessment contract                │
│    - Distinguishes observed mistakes from misconceptions    │
│    - Selects evidence-based teaching style & next step       │
│    - Persists concept history atomically to StudentRecord   │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
     Score ≥ 80% (Mastered)              Score < 80% (Needs Work)
            │                                     │
            ▼                                     ▼
┌───────────────────────────┐       ┌───────────────────────────┐
│ Next Topic Recommendation │       │ 5. Agent 3 (Teaching)     │
│ (Adaptive Roadmap)        │       │    - Targeted explanation │
└───────────────────────────┘       │    - 4 styles (simple,    │
                                    │      socratic, visual,    │
                                    │      interview)           │
                                    │    - Accompanied by fresh │
                                    │      Targeted Re-Test Q   │
                                    └─────────────┬─────────────┘
                                                  ▼
                                    ┌───────────────────────────┐
                                    │ 6. Closed Feedback Loop   │
                                    │    - Student solves re-test│
                                    │    - Evaluates improved   │
                                    │      understanding        │
                                    │    - Persists progress    │
                                    └───────────────────────────┘
```

---

## 4. Mind Maps Deprecation Note

Mind maps have been completely eliminated from bodh in Phase 3:
- Route `/learn/[topic]/mindmap` deleted.
- `MindMap.tsx` component deleted.
- Content types, S3 caches, and DynamoDB indexes stripped of mind maps.
- All learning journeys proceed through: Article -> Quiz -> Assessment -> Explain Differently -> Targeted Re-Test -> Roadmap.

---

## 5. Canonical Domain Models

### 5.1 Student Record (`src/types/student-record.ts`)
```ts
export type LearningGoal = "scratch" | "foundations" | "interview";
export type TeachingStyle = "simple" | "socratic" | "visual" | "interview";
export type SupportedLanguage = "en" | "hi";

export type ConceptEvidence = {
  concept: string;
  correctCount: number;
  incorrectCount: number;
  lastTestedAt: string;
  isMastered: boolean;
};

export type StructuredAssessment = {
  strengths: string[];
  weakConcepts: string[];
  misconceptions: string[];
  recommendedAction: "advance" | "review" | "explain_differently" | "practice_prerequisite";
  masteryEvidence: {
    score: number;
    correct: number;
    total: number;
    isRetest?: boolean;
    improvedConcepts?: string[];
  };
  confidence: number;
  reasoningSummary: string;
};

export type TopicPerformance = {
  score: number;
  lastScore?: number;
  attempts: number;
  completedLessons: number;
  lastAttemptAt?: string;
  missedConcepts?: string[];
  masteredConcepts?: string[];
  weakConcepts?: string[];
  conceptHistory?: Record<string, ConceptEvidence>;
  lastAssessment?: StructuredAssessment;
  teachingStyle?: TeachingStyle;
};
```
