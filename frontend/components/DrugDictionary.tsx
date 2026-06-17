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

  // Data Retrieval
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));

    fetch("http://127.0.0.1:8000/api/drugs/search?query=")
      .then((res) => res.json())
      .then((data) => setDrugs(data || []));
  }, []);

  // Text-to-Speech Engine (speak)
  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // The Data Aggregator (grouped)
  const grouped = useMemo(() => {
    const map: Record<string, Drug> = {};
    drugs.forEach((d) => {
      const key = d.generic_name || "Unknown";
      if (!map[key]) map[key] = { ...d, brands: [] };
      if (d.brand_name && !map[key].brands.includes(d.brand_name)) map[key].brands.push(d.brand_name);
    });
    return Object.values(map);
  }, [drugs]);

  // The Multi-Filter Logic (filtered)
  const filtered = useMemo(() => {
    return grouped.filter((d) => {
      const letterOk = selectedLetter === "All" || d.generic_name?.toUpperCase().startsWith(selectedLetter);
      const groupOk = selectedGroup === "All Categories" || d.therapeutic_group === selectedGroup;
      return letterOk && groupOk;
    });
  }, [grouped, selectedLetter, selectedGroup]);

  const selectedDrug = grouped.find((d) => d.generic_name === selectedDrugName);

  return (
    <div className="h-screen flex bg-[#EBF0F3] overflow-hidden font-sans relative">
      <FloatingDecor />

      {/* LEFT SIDEBAR */}
      <div className="w-[32%] min-w-[320px] bg-white border-r border-slate-300/60 shadow-sm flex flex-col z-20 relative">
        <div className="p-5 bg-white border-b border-slate-200">
          <h1 className="text-2xl font-black text-[#1E7B92]">RxLEARN</h1>
          <p className="text-[10px] tracking-[0.3em] uppercase text-slate-400 font-bold mt-0.5">Interactive Drug Explorer</p>
        </div>

        {/* Dropdown Container with improved Z-Index */}
        <div className="p-4 space-y-4 border-b border-slate-200 bg-white relative z-50">
          <div className="relative">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Filter Specialty</label>
             <select
               value={selectedGroup}
               onChange={(e) => {
                 setSelectedGroup(e.target.value);
                 setSelectedDrugName(null);
               }}
               /* Added z-50 and relative to the select itself */
               className="w-full p-3 rounded-lg border border-slate-300 text-xs font-bold text-[#2D3136] shadow-sm outline-none bg-slate-50 cursor-pointer hover:border-[#1E7B92] transition-all relative z-50"
             >
               <option value="All Categories">All Categories</option>
               {categories.map((c) => (
                 <option key={c} value={c}>
                   {c}
                 </option>
               ))}
             </select>
          </div>

          <div className="flex flex-wrap gap-1 justify-center">
            <button onClick={() => setSelectedLetter("All")} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${selectedLetter === "All" ? "bg-[#1E7B92] text-white shadow-sm" : "bg-slate-100 border border-slate-200 text-slate-500 hover:border-slate-300"}`}>All</button>
            {alphabet.map((l) => (
              <button
                key={l}
                onClick={() => setSelectedLetter(l)}
                className={`w-7 h-7 rounded-md text-[10px] font-black transition-all ${selectedLetter === l ? "bg-[#1E7B92] text-white shadow-sm" : "bg-white border border-slate-200 text-[#2D3136] hover:border-[#1E7B92]"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
          {filtered.map((drug, i) => (
            <div
              key={i}
              onClick={() => setSelectedDrugName(drug.generic_name)}
              className={`group p-4 rounded-xl cursor-pointer border transition-all duration-300 flex items-center justify-between ${selectedDrugName === drug.generic_name ? "bg-white border-[#1E7B92] shadow-sm" : "bg-white border-slate-200 hover:shadow-sm hover:border-slate-300"}`}
            >
              <div>
                <p className="font-bold text-sm text-[#2D3136]">{drug.generic_name}</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#1E7B92] font-bold mt-1">{drug.therapeutic_group}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speak(drug.generic_name);
                }}
                className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center group-hover:border-[#1E7B92] group-hover:text-[#1E7B92] transition"
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
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
            <div className="text-8xl opacity-40">💊</div>
            <p className="mt-4 uppercase tracking-[0.4em] text-xs font-bold">Select a Drug Card</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in zoom-in-95 duration-500">
            <div className="rounded-xl p-8 bg-white border border-slate-300/60 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1E7B92]" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-3 py-1 rounded bg-[#EBF0F3] border border-slate-200 text-[10px] uppercase font-black text-[#1E7B92]">Clinical Monograph</span>
                  <h2 className="text-4xl font-black text-[#2D3136] mt-4 uppercase tracking-tight">{selectedDrug.generic_name}</h2>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold mt-2">{selectedDrug.therapeutic_group}</p>
                </div>
                <button onClick={() => speak(selectedDrug.generic_name)} className="w-14 h-14 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 flex items-center justify-center text-xl hover:border-[#1E7B92] hover:text-[#1E7B92] transition">🔊</button>
              </div>

              <div className="flex flex-wrap gap-2 mt-5 border-t border-slate-100 pt-4">
                {selectedDrug.brands.map((b:string, idx:number) => (
                  <span key={idx} className="px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wide shadow-sm">{b}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DossierCard title="🎯 Indications & Usage" text={selectedDrug.indications} />
              <DossierCard title="⚙️ Mechanism of Action" text={selectedDrug.mechanism || "Consult pharmacological database for metabolic pathway."} />
              <DossierCard title="⚠️ Safety Warnings" text={selectedDrug.side_effects} isWarning />
              <DossierCard title="📦 Dosage Forms" text={selectedDrug.dosage_forms || "Tablet, Capsules, Injection"} />
              <DossierCard title="💡 Pharmacist Counseling" text={selectedDrug.counseling_points} highlight />
              <DossierCard title="🚫 Contraindications" text={selectedDrug.contraindications || "Hypersensitivity to active substance."} isWarning />
            </div>

            <button
              onClick={() => setSelectedDrugName(null)}
              className="w-full py-4 rounded-lg bg-[#1E7B92] text-white font-black tracking-[0.3em] uppercase shadow-sm hover:bg-[#15586e] transition-all active:scale-[0.99]"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FloatingDecor() {
  const items = ["💊", "🔍", "📋"];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((icon, i) => (
        <span
          key={i}
          className="absolute text-xl opacity-5 animate-float"
          style={{ left: `${(i + 1) * 25}%`, animationDuration: `${10 + i * 3}s`, animationDelay: `${i * 1.5}s` }}
        >
          {icon}
        </span>
      ))}
      <style jsx>{`
        .animate-float { bottom: -40px; animation: floatUp linear infinite; }
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.08; }
          50% { opacity: 0.15; }
          100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Dynamic Content Rendering (DossierCard)
function DossierCard({ title, text, highlight = false, isWarning = false }: { title: string; text?: string; highlight?: boolean; isWarning?: boolean }) {
  let cardStyle = "bg-white border-slate-200 text-slate-700";
  if (highlight) cardStyle = "bg-sky-50/50 border-sky-200 text-sky-950";
  if (isWarning) cardStyle = "bg-rose-50/40 border-rose-200 text-rose-950";

  return (
    <div className={`p-5 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-default ${cardStyle}`}>
      <h3 className={`text-[10px] font-black uppercase tracking-[0.25em] mb-3 ${highlight ? "text-[#1E7B92]" : isWarning ? "text-rose-600" : "text-slate-400"}`}>{title}</h3>
      <p className="text-sm leading-relaxed font-medium">{text || "No data yet"}</p>
    </div>
  );
}