# AI Mock Interviewer

A portfolio-ready interview practice app built with Next.js, Firebase, and Groq. Choose a role, experience level, and interview length, then answer or skip adaptive questions and receive a detailed assessment.

## Features

- Choose a target role, seniority, and 3, 5, or 7 questions.
- Generate adaptive behavioral, technical, and problem-solving questions.
- Submit answers for a 0–10 evaluation with feedback, strengths, and improvements.
- Skip questions without treating them as failed answers.
- Resume an in-progress interview after a refresh; session history is stored in Firestore.
- Review an overall score, answered/skipped counts, recommendations, and question-by-question feedback.

The overall score is calculated from evaluated answers only: the mean of their scores, rounded to the nearest integer from 0 to 10. Skipped questions do not contribute to the overall or adaptive difficulty score. If no answers were evaluated, the report shows **Not enough data** rather than a zero score.

## Stack

- Next.js 14 App Router and Route Handlers
- Groq chat completions API (default model: `openai/gpt-oss-120b`; configurable with `GROQ_MODEL`)
- Firebase Authentication with anonymous sign-in and Cloud Firestore

## Project structure

```text
app/
  page.js                              Interview setup
  interview/page.js                    Interview flow and session recovery
  results/page.js                      Final assessment and answer breakdown
  api/generate-question/route.js       Adaptive question endpoint
  api/evaluate-answer/route.js         Answer evaluation endpoint
  api/session/final-feedback/route.js  Final report endpoint
components/
  AnswerInput.js
  FeedbackPanel.js
  ProgressBar.js
  QuestionCard.js
lib/
  openai.js                            Server-side Groq API integration
  firebase.js                          Firebase app, auth, and Firestore setup
  session.js                           Firestore session helpers
firestore.rules                        Firestore access rules
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Firebase project. Enable **Cloud Firestore** and **Authentication**, then enable the **Anonymous** sign-in provider. Copy the Firebase web app configuration values from Project settings.

3. Create a Groq API key at https://console.groq.com/keys.

4. Copy `.env.local.example` to `.env.local` and fill in the values:

   ```env
   GROQ_API_KEY=your-groq-api-key
   GROQ_MODEL=openai/gpt-oss-120b

   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

   `GROQ_API_KEY` is used only by server-side route handlers. Do not rename it with a `NEXT_PUBLIC_` prefix or commit `.env.local`.

5. Deploy `firestore.rules` from the Firebase console or Firebase CLI, then start the development server:

   ```bash
   npm run dev
   ```

   Visit http://localhost:3000.

## Firestore security

The provided rules require an authenticated user for reads, creates, and updates, and disallow deletes. They currently do **not** verify that a user owns a specific interview document. Tighten the rules with document ownership checks before using this project with sensitive or production data.

## Verification

Run a production build with:

```bash
npm run build
```

The AI requests run through Next.js server routes; the Groq key is not sent to browser code.
