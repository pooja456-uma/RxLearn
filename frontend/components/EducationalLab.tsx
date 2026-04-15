"use client";

export default function EducationalLab() {
  const courses = [
    { title: "Pharmacology 101", modules: "12", status: "In Progress", icon: "💊", progress: "65%" },
    { title: "Prescription Ethics", modules: "08", status: "Completed", icon: "⚖️", progress: "100%" },
    { title: "Safety Protocols", modules: "10", status: "Not Started", icon: "🛡️", progress: "0%" },
    { title: "Dosage Math", modules: "15", status: "Quiz Ready", icon: "🧮", progress: "90%" }
  ];

  return (
    <div className="animate-in zoom-in-95 duration-700 space-y-10">
      
      {/* --- HEADER --- */}
      <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-3xl font-black text-[#0f172a] tracking-tighter uppercase">
            Educational <span className="text-blue-600 italic">Modules</span>
          </h3>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">
            Curated Pharmacy Curriculum v2.0
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#0f172a] px-6 py-3 rounded-2xl text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
             4 Enrolled
          </div>
        </div>
      </div>

      {/* --- MODULE GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {courses.map((course, i) => (
          <div 
            key={i} 
            className="bg-white p-10 rounded-[50px] border border-slate-100 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-900/5 transition-all group cursor-pointer relative overflow-hidden"
          >
            {/* Background Icon Watermark */}
            <div className="absolute -right-4 -bottom-4 text-8xl opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700">
              {course.icon}
            </div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl mb-8 group-hover:bg-[#0f172a] transition-all duration-500 flex items-center justify-center text-3xl shadow-inner group-hover:shadow-blue-500/20">
                {course.icon}
              </div>
              
              <h4 className="font-black text-lg text-[#0f172a] uppercase tracking-tighter mb-2 group-hover:text-blue-600 transition-colors">
                {course.title}
              </h4>
              
              <div className="flex items-center gap-4 mb-8">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {course.modules} Modules
                </p>
                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                <p className={`text-[10px] font-black uppercase tracking-widest ${course.status === 'Completed' ? 'text-emerald-500' : 'text-blue-400'}`}>
                  {course.status}
                </p>
              </div>

              {/* Progress Bar inside Card */}
              <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                <div 
                  className="h-full bg-blue-600 rounded-full group-hover:bg-[#0f172a] transition-all duration-1000" 
                  style={{ width: course.progress }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}