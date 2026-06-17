"use client";

import { useState, useEffect } from "react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#EBF0F3] text-[#2D3136]">
      <main className="max-w-6xl mx-auto px-6 lg:px-10">
        <Hero />
        <ModulesSection />
        <AboutSection />
      </main>
    </div>
  );
}

/* --------------------------------- HERO ---------------------------------- */

function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="pt-16 md:pt-20 pb-16 text-center">
      <div
        className={`transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        <span className="inline-flex items-center px-3 py-1 rounded-md bg-white border border-[#D7E1E6] text-[11px] font-semibold uppercase tracking-wider text-[#1E7B92]">
          Learn. Analyze. Practice.
        </span>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[#2D3136] mt-5 leading-tight">
          A self-learning platform for pharmacy
          <br className="hidden md:block" /> students, with prescription OCR built in
        </h1>

        <p className="text-[#5C6770] text-base md:text-lg max-w-2xl mx-auto mt-5 leading-relaxed">
          RxLearn pairs clinical drill practice with a prescription analysis
          engine, so students train recognition, recall, and real-world
          reading skills in one place.
        </p>
      </div>
    </section>
  );
}

/* -------------------------------- MODULES -------------------------------- */

function ModulesSection() {
  return (
    <section className="pb-16">
      <div className="grid md:grid-cols-3 gap-5">
        <OcrCard />
        <QuizCard />
        <LibraryCard />
      </div>
    </section>
  );
}

/* OCR Lab — animated scan line over a mock prescription, decoding live */
function OcrCard() {
  const [scanning, setScanning] = useState(false);
  const [revealed, setRevealed] = useState(0);

  const fields = [
    { label: "Drug", value: "Amoxicillin 500mg" },
    { label: "Frequency", value: "TID × 7 days" },
    { label: "Dosage", value: "1 capsule" },
  ];

  function runScan() {
    setScanning(true);
    setRevealed(0);
    fields.forEach((_, i) => {
      setTimeout(() => setRevealed(i + 1), 500 + i * 450);
    });
    setTimeout(() => setScanning(false), 500 + fields.length * 450 + 200);
  }

  return (
    <div className="group bg-white rounded-xl border border-[#D7E1E6] p-7 flex flex-col hover:border-[#1E7B92] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E7B92]">
        OCR Lab
      </span>
      <h3 className="text-lg font-bold text-[#2D3136] mt-3">
        OCR Prescription Lab
      </h3>
      <p className="text-sm text-[#5C6770] mt-2.5 leading-relaxed">
        Upload a handwritten prescription and review the model's extracted
        fields against the original.
      </p>

      <div className="relative mt-5 h-28 rounded-lg bg-[#EBF0F3] border border-[#D7E1E6] overflow-hidden">
        <div className="absolute inset-0 flex flex-col gap-1.5 p-3 opacity-40">
          <div className="h-1.5 w-3/4 bg-[#5C6770] rounded-full" />
          <div className="h-1.5 w-1/2 bg-[#5C6770] rounded-full" />
          <div className="h-1.5 w-5/6 bg-[#5C6770] rounded-full" />
          <div className="h-1.5 w-2/3 bg-[#5C6770] rounded-full" />
        </div>
        {scanning && (
          <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#00A3E0]/40 to-transparent animate-[scan_1.8s_linear_1]" />
        )}
        <style>{`
          @keyframes scan {
            0% { transform: translateY(0); }
            100% { transform: translateY(112px); }
          }
        `}</style>
      </div>

      <div className="mt-3 space-y-1.5 min-h-[72px]">
        {fields.map((f, i) => (
          <div
            key={f.label}
            className={`flex items-center justify-between text-xs rounded-md px-2.5 py-1.5 bg-[#1E7B92]/5 transition-all duration-300 ${
              revealed > i ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
            }`}
          >
            <span className="font-semibold text-[#5C6770]">{f.label}</span>
            <span className="font-semibold text-[#1E7B92]">{f.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={runScan}
        disabled={scanning}
        className="mt-5 w-full text-sm font-semibold text-white bg-[#1E7B92] rounded-lg py-2.5 hover:bg-[#176175] disabled:opacity-60 transition-colors"
      >
        {scanning ? "Scanning…" : "Run a sample scan"}
      </button>
    </div>
  );
}

/* Quiz Arena — a tiny live MCQ with instant feedback */
function QuizCard() {
  const question = "Which route of administration has the fastest onset?";
  const options = ["Oral", "Intravenous", "Topical", "Subcutaneous"];
  const correct = 1;

  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="group bg-white rounded-xl border border-[#D7E1E6] p-7 flex flex-col hover:border-[#1E7B92] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E7B92]">
        Academy
      </span>
      <h3 className="text-lg font-bold text-[#2D3136] mt-3">Quiz Arena</h3>
      <p className="text-sm text-[#5C6770] mt-2.5 leading-relaxed">
        Timed multiple-choice questions across pharmacology and clinical
        decisions, with feedback on every answer.
      </p>

      <div className="mt-5 rounded-lg bg-[#EBF0F3] border border-[#D7E1E6] p-4 flex-1">
        <p className="text-xs font-semibold text-[#2D3136] mb-3">{question}</p>
        <div className="space-y-1.5">
          {options.map((opt, i) => {
            const isCorrect = i === correct;
            const isPicked = selected === i;
            let style = "bg-white border-[#D7E1E6] text-[#5C6770]";
            if (selected !== null && isPicked && isCorrect)
              style = "bg-[#1E7B92]/10 border-[#1E7B92] text-[#1E7B92]";
            if (selected !== null && isPicked && !isCorrect)
              style = "bg-red-50 border-red-300 text-red-500";
            if (selected !== null && !isPicked && isCorrect)
              style = "bg-[#1E7B92]/5 border-[#1E7B92]/40 text-[#1E7B92]";

            return (
              <button
                key={opt}
                onClick={() => setSelected(i)}
                className={`w-full text-left text-xs font-semibold px-3 py-2 rounded-md border transition-all duration-200 hover:scale-[1.01] ${style}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => setSelected(null)}
        className="mt-5 w-full text-sm font-semibold text-[#1E7B92] border border-[#1E7B92] rounded-lg py-2.5 hover:bg-[#1E7B92] hover:text-white transition-colors"
      >
        {selected === null ? "Try the question" : "Reset"}
      </button>
    </div>
  );
}

