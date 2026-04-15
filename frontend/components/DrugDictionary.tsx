"use client";

import { useState } from 'react';

export default function DrugDictionary() {
  const [searchQuery, setSearchQuery] = useState("");

  const drugs = [
    { name: "Amoxicillin", type: "Antibiotic", usage: "Bacterial Infections", color: "text-blue-600" },
    { name: "Metformin", type: "Antidiabetic", usage: "Type 2 Diabetes", color: "text-emerald-600" },
    { name: "Atorvastatin", type: "Statin", usage: "High Cholesterol", color: "text-rose-600" },
    { name: "Paracetamol", type: "Analgesic", usage: "Pain & Fever", color: "text-amber-600" },
  ];

  const filteredDrugs = drugs.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-in slide-in-from-right-8 duration-700 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-4xl font-black text-[#0f172a] uppercase tracking-tighter">
            Drug <span className="text-blue-600 italic">Dictionary</span>
          </h3>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
            Verified Pharmaceutical Index v1.0
          </p>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <input 
            type="text" 
            placeholder="Search medications..." 
            className="w-full bg-slate-50 border-2 border-transparent p-5 rounded-[25px] text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-1 gap-4">
        {filteredDrugs.map((drug) => (
          <div 
            key={drug.name} 
            className="bg-white p-8 rounded-[40px] border border-slate-50 flex flex-col md:flex-row justify-between items-center hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-blue-600 font-black italic text-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                Rx
              </div>
              <div>
                <span className="font-black text-xl text-[#0f172a] tracking-tight block">{drug.name}</span>
                <div className="flex gap-2 mt-1">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 rounded-full ${drug.color}`}>
                    {drug.type}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-blue-50 text-blue-400 rounded-full">
                    {drug.usage}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
               <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest py-3 px-8 rounded-2xl bg-blue-50 group-hover:bg-[#0f172a] group-hover:text-white transition-all">
                 View Details
               </button>
            </div>
          </div>
        ))}

        {filteredDrugs.length === 0 && (
          <div className="text-center py-20 opacity-20 italic font-black uppercase tracking-[0.5em] text-xs">
            No results found
          </div>
        )}
      </div>
    </div>
  );
}