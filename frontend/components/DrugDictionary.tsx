"use client";

import { useEffect, useMemo, useState } from "react";

// ============================================================
// 1. TYPES, API CONFIGURATION, AND CONSTANTS
// ============================================================

const API_BASE = "http://127.0.0.1:8000";
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type DrugRecord = {
  id?: number;
  generic_name?: string | null;
  brand_name?: string | null;
  therapeutic_group?: string | null;
  drug_class?: string | null;
  indications?: string | null;
  side_effects?: string | null;
  counseling_points?: string | null;
  dosage_forms?: string | null;
  mechanism?: string | null;
  mechanism_of_action?: string | null;
  contraindications?: string | null;
  storage_conditions?: string | null;
  interaction_risk?: string | null;
};

type GroupedDrug = DrugRecord & {
  generic_name: string;
  therapeutic_group: string;
  brands: string[];
  lookupKey: string;
};

type DrugDictionaryProps = {
  // Optional medication name sent by OCR Lab through page.tsx.
  // Can be either a generic name (e.g. paracetamol) or a brand.
  initialDrugName?: string;
};

// Normalize names before comparing data returned by OCR and MySQL.
// This prevents casing, spaces, and placeholder text from causing false matches.
function cleanName(value: unknown): string {
  if (typeof value !== "string") return "";
  const result = value.trim();
  if (["null", "none", "n/a", "unknown", "undefined"].includes(result.toLowerCase())) {
    return "";
  }
  return result;
}

function normalizedName(value: unknown): string {
  return cleanName(value).replace(/\s+/g, " ").toLowerCase();
}

function displayField(value: unknown): string {
  return cleanName(value) || "Not available in the dictionary record.";
}

// ============================================================
// 2. MAIN DRUG DICTIONARY COMPONENT
// ============================================================

