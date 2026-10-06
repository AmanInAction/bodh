# bodh. — PHASE 0 MASTER IMPLEMENTATION PROMPT
## Product Design System & UX Foundation

You are the implementation agent working on **bodh.**

Your task is to complete:

> **PHASE 0 — Product Design System & UX Foundation**

You have three authoritative project documents available in the repository:

```text
development_phases.md
docs/project_audit.md
docs/source_of_truth.md
```

You MUST read and understand all three before modifying code.

These documents have different purposes:

### `development_phases.md`
Defines the implementation roadmap, phase boundaries, priorities, acceptance criteria and required workflow.

### `docs/project_audit.md`
Describes the current implementation, existing workflows, known bugs, architectural flaws, security vulnerabilities, dead features and scalability problems.

### `docs/source_of_truth.md`
Defines canonical architecture, domain models, AI contracts, storage contracts and security invariants.

When these documents overlap, preserve the canonical architecture and follow the phase boundaries defined by `development_phases.md`.

---

# 1. YOUR MISSION

Transform the existing bodh. interface into a calm, precise, premium and student-friendly learning product.

The primary audience is:

> **Indian students in Classes 10–12 learning programming, problem solving and DSA.**

bodh. should feel:

- Calm
- Educational
- Precise
- Modern
- Premium
- Approachable
- Non-intimidating
- Easy to access

It should NOT feel like:

- A developer dashboard
- A terminal
- A hacker application
- An AI engineering tool
- An internal admin panel
- A technically intimidating application

The central product principle is:

> **Complexity belongs behind the interface.**

The student should experience:

> **Learn → Practice → Understand → Improve**

The underlying implementation may be complex. The learner-facing interface must not expose that complexity unnecessarily.

---

# 2. CRITICAL RULE — DO NOT REBUILD THE APPLICATION

The existing project is substantially implemented.

The audit confirms that there is already a working:

- Landing experience
- Authentication flow
- Onboarding
- Learning experience
- Article system
- Mind map system
- Quiz experience
- AI teaching / Explain Differently experience
- AWS integration
- Gemini migration architecture

Therefore:

> **DO NOT rebuild the application from scratch.**

Do not replace working functionality merely because you would implement it differently.

The development roadmap explicitly requires:

> Preserve what works → Refactor what is weak → Add what is missing → Verify everything → Prepare for scale.

For Phase 0, this means:

> **Preserve product behavior and establish the visual/UX foundation.**

---

# 3. FIRST TASK — INSPECT THE REPOSITORY

Before writing implementation code, inspect the actual codebase.

You MUST inspect:

## Application

- `src/app`
- layouts
- routes
- pages
- route groups
- server components
- client components

## Components

Inspect existing components for:

- navigation
- buttons
- cards
- forms
- inputs
- dialogs
- tabs
- badges
- progress
- loading
- errors
- empty states
- toasts
- mobile navigation

## Styling

Inspect:

- global CSS
- Tailwind configuration if present
- CSS variables
- theme configuration
- design tokens
- utility classes
- existing responsive rules
- existing typography

## Core learner surfaces

Inspect at minimum:

```text
/
 /about
 /auth
 /onboarding
 /onboarding/language
 /learn
 /learn/[topic]
 /dashboard
```

Also inspect other major learner-facing screens where they already exist.

## Existing infrastructure

Inspect enough of the existing architecture to understand boundaries, but DO NOT modify backend systems unnecessarily:

- `src/lib`
- `src/types`
- AWS helpers
- AI helpers
- auth/session helpers
- content helpers

---

# 4. SECOND TASK — COMPARE AGAINST THE THREE DOCUMENTS

After inspection, compare the implementation against:

```text
development_phases.md
docs/project_audit.md
docs/source_of_truth.md
```

Classify findings into:

```text
Already complete
Needs modification
Missing
Broken
Deprecated
```

Do NOT immediately fix everything you find.

Specifically separate:

### Phase 0 work

from:

### Later-phase work

---

# 5. STRICT PHASE BOUNDARY

Phase 0 is primarily:

> **Design System + UX Foundation**

Do NOT turn Phase 0 into a full architecture refactor.

The audit contains serious issues including:

