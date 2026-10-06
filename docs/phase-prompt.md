# Phase 0 — Design System & UX Foundation

You are working on the **bodh.** project.

Before making any changes, read and understand these three project documents:

- `development_phases.md`
- `docs/project_audit.md`
- `docs/source_of_truth.md`

They are the source of truth for the project's roadmap, current implementation, architecture, and constraints.

## Objective

Implement **Phase 0 — Product Design System & UX Foundation**.

The goal is to establish a consistent, calm, modern and student-friendly visual system for bodh.

The primary user is a **Class 10–12 student learning programming and DSA**.

The product should feel:

- Calm
- Clear
- Educational
- Modern
- Premium
- Approachable

It should **not** feel like a developer dashboard, terminal, hacker tool, or AI engineering interface.

---

## 1. Inspect Before Coding

First inspect the existing implementation and identify:

- Existing design tokens/theme
- Global styles
- Reusable UI components
- Navigation
- Buttons
- Cards
- Forms/inputs
- Dialogs
- Tabs
- Badges
- Progress UI
- Loading/empty/error states
- Responsive behavior
- Core learner-facing pages

Also compare the current implementation with the audit and source-of-truth documents.

Do **not** rebuild existing functionality from scratch.

Reuse and improve existing components wherever possible.

---

## 2. Establish the Design System

Create or consolidate a reusable design system covering:

### Typography
Define a consistent hierarchy for:

- Page headings
- Section headings
- Card headings
- Body text
- Secondary text
- Labels
- Buttons
- Navigation
- Code

Prioritize readability and make sure the system works with both English and Hindi/Hinglish text.

### Colors
Establish semantic tokens for:

- Background
- Surface
- Primary
- Secondary
- Text
- Muted text
- Border
- Success
- Warning
- Error
- Info
- Focus

Preserve the existing brand identity where appropriate rather than replacing it with a generic template.

### Spacing & Layout
Standardize:

- Page/container widths
- Padding
- Section spacing
- Card spacing
- Grid gaps
- Border radius
- Shadows/elevation
- Responsive breakpoints

Avoid page-specific spacing systems wherever reusable tokens can be used.

---

## 3. Standardize Core Components

Create or refactor reusable components for:

- Buttons
- Inputs/forms
- Cards
- Navigation
- Tabs
- Dialogs
- Badges
- Progress indicators
- Loading states
- Empty states
- Error states
- Toasts
- Mobile navigation

Each should have consistent states such as:

- Default
- Hover
- Active
- Focus
- Disabled
- Loading

Do not create duplicate versions of components that already exist.

---

## 4. Apply the System to the Core Journey

Apply the new design system consistently to the existing learner journey:

```text
Landing
  ↓
Authentication
  ↓
Onboarding
  ↓
Dashboard
  ↓
Roadmap
  ↓
Topic
  ↓
Learning
```

The screens should feel like one coherent product rather than independently designed pages.

Do not redesign unrelated features just for the sake of changing them.

---

## 5. UX Language

Review learner-facing UI touched during this phase.

Hide unnecessary implementation terminology such as:

- Gemini
- AgentCore
- DynamoDB
- API
- Assessor
- Evaluator
- Pipeline
- Model

Use simple learner-facing language instead.

For example:

> "Preparing your explanation…"

instead of:

> "Calling Gemini…"

Errors should be human-readable and actionable. Never expose stack traces or backend errors to students.

---

## 6. Mobile & Accessibility

The design system must work across:

- Mobile
- Tablet
- Desktop

Pay particular attention to:

- Navigation
- Touch targets
- Typography
- Long text
- Tabs
- Dialogs
- Forms
- Code blocks
- Horizontal overflow

Establish accessible primitives with:

- Semantic controls
- Visible keyboard focus
- Reasonable contrast
- Proper labels
- No color-only meaning

Full accessibility work belongs to Phase 6, but Phase 0 must not introduce inaccessible components.

---

## 7. Bilingual Compatibility

Phase 1 will implement the complete bilingual experience.

For Phase 0, simply ensure the design system can accommodate:

```text
English
Hindi
Hinglish
```

without breaking layouts.

Do not assume English-length text.

Do not implement the full bilingual architecture unless required for the design-system work.

---

## 8. Strict Scope

This is a **design-system and UX foundation phase**.

Do NOT use this phase to rewrite:

- Authentication
- Gemini architecture
- Quiz generation/grading
- DynamoDB architecture
- S3 architecture
- AI teaching logic
- Recommendation logic
- Progress persistence
- Mind-map generation

The audit contains issues in these areas, but they belong to later phases unless a small change is strictly required for Phase 0.

Preserve existing functionality.

Do not introduce unnecessary dependencies or replace the existing technology stack.

---

## 9. Implementation Process

Follow:

```text
Inspect
  ↓
Compare with project documents
  ↓
Identify reusable components
  ↓
Establish design tokens
  ↓
Standardize components
  ↓
Apply to core screens
  ↓
Responsive/accessibility pass
  ↓
Regression testing
```

Prefer modifying/consolidating existing components over creating new parallel systems.

---

## 10. Verification

After implementation, run the available project checks:

```bash
npm run lint
npm run test
npm run build
```

If a script does not exist, report that rather than inventing one.

Also manually verify the core learner journey on desktop and mobile.

Make sure existing functionality still works.

---

## 11. Final Report

When finished, report:

1. What was already present
2. What you changed
3. Files modified
4. Components added/refactored
5. Screens updated
6. Verification results
7. Issues discovered but intentionally deferred to later phases

Do not claim Phase 0 is complete unless the design system is actually applied consistently to the core learner journey and the project passes the available checks.

### Core principle

> **Make the sophisticated technology disappear behind a simple learning experience.**

Do not rebuild bodh.

**Improve the foundation, preserve the functionality, and prepare the product for Phase 1.**