# AI Mock Interviewer

A generative-AI mock interview platform: it asks adaptive interview questions,
evaluates each answer with an LLM, and produces a final feedback report.

## Features

- **Adaptive questions** — the next question's difficulty and type (behavioral,
  technical, problem-solving) is chosen based on how well the last 1–2 answers
  scored, via `lib/openai.js` → `generateNextQuestion`.
- **AI-evaluated answers** — every answer is scored 0–10 with strengths and
  concrete improvement points (`evaluateAnswer`).
- **Final feedback report** — an overall score, summary, top strengths,
  priority improvements, and recommended next steps once the session ends
  (`generateFinalFeedback`).
- **Session persistence** — each interview is stored in Firestore (`lib/session.js`)
  under `interviews/{sessionId}`, so a session survives a page refresh.

## Tech stack

- **Next.js 14** (App Router, Route Handlers for the API)
- **Groq API** (default model `openai/gpt-oss-120b` — override with `GROQ_MODEL`)
- **Firebase** (Firestore for session storage, Auth for anonymous/Google sign-in)

## Project structure

```
app/
  page.js                        Setup screen (role, seniority, question count)
  interview/page.js              Main interview loop (ask → answer → evaluate → repeat)
  results/page.js                Final report + question-by-question breakdown
  api/generate-question/route.js POST → next adaptive question
  api/evaluate-answer/route.js   POST → score + feedback for one answer
  api/session/final-feedback/route.js  POST → end-of-interview report
components/
  QuestionCard.js, AnswerInput.js, FeedbackPanel.js, ProgressBar.js
lib/
  openai.js       Server-side OpenAI calls (never imported client-side)
  firebase.js     Firebase app/auth/firestore init
  session.js      Firestore read/write helpers for interview sessions
firestore.rules    Minimal security rules (signed-in users only)
```

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Firebase project**
   - Enable **Firestore** (production or test mode) and **Authentication**
     (enable the *Anonymous* provider, and *Google* if you want that sign-in
     option too).
   - Copy the web app config values into `.env.local` (see below).
   - Deploy `firestore.rules` (or paste them into the Firebase console under
     Firestore → Rules).

3. **Get a Groq API key** from https://console.groq.com/keys.

4. **Configure environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in:

   ```
    GROQ_API_KEY=...
    GROQ_MODEL=openai/gpt-oss-120b

   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

5. **Run it**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## How the adaptive logic works

After each answer, `evaluateAnswer` returns a 0–10 score. When asking for the
next question, `generateNextQuestion` looks at the average score of the last
two answers:

- **≥ 8** → raise difficulty, push deeper
- **5–7** → hold difficulty steady, small increase
- **< 5** → ease off, ask something more foundational

This keeps the interview appropriately challenging instead of asking a fixed
question list.

## Extending this project

- Add a timer per question for a more realistic interview feel.
- Support voice input (Web Speech API) instead of typing answers.
- Let the candidate paste a job description and tailor questions to it.
- Add a history/dashboard page listing all past sessions for a signed-in user.