- Client-side quiz answer exposure
- IDOR vulnerabilities
- AI endpoint rate limiting
- OTP re-request crash
- Shared demo sessions
- Split-brain student persistence
- 5-round-trip DynamoDB writes
- Incorrect streak logic
- Local filesystem persistence
- Gemini structured-output migration
- Missing Assessor
- AI streaming
- Language-aware mind maps
- Dynamic roadmap
- Onboarding goal persistence

These are real issues.

However, most belong to later phases.

DO NOT implement them simply because you noticed them during the audit.

If you discover a **critical security vulnerability** while modifying Phase 0 code, do not knowingly leave a newly exposed vulnerability. Report it and apply the smallest safe fix if necessary.

Otherwise, keep the work scoped to Phase 0.

---

# 6. DESIGN SYSTEM TO ESTABLISH

Create or refine a reusable design system covering:

```text
Typography
Colors
Spacing
Containers
Cards
Buttons
Inputs
Forms
Navigation
Tabs
Dialogs
Badges
Progress
Loading
Empty states
Error states
Toasts
Mobile navigation
```

These must be reusable standards rather than one-off styling decisions.

---

# 7. DO NOT CREATE A SECOND DESIGN SYSTEM

Before creating any new component:

1. Search for an existing equivalent.
2. Determine whether it can be improved.
3. Reuse it if possible.
4. Only create a new primitive when genuinely necessary.

Do NOT create:

```text
ButtonV2
CardV2
NewButton
NewCard
ModernCard
PremiumButton
```

simply because existing components are inconsistent.

Instead, consolidate where practical.

The objective is:

> **One coherent UI language.**

---

# 8. DESIGN DIRECTION

## Calm Educational

Prioritize:

- Low cognitive load
- Clear hierarchy
- Comfortable spacing
- Friendly language
- Readability
- Obvious actions
- Focused interactions

The student should quickly understand:

> Where am I?

> What am I learning?

> What should I do next?

---

## Premium Productivity

Use:

- Strong typography
- Intentional whitespace
- Precise layouts
- Consistent components
- Restrained visual effects
- High-quality interaction states

Premium does NOT mean visually excessive.

---

# 9. VISUAL THINGS TO AVOID

Do NOT introduce:

- Excessive neon
- Hacker aesthetics
- Terminal aesthetics
- Excessive gradients
- Excessive 3D
- Excessive shadows
- Excessive glassmorphism
- Excessive animations
- Animated backgrounds
- Particle effects
- Developer-dashboard density
- Unnecessary decorative UI

Do not turn bodh. into a "cool AI coding tool."

It is a learning product.

---

# 10. TYPOGRAPHY SYSTEM

Establish a clear hierarchy for:

```text
Display
Page heading
Section heading
Card heading
Body
Secondary body
Caption
Label
Button
Navigation
Code
```

Prioritize readability.

Do not make body text unnecessarily small.

Use comfortable line heights.

Ensure the hierarchy works on mobile.

Code should retain a monospace treatment where appropriate.

The system must also tolerate Hindi and mixed Hindi/English text.

Do not assume English text lengths.

---

# 11. COLOR SYSTEM

Establish semantic design tokens for:

```text
Background
Surface
Elevated surface
Primary
Primary hover
Secondary
Text
Muted text
Border
Success
Warning
Error
Info
Focus
```

Before choosing new colors, inspect the existing brand identity.

Preserve useful existing branding where possible.

Do not replace the application's identity with a generic UI template.

Use restraint.

---

# 12. SPACING AND LAYOUT

Establish consistent values for:

- Page padding
- Section spacing
- Card padding
- Grid gaps
- Content widths
- Container widths
- Vertical rhythm

Do not allow every page to invent its own spacing.

Create a consistent layout model.

Conceptually:

```text
Viewport
   ↓
Page container
   ↓
Content max width
   ↓
Readable content
```

---

# 13. CARDS

Standardize card behavior.

Cards should have consistent:

- Padding
- Radius
- Border
- Surface
- Elevation
- Hover behavior

But do NOT make everything a card.

Cards should help grouping and scanning.

---

# 14. BUTTONS

Create consistent variants:

```text
Primary
Secondary
Ghost/Tertiary
Destructive
```

Support:

```text
Default
Hover
Active
Focus
Disabled
Loading
```

Primary actions must be visually obvious.

Avoid multiple competing primary actions.

---

# 15. INPUTS AND FORMS

