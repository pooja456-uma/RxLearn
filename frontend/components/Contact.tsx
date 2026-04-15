"use client";
export default function Contact() {
  return (
    <div className="max-w-3xl mx-auto bg-white p-16 rounded-[60px] border border-slate-100 shadow-sm animate-in zoom-in-95 duration-700 text-center">
      <h3 className="text-2xl font-black text-[#0f172a] uppercase tracking-[0.4em] mb-6">Support Hub</h3>
      <p className="text-slate-500 text-sm font-medium mb-10">Dedicated academic support for the RxLearn Learning Management System.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 p-6 rounded-3xl font-black text-[10px] uppercase tracking-widest text-slate-500">UOM • Moratuwa</div>
        <div className="bg-blue-50 p-6 rounded-3xl font-black text-[10px] uppercase tracking-widest text-blue-600">support@rxlearn.edu</div>
      </div>
    </div>
  );
}