"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-fetch";
import SurveyBuilder from "@/components/SurveyBuilder";
import { Survey } from "@/lib/types";

export default function EditSurveyPage() {
  const params = useParams<{ id: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await adminFetch(`/api/surveys/${params.id}`);
      if (res.ok) setSurvey(await res.json());
      setLoading(false);
    })();
  }, [params.id]);

  if (loading)
    return <main className="max-w-2xl px-10 py-16 text-slate-500">Loading…</main>;
  if (!survey)
    return <main className="max-w-2xl px-10 py-16 text-slate-500">Survey not found.</main>;

  return (
    <main className="max-w-2xl px-10 py-16">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Edit Survey</h1>
      <SurveyBuilder initial={survey} />
    </main>
  );
}
