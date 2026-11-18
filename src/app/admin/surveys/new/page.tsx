"use client";

import SurveyBuilder from "@/components/SurveyBuilder";

export default function NewSurveyPage() {
  return (
    <main className="max-w-2xl px-10 py-16">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">New Survey</h1>
      <SurveyBuilder />
    </main>
  );
}
