## Phase 1 — Bilingual Product Experience

Implement **Phase 1 only**.

### 1. Read first
Before changing code, read and use:
- `development_phases.md`
- `docs/project_audit.md`
- `docs/source_of_truth.md`

Also inspect the current implementation after Phase 0.

Do not assume the architecture. Verify the existing code, routes, language state, student persistence, content loading, and AI flows first.

### 2. Main objective
Make **English/Hindi a real, persistent, app-wide product experience**, not just translated UI labels.

The canonical student state must follow `StudentRecord` from `docs/source_of_truth.md`.

### 3. Fix language state architecture
There is currently a split between `students` and `students-records`.

- Identify where both are being used.
- Make `StudentRecord` / the canonical student record the single source of truth.
- Remove duplicate/conflicting language persistence.
- Do not maintain two independent language states.
- Language changes must update the canonical student state.

### 4. Global language behavior
The `English | हिंदी` toggle must persist across:

- navigation
- page refresh
- authenticated sessions
- mobile navigation
- onboarding
- dashboard
- roadmap
- topic pages
- articles
- blogs/content where currently implemented
- mind maps
- quizzes
- quiz results
- AI explanations
- Explain Differently
- recommendations
- loading/empty/error states
- validation and accessibility labels

A user should be able to switch language and continue through the product without the language silently reverting.

### 5. Mind map language
Fix the existing language-blind mind map behavior.

Current caching/retrieval must not allow English and Hindi mind maps to overwrite each other.

Make mind map retrieval/generation language-aware, for example:

`mindmaps/<topic>/<language>.json`

Use the existing architecture and storage patterns rather than creating a separate system.

### 6. Content and AI
When the selected language is Hindi:

- learner-facing content should be Hindi/Hinglish where appropriate
- technical DSA terminology may remain in English when that is clearer/natural
- do not perform awkward literal translations
- AI explanations and Explain Differently responses must respect the selected language

When English is selected, preserve the existing English experience.

Do not migrate the AI SDK/model or redesign the AI architecture in this phase unless a change is directly required to make language selection work.

### 7. Scope boundaries
Do **not** implement unrelated Phase 2–6 work.

Do not:
- redesign the UI again
- rebuild authentication
- implement the Phase 3 AI architecture migration
- implement quiz security
- implement rate limiting/security hardening
- implement full blog/content-platform architecture
- optimize DynamoDB queries
- add unrelated features

Only make supporting changes when they are directly required for Phase 1 language functionality.

### 8. Verification
Test both languages independently.

Verify at minimum:

1. Select English → navigate through the app → refresh → English remains.
2. Select Hindi → navigate through the app → refresh → Hindi remains.
3. Logout/login → selected language remains correctly associated with the student.
4. Dashboard and learner journey use the selected language.
5. Articles/content respect language.
6. Mind maps do not share/overwrite English and Hindi cache entries.
7. Quiz UI/results respect language.
8. AI/Explain Differently respects language.
9. Mobile language toggle works.
10. No `students` vs `students-records` language inconsistency remains.

Run:

```bash
npm run lint
npm run build
```

Run the existing test command if one exists. Do not invent a test script if it does not exist.

### 9. Final report
At the end report:

- what you inspected
- what was already correct
- what you changed
- important files changed
- how the language state is now persisted
- how the `students` / `students-records` split was resolved
- how mind map language caching was fixed
- verification results
- anything genuinely deferred to Phase 2+

Do not mark Phase 1 complete unless the bilingual flow actually works end-to-end.