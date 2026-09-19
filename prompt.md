# bodh. Project Prompt

You are working inside the bodh. codebase, a personalized learning platform for computer science concepts such as data structures and algorithms. The product is designed for learners aged 15-20, supports English and Hindi, and blends lessons, quizzes, adaptive recommendations, and AI-powered teaching feedback into a simple learning flow.

## Project goal

Build and improve a polished learning experience that helps students understand difficult CS topics through:

- localized lesson content in English and Hindi
- topic-based learning paths
- AI-generated practice quizzes
- post-quiz reflection and feedback
- adaptive recommendations based on performance
- a teaching style and progress model that evolves over time

The app should feel calm, approachable, and educational rather than generic or overly complex.

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- AWS SDK for Bedrock, DynamoDB, and S3
- Resend for email verification
- Node.js runtime
- Local fallback logic for content and AI responses when AWS or AgentCore is unavailable

## Main workspace layout

- `my-app/` — the application itself
- `my-app/src/app/` — Next.js pages and API routes
- `my-app/src/components/` — UI and feature components
- `my-app/src/lib/` — AWS, AI, learning, auth, and recommendation logic
- `my-app/src/config/` — supported languages and topics metadata
- `my-app/src/types/` — domain models for students, progress, quiz, learning content
- `my-app/content/seed/` — lesson content per topic and language
- `my-app/public/` — static assets and icons
- `my-app/scripts/` — storage and content maintenance scripts

## Core product flows

The app is structured around a learning journey:

1. Sign in / authenticate via email code
2. Choose language and starting point
3. Browse learning topics
4. Read localized article content
5. Explore mind maps and concept explanations
6. Take topic quiz
7. Review score, strengths, and weaknesses
8. Receive AI-generated teaching feedback
9. Choose or adjust a teaching style
10. Continue learning with recommendations and progress tracking

Key routes:

- `/` — marketing/home landing page
- `/about` — product/about page
- `/onboarding` — onboarding flow
- `/onboarding/language` — language selector
- `/learn` — learning library
- `/learn/[topic]` — topic page
- `/learn/[topic]/article` — lesson article view
- `/learn/[topic]/mindmap` — visual concept view
- `/learn/[topic]/quiz` — quiz exercise
- `/dashboard` — dashboard with progress and recommendations
- `/auth` — email sign-in / verification

API routes:

- `/api/learn`
- `/api/progress`
- `/api/quiz/generate`
- `/api/quiz/submit`
- `/api/recommendation`
- `/api/student`
- `/api/topics`
- `/api/auth/request-code`
- `/api/auth/verify`
- `/api/auth/me`
- `/api/teach`

## Important domain concepts

### Student model

Student records include identity, language preference, onboarding state, teaching style, and progress metadata.

### Progress model

Progress should track:

- topic completion
- quiz attempts
- recent performance
- strengths and weaknesses
- teaching style alignment
- last activity timestamps

### Learning content model

Each lesson should support localized content, concept structure, and visualizations such as mind maps.

### AI teaching layer

The AI logic should assist with:

- quiz generation
- explanation generation
- personalized feedback after quiz attempts
- recommendations based on weak areas
- teaching strategy adjustments

When AWS or AgentCore is unavailable, the app should gracefully fall back to local logic so the product still functions.

## Important files and responsibilities

- `my-app/src/lib/aws/bedrock.ts` — model invocation and AI integration
- `my-app/src/lib/aws/dynamodb.ts` — persistence for student, roadmap, and auth data
- `my-app/src/lib/aws/s3.ts` — content retrieval/upsert for lessons and mind maps
- `my-app/src/lib/ai/quiz.ts` — quiz generation logic
- `my-app/src/lib/ai/feedback.ts` — feedback generation after submissions
- `my-app/src/lib/ai/prompts.ts` — centralized prompt definitions
- `my-app/src/lib/learning/content.ts` — content loading logic
- `my-app/src/lib/learning/recommendation.ts` — recommendation engine
- `my-app/src/lib/learning/roadmap.ts` — roadmap progression logic
- `my-app/src/lib/agentcore/teaching.ts` — multi-agent teaching pipeline
- `my-app/src/app/api/teach/route.ts` — teaching orchestration endpoint
- `my-app/src/config/topics.ts` — supported learning topics
- `my-app/src/config/languages.ts` — supported languages
- `my-app/content/seed/*.json` — local seed content for topics and languages

## Setup and development commands

From the project root:

```bash
cd my-app
npm install
npm run dev
```

Useful commands:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Environment variables

The app supports AWS-backed features but should still remain usable without them.

Required or commonly used variables:

- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `AWS_DYNAMODB_TABLE`
- `AWS_AUTH_TABLE`
- `BEDROCK_MODEL_ID`
- `AUTH_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `AGENTCORE_RUNTIME_URL`

If email verification or AWS integrations are not configured, the app should log values locally or use safe fallback behavior rather than crashing.

## Coding expectations

- Prefer TypeScript-safe patterns and clearly typed models.
- Keep the app maintainable and product-oriented rather than over-abstracted.
- Respect the existing Next.js App Router conventions.
- Handle missing configuration gracefully.
- Favor simple, readable logic with small reusable helpers.
- Preserve the educational tone of the product.
- Keep content and prompts localized and learner-friendly.

## Quality bar

When making changes:

- preserve the learning flow and UX
- keep content accessible in English and Hindi
- maintain local fallback behavior when external services are unavailable
- avoid breaking onboarding, quiz, or progress flows
- keep API responses predictable and easy to consume by frontend components
- prefer stable, testable logic over clever but fragile abstractions

## Design principles

- Make difficult concepts feel approachable.
- Keep the student experience calm and focused.
- Personalize learning without making the app feel noisy or complex.
- Ensure AI assistance supports learning rather than replacing it.
- Consider both production deployments and local development usability.

## Working priorities

When asked to implement or fix something in this repo, prioritize the following order:

1. Understand the user-facing learning flow affected.
2. Locate the relevant API, service, or component.
3. Preserve data contracts and TypeScript types.
4. Update logic with minimal, surgical changes.
5. Validate that the behavior still works in the app context.

## Summary

This is a product-focused CS learning app built on Next.js and AWS services. The codebase combines educational content, AI-assisted feedback, adaptive learning pathways, and local fallback behavior. The goal is to create a personalized, beginner-friendly DSA learning experience that feels calm, useful, and trustworthy.

Use this repository as a real-world learning product, not just a generic app scaffold. Keep the product context in mind in every change.
