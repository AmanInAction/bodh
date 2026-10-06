# bodh. — Architectural Source of Truth

> **Status:** Active Specification  
> **Purpose:** Canonical reference for domain models, AI architecture (Google Gemini), storage contracts, security boundaries, and API specifications for **bodh.**

---

## 1. Product Vision & Core Principles

**bodh.** ("understanding" / "perception") is a calm, bilingual (English & Hindi) AI-powered computer science learning companion focused on Data Structures & Algorithms (DSA).

1. **Bilingual by Design (`en` | `hi`)**: Hindi is a first-class pedagogical experience (natural Hinglish/Devanagari technical explanations), never an afterthought. Every article, mind map, quiz, and AI coaching session is language-aware.
2. **Concept-Level Diagnosis**: Assessments diagnose *specific sub-concepts* (e.g., `"mid calculation"`, `"base case termination"`, `"pointer reassignment"`), not just aggregate percentages.
3. **Adaptive Pedagogy**: Four teaching styles adapt to the learner's goal and performance:
   - `simple`: Plain-language intuition and everyday analogies.
   - `socratic`: Guided questions that prompt the learner to derive the insight.
   - `visual`: Spatial mental models, box-and-pointer diagrams, and step-by-step state traces.
   - `interview`: Complexity trade-offs, edge cases, and structured interview communication.
4. **Zero-Crash Resilience**: Every external service (Gemini AI, S3, DynamoDB, Resend) has a deterministic, schema-compliant fallback so the learning loop never breaks.

---

## 2. Target Tech Stack & Infrastructure

| Layer | Technology | Role & Standard |
|-------|------------|-----------------|
| **Framework** | Next.js 16 (App Router, TypeScript 5) | Server Components by default; Client Components only at interactive leaves |
| **AI Engine** | **Google Gemini (`@google/genai`)** | Replaces Amazon Bedrock & AgentCore. Server-side only via `process.env.GEMINI_API_KEY` |
| **Primary AI Model** | `gemini-3.8-flash` | Used for quiz generation, post-quiz feedback, bilingual mind maps, adaptive teaching, and recommendations |
| **Database** | AWS DynamoDB (with In-Memory Fallback) | Consolidated student state (`students` / `students-records`), OTP codes (`bodh-auth`) |
| **Content Object Store** | AWS S3 + Local Seed JSON (`content/seed/`) | Bilingual articles (`articles/<slug>/<lang>.json`) and mind maps (`mindmaps/<slug>/<lang>.json`) |
| **Authentication** | Passwordless Email OTP (`jose` + `resend`) | 6-digit OTP via Resend + HTTP-only HS256 JWT session cookie (`bodh_session`) |

---

## 3. Google Gemini AI Architecture (`src/lib/ai/gemini.ts`)

### 3.1 SDK & Initialization Contract
- **Package**: `@google/genai` (strictly server-side; never imported in client components).
- **Environment Variable**: `process.env.GEMINI_API_KEY`.
- **Initialization Pattern**:
  ```ts
  import { GoogleGenAI } from "@google/genai";

  export const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  ```
- **Model Selection**:
  - Default model across all text and structured JSON tasks: `'gemini-3.8-flash'`.
  - Use `config.responseMimeType = "application/json"` and `config.responseSchema` (with `Type` from `@google/genai`) for all structured outputs.

### 3.2 AI Capability Contracts

| Capability | Module | Gemini Pattern | Output Schema |
|------------|--------|----------------|---------------|
| **Quiz Generation** | `src/lib/ai/quiz.ts` | `ai.models.generateContent` (`gemini-3.8-flash`) + `responseSchema` | `Array<{ id, prompt, options[4], answer (0-3), explanation, concept }>` |
| **Post-Quiz Diagnosis** | `src/lib/ai/feedback.ts` | `ai.models.generateContent` (`gemini-3.8-flash`) + `responseSchema` | `{ strengths: string[], weaknesses: string[], nextStep: string, confidence: number, teacher: string, followUp: string, recommendedStyle: TeachingStyle }` |
| **Adaptive Teacher** | `src/lib/agentcore/teaching.ts` | Single structured call (or SSE stream via `generateContentStream`) combining Teacher + Evaluator + Assessor | `{ explanation: string, followUp: string, recommendedStyle: TeachingStyle, confidence: number }` |
| **Bilingual Mind Map** | `src/lib/learning/content.ts` | `ai.models.generateContent` (`gemini-3.8-flash`) + `responseSchema` | `{ topicSlug: string, language: "en" \| "hi", nodes: MindmapNode[], edges: MindmapEdge[] }` |
| **Next-Topic Coach** | `src/lib/learning/recommendation.ts` | `ai.models.generateContent` (`gemini-3.8-flash`) + `responseSchema` | `Array<{ topicSlug: string, reason: string }>` |

