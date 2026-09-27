import { NextResponse } from "next/server";
import { evaluateAnswer } from "@/lib/openai";

// POST /api/evaluate-answer
// body: { role, seniority, question, answer }
export async function POST(req) {
  try {
    const { role, seniority, question, answer } = await req.json();

    if (!role || !seniority || !question) {
      return NextResponse.json(
        { error: "role, seniority, and question are required" },
        { status: 400 }
      );
    }

    const result = await evaluateAnswer({ role, seniority, question, answer });
    return NextResponse.json(result);
  } catch (err) {
    console.error("evaluate-answer error:", err);
    return NextResponse.json(
      { error: "Failed to evaluate answer", details: err.message },
      { status: 500 }
    );
  }
}
