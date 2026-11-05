"use client";

import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";
const AVATARS = ["👨‍⚕️", "👩‍🔬", "🎓", "💊", "🔬"];

type Profile = {
  registration_number: string;
  full_name: string;
  username: string;
  email: string;
  contact_number: string;
  profile_icon: number;
};

type Props = {
  registrationNumber: string;
  onUpdated: (profile: { full_name: string; profile_icon: number }) => void;
};

export default function ProfileSettings({ registrationNumber, onUpdated }: Props) {
  const [profile, setProfile] = useState<Profile>({
    registration_number: registrationNumber,
    full_name: "",
    username: "",
    email: "",
    contact_number: "",
    profile_icon: 1,
  });
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("Please sign in again.");
        const response = await fetch(
          `${API}/api/user/profile?reg=${encodeURIComponent(registrationNumber)}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Unable to load profile.");
        if (active) {
          setProfile({
            registration_number: data.registration_number || registrationNumber,
            full_name: data.full_name || "",
            username: data.username || "",
            email: data.email || "",
            contact_number: data.contact_number || data.contact || "",
            profile_icon: Number(data.profile_icon) || 1,
          });
        }
      } catch (err) {
        if (active) {
          setIsError(true);
          setMessage(err instanceof Error ? err.message : "Unable to load profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadProfile();
    return () => { active = false; };
  }, [registrationNumber]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Please sign in again.");
      const body: Record<string, string | number> = {
        registration_number: registrationNumber,
        full_name: profile.full_name,
        username: profile.username.trim(),
        email: profile.email.trim(),
        contact_number: profile.contact_number.trim(),
        profile_icon: profile.profile_icon,
      };
      if (newPassword.trim()) body.password = newPassword;
      const response = await fetch(`${API}/api/user/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        const detail = data.detail;
        throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail || "Profile update failed."));
      }
      localStorage.setItem("userIcon", String(profile.profile_icon));
      localStorage.setItem("userName", profile.full_name);
      onUpdated({ full_name: profile.full_name, profile_icon: profile.profile_icon });
      setNewPassword("");
      setIsError(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Unable to save profile.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#1E7B92]";
  const labelClass = "mb-2 block text-xs font-bold text-slate-600";

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-[#1E7B92] px-7 py-7 text-white">
          <h2 className="text-2xl font-black">Profile Settings</h2>
          <p className="mt-1 text-sm text-white/80">Manage your RxLearn account details.</p>
        </div>
        {loading ? (
          <p className="p-7 text-sm text-slate-600">Loading profile...</p>
        ) : (
          <form onSubmit={saveProfile} className="space-y-6 p-7">
            <div className="grid gap-5 md:grid-cols-2">
              <div><label className={labelClass}>Full name (read-only)</label><input className={`${inputClass} bg-slate-100`} value={profile.full_name} readOnly /></div>
              <div><label className={labelClass}>Registration number (read-only)</label><input className={`${inputClass} bg-slate-100`} value={profile.registration_number} readOnly /></div>
              <div><label className={labelClass}>Username</label><input className={inputClass} minLength={5} required value={profile.username} onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))} /></div>
              <div><label className={labelClass}>Email</label><input className={inputClass} type="email" required value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} /></div>
              <div><label className={labelClass}>Contact number</label><input className={inputClass} type="tel" value={profile.contact_number} onChange={(e) => setProfile((p) => ({ ...p, contact_number: e.target.value }))} /></div>
              <div><label className={labelClass}>New password (optional)</label><input className={inputClass} type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep current password" /></div>
            </div>
            <div>
              <p className={labelClass}>Choose profile avatar</p>
              <div className="flex flex-wrap gap-3">
                {AVATARS.map((avatar, index) => (
                  <button key={index} type="button" aria-label={`Avatar ${index + 1}`} aria-pressed={profile.profile_icon === index + 1} onClick={() => setProfile((p) => ({ ...p, profile_icon: index + 1 }))} className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 text-3xl ${profile.profile_icon === index + 1 ? "border-[#1E7B92] bg-[#EBF0F3]" : "border-slate-200 bg-white"}`}>{avatar}</button>
                ))}
              </div>
            </div>
            {message && <p role="status" className={`rounded-lg px-4 py-3 text-sm ${isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{message}</p>}
            <button disabled={busy} type="submit" className="rounded-xl bg-[#1E7B92] px-6 py-3 text-sm font-bold text-white hover:bg-[#15586e] disabled:opacity-60">{busy ? "Saving..." : "Save Changes"}</button>
          </form>
        )}
      </div>
    </section>
  );
}
