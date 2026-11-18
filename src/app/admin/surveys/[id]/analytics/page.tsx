"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";

interface ChoiceAnalytics {
  id: string;
  title: string;
  type: "single_choice" | "multi_choice";
  counts: Record<string, number>;
  responseCount: number;
}
interface RatingAnalytics {
  id: string;
  title: string;
  type: "rating";
  average: number;
  distribution: Record<number, number>;
  responseCount: number;
}
interface TextAnalytics {
  id: string;
  title: string;
  type: "text";
  answers: string[];
  responseCount: number;
}
type QuestionAnalytics = ChoiceAnalytics | RatingAnalytics | TextAnalytics;

interface Analytics {
  surveyId: string;
  totalResponses: number;
  questions: QuestionAnalytics[];
}

export default function AnalyticsPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await adminFetch(`/api/surveys/${params.id}/analytics`);
      if (res.ok) setData(await res.json());
      setLoading(false);
    })();
  }, [params.id]);

  if (loading)
    return <main className="max-w-2xl px-10 py-16 text-slate-500">Loading…</main>;
  if (!data) return <main className="max-w-2xl px-10 py-16 text-slate-500">Not found.</main>;

  return (
    <main className="max-w-2xl px-10 py-16">
      <Link href="/admin" className="text-sm font-medium text-slate-900 hover:text-slate-600">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mt-4 mb-1">Analytics</h1>
      <p className="text-slate-500 mb-10">Total responses: {data.totalResponses}</p>

      <div className="space-y-5">
        {data.questions.map((q) => (
          <div key={q.id} className="bg-white rounded-xl p-6">
            <h2 className="font-semibold text-slate-900 mb-4">{q.title}</h2>

            {(q.type === "single_choice" || q.type === "multi_choice") && (
              <ul className="text-sm space-y-1.5">
                {Object.entries(q.counts).map(([option, count]) => (
                  <li key={option} className="flex justify-between text-slate-700">
                    <span>{option}</span>
                    <span className="text-slate-500 font-medium">{count}</span>
                  </li>
                ))}
              </ul>
            )}

            {q.type === "rating" && (
              <div className="text-sm space-y-1.5">
                <p className="text-slate-700">
                  Average: <span className="font-medium">{q.average} / 5</span> ({q.responseCount}{" "}
                  responses)
                </p>
                <ul className="space-y-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n} className="flex justify-between text-slate-700">
                      <span>{n} star</span>
                      <span className="text-slate-500 font-medium">{q.distribution[n] || 0}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {q.type === "text" && (
              <div className="text-sm">
                {q.answers.length === 0 && <p className="text-slate-500">No answers yet.</p>}
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  {q.answers.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
