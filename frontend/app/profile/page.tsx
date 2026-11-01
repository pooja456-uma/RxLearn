
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

const AVATARS = [
  { id: 1, emoji: "👨‍⚕️", label: "Pharmacist" },
  { id: 2, emoji: "👩‍🔬", label: "Scientist" },
  { id: 3, emoji: "🎓", label: "Student" },
  { id: 4, emoji: "💊", label: "Rx Expert" },
  { id: 5, emoji: "🔬", label: "Researcher" },
];

type ProfileForm = {
  full_name: string;
  registration_number: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  profile_icon: number;
};

type StatusType = "success" | "error" | "";

const AUTH_KEYS = [
  "accessToken",
  "userName",
  "userReg",
  "userRole",
  "userIcon",
  "userEmail",
  "userUsername",
];

export default function ProfileSettings() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [status, setStatus] = useState<{
    text: string;
    type: StatusType;
  }>({
    text: "",
    type: "",
  });

  const [formData, setFormData] = useState<ProfileForm>({
    full_name: "",
    registration_number: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    profile_icon: 1,
  });

  // CLEAR SESSION IF TOKEN IS INVALID OR EXPIRED
  const handleSessionExpired = () => {
    AUTH_KEYS.forEach((key) => {
      localStorage.removeItem(key);
    });

    router.replace("/");
  };

  // LOAD PROFILE USING JWT AUTHENTICATION
  useEffect(() => {
    const reg = localStorage.getItem("userReg");
    const token = localStorage.getItem("accessToken");

    if (!reg || !token) {
      router.replace("/");
      return;
    }

    // SHOW CACHED INFORMATION WHILE LOADING
    setFormData((prev) => ({
      ...prev,
      registration_number: reg,
      full_name: localStorage.getItem("userName") || "",
      username: localStorage.getItem("userUsername") || "",
      email: localStorage.getItem("userEmail") || "",
      profile_icon: Number(
        localStorage.getItem("userIcon") || "1"
      ),
    }));

    const fetchUserData = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/user/profile?reg=${encodeURIComponent(reg)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        if (res.status === 401 || res.status === 403) {
          handleSessionExpired();
          return;
        }

        if (!res.ok) {
          throw new Error("Unable to load profile");
        }

        const data = await res.json();

        setFormData((prev) => ({
          ...prev,
          full_name: data.full_name || "",
          registration_number:
            data.registration_number || reg,
          username: data.username || "",
          email: data.email || "",
          profile_icon: Number(data.profile_icon) || 1,
          password: "",
          confirmPassword: "",
        }));

        // KEEP LOCAL USER INFORMATION UPDATED
        localStorage.setItem(
          "userName",
          data.full_name || ""
        );
        localStorage.setItem(
          "userUsername",
          data.username || ""
        );
        localStorage.setItem(
          "userEmail",
          data.email || ""
        );
        localStorage.setItem(
          "userIcon",
          String(data.profile_icon || 1)
        );
      } catch (err) {
        console.error("Profile fetch failed:", err);

        setStatus({
          text: "Could not load the latest profile. Please check your backend connection.",
          type: "error",
        });
      } finally {
        setFetching(false);
      }
    };

    fetchUserData();
  }, [router]);

  // HANDLE FORM CHANGES
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (status.text) {
      setStatus({ text: "", type: "" });
    }
  };

  // SAVE PROFILE WITH JWT
  const handleSave = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      handleSessionExpired();
      return;
    }

    if (!formData.username.trim()) {
      setStatus({
        text: "Username cannot be empty.",
        type: "error",
      });
      return;
    }

    if (!formData.email.trim()) {
      setStatus({
        text: "Email cannot be empty.",
        type: "error",
      });
      return;
    }

    if (
      formData.password &&
      formData.password !== formData.confirmPassword
    ) {
      setStatus({
        text: "Passwords do not match!",
        type: "error",
      });
      return;
    }

    setLoading(true);
    setStatus({ text: "", type: "" });

    try {
      // SEND ONLY FIELDS EXPECTED BY THE BACKEND
      const payload = {
        registration_number: formData.registration_number,
        full_name: formData.full_name,
        username: formData.username.trim(),
        email: formData.email.trim(),
        profile_icon: formData.profile_icon,
        ...(formData.password
          ? { password: formData.password }
          : {}),
      };

      const res = await fetch(
        `${API_URL}/api/user/profile/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (res.status === 401 || res.status === 403) {
        handleSessionExpired();
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));

        setStatus({
          text:
            typeof errorData.detail === "string"
              ? errorData.detail
              : "Profile update failed.",
          type: "error",
        });

        return;
      }

      // UPDATE LOCAL STORAGE AFTER SUCCESS
      localStorage.setItem(
        "userName",
        formData.full_name
      );

      localStorage.setItem(
        "userUsername",
        formData.username.trim()
      );

      localStorage.setItem(
        "userEmail",
        formData.email.trim()
      );

      localStorage.setItem(
        "userIcon",
        String(formData.profile_icon)
      );

      // CLEAR PASSWORD FIELDS
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));

      setStatus({
        text: "Profile Updated Successfully!",
        type: "success",
      });
    } catch (err) {
      console.error("Profile update failed:", err);

      setStatus({
        text: "Server connection failed.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef3f8] p-10 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">

        {/* BACK BUTTON */}
        <button
          onClick={() => router.back()}
          className="mb-6 text-[#1f6f8b] font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:opacity-70"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-[50px] shadow-2xl p-12 border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* AVATAR COLUMN */}
          <div className="text-center md:border-r border-slate-100 md:pr-8">

            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
              Profile Identity
            </p>

            <div className="text-7xl mb-8 p-10 bg-slate-50 rounded-full w-40 h-40 mx-auto flex items-center justify-center border shadow-inner ring-4 ring-[#1f6f8b]/5">
              {AVATARS.find(
                (a) => a.id === formData.profile_icon
              )?.emoji || "👤"}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  title={avatar.label}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      profile_icon: avatar.id,
                    }))
                  }
                  className={`p-3 rounded-2xl text-2xl transition-all border-2 ${
                    formData.profile_icon === avatar.id
                      ? "border-[#1f6f8b] bg-blue-50 scale-110 shadow-md"
                      : "border-transparent bg-slate-50 opacity-40 hover:opacity-100"
                  }`}
                >
                  {avatar.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* FORM COLUMN */}
          <div className="md:col-span-2 space-y-6">

            <h2 className="text-3xl font-black text-[#1f6f8b] italic mb-4 tracking-tighter">
              Account Settings
            </h2>

            {fetching && (
              <p className="text-xs text-slate-400">
                Loading profile details...
              </p>
            )}

            {/* READ-ONLY DETAILS */}
            <div className="grid grid-cols-2 gap-4">

              <div className="opacity-60">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 leading-none">
                  Registration ID
                </label>

                <input
                  value={formData.registration_number}
                  disabled
                  className="w-full p-4 rounded-2xl bg-slate-100 border-none font-bold text-sm mt-1 cursor-not-allowed"
                />
              </div>

              <div className="opacity-60">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 leading-none">
                  Official Name
                </label>

                <input
                  value={formData.full_name}
                  disabled
                  className="w-full p-4 rounded-2xl bg-slate-100 border-none font-bold text-sm mt-1 cursor-not-allowed"
                />
              </div>

            </div>

            {/* USERNAME AND EMAIL */}
            <div className="space-y-4">

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Username
                </label>

                <input
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:border-[#1f6f8b]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:border-[#1f6f8b]"
                />
              </div>

            </div>

            {/* PASSWORD SECTION */}
            <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Update Password
                </label>

                <input
                  type="password"
                  name="password"
                  placeholder="New Password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:border-[#1f6f8b] text-[#1f6f8b]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Confirm Password
                </label>

                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:border-[#1f6f8b] text-[#1f6f8b]"
                />
              </div>

            </div>

            {/* SAVE BUTTON */}
            <button
              onClick={handleSave}
              disabled={loading || fetching}
              className="w-full bg-[#1f6f8b] text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-[#15586e] transition-all active:scale-[0.98] disabled:bg-slate-300"
            >
              {loading
                ? "Processing..."
                : "Save Profile Changes"}
            </button>

            {/* STATUS MESSAGE */}
            {status.text && (
              <p
                className={`text-center font-bold text-[10px] uppercase tracking-widest p-4 rounded-2xl border transition-all ${
                  status.type === "success"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-red-50 text-red-600 border-red-100"
                }`}
              >
                {status.type === "success" ? "✅" : "⚠️"}{" "}
                {status.text}
              </p>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
