"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RxLearnPlatform() {
  const [activeTab, setActiveTab] = useState("home");
  const [showLogin, setShowLogin] = useState(false); 
  const router = useRouter();

  return (
    <div className="min-h-screen font-sans flex flex-col relative bg-slate-50 selection:bg-blue-100 overflow-hidden text-slate-900">
      
      {/* --- COMPLEX LIGHT BLUE BACKGROUND --- */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <img 
          src="https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
          className="w-full h-full object-cover opacity-20"
          alt="Medical Research Background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-blue-50/40 to-slate-200/60"></div>
      </div>

      {/* --- NAVIGATION BAR --- */}
      <nav className="relative z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-10 py-5 flex justify-between items-center sticky top-0 shadow-sm">
        <div className="flex items-center gap-10">
          <div className="cursor-pointer group" onClick={() => { setActiveTab("home"); setShowLogin(false); }}>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Rx<span className="text-blue-600 underline decoration-4 underline-offset-4">Learn</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
              Education Purpose Only
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => { setActiveTab("home"); setShowLogin(true); }} 
             className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-all px-4"
           >
             Log In
           </button>
           
           {/* RESTORED: Using Blue instead of Black for visibility */}
           <button 
             onClick={() => router.push('/signup')} 
             className="bg-blue-600 text-white px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-slate-900 transition-all"
           >
             Sign Up
           </button>
        </div>
      </nav>

      <main className="relative z-10 flex-grow w-full max-w-7xl mx-auto px-6 flex flex-col items-center justify-center">
        
        {activeTab === "home" && (
          <div className="w-full flex flex-col items-center py-10">
            
            {/* TEXT HEADER */}
            <div className={`text-center transition-all duration-1000 ${showLogin ? 'mb-12 scale-90 opacity-40' : 'mb-0 scale-100'}`}>
              <div className="inline-block bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8">
                BIT Moratuwa • 2026
              </div>
              <h2 className="text-7xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.85] uppercase">
                VIRTUAL <br/>
                <span className="text-blue-600 italic">PHARMACY</span> <br/>
                LABS.
              </h2>
            </div>
            
            {/* LOGIN CARD */}
            {showLogin && (
              <div className="w-full max-w-[420px] bg-white p-12 rounded-[50px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center animate-in slide-in-from-bottom-10 duration-500">
                 <div className="w-full space-y-7 flex flex-col items-center">
                    
                    <div className="w-full max-w-[90%] space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-sm outline-none focus:border-blue-400 transition-all shadow-inner" 
                        placeholder="Student ID" 
                      />
                    </div>

                    <div className="w-full max-w-[90%] space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                      <input 
                        type="password" 
                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-sm outline-none focus:border-blue-400 transition-all shadow-inner" 
                        placeholder="••••••••" 
                      />
                    </div>
                    
                    {/* RESTORED: Using solid Black with white text that we know works */}
                    <button 
                      onClick={() => setActiveTab("dashboard")} 
                      className="w-full max-w-[90%] bg-slate-900 text-white py-5 rounded-[22px] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-blue-600 transition-all mt-4"
                    >
                      Enter Platform
                    </button>
                    
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                        Need an account?{" "}
                        <button 
                          onClick={() => router.push('/signup')}
                          className="text-blue-600 font-black hover:underline underline-offset-4"
                        >
                          Sign Up
                        </button>
                    </p>
                 </div>
              </div>
            )}
          </div>
        )}

      </main>

      <footer className="relative z-10 p-10 text-center opacity-40 mt-auto">
        <p className="text-[9px] font-black text-slate-900 uppercase tracking-[0.5em]">RxLearn Platform • Sri Lanka</p>
      </footer>
    </div>
  );
}