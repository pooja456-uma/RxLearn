"use client";

import { useState } from "react";

export default function Dashboard() {
  const [stats] = useState({
    scans: 24,
    drugsLearned: 156,
    quizScore: "88%",
    rank: "#04",
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-700">

      {/* HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-pink-500 text-white p-10 rounded-[40px] shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div>
            <h1 className="text-3xl font-black tracking-tighter">
              🧸 Student <span className="italic">Dossier</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] opacity-80 mt-2">
              Welcome back, Pooja • Your learning journey continues 💊
            </p>
          </div>

          <div className="flex gap-3">
            <Action icon="🔬" label="OCR Lab" />
            <Action icon="📚" label="Dictionary" />
          </div>
        </div>

        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="OCR Scans" value={stats.scans} emoji="📷" />
        <Stat label="Drugs Learned" value={stats.drugsLearned} emoji="💊" />
        <Stat label="Quiz Score" value={stats.quizScore} emoji="🎯" />
        <Stat label="Rank" value={stats.rank} emoji="🏆" />
      </div>

      {/* MAIN GRID */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* PROGRESS */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[35px] border shadow-sm space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            Learning Progress
          </h3>

          <Progress label="Antibiotics" value={85} />
          <Progress label="Cardiology" value={42} />
          <Progress label="CNS Drugs" value={60} />
          <Progress label="GI System" value={92} />
        </div>

        {/* ACTIVITY */}
        <div className="bg-slate-900 text-white p-8 rounded-[35px] shadow-xl space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 text-center">
            Recent Activity
          </h3>

          <Activity title="Amoxicillin Scan" time="Today" status="Done" />
          <Activity title="Quiz Attempt" time="Yesterday" status="A+" />
          <Activity title="Metformin Review" time="2d ago" status="Viewed" />

          <button className="w-full mt-4 py-3 rounded-2xl bg-blue-600 text-xs font-black uppercase tracking-widest hover:bg-pink-500 transition-all">
            Download Report 📄
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------- COMPONENTS -------- */

function Stat({ label, value, emoji }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border text-center hover:scale-105 transition">
      <div className="text-xl">{emoji}</div>
      <p className="text-[10px] font-black uppercase text-slate-400 mt-2">{label}</p>
      <p className="text-3xl font-black text-slate-800 mt-1">{value}</p>
    </div>
  );
}

function Progress({ label, value }: any) {
  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-pink-500 rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Activity({ title, time, status }: any) {
  return (
    <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
      <p className="text-sm font-bold">{title}</p>
      <p className="text-[9px] text-slate-400 uppercase">{time}</p>
      <span className="text-[9px] text-blue-300 font-black uppercase">
        {status}
      </span>
    </div>
  );
}

function Action({ icon, label }: any) {
  return (
    <button className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl hover:bg-white hover:text-blue-600 transition">
      <span>{icon}</span>
      <span className="text-[10px] font-black uppercase">{label}</span>
    </button>
  );
}