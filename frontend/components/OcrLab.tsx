"use client";
import { useState, useRef } from "react";

export default function OcrLab() {
  const [image, setImage] = useState<string | null>(null);
  const [medications, setMedications] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const clearAll = () => {
    setImage(null);
    setMedications([]);
    setAnalysis([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    setMedications([]);
    setAnalysis([]);

    // Data Preparation
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("file", blob, "rx_scan.jpg");

      // The API Handshake
      const res = await fetch("http://127.0.0.1:8000/ocr", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`);
      }

      // State Management & UI Feedback
      const data = await res.json();

      if (data.success) {
        setMedications(data.medications || []);
        setAnalysis(data.analysis || []);
      } else {
        alert("Extraction Error: " + (data.error || "System could not read the text."));
      }
    } catch (err: any) {
      console.error("OCR Lab Error:", err);
      alert("System Connection Error: Ensure your Python backend (main.py) is running on port 8000 and CORS is enabled.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#EBF0F3] font-sans text-[#2D3136]">

      {/* 💠 HEADER */}
      <div className="flex justify-between items-center px-10 py-4 bg-white shadow-sm border-b border-slate-300/60 sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-black text-[#1E7B92] tracking-tight">
            RxLEARN LAB
          </h1>
          <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mt-0.5">
            Neural Prescription Analysis
          </p>
        </div>

        <div className="flex gap-3">
          {/* 1. UPLOAD */}
          <button
            onClick={() => fileRef.current?.click()}
            className="bg-white border border-slate-300/80 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 text-[#2D3136] transition-all active:scale-95 shadow-sm"
          >
            📂 Upload Rx
          </button>

          {/* 2. ANALYZE */}
          <button
            onClick={analyze}
            disabled={!image || loading}
            className="bg-[#00A3E0] text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-[#008CBA] disabled:bg-slate-300 transition-all active:scale-95"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>

          {/* 3. CLEAR ALL */}
          <button
            onClick={clearAll}
            className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all active:scale-95 shadow-sm"
          >
            🗑️ Clear All
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          hidden
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => setImage(reader.result as string);
              reader.readAsDataURL(file);
            }
          }}
        />
      </div>

      {/* 🌐 BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: IMAGE VIEWPORT */}
        <div className="flex-1 flex flex-col items-center justify-center p-10 relative bg-slate-900/5">
          {!image ? (
            <div className="text-center text-slate-400">
              <div className="text-6xl mb-4">📄</div>
              <p className="font-bold text-xs uppercase tracking-wider">
                Upload a medical script to begin analysis
              </p>
            </div>
          ) : (
            <div className="relative group">
              <img
                src={image}
                className="max-h-[75vh] rounded-xl shadow-md border-4 border-white transition-transform group-hover:scale-[1.01]"
              />
              <button 
                onClick={() => setImage(null)}
                className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="flex flex-col items-center">
                <div className="text-5xl mb-3 animate-pulse">🧠</div>
                <p className="text-[#1E7B92] font-bold text-xs tracking-widest uppercase animate-pulse">
                  System Reading prescription...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: DATA PANEL */}
        <div className="w-[480px] bg-white p-8 overflow-y-auto border-l border-slate-300/60 shadow-sm">

          <h2 className="text-xs font-black text-[#2D3136] uppercase tracking-widest mb-8 flex items-center gap-2">
              Clinical Extractions <span className="w-10 h-[1px] bg-slate-200"></span>
          </h2>

          {medications.length === 0 && !loading && (
            <div className="text-center py-20 opacity-30">
              <div className="text-4xl mb-4">🧪</div>
              <p className="text-xs font-bold uppercase tracking-wider">Waiting for data processing...</p>
            </div>
          )}

          {medications.map((m, i) => (
            <div
              key={i}
              className={`mb-6 p-5 rounded-xl border transition-all hover:shadow-sm ${
                m.verified
                  ? "bg-[#EBF0F3]/30 border-[#1E7B92]/30"
                  : "bg-slate-50/50 border-slate-200"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-black text-[#2D3136] text-lg uppercase tracking-tight leading-none">
                    {m.brand_name || "Unknown Brand"}
                  </h3>
                  <p className="text-[11px] font-bold text-[#1E7B92] uppercase mt-1.5">
                    {m.generic_name || "Generic not found"}
                  </p>
                </div>

                {m.verified && (
                  <div className="text-right">
                    <span className="text-[10px] bg-[#1E7B92] text-white px-3 py-1 rounded-md font-bold shadow-sm uppercase tracking-wider">
                      {m.confidence}% Match
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-inner text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Strength</p>
                  <p className="text-sm font-bold text-[#2D3136]">{m.strength || "N/A"}</p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-inner text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Frequency</p>
                  <p className="text-sm font-bold text-[#2D3136]">{m.frequency || "N/A"}</p>
                </div>
              </div>

              {m.verified && m.description && (
                <div className="bg-[#EBF0F3]/40 p-3 rounded-lg border border-slate-200 mt-2">
                   <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    <span className="font-black text-[#1E7B92] uppercase text-[9px] tracking-wider mr-1.5 block mb-0.5">Clinical Insight:</span> 
                    {m.description}
                  </p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-wider">OCR RAW:</span>
                <p className="text-[10px] font-mono text-slate-400 truncate italic">
                  "{m.raw_text || "---"}"
                </p>
              </div>
            </div>
          ))}

          {/* SAFETY WARNINGS */}
          {analysis.length > 0 && (
            <div className="mt-10 pt-8 border-t-2 border-dashed border-slate-200">
              <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                ⚠️ Institutional Safety Validation
              </h3>

              {analysis.map((a, i) => (
                <div
                  key={i}
                  className="flex gap-4 bg-rose-50 border border-rose-100 p-5 rounded-xl mb-3 text-xs text-rose-800 font-bold shadow-sm"
                >
                  <span className="text-lg">⚠️</span>
                  <p className="leading-relaxed font-medium">{a}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 💠 FOOTER */}
      <div className="bg-[#1E7B92] text-white text-[10px] py-2 px-10 flex justify-between font-bold uppercase tracking-widest shadow-inner">
        <span>💊 RxLearn Lab • Institutional Simulation v2.0</span>
        <span>Western Province • Sri Lanka</span>
      </div>
    </div>
  );
}