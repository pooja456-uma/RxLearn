"use client";

import { useState, useEffect, useMemo } from "react";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface Drug {
  generic_name: string;
  therapeutic_group: string;
  indications: string;
  side_effects: string;
  counseling_points: string;
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
  }, []);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/drugs/search?query=")
      .then((res) => res.json())
      .then((data) => setDrugs(data));
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, Drug> = {};
    drugs.forEach((d) => {
      const key = d.generic_name || "Unknown";
      if (!map[key]) {
        map[key] = { ...d, brands: [] };
      }
      if (!map[key].brands.includes(d.brand_name)) {
        map[key].brands.push(d.brand_name);
      }
    });
    return Object.values(map);
  }, [drugs]);

  const filtered = useMemo(() => {
    return grouped.filter((d) => {
      const letterOk =
        selectedLetter === "All" ||
        d.generic_name?.toUpperCase().startsWith(selectedLetter);

      const groupOk =
        selectedGroup === "All Categories" ||
        d.therapeutic_group === selectedGroup;

      return letterOk && groupOk;
    });
  }, [grouped, selectedLetter, selectedGroup]);

  const selectedDrug =
    selectedDrugName &&
    grouped.find((d) => d.generic_name === selectedDrugName);

  return (
    <div className="relative h-screen flex overflow-hidden bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200">

      {/* FLOATING ANIMATIONS */}
      <FloatingDecor />

      {/* LEFT PANEL */}
      <div className="w-[40%] p-4 overflow-y-auto space-y-4 border-r bg-white/60 backdrop-blur-xl z-10">

        <div className="bg-gradient-to-r from-pink-400 to-purple-400 text-white p-4 rounded-2xl shadow">
          <h1 className="text-lg font-black">💊 RxLearn</h1>
          <p className="text-[10px] uppercase tracking-widest opacity-80">
            Cute Clinical Companion ✨
          </p>
        </div>

        <select
          value={selectedGroup}
          onChange={(e) => {
            setSelectedGroup(e.target.value);
            setSelectedDrugName(null);
          }}
          className="w-full p-2 rounded-xl border bg-pink-50 text-sm shadow"
        >
          <option>All Categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedLetter("All")}
            className="px-2 py-1 text-[10px] rounded-full bg-yellow-200"
          >
            ✨ All
          </button>
          {alphabet.map((l) => (
            <button
              key={l}
              onClick={() => setSelectedLetter(l)}
              className={`px-2 py-1 text-[10px] rounded-full transition ${
                selectedLetter === l
                  ? "bg-purple-500 text-white"
                  : "bg-white border"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((drug, i) => (
            <div
              key={i}
              onClick={() => setSelectedDrugName(drug.generic_name)}
              className="p-3 rounded-2xl border bg-gradient-to-r from-white to-pink-50 hover:shadow-lg cursor-pointer transition"
            >
              <p className="font-bold text-sm text-purple-700">{drug.generic_name}</p>
              <p className="text-[9px] text-pink-500 uppercase">
                {drug.therapeutic_group}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-[60%] p-6 overflow-y-auto z-10">

        {!selectedDrug ? (
          <div className="h-full flex flex-col items-center justify-center text-purple-300">
            <div className="text-6xl">🧸💊</div>
            <p className="text-xs mt-2">Pick a medicine to explore ✨</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">

            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white p-6 rounded-3xl shadow-xl">
              <h2 className="text-2xl font-black">{selectedDrug.generic_name}</h2>
              <p className="text-xs uppercase opacity-80">
                {selectedDrug.therapeutic_group}
              </p>
            </div>

            <Card title="✨ Indications" text={selectedDrug.indications} />
            <Card title="⚠️ Side Effects" text={selectedDrug.side_effects} />
            <Card title="💡 Tips" text={selectedDrug.counseling_points} highlight />

            <button
              onClick={() => setSelectedDrugName(null)}
              className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shadow"
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
  const items = ["💊", "💖", "🫧", "💗", "💊", "🫧"];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((icon, i) => (
        <span
          key={i}
          className="absolute text-2xl animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${6 + Math.random() * 6}s`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        >
          {icon}
        </span>
      ))}

      <style jsx>{`
        .animate-float {
          bottom: -50px;
          animation-name: floatUp;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-110vh) scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function Card({
  title,
  text,
  highlight = false,
}: {
  title: string;
  text?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-5 rounded-2xl shadow-md border ${
        highlight
          ? "bg-gradient-to-r from-yellow-100 to-pink-100 border-yellow-300"
          : "bg-white"
      }`}
    >
      <p className="text-[10px] font-black uppercase text-purple-400 mb-2">
        {title}
      </p>
      <p className="text-sm text-slate-700">{text || "No data yet 💭"}</p>
    </div>
  );
}
