"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { randomUUID } from "@/lib/uuid";
import { adminFetch } from "@/lib/admin-fetch";
import { Question, QuestionType, Survey } from "@/lib/types";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "text", label: "Text Input" },
  { value: "single_choice", label: "Multiple Choice (Single Select)" },
  { value: "multi_choice", label: "Checkbox (Multi-select)" },
  { value: "rating", label: "Rating (1-5)" },
];

function emptyQuestion(): Question {
  return {
    id: randomUUID(),
    type: "text",
    title: "",
    required: false,
    options: [],
    condition: null,
  };
}

export default function SurveyBuilder({ initial }: { initial?: Survey }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [questions, setQuestions] = useState<Question[]>(initial?.questions || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, emptyQuestion()]);
  }

  function removeQuestion(id: string) {
    setQuestions((qs) =>
      qs
        .filter((q) => q.id !== id)
        .map((q) =>
          q.condition?.questionId === id ? { ...q, condition: null } : q
        )
    );
  }

  function moveQuestion(index: number, dir: -1 | 1) {
    setQuestions((qs) => {
      const next = [...qs];
      const target = index + dir;
      if (target < 0 || target >= next.length) return qs;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateOptions(id: string, raw: string) {
    updateQuestion(id, { options: raw.split("\n") });
  }

  async function handleSave() {
    setError("");
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const sanitizedQuestions = questions.map((q) => ({
      ...q,
      options: (q.options || []).map((o) => o.trim()).filter(Boolean),
    }));

    for (const q of sanitizedQuestions) {
      if (!q.title.trim()) {
        setError("Every question needs a label");
        return;
      }
      if (
        (q.type === "single_choice" || q.type === "multi_choice") &&
        q.options.length < 2
      ) {
        setError(`Question "${q.title}" needs at least 2 options`);
        return;
      }
    }

    setSaving(true);
    const payload = { title, description, questions: sanitizedQuestions };
    const url = initial ? `/api/surveys/${initial.id}` : "/api/surveys";
    const method = initial ? "PUT" : "POST";
    const res = await adminFetch(url, { method, body: JSON.stringify(payload) });
    setSaving(false);

    if (!res.ok) {
      setError("Failed to save survey");
      return;
    }
    router.push("/admin");
  }

  const priorQuestions = (currentId: string) =>
    questions.filter(
      (q, i) => q.id !== currentId && i < questions.findIndex((x) => x.id === currentId)
    );

  const inputClass =
    "border border-slate-300 rounded-lg w-full p-2 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-900";

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Survey Title</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-5">
        <h2 className="font-semibold text-slate-900">Questions</h2>
        {questions.map((q, index) => {
          const priors = priorQuestions(q.id);
          return (
            <div key={q.id} className="bg-white rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Question {index + 1}</span>
                <div className="flex gap-3 text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => moveQuestion(index, -1)}
                    disabled={index === 0}
                    className="text-slate-500 hover:text-slate-700 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(index, 1)}
                    disabled={index === questions.length - 1}
                    className="text-slate-500 hover:text-slate-700 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="text-slate-900 hover:text-slate-600"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <input
                className={inputClass}
                placeholder="Question label"
                value={q.title}
                onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
              />

              <div className="flex gap-4 items-center flex-wrap">
                <select
                  className="border border-slate-300 rounded-lg p-2 text-sm"
                  value={q.type}
                  onChange={(e) =>
                    updateQuestion(q.id, { type: e.target.value as QuestionType })
                  }
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                    className="accent-slate-900"
                  />
                  Required
                </label>
              </div>

              {(q.type === "single_choice" || q.type === "multi_choice") && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Options (one per line)
                  </label>
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={(q.options || []).join("\n")}
                    onChange={(e) => updateOptions(q.id, e.target.value)}
                  />
                </div>
              )}

              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Conditional logic (show this question only if…)
                </label>
                <div className="flex gap-2 flex-wrap items-center">
                  <select
                    className="border border-slate-300 rounded-lg p-2 text-sm"
                    value={q.condition?.questionId || ""}
                    onChange={(e) => {
                      const questionId = e.target.value;
                      if (!questionId) {
                        updateQuestion(q.id, { condition: null });
                      } else {
                        updateQuestion(q.id, {
                          condition: { questionId, value: q.condition?.value || "" },
                        });
                      }
                    }}
                  >
                    <option value="">Always show</option>
                    {priors.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title || "(untitled question)"}
                      </option>
                    ))}
                  </select>

                  {q.condition && (
                    <>
                      <span className="text-sm text-slate-500">equals</span>
                      {(() => {
                        const refQuestion = questions.find(
                          (p) => p.id === q.condition?.questionId
                        );
                        if (refQuestion && (refQuestion.options || []).length > 0) {
                          return (
                            <select
                              className="border border-slate-300 rounded-lg p-2 text-sm"
                              value={q.condition.value}
                              onChange={(e) =>
                                updateQuestion(q.id, {
                                  condition: { ...q.condition!, value: e.target.value },
                                })
                              }
                            >
                              <option value="">Select value</option>
                              {(refQuestion.options || []).map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          );
                        }
                        return (
                          <input
                            className="border border-slate-300 rounded-lg p-2 text-sm"
                            placeholder="value"
                            value={q.condition.value}
                            onChange={(e) =>
                              updateQuestion(q.id, {
                                condition: { ...q.condition!, value: e.target.value },
                              })
                            }
                          />
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addQuestion}
          className="border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          + Add Question
        </button>
      </div>

      {error && <p className="text-slate-900 text-sm">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="bg-black text-white rounded-lg px-4 py-2 font-medium hover:bg-slate-800 transition-colors disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save Survey"}
      </button>
    </div>
  );
}
