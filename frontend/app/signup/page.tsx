"use client";
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Aesthetic */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <img 
          src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2070" 
          className="w-full h-full object-cover opacity-5 blur-[2px]"
          alt="Lab Background"
        />
      </div>

      {/* The Sign Up Form Card */}
      <div className="relative z-10 w-full max-w-[450px] bg-white rounded-[60px] p-12 shadow-2xl border-2 border-white animate-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-teal-600 mb-2 italic">RxLearn</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Create Academic Profile</p>
        </div>

        <form className="space-y-6 flex flex-col items-center">
          <div className="w-full max-w-[90%] space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-teal-300 transition-all text-sm shadow-inner" placeholder="Enter your full name" />
          </div>

          <div className="w-full max-w-[90%] space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
            <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-teal-300 transition-all text-sm shadow-inner" placeholder="Choose a username" />
          </div>

          <div className="w-full max-w-[90%] space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <input type="password" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-teal-300 transition-all text-sm shadow-inner" placeholder="••••••••" />
          </div>

          <button 
            type="button"
            onClick={() => router.push('/')} 
            className="w-full max-w-[90%] bg-teal-600 text-white py-5 rounded-[25px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:bg-slate-900 transition-all mt-4"
          >
            Complete Registration
          </button>
          
          <button 
            type="button"
            onClick={() => router.push('/')}
            className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-teal-600 transition-colors mt-2"
          >
            Back to Home
          </button>
        </form>
      </div>
    </div>
  );
}