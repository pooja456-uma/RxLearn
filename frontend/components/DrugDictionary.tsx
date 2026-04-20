"use client";

import { useState } from "react";

export default function DrugDictionary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrug, setSelectedDrug] = useState<any | null>(null);
  const [liveData, setLiveData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const drugs = [
    { name: "Amoxicillin", type: "Antibiotic", usage: "Bacterial Infections", color: "bg-blue-100 text-blue-600" },
    { name: "Metformin", type: "Antidiabetic", usage: "Type 2 Diabetes", color: "bg-emerald-100 text-emerald-600" },
    { name: "Atorvastatin", type: "Statin", usage: "High Cholesterol", color: "bg-rose-100 text-rose-600" },
    { name: "Paracetamol", type: "Analgesic", usage: "Pain & Fever", color: "bg-amber-100 text-amber-600" },
    { name: "Pantoprazole", type: "PPI", usage: "Acid Reflux", color: "bg-indigo-100 text-indigo-600" },
  ];

  const fetchLiveDetails = async (drugName: string) => {
    setLoading(true);
    setSelectedDrug(drugName);
    setLiveData(null);
    setError("");

    try {
      const res = await fetch(`http://127.0.0.1:8000/dictionary/${drugName}`);

      if (!res.ok) {
        throw new Error("Server not responding");
      }

      const data = await res.json();

      if (data.success) {
        setLiveData(data);
      } else {
        setError("No clinical data found in FDA database.");
      }

    } catch (err) {
      setError("❌ Cannot connect to backend. Make sure FastAPI is running.");
    } finally {
      setLoading(false);
    }
  };

  const filteredDrugs = drugs.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-2xl shadow">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            💊 Drug Dictionary
          </h1>
          <p className="text-sm text-slate-400">
            Search and explore clinical drug profiles
          </p>
        </div>

        <input
          type="text"
          placeholder="Search drugs..."
          className="w-full md:w-80 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* DRUG LIST */}
      <div className="grid md:grid-cols-2 gap-5">
        {filteredDrugs.map((drug) => (
          <div
            key={drug.name}
            className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition-all border"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">
                {drug.name}
              </h2>

              <span className={`text-xs px-3 py-1 rounded-full ${drug.color}`}>
                {drug.type}
              </span>
            </div>

            <p className="text-sm text-slate-500 mt-1">{drug.usage}</p>

            <button
              onClick={() => fetchLiveDetails(drug.name)}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition"
            >
              View Clinical Profile
            </button>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {selectedDrug && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">

            {/* HEADER */}
            <div className="p-5 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {selectedDrug}
                </h2>
                <p className="text-xs text-slate-400">
                  Clinical Reference Data
                </p>
              </div>

              <button
                onClick={() => setSelectedDrug(null)}
                className="text-slate-500 hover:text-red-500 text-lg"
              >
                ✕
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-6 overflow-y-auto space-y-4">

              {loading && (
                <div className="text-center text-blue-500 font-medium py-10 animate-pulse">
                  🔄 Fetching data from FDA...
                </div>
              )}

              {error && (
                <div className="text-center text-red-500 font-medium py-10">
                  {error}
                </div>
              )}

              {!loading && liveData && (
                <>
                  <Section title="Indications" data={liveData.indications} />
                  <Section title="Side Effects" data={liveData.side_effects} />
                  <Section title="Dosage" data={liveData.dosage} />
                  <Section title="Warnings" data={liveData.warnings} />
                </>
              )}

            </div>

            {/* FOOTER */}
            <div className="text-center text-xs text-slate-400 p-3 border-t">
              Powered by openFDA • Educational use only
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, data }: { title: string; data: any }) {
  const text = Array.isArray(data) ? data[0] : data;

  return (
    <div className="bg-slate-50 p-4 rounded-lg border">
      <h3 className="font-semibold text-blue-600 mb-2">{title}</h3>
      <p className="text-sm text-slate-700 whitespace-pre-line">
        {text?.substring(0, 500) || "No data available"}
      </p>
    </div>
  );
}