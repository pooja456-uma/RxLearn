"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // --- SESSION MANAGEMENT ---
        // Save details for the Global Header to use
        localStorage.setItem("userName", data.full_name);
        localStorage.setItem("userReg", data.registration_number);
        localStorage.setItem("userRole", data.role);

        // --- ROLE-BASED ROUTING ---
        if (data.role === 'admin') {
          router.push('/admin/portal'); // Redirect to hidden admin panel
        } else {
          router.push('/dashboard'); // Redirect to student dashboard
        }
      } else {
        setError(data.detail || "Login failed. Check your credentials.");
      }
    } catch (err) {
      setError("Cannot connect to server. Please ensure FastAPI is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef3f8] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-[420px] bg-white rounded-[50px] p-12 shadow-2xl border border-slate-100">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-[#1f6f8b] mb-2 italic tracking-tighter">RxLearn</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Institutional Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">ID or Username</label>
            <input 
              required
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:border-[#1f6f8b] transition-all text-sm font-medium"
              placeholder="RX-2026-XXXX or username"
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Password</label>
            <input 
              required
              type="password"
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:border-[#1f6f8b] transition-all text-sm font-medium"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center animate-pulse">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#1f6f8b] text-white py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:shadow-blue-900/20 active:scale-95 transition-all mt-4"
          >
            {loading ? "Authenticating..." : "Sign In to Portal"}
          </button>

          <div className="flex flex-col gap-3 mt-8 text-center">
            <button 
              type="button"
              onClick={() => router.push('/signup')}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#1f6f8b]"
            >
              New Student? <span className="text-[#1f6f8b]">Register Now</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}