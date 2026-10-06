# bodh. — Development Phases & Implementation Source of Truth

> **Document Status:** Active  
> **Purpose:** Authoritative implementation roadmap for the bodh. project.  
> **Primary Audience:** Indian students in Classes 10–12  
> **Languages:** English + Hindi  
> **Framework:** Next.js 16 App Router + TypeScript  
> **AI:** Google Gemini via `@google/genai`  
> **Database:** AWS DynamoDB  
> **Content Storage:** AWS S3  
>
> This document supersedes the previous phase ordering where applicable.
>
> **Important:** The project is substantially implemented. Agents MUST inspect the existing implementation before modifying it. Do not rebuild working functionality unnecessarily.

---

# 1. Product Vision

## 1.1 What is bodh.?

bodh. is a calm, bilingual, AI-powered learning companion focused initially on Data Structures & Algorithms.

The product is designed primarily for:

> **Indian students in Classes 10–12 who want to learn programming, problem solving and DSA.**

The architecture must remain extensible for future audiences such as:

- College students
- Placement preparation
- Competitive programming
- Interview preparation
- Senior developers

However, the current UX MUST prioritize the Class 10–12 learner.

---

# 2. Product Experience Principles

The product should feel:

- Calm
- Educational
- Precise
- Modern
- Premium
- Approachable
- Non-intimidating
- Easy to access

The product should NOT feel like:

- A developer-only dashboard
- A terminal
- A hacker-themed application
- A technically intimidating AI tool
- A system filled with engineering terminology

## Core principle

> **Complexity belongs behind the interface.**

The underlying system can contain sophisticated AI orchestration, structured outputs, assessment logic, databases and caching.

The student should experience:

> **Learn → Practice → Understand → Improve**

---

# 3. Non-Negotiable Existing Architecture

The following behavior and architectural contracts MUST be preserved unless a phase explicitly requires their refactoring.

---

## 3.1 Technology Stack

The canonical stack is:

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| AI | Google Gemini via `@google/genai` |
| Primary Model | `gemini-3.8-flash` |
| Database | AWS DynamoDB |
| Content Store | AWS S3 |
| Authentication | Passwordless Email OTP |
| Session | HTTP-only JWT cookie |
| Email | Resend |

The existing Source of Truth defines Next.js 16, Gemini, DynamoDB, S3 and passwordless OTP as the target architecture.

---

# 4. Bilingual Architecture

English and Hindi are **first-class product experiences**.

The canonical language values are:

```ts
type SupportedLanguage = "en" | "hi";
```



Hindi MUST NOT be treated as an afterthought or a simple translation layer.

The product must support natural educational Hindi/Hinglish/Devanagari technical explanations where appropriate.

---

# 5. Global Language Toggle

A persistent English/Hindi toggle must be available throughout the product.

Example:

```text
English | हिंदी
```

or:

```text
EN | हि
```

The exact visual design will be established in Phase 0.

## Requirements

The toggle MUST:

- Clearly show the current language.
- Work from the main navigation/header.
- Persist the user's language selection.
- Work across navigation.
- Work on mobile.
- Update the actual content experience.
- Not require the user to repeatedly visit settings.

## Language must affect

- Navigation
- Landing page
- Authentication
- Onboarding
- Dashboard
- Roadmap
- Topics
- Articles
- Blogs
- Mind maps
- Quizzes
- Quiz results
- AI explanations
- Explain Differently
- Recommendations
- Loading states
- Empty states
- Errors
- Validation
- Accessibility labels

The existing audit already identifies a language synchronization problem between `students` and `students-records`; the refactor MUST eliminate that split.

---

# 6. Unified Content Architecture

A new architectural invariant applies to all large educational content:

> **S3 stores canonical content. DynamoDB stores the content index and metadata.**

This applies to:

- Articles
- Blogs
- Mind maps

---

## 6.1 S3

S3 stores the complete content object.

Conceptual structure:

```text
content/
├── articles/
│   ├── en/
│   └── hi/
│
├── blogs/
│   ├── en/
│   └── hi/
│
└── mindmaps/
    ├── en/
    └── hi/
```

The exact key structure MUST be determined after inspecting the existing S3 implementation.

---

## 6.2 DynamoDB

