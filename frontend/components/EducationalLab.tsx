"use client";

import { useState, useEffect } from "react";

export default function EducationalLab() {
  const [mode, setMode] = useState<
    "menu" | "category" | "quiz" | "flashcards" | "resources"
  >("menu");

  const [selectedGroup, setSelectedGroup] = useState("");
  const [drugs, setDrugs] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [question, setQuestion] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [feedback, setFeedback] = useState<any>(null);

  // 🔌 DATABASE FETCH
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));

    fetch("http://127.0.0.1:8000/api/drugs/search?query=")
      .then((res) => res.json())
      .then((data) => setDrugs(data || []));
  }, []);

  // 📌 FILTER BY CATEGORY
  const studyList = drugs.filter(
    (d) => d.therapeutic_group === selectedGroup
  );

  // 🧠 GENERATE MEANINGFUL QUESTION
  const generateQuestion = () => {
    if (studyList.length < 2) return;

    const correct = studyList[Math.floor(Math.random() * studyList.length)];

    const options = [
      correct,
      ...drugs
        .filter((d) => d.id !== correct.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3),
    ].sort(() => Math.random() - 0.5);

    setQuestion({
      correct,
      options,
      type: Math.random() > 0.5 ? "brand" : "indication",
    });

    setAnswered(false);
    setFeedback(null);
  };

  // 🚀 START SYSTEM
  const startSystem = (type: "quiz" | "flashcards", group: string) => {
    setSelectedGroup(group);
    setMode(type);
    setScore(0);
    setCardIndex(0);

    if (type === "quiz") generateQuestion();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      {/* HEADER */}
      <div className="bg-white p-6 rounded-3xl border flex justify-between">
        <div>
          <h1 className="text-2xl font-black">🧠 RxLearn Academy</h1>
          <p className="text-xs text-slate-400 uppercase">
            Clinical Training System
          </p>
        </div>

        {mode !== "menu" && (
          <button
            onClick={() => setMode("menu")}
            className="text-xs px-4 py-2 bg-slate-100 rounded-xl"
          >
            Exit
          </button>
        )}
      </div>

      {/* MENU */}
      {mode === "menu" && (
        <div className="grid md:grid-cols-3 gap-6">

          <Card
            title="MCQ Training"
            icon="🎯"
            desc="Clinical reasoning questions"
            onClick={() => setMode("category")}
          />

          <Card
            title="Flashcards"
            icon="📚"
            desc="Step-by-step drug learning"
            onClick={() => setMode("category")}
          />

          <Card
            title="Resources"
            icon="📖"
            desc="Guidelines & references"
            onClick={() => setMode("resources")}
          />
        </div>
      )}

      {/* CATEGORY SELECT */}
      {mode === "category" && (
        <div className="grid md:grid-cols-3 gap-4">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => startSystem("quiz", c)}
              className="p-5 bg-white rounded-2xl border hover:border-blue-500"
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* QUIZ */}
      {mode === "quiz" && question && (
        <div className="bg-white p-8 rounded-3xl border space-y-6">

          <h2 className="font-bold text-lg">
            {question.type === "brand"
              ? `Generic name of ${question.correct.brand_name}`
              : `Drug for: ${question.correct.indications}`}
          </h2>

          <div className="grid gap-3">
            {question.options.map((opt: any) => (
              <button
                key={opt.id}
                disabled={answered}
                onClick={() => {
                  setAnswered(true);

                  const correct = opt.id === question.correct.id;

                  setScore((s) => (correct ? s + 1 : s));

                  setFeedback({
                    correct,
                    explain: question.correct.counseling_points,
                  });
                }}
                className="p-4 border rounded-xl"
              >
                {question.type === "brand"
                  ? opt.generic_name
                  : opt.brand_name}
              </button>
            ))}
          </div>

          {feedback && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <p>{feedback.correct ? "Correct 🎉" : "Wrong ❌"}</p>
              <p className="text-sm text-slate-600">
                💡 {feedback.explain}
              </p>

              <button
                onClick={generateQuestion}
                className="mt-3 w-full bg-black text-white py-2 rounded-xl"
              >
                Next Question
              </button>
            </div>
          )}
        </div>
      )}

      {/* FLASHCARDS */}
      {mode === "flashcards" && studyList.length > 0 && (
        <div className="bg-white p-8 rounded-3xl border text-center space-y-4">

          <h2 className="font-bold">Flashcard</h2>

          <p className="text-xl font-black">
            {studyList[cardIndex % studyList.length].brand_name}
          </p>

          <p>{studyList[cardIndex % studyList.length].generic_name}</p>

          <p className="text-sm text-slate-500">
            {studyList[cardIndex % studyList.length].counseling_points}
          </p>

          <button
            onClick={() => setCardIndex(cardIndex + 1)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            Next Card
          </button>
        </div>
      )}

      {/* RESOURCES */}
      {mode === "resources" && (
        <div className="bg-white p-8 rounded-3xl border space-y-4">

          <h2 className="font-bold text-lg">📖 Study Resources</h2>

          <ul className="text-sm space-y-2 text-slate-600">
            <li>📘 British National Formulary (BNF)</li>
            <li>📗 WHO Essential Medicines List</li>
            <li>📙 Sri Lanka Medical Council Guidelines</li>
            <li>📕 Drug Interaction Handbook</li>
          </ul>

        </div>
      )}
    </div>
  );
}

/* CARD */
function Card({ title, icon, desc, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="p-6 bg-white border rounded-2xl cursor-pointer hover:shadow-lg"
    >
      <div className="text-2xl">{icon}</div>
      <h3 className="font-bold mt-2">{title}</h3>
      <p className="text-sm text-slate-500">{desc}</p>
    </div>
  );
}