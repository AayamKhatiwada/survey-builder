import { NextRequest, NextResponse } from "next/server";
import { getSurvey, getResponses } from "@/lib/storage";
import { AnswerValue } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const survey = await getSurvey(id);
  if (!survey) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const responses = await getResponses(id);

  const questions = survey.questions.map((q) => {
    const answered = responses
      .map((r) => r.answers[q.id])
      .filter((v): v is AnswerValue => v !== undefined && v !== null && v !== "");

    if (q.type === "single_choice" || q.type === "multi_choice") {
      const counts: Record<string, number> = {};
      for (const opt of q.options || []) counts[opt] = 0;
      for (const value of answered) {
        const values = Array.isArray(value) ? value : [value];
        for (const v of values) {
          counts[String(v)] = (counts[String(v)] || 0) + 1;
        }
      }
      return { id: q.id, title: q.title, type: q.type, counts, responseCount: answered.length };
    }

    if (q.type === "rating") {
      const nums = answered.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
      const average = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const n of nums) distribution[n] = (distribution[n] || 0) + 1;
      return {
        id: q.id,
        title: q.title,
        type: q.type,
        average: Math.round(average * 100) / 100,
        distribution,
        responseCount: nums.length,
      };
    }

    return {
      id: q.id,
      title: q.title,
      type: q.type,
      answers: answered.map((v) => String(v)),
      responseCount: answered.length,
    };
  });

  return NextResponse.json({
    surveyId: id,
    totalResponses: responses.length,
    questions,
  });
}