DynamoDB stores the searchable/indexable metadata and S3 reference.

Conceptual record:

```ts
type ContentIndex = {
  contentId: string;
  contentType: "article" | "blog" | "mindmap";
  slug?: string;
  topicSlug?: string;
  language: "en" | "hi";
  status: "draft" | "published" | "archived";
  s3Key: string;
  version?: number;
  title?: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  authorId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};
```

This is a conceptual contract. The exact DynamoDB PK/SK/GSI structure MUST be finalized against the existing database implementation.

---

# 7. Content Retrieval Contract

Content retrieval should generally follow:

```text
Request
   ↓
DynamoDB Content Index
   ↓
Resolve S3 Key
   ↓
S3
   ↓
Canonical Content
   ↓
Render
```

Large content bodies MUST NOT unnecessarily be duplicated inside DynamoDB.

---

# PHASE 0 — Product Design System & UX Foundation

**Priority: P0 — Immediate**

## Objective

Replace the current overly technical/developer-centric presentation with a calm, precise and student-friendly design system.

This phase establishes the visual language before individual feature redesign.

---

## 0.1 Design Direction

The design must combine:

### Calm educational design

- Low cognitive load
- Clear hierarchy
- Friendly language
- Comfortable spacing
- Focused interactions

### Premium productivity design

- Precise layouts
- High-quality typography
- Restrained visual effects
- Consistent components
- Professional appearance

---

## 0.2 Avoid

Do NOT introduce:

- Excessive neon colors
- Terminal aesthetics
- Hacker aesthetics
- Excessive gradients
- Excessive 3D effects
- Excessive animations
- Dense developer dashboards
- Unnecessary technical terminology

---

## 0.3 Design System

Define reusable standards for:

- Typography
- Colors
- Spacing
- Containers
- Cards
- Buttons
- Inputs
- Forms
- Navigation
- Tabs
- Dialogs
- Badges
- Progress
- Loading
- Empty states
- Error states
- Toasts
- Mobile navigation

---

## 0.4 Learner-Facing Terminology

Internal implementation concepts must not unnecessarily appear in the UI.

Examples:

| Internal | Learner-facing |
|---|---|
| Concept Diagnosis | What you need to work on |
| Topic Performance | Your progress |
| Weak Topics | Topics to practice |
| Mastery Score | Understanding |
| Generate Recommendation | What to learn next |
| Tester | Do not expose |
| Assessor | Do not expose |
| Explainer | Do not expose |

---

## 0.5 Acceptance Criteria

- A Class 10–12 student can understand the UI without technical expertise.
- Major screens follow one design system.
- Mobile and desktop experiences are consistent.
- Primary actions are obvious.
- Technical implementation terminology is hidden from learners.

---

# PHASE 1 — Bilingual Product Experience

**Priority: P0 — Immediate**

## Objective

Make English and Hindi fully functional across the entire application.

---

## 1.1 Language Persistence

The selected language MUST persist across:

```text
Landing
↓
Onboarding
↓
Dashboard
↓
Learn
↓
Topic
↓
Quiz
↓
AI Teaching
↓
Blogs
↓
Mind Maps
```

---

## 1.2 Data Synchronization

There must be one authoritative language state.

The previous implementation contains a split where language can be updated in `students` while the dashboard reads from `students-records`.

This MUST be resolved.

The canonical `StudentRecord` contains:

```ts
language: SupportedLanguage;
preferredStyle: TeachingStyle;
goal?: LearningGoal;
```



---

## 1.3 Natural Hindi

Hindi content should prioritize comprehension.

Technical programming terms may remain in English where appropriate.

Example:

> Binary Search में `mid` कैसे काम करता है?

is preferable to forcing unnatural translations.

---

## 1.4 Acceptance Criteria

- Language toggle works globally.
- Language persists.
- Dashboard reflects language immediately.
- AI responds in selected language.
- Articles work in both languages.
- Blogs work in both languages.
- Mind maps work in both languages.
- Quizzes work in both languages.
- Explain Differently works in both languages.

---

# PHASE 2 — Learning Journey & Content Platform

**Priority: P0 — Immediate**

## Objective

Create one coherent learning journey and establish the unified content platform.

---

# 2.1 Learning Journey

The primary journey should be:

