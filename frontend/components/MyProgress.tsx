"use client";

export default function MyProgress() {
  const skills = [
    { name: "Prescription Analysis", level: "85%", color: "bg-blue-600" },
    { name: "Drug Interaction Knowledge", level: "60%", color: "bg-[#0f172a]" },
    { name: "Dosage Calculations", level: "92%", color: "bg-blue-400" },
  ];

  return (
    <div className="animate-in slide-in-from-left-8 duration-700 space-y-10">
      
      {/* --- TOP HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h3 className="text-4xl font-black text-[#0f172a] uppercase tracking-tighter">
            Academic <span className="text-blue-600 italic">Progress</span>
          </h3>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
            Real-time Performance Analytics
          </p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
           <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Rank: Scholar Level 04</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- BIG PROGRESS CIRCLE --- */}
        <div className="lg:col-span-1 bg-white p-12 rounded-[60px] border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center relative overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-10 relative z-10">Total Completion</p>
          
          <div className="relative inline-flex items-center justify-center p-16 rounded-full border-[12px] border-slate-50 border-t-blue-600 border-l-blue-600 shadow-inner group">
             <span className="text-7xl font-black text-[#0f172a] tracking-tighter group-hover:scale-110 transition-transform duration-500">75%</span>
             {/* Decorative pulse effect */}
             <div className="absolute inset-0 rounded-full bg-blue-400 opacity-5 animate-ping"></div>
          </div>
          
          <p className="mt-10 text-[11px] font-bold text-slate-500 max-w-[150px] leading-relaxed italic">
            "Only 2 modules left to reach Advanced Certification"
          </p>
        </div>

        {/* --- SKILLS & MASTERY BARS --- */}
        <div className="lg:col-span-2 bg-white p-12 rounded-[60px] border border-slate-100 shadow-sm flex flex-col justify-center space-y-8">
          <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Subject Mastery</h4>
          
          <div className="space-y-8">
            {skills.map((skill, index) => (
              <div key={index} className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black text-[#0f172a] uppercase tracking-tight">{skill.name}</span>
                  <span className="text-[10px] font-bold text-blue-600">{skill.level}</span>
                </div>
                <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                  <div 
                    className={`h-full ${skill.color} rounded-full transition-all duration-1000 delay-300`} 
                    style={{ width: skill.level }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-50 flex gap-4">
             <div className="flex-1 bg-slate-50 p-4 rounded-3xl text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase">Average Grade</p>
                <p className="text-xl font-black text-[#0f172a]">A-</p>
             </div>
             <div className="flex-1 bg-slate-50 p-4 rounded-3xl text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase">Quiz Accuracy</p>
                <p className="text-xl font-black text-blue-600">88%</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}