Standardize:

- Inputs
- Textareas
- Selects
- Checkboxes
- Radio controls
- Labels
- Help text
- Errors
- Disabled states
- Loading states

Errors must be human-readable.

Never expose backend errors directly to learners.

BAD:

```text
ConditionalCheckFailedException
DynamoDB request failed
Gemini API error
```

GOOD:

```text
Something went wrong. Please try again.
```

Technical details belong in logs/developer contexts.

---

# 16. NAVIGATION

Create one coherent navigation language.

Navigation must be:

- Simple
- Predictable
- Responsive
- Student-friendly

It must work on:

```text
Desktop
Tablet
Mobile
```

The learner should always understand where they are.

Do not expose internal architecture through navigation.

---

# 17. TABS

Standardize:

- Active
- Inactive
- Hover
- Focus
- Disabled

Tabs must remain usable on narrow screens.

Do not use tabs as a mechanism for hiding excessive content.

---

# 18. DIALOGS

Standardize:

- Width
- Padding
- Header
- Body
- Footer
- Overlay
- Close action
- Focus behavior
- Mobile layout

Dialogs should be simple and dismissible.

---

# 19. BADGES

Support semantic states such as:

```text
New
Completed
In Progress
Recommended
Featured
Draft
Published
```

Keep them subtle.

Do not use badges everywhere.

---

# 20. PROGRESS

Progress should feel educational.

Prefer:

```text
Your progress
Understanding
Topics to practice
Continue learning
```

Avoid exposing implementation-oriented analytics terminology.

The product roadmap specifically says learner-facing terminology should hide concepts such as:

```text
Concept Diagnosis
Topic Performance
Weak Topics
Mastery Score
Tester
Assessor
Explainer
```

Use learner-friendly equivalents.

---

# 21. LOADING STATES

Create consistent loading states.

Never expose internal implementation processes.

Do NOT show:

```text
Calling Gemini...
Running Assessor...
Executing AgentCore...
Querying DynamoDB...
Running model...
```

Prefer:

```text
Preparing your explanation…
Getting your next step ready…
Checking your understanding…
```

The exact copy should fit the context.

---

# 22. EMPTY STATES

Empty states should answer:

1. What is empty?
2. Why?
3. What can I do next?

Example:

```text
Nothing here yet

Start your first topic to begin your learning journey.

[Start learning]
```

---

# 23. ERROR STATES

Errors should be:

- Calm
- Human
- Actionable
- Non-technical

Where possible provide an action:

```text
Try again
Go back
Continue learning
```

Never expose:

- Stack traces
- AWS internals
- Database errors
- AI provider details
- Internal IDs

---

# 24. TOASTS

Standardize:

```text
Success
Info
Warning
Error
```

Toasts should be supplementary.

Do not hide important state changes only inside a toast.

---

# 25. MOBILE-FIRST QUALITY

Mobile is a first-class experience.

Review the core journey at:

```text
320px-ish
375px
390px
768px
1024px
1440px+
```

Pay special attention to:

- Navigation
- Typography
- Buttons
- Cards
- Forms
- Dialogs
- Tabs
- Progress
- Long titles
- Code
- Touch targets
- Horizontal overflow

Avoid desktop-first layouts that merely shrink.

---

# 26. ACCESSIBILITY FOUNDATION

Phase 6 contains the full accessibility verification, but Phase 0 must establish accessible primitives.

Ensure:

- Semantic buttons
- Semantic links
- Keyboard focus
- Visible focus states
- Reasonable contrast
- Form labels
- Accessible interactive controls
- No color-only meaning
- Reasonable touch targets
- Reduced-motion consideration

Do not create inaccessible primitives that Phase 6 will have to rebuild.

---

# 27. BILINGUAL-COMPATIBLE DESIGN

Phase 1 will implement complete bilingual functionality.

Phase 0 must therefore ensure the design system can support:

```ts
"en" | "hi"
```

without breaking.

Test important components with:

- English
- Hindi
- Hinglish
- Mixed technical terminology

For example:

```text
Binary Search में mid कैसे काम करता है?
```

Do not create fixed-width components that assume English-length labels.

Do not implement the full language architecture in Phase 0 unless an existing design-system issue requires it.

---

# 28. CORE SCREENS TO STANDARDIZE

