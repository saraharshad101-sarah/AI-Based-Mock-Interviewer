import { NextResponse } from "next/server";
import { generateNextQuestion } from "@/lib/openai";

// POST /api/generate-question
// body: { role, seniority, history: [{ question, answer, score, feedback }] }
export async function POST(req) {
  try {
    const { role, seniority, history = [] } = await req.json();

    if (!role || !seniority) {
      return NextResponse.json(
        { error: "role and seniority are required" },
        { status: 400 }
      );
    }

    const questionIndex = history.length;
    const result = await generateNextQuestion({
      role,
      seniority,
      history,
      questionIndex,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("generate-question error:", err);
    return NextResponse.json(
      { error: "Failed to generate question", details: err.message },
      { status: 500 }
    );
  }
}
