"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// COMPONENTS
import Dashboard from "../components/Dashboard";
import OcrLab from "../components/OcrLab";
import DrugDictionary from "../components/DrugDictionary";
import MyProgress from "../components/MyProgress";
import EducationalLab from "../components/EducationalLab";
import RxForum from "../components/RxForum";
import Contact from "../components/Contact";

// Profile Icon Mapping
const AVATAR_MAP: Record<number, string> = {
  1: "👨‍⚕️", 2: "👩‍🔬", 3: "🎓", 4: "💊", 5: "🔬"
};

export default function RxLearnPlatform() {
  const [activeTab, setActiveTab] = useState("home");
  const [showLogin, setShowLogin] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const [user, setUser] = useState({ name: "", regNo: "", role: "", icon: 1 });
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    const name = localStorage.getItem("userName");
    const reg = localStorage.getItem("userReg");
    const role = localStorage.getItem("userRole");
    const icon = localStorage.getItem("userIcon");

    if (name && reg) {
      setUser({ name, regNo: reg, role: role || "student", icon: parseInt(icon || "1") });
      if (activeTab === "home") setActiveTab("dashboard");
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeTab]);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("userName", data.full_name);
        localStorage.setItem("userReg", data.registration_number);
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("userIcon", data.profile_icon || "1");
        
        setUser({ name: data.full_name, regNo: data.registration_number, role: data.role, icon: data.profile_icon || 1 });
        
        if (data.role === "admin") {
          router.push("/admin/portal");
        } else {
          setActiveTab("dashboard");
          setShowLogin(false);
        }
      } else {
        setError(data.detail || "Invalid Credentials");
      }
    } catch (err) {
      setError("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser({ name: "", regNo: "", role: "", icon: 1 });
    setActiveTab("home");
    setShowProfileMenu(false);
    router.push("/");
  };

  const renderTabContent = () => {
    switch (activeTab) {
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
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#eef3f8] text-slate-900">
      
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <img
          src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2070"
          className="w-full h-full object-cover opacity-10"
          alt="Lab Background"
        />
      </div>

      <div className="absolute inset-0 bg-white/40 z-0" />

      {/* NAVBAR */}
      <nav className="relative z-[1000] bg-white/70 backdrop-blur-xl border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 shadow-sm overflow-visible">
        <div className="cursor-pointer" onClick={() => { setActiveTab("home"); setShowLogin(false); }}>
          <h1 className="text-2xl font-black text-[#1f6f8b]">
            Rx<span className="text-slate-700">Learn</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Education Purpose Only</p>
        </div>

        {activeTab !== "home" && (
          <div className="ml-6 flex items-center bg-white/50 backdrop-blur-xl border border-slate-200 rounded-full p-1 shadow-inner overflow-visible">
            {["Dashboard", "OCR Lab", "Dictionary", "Progress", "Educational Lab", "RxForum", "Contact"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab.toLowerCase() ? "bg-[#1f6f8b] text-white shadow-md" : "text-slate-500 hover:text-[#1f6f8b]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 overflow-visible">
          {activeTab === "home" ? (
            <div className="flex gap-3">
              <button onClick={() => setShowLogin(true)} className="px-6 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">Log In</button>
              <button onClick={() => router.push("/signup")} className="px-6 py-2 rounded-full bg-[#1f6f8b] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#15586e] shadow-lg transition-all">Sign Up</button>
            </div>
          ) : (
            <div className="relative overflow-visible" ref={menuRef}>
              {/* THE ROUND PROFILE AVATAR */}
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-14 h-14 rounded-full bg-white border-2 border-[#1f6f8b] flex items-center justify-center text-3xl shadow-lg hover:scale-110 transition-all"
              >
                {AVATAR_MAP[user.icon] || "👤"}
              </button>

              {/* DROPDOWN MENU - ALIGNED TO RIGHT EDGE TO OPEN INWARD */}
              {showProfileMenu && (
                <div 
                  className="absolute right-0 mt-4 w-80 bg-white rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-slate-100 p-8 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-[9999]"
                  style={{ right: '0px' }}
                >
                  <div className="text-center mb-6">
                    <div className="w-24 h-24 bg-slate-50 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl border border-slate-100 shadow-inner">
                      {AVATAR_MAP[user.icon]}
                    </div>
                    <p className="text-base font-black text-slate-800 uppercase tracking-tighter leading-tight">{user.name}</p>
                    <p className="text-xs font-bold text-[#1f6f8b] mt-2 bg-blue-50 py-1 px-3 rounded-full inline-block">{user.regNo}</p>
                  </div>

                  <div className="space-y-2 border-t border-slate-50 pt-6">
                    <button onClick={() => { router.push('/profile'); setShowProfileMenu(false); }} className="w-full text-left px-5 py-4 rounded-2xl hover:bg-slate-50 flex items-center gap-4 group transition-all">
                      <span className="text-xl">⚙️</span>
                      <span className="text-xs font-black text-slate-600 uppercase tracking-widest group-hover:text-[#1f6f8b]">Profile Settings</span>
                    </button>
                    <button onClick={handleLogout} className="w-full text-left px-5 py-4 rounded-2xl hover:bg-rose-50 flex items-center gap-4 group transition-all">
                      <span className="text-xl">🚪</span>
                      <span className="text-xs font-black text-rose-500 uppercase tracking-widest">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT AREA - LOGIN FORM REVERTED TO ORIGINAL */}
      <main className="relative z-10 flex-grow max-w-7xl mx-auto px-6 py-12 w-full">
        {activeTab === "home" && (
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <div className={`text-center transition-all duration-500 ${showLogin ? "scale-75 opacity-30" : ""}`}>
              <h2 className="text-5xl md:text-7xl font-black text-[#1f6f8b] uppercase leading-none">
                VIRTUAL <span className="text-slate-700">PHARMACY</span> LABS
              </h2>
              <div className="w-24 h-1 bg-[#1f6f8b] mx-auto mt-6 opacity-30 rounded-full" />
            </div>

            {showLogin && (
              <div className="mt-10 w-full max-w-[420px] bg-white/80 backdrop-blur-xl border border-slate-200 p-10 rounded-[40px] shadow-xl animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-center font-black text-slate-700 mb-6 tracking-widest text-sm uppercase">Institutional Access</h3>
                
                <input
                  className="w-full p-4 mb-4 rounded-xl border border-slate-200 focus:border-[#1f6f8b] outline-none text-sm"
                  placeholder="Registration No or Username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />

                <input
                  type="password"
                  className="w-full p-4 mb-4 rounded-xl border border-slate-200 focus:border-[#1f6f8b] outline-none text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {error && <p className="text-red-500 text-[10px] font-bold text-center mb-4 uppercase">{error}</p>}

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-[#1f6f8b] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#15586e] transition-all"
                >
                  {loading ? "Authenticating..." : "Enter Platform"}
                </button>

                <p className="text-center text-xs mt-4 text-slate-400 font-bold uppercase tracking-tighter">
                  New student?{" "}
                  <span onClick={() => router.push("/signup")} className="text-[#1f6f8b] cursor-pointer">Register Now</span>
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab !== "home" && (
          <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[30px] p-6 shadow-xl min-h-[60vh]">
            {renderTabContent()}
          </div>
        )}
      </main>

      <footer className="relative z-10 text-center p-8">
        <p className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">RxLearn Platform • Sri Lanka • 2026</p>
      </footer>
    </div>
  );
}