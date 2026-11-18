import Link from "next/link";
import { getAllSurveys } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const surveys = await getAllSurveys();

  return (
    <main className="max-w-2xl px-10 py-16">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-bold text-slate-900">Surveys</h1>
        <Link href="/admin" className="text-sm font-medium text-slate-900 hover:text-slate-600">
          Admin →
        </Link>
      </div>

      {surveys.length === 0 && (
        <p className="text-slate-500">No surveys available yet.</p>
      )}

      <ul className="space-y-5">
        {surveys.map((s) => (
          <li
            key={s.id}
            className="bg-white rounded-xl p-6"
          >
            <h2 className="font-semibold text-slate-900">{s.title}</h2>
            {s.description && (
              <p className="text-sm text-slate-500 mt-1.5">{s.description}</p>
            )}
            <Link
              href={`/survey/${s.id}`}
              className="inline-block mt-4 text-sm font-medium text-slate-900 hover:text-slate-600"
            >
              Take survey →
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
