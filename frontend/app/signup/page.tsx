"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface InputProps {
  label: string;
  placeholder: string;
  type?: string;
  error?: string;
  onChange: (value: string) => void;
  value: string;
}

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    gender: "",
    age: "",
    contact_number: "",
    nic_number: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [regNum, setRegNum] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let e: Record<string, string> = {};
    const passRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (form.username.length < 5) e.username = "Min 5 characters required";
    if (!form.email.includes("@")) e.email = "Invalid email";
    if (!passRegex.test(form.password))
      e.password = "Weak password format";
    if (form.contact_number.length < 10)
      e.contact = "Invalid phone number";
    if (form.nic_number.length < 10) e.nic = "Invalid NIC";
    if (!form.gender) e.gender = "Select gender";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age: parseInt(form.age) || 0 }),
      });

      const data = await res.json();

      if (res.ok) {
        setRegNum(data.registration_number);
        localStorage.clear();
      } else {
        alert(data.detail);
      }
    } catch {
      alert("Server not responding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-6 font-sans">

      {/* FORM CARD */}
      <div
        className={`w-full max-w-4xl bg-white rounded-3xl shadow-xl p-10 border transition-all duration-300 ${
          regNum ? "opacity-30 blur-sm pointer-events-none" : ""
        }`}
      >

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#1f6f8b]">RxLearn</h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
            Create Student Account
          </p>
        </div>

        {/* FORM */}
        <div className="grid md:grid-cols-2 gap-6">

          <div className="space-y-4">
            <InputField label="Full Name" value={form.full_name} onChange={(v)=>setForm({...form, full_name:v})} placeholder="Student Name"/>
            <InputField label="Username" value={form.username} error={errors.username} onChange={(v)=>setForm({...form, username:v})} placeholder="Username"/>
            <InputField label="Email" value={form.email} error={errors.email} onChange={(v)=>setForm({...form, email:v})} placeholder="email@example.com"/>
            <InputField label="Password" type="password" value={form.password} error={errors.password} onChange={(v)=>setForm({...form, password:v})} placeholder="Password"/>
          </div>

          <div className="space-y-4">

            <div>
              <label className="text-xs font-bold text-slate-500">Gender</label>
              <select
                className="w-full mt-1 p-3 border rounded-xl bg-slate-50"
                value={form.gender}
                onChange={(e)=>setForm({...form, gender:e.target.value})}
              >
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
              </select>
              {errors.gender && (
                <p className="text-red-600 text-xs mt-1 font-bold italic">
                  ⚠ {errors.gender}
                </p>
              )}
            </div>

            <InputField label="Age" type="number" value={form.age} onChange={(v)=>setForm({...form, age:v})} placeholder="Years"/>
            <InputField label="Contact" value={form.contact_number} error={errors.contact} onChange={(v)=>setForm({...form, contact_number:v})} placeholder="07XXXXXXXX"/>
            <InputField label="NIC" value={form.nic_number} error={errors.nic} onChange={(v)=>setForm({...form, nic_number:v})} placeholder="XXXXXXXXXXV"/>
          </div>
        </div>

        {/* ACTION */}
        <div className="mt-8 flex flex-col items-center">
          <button
            onClick={handleSignup}
            className="w-full md:w-1/2 bg-[#1f6f8b] text-white py-3 rounded-xl font-bold hover:bg-[#15586e] transition-all"
          >
            {loading ? "Registering..." : "Register"}
          </button>

          <button
            onClick={() => router.push("/")}
            className="mt-3 text-xs text-slate-400 hover:text-[#1f6f8b]"
          >
            Back to Login
          </button>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {regNum && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">

          <div className="bg-white p-10 rounded-3xl text-center shadow-2xl max-w-md w-full animate-fade-in">

            <div className="text-5xl mb-4">🎉</div>

            <h2 className="text-xl font-black text-slate-800">
              Successfully Registered
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Your account has been created successfully
            </p>

            {/* REG NUMBER */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border">
              <p className="text-xs text-slate-400">Registration ID</p>
              <p className="text-2xl font-black text-[#1f6f8b] tracking-widest">
                {regNum}
              </p>
            </div>

            <button
              onClick={() => router.push("/")}
              className="mt-6 w-full bg-[#1f6f8b] text-white py-3 rounded-xl font-bold hover:bg-[#15586e]"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// INPUT COMPONENT
function InputField({ label, placeholder, type="text", error, onChange, value }: InputProps) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e)=>onChange(e.target.value)}
        className={`w-full mt-1 p-3 border rounded-xl bg-slate-50 focus:border-[#1f6f8b] outline-none ${
          error ? "border-red-500" : ""
        }`}
      />
      {error && (
        <p className="text-red-600 text-xs mt-1 font-bold italic">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}