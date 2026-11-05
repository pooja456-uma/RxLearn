
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// ======================================================
// 1. IMPORT RXLEARN COMPONENTS
// ======================================================

import Dashboard from "../components/Dashboard";
import OcrLab from "../components/OcrLab";
import DrugDictionary from "../components/DrugDictionary";
import MyProgress from "../components/MyProgress";
import EducationalLab from "../components/EducationalLab";
import RxForum from "../components/RxForum";
import Contact from "../components/Contact";
import AIChatbox from "../components/AIChatbox";
import ProfileSettings from "../components/ProfileSettings";

// ======================================================
// 2. PROFILE AVATAR SETTINGS
// ======================================================

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

// ======================================================
// 3. MAIN RXLEARN PLATFORM
// ======================================================

export default function RxLearnPlatform() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // 3.1 Main navigation
  const [activeTab, setActiveTab] = useState("home");

  // 3.2 Login and profile states
  const [showLogin, setShowLogin] = useState(false);
  // Signup is separate so existing login behavior remains unchanged.
  const [showSignup, setShowSignup] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupAge, setSignupAge] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState<RxLearnUser>(EMPTY_USER);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 3.3 OCR Lab -> Drug Dictionary integration
  const [selectedDrug, setSelectedDrug] = useState("");

  // 3.4 OCR Lab -> AI Preceptor integration
  const [preceptorQuestion, setPreceptorQuestion] = useState("");
  const [preceptorRequestId, setPreceptorRequestId] = useState(0);

  // ======================================================
  // 4. RESTORE EXISTING LOGIN SESSION
  // ======================================================

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

  // ======================================================
  // 5. CLOSE PROFILE MENU ON OUTSIDE CLICK
  // ======================================================

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

  // ======================================================
  // 6. STUDENT / ADMIN LOGIN
  // ======================================================

  // New registration flow; existing login and token storage are untouched.
  const handleSignup = async () => {
    setSignupError("");
    setSignupSuccess("");
    if (signupName.trim().length === 0) {
      setSignupError("Please enter your full name.");
      return;
    }
    if (signupUsername.trim().length < 5) {
      setSignupError("Username must contain at least 5 characters.");
      return;
    }
    if (!Number.isInteger(Number(signupAge)) || Number(signupAge) <= 10) {
      setSignupError("Age must be greater than 10.");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(signupPassword)) {
      setSignupError("Password needs 8+ characters, uppercase, lowercase, a number and a symbol.");
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setSignupError("Passwords do not match.");
      return;
    }
    setSignupLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: signupName.trim(),
          username: signupUsername.trim(),
          email: signupEmail.trim(),
          age: Number(signupAge),
          password: signupPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const detail = data.detail;
        throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail || "Registration failed."));
      }
      setSignupSuccess(`Account created! Registration number: ${data.registration_number || "See your registration confirmation"}. You can now sign in.`);
      setSignupPassword("");
      setSignupConfirmPassword("");
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSignupLoading(false);
    }
  };

  const handleLogin = async () => {
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Login failed. Please try again."
        );
      }

      if (!data.access_token) {
        throw new Error(
          "Login succeeded but the authentication token is missing."
        );
      }

      // Save authenticated session information.
      localStorage.setItem("accessToken", data.access_token);
      localStorage.setItem("userName", data.full_name || "");
      localStorage.setItem("userReg", data.registration_number || "");
      localStorage.setItem("userRole", data.role || "student");
      localStorage.setItem(
        "userIcon",
        String(data.profile_icon || 1)
      );

      setUser({
        name: data.full_name || "",
        regNo: data.registration_number || "",
        role: data.role || "student",
        icon: Number(data.profile_icon) || 1,
      });

      setShowLogin(false);
      setPassword("");
      setIdentifier("");

      if (data.role === "admin") {
        router.push("/admin/portal");
      } else {
        setActiveTab("dashboard");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the login service."
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // 7. LOGOUT
  // ======================================================

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userReg");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userIcon");

    setUser(EMPTY_USER);
    setShowProfileMenu(false);
    setShowLogin(false);
    setActiveTab("home");

    setSelectedDrug("");
    setPreceptorQuestion("");
    setPreceptorRequestId(0);
  };

  // ======================================================
  // 8. GLOBAL NAVIGATION
  // ======================================================

  const globalNavigate = (tab: string) => {
    setActiveTab(tab.toLowerCase());
    setShowProfileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ======================================================
  // 9. OCR LAB -> DRUG DICTIONARY
  // ======================================================

  const handleExploreDrug = (drugName: string) => {
    setSelectedDrug(drugName);
    setActiveTab("dictionary");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ======================================================
  // 10. OCR LAB -> AI PRECEPTOR
  // ======================================================

  const handleAskPreceptor = (question: string) => {
    // Store the question prepared by OCR Lab.
    setPreceptorQuestion(question);

    // Incrementing this value allows the same question
    // to reopen the chatbot on repeated button clicks.
    setPreceptorRequestId((previous) => previous + 1);
  };

  // ======================================================
  // 11. MAIN TAB CONTENT
  // ======================================================

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
      case "dashboard":
        return <Dashboard />;

      case "ocr lab":
        return (
          <OcrLab
            onExploreDrug={handleExploreDrug}
            onAskPreceptor={handleAskPreceptor}
          />
        );

      case "dictionary":
        return (
          <DrugDictionary initialDrugName={selectedDrug} />
        );

      case "myprogress":
      case "my progress":
        return <MyProgress />;

      case "educational lab":
        return <EducationalLab />;

      case "rxforum":
        return <RxForum />;

      case "contact":
        return <Contact />;

      case "profile":
        return (
          <ProfileSettings
            registrationNumber={user.regNo}
            onUpdated={({ full_name, profile_icon }) => {
              setUser((previous) => ({
                ...previous,
                name: full_name,
                icon: profile_icon,
              }));
            }}
          />
        );

      default:
        return <Dashboard />;
    }
  };

  // ======================================================
  // 12. NAVIGATION MENU ITEMS
  // ======================================================

  const navItems = [
    "Dashboard",
    "OCR Lab",
    "Dictionary",
    "MyProgress",
    "Educational Lab",
    "RxForum",
    "Contact",
  ];

  // ======================================================
  // 13. MAIN PAGE DESIGN
  // ======================================================

  return (
    <div className="min-h-screen flex flex-col bg-[#EBF0F3] text-[#2D3136] font-sans">

      {/* ==================================================
          14. MAIN HEADER
      ================================================== */}

      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6">

          <div className="min-h-[76px] flex items-center justify-between gap-4">

            {/* RXLEARN LOGO */}

            <button
              onClick={() => globalNavigate("dashboard")}
              className="flex items-center gap-3 text-left shrink-0"
            >
              <div className="w-11 h-11 rounded-xl bg-[#1E7B92] text-white flex items-center justify-center text-2xl shadow-sm">
                💊
              </div>

              <div>
                <h1 className="text-xl font-black text-[#1E7B92] tracking-tight">
                  RxLearn
                </h1>

                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Pharmacy Learning Platform
                </p>
              </div>
            </button>

            {/* DESKTOP NAVIGATION */}

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const selected =
                  activeTab === item.toLowerCase();

                return (
                  <button
                    key={item}
                    onClick={() => globalNavigate(item)}
                    className={`px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                      selected
                        ? "bg-[#1E7B92] text-white"
                        : "text-slate-600 hover:bg-[#EBF0F3] hover:text-[#1E7B92]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </nav>

            {/* USER PROFILE / LOGIN */}

            <div className="flex items-center gap-3 shrink-0">

              {user.regNo ? (
                <div ref={menuRef} className="relative">

                  <button
                    onClick={() =>
                      setShowProfileMenu((previous) => !previous)
                    }
                    className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 transition-all"
                  >
                    <span className="text-2xl">
                      {AVATAR_MAP[user.icon] || "🎓"}
                    </span>

                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-black text-[#2D3136] max-w-[130px] truncate">
                        {user.name}
                      </p>

                      <p className="text-[9px] font-bold text-slate-400">
                        {user.regNo}
                      </p>
                    </div>

                    <span className="text-slate-400 text-xs">
                      ▼
                    </span>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-[100]">

                      <div className="p-4 bg-[#EBF0F3] border-b border-slate-200">
                        <p className="font-black text-sm text-[#1E7B92]">
                          {user.name}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {user.regNo}
                        </p>

                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">
                          {user.role}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          globalNavigate("dashboard");
                        }}
                        className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        🏠 Dashboard
                      </button>

                      {user.role === "admin" && (
                        <button
                          onClick={() =>
                            router.push("/admin/portal")
                          }
                          className="w-full text-left px-4 py-3 text-xs font-bold text-[#1E7B92] hover:bg-slate-50"
                        >
                          ⚙️ Admin Portal
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => globalNavigate("profile")}
                        className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        ⚙️ Profile Settings
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 border-t border-slate-100"
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSignup(true);
                      setShowLogin(false);
                      setSignupError("");
                      setSignupSuccess("");
                    }}
                    className="rounded-lg border-2 border-[#1E7B92] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#1E7B92] hover:bg-[#EBF0F3]"
                  >
                    Sign Up
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowLogin(true); setShowSignup(false); }}
                    className="rounded-lg bg-[#1E7B92] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#15586e]"
                  >
                    Login
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* MOBILE / TABLET NAVIGATION */}

          <nav className="lg:hidden flex gap-2 overflow-x-auto pb-3">
            {navItems.map((item) => {
              const selected =
                activeTab === item.toLowerCase();

              return (
                <button
                  key={item}
                  onClick={() => globalNavigate(item)}
                  className={`whitespace-nowrap px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                    selected
                      ? "bg-[#1E7B92] text-white"
                      : "bg-slate-50 text-slate-600 border border-slate-200"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </nav>

        </div>
      </header>

      {/* ==================================================
          15. MAIN CONTENT AREA
      ================================================== */}

      <main className="flex-1 w-full">
        <div className="py-6">
          {renderTabContent()}
        </div>
      </main>

      {/* ==================================================
          16. FOOTER
      ================================================== */}

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">

            <div className="text-center md:text-left">
              <p className="text-lg font-black text-[#1E7B92]">
                RxLearn
              </p>

              <p className="text-xs text-slate-500 mt-1">
                Interactive Pharmacy Education Platform
              </p>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              University of Moratuwa BIT Final Year Project
            </p>

          </div>

          <div className="border-t border-slate-100 mt-6 pt-5 text-center">
            <p className="text-[10px] text-slate-400">
              RxLearn is intended for educational purposes.
              AI-generated prescription interpretations must be
              verified by qualified professionals.
            </p>
          </div>

        </div>
      </footer>

      {/* ==================================================
          17. AI PRECEPTOR CHATBOT
          IMPORTANT: CONNECTED TO OCR LAB
      ================================================== */}

      <AIChatbox
        initialPrompt={preceptorQuestion}
        promptRequestId={preceptorRequestId}
      />

      {/* ==================================================
          18. LOGIN MODAL
      ================================================== */}

      {showLogin && (
        <div className="fixed inset-0 z-[9998] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

            <div className="bg-[#1E7B92] text-white p-7 relative">
              <button
                onClick={() => {
                  setShowLogin(false);
                  setError("");
                }}
                className="absolute right-5 top-5 text-white/80 hover:text-white text-xl"
                aria-label="Close login"
              >
                ✕
              </button>

              <div className="text-4xl mb-3">💊</div>

              <h2 className="text-2xl font-black">
                Welcome to RxLearn
              </h2>

              <p className="text-xs text-white/80 mt-2">
                Sign in to continue your pharmacy learning journey.
              </p>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleLogin();
              }}
              className="p-7 space-y-5"
            >

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  Username or Registration Number
                </label>

                <input
                  type="text"
                  value={identifier}
                  onChange={(event) =>
                    setIdentifier(event.target.value)
                  }
                  placeholder="Username or RX-2026-0001"
                  autoComplete="username"
                  required
                  className="w-full p-3.5 rounded-xl border border-slate-300 outline-none focus:border-[#1E7B92] bg-slate-50 text-sm text-[#2D3136]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full p-3.5 rounded-xl border border-slate-300 outline-none focus:border-[#1E7B92] bg-slate-50 text-sm text-[#2D3136]"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs font-semibold"
                >
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#1E7B92] hover:bg-[#15586e] text-white text-sm font-black uppercase tracking-wider transition-all disabled:opacity-60"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>

            </form>
          </div>
        </div>
      )}


      {/* SIGN UP MODAL — independent of the existing Login modal */}
      {showSignup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="relative bg-[#1E7B92] p-7 text-white">
              <button type="button" onClick={() => setShowSignup(false)} className="absolute right-5 top-5 text-xl" aria-label="Close registration">✕</button>
              <h2 className="text-2xl font-black">Create Your RxLearn Account</h2>
              <p className="mt-2 text-sm text-white/80">Register to start your pharmacy learning journey.</p>
            </div>
            <form
              onSubmit={(event) => { event.preventDefault(); void handleSignup(); }}
              className="max-h-[75vh] space-y-4 overflow-y-auto p-7"
            >
              <div><label className="mb-2 block text-xs font-bold">Full Name</label><input required value={signupName} onChange={(e) => setSignupName(e.target.value)} className="w-full rounded-xl border border-slate-300 p-3 text-sm" /></div>
              <div><label className="mb-2 block text-xs font-bold">Username</label><input required minLength={5} value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} className="w-full rounded-xl border border-slate-300 p-3 text-sm" /></div>
              <div><label className="mb-2 block text-xs font-bold">Email</label><input required type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="w-full rounded-xl border border-slate-300 p-3 text-sm" /></div>
              <div><label className="mb-2 block text-xs font-bold">Age</label><input required type="number" min={11} value={signupAge} onChange={(e) => setSignupAge(e.target.value)} className="w-full rounded-xl border border-slate-300 p-3 text-sm" /></div>
              <div><label className="mb-2 block text-xs font-bold">Password</label><input required type="password" autoComplete="new-password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 p-3 text-sm" /></div>
              <div><label className="mb-2 block text-xs font-bold">Confirm Password</label><input required type="password" autoComplete="new-password" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 p-3 text-sm" /></div>
              {signupError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{signupError}</p>}
              {signupSuccess && (
                <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
                  <p>{signupSuccess}</p>
                  <button type="button" onClick={() => { setShowSignup(false); setShowLogin(true); setSignupSuccess(""); }} className="mt-3 font-bold underline">Go to Login</button>
                </div>
              )}
              <button type="submit" disabled={signupLoading || Boolean(signupSuccess)} className="w-full rounded-xl bg-[#1E7B92] py-3.5 text-sm font-black text-white hover:bg-[#15586e] disabled:opacity-60">{signupLoading ? "Creating Account..." : "Create Account"}</button>
              <p className="text-center text-xs text-slate-500">Already registered? <button type="button" onClick={() => { setShowSignup(false); setShowLogin(true); }} className="font-bold text-[#1E7B92] underline">Sign In</button></p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