export default function DrugDictionary({ initialDrugName = "" }: DrugDictionaryProps) {
  const [selectedLetter, setSelectedLetter] = useState("All");
  const [selectedGroup, setSelectedGroup] = useState("All Categories");
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [drugs, setDrugs] = useState<DrugRecord[]>([]);
  const [selectedDrugKey, setSelectedDrugKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lookupNotice, setLookupNotice] = useState("");

  // ============================================================
  // 3. FETCH CATEGORIES AND DRUG RECORDS FROM FASTAPI
  // ============================================================
  useEffect(() => {
    const controller = new AbortController();

    async function loadDictionary() {
      setLoading(true);
      setError("");

      try {
        const [categoriesResponse, drugsResponse] = await Promise.all([
          fetch(`${API_BASE}/api/categories`, { signal: controller.signal }),
          fetch(`${API_BASE}/api/drugs/search?query=`, { signal: controller.signal }),
        ]);

        if (!categoriesResponse.ok || !drugsResponse.ok) {
          throw new Error("Could not load the drug dictionary from the backend.");
        }

        const categoryData: unknown = await categoriesResponse.json();
        const drugData: unknown = await drugsResponse.json();

        if (controller.signal.aborted) return;

        const categoryList =
          categoryData && typeof categoryData === "object" && "categories" in categoryData
            ? (categoryData as { categories?: unknown }).categories
            : null;

        setCategories(
          Array.isArray(categoryList)
            ? categoryList.filter((item): item is string => typeof item === "string")
            : []
        );
        setDrugs(Array.isArray(drugData) ? (drugData as DrugRecord[]) : []);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        console.error("Drug Dictionary Error:", err);
        setError(err instanceof Error ? err.message : "Unable to load the dictionary.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadDictionary();
    return () => controller.abort();
  }, []);

  // ============================================================
  // 4. TEXT-TO-SPEECH PRONUNCIATION
  // ============================================================
  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  // ============================================================
  // 5. GROUP DRUG RECORDS BY GENERIC NAME
  // ============================================================
  // A generic can have multiple brands; each group gets one detail card.
  const grouped = useMemo<GroupedDrug[]>(() => {
    const map = new Map<string, GroupedDrug>();

    drugs.forEach((drug, index) => {
      const generic = cleanName(drug.generic_name);
      const brand = cleanName(drug.brand_name);
      const groupKey = generic
        ? normalizedName(generic)
        : `missing-generic-${drug.id ?? index}`;

      let entry = map.get(groupKey);
      if (!entry) {
        entry = {
          ...drug,
          generic_name: generic || "Generic name not recorded",
          therapeutic_group: cleanName(drug.therapeutic_group) || "Uncategorized",
          brands: [],
          lookupKey: groupKey,
        };
        map.set(groupKey, entry);
      }

      if (brand && !entry.brands.some((item) => normalizedName(item) === normalizedName(brand))) {
        entry.brands.push(brand);
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.generic_name.localeCompare(b.generic_name)
    );
  }, [drugs]);

  // ============================================================
  // 6. OPEN THE MEDICATION PASSED FROM OCR LAB
  // ============================================================
  // Exact generic or brand matching only: avoid opening an unrelated drug
  // when an OCR name is uncertain or only partially matches a database name.
  useEffect(() => {
    const requestedName = normalizedName(initialDrugName);
    if (!requestedName || loading || error) return;

    const matchedDrug = grouped.find(
      (drug) =>
        normalizedName(drug.generic_name) === requestedName ||
        drug.brands.some((brand) => normalizedName(brand) === requestedName)
    );

    // Clear category and A-Z filters so a matched drug is visible.
    setSelectedLetter("All");
    setSelectedGroup("All Categories");

    if (matchedDrug) {
      setSearchTerm("");
      setSelectedDrugKey(matchedDrug.lookupKey);
      setLookupNotice(`Showing ${matchedDrug.generic_name} from your OCR Lab selection.`);
    } else {
      setSelectedDrugKey(null);
      setSearchTerm(initialDrugName.trim());
      setLookupNotice(
        `“${initialDrugName.trim()}” was not found as an exact generic or brand name. Check the spelling or search manually.`
      );
    }
  }, [initialDrugName, grouped, loading, error]);

  // ============================================================
  // 7. SEARCH, CATEGORY, AND A-Z FILTERING
  // ============================================================
  const filtered = useMemo(() => {
    const query = normalizedName(searchTerm);

    return grouped.filter((drug) => {
      const matchesLetter =
        selectedLetter === "All" ||
        drug.generic_name.toUpperCase().startsWith(selectedLetter);
      const matchesCategory =
        selectedGroup === "All Categories" ||
        drug.therapeutic_group === selectedGroup;
      const matchesSearch =
        !query ||
        normalizedName(drug.generic_name).includes(query) ||
        drug.brands.some((brand) => normalizedName(brand).includes(query));

      return matchesLetter && matchesCategory && matchesSearch;
    });
  }, [grouped, searchTerm, selectedGroup, selectedLetter]);

  const selectedDrug = grouped.find((drug) => drug.lookupKey === selectedDrugKey);

  // ============================================================
  // 8. DRUG DICTIONARY USER INTERFACE
  // ============================================================
  return (
    <div className="h-[75vh] min-h-[590px] flex flex-col lg:flex-row bg-[#EBF0F3] overflow-hidden font-sans relative rounded-xl">
      <FloatingDecor />

      {/* 8A. LEFT SIDEBAR: SEARCH, FILTERS, AND MEDICATION LIST */}
      <div className="w-full lg:w-[32%] lg:min-w-[320px] max-h-[47%] lg:max-h-none bg-white border-r border-slate-300/60 shadow-sm flex flex-col z-20 relative">
        <div className="p-5 bg-white border-b border-slate-200">
          <h1 className="text-2xl font-black text-[#1E7B92]">RxLEARN</h1>
          <p className="text-[10px] tracking-[0.3em] uppercase text-slate-400 font-bold mt-0.5">
            Interactive Drug Explorer
          </p>
        </div>

        <div className="p-4 space-y-4 border-b border-slate-200 bg-white relative z-50">
          {/* Find a drug by its generic name OR brand name */}
          <div>
            <label htmlFor="dictionary-search" className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">
              Search Generic or Brand Name
            </label>
            <input
              id="dictionary-search"
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setLookupNotice("");
              }}
              placeholder="Search medications..."
              className="w-full p-3 rounded-lg border border-slate-300 text-xs font-bold text-[#2D3136] bg-slate-50 outline-none focus:border-[#1E7B92]"
            />
          </div>

          {/* Filter medications by therapeutic specialty/category */}
          <div>
            <label htmlFor="dictionary-category" className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">
              Filter Specialty
            </label>
            <select
              id="dictionary-category"
              value={selectedGroup}
              onChange={(event) => {
                setSelectedGroup(event.target.value);
                setSelectedDrugKey(null);
                setLookupNotice("");
              }}
              className="w-full p-3 rounded-lg border border-slate-300 text-xs font-bold text-[#2D3136] shadow-sm outline-none bg-slate-50 cursor-pointer hover:border-[#1E7B92] relative z-50"
            >
              <option value="All Categories">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Existing A-Z medication selector */}
          <div className="flex flex-wrap gap-1 justify-center">
            <button
              onClick={() => setSelectedLetter("All")}
              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${selectedLetter === "All" ? "bg-[#1E7B92] text-white shadow-sm" : "bg-slate-100 border border-slate-200 text-slate-500"}`}
            >
              All
            </button>
            {alphabet.map((letter) => (
              <button
                key={letter}
                onClick={() => setSelectedLetter(letter)}
                className={`w-7 h-7 rounded-md text-[10px] font-black transition-all ${selectedLetter === letter ? "bg-[#1E7B92] text-white shadow-sm" : "bg-white border border-slate-200 text-[#2D3136] hover:border-[#1E7B92]"}`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>

        {/* Loaded medications list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
          {loading && <p className="text-xs text-center text-slate-500 py-5">Loading drug records...</p>}
          {error && <p role="alert" className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <p className="text-xs text-center text-slate-500 py-5">No matching drugs found. Try another search or reset the filters.</p>
          )}

          {filtered.map((drug) => (
            <div
              key={drug.lookupKey}
              onClick={() => {
                setSelectedDrugKey(drug.lookupKey);
                setLookupNotice("");
              }}
              className={`group p-4 rounded-xl cursor-pointer border transition-all duration-300 flex items-center justify-between ${selectedDrugKey === drug.lookupKey ? "bg-white border-[#1E7B92] shadow-sm" : "bg-white border-slate-200 hover:shadow-sm hover:border-slate-300"}`}
            >
              <div className="min-w-0">
                <p className="font-bold text-sm text-[#2D3136] break-words">{drug.generic_name}</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#1E7B92] font-bold mt-1">{drug.therapeutic_group}</p>
                {drug.brands.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-1 truncate">{drug.brands.join(", ")}</p>
                )}
              </div>
              <button
                type="button"
                aria-label={`Pronounce ${drug.generic_name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  speak(drug.generic_name);
                }}
                className="shrink-0 ml-2 w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center group-hover:border-[#1E7B92] group-hover:text-[#1E7B92] transition"
              >
                🔊
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 8B. RIGHT SIDE: SELECTED MEDICATION DETAILS */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 z-10">
        {lookupNotice && (
          <div role="status" className="mb-4 bg-sky-50 border border-sky-200 text-sky-900 text-xs rounded-xl p-3">
            🔎 {lookupNotice}
          </div>
        )}

        {!selectedDrug ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-400 text-center">
            <div className="text-7xl opacity-40">💊</div>
            <p className="mt-4 uppercase tracking-[0.3em] text-xs font-bold">Select a Drug Card</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in zoom-in-95 duration-500">
            <div className="rounded-xl p-6 md:p-8 bg-white border border-slate-300/60 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1E7B92]" />
              <div className="flex justify-between items-start gap-3">
                <div>
                  <span className="px-3 py-1 rounded bg-[#EBF0F3] border border-slate-200 text-[10px] uppercase font-black text-[#1E7B92]">
                    Clinical Monograph
                  </span>
                  <h2 className="text-2xl md:text-4xl font-black text-[#2D3136] mt-4 uppercase tracking-tight break-words">
                    {selectedDrug.generic_name}
                  </h2>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold mt-2">
                    {selectedDrug.therapeutic_group}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Pronounce ${selectedDrug.generic_name}`}
                  onClick={() => speak(selectedDrug.generic_name)}
                  className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 flex items-center justify-center text-xl hover:border-[#1E7B92] hover:text-[#1E7B92] transition"
                >
                  🔊
                </button>
              </div>

              {/* All registered brand names for the selected generic */}
              <div className="flex flex-wrap gap-2 mt-5 border-t border-slate-100 pt-4">
                {selectedDrug.brands.length > 0 ? (
                  selectedDrug.brands.map((brand) => (
                    <span key={brand} className="px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wide shadow-sm">
                      {brand}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No brand names recorded.</span>
                )}
              </div>
            </div>

            {/* Existing pharmacology information cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DossierCard title="🎯 Indications & Usage" text={selectedDrug.indications} />
              <DossierCard title="⚙️ Mechanism of Action" text={selectedDrug.mechanism_of_action || selectedDrug.mechanism} />
              <DossierCard title="⚠️ Safety Warnings" text={selectedDrug.side_effects} isWarning />
              <DossierCard title="📦 Dosage Forms" text={selectedDrug.dosage_forms} />
              <DossierCard title="💡 Pharmacist Counseling" text={selectedDrug.counseling_points} highlight />
              <DossierCard title="🚫 Contraindications" text={selectedDrug.contraindications} isWarning />
              {cleanName(selectedDrug.storage_conditions) && (
                <DossierCard title="🌡️ Storage Conditions" text={selectedDrug.storage_conditions} />
              )}
              {cleanName(selectedDrug.interaction_risk) && (
                <DossierCard title="🔄 Interaction Considerations" text={selectedDrug.interaction_risk} isWarning />
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              RxLearn is for pharmacy education. Confirm information with reliable references before using it in clinical practice.
            </p>

            {/* Existing close button */}
            <button
              onClick={() => {
                setSelectedDrugKey(null);
                setLookupNotice("");
              }}
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

// ============================================================
// 9. FLOATING BACKGROUND DECORATION (EXISTING DESIGN)
// ============================================================
function FloatingDecor() {
  const items = ["💊", "🔍", "📋"];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((symbol, index) => (
        <span
          key={index}
          className="absolute text-xl opacity-5 animate-float"
          style={{
            left: `${(index + 1) * 25}%`,
            animationDuration: `${10 + index * 3}s`,
            animationDelay: `${index * 1.5}s`,
          }}
        >
          {symbol}
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

// ============================================================
// 10. REUSABLE DRUG INFORMATION CARD (EXISTING DESIGN)
// ============================================================
function DossierCard({
  title,
  text,
  highlight = false,
  isWarning = false,
}: {
  title: string;
  text?: string | null;
  highlight?: boolean;
  isWarning?: boolean;
}) {
  let cardStyle = "bg-white border-slate-200 text-slate-700";
  if (highlight) cardStyle = "bg-sky-50/50 border-sky-200 text-sky-950";
  if (isWarning) cardStyle = "bg-rose-50/40 border-rose-200 text-rose-950";

  return (
    <div className={`p-5 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-default ${cardStyle}`}>
      <h3 className={`text-[10px] font-black uppercase tracking-[0.25em] mb-3 ${highlight ? "text-[#1E7B92]" : isWarning ? "text-rose-600" : "text-slate-400"}`}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed font-medium">{displayField(text)}</p>
    </div>
  );
}
