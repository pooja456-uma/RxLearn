"use client";

import { useState } from 'react';

export default function OcrLab() {
  const [isScanning, setIsScanning] = useState(false);

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 space-y-8">
      
      {/* --- HEADER --- */}
      <div className="bg-[#0f172a] p-10 rounded-[50px] text-white flex justify-between items-center overflow-hidden relative shadow-2xl">
        <div className="relative z-10">
          <h3 className="text-3xl font-black italic tracking-tighter uppercase">OCR <span className="text-blue-500">Analysis Lab</span></h3>
          <p className="text-blue-400 font-bold text-[9px] uppercase tracking-[0.4em] mt-2">Precision Prescription Scanning Technology</p>
        </div>
        <div className="text-5xl opacity-20 relative z-10">🔬</div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 opacity-10 blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- SCANNING AREA --- */}
        <div className="bg-white border-4 border-dashed border-blue-100 rounded-[60px] p-12 text-center flex flex-col items-center justify-center min-h-[400px] hover:border-blue-300 transition-colors">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-6 text-3xl shadow-inner">📸</div>
          <h4 className="text-xl font-black text-[#0f172a] mb-3 uppercase tracking-tight">Camera Preview</h4>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest max-w-[200px] leading-relaxed">
            Align prescription within the frame
          </p>
          
          <button 
            onClick={() => { setIsScanning(true); setTimeout(() => setIsScanning(false), 3000); }}
            className="mt-10 bg-[#0f172a] text-white px-10 py-4 rounded-[22px] font-black uppercase text-[10px] tracking-[0.3em] hover:bg-blue-600 transition-all shadow-xl active:scale-95"
          >
            {isScanning ? "Processing..." : "Start Analysis"}
          </button>
        </div>

        {/* --- RESULTS / INSTRUCTIONS PANEL --- */}
        <div className="space-y-6">
          <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm h-full">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 border-b border-slate-50 pb-4">Analysis Requirements</h4>
            
            <div className="space-y-6">
              {[
                { title: "Lighting Quality", desc: "Ensure the room is well lit", check: "✅" },
                { title: "Image Clarity", desc: "Keep the camera steady", check: "✅" },
                { title: "Handwriting Style", desc: "Supports standard medical prints", check: "⚡" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="text-lg">{item.check}</div>
                  <div>
                    <p className="text-[11px] font-black text-[#0f172a] uppercase">{item.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-blue-50 rounded-[30px] border border-blue-100">
               <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Pro Tip</p>
               <p className="text-[10px] text-slate-600 font-medium italic">"Flatten the paper completely to avoid shadow distortions during the OCR process."</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}