```text
Landing
   ↓
Onboarding
   ↓
Learning Goal
   ↓
Language
   ↓
Roadmap
   ↓
Topic
   ↓
Learn
   ↓
Practice
   ↓
Review
   ↓
Improve
   ↓
Next Topic
```

---

# 2.2 Onboarding

Existing learning goals remain:

```ts
type LearningGoal =
  | "scratch"
  | "foundations"
  | "interview";
```

These correspond conceptually to:

- Starting from scratch
- Stronger foundations
- Preparing for interviews

The existing audit identifies that onboarding currently displays these choices but does not properly persist the selected goal.

The selected goal MUST:

1. Be persisted.
2. Become part of the student's canonical record.
3. Influence initial teaching preferences.
4. Be available to the recommendation/teaching system.

---

# 2.3 Dashboard

The dashboard must clearly answer:

1. Where am I?
2. What have I learned?
3. What should I do next?

Prioritize:

- Continue learning
- Current topic
- Progress
- Topics needing practice
- Recommended next action

Avoid overwhelming learners with analytics.

---

# 2.4 Dynamic Roadmap

Roadmap state MUST come from actual learner data.

Conceptual states:

```text
⚪ Not Started
🟡 In Progress
🟢 Well Understood
```

Do not use hardcoded mastery/status values.

The existing audit identifies hardcoded roadmap icons and fake topic mastery values as disconnected UI.

---

# 2.5 Topic Experience

Each topic should provide:

```text
Understand
   ↓
See it
   ↓
Practice
   ↓
Check Understanding
   ↓
Review Mistakes
   ↓
Improve
```

Articles, mind maps, quizzes and AI teaching should feel like parts of the same learning experience.

---

# 2.6 Articles

Existing article retrieval behavior should be preserved and refactored where necessary.

Current architecture already uses S3 for bilingual article content with local seed/fallback behavior.

Articles should follow the unified content-storage model:

```text
DynamoDB index
      ↓
S3
      ↓
Article content
```

---

# 2.7 Blogs

Introduce:

```text
/blogs
/blogs/[slug]
```

Blogs are DSA educational content written by:

- Project owner
- Authorized administrators/authors

The system MUST allow adding/editing/publishing blogs without changing application source code.

---

## Blog Features

Public blog listing:

- Title
- Excerpt
- Category
- Tags
- Author
- Published date
- Reading time
- Language
- Featured status

Blog detail:

- Stable slug
- Proper headings
- Code examples
- Images where needed
- Author
- Date
- Related content
- Language-aware content

---

## Blog Administration

Authorized users can:

- Create
- Edit
- Save draft
- Preview
- Publish
- Unpublish
- Archive
- Delete
- Change title
- Change excerpt
- Change category
- Change tags
- Change language
- Manage cover image
- Mark featured

Lifecycle:

```text
Draft
  ↓
Preview
  ↓
Published
  ↓
Archived
```

Drafts MUST never appear publicly.

---

# 2.8 Blog Storage

Full blog content MUST be stored in S3.

DynamoDB stores the index.

```text
Admin
 ↓
Blog Editor
 ↓
Blog API
 ├─────────────┐
 ↓             ↓
S3          DynamoDB
Content     Index
```

---

# 2.9 Mind Maps

Mind maps MUST also use the unified content architecture.

Full mind map content:

```text
S3
```

Mind map index:

```text
DynamoDB
```

The existing mind-map system already generates/stores mind maps through S3, but the previous implementation does not correctly distinguish language and currently caches `mindmaps/<topic>.json`. 

The new architecture must support:

```text
mindmaps/
  <topic>/
    en.json
    hi.json
```

or an equivalent versioned S3 key structure.

DynamoDB must index each language-specific mind map.

---

## 2.10 Mind Map Retrieval

```text
Request
  ↓
DynamoDB
  ↓
S3 Key
  ↓
S3
  ↓
Mind Map
  ↓
Render
```

If content is missing:

```text
DynamoDB/S3 lookup
       ↓
Gemini generation
       ↓
Validate schema
       ↓
Write S3
       ↓
Write/update DynamoDB index
       ↓
Return content
```

The system must preserve deterministic fallback behavior.

---

# PHASE 3 — AI Learning Experience & Explain Differently

**Priority: P1 — High**

