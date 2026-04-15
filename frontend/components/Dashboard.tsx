"use client";

export default function Dashboard() {
  return (
    <div className="animate-in slide-in-from-bottom-8 duration-700 space-y-10">
      
      {/* --- WELCOME HEADER --- */}
      <div className="bg-white p-14 rounded-[60px] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-4xl font-black text-[#0f172a] tracking-tighter uppercase italic">
            Student <span className="text-blue-600">Dashboard</span>
          </h3>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-3">
            System Status: <span className="text-emerald-500">Operational</span> • Welcome back, Student
          </p>
        </div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50/50 rounded-bl-[120px] -mr-10 -mt-10"></div>
      </div>
      
      {/* --- STATISTICS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[50px] border border-slate-100 flex flex-col items-center text-center group hover:border-blue-200 transition-all shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Prescriptions Scanned</span>
          <p className="text-6xl font-black text-[#0f172a] mt-4 tracking-tighter group-hover:scale-110 transition-transform">12</p>
        </div>

        <div className="bg-[#0f172a] p-10 rounded-[50px] text-white flex flex-col items-center text-center shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Lab Modules</span>
            <p className="text-6xl font-black mt-4 tracking-tighter group-hover:scale-110 transition-transform text-white">04</p>
          </div>
          {/* Subtle background glow */}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-600 opacity-20 blur-3xl"></div>
        </div>

        <div className="bg-blue-600 p-10 rounded-[50px] text-white flex flex-col items-center text-center shadow-2xl shadow-blue-600/30 group">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Current Rank</span>
          <p className="text-6xl font-black mt-4 tracking-tighter group-hover:scale-110 transition-transform">#01</p>
        </div>
      </div>

      {/* --- RECENT ACTIVITY SECTION --- */}
      <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-8 px-2">
           <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Recent Activity</h4>
           <button className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline decoration-2">View All Reports</button>
        </div>
        
        <div className="space-y-4">
          {[
            { label: "OCR Scan", name: "Amoxicillin Prescription", time: "2 hours ago", status: "Success" },
            { label: "Module Quiz", name: "Pharmacology Basics", time: "Yesterday", status: "Passed" }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[30px] border border-transparent hover:border-slate-100 transition-all">
               <div className="flex items-center gap-6">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-xs shadow-sm font-bold text-blue-600">
                    {item.label === "OCR Scan" ? "🔬" : "📖"}
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#0f172a]">{item.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.time}</p>
                  </div>
               </div>
               <span className="px-4 py-1.5 bg-white rounded-full text-[9px] font-black text-emerald-500 border border-emerald-100 uppercase tracking-widest">
                 {item.status}
               </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}