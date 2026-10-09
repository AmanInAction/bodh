# Phase 2 — Learning Journey + Content Platform

You are implementing **Phase 2 of bodh**, an AI-powered bilingual DSA learning platform for Indian students in Classes 10–12.

Your goal is to make the learning journey genuinely data-driven and establish the planned content architecture without breaking the completed Phase 0 design system or Phase 1 bilingual experience.

## 1. Read the project documentation first

Read these files before making changes:

- `docs/development_phases.md`
- `docs/source_of_truth.md`
- `docs/project_audit.md`

Also inspect the latest Phase 0 and Phase 1 implementation.

Review the existing:
- Dashboard, roadmap and topic pages.
- StudentRecord schema and topic-score persistence.
- Learning goal and recommendation logic.
- Article, mind-map and content-loading flows.
- S3 and DynamoDB adapters, schemas and configuration.
- English/Hindi content and navigation.

Do not assume that every reported issue still exists. Verify the current implementation first.

Classify relevant functionality as **already correct, incomplete, hardcoded, broken, or missing**. Reuse working implementations and modify only what is necessary.

## 2. Objective A — Dynamic learning roadmap

The roadmap must reflect the learner's actual progress rather than displaying hardcoded mastery percentages, statuses or recommendations.

### Requirements

1. **Use real student data**
   - Read progress from the canonical `StudentRecord` and existing persisted topic scores.
   - Do not introduce a second progress store or maintain conflicting copies of student state.
   - Check how quiz submissions currently update topic scores before changing the calculation logic.

2. **Calculate meaningful topic status**
   - Determine whether a topic is not started, in progress, completed, or requires more practice, according to the existing product requirements and documented scoring rules.
   - If mastery thresholds or completion rules are already defined, use them consistently.
   - If they are not defined, inspect the existing score model and propose a simple, documented rule rather than inventing an arbitrary formula.
   - Keep topic status separate from mastery percentage where the distinction matters.

3. **Synchronize progress across the application**
   - Dashboard summaries, roadmap cards, topic pages, weak-topic lists and recommendations must use consistent progress data.
   - A successful quiz submission should update the relevant persisted score and be reflected in subsequent progress views.
   - Progress must survive page refreshes and new sessions.
   - Avoid unnecessary duplicate database reads or contradictory calculations across routes.

4. **Handle incomplete data**
   - New students should see a sensible starting state rather than fabricated mastery.
   - Missing scores must not be treated as successful completion.
   - Empty, invalid or unavailable progress data should be handled gracefully.

5. **Make the roadmap useful**
   - Clearly communicate what the student has completed, what they are learning and what they should practise next.
   - Preserve the calm, student-friendly design established in Phase 0.
   - Do not expose internal assessment or engineering terminology.

## 3. Objective B — Learning goals and personalized journey

The application supports these learning goals:

- `scratch`
- `foundations`
- `interview`

Verify that onboarding persists the selected goal and that the saved goal actually influences the learning experience.

### Requirements

1. Use the existing canonical student record and `LearningGoal` type.
2. Ensure the dashboard, roadmap and recommendation logic use the persisted goal.
3. Adapt learning priorities and suggested next steps to the selected goal, using existing content and capabilities.
4. Combine the learning goal with actual topic progress and weak-topic data. Do not make recommendations based on the goal alone.
5. Provide sensible defaults for missing or invalid goals.
6. If the product supports changing a goal later, ensure the updated preference is persisted and subsequent recommendations use it.

Do not build a new recommendation engine unnecessarily. Extend the existing implementation wherever possible.

## 4. Objective C — Unified content architecture

Implement the content architecture described in `docs/source_of_truth.md` and `docs/development_phases.md`.

**Architectural principle: S3 stores canonical content; DynamoDB indexes content and its metadata.**

### S3 responsibilities

- Store the canonical content files for supported content types.
- Follow the project's existing naming, localization and storage conventions where they are compatible with the documented architecture.
- Keep English and Hindi content separate.
- Support the existing article and mind-map rendering flows.
- Avoid making the local filesystem the production source of truth.

### DynamoDB responsibilities

Use the planned content index to store the metadata needed to discover and retrieve content, such as:

- Content identifier or slug.
- Content type, such as article, blog or mind map.
- Language.
- S3 object key.
- Title and other metadata required by the current UI.
- Publication or availability status, where required by the existing content model.

Follow the documented schema and existing DynamoDB conventions. Do not create a new table or invent a new schema before checking the current infrastructure.

### Content retrieval

Implement or complete a consistent content retrieval layer that:

1. Resolves content using its identifier, type and language.
2. Uses the DynamoDB index to locate canonical content in S3.
3. Validates identifiers and handles missing index entries or missing S3 objects.
4. Returns predictable errors or appropriate fallbacks without crashing the page.
5. Prevents English and Hindi content from overwriting or being served in place of one another.
6. Reuses existing storage adapters and mind-map language-aware caching from Phase 1 where appropriate.

Preserve the existing bilingual seed content and local development workflow. If local seed files are used as a development fallback, ensure they do not silently become the production source of truth.