## Objective

Preserve and improve the existing AI teaching experience.

**Do NOT remove or replace "Explain Differently."**

It is a core learner-facing feature.

---

# 3.1 Existing Explain Differently Flow

The current product flow is:

```text
/learn/[topic]
      ↓
ExplainDifferently.tsx
      ↓
POST /api/teach
      ↓
runTeachingTeam()
      ↓
AI explanation
```

The audit explicitly identifies this as the existing "Explain Differently" workflow.

---

# 3.2 Four Teaching Styles

The canonical teaching styles are:

```ts
type TeachingStyle =
  | "simple"
  | "socratic"
  | "visual"
  | "interview";
```



### Simple

Plain-language intuition and everyday analogies.

Learner-facing:

> **Explain simply**

---

### Socratic

Guided questions that help the learner derive the answer.

Learner-facing:

> **Help me figure it out**

---

### Visual

Mental models, diagrams, box-and-pointer representations and step-by-step state traces.

Learner-facing:

> **Show me visually**

---

### Interview

Complexity trade-offs, edge cases and structured interview communication.

Learner-facing:

> **Prepare me for interviews**

These four pedagogical modes are part of the canonical product architecture and MUST remain.

---

# 3.3 UX for Explain Differently

The interface should communicate:

> **Want to understand this another way?**

Then expose the four styles in a student-friendly manner.

The UI MUST NOT expose internal terminology such as:

- Tester
- Assessor
- Evaluator
- AgentCore
- Gemini
- Model
- Prompt

unless technically necessary in an admin/developer context.

---

# 3.4 Tester → Assessor → Explainer

The internal pedagogical flow remains:

```text
Tester
   ↓
Assessor
   ↓
Concept Diagnosis
   ↓
Explainer
   ↓
Follow-up
```

The existing Source of Truth defines concept-level diagnosis and adaptive pedagogy as core principles.

---

# 3.5 Assessor Must Actually Work

The current audit identifies an important implementation defect:

`PROMPTS.assessorSystem` exists, but `runTeachingTeam()` does not actually call the Assessor.

Instead it currently hardcodes:

```text
recommendedStyle = selected style
confidence = 75
```

Therefore the existing UI recommendation:

> "AI suggests trying X style next"

never appears.

This MUST be corrected.

The Assessor should genuinely evaluate whether another teaching style would better help the student.

---

# 3.6 AI Recommendation Behavior

Example:

Student selects:

```text
Visual
```

The system evaluates the learner and may recommend:

```text
Try Explain Simply
```

The recommendation must be based on actual assessment rather than simply returning the currently selected style.

The AI contract already defines:

```text
recommendedStyle
confidence
```

as part of the adaptive teaching response.

---

# 3.7 Streaming

`/api/teach` should support real Gemini streaming where appropriate.

The existing roadmap/audit already identifies the requirement to replace fake client-side typing with `generateContentStream`.

The user should see the explanation as it becomes available rather than waiting for the entire response and then simulating typing.

---

# 3.8 AI Structured Outputs

All structured AI operations should use:

```text
responseMimeType = application/json
responseSchema
Type
```

instead of asking Gemini to "return JSON" and then using fragile regex parsing.

The audit explicitly identifies the current regex parsing as a reliability problem.

---

# 3.9 AI Capabilities

The canonical AI capabilities are:

| Capability | Purpose |
|---|---|
| Quiz Generation | Generate practice questions |
| Post-Quiz Diagnosis | Identify strengths/weaknesses |
| Adaptive Teacher | Explain concepts |
| Mind Map | Generate bilingual concept maps |
| Next-Topic Coach | Recommend what to learn next |

The Source of Truth defines these contracts and their structured outputs.

---

# PHASE 4 — Scalability, Performance & Economic Viability

**Priority: P1 — High**

## Objective

Prepare bodh. for future growth without unnecessary infrastructure or AI costs.

---

# 4.1 Gemini Cost Control

Minimize unnecessary AI calls.

Requirements:

- Reuse generated content.
- Cache stable content.
- Avoid regenerating identical quizzes unnecessarily.
- Avoid unnecessary context in prompts.
- Rate-limit expensive endpoints.
- Track AI usage.
- Track approximate AI cost.
- Use deterministic fallbacks where appropriate.

