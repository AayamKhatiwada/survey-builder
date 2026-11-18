"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import { Survey } from "@/lib/types";

export default function AdminDashboard() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/surveys");
    if (res.ok) setSurveys(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this survey and all its responses?")) return;
    await adminFetch(`/api/surveys/${id}`, { method: "DELETE" });
    load();
  }

  if (loading)
    return <main className="max-w-3xl px-10 py-16 text-slate-500">Loading…</main>;

  return (
    <main className="max-w-3xl px-10 py-16">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <Link href="/" className="text-sm font-medium text-slate-900 hover:text-slate-600">
          View site →
        </Link>
      </div>

      <Link
        href="/admin/surveys/new"
        className="inline-block bg-black text-white rounded-lg px-4 py-2 mb-10 font-medium hover:bg-slate-800 transition-colors"
      >
        + New Survey
      </Link>

      {surveys.length === 0 && <p className="text-slate-500">No surveys yet.</p>}

      <ul className="space-y-5">
        {surveys.map((s) => (
          <li key={s.id} className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-900">{s.title}</h2>
                <p className="text-sm text-slate-500">{s.questions.length} questions</p>
              </div>
              <div className="flex gap-4 text-sm font-medium shrink-0">
                <Link href={`/admin/surveys/${s.id}/edit`} className="text-slate-900 hover:text-slate-600">
                  Edit
                </Link>
                <Link href={`/admin/surveys/${s.id}/analytics`} className="text-slate-900 hover:text-slate-600">
                  Analytics
                </Link>
                <Link href={`/survey/${s.id}`} className="text-slate-900 hover:text-slate-600">
                  Preview
                </Link>
                <button onClick={() => handleDelete(s.id)} className="text-slate-900 hover:text-slate-600">
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
