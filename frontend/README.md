# Coding & Debugging Club — Assessment Platform (Phase 1 + Debug & Decode Extension)

Frontend-only implementation. Built with React, TypeScript, Vite, and Tailwind CSS v4. No backend, database, authentication service, or code execution is included — everything runs on in-memory frontend state, by design.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL in your browser.

To produce a production build:

```bash
npm run build
npm run preview
```

## Demo login

Single, common login page for everyone — no role selector.

**Admin account** (hardcoded for demo purposes only):
- Email: `acmw@kare.klu.in`
- Password: `acmw@2026w`

**Student login:** any valid-looking college email + a password of at least 4 characters. No real authentication yet — Phase 4 will connect real college-email auth.

## Suggested walkthrough

1. Log in as Admin.
2. **Assessment Settings** — configure the assessment name/description, overall time limit, overall submit threshold, fullscreen mode, and tab-switching protection. Nothing here defaults silently; every field must be explicitly set.
3. **Questions → Create Question** — pick a question type (Error Identification / Output Prediction / Code Completion / Programming Problem); the form reshapes itself per type. Configure marks, attempts, per-question time limit, Run Code, allowed languages, and test cases as applicable.
4. Log out, log in as a student (any email).
5. **Assessment** tab — the intro screen shows a readiness checklist; once everything above is configured and at least one question is enabled, "Start Assessment" appears.
6. The assessment runner shows the overall timer, per-question timers, tab-switch/fullscreen indicators, and independent per-question Submit buttons. The Overall Submit button only appears once remaining time drops to the configured threshold.

## What's implemented in this extension

- **Four question types** with a dynamically-reshaping admin form: Error Identification, Output Prediction, Code Completion, Programming Problem
- **Per-question configuration**: marks, attempts, time limit (none/custom h:m:s), allowed languages (4-language support: Python/C/C++/Java), Run Code (Enabled/Disabled) — nothing defaults silently
- **Assessment-level configuration**: name/description, overall time limit, overall submit availability threshold, fullscreen mode (Disabled/Optional/Required), tab-switching protection (Disabled/Warn Student/Restrict-Flag)
- **Student assessment runner**: independent overall timer + per-question timers, question navigation with live status (Not Started / In Progress / Submitted / Time Expired / Max Attempts Reached), per-question Submit (separate from Overall Submit), attempt tracking with resubmission while attempts remain, Run Code (simulated output only, never consumes an attempt), real Fullscreen API integration with fallback messaging, and real tab-switch detection via the Page Visibility API with a running switch counter
- **Overall Submit visibility rule**: hidden while remaining time > configured threshold, appears once remaining time ≤ threshold, and the assessment auto-finalizes at 00:00
- **Validation before publishing**, including the exact rule that the overall submit threshold cannot exceed the overall assessment time
- **Configuration summary** on the admin Questions list (expandable row) for at-a-glance auditing
- All Phase 1 functionality (common login, dashboards, question CRUD, responsive layout, design system) is preserved and extended, not replaced

## What's intentionally NOT implemented (future phase)

- Real multi-language compilation/execution — Run Code shows a simulated placeholder message only
- Real scoring from test-case results or MCQ correctness
- Backend enforcement of fullscreen/tab-switch policy (this phase only detects and displays; a backend will enforce it later)
- Database/backend/persistence — all state is in-memory and resets on refresh
- Real authentication

## Project structure

```
src/
  types.ts                      Question model (4 types), assessment settings, runtime session types
  lib/time.ts                   Timer/time-limit formatting helpers
  context/AppContext.tsx        Session, questions, assessment settings, and student runtime state
  components/
    Layout.tsx                  Sidebar/topbar shell
    Badges.tsx                  Difficulty/status/type/run-code badges
    HMSInput.tsx, QuestionTimeLimitInput.tsx   Time-limit controls
    CodeEditorField.tsx, LanguageCodeTabs.tsx  Code editor primitives
    QuestionShell.tsx            Shared per-question chrome (timer, run, attempts, submit)
    questionTypes/               One view component per question type
  pages/
    LoginPage.tsx, ProfilePage.tsx
    student/
      StudentDashboard.tsx, StudentQuestions.tsx
      AssessmentIntro.tsx         Readiness checklist + Start Assessment
      AssessmentRunner.tsx        Full assessment-taking experience
    admin/
      AdminDashboard.tsx, AdminQuestions.tsx
      QuestionForm.tsx            Dynamic create/edit form per question type
      AssessmentSettingsPage.tsx  Overall time/threshold/fullscreen/tab-switch config
      AdminResults.tsx
```

## Design notes

- Font: Inter for UI text, JetBrains Mono for code, numbers, timers, and status/language tags
- Palette: off-white/light-gray app background, white surfaces, deep navy sidebar, one restrained cobalt accent — no gradients, glassmorphism, or neon
- The assessment runner intentionally renders without the standard sidebar (a focused, exam-style layout), while the intro/settings/dashboard pages keep the normal shell