---

# 4.2 Quiz Question Pool

The existing implementation generates five questions on every quiz page request, which the audit identifies as an expensive and slow pattern. 

Create language-aware quiz pools.

Conceptual structure:

```text
quizzes/
  <topic>/
    en.json
    hi.json
```

Generate/refill asynchronously where practical.

Sample questions from the pool for learner sessions.

---

# 4.3 Content Caching

Articles, blogs and mind maps should be cache-friendly.

Potential future architecture:

```text
User
 ↓
Cache / CDN
 ↓
S3
```

DynamoDB primarily identifies the content rather than serving large content bodies.

---

# 4.4 Content Versioning

Content should support versioning so future edits do not require destructive replacement.

Versioning should be considered for:

- Blogs
- Articles
- Mind maps

---

# 4.5 Database Efficiency

The canonical student state is `StudentRecord`.

The previous five-round-trip `updateTopicScore()` flow must be reduced.

The audit identifies approximately 300–600ms of unnecessary sequential DynamoDB latency.

Target:

```text
At most:
1 read + 1 atomic write
```

where the operation genuinely requires both.

---

# 4.6 Streak Correctness

`loginCount` is NOT a learning streak.

The audit identifies the current implementation as counting logins rather than consecutive active learning days.

Use:

```text
lastActiveDate
streakDays
```

with daily date comparison.

---

# 4.7 Remove Local Filesystem Persistence

`.data/bodh.json` must not be used as persistent production state.

The audit identifies local filesystem persistence as unsafe in serverless/container environments.

Use:

- DynamoDB
- In-memory fallback for local development where appropriate

---

# 4.8 Frontend Performance

Prefer:

- Server Components
- Client Components only where interaction requires them
- Lazy loading
- Optimized assets
- Minimal hydration
- Efficient data fetching
- Mobile performance

This follows the existing Next.js architecture contract.

---

# PHASE 5 — Security, Authentication & Reliability

**Priority: P1 — High**

## Objective

Close all known security vulnerabilities and ensure external-service failures do not break the learning experience.

---

# 5.1 Server-Side Quiz Security

Quiz answers and explanations MUST NOT be exposed to the browser before submission.

The canonical contract is:

```text
Client:
id
prompt
options
concept

Server:
answer
explanation
```



Use a trusted server-side quiz state or short-lived signed token.

The client must never determine its own correct answer.

The existing audit categorizes this as a critical vulnerability.

---

# 5.2 Student Authorization

Every protected student endpoint MUST verify:

```text
authenticated session
        +
requested studentId belongs to session
```

No user may access another student's:

- Progress
- Weak topics
- Recommendations
- Learning history
- Profile data

---

# 5.3 AI Endpoint Protection

Protect:

```text
/api/teach
/api/quiz/generate
```

with appropriate authentication/session rules and rate limiting.

The audit identifies unauthenticated AI endpoints as a cost-exhaustion/DoS vulnerability.

---

# 5.4 OTP Security

Requirements:

- Maximum one OTP request within cooldown window.
- Maximum request count per time window.
- New OTP overwrites previous OTP safely.
- No `ConditionalCheckFailedException` crash.
- OTP expires.
- OTP is consumed after successful verification.

The current OTP re-request crash is explicitly identified in the audit.

---

# 5.5 Guest Sessions

When demo mode is enabled:

```text
guest_<randomId>
```

must be used instead of a globally shared demo account.

The current shared demo session creates cross-user collisions.

---

# 5.6 Blog Authorization

Only authorized users may:

- Create
- Edit
- Publish
- Unpublish
- Archive
- Delete

blogs.

Public users may only retrieve:

```text
status = published
```

---

# 5.7 S3 Security

The browser must not receive unrestricted S3 write credentials.

Application APIs control content writes.

---

# 5.8 Content Consistency

Publishing content must avoid states such as:

```text
DynamoDB:
published

S3:
missing
```

or:

```text
S3:
exists

DynamoDB:
missing index
```

The implementation must define an appropriate persistence order, validation and recovery strategy.

---

# 5.9 Zero-Crash Resilience

Gemini, S3, DynamoDB and Resend failures should degrade gracefully.

The canonical architecture explicitly requires deterministic, schema-compliant fallback behavior for external services.

