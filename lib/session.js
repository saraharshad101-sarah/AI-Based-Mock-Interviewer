// lib/session.js
// Client-side helper for reading/writing interview sessions in Firestore.
// Collection shape:
// interviews/{sessionId} = {
//   userId, role, seniority, createdAt,
//   history: [{ question, type, difficulty, answer, score, feedback, strengths, improvements }],
//   finalReport: {...} | null,
//   status: "in_progress" | "completed"
// }

import { db } from "./firebase";
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export async function createSession({ userId, role, seniority }) {
  const sessionId = uuidv4();
  const ref = doc(db, "interviews", sessionId);

  console.log("SESSION: About to write to Firestore", sessionId);

  await Promise.race([
    setDoc(ref, {
      userId: userId || "guest",
      role,
      seniority,
      createdAt: serverTimestamp(),
      history: [],
      finalReport: null,
      status: "in_progress",
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firestore write timed out after 10 seconds")), 10000)
    ),
  ]);

  console.log("SESSION: Firestore write completed");

  return sessionId;
}

export async function getSession(sessionId) {
  const ref = doc(db, "interviews", sessionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Session not found");
  return { id: snap.id, ...snap.data() };
}

export async function appendHistoryEntry(sessionId, entry) {
  const session = await getSession(sessionId);
  const history = [...(session.history || []), entry];
  const ref = doc(db, "interviews", sessionId);
  await updateDoc(ref, { history });
  return history;
}

export async function updateLastAnswer(sessionId, { answer, score, feedback, strengths, improvements }) {
  const session = await getSession(sessionId);
  const history = [...(session.history || [])];
  if (history.length === 0) throw new Error("No question to answer yet");
  const last = history[history.length - 1];
  history[history.length - 1] = { ...last, answer, score, feedback, strengths, improvements };
  const ref = doc(db, "interviews", sessionId);
  await updateDoc(ref, { history });
  return history;
}

export async function completeSession(sessionId, finalReport) {
  const ref = doc(db, "interviews", sessionId);
  await updateDoc(ref, { status: "completed", finalReport });
}
