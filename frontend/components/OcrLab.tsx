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
      const formData = new FormData();
      const blob = await (await fetch(image)).blob();
      formData.append("file", blob, "rx_scan.jpg");

      // Use localhost to avoid IP mapping issues
      const res = await fetch("http://localhost:8000/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setMedications(data.medications);
        setAnalysis(data.analysis || []);
      } else {
        alert("Server Error: " + data.error);
      }
    } catch {
      alert("Error: Backend server is not responding!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 font-sans text-slate-800">

      {/* HEADER */}
      <div className="flex justify-between items-center px-10 py-4 bg-white shadow-sm border-b">
        <div>
          <h1 className="text-xl font-black text-blue-600 tracking-tighter">💊 RxLearn AI</h1>
          <p className="text-[10px] uppercase text-slate-400 font-bold">Student Clinical Portal</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-all"
          >
            📂 Upload Rx
          </button>

          <button
            onClick={analyze}
            disabled={!image || loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-300 transition-all"
          >
            {loading ? "🔍 Analyzing..." : "Run Analysis"}
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

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: IMAGE VIEWPORT */}
        <div className="flex-1 flex flex-col items-center justify-center p-10 bg-slate-200/50 relative">
          {!image ? (
            <div className="text-center text-slate-400">
              <div className="text-6xl mb-4">📄</div>
              <p className="font-medium">Please upload a handwritten prescription</p>
            </div>
          ) : (
            <img src={image} className="max-h-full rounded-xl shadow-2xl border-4 border-white" />
          )}

          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-blue-600 font-bold animate-pulse uppercase text-xs tracking-widest">Neural Network Processing...</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: CLINICAL PANEL */}
        <div className="w-[450px] bg-white p-6 overflow-y-auto border-l shadow-xl">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Extraction Data</h2>

          {medications.length === 0 && !loading && (
            <p className="text-sm text-slate-300 italic text-center py-20">Awaiting scan input...</p>
          )}

          {medications.map((m, i) => (
            <div key={i} className={`mb-5 p-4 rounded-xl border ${m.verified ? 'bg-blue-50/50 border-blue-100 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
              
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-black text-slate-900 leading-tight">{m.brand_name}</h3>
                  <p className="text-[11px] font-bold text-blue-600 uppercase tracking-tight">{m.generic_name}</p>
                </div>
                {m.verified && (
                  <span className="text-[9px] bg-blue-600 text-white px-2 py-1 rounded font-bold">
                    {m.confidence}%
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 my-3">
                <div className="bg-white p-2 rounded border border-slate-100">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Strength</p>
                  <p className="text-xs font-medium">{m.strength}</p>
                </div>
                <div className="bg-white p-2 rounded border border-slate-100">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Frequency</p>
                  <p className="text-xs font-medium">{m.frequency}</p>
                </div>
              </div>

              {m.verified && (
                <p className="text-[11px] text-slate-600 leading-relaxed border-t pt-2 mt-2">
                  <span className="font-bold text-blue-800">Insight:</span> {m.description}
                </p>
              )}

              <div className="mt-3 pt-2 border-t border-slate-100">
                <p className="text-[9px] font-mono text-slate-400">OCR Trace: "{m.raw_text}"</p>
              </div>
            </div>
          ))}

          {/* WARNINGS SECTION */}
          {analysis.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4">Clinical Safety Analysis</h3>
              {analysis.map((a, i) => (
                <div key={i} className="flex gap-3 bg-red-50 border border-red-100 p-3 rounded-lg mb-2 text-xs text-red-700 font-medium animate-bounce-short">
                  <span>⚠️</span>
                  <p>{a}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-slate-900 text-slate-500 text-[10px] py-2 px-10 flex justify-between">
        <span>© 2026 RxLearn Project • BIT Moratuwa</span>
        <span>Engine: EasyOCR v1.7.2 + PyTorch</span>
      </div>
    </div>
  );
}