Do not migrate all existing content blindly. First inspect its current location and format, then implement the smallest reliable migration or compatibility strategy required by the documented architecture.

## 5. Objective D — Blog/content experience

Complete the blog/content experience specified in the project roadmap.

### Requirements

- Implement the required blog listing and individual blog detail routes, following existing routing conventions.
- Integrate the relevant navigation entry points.
- Retrieve content through the unified content layer rather than adding an unrelated hardcoded content system.
- Support English and Hindi using the existing language architecture.
- Display appropriate titles, metadata and content using the existing design system.
- Handle invalid slugs, unpublished or missing content, empty results and storage failures gracefully.
- Use the existing article-rendering components where suitable, without forcing blog content into an incompatible schema.

Do not invent a large editorial CMS or admin dashboard unless the project documentation explicitly requires it.

## 6. Objective E — Content consistency and learner experience

Verify that the same topic and language resolve to consistent content across the application.

For example, an article opened from a topic page should agree with the language selected in the global toggle, and its associated mind map should use the same language.

Check:
- Topic titles and metadata.
- Article content.
- Mind maps.
- Blog listing and detail pages.
- Related-content links.
- Dashboard and roadmap recommendations.

Preserve the existing English/Hindi toggle, cookie synchronization and canonical student state from Phase 1. Do not reimplement language persistence.

Use natural Hindi/Hinglish appropriate for students. Technical DSA terms may remain in English when that is clearer.

## 7. Technical constraints

- Preserve the existing Next.js App Router and TypeScript architecture.
- Reuse the existing DynamoDB and S3 adapters.
- Keep server-side data access and credentials on the server.
- Validate inputs and handle AWS errors appropriately.
- Avoid duplicated business logic across pages and API routes.
- Follow existing code conventions and types.
- Do not add dependencies unless genuinely necessary.
- Do not store production content or student progress only in process memory or local files.
- Do not introduce unrelated UI redesigns or replace working components.

## 8. Scope boundaries

This phase covers the learning journey and content platform only.

Do not pull in unrelated work from later phases:

- Phase 3: Gemini SDK migration, structured AI output redesign and real SSE streaming.
- Phase 4: broad performance optimization, quiz pooling and DynamoDB latency optimization.
- Phase 5: comprehensive quiz-answer security redesign, rate limiting and other security-hardening projects.
- Phase 6: broad testing and production-readiness initiatives beyond verification needed for Phase 2.

Fix a directly related issue if it blocks Phase 2 functionality, but document unrelated findings for their appropriate phase.

## 9. Implementation workflow

Follow this sequence:

1. Inspect documentation and the current implementation.
2. Identify the actual gaps and dependencies.
3. Explain the intended changes briefly before implementing them.
4. Implement the roadmap and progress logic.
5. Connect learning goals to the existing learning journey.
6. Implement the unified content retrieval/indexing architecture.
7. Complete the blog/content routes.
8. Verify that Phase 0 and Phase 1 functionality still works.
9. Run lint, build and available tests.
10. Fix regressions introduced by your changes.

Do not rewrite working modules just to make the architecture look cleaner.

## 10. Verification checklist

Verify the following scenarios:

### Learning journey
- A new student sees an appropriate starting roadmap without fabricated progress.
- Completing a quiz updates persisted topic progress.
- The dashboard and roadmap show consistent progress after a refresh.
- Weak topics and next-step recommendations reflect actual scores.
- Different learning goals produce appropriate learning priorities.
- Missing scores or student records do not crash the experience.

### Content architecture
- Content can be discovered through the DynamoDB index and retrieved from S3.
- English and Hindi versions resolve independently.
- Articles and mind maps continue working with existing content.
- Missing index entries and missing S3 objects are handled gracefully.
- Production content retrieval does not depend on local filesystem persistence.

### Blogs
- Blog listing and detail routes work.
- Valid slugs resolve correctly.
- Invalid or missing slugs produce an appropriate not-found state.
- English/Hindi selection is respected.
- Existing navigation and responsive UI remain functional.

### Regression checks
- Authentication and student persistence still work.
- Global language selection persists across navigation and refreshes.
- Existing quiz, article, mind-map and Explain Differently flows remain functional.

Run:

`npm run lint`

`npm run build`

Run the existing test command if available. Do not invent a test script if one does not exist. Where AWS credentials or infrastructure prevent live integration testing, clearly distinguish mocked/local checks from verified live behavior.

## 11. Final completion report

Report:

1. What was already implemented.
2. What was missing, hardcoded or broken.
3. Files and modules changed.
4. The topic-progress and mastery calculation rules.
5. How learning goals affect recommendations.
6. The DynamoDB content-index schema and how it maps to S3 objects.
7. How blog listing and detail pages retrieve localized content.
8. Lint, build, test and manual verification results.
9. Any remaining limitations or work deferred to later phases.

**Completion standard:** Phase 2 is complete only when roadmap progress is driven by real persisted data, learning goals influence the learner's journey, and the documented content architecture supports the required localized content experience end-to-end.

Be precise in the completion report. Do not claim live AWS integration or end-to-end functionality unless it was actually verified.