---

# PHASE 6 — Testing, Accessibility & Production Readiness

**Priority: P2**

## Objective

Verify the complete platform after UX, architectural, content and security refactoring.

---

# 6.1 Functional Tests

Test:

- Authentication
- OTP
- Onboarding
- Language switching
- Dashboard
- Roadmap
- Topic pages
- Articles
- Mind maps
- Blogs
- Quizzes
- Quiz grading
- Progress
- Streaks
- Recommendations
- Explain Differently
- AI teaching

---

# 6.2 Bilingual Tests

Every major workflow must work independently in:

```text
English
Hindi
```

Verify:

- UI
- Content
- State
- Routing
- AI output
- Quiz
- Blog
- Mind map
- Explain Differently

---

# 6.3 Explain Differently Tests

Test all four styles:

```text
simple
socratic
visual
interview
```

Test:

- Explanation generation
- Selected language
- Streaming
- Loading
- Error fallback
- Follow-up
- Assessor recommendation
- Recommended alternative style

Specifically verify that the AI can recommend a style different from the currently selected style.

---

# 6.4 Blog Tests

Test:

- Create
- Draft
- Edit
- Preview
- Publish
- Unpublish
- Archive
- Delete
- Public listing
- Individual blog
- Slug uniqueness
- Language
- Categories
- Tags
- Featured status
- Unauthorized actions
- Missing S3 object
- Missing DynamoDB index
- S3/DynamoDB consistency

---

# 6.5 Mind Map Tests

Test:

- English generation
- Hindi generation
- S3 storage
- DynamoDB indexing
- Retrieval
- Cache behavior
- Missing content
- Invalid index
- Version updates
- Gemini failure fallback

---

# 6.6 Security Tests

Test:

- Unauthorized APIs
- Cross-user access
- Quiz tampering
- Client-side answer exposure
- OTP abuse
- AI endpoint abuse
- Guest-session isolation
- Unauthorized blog administration
- Unauthorized S3 operations

---

# 6.7 Responsive Testing

Test:

- Mobile
- Tablet
- Desktop

Mobile must receive first-class attention because the primary audience is school students who may access bodh. from phones.

---

# 6.8 Accessibility

Verify:

- Keyboard navigation
- Focus states
- Contrast
- Screen-reader labels
- Form errors
- Heading hierarchy
- Interactive controls
- Language toggle
- Blog content
- Mind map controls

---

# 6.9 Production Checks

Before completion:

```text
npm run lint
npm run test
npm run build
```

must pass without errors.

Where practical, warnings should also be resolved rather than ignored.

---

# 7. Final Architecture

The target architecture is:

```text
                         bodh.
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
     Learning            Content              AI
        │                  │                  │
        │          ┌───────┼───────┐          │
        │          │       │       │          │
        │       Articles  Blogs  Mind Maps    │
        │          │       │       │          │
        │          └───────┼───────┘          │
        │                  │                  │
        │             Content Index           │
        │                  │                  │
        │             DynamoDB                │
        │                  │                  │
        │                  ▼                  │
        │                  S3                 │
        │                                     │
        └───────────────┬─────────────────────┘
                        │
                Gemini / AI Layer
                        │
              ┌─────────┼─────────┐
              │         │         │
           Tester    Assessor  Explainer
```

---

# 8. Canonical AI Learning Loop

The learner-facing learning loop is:

```text
Student
   ↓
Learn concept
   ↓
Practice / Quiz
   ↓
Tester
   ↓
Assessor
   ↓
Identify specific concept gap
   ↓
Explainer
   ↓
Explain Differently
   ├── Explain simply
   ├── Help me figure it out
   ├── Show me visually
   └── Prepare me for interviews
   ↓
Follow-up
   ↓
Progress Update
   ↓
Next Learning Recommendation
```

The system should diagnose specific sub-concepts rather than only returning aggregate percentages. This is a core product principle.

---

# 9. Canonical Data Principles

## Student Data

`StudentRecord` is the canonical learner state.

It contains:

- Identity
- Language
- Preferred teaching style
- Goal
- Topic performance
- Weak topics
- Streak
- Activity dates

as defined by the existing Source of Truth.

---

## Content Data

```text
S3
 ↓
Canonical content
```

