"use client";

import { useState } from "react";

export default function MyProgress() {
  const [skills] = useState([
    {
      name: "Prescription Analysis (OCR)",
      level: "85%",
      color: "bg-blue-500",
      desc: "Accuracy in identifying brand/generic names",
    },
    {
      name: "Clinical Pharmacology",
      level: "60%",
      color: "bg-indigo-500",
      desc: "Understanding indications and side effects",
    },
    {
      name: "Dosage & Counseling",
      level: "92%",
      color: "bg-emerald-500",
      desc: "Pharmacist counseling accuracy",
    },
  ]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-in fade-in duration-700 pb-16">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-8 border-slate-100">

        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter">
            📊 Academic <span className="text-blue-600 italic">Progress</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">
            Student Analytics Dashboard • RxLearn System
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-5 py-2 rounded-2xl border shadow-sm">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">
            Level 04 Scholar
          </p>
        </div>

      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* LEFT SUMMARY */}
        <div className="space-y-6">

          {/* CIRCLE PROGRESS */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-10 rounded-[50px] shadow-xl relative overflow-hidden text-center">

            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 mb-8">
              Curriculum Completion
            </p>

            <div className="relative w-44 h-44 mx-auto flex items-center justify-center rounded-full border-[12px] border-white/10 border-t-white border-r-white">
              <span className="text-5xl font-black">75%</span>
            </div>

            <p className="text-[11px] mt-8 text-white/80 leading-relaxed">
              Keep going 💙 You are close to your{" "}
              <span className="text-white font-bold">
                Clinical Certification
              </span>
            </p>

            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full"></div>
          </div>

          {/* QUICK STATS */}
          <div className="grid grid-cols-2 gap-4">
            <MiniCard label="Avg Grade" value="A-" emoji="🎓" />
            <MiniCard label="Quiz Score" value="88%" emoji="🎯" />
          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[50px] border shadow-sm space-y-10">

          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            Skill Mastery Overview
          </h3>

          <div className="space-y-8">
            {skills.map((s, i) => (
              <div key={i} className="space-y-2">

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-black text-slate-800">
                      {s.name}
                    </p>
                    <p className="text-[10px] text-slate-400">{s.desc}</p>
                  </div>

                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                    {s.level}
                  </span>
                </div>

                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.color} rounded-full transition-all duration-700`}
                    style={{ width: s.level }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* MILESTONES */}
          <div className="pt-8 border-t border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">
              Upcoming Goals
            </h4>

            <div className="grid md:grid-cols-2 gap-4">
              <Milestone
                title="100 Scan Badge"
                status="Almost there"
                progress={80}
              />
              <Milestone
                title="Ethics Certificate"
                status="In progress"
                progress={40}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

function MiniCard({ label, value, emoji }: any) {
  return (
    <div className="bg-white p-5 rounded-3xl border text-center shadow-sm hover:scale-105 transition">
      <div className="text-xl">{emoji}</div>
      <p className="text-[10px] font-black uppercase text-slate-400 mt-1">
        {label}
      </p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  );
}

function Milestone({
  title,
  status,
  progress,
}: {
  title: string;
  status: string;
  progress: number;
}) {
  return (
    <div className="p-4 rounded-2xl bg-slate-50 border hover:bg-white transition space-y-2">

      <div className="flex justify-between items-center">
        <p className="text-[11px] font-black text-slate-800">{title}</p>
        <span className="text-[9px] text-slate-400 font-bold uppercase">
          {status}
        </span>
      </div>

      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}