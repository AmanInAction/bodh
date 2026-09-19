# bodh. Build Tasks

## Phase 1 — Types & Content Schema
- [x] Expand `src/types/student.ts` (add preferredStyle, createdAt)
- [x] Expand `src/types/progress.ts` (add attempts, lastAttemptAt, teachingStyle)
- [x] Create `src/types/content.ts` (Article, Mindmap types)

## Phase 2 — AWS Clients
- [x] Rewrite `src/lib/aws/s3.ts` (getArticle, getMindmap, putArticle, putMindmap)
- [x] Rewrite `src/lib/aws/dynamodb.ts` (student CRUD, roadmap CRUD, auth code CRUD)
- [x] Rewrite `src/lib/aws/bedrock.ts` (invokeBedrockText generic helper)
- [x] Delete `src/lib/aws/client.ts` (63-byte mystery stub)

## Phase 3 — Bedrock AI Layer
- [x] Rewrite `src/lib/ai/quiz.ts` (Bedrock-generated MCQs, local fallback)
- [x] Create `src/lib/ai/feedback.ts` (post-quiz feedback generator)
- [x] Rewrite `src/lib/agentcore/teaching.ts` (real multi-agent pipeline, language-aware)
- [x] Rewrite `src/lib/ai/prompts.ts` (all system prompts centralized)
- [x] Delete stubs: `src/lib/ai/recommendation.ts`, `src/lib/ai/explanation.ts`, `src/lib/ai/analysis.ts`

## Phase 4 — Learning Logic
- [x] Rewrite `src/lib/learning/content.ts` (async, S3 first, local fallback)
- [x] Create `src/lib/learning/recommendation.ts` (real recommendations from roadmap data)
- [x] Update `src/lib/learning/roadmap.ts` (save teachingStyle, fix DynamoDB schema)
- [x] Delete `src/lib/learning/mastery.ts` (inline trivial formula)
- [x] Delete `src/lib/learning/personalization.ts` (replaced by recommendation.ts)

## Phase 5 — API Routes
- [x] Rewrite `src/app/api/quiz/generate/route.ts`
- [x] Rewrite `src/app/api/quiz/submit/route.ts`
- [x] Rewrite `src/app/api/learn/route.ts`
- [x] Rewrite `src/app/api/recommendation/route.ts`
- [x] Check/fix `src/app/api/teach/route.ts`
- [x] Check/fix `src/app/api/student/route.ts`

## Phase 6 — UI Components
- [x] Rewrite `src/components/learning/ExplainDifferently.tsx` (real Bedrock call, streaming UI)
- [x] Rewrite `src/components/learning/MindMap.tsx` (SVG render from JSON)
- [x] Upgrade `src/components/quiz/QuizSession.tsx` (score ring, strengths/weakness chips, confidence meter)

## Phase 7 — Seed Content
- [x] `content/seed/arrays/en.json`
- [x] `content/seed/arrays/hi.json`
- [x] `content/seed/linked-list/en.json`
- [x] `content/seed/linked-list/hi.json`
- [x] `content/seed/stacks/en.json`
- [x] `content/seed/stacks/hi.json`
- [x] `content/seed/queues/en.json`
- [x] `content/seed/queues/hi.json`
- [x] `content/seed/binary-search/en.json`
- [x] `content/seed/binary-search/hi.json`
- [x] `content/seed/recursion/en.json`
- [x] `content/seed/recursion/hi.json`

## Phase 8 — Scripts & Infra
- [x] Rewrite `scripts/seed-s3.ts` (real S3 upload for articles + mindmaps)
- [x] Create `scripts/setup-aws.sh` (AWS CLI commands for DynamoDB + S3 setup)

## Phase 9 — README
- [x] Clean up `README.md` (remove boilerplate, document real product)