```text
DynamoDB
 ↓
Content index + metadata
```

---

## AI Data

AI output must be:

- Structured
- Validated
- Language-aware
- Server-side
- Rate-limited
- Fallback-safe

---

# 10. What Must NOT Be Rebuilt

The project is already substantially implemented.

Agents MUST NOT blindly rebuild:

- Authentication
- Gemini integration
- Existing learning pages
- Existing quiz UI
- Existing mind map renderer
- Existing article renderer
- Existing Explain Differently component
- Existing AWS integrations

unless inspection shows that the implementation conflicts with this roadmap.

The audit identifies specific problems in the current implementation; those problems should be **fixed/refactored**, not used as justification for unnecessary rewrites.

---

# 11. Required Agent Workflow

Before modifying any phase:

### Step 1 — Inspect

Inspect:

- Existing source files
- Existing routes
- Existing components
- Existing AWS helpers
- Existing Gemini helpers
- Existing database schema
- Existing S3 structure
- Existing tests

### Step 2 — Compare

Compare the current implementation against:

1. This roadmap
2. `docs/source_of_truth.md`
3. `docs/project_audit.md`

### Step 3 — Identify

Classify each requirement as:

```text
Already complete
Needs modification
Missing
Broken
Deprecated
```

### Step 4 — Implement

Modify only what is required.

### Step 5 — Preserve

Do not regress working behavior.

### Step 6 — Verify

Run relevant:

```text
lint
tests
build
```

and targeted functional tests.

### Step 7 — Report

At the end of each phase report:

- What was already complete
- What was changed
- What files were modified
- What behavior changed
- What tests were run
- Any remaining issues
- Whether the phase is complete

---

# 12. Phase Dependencies

Implementation order is:

```text
PHASE 0
Design System & UX Foundation
       ↓
PHASE 1
English + Hindi Product Experience
       ↓
PHASE 2
Learning Journey + Content Platform
       ↓
PHASE 3
AI + Explain Differently
       ↓
PHASE 4
Scalability + Economic Viability
       ↓
PHASE 5
Security + Reliability
       ↓
PHASE 6
Testing + Accessibility + Production
```

However, agents may fix **critical security vulnerabilities immediately** if discovered during any phase rather than waiting for Phase 5.

---

# 13. Definition of Done

bodh. is ready for the next stage when:

### Product

A Class 10–12 Indian student can use the product without needing to understand technical system terminology.

### Language

English and Hindi provide equivalent functionality.

### Learning

The complete journey works:

```text
Learn → Practice → Understand → Improve
```

### Explain Differently

All four teaching styles work:

```text
Simple
Socratic
Visual
Interview
```

and the Assessor can genuinely recommend an alternative style.

### Content

Articles, blogs and mind maps use:

```text
S3 = canonical content
DynamoDB = index
```

### AI

Gemini provides structured, language-aware and fallback-safe responses.

### Security

Quiz answers remain server-side and protected resources enforce authorization.

### Scalability

Repeated content and AI work is cached/reused where appropriate.

### Economics

Gemini usage is measurable and unnecessary generation is minimized.

### Reliability

Gemini, S3, DynamoDB and Resend failures do not crash the learning experience.

### Quality

The application passes:

```text
lint
tests
build
```

and the major English/Hindi workflows have been manually verified.

---

# 14. Priority Summary

| Phase | Focus | Priority |
|---|---|---|
| **0** | Product Design System & UX Foundation | **P0** |
| **1** | Complete English/Hindi Product Experience | **P0** |
| **2** | Learning Journey + Blogs + Articles + Mind Maps + Content Architecture | **P0** |
| **3** | AI Learning + Explain Differently + Tester/Assessor/Explainer | **P1** |
| **4** | Scalability + Performance + Economic Viability | **P1** |
| **5** | Security + Authentication + Reliability | **P1** |
| **6** | Testing + Accessibility + Production Readiness | **P2** |

---

# 15. Final Rule

> **bodh. is a learning product first and a technology product second.**

The implementation should use sophisticated technology to make the student's experience simpler—not make the student experience the complexity of the technology.

The goal of this roadmap is therefore:

> **Preserve what works → Refactor what is weak → Add what is missing → Verify everything → Prepare for scale.**