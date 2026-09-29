// lib/openai.js
// Server-side only helper — never import this from client components.
// Wraps the Groq API with the calls the interviewer needs:
//   1. generateNextQuestion — produce the next adaptive question
//   2. evaluateAnswer       — score + critique the candidate's last answer

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

async function callGroq(messages, temperature = 0.7) {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature,
      messages,
      response_format: {
        type: "json_object",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  return data.choices[0].message.content;
}

/**
 * Ask the model for the next interview question, adapted to how well
 * the candidate has been doing so far.
 *
 * @param {Object} params
 * @param {string} params.role          e.g. "Frontend Developer"
 * @param {string} params.seniority     e.g. "junior" | "mid" | "senior"
 * @param {Array}  params.history       [{ question, answer, score }]
 * @param {number} params.questionIndex 0-based index of the question to generate
 */
export async function generateNextQuestion({ role, seniority, history, questionIndex }) {
  const historySummary = history
    .map(
      (h, i) =>
        `Q${i + 1}: ${h.question}\nCandidate answer: ${h.answer}\nScore given: ${h.score}/10\nNotes: ${h.feedback || "n/a"}`
    )
    .join("\n\n");

  const difficultyGuidance = getDifficultyGuidance(history);

  const systemPrompt = `You are an experienced technical interviewer conducting a mock interview for a ${seniority} ${role} position.
Ask exactly ONE clear, focused interview question at a time.
Adapt difficulty based on the candidate's performance so far: ${difficultyGuidance}.
Vary the question type across the interview (mix of behavioral, technical/conceptual, and problem-solving questions) unless the role calls for something narrower.
Do not repeat a question already asked.
Respond ONLY with valid JSON, no markdown fences, no extra commentary, in this exact shape:
{"question": "...", "type": "behavioral|technical|problem_solving", "difficulty": "easy|medium|hard"}`;

  const userPrompt = history.length
    ? `Interview so far:\n\n${historySummary}\n\nGenerate question #${questionIndex + 1}.`
    : `This is the first question (#1) of the interview. The candidate has not answered anything yet — start with an approachable but relevant opening question.`;

  const response = await callGroq(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    0.8
  );

  return safeParseJSON(response);
}

/**
 * Ask the model to evaluate the candidate's answer to a specific question.
 *
 * @param {Object} params
 * @param {string} params.role
 * @param {string} params.seniority
 * @param {string} params.question
 * @param {string} params.answer
 */
export async function evaluateAnswer({ role, seniority, question, answer }) {
  const systemPrompt = `You are grading one answer from a mock interview for a ${seniority} ${role} position.
Evaluate the candidate's answer on: relevance, clarity/structure, depth of technical or professional insight, and (where applicable) use of concrete examples.
Respond ONLY with valid JSON, no markdown fences, no extra commentary, in this exact shape:
{
  "score": <integer 0-10>,
  "strengths": ["short point", "short point"],
  "improvements": ["short actionable point", "short actionable point"],
  "feedback": "2-3 sentence summary of the evaluation, written directly to the candidate"
}`;

  const userPrompt = `Question: ${question}\n\nCandidate's answer: ${answer || "(no answer given)"}`;

  const response = await callGroq(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    0.3
  );

  return safeParseJSON(response);
}

/**
 * Produce a final wrap-up report once the interview session ends.
 */
export async function generateFinalFeedback({ role, seniority, history }) {
  const transcript = history
    .map(
      (h, i) =>
        `Q${i + 1} (${h.type || "general"}, ${h.difficulty || "n/a"}): ${h.question}\nAnswer: ${h.answer}\nScore: ${h.score}/10`
    )
    .join("\n\n");

  const systemPrompt = `You are summarizing a full mock interview for a ${seniority} ${role} position.
Respond ONLY with valid JSON, no markdown fences, in this exact shape:
{
  "overallScore": <integer 0-10>,
  "summary": "3-4 sentence overall assessment",
  "topStrengths": ["...", "..."],
  "priorityImprovements": ["...", "..."],
  "recommendedNextSteps": ["...", "..."]
}`;

  const response = await callGroq(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Full transcript:\n\n${transcript}` },
    ],
    0.4
  );

  return safeParseJSON(response);
}

// --- helpers ---------------------------------------------------------

function getDifficultyGuidance(history) {
  if (history.length === 0) return "start at an easy-to-medium difficulty";
  const recent = history.slice(-2);
  const avg = recent.reduce((sum, h) => sum + (h.score ?? 5), 0) / recent.length;
  if (avg >= 8) return "the candidate is doing very well — increase difficulty and push deeper";
  if (avg >= 5) return "the candidate is doing reasonably well — keep difficulty steady or nudge up slightly";
  return "the candidate is struggling — ease off difficulty and ask a more foundational question";
}

function safeParseJSON(raw) {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse model response as JSON: ${cleaned}`);
  }
}