---

## 4. Canonical Domain Models

### 4.1 Unified Student Record (`src/types/student-record.ts`)
To eliminate the split-brain bug between `students` and `students-records`, `StudentRecord` is the single source of truth for a learner's profile and progress:

```ts
export type LearningGoal = "scratch" | "foundations" | "interview";
export type TeachingStyle = "simple" | "socratic" | "visual" | "interview";
export type SupportedLanguage = "en" | "hi";

export type TopicPerformance = {
  score: number;              // Best mastery score (0-100)
  lastScore?: number;         // Most recent quiz score (0-100)
  attempts: number;           // Total quiz attempts
  completedLessons: number;   // Completed lessons count
  lastAttemptAt?: string;     // ISO-8601 timestamp
  missedConcepts?: string[];  // Concepts missed in recent attempt
  teachingStyle?: TeachingStyle;
};

export type StudentRecord = {
  studentId: string;          // Normalized email or isolated guest ID
  name: string;
  email: string;
  language: SupportedLanguage;
  preferredStyle: TeachingStyle;
  goal?: LearningGoal;
  topics: Record<string, TopicPerformance>;
  weakTopics: string[];       // Slugs where score < 60, sorted ascending
  streakDays: number;         // Consecutive calendar days active
  lastActiveDate?: string;    // YYYY-MM-DD
  loginCount: number;
  createdAt: string;
  updatedAt: number;
};
```

### 4.2 Secure Quiz Session Contract (`src/types/quiz.ts`)
- **Public Question (Sent to Client)**:
  ```ts
  export type PublicQuizQuestion = {
    id: string;
    prompt: string;
    options: [string, string, string, string];
    concept: string;
  };
  ```
- **Server-Only Answer Key**:
  - `answer: number` and `explanation: string` are held server-side (or inside an HMAC-signed `quizToken` with a 30-minute expiry) and are only revealed to the client **after** `POST /api/quiz/submit` evaluates the submission.

---

## 5. Environment Variables Specification

All environment variables are resolved through `getEnv(key)` in `src/config/env.ts`, which supports both `process.env[key]` and `process.env[\`APP_\${key}\`]`:

| Variable | Scope | Required in Prod | Description |
|----------|-------|------------------|-------------|
| `GEMINI_API_KEY` | Server | Yes | Google Gemini API key for `@google/genai` |
| `AUTH_SECRET` | Server | Yes | 32-byte base64 secret for JWT signing & OTP hashing |
| `AWS_REGION` | Server | Optional* | AWS region (`ap-south-1`) for S3 & DynamoDB |
| `AWS_ACCESS_KEY_ID` | Server | Optional* | AWS IAM access key (prefer IAM role in cloud) |
| `AWS_SECRET_ACCESS_KEY` | Server | Optional* | AWS IAM secret key |
| `AWS_S3_BUCKET` | Server | Optional* | S3 bucket name (`regional-dsa-bucket`) |
| `AWS_DYNAMODB_TABLE` | Server | Optional* | DynamoDB table for student profiles/roadmaps |
| `AWS_STUDENT_RECORD_TABLE` | Server | Optional* | Canonical DynamoDB table for student records |
| `AWS_AUTH_TABLE` | Server | Optional* | DynamoDB table for OTP verification codes |
| `RESEND_API_KEY` | Server | Optional* | Resend API key for transactional OTP emails |
| `RESEND_FROM_EMAIL` | Server | Optional* | Verified sender address |
| `ALLOW_DEMO` | Server | Optional | Enables isolated guest sessions when `"true"` |

*\*Falls back cleanly to local seed JSON / in-memory store when omitted in preview or local development.*

---

## 6. Security & API Invariants

1. **Zero Client Secret Exposure**: `GEMINI_API_KEY`, `AUTH_SECRET`, `AWS_SECRET_ACCESS_KEY`, and `RESEND_API_KEY` must never be prefixed with `NEXT_PUBLIC_` or imported into client components.
2. **Authenticated Student Routes**: Every `/api/student/*`, `/api/progress`, and `/api/recommendation` route must validate the caller's session and forbid reading or mutating another user's `studentId`.
3. **Rate Limiting**:
   - `/api/auth/request-code`: Max 1 code per 30 seconds and 5 codes per 15 minutes per email/IP; overwrites previous unexpired code cleanly without throwing `ConditionalCheckFailedException`.
   - `/api/teach` and `/api/quiz/generate`: Per-session/IP throttling to protect Gemini API quotas.
4. **Iframe-Safe Cookies**: Session and language cookies must work reliably in both standalone browsers and embedded HTTPS preview environments.
