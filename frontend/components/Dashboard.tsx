"use client";

import { useState } from "react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-blue-50 text-slate-900 pb-20">
      
      {/* 🌸 HERO SECTION */}
      <div className="relative h-[70vh] flex items-center justify-center overflow-hidden px-6">
        
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop"
            className="w-full h-full object-cover opacity-20"
            alt="medical"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-pink-100/40 via-white/70 to-blue-50"></div>
        </div>

        <div className="relative z-10 max-w-5xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 border border-pink-200 rounded-full shadow-sm backdrop-blur-md">
            <span className="text-pink-500 animate-bounce">💊</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500">
              Cute Clinical Learning Space
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-slate-800">
            Meet <span className="text-pink-500">RxLearn</span> ✨<br />
            Your Study Buddy
          </h1>

          <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Turn boring prescriptions into a fun, interactive learning adventure for pharmacy students 💖
          </p>
        </div>
      </div>

      {/* 🌈 FEATURE CARDS */}
      <div className="max-w-7xl mx-auto px-6 -mt-28 relative z-20 grid md:grid-cols-3 gap-6">
        <FeatureBox
          icon="🔬"
          title="OCR Magic Lab"
          desc="Snap prescriptions & watch decode them instantly ✨"
        />
        <FeatureBox icon="🧠" title="Quiz Garden" desc="Play MCQs & grow your clinical knowledge 🌱" />
        <FeatureBox icon="📚" title="Drug Library" desc="Explore medicines like a smart digital encyclopedia 💊" />
      </div>

      {/* 🌸 MISSION */}
      <div className="max-w-4xl mx-auto mt-24 text-center px-6 space-y-8">
        <h2 className="text-3xl font-black text-slate-800">
          Learning made simple & cute 💕
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <ObjectiveItem text="helps you read prescriptions easily ✨" />
          <ObjectiveItem text="Track your learning progress 📊" />
          <ObjectiveItem text="Practice MCQs like a game 🎯" />
          <ObjectiveItem text="Safe clinical decision training 🩺" />
        </div>
      </div>
    </div>
  );
}

/* 🌸 COMPONENTS */

function FeatureBox({ icon, title, desc }: any) {
  return (
    <div className="bg-white rounded-[40px] p-10 border border-pink-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center">
      <div className="text-5xl mb-4 animate-pulse">{icon}</div>
      <h3 className="text-xl font-black text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 mt-3 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function ObjectiveItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-pink-100 shadow-sm hover:scale-[1.02] transition">
      <span className="text-pink-500">💗</span>
      <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
        {text}
      </span>
    </div>
  );
}