Apply the design system to the major existing learner journey.

At minimum inspect and standardize:

```text
Landing
   ↓
Authentication
   ↓
Onboarding
   ↓
Language selection
   ↓
Dashboard
   ↓
Roadmap
   ↓
Topic
   ↓
Learning
```

The goal is for these screens to visually feel like the same product.

Do NOT redesign every feature in the repository during Phase 0.

---

# 29. IMPORTANT CURRENT IMPLEMENTATION CONTEXT

The audit identifies several existing UX inconsistencies.

Be aware of them, but respect Phase 0 boundaries.

Examples include:

### Onboarding goal

The current onboarding presents:

```text
Starting from scratch
Stronger foundations
Preparing for interviews
```

but the audit says the selected goal is not currently persisted.

That is primarily a later learning/data-flow concern.

For Phase 0:

- Make the UI visually coherent.
- Do not invent new persistence architecture.
- Do not attempt the full onboarding logic fix unless required by the design implementation.

---

### Roadmap

The audit says roadmap status icons are currently hardcoded.

That is a later dynamic-learning concern.

For Phase 0:

- Standardize the visual states/components.
- Do not invent fake dynamic data.
- Do not redesign the progress architecture.

---

### Marketing mastery

The audit says some marketing topic cards contain hardcoded mastery values.

Do not attempt to solve the underlying data problem in Phase 0.

If these cards are visually touched, make the presentation coherent without pretending those values represent real learner progress.

---

### AI teaching

The existing Explain Differently experience is a core product feature.

Do NOT remove it.

Do NOT replace it.

Do NOT redesign its underlying AI flow.

Phase 3 will address the AI implementation issues.

Phase 0 may standardize its UI components so they fit the new design system.

---

# 30. DO NOT TOUCH THESE SYSTEMS UNLESS REQUIRED

Do not unnecessarily modify:

- Authentication logic
- OTP storage
- JWT/session implementation
- Gemini integration
- Quiz grading
- Quiz generation
- DynamoDB schema
- S3 architecture
- Mind map generation
- AI teaching orchestration
- Recommendation algorithms
- Progress persistence
- Streak logic
- Backend APIs

These are addressed in later phases.

---

# 31. PRESERVE THE CANONICAL ARCHITECTURE

The project's canonical architecture includes:

```text
Next.js 16 App Router
TypeScript
Google Gemini via @google/genai
gemini-3.8-flash
AWS DynamoDB
AWS S3
Passwordless Email OTP
HTTP-only JWT session
Resend
```

Do not replace these technologies during Phase 0.

The Source of Truth also defines:

```text
StudentRecord
SupportedLanguage = "en" | "hi"
TeachingStyle =
  "simple" |
  "socratic" |
  "visual" |
  "interview"
```

Do not change these contracts.

---

# 32. COMPONENT ARCHITECTURE

Use the existing component architecture.

Prefer:

```text
Design tokens
      ↓
Primitive components
      ↓
Composite components
      ↓
Page-specific composition
```

Avoid:

```text
Page
 ├── random colors
 ├── random spacing
 ├── custom button
 ├── custom card
 └── custom input
```

The design system should make future phases easier.

---

# 33. IMPLEMENTATION WORKFLOW

Follow this exact sequence.

## STEP 1 — READ

Read:

```text
development_phases.md
docs/project_audit.md
docs/source_of_truth.md
```

## STEP 2 — INSPECT

Inspect the actual repository.

## STEP 3 — AUDIT

Create an internal Phase 0 classification:

```text
Already complete
Needs modification
Missing
Broken
Deprecated
```

## STEP 4 — PLAN

Determine:

- Existing tokens to keep
- Tokens to consolidate
- Components to standardize
- Components to create
- Core screens to update

Do not start with page-by-page random CSS changes.

## STEP 5 — IMPLEMENT FOUNDATIONS

Implement:

```text
Tokens
Typography
Colors
Spacing
Containers
Primitives
```

## STEP 6 — IMPLEMENT COMPONENT SYSTEM

Standardize:

```text
Buttons
Inputs
Cards
Forms
Navigation
Tabs
Dialogs
Badges
Progress
Loading
Empty
Error
Toast
Mobile navigation
```

## STEP 7 — APPLY TO CORE JOURNEY

Apply to:

```text
Landing
Authentication
Onboarding
Dashboard
Roadmap
Topic
Learning
```

## STEP 8 — RESPONSIVE PASS

Test mobile/tablet/desktop.

## STEP 9 — UX COPY PASS

Remove unnecessary technical terminology from the learner-facing surfaces you touch.

## STEP 10 — REGRESSION TEST

Verify that functionality has not been broken.

---

# 34. ENGINEERING RULES

Do not:

- Rewrite working features
- Replace the framework
- Replace the styling architecture without strong justification
- Introduce unnecessary dependencies
- Duplicate components
- Duplicate design systems
- Modify backend architecture unnecessarily
- Change database contracts
- Change AI contracts
- Remove features because they are imperfect

Prefer:

> **Small, deliberate, maintainable changes.**

---

# 35. CODE QUALITY

Follow the existing project conventions.

Use:

- TypeScript
- Existing lint rules
- Existing formatting
- Existing import conventions
- Existing component conventions

Avoid unnecessary abstractions.

A component should exist because it creates reusable value.

---

# 36. VERIFICATION

After implementation, run the project's available checks.

At minimum attempt:

```bash
npm run lint
npm run test
npm run build
```

If a script does not exist:

- Do not invent it.
- Report that it does not exist.

Also perform targeted verification of the affected UI.

Check:

```text
Desktop
Mobile
Keyboard interaction
Focus states
Long text
Hindi-compatible text
Loading states
Error states
Empty states
Navigation
Core learner journey
```

---

# 37. DO NOT CLAIM COMPLETION WITHOUT VERIFICATION

Do not say:

> "Phase 0 complete"

simply because the code compiles.

Phase 0 requires both:

### Engineering verification

and

### UX/design verification

The core learner journey should visibly feel coherent.

---

# 38. FINAL PHASE 0 ACCEPTANCE CRITERIA

Phase 0 is complete when:

## Product

A Class 10–12 student can understand the UI without technical expertise.

## Visual language

The application has one coherent visual language.

## Design system

Reusable standards exist for:

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
- Empty
- Error
- Toast
- Mobile navigation

## Consistency

Major screens use the same system.

## Actions

Primary actions are obvious.

## Terminology

Internal engineering terminology is hidden from normal learner-facing experiences.

## Responsive

The core experience works on mobile, tablet and desktop.

## Accessibility foundation

The new components have sensible keyboard, focus, contrast and semantic behavior.

## Existing functionality

Existing functionality continues to work.

## Architecture

No unnecessary backend/AI/database rewrites were introduced.

## Maintainability

Future phases can reuse the design system instead of creating page-specific UI patterns.

---

# 39. REQUIRED FINAL REPORT

When finished, report exactly:

## 1. Phase Status

```text
COMPLETE
```

or:

```text
INCOMPLETE
```

## 2. Already Complete

List relevant things that were already present.

## 3. Changed

List the actual design-system and UX changes.

## 4. Files Modified

Provide the actual file paths.

## 5. Components Added

List new reusable components, if any.

## 6. Components Refactored

List existing components that were standardized.

## 7. Screens Updated

List the learner-facing screens changed.

## 8. Behavior Preserved

Confirm which existing functionality was intentionally left untouched.

## 9. Verification

Report:

```text
npm run lint
npm run test
npm run build
```

with actual results.

Also report any manual UI checks performed.

## 10. Remaining Issues

List issues discovered but intentionally deferred to later phases.

For example:

```text
Quiz answer security → Phase 5
Student split-brain state → Phase 2/4
AI Assessor → Phase 3
AI streaming → Phase 3
Dynamic roadmap → Phase 2
Bilingual implementation → Phase 1
```

Do not silently leave discovered issues unexplained.

---

# 40. FINAL RULE

The most important rule for this phase is:

> **Do not make bodh. look like a sophisticated technology product. Make sophisticated technology disappear behind a simple learning experience.**

The final interface should make a student feel:

> "I know where I am."

> "I understand what this means."

> "I know what I should do next."

> "This feels easy to use."

The implementation should follow:

> **Inspect → Compare → Classify → Design → Implement → Preserve → Verify → Report**

Do not skip the inspection phase.

Do not blindly rebuild.

Do not scope-creep into later phases.

Build the foundation that Phases 1–6 can reliably build upon.