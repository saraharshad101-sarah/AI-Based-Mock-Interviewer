"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSession } from "@/lib/session";
import { auth, signInAsGuest, signInWithGoogle } from "@/lib/firebase";

const ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full-Stack Developer",
  "Mobile (Android) Developer",
  "Data Analyst",
  "Product Manager",
  "QA / Test Engineer",
];

const SENIORITIES = [
  { value: "junior", label: "Junior / Entry-level" },
  { value: "mid", label: "Mid-level" },
  { value: "senior", label: "Senior" },
];

const QUESTION_COUNTS = [3, 5, 7];

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState(ROLES[0]);
  const [seniority, setSeniority] = useState("mid");
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleStart(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      console.log("STEP 1: Starting interview");

      let user = auth.currentUser;

      if (!user) {
        console.log("STEP 2: Signing in as guest");
        const cred = await signInAsGuest();
        user = cred.user;
        console.log("STEP 3: Guest sign-in complete", user.uid);
      } else {
        console.log("STEP 3: Already signed in", user.uid);
      }

      console.log("STEP 4: Creating Firestore session");

      const sessionId = await createSession({
        userId: user.uid,
        role,
        seniority,
      });

      console.log("STEP 5: Session created", sessionId);

      router.push(`/interview?session=${sessionId}&total=${questionCount}`);

      console.log("STEP 6: Redirect requested");
    } catch (err) {
      console.error(err);
      setError("Couldn't start the interview. Check your Firebase setup and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <div>
        <h1>Practice your next interview</h1>
        <p className="subtitle">
          Pick a role and level — the interviewer adapts each question to how you're doing.
        </p>
      </div>

      <form className="card stack" onSubmit={handleStart}>
        <div>
          <label htmlFor="role">Target role</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="seniority">Seniority level</label>
          <select
            id="seniority"
            value={seniority}
            onChange={(e) => setSeniority(e.target.value)}
          >
            {SENIORITIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="count">Number of questions</label>
          <select
            id="count"
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
          >
            {QUESTION_COUNTS.map((c) => (
              <option key={c} value={c}>
                {c} questions
              </option>
            ))}
          </select>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <button type="submit" className="primary" disabled={loading}>
          {loading ? "Starting…" : "Start mock interview"}
        </button>
      </form>
    </div>
  );
}
