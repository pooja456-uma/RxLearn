"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AVATARS = [
  { id: 1, emoji: "👨‍⚕️", label: "Pharmacist" },
  { id: 2, emoji: "👩‍🔬", label: "Scientist" },
  { id: 3, emoji: "🎓", label: "Student" },
  { id: 4, emoji: "💊", label: "Rx Expert" },
  { id: 5, emoji: "🔬", label: "Researcher" },
];

export default function ProfileSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });
  
  const [formData, setFormData] = useState({
    full_name: "",
    registration_number: "",
    username: "",
    email: "",
    password: "", // Handled as plain text
    confirmPassword: "", // Handled as plain text
    profile_icon: 1
  });

  // ✅ AUTOFILL & DATA SYNC
  useEffect(() => {
    const reg = localStorage.getItem("userReg");
    if (!reg) {
      router.push("/");
      return;
    }

    // 1. Immediate Autofill from localStorage
    setFormData(prev => ({
      ...prev,
      registration_number: reg,
      full_name: localStorage.getItem("userName") || "",
      username: localStorage.getItem("userUsername") || "",
      email: localStorage.getItem("userEmail") || "",
      profile_icon: parseInt(localStorage.getItem("userIcon") || "1")
    }));

    // 2. Refresh data from Backend
    const fetchUserData = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/user/profile?reg=${reg}`);
        const data = await res.json();
        if (res.ok) {
            setFormData(prev => ({ ...prev, ...data, password: "", confirmPassword: "" }));
        }
      } catch (err) {
        console.error("Server fetch failed, using local data.");
      }
    };
    fetchUserData();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (status.text) setStatus({ text: "", type: "" }); 
  };

  const handleSave = async () => {
    if (formData.password && formData.password !== formData.confirmPassword) {
        setStatus({ text: "Passwords do not match!", type: "error" });
        return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/user/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus({ text: "Profile Updated Successfully!", type: "success" });
        
        // Sync new data to localStorage
        localStorage.setItem("userIcon", formData.profile_icon.toString());
        localStorage.setItem("userName", formData.full_name);
        localStorage.setItem("userUsername", formData.username);
        localStorage.setItem("userEmail", formData.email);
        
        // ✅ NO REDIRECT: We just clear the success message after 3 seconds
        setTimeout(() => {
            setStatus({ text: "", type: "" });
        }, 3000);

      } else {
        const error = await res.json();
        setStatus({ text: error.detail || "Update failed", type: "error" });
      }
    } catch (err) {
      setStatus({ text: "Server connection failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef3f8] p-10 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="mb-6 text-[#1f6f8b] font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:opacity-70">
          ← Back to Dashboard
        </button>
        
        <div className="bg-white rounded-[50px] shadow-2xl p-12 border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* AVATAR COLUMN */}
          <div className="text-center md:border-r border-slate-100 md:pr-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Profile Identity</p>
            <div className="text-7xl mb-8 p-10 bg-slate-50 rounded-full w-40 h-40 mx-auto flex items-center justify-center border shadow-inner ring-4 ring-[#1f6f8b]/5">
              {AVATARS.find(a => a.id === formData.profile_icon)?.emoji}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setFormData({ ...formData, profile_icon: avatar.id })}
                  className={`p-3 rounded-2xl text-2xl transition-all border-2 ${
                    formData.profile_icon === avatar.id ? "border-[#1f6f8b] bg-blue-50 scale-110 shadow-md" : "border-transparent bg-slate-50 opacity-40 hover:opacity-100"
                  }`}
                >
                  {avatar.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* FORM COLUMN */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-3xl font-black text-[#1f6f8b] italic mb-4 tracking-tighter">Account Settings</h2>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="opacity-60">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 leading-none">Registration ID</label>
                  <input value={formData.registration_number} disabled className="w-full p-4 rounded-2xl bg-slate-100 border-none font-bold text-sm mt-1 cursor-not-allowed" />
               </div>
               <div className="opacity-60">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 leading-none">Official Name</label>
                  <input value={formData.full_name} disabled className="w-full p-4 rounded-2xl bg-slate-100 border-none font-bold text-sm mt-1 cursor-not-allowed" />
               </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Username</label>
                    <input name="username" placeholder="Username" value={formData.username} onChange={handleChange} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:border-[#1f6f8b]" />
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Address</label>
                    <input name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:border-[#1f6f8b]" />
                </div>
            </div>

            {/* PASSWORD SECTION - PLAIN TEXT */}
            <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Update Password</label>
                    <input type="text" name="password" placeholder="New Password" value={formData.password} onChange={handleChange} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:border-[#1f6f8b] text-[#1f6f8b]" />
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Confirm Password</label>
                    <input type="text" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:border-[#1f6f8b] text-[#1f6f8b]" />
                </div>
            </div>

            <button onClick={handleSave} disabled={loading} className="w-full bg-[#1f6f8b] text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-[#15586e] transition-all active:scale-[0.98] disabled:bg-slate-300">
              {loading ? "Processing..." : "Save Profile Changes"}
            </button>

            {status.text && (
              <p className={`text-center font-bold text-[10px] uppercase tracking-widest p-4 rounded-2xl border transition-all ${
                status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
              }`}>
                {status.type === 'success' ? '✅' : '⚠️'} {status.text}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}