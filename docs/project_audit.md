# bodh. — Comprehensive Project Audit, Workflow Analysis & Scalability Report

> **Audit Date:** October 2026  
> **Scope:** End-to-end workflow mapping, architectural & security loopholes, AI layer evaluation (Bedrock → Gemini migration), and production scalability engineering.

---

## 1. Executive Summary

**bodh.** is a bilingual (English + Hindi) Data Structures & Algorithms (DSA) learning platform built on Next.js (App Router) with passwordless OTP authentication, article lessons, interactive SVG mind maps, adaptive quizzes, and a multi-style AI teaching coach.

While the core user journey is well-conceived and degrades gracefully when offline, our deep-dive audit uncovered **critical security vulnerabilities, split-brain data persistence, high-latency database and AI patterns, and dead/disconnected features** that currently prevent the platform from scaling safely in production.

> **Immediate Environment Note:** We moved your live credentials from `/.env.example` into `/.env.local` (which Next.js automatically loads at runtime and `.gitignore` excludes from version control) and sanitized `/.env.example` so secrets are never leaked to GitHub. **We strongly recommend rotating the AWS IAM access key (`AKIA3SS...`), `RESEND_API_KEY`, and `AUTH_SECRET` before public launch.**

---

## 2. Current End-to-End Application Workflow

### 2.1 Marketing & Onboarding Workflow
1. **Landing (`/` & `/about`)**: Server components resolve the language via URL search param (`?language=hi`), `bodh_lang` cookie, or default `"en"`.
2. **Onboarding (`/onboarding` → `/onboarding/language`)**:
   - User selects a learning motivation on `/onboarding` ("starting from scratch", "stronger foundations", "preparing for interviews").
   - User selects English or Hindi on `/onboarding/language`, which sets the `bodh_lang` client cookie and fires `POST /api/student` before navigating to `/learn`.

### 2.2 Authentication & Session Workflow
1. **Request OTP (`POST /api/auth/request-code`)**:
   - Validates email syntax (`src/lib/auth/email-format.ts`) and performs DNS MX/A record lookups (`src/lib/auth/validation.ts`).
   - Generates a 6-digit OTP (`src/lib/auth/store.ts`), hashes it with SHA-256 (`email:code:secret`), stores it in DynamoDB (`bodh-auth`) or in-memory Map with a 10-minute TTL, and sends the email via Resend (`src/lib/auth/email.ts`).
2. **Verify OTP (`POST /api/auth/verify`)**:
   - Validates and consumes the OTP from `bodh-auth`.
   - Checks both `students` (`getStudentProfile`) and `students-records` (`getStudentRecord`) tables to determine `isNewUser`.
   - If new user, writes initial rows to both tables (`putStudentProfile` + `putStudentRecord`).
   - Calls `recordLogin()` to increment `loginCount` and stamp `lastLoginAt`.
   - Signs a 30-day HS256 JWT (`bodh_session` HTTP-only cookie).
3. **Profile Completion (`POST /api/student`)**:
   - New users enter their name and preferred language on step 3 of `/auth`, which updates the `students` table.

### 2.3 Content & Mind Map Delivery Workflow
1. **Article View (`/learn/[topic]/article`)**:
   - Calls `getLessonContent(topic, language)` (`src/lib/learning/content.ts`).
   - Lookup order: **S3** (`articles/<topic>/<lang>.json`) → **Local Seed JSON** (`content/seed/<topic>/<lang>.json`) → **Hardcoded 1-section fallback**.
2. **Mind Map View (`/learn/[topic]/mindmap` & Article Sidebar)**:
   - Calls `getOrGenerateMindmap(topic)`.
   - Lookup order: **S3** (`mindmaps/<topic>.json`) → **LLM Generation** (parses JSON, asynchronously caches to S3) → **4-node fallback mind map**.

### 2.4 AI Teaching Workflow ("Explain Differently")
1. On `/learn/[topic]`, the learner clicks one of 4 styles (`simple`, `socratic`, `visual`, `interview`) in `ExplainDifferently.tsx`.
2. Client sends `POST /api/teach` → `runTeachingTeam()` (`src/lib/agentcore/teaching.ts`):
   - **Step 1**: Tries external `AGENTCORE_RUNTIME_URL` if configured.
   - **Step 2**: Makes **two sequential LLM calls** (Teacher prompt → Evaluator follow-up prompt).
   - **Step 3**: Falls back to deterministic template strings if the LLM call fails.
3. Client receives the full JSON payload and simulates typing character-by-character using `setTimeout`.

### 2.5 Quiz Generation, Grading & Progress Workflow
1. **Quiz Load (`/learn/[topic]/quiz`)**:
   - Server component calls `generateQuiz(topic, language)` (`src/lib/ai/quiz.ts`) on **every page request**.
   - Sends the generated 5 MCQ objects (including `answer` and `explanation`) to the client `QuizSession` component.
2. **Quiz Submission (`POST /api/quiz/submit`)**:
   - Client submits `{ topicSlug, answers, language, style, questions }`.
   - Server grades `answers` against the client-supplied `questions` array and extracts `missedConcepts`.
   - Server runs `generateFeedback()` and `runTeachingTeam()` in parallel (resulting in **3 LLM calls** per quiz submission).
   - Server updates progress in **two separate DynamoDB tables** (`updateTopicScore` in `students-records` + `recordAssessment` in `students`) and writes to local disk (`.data/bodh.json`).

---

## 3. Identified Loopholes, Bugs & Architectural Flaws

### 3.1 Critical Security Loopholes

| # | Severity | Loophole / Vulnerability | Location | Impact |
|---|----------|--------------------------|----------|--------|
| **S1** | **CRITICAL** | **Client-Side Quiz Answer Exposure & Grading Tampering** | `src/app/learn/[topic]/quiz/page.tsx`<br>`src/app/api/quiz/submit/route.ts` | `generateQuiz()` passes `answer: number` directly to `<QuizSession questions={questions} />`. Furthermore, `/api/quiz/submit` grades the quiz using `body.questions` sent by the client! Anyone can inspect React props or send fake `answer` indices in the POST body to get 100% on any topic. |
| **S2** | **CRITICAL** | **Unauthenticated Student Data Access (IDOR)** | `src/app/api/student/[id]/progress/route.ts`<br>`src/app/api/student/[id]/recommendation/route.ts` | Neither endpoint checks `readSession()`. Any unauthenticated caller can pass any user's email in `[id]` to read their scores, weak topics, and learning history. |
| **S3** | **HIGH** | **Unauthenticated & Unthrottled AI Endpoints (Cost Exhaustion / DoS)** | `src/app/api/teach/route.ts`<br>`src/app/api/quiz/generate/route.ts`<br>`src/app/api/auth/request-code/route.ts` | No session check or rate limiting on `/api/teach` or `/api/quiz/generate` (bots can drain LLM quotas), and no rate limiting on `/api/auth/request-code` (bots can exhaust Resend email quotas). |
| **S4** | **HIGH** | **OTP Re-Request Crash (`ConditionalCheckFailedException`)** | `src/lib/auth/store.ts` (Line 76) | `saveVerificationCode` uses `ConditionExpression: "attribute_not_exists(pk) OR expiresAt < :now"`. If a user requests an OTP and clicks "Send code" again within 10 minutes (e.g., typo or slow email), DynamoDB throws `ConditionalCheckFailedException` and the API crashes with HTTP 500! |
| **S5** | **HIGH** | **Shared `DEMO_SESSION` Multi-User Collision** | `src/lib/auth/session.ts` | When `ALLOW_DEMO=true`, every unauthenticated visitor maps to the same `student_001@bodh.demo` / `student_001` record in DynamoDB, overwriting each other's scores, streaks, and language settings. |
| **S6** | **MEDIUM** | **Environment Variable Naming Drift (`amplify.yml` vs `env.ts`)** | `amplify.yml`<br>`scripts/seed-s3.ts`<br>`src/config/env.ts` | `amplify.yml` greps for `app_aWs_REGION` (mixed case), `scripts/seed-s3.ts` checks `AWS_REGION` / `app_aWs_REGION`, while `src/config/env.ts` checks `APP_AWS_REGION`. |

---

### 3.2 Data Layer & Persistence Loopholes

1. **Split-Brain Dual Table Architecture (`students` vs `students-records`)**:
   - The app maintains **two redundant representations** of student progress:
     - `students` table: stores `student:<email>` (profile) and `roadmap:<email>` (`TopicProgress[]` with `completedLessons`, `mastery`, `attempts`, `teachingStyle`).
     - `students-records` table: stores `studentId` (`StudentRecord` with `topics: Record<slug, { score, attempts }>`, `weakTopics`, `loginCount`).
   - **Loophole**: During signup (`POST /api/auth/verify`), `putStudentProfile` writes `language` to `students` and `putStudentRecord` writes `language` to `students-records`. However, when the user completes step 3 of signup (`POST /api/student`) or clicks `LanguageToggle`, **only `putStudentProfile` (`students` table) is updated**! Yet `dashboard/page.tsx` reads `record?.language` from `students-records`, causing language preferences to silently desynchronize!
2. **5-Round-Trip Sequential DynamoDB Update in `updateTopicScore()` (`src/lib/aws/dynamodb.ts`)**:
   - Every quiz submission executes **5 sequential network round-trips** to DynamoDB:
     1. `UpdateCommand` to initialize top-level `topics` map.
     2. `UpdateCommand` to initialize `topics[slug]`.
     3. `UpdateCommand` with `ConditionExpression` to update score if higher.
     4. `GetCommand` to re-read the entire `StudentRecord`.
     5. `UpdateCommand` to write recomputed `weakTopics`.
   - This adds ~300–600ms of sequential DB latency and can leave `weakTopics` out of sync if step 4 or 5 fails.
3. **Incorrect Streak Calculation (`recordLogin` in `src/lib/aws/dynamodb.ts`)**:
   - `dashboard/page.tsx` displays `loginStreak = record?.loginCount ?? 1`.
   - `recordLogin()` simply increments `loginCount + 1` on every OTP login, regardless of whether the user logged in 5 times in one hour or missed 3 weeks. It is a login counter, not a daily learning streak.
4. **Ephemeral Local Disk Writes in `src/lib/learning/roadmap.ts`**:
   - `recordAssessment()` writes to `.data/bodh.json` on the local filesystem on every quiz submission. In serverless/containerized environments (Cloud Run, Amplify, Lambda), local disk is ephemeral and concurrent requests corrupt `.data/bodh.json`.

---

### 3.3 AI, Content & UX Loopholes

