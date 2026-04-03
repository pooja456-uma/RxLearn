"use client";
import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!searchQuery) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      // This connects to your Python Backend running on port 8000
      const response = await axios.get(`http://127.0.0.1:8000/medicine/${searchQuery}`);
      setResult(response.data);
    } catch (err) {
      setError("Medicine not found in our validated database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] flex flex-col items-center p-8 text-slate-900 font-sans">
      {/* Top Status Bar */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-16 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="bg-teal-600 p-2 rounded-lg text-white font-bold">Rx</div>
          <span className="text-slate-700 font-semibold">RxLearn Lab v1.0</span>
        </div>
        <div className="flex items-center gap-2 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
          <div className={`w-2 h-2 rounded-full animate-pulse ${result ? 'bg-green-500' : 'bg-teal-500'}`}></div>
          <span className="text-xs font-bold text-teal-700 uppercase">System Active</span>
        </div>
      </div>

      <div className="text-center w-full max-w-4xl">
        <h1 className="text-6xl font-black mb-4 text-slate-800 tracking-tight">
          Educational <span className="text-teal-600">Pharmacy Lab</span>
        </h1>
        <p className="text-slate-500 text-lg mb-12 max-w-xl mx-auto italic">
          Search the validated pharmaceutical database for drug analysis.
        </p>
        
        {/* THE ACTIVE SEARCH BAR */}
        <div className="relative max-w-2xl mx-auto mb-10">
          <input 
            type="text" 
            placeholder="Enter Drug Name (e.g., Celypro)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-slate-200 rounded-2xl px-8 py-6 text-xl focus:outline-none focus:border-teal-500 transition-all shadow-xl"
          />
          <button 
            onClick={handleSearch}
            className="absolute right-3 top-3 bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg active:scale-95"
          >
            {loading ? "SEARCHING..." : "SEARCH"}
          </button>
        </div>

        {/* ERROR MESSAGE */}
        {error && <div className="text-red-500 font-bold mb-6">⚠️ {error}</div>}

        {/* SEARCH RESULTS AREA */}
        {result && (
          <div className="bg-white p-8 rounded-3xl border-2 border-teal-100 shadow-2xl text-left animate-in fade-in zoom-in duration-300">
            <h2 className="text-3xl font-bold text-teal-700 mb-4">{result.name}</h2>
            <hr className="mb-6 border-slate-100" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Description</p>
                <p className="text-slate-700 leading-relaxed">{result.description}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Standard Dosage</p>
                <p className="text-slate-700 font-semibold">{result.dosage}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}