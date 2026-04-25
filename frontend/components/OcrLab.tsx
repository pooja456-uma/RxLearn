"use client";
import { useState, useRef } from "react";

export default function OcrLab() {
  const [image, setImage] = useState<string | null>(null);
  const [medications, setMedications] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    setMedications([]);
    setAnalysis([]);

    try {
      // 1. Convert Base64 to Blob reliably
      const response = await fetch(image);
      const blob = await response.blob();

      // 2. Prepare FormData
      const formData = new FormData();
      formData.append("file", blob, "rx_scan.jpg");

      // 3. Request with explicit IP to avoid localhost resolution issues
      const res = await fetch("http://127.0.0.1:8000/ocr", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`);
      }

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
    <div className="h-screen flex flex-col bg-gradient-to-b from-pink-50 via-white to-blue-50 font-sans text-slate-800">

      {/* 🌸 HEADER */}
      <div className="flex justify-between items-center px-10 py-4 bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-black text-pink-500 tracking-tight">
            💊 RxLearn Lab
          </h1>
          <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">
            Neural Prescription Analysis ✨
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="bg-pink-50 border border-pink-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-pink-100 transition-all active:scale-95"
          >
            📂 Upload Rx
          </button>

          <button
            onClick={analyze}
            disabled={!image || loading}
            className="bg-pink-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-pink-200 hover:bg-pink-600 disabled:bg-slate-300 transition-all active:scale-95"
          >
            {loading ? "💖 Analyzing..." : "✨ Analyze"}
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

      {/* 🌈 BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: IMAGE VIEWPORT */}
        <div className="flex-1 flex flex-col items-center justify-center p-10 relative bg-slate-900/5">
          {!image ? (
            <div className="text-center text-slate-400">
              <div className="text-6xl mb-4 animate-bounce">📄</div>
              <p className="font-medium">
                Upload a medical script to begin analysis ✨
              </p>
            </div>
          ) : (
            <div className="relative group">
              <img
                src={image}
                className="max-h-[75vh] rounded-2xl shadow-2xl border-4 border-white transition-transform group-hover:scale-[1.01]"
              />
              <button 
                onClick={() => setImage(null)}
                className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="flex flex-col items-center">
                <div className="text-5xl animate-pulse mb-3">🧠</div>
                <p className="text-pink-500 font-bold text-xs tracking-widest uppercase animate-pulse">
                  System Reading prescription...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: DATA PANEL */}
        <div className="w-[480px] bg-white/80 backdrop-blur-md p-8 overflow-y-auto border-l shadow-2xl">

          <h2 className="text-xs font-black text-pink-400 uppercase tracking-widest mb-8 flex items-center gap-2">
             Clinical Extractions <span className="w-10 h-[1px] bg-pink-100"></span>
          </h2>

          {medications.length === 0 && !loading && (
            <div className="text-center py-20 opacity-30">
              <div className="text-4xl mb-4">🧪</div>
              <p className="text-sm italic font-medium">Waiting for data processing...</p>
            </div>
          )}

          {medications.map((m, i) => (
            <div
              key={i}
              className={`mb-6 p-5 rounded-[25px] border-2 transition-all hover:shadow-md ${
                m.verified
                  ? "bg-pink-50/40 border-pink-100"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-black text-slate-900 text-lg leading-none">
                    {m.brand_name || "Unknown Brand"}
                  </h3>
                  <p className="text-[11px] font-bold text-pink-500 uppercase mt-1">
                    {m.generic_name || "Generic not found"}
                  </p>
                </div>

                {m.verified && (
                  <div className="text-right">
                    <span className="text-[10px] bg-pink-500 text-white px-3 py-1 rounded-full font-black shadow-sm">
                      {m.confidence}% Match
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-white/80 p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Strength</p>
                  <p className="text-sm font-bold text-slate-700">{m.strength || "N/A"}</p>
                </div>

                <div className="bg-white/80 p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Frequency</p>
                  <p className="text-sm font-bold text-slate-700">{m.frequency || "N/A"}</p>
                </div>
              </div>

              {m.verified && m.description && (
                <div className="bg-white/50 p-3 rounded-xl border border-pink-50 mt-2">
                   <p className="text-[11px] text-slate-600 leading-relaxed italic">
                    <span className="font-black text-pink-400 uppercase text-[9px] not-italic mr-1">Clinical Insight:</span> 
                    {m.description}
                  </p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-300 uppercase">OCR RAW:</span>
                <p className="text-[10px] font-mono text-slate-400 truncate italic">
                  "{m.raw_text || "---"}"
                </p>
              </div>
            </div>
          ))}

          {/* SAFETY WARNINGS */}
          {analysis.length > 0 && (
            <div className="mt-10 pt-8 border-t-2 border-dashed border-slate-200">
              <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                ⚠️ Institutional Safety Validation
              </h3>

              {analysis.map((a, i) => (
                <div
                  key={i}
                  className="flex gap-4 bg-rose-50 border border-rose-100 p-5 rounded-[20px] mb-3 text-xs text-rose-800 font-bold italic shadow-sm"
                >
                  <span className="text-lg not-italic">⚠️</span>
                  <p className="leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🌸 FOOTER */}
      <div className="bg-pink-500 text-white text-[10px] py-2 px-10 flex justify-between font-bold uppercase tracking-widest">
        <span>💊 RxLearn Lab • Institutional Simulation v2.0</span>
        <span>Western Province • Sri Lanka ✨</span>
      </div>
    </div>
  );
}