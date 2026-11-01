
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
import AIChatbox from "../components/AIChatbox";

// PROFILE ICON MAPPING
const AVATAR_MAP: Record<number, string> = {
  1: "👨‍⚕️",
  2: "👩‍🔬",
  3: "🎓",
  4: "💊",
  5: "🔬",
};

type RxLearnUser = {
  name: string;
  regNo: string;
  role: string;
  icon: number;
};

const EMPTY_USER: RxLearnUser = {
  name: "",
  regNo: "",
  role: "",
  icon: 1,
};

export default function RxLearnPlatform() {
  const [activeTab, setActiveTab] = useState("home");
  const [showLogin, setShowLogin] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [user, setUser] = useState<RxLearnUser>(EMPTY_USER);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // RESTORE EXISTING LOGIN SESSION
  useEffect(() => {
    const name = localStorage.getItem("userName");
    const reg = localStorage.getItem("userReg");
    const role = localStorage.getItem("userRole");
    const icon = localStorage.getItem("userIcon");
    const token = localStorage.getItem("accessToken");

    if (name && reg && token) {
      setUser({
        name,
        regNo: reg,
        role: role || "student",
        icon: Number(icon) || 1,
      });

      if (role === "admin") {
        router.push("/admin/portal");
      } else {
        setActiveTab("dashboard");
      }
    }
  }, [router]);

  // CLOSE PROFILE MENU WHEN CLICKING OUTSIDE
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // JWT AUTHENTICATION LOGIN
  const handleLogin = async () => {
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: identifier.trim(),
            password,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        // VERIFY JWT TOKEN EXISTS
        if (!data.access_token) {
          setError(
            "Authentication token missing. Please try again."
          );
          return;
        }

        // STORE JWT ACCESS TOKEN
        localStorage.setItem(
          "accessToken",
          data.access_token
        );

        // STORE USER DETAILS
        localStorage.setItem(
          "userName",
          data.full_name
        );

        localStorage.setItem(
          "userReg",
          data.registration_number
        );

        localStorage.setItem(
          "userRole",
          data.role
        );

        localStorage.setItem(
          "userIcon",
          String(data.profile_icon || 1)
        );

        if (data.email) {
          localStorage.setItem(
            "userEmail",
            data.email
          );
        }

        // UPDATE USER STATE
        setUser({
          name: data.full_name,
          regNo: data.registration_number,
          role: data.role,
          icon: Number(data.profile_icon) || 1,
        });

        // CLEAR LOGIN INPUTS
        setPassword("");
        setIdentifier("");

        // REDIRECT BASED ON ROLE
        if (data.role === "admin") {
          router.push("/admin/portal");
        } else {
          setActiveTab("dashboard");
          setShowLogin(false);
        }
      } else {
        setError(
          typeof data.detail === "string"
            ? data.detail
            : "Invalid username or password."
        );
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError(
        "Server connection failed. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // LOGOUT WITHOUT DELETING LEARNING PROGRESS
  const handleLogout = () => {
    const authKeys = [
      "accessToken",
      "userName",
      "userReg",
      "userRole",
      "userIcon",
      "userEmail",
    ];

    authKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    setUser(EMPTY_USER);
    setActiveTab("home");
    setShowLogin(false);
    setShowProfileMenu(false);
    setIdentifier("");
    setPassword("");
    setError("");

    router.push("/");
  };

  // GLOBAL NAVIGATION HANDLER
  const globalNavigate = (targetTab: string) => {
    setActiveTab(targetTab.toLowerCase());
  };

  // TAB CONTENT
  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return <Dashboard />;

      case "dashboard":
        return <Dashboard />;

      case "ocr lab":
        return <OcrLab />;

      case "dictionary":
        return <DrugDictionary />;

      case "progress":
        return <MyProgress />;

      case "educational lab":
        return <EducationalLab />;

      case "rxforum":
        return <RxForum />;

      case "contact":
        return <Contact />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#EBF0F3] text-[#2D3136]">

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
      <nav className="relative z-[1000] bg-white border-b border-slate-300/60 px-8 py-5 flex justify-between items-center sticky top-0 shadow-sm overflow-visible">

        {/* LOGO */}
        <div
          className="cursor-pointer"
          onClick={() => {
            setActiveTab("home");
            setShowLogin(false);
          }}
        >
          <h1 className="text-2xl font-black text-[#1E7B92]">
            Rx
            <span className="text-[#2D3136]">
              LEARN
            </span>
          </h1>

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Education Purpose Only
          </p>
        </div>

        {/* NAVIGATION TABS */}
        {activeTab !== "home" && (
          <div className="ml-6 flex items-center bg-[#EBF0F3] border border-slate-300/50 rounded-full p-1 shadow-inner overflow-visible">

            {[
              "Home",
              "OCR Lab",
              "Dictionary",
              "Progress",
              "Educational Lab",
              "RxForum",
              "Contact",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() =>
                  globalNavigate(
                    tab === "Home"
                      ? "dashboard"
                      : tab
                  )
                }
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                  (activeTab === "dashboard" &&
                    tab === "Home") ||
                  activeTab === tab.toLowerCase()
                    ? "bg-[#1E7B92] text-white shadow-md"
                    : "text-slate-500 hover:text-[#1E7B92]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* RIGHT SIDE NAVIGATION */}
        <div className="flex items-center gap-4 overflow-visible">

          {activeTab === "home" ? (
            <div className="flex gap-3">

              <button
                onClick={() => setShowLogin(true)}
                className="px-6 py-2 rounded-full bg-white border border-slate-300/80 text-xs font-bold uppercase tracking-widest text-[#2D3136] hover:bg-slate-50 transition-all"
              >
                Log In
              </button>

              <button
                onClick={() => router.push("/signup")}
                className="px-6 py-2 rounded-full bg-[#00A3E0] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#008CBA] shadow-lg transition-all"
              >
                Sign Up
              </button>

            </div>
          ) : (
            <div
              className="relative overflow-visible"
              ref={menuRef}
            >

              {/* PROFILE AVATAR */}
              <button
                onClick={() =>
                  setShowProfileMenu(!showProfileMenu)
                }
                className="w-14 h-14 rounded-full bg-white border-2 border-[#1E7B92] flex items-center justify-center text-3xl shadow-lg hover:scale-110 transition-all"
              >
                {AVATAR_MAP[user.icon] || "👤"}
              </button>

              {/* PROFILE DROPDOWN */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-4 w-80 bg-white rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-slate-200/80 p-8 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-[9999]">

                  <div className="text-center mb-6">

                    <div className="w-24 h-24 bg-[#EBF0F3] rounded-full mx-auto mb-4 flex items-center justify-center text-5xl border border-slate-200/60 shadow-inner">
                      {AVATAR_MAP[user.icon] || "👤"}
                    </div>

                    <p className="text-base font-black text-[#2D3136] uppercase tracking-tighter leading-tight">
                      {user.name}
                    </p>

                    <p className="text-xs font-bold text-[#1E7B92] mt-2 bg-[#EBF0F3] py-1 px-3 rounded-full inline-block">
                      {user.regNo}
                    </p>

                  </div>

                  <div className="space-y-2 border-t border-slate-200/60 pt-6">

                    {/* PROFILE SETTINGS */}
                    <button
                      onClick={() => {
                        router.push("/profile");
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-5 py-4 rounded-2xl hover:bg-[#EBF0F3]/60 flex items-center gap-4 group transition-all"
                    >
                      <span className="text-xl">
                        ⚙️
                      </span>

                      <span className="text-xs font-black text-slate-600 uppercase tracking-widest group-hover:text-[#1E7B92]">
                        Profile Settings
                      </span>
                    </button>

                    {/* SIGN OUT */}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-5 py-4 rounded-2xl hover:bg-rose-50 flex items-center gap-4 group transition-all"
                    >
                      <span className="text-xl">
                        🚪
                      </span>

                      <span className="text-xs font-black text-rose-500 uppercase tracking-widest">
                        Sign Out
                      </span>
                    </button>

                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 flex-grow max-w-7xl mx-auto px-6 py-12 w-full">

        {/* HOME PAGE */}
        {activeTab === "home" && (
          <div className="flex flex-col items-center justify-center min-h-[70vh]">

            <div
              className={`text-center transition-all duration-500 ${
                showLogin
                  ? "scale-75 opacity-30"
                  : ""
              }`}
            >
              <h2 className="text-5xl md:text-7xl font-black text-[#1E7B92] uppercase leading-none">
                UNLOCK THE FUTURE OF{" "}
                <span className="text-[#2D3136]">
                  PHARMACY EDUCATION
                </span>
              </h2>

              <div className="w-24 h-1 bg-[#1E7B92] mx-auto mt-6 opacity-30 rounded-full" />
            </div>

            {/* LOGIN FORM */}
            {showLogin && (
              <div className="mt-10 w-full max-w-[420px] bg-white border border-slate-300/80 p-10 rounded-[40px] shadow-xl animate-in fade-in slide-in-from-bottom-4">

                <h3 className="text-center font-black text-[#2D3136] mb-6 tracking-widest text-sm uppercase">
                  {user.name
                    ? `Welcome, ${
                        user.name.split(" ")[0]
                      }!`
                    : "Student Gateway"}
                </h3>

                {/* USERNAME */}
                <input
                  className="w-full p-4 mb-4 rounded-xl border border-slate-300 focus:border-[#1E7B92] outline-none text-sm bg-white text-[#2D3136]"
                  placeholder="Username or Registration Number"
                  value={identifier}
                  onChange={(e) =>
                    setIdentifier(e.target.value)
                  }
                />

                {/* PASSWORD */}
                <input
                  type="password"
                  className="w-full p-4 mb-4 rounded-xl border border-slate-300 focus:border-[#1E7B92] outline-none text-sm bg-white text-[#2D3136]"
                  placeholder="Password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !loading
                    ) {
                      handleLogin();
                    }
                  }}
                />

                {/* ERROR MESSAGE */}
                {error && (
                  <p className="text-rose-500 text-[10px] font-bold text-center mb-4 uppercase">
                    {error}
                  </p>
                )}

                {/* LOGIN BUTTON */}
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-[#00A3E0] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#008CBA] transition-all disabled:opacity-60"
                >
                  {loading
                    ? "Authenticating..."
                    : "Login"}
                </button>

                {/* SIGNUP LINK */}
                <p className="text-center text-xs mt-4 text-slate-400 font-bold uppercase tracking-tighter">
                  New student?{" "}
                  <span
                    onClick={() =>
                      router.push("/signup")
                    }
                    className="text-[#1E7B92] cursor-pointer"
                  >
                    Register Now
                  </span>
                </p>

              </div>
            )}

          </div>
        )}

        {/* DASHBOARD AND OTHER TABS */}
        {activeTab !== "home" && (
          <div className="bg-white border border-slate-300/60 rounded-[30px] p-6 shadow-xl min-h-[60vh]">
            {renderTabContent()}
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 text-center p-8">
        <p className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">
          RxLearn Platform • Sri Lanka • 2026
        </p>
      </footer>

      {/* FLOATING AI PRECEPTOR */}
      <AIChatbox />

    </div>
  );
}
