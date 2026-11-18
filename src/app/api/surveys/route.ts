import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAllSurveys, saveSurvey } from "@/lib/storage";
import { Survey } from "@/lib/types";

export async function GET() {
  const surveys = await getAllSurveys();
  return NextResponse.json(surveys);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const now = new Date().toISOString();

  const survey: Survey = {
    id: randomUUID(),
    title: body.title || "Untitled survey",
    description: body.description || "",
    questions: body.questions || [],
    createdAt: now,
    updatedAt: now,
  };

  await saveSurvey(survey);
  return NextResponse.json(survey, { status: 201 });
}
