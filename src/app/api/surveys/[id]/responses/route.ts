import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSurvey, addResponse, getResponses } from "@/lib/storage";
import { AnswerValue, SurveyResponse } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

function conditionMet(
  answers: Record<string, AnswerValue>,
  condition: { questionId: string; value: string } | null | undefined
): boolean {
  if (!condition) return true;
  const answer = answers[condition.questionId];
  if (Array.isArray(answer)) return answer.includes(condition.value);
  return answer === condition.value;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const survey = await getSurvey(id);
  if (!survey) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const answers: Record<string, AnswerValue> = body.answers || {};

  for (const q of survey.questions) {
    if (!conditionMet(answers, q.condition)) continue;
    const value = answers[q.id];

    if (q.required) {
      const isEmpty =
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);
      if (isEmpty) {
        return NextResponse.json(
          { error: `Question "${q.title}" is required` },
          { status: 400 }
        );
      }
    }

    if (value === undefined || value === null || value === "") continue;

    if (q.type === "rating") {
      const num = Number(value);
      if (!Number.isInteger(num) || num < 1 || num > 5) {
        return NextResponse.json(
          { error: `Question "${q.title}" must be a rating between 1 and 5` },
          { status: 400 }
        );
      }
    }

    if (q.type === "single_choice") {
      if (typeof value !== "string" || !(q.options || []).includes(value)) {
        return NextResponse.json(
          { error: `Question "${q.title}" has an invalid selection` },
          { status: 400 }
        );
      }
    }

    if (q.type === "multi_choice") {
      if (!Array.isArray(value) || value.some((v) => !(q.options || []).includes(v))) {
        return NextResponse.json(
          { error: `Question "${q.title}" has an invalid selection` },
          { status: 400 }
        );
      }
    }

    if (q.type === "text" && typeof value !== "string") {
      return NextResponse.json(
        { error: `Question "${q.title}" must be text` },
        { status: 400 }
      );
    }
  }

  const response: SurveyResponse = {
    id: randomUUID(),
    surveyId: id,
    answers,
    submittedAt: new Date().toISOString(),
  };

  await addResponse(response);
  return NextResponse.json(response, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const responses = await getResponses(id);
  return NextResponse.json(responses);
}