/* Drug Library — live filter over a small dataset */
function LibraryCard() {
  const drugs = [
    { name: "Amoxicillin", cls: "Antibiotic" },
    { name: "Metformin", cls: "Antidiabetic" },
    { name: "Atorvastatin", cls: "Statin" },
    { name: "Omeprazole", cls: "PPI" },
    { name: "Losartan", cls: "ARB" },
  ];
  const [query, setQuery] = useState("");
  const filtered = drugs.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="group bg-white rounded-xl border border-[#D7E1E6] p-7 flex flex-col hover:border-[#1E7B92] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E7B92]">
        Reference
      </span>
      <h3 className="text-lg font-bold text-[#2D3136] mt-3">Drug Library</h3>
      <p className="text-sm text-[#5C6770] mt-2.5 leading-relaxed">
        Look up dosing, interactions, and contraindications in the
        institutional clinical database.
      </p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search a drug…"
        className="mt-5 w-full text-sm rounded-lg border border-[#D7E1E6] px-3 py-2 outline-none focus:border-[#1E7B92] transition-colors"
      />

      <div className="mt-3 flex-1 min-h-[112px] space-y-1.5">
        {filtered.length === 0 && (
          <p className="text-xs text-[#5C6770] italic px-1 py-2">
            No matches in the sample set.
          </p>
        )}
        {filtered.map((d) => (
          <div
            key={d.name}
            className="flex items-center justify-between text-xs rounded-md px-2.5 py-1.5 bg-[#EBF0F3] hover:bg-[#1E7B92]/10 transition-colors"
          >
            <span className="font-semibold text-[#2D3136]">{d.name}</span>
            <span className="text-[#5C6770]">{d.cls}</span>
          </div>
        ))}
      </div>

      <button className="mt-5 w-full text-sm font-semibold text-[#1E7B92] border border-[#1E7B92] rounded-lg py-2.5 hover:bg-[#1E7B92] hover:text-white transition-colors">
        Open full library
      </button>
    </div>
  );
}

/* -------------------------------- ABOUT ----------------------------------- */

function AboutSection() {
  const points = [
    {
      title: "Why OCR matters here",
      desc: "Pharmacy students often learn from textbooks, yet real-world practice demands much more than memorization. RxLearn combines prescription interpretation, clinical knowledge reinforcement, and drug information retrieval in a single learning environment. By connecting theory with realistic pharmacy scenarios, students can build confidence before entering professional practice.",
    },
    {
      title: "Why drills matter",
      desc: "Repeated, timed practice with instant correction builds faster recall under pressure than passive reading does.",
    },
    {
      title: "Why a shared drug database",
      desc: "Every module draws from the same institutional clinical dataset, so a dosage learned in the Academy matches what the OCR Lab and Drug Library show.",
    },
  ];

  const [active, setActive] = useState(0);

  return (
    <section className="pb-20">
      <div className="bg-white rounded-2xl border border-[#D7E1E6] p-8 md:p-12">
        <h2 className="text-xl md:text-2xl font-bold text-[#2D3136] mb-6">
          Why RxLearn?
        </h2>

        <div className="flex gap-2 flex-wrap mb-6">
          {points.map((p, i) => (
            <button
              key={p.title}
              onClick={() => setActive(i)}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all duration-200 ${
                active === i
                  ? "bg-[#1E7B92] text-white border-[#1E7B92]"
                  : "bg-white text-[#5C6770] border-[#D7E1E6] hover:border-[#1E7B92] hover:text-[#1E7B92]"
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>

        <div className="rounded-xl bg-[#EBF0F3] p-6 min-h-[96px] flex items-center">
          <p
            key={active}
            className="text-sm md:text-base text-[#2D3136] leading-relaxed animate-in fade-in duration-300"
          >
            {points[active].desc}
          </p>
        </div>
      </div>
    </section>
  );
}