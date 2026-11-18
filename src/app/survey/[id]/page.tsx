"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Survey, AnswerValue, Question } from "@/lib/types";

function isVisible(q: Question, answers: Record<string, AnswerValue>): boolean {
  if (!q.condition) return true;
  const answer = answers[q.condition.questionId];
  if (Array.isArray(answer)) return answer.includes(q.condition.value);
  return answer === q.condition.value;
}

export default function SurveyFormPage() {
  const params = useParams<{ id: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/surveys/${params.id}`);
      if (res.ok) setSurvey(await res.json());
      setLoading(false);
    })();
  }, [params.id]);

  if (loading)
    return <main className="max-w-xl px-10 py-16 text-slate-500">Loading…</main>;
  if (!survey)
    return <main className="max-w-xl px-10 py-16 text-slate-500">Survey not found.</main>;

  if (submitted) {
    return (
      <main className="max-w-xl px-10 py-16">
        <div className="bg-white rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Thank you!</h1>
          <p className="text-slate-500">Your response has been recorded.</p>
        </div>
      </main>
    );
  }

  function setAnswer(id: string, value: AnswerValue) {
    setAnswers((a) => ({ ...a, [id]: value }));
    setErrors((e) => ({ ...e, [id]: "" }));
  }

  function toggleMultiOption(id: string, option: string) {
    const current = (answers[id] as string[]) || [];
    const next = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    setAnswer(id, next);
  }

  function validate(visibleQuestions: Question[]): boolean {
    const nextErrors: Record<string, string> = {};
    for (const q of visibleQuestions) {
      const value = answers[q.id];
      const isEmpty =
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);
      if (q.required && isEmpty) {
        nextErrors[q.id] = "This question is required";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    if (!survey) return;

    const visibleQuestions = survey.questions.filter((q) => isVisible(q, answers));
    if (!validate(visibleQuestions)) return;

    const payload: Record<string, AnswerValue> = {};
    for (const q of visibleQuestions) {
      if (answers[q.id] !== undefined) payload[q.id] = answers[q.id];
    }

    const res = await fetch(`/api/surveys/${survey.id}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: payload }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSubmitError(data.error || "Failed to submit response");
      return;
    }
    setSubmitted(true);
  }

  const visibleQuestions = survey.questions.filter((q) => isVisible(q, answers));

  return (
    <main className="max-w-xl px-10 py-16">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{survey.title}</h1>
      {survey.description && <p className="text-slate-500 mb-10">{survey.description}</p>}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-8 space-y-8"
      >
        {visibleQuestions.map((q) => (
          <div key={q.id}>
            <label className="block font-medium text-slate-900 mb-2">
              {q.title}
              {q.required && <span className="text-slate-900"> *</span>}
            </label>

            {q.type === "text" && (
              <input
                className="border border-slate-300 rounded-lg w-full p-2 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-900"
                value={(answers[q.id] as string) || ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
              />
            )}

            {q.type === "single_choice" && (
              <div className="space-y-2">
                {(q.options || []).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswer(q.id, opt)}
                      className="accent-slate-900"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {q.type === "multi_choice" && (
              <div className="space-y-2">
                {(q.options || []).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={((answers[q.id] as string[]) || []).includes(opt)}
                      onChange={() => toggleMultiOption(q.id, opt)}
                      className="accent-slate-900"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {q.type === "rating" && (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setAnswer(q.id, n)}
                    className={`w-9 h-9 rounded-lg border font-medium transition-colors ${
                      answers[q.id] === n
                        ? "bg-black text-white border-black"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}

            {errors[q.id] && <p className="text-slate-900 text-sm mt-1">{errors[q.id]}</p>}
          </div>
        ))}

        {submitError && <p className="text-slate-900 text-sm">{submitError}</p>}

        <button
          type="submit"
          className="bg-black text-white rounded-lg px-4 py-2 font-medium hover:bg-slate-800 transition-colors"
        >
          Submit
        </button>
      </form>
    </main>
  );
}
