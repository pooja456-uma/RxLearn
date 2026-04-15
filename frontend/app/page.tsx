"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// --- COMPONENT IMPORTS ---
import Dashboard from '../components/Dashboard';
import OcrLab from '../components/OcrLab';
import DrugDictionary from '../components/DrugDictionary';
import MyProgress from '../components/MyProgress';
import EducationalLab from '../components/EducationalLab';
import RxForum from '../components/RxForum';
import Contact from '../components/Contact';

export default function RxLearnPlatform() {
  const [activeTab, setActiveTab] = useState("home");
  const [showLogin, setShowLogin] = useState(false); 
  const router = useRouter();

  const renderTabContent = () => {
    switch(activeTab) {
      case "dashboard": return <Dashboard />;
      case "ocr lab": return <OcrLab />;
      case "dictionary": return <DrugDictionary />;
      case "progress": return <MyProgress />;
      case "educational lab": return <EducationalLab />;
      case "rxforum": return <RxForum />;
      case "contact": return <Contact />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col relative bg-slate-50 selection:bg-blue-100 overflow-x-hidden text-slate-900">
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <img 
          src="https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
          className="w-full h-full object-cover opacity-10"
          alt="Pharmacy Lab"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-blue-50/40 to-slate-200/60"></div>
      </div>

      {/* --- NAVIGATION BAR --- */}
      <nav className="relative z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 shadow-sm">
        <div className="flex items-center gap-10">
          <div className="cursor-pointer" onClick={() => { setActiveTab("home"); setShowLogin(false); }}>
            <h1 className="text-2xl font-black tracking-tight text-[#0f172a]">
              Rx<span className="text-blue-600">Learn</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic leading-none">
              Education Purpose Only
            </p>
          </div>

          {/* --- ONLY ADDED THIS: TABS APPEAR IN A ROW AFTER LOGIN --- */}
          {activeTab !== "home" && (
            <div className="flex items-center gap-4 ml-6 overflow-x-auto no-scrollbar">
              {[
                "Dashboard", "OCR Lab", "Dictionary", 
                "Progress", "Educational Lab", "RxForum", "Contact"
              ].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`text-[9px] font-black uppercase tracking-widest transition-all px-3 py-1 whitespace-nowrap ${
                    activeTab === tab.toLowerCase() 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-slate-400 hover:text-blue-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {activeTab === "home" ? (
            <>
              <button 
                onClick={() => setShowLogin(true)} 
                className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-all px-4"
              >
                Log In
              </button>
              
              <button 
                onClick={() => router.push('/signup')} 
                className="text-[11px] font-black uppercase tracking-widest text-blue-600 hover:text-[#0f172a] transition-all px-6 py-2 border-2 border-blue-600/20 rounded-xl hover:border-blue-600"
              >
                Sign Up
              </button>
            </>
          ) : (
            <button 
              onClick={() => { setActiveTab("home"); setShowLogin(false); }} 
              className="text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 px-5 py-2 rounded-xl transition-all font-extrabold"
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      <main className="relative z-10 flex-grow w-full max-w-7xl mx-auto px-6 py-12 flex flex-col justify-center">
        
        {activeTab === "home" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className={`text-center transition-all duration-700 ${showLogin ? 'scale-75 opacity-40 mb-12' : 'scale-100'}`}>
              <h2 className="text-7xl md:text-8xl font-black text-[#0f172a] tracking-tighter leading-[0.85] uppercase">
                VIRTUAL <br/>
                <span className="text-blue-600 italic">PHARMACY</span> <br/>
                LABS.
              </h2>
            </div>

            {showLogin && (
              /* --- KEPT EXACTLY THE SAME: YOUR LOGIN FORM --- */
              <div className="w-full max-w-[440px] bg-white p-12 rounded-[60px] shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-10 flex flex-col items-center">
                <h3 className="text-xl font-black text-[#0f172a] uppercase tracking-tighter mb-8">Student Access</h3>
                
                <div className="w-full space-y-7 flex flex-col items-center">
                   <div className="w-full space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Username</label>
                      <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm" placeholder="ID Number" />
                   </div>
                   
                   <div className="w-full space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Password</label>
                      <input type="password" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm" placeholder="••••••••" />
                   </div>
                   
                   <button 
                     onClick={() => setActiveTab("dashboard")} 
                     className="w-full bg-blue-600 text-white py-5 rounded-[22px] font-black text-[11px] uppercase tracking-[0.3em] shadow-lg shadow-blue-200 hover:bg-[#0f172a] transition-all mt-4"
                   >
                     Enter Platform
                   </button>
                   
                   <p className="text-[10px] font-bold text-slate-400 uppercase pt-2">
                      New Student? <button onClick={() => router.push('/signup')} className="text-blue-600 font-black hover:underline underline-offset-4 ml-1">Sign Up</button>
                   </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- DYNAMIC TAB CONTENT --- */}
        {activeTab !== "home" && (
          <div className="w-full animate-in fade-in duration-500">
            {renderTabContent()}
          </div>
        )}

      </main>

      <footer className="relative z-10 p-10 text-center opacity-30 mt-auto">
        <p className="text-[9px] font-black text-[#0f172a] uppercase tracking-[0.5em]">RxLearn Platform • BIT Project 2026</p>
      </footer>
    </div>
  );
}