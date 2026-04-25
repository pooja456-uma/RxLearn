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
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    registration_number: "",
    username: "",
    email: "",
    contact_number: "",
    profile_icon: 1
  });

  useEffect(() => {
    const reg = localStorage.getItem("userReg");
    if (!reg) {
      router.push("/");
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/user/profile?reg=${reg}`);
        const data = await res.json();
        if (res.ok) setFormData(data);
      } catch (err) {
        console.error("Failed to load profile");
      }
    };
    fetchUserData();
  }, [router]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/user/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
        localStorage.setItem("userIcon", formData.profile_icon.toString());
        setTimeout(() => {
            setSuccess(false);
            router.push("/"); 
        }, 2000);
      }
    } catch (err) {
      alert("Update failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef3f8] p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push("/")} className="mb-6 text-[#1f6f8b] font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
          ← Back to Dashboard
        </button>
        
        <div className="bg-white rounded-[50px] shadow-2xl p-12 border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center border-r border-slate-100 pr-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Choose Your Avatar</p>
            <div className="text-7xl mb-8 p-10 bg-slate-50 rounded-full w-40 h-40 mx-auto flex items-center justify-center border shadow-inner">
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

          <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-black text-[#1f6f8b] italic mb-4">Account Settings</h2>
            <div className="grid grid-cols-2 gap-4">
               <div className="opacity-50">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 leading-none">Registration ID</label>
                  <input value={formData.registration_number} disabled className="w-full p-4 rounded-2xl bg-slate-100 border-none font-bold text-sm mt-1" />
               </div>
               <div className="opacity-50">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 leading-none">Official Name</label>
                  <input value={formData.full_name} disabled className="w-full p-4 rounded-2xl bg-slate-100 border-none font-bold text-sm mt-1" />
               </div>
            </div>
            <input placeholder="Username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border outline-none font-bold text-sm focus:border-[#1f6f8b]" />
            <input placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border outline-none font-bold text-sm focus:border-[#1f6f8b]" />
            <button onClick={handleSave} disabled={loading} className="w-full bg-[#1f6f8b] text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-[#15586e] transition-all">
              {loading ? "Updating..." : "Save Profile"}
            </button>
            {success && <p className="text-center text-emerald-500 font-bold text-[10px] uppercase">✅ Profile Updated Successfully!</p>}
          </div>
        </div>
      </div>
    </div>
  );
}