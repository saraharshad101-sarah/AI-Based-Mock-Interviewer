"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSession } from "@/lib/session";
import { auth, signInAsGuest } from "@/lib/firebase";

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
  const starting = useRef(false);

  async function handleStart(e) {
    e.preventDefault();
    if (starting.current) return;
    starting.current = true;
    setLoading(true);
    setError(null);
    try {
      let user = auth.currentUser;
      if (!user) {
        const cred = await signInAsGuest();
        user = cred.user;
      }
      const sessionId = await createSession({
        userId: user.uid,
        role,
        seniority,
      });
      router.push(`/interview?session=${sessionId}&total=${questionCount}`);
    } catch {
      setError("We couldn't sign you in or save your interview. Check your connection and Firebase setup, then try again.");
      setLoading(false);
      starting.current = false;
    }
  }

  return (
    <div className="home-layout">
      <section className="home-intro" aria-labelledby="home-title">
        <p className="eyebrow">Interview practice studio</p>
        <h1 id="home-title">AI Mock Interviewer</h1>
        <p className="home-intro-copy">
          Practice realistic interviews with adaptive AI feedback, tailored to your role and experience.
        </p>
        <ul className="feature-list" aria-label="Interview features">
          <li>
            <span className="feature-index" aria-hidden="true">01</span>
            <span><strong>Adaptive questions</strong><span>Questions respond to your answers and performance.</span></span>
          </li>
          <li>
            <span className="feature-index" aria-hidden="true">02</span>
            <span><strong>Focused evaluation</strong><span>Get a score with specific, actionable feedback.</span></span>
          </li>
          <li>
            <span className="feature-index" aria-hidden="true">03</span>
            <span><strong>Useful next steps</strong><span>Leave with clear areas to strengthen.</span></span>
          </li>
        </ul>
      </section>

      <form className="card stack setup-form" onSubmit={handleStart} aria-busy={loading}>
        <div className="form-heading">
          <p className="eyebrow">New session</p>
          <h2>Set up your interview</h2>
        </div>

        <div>
          <label htmlFor="role">Target role</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)} disabled={loading}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="seniority">Seniority level</label>
          <select id="seniority" value={seniority} onChange={(e) => setSeniority(e.target.value)} disabled={loading}>
            {SENIORITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <fieldset className="choice-fieldset">
          <legend>Number of questions</legend>
          <div className="choice-group">
            {QUESTION_COUNTS.map((count) => (
              <label className="choice-option" key={count}>
                <input
                  type="radio"
                  name="question-count"
                  value={count}
                  checked={questionCount === count}
                  onChange={() => setQuestionCount(count)}
                  disabled={loading}
                />
                {count} questions
              </label>
            ))}
          </div>
        </fieldset>

        {error && <div className="error-banner" role="alert">{error}</div>}

        <button type="submit" className="primary setup-submit" disabled={loading}>
          {loading ? (
            <span className="button-loading"><span className="loading-dot" aria-hidden="true" />Starting interview…</span>
          ) : "Start interview"}
        </button>
      </form>
    </div>
  );
}
