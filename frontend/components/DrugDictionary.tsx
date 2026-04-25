// FULL CLEAN INTERACTIVE PREMIUM DrugDictionary — fixed messy spacing/UI
"use client";

import { useState, useEffect, useMemo } from "react";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface Drug {
  id: number;
  generic_name: string;
  brand_name: string;
  therapeutic_group: string;
  indications: string;
  side_effects: string;
  counseling_points: string;
  dosage_forms?: string;
  mechanism?: string;
  contraindications?: string;
  brands: string[];
}

export default function DrugDictionary() {
  const [selectedLetter, setSelectedLetter] = useState("All");
  const [selectedGroup, setSelectedGroup] = useState("All Categories");
  const [categories, setCategories] = useState<string[]>([]);
  const [drugs, setDrugs] = useState<any[]>([]);
  const [selectedDrugName, setSelectedDrugName] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));

    fetch("http://127.0.0.1:8000/api/drugs/search?query=")
      .then((res) => res.json())
      .then((data) => setDrugs(data || []));
  }, []);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const grouped = useMemo(() => {
    const map: Record<string, Drug> = {};
    drugs.forEach((d) => {
      const key = d.generic_name || "Unknown";
      if (!map[key]) map[key] = { ...d, brands: [] };
      if (d.brand_name && !map[key].brands.includes(d.brand_name)) map[key].brands.push(d.brand_name);
    });
    return Object.values(map);
  }, [drugs]);

  const filtered = useMemo(() => {
    return grouped.filter((d) => {
      const letterOk = selectedLetter === "All" || d.generic_name?.toUpperCase().startsWith(selectedLetter);
      const groupOk = selectedGroup === "All Categories" || d.therapeutic_group === selectedGroup;
      return letterOk && groupOk;
    });
  }, [grouped, selectedLetter, selectedGroup]);

  const selectedDrug = grouped.find((d) => d.generic_name === selectedDrugName);

  return (
    <div className="h-screen flex bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 overflow-hidden font-sans relative">
      <FloatingDecor />

      {/* LEFT SIDEBAR */}
      <div className="w-[32%] min-w-[320px] bg-white/80 backdrop-blur-xl border-r border-purple-100 shadow-xl flex flex-col z-20">
        <div className="p-5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white shadow-lg">
          <h1 className="text-2xl font-black">💊 RxLearn</h1>
          <p className="text-[10px] tracking-[0.3em] uppercase opacity-80">Interactive Drug Explorer</p>
        </div>

        <div className="p-4 space-y-4 border-b bg-white/60">
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setSelectedDrugName(null);
            }}
            className="w-full p-3 rounded-xl border border-purple-100 text-xs font-bold shadow-sm outline-none"
          >
            <option>All Categories</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>

          <div className="flex flex-wrap gap-1 justify-center">
            <button onClick={() => setSelectedLetter("All")} className="px-3 py-1 rounded-full bg-pink-200 text-[10px] font-bold">All</button>
            {alphabet.map((l) => (
              <button
                key={l}
                onClick={() => setSelectedLetter(l)}
                className={`w-7 h-7 rounded-full text-[10px] font-black transition ${selectedLetter === l ? "bg-purple-500 text-white shadow" : "bg-white border hover:bg-pink-50"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.map((drug, i) => (
            <div
              key={i}
              onClick={() => setSelectedDrugName(drug.generic_name)}
              className={`group p-4 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between ${selectedDrugName === drug.generic_name ? "bg-gradient-to-r from-pink-100 to-purple-100 border-2 border-purple-300 shadow-lg" : "bg-white hover:shadow-md hover:bg-purple-50"}`}
            >
              <div>
                <p className="font-bold text-sm text-slate-800">{drug.generic_name}</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-pink-500 font-bold">{drug.therapeutic_group}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speak(drug.generic_name);
                }}
                className="w-9 h-9 rounded-full bg-purple-100 group-hover:bg-purple-200 transition"
              >
                🔊
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 z-10">
        {!selectedDrug ? (
          <div className="h-full flex flex-col items-center justify-center text-purple-300">
            <div className="text-8xl animate-bounce">💊</div>
            <p className="mt-4 uppercase tracking-[0.4em] text-xs">Select a Drug Card</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in zoom-in-95 duration-500">
            <div className="rounded-[35px] p-8 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-white shadow-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-3 py-1 rounded-full bg-white/20 text-[10px] uppercase font-black">Clinical Monograph</span>
                  <h2 className="text-4xl font-black mt-4">{selectedDrug.generic_name}</h2>
                  <p className="text-xs uppercase tracking-[0.3em] opacity-80 mt-2">{selectedDrug.therapeutic_group}</p>
                </div>
                <button onClick={() => speak(selectedDrug.generic_name)} className="w-14 h-14 rounded-2xl bg-white/20 text-xl">🔊</button>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                {selectedDrug.brands.map((b:string, idx:number) => (
                  <span key={idx} className="px-3 py-2 rounded-full bg-white/15 text-[10px] font-bold uppercase">{b}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DossierCard title="🎯 Indications & Usage" text={selectedDrug.indications} />
              <DossierCard title="⚙️ Mechanism of Action" text={selectedDrug.mechanism || "Consult pharmacological database for metabolic pathway."} />
              <DossierCard title="⚠️ Safety Warnings" text={selectedDrug.side_effects} />
              <DossierCard title="📦 Dosage Forms" text={selectedDrug.dosage_forms || "Tablet, Capsules, Injection"} />
              <DossierCard title="💡 Pharmacist Counseling" text={selectedDrug.counseling_points} highlight />
              <DossierCard title="🚫 Contraindications" text={selectedDrug.contraindications || "Hypersensitivity to active substance."} />
            </div>

            <button
              onClick={() => setSelectedDrugName(null)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black tracking-[0.3em] uppercase shadow-xl hover:scale-[1.01] transition"
            >
              Close 💕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FloatingDecor() {
  const items = ["💊", "✨", "🫧", "💗"];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((icon, i) => (
        <span
          key={i}
          className="absolute text-2xl animate-float"
          style={{ left: `${Math.random() * 100}%`, animationDuration: `${7 + Math.random() * 5}s`, animationDelay: `${Math.random() * 4}s` }}
        >
          {icon}
        </span>
      ))}
      <style jsx>{`
        .animate-float { bottom: -40px; animation: floatUp linear infinite; }
        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 0.5; }
          100% { transform: translateY(-110vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function DossierCard({ title, text, highlight = false }: { title: string; text?: string; highlight?: boolean }) {
  return (
    <div className={`p-5 rounded-2xl border shadow-sm hover:shadow-lg transition ${highlight ? "bg-gradient-to-r from-yellow-50 to-pink-50 border-pink-200" : "bg-white/90 border-slate-100"}`}>
      <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-500 mb-3">{title}</h3>
      <p className="text-sm text-slate-700 leading-relaxed">{text || "No data yet"}</p>
    </div>
  );
}