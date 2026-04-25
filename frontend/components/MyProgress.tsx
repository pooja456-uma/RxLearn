"use client";

import { useEffect, useState } from "react";

export default function MyProgress() {
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    avgScore: 0,
    xp: 0,
    totalFlashcards: 0,
    accuracy: "0%",
    lastQuizDate: "No sessions yet",
  });

  const [animatedXP, setAnimatedXP] = useState(0);
  const [activeInsight, setActiveInsight] =
    useState("Your learning journey is just beginning 💖");
  const [badge, setBadge] = useState("🌱 Beginner Learner");

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("rxlearn_history") || "[]");
    const known = JSON.parse(localStorage.getItem("rxlearn_known_cards") || "[]");

    if (history.length > 0) {
      const totalScore = history.reduce((a: number, c: any) => a + c.score, 0);
      const avg = Math.round((totalScore / (history.length * 20)) * 100);
      const xpValue = totalScore * 10;

      setStats({
        totalQuizzes: history.length,
        avgScore: avg,
        xp: xpValue,
        totalFlashcards: known.length,
        accuracy: `${avg}%`,
        lastQuizDate:
          history.length > 0
            ? new Date(history[history.length - 1].date).toLocaleDateString()
            : "N/A",
      });

      if (avg >= 85) setBadge("🏆 Clinical Star");
      else if (avg >= 70) setBadge("🥇 Strong Learner");
      else if (avg >= 50) setBadge("🥈 Improving Learner");

      let i = 0;
      const timer = setInterval(() => {
        i += Math.ceil(xpValue / 50);
        if (i >= xpValue) {
          i = xpValue;
          clearInterval(timer);
        }
        setAnimatedXP(i);
      }, 20);

      return () => clearInterval(timer);
    }
  }, []);

  const skills = [
    {
      name: "Prescription Reading",
      value: 0,
      desc: "OCR Practice Progress",
      color: "bg-pink-400",
    },
    {
      name: "Quiz Performance",
      value: parseInt(stats.accuracy),
      desc: "Clinical Understanding",
      color: "bg-purple-400",
    },
    {
      name: "Memory Power",
      value: stats.totalFlashcards > 0 ? 100 : 0,
      desc: "Flashcard Mastery",
      color: "bg-emerald-400",
    },
  ];

  const navigateTo = (target: string) => {
    window.location.href = `/educational-lab?mode=${target}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pb-20 space-y-10 animate-in fade-in duration-700">

      {/* 🌸 HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white p-12 rounded-[40px] shadow-2xl">
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight">
              📊 My Learning Journey
            </h1>
            <p className="text-xs uppercase tracking-widest opacity-70 mt-2 font-bold">
              Grow step by step 💖
            </p>
          </div>

          <div className="text-center bg-white/20 p-5 px-8 rounded-3xl backdrop-blur-md">
            <p className="text-[10px] uppercase font-black opacity-70">XP</p>
            <p className="text-4xl font-black text-yellow-200">
              {animatedXP}
            </p>
          </div>
        </div>
      </div>

      {/* 🌈 INSIGHTS */}
      <div className="grid md:grid-cols-2 gap-6">
        <div
          onMouseEnter={() =>
            setActiveInsight("Every quiz makes you stronger 💪✨")
          }
          className="bg-white p-6 rounded-3xl shadow border hover:shadow-xl transition cursor-pointer"
        >
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            Gentle Insight
          </p>
          <p className="font-semibold text-slate-700 mt-1 italic">
            "{activeInsight}"
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow border text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            Achievement
          </p>
          <p className="text-2xl font-black text-slate-800 italic">
            {badge}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* LEFT */}
        <div className="space-y-6">

          <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white p-10 rounded-[50px] text-center shadow-xl">
            <p className="text-[10px] uppercase tracking-[0.4em] text-pink-300 font-black">
              Accuracy
            </p>

            <div className="relative w-44 h-44 mx-auto mt-8 flex items-center justify-center rounded-full border-8 border-white/10 border-t-pink-400">
              <span className="text-5xl font-black">{stats.accuracy}</span>
            </div>

            <p className="text-xs mt-5 opacity-60">
              Keep improving every day ✨
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <MiniCard emoji="🎯" label="Quizzes" value={stats.totalQuizzes} onClick={() => navigateTo("quiz")} />
            <MiniCard emoji="🧠" label="Flashcards" value={stats.totalFlashcards} onClick={() => navigateTo("flashcards")} />
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[50px] shadow-xl space-y-8">

          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">
            Skill Growth 🌱
          </h2>

          {skills.map((s, i) => (
            <div key={i}>
              <div className="flex justify-between">
                <h3 className="font-black text-slate-800">{s.name}</h3>
                <span className="font-bold">{s.value}%</span>
              </div>

              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">
                {s.desc}
              </p>

              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${s.color}`}
                  style={{ width: `${s.value}%` }}
                />
              </div>
            </div>
          ))}

          <div className="bg-pink-50 p-5 rounded-3xl border border-pink-100 flex justify-between">
            <div>
              <p className="text-[10px] uppercase text-slate-400 font-black">
                Last Session
              </p>
              <p className="text-sm font-bold text-slate-700">
                {stats.lastQuizDate}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] uppercase text-pink-500 font-black">
                Status
              </p>
              <p className="text-sm font-bold text-slate-700">
                Learning Mode Active 💖
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* 🌸 MINI CARD */
function MiniCard({ label, value, emoji, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-5 rounded-3xl border shadow hover:shadow-xl hover:-translate-y-1 transition cursor-pointer text-center"
    >
      <div className="text-3xl">{emoji}</div>
      <p className="text-[10px] uppercase text-slate-400 font-black mt-2">
        {label}
      </p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  );
}