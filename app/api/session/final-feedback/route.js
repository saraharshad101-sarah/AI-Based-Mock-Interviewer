import { NextResponse } from "next/server";
import { generateFinalFeedback } from "@/lib/openai";

// POST /api/session/final-feedback
// body: { role, seniority, history: [{ question, answer, score, type, difficulty }] }
export async function POST(req) {
  try {
    const { role, seniority, history = [] } = await req.json();

    if (!role || !seniority || history.length === 0) {
      return NextResponse.json(
        { error: "role, seniority, and a non-empty history are required" },
        { status: 400 }
      );
    }

    const report = await generateFinalFeedback({ role, seniority, history });
    return NextResponse.json(report);
  } catch (err) {
    console.error("final-feedback error:", err);
    return NextResponse.json(
      { error: "Failed to generate final feedback", details: err.message },
      { status: 500 }
    );
  }
}
