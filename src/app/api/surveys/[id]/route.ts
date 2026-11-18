import { NextRequest, NextResponse } from "next/server";
import { getSurvey, saveSurvey, deleteSurvey } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const survey = await getSurvey(id);
  if (!survey) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(survey);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const existing = await getSurvey(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = {
    ...existing,
    title: body.title ?? existing.title,
    description: body.description ?? existing.description,
    questions: body.questions ?? existing.questions,
    updatedAt: new Date().toISOString(),
  };

  await saveSurvey(updated);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await deleteSurvey(id);
  return NextResponse.json({ ok: true });
}