1. **Fragile Regex JSON Parsing Instead of Enforced Structured Schemas**:
   - `quiz.ts`, `feedback.ts`, `content.ts`, and `recommendation.ts` ask the model in plain text to "Return only valid JSON" and strip markdown fences with `.replace(/```json?\n?/gi, "")` followed by `JSON.parse()`. Any conversational preamble or trailing comma from the LLM causes `JSON.parse` to throw and triggers the static local fallback.
   - **Solution with Gemini**: Using `@google/genai` with `responseMimeType: "application/json"` and `responseSchema` guarantees syntactically valid, schema-compliant JSON every time.
2. **Missing Assessor Agent & Hardcoded Style Recommendation (`src/lib/agentcore/teaching.ts`)**:
   - `PROMPTS.assessorSystem` exists in `src/lib/ai/prompts.ts` (Lines 79–85), but **`runTeachingTeam()` never calls it**! Instead, `runTeachingTeam()` hardcodes `recommendedStyle: style` (always recommending the exact style the user already selected) and `confidence: 75`.
   - Consequently, the UI in `ExplainDifferently.tsx` (`{!streaming && recommended && recommended !== style && ...}`) **never renders** the "AI suggests trying X style next" banner!
3. **3 Sequential/Parallel LLM Calls Blocking `POST /api/quiz/submit`**:
   - Submitting a quiz triggers `generateFeedback()` (1 LLM call) + `runTeachingTeam()` (2 sequential LLM calls: Teacher → Evaluator) before returning the score to the student. If the LLM takes 3–5 seconds, the student stares at `"Checking..."` just to see their basic quiz score.
4. **Mind Maps Ignore Language (`src/lib/learning/content.ts` & `src/lib/aws/s3.ts`)**:
   - `getOrGenerateMindmap(slug)` takes no `language` parameter and caches to `mindmaps/${slug}.json`. Hindi users (`?language=hi`) receive English-only mind map nodes.
5. **Unbuffered Live LLM Call on Every Quiz Page Render (`src/app/learn/[topic]/quiz/page.tsx`)**:
   - Every visit or refresh of `/learn/[topic]/quiz` invokes the LLM during SSR with zero caching or question pool, causing slow page loads and identical/repetitive fallback questions if the LLM times out.
6. **Disconnected UI Elements & Dead Code**:
   - **Onboarding Goal Ignored**: `/onboarding/page.tsx` presents 3 choices ("starting from scratch", "stronger foundations", "preparing for interviews"), all linking directly to `/onboarding/language` without saving the choice.
   - **Hardcoded Roadmap Status Icons**: `/learn/page.tsx` uses a static `STATUS_ICONS` map (`arrays: "🟢"`, `recursion: "🔒"`) instead of computing status from the student's actual progress!
   - **Hardcoded Topic Mastery in Marketing Cards**: `src/config/topics.ts` hardcodes `mastery: 72`, `48`, `86`, etc., which `TopicCard.tsx` displays on the landing page as if the user already has 72% mastery.
   - **Orphaned AI Recommendation Route**: `GET /api/recommendation` (`getAIRecommendations`) is never called anywhere in the frontend; `dashboard/page.tsx` only calls the synchronous rule-based `getRecommendations(roadmap)`.
   - **Unused Components**: `src/components/quiz/QuizCard.tsx`, `QuizProgress.tsx`, `QuizQuestion.tsx`, `QuizResult.tsx`, `src/components/dashboard/WeaknessCard.tsx`, and `src/components/learning/RecommendationCard.tsx` are dead code.

---

## 4. What Needs to Be Done for Production Scalability

### 4.1 Migrate AI Layer from Amazon Bedrock to Google Gemini (`@google/genai`)
- Replace `@aws-sdk/client-bedrock-runtime` and `src/lib/aws/bedrock.ts` with a unified server-side Gemini service (`src/lib/ai/gemini.ts`) using `@google/genai` and `process.env.GEMINI_API_KEY`.
- Use **`gemini-3.8-flash`** as the primary model for low-latency structured generation (Quizzes, Mind Maps, Feedback, Recommendations) and streaming teaching responses.
- Enforce **Structured Outputs (`responseSchema` + `Type` enum)** on all JSON endpoints (`quiz`, `feedback`, `mindmap`, `recommendation`, and unified `teach` response) to eliminate JSON parse failures and reduce multi-step LLM round-trips (combining Teacher + Evaluator + Assessor into a single structured call or real SSE stream).

### 4.2 Consolidate Database Schema & Eliminate Multi-Hop Writes
- Unify `students` and `students-records` into a single canonical student document or single-table DynamoDB design (or Cloud SQL PostgreSQL for relational querying and analytics).
- Reduce quiz score persistence from 5 sequential DynamoDB calls + 1 S3/local write down to **1 atomic read-modify-write** operation.
- Implement real daily streak tracking by comparing `lastActivityDate` (YYYY-MM-DD in user timezone/UTC) against the current date.
- Remove `.data/bodh.json` filesystem writes in favor of the unified database repository + clean in-memory development store.

### 4.3 Close Security & Rate-Limiting Loopholes
- **Server-Side Quiz Grading**: Strip `answer` and `explanation` before passing questions to `QuizSession.tsx`. Store the generated quiz in a short-lived signed token or server cache (`quizAttemptId`) so `/api/quiz/submit` grades against trusted server state.
- **Authenticate All Protected APIs**: Enforce session validation on `/api/student/[id]/*`, `/api/teach`, and `/api/quiz/*` (ensuring `session.email === id`).
- **Fix OTP Re-Request Bug**: Remove `ConditionExpression: "attribute_not_exists(pk)..."` in `saveVerificationCode` and replace it with a proper cooldown/rate-limit check (e.g., max 1 request per 60s, max 5 per hour per email).
- **Isolated Guest/Demo Sessions**: Issue an ephemeral guest session ID (`guest_<uuid>`) in a cookie for demo users instead of sharing a single global `student_001` record.

### 4.4 Content Caching, Streaming & UX Polish
- **Bilingual Mind Map Caching**: Key mind maps by language (`mindmaps/${slug}/${language}.json`) and pass `language` to Gemini mind map generation.
- **Real Server-Sent Events (SSE) Streaming for `/api/teach`**: Use `ai.models.generateContentStream` from `@google/genai` so the student sees tokens immediately as Gemini generates them, rather than waiting for 2 blocking calls and faking typing on the client.
- **Dynamic Roadmap & Onboarding**: Wire `/learn/page.tsx` status badges (`🟢 Mastered`, `🟡 In Progress`, `⚪ Not Started`) to real student mastery scores, and persist the learner's `/onboarding` goal (`scratch` | `foundations` | `interview`) to set their initial `preferredStyle`.
