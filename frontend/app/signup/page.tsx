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

  // VALIDATION
  const validate = () => {
    let e: Record<string, string> = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const passRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    const phoneRegex = /^(07\d{8})$/;

    const nicOldRegex = /^\d{9}[VvXx]$/;
    const nicNewRegex = /^\d{12}$/;

    // FULL NAME
    if (!form.full_name.trim()) {
      e.full_name = "Full name is required.";
    } else if (form.full_name.trim().length < 3) {
      e.full_name =
        "Full name must contain at least 3 characters.";
    }

    // USERNAME
    if (!form.username.trim()) {
      e.username = "Username is required.";
    } else if (form.username.length < 5) {
      e.username =
        "Username must contain at least 5 characters.";
    }

    // EMAIL
    if (!form.email.trim()) {
      e.email = "Email address is required.";
    } else if (!emailRegex.test(form.email)) {
      e.email = "Please enter a valid email address.";
    }

    // PASSWORD
    if (!form.password) {
      e.password = "Password is required.";
    } else if (!passRegex.test(form.password)) {
      e.password =
        "Password must include uppercase, lowercase, numeric, and special characters.";
    }

    // GENDER
    if (!form.gender) {
      e.gender = "Please select a gender.";
    }

    // AGE
    if (!form.age) {
      e.age = "Please enter your age.";
    } else {
      const age = parseInt(form.age);

      if (isNaN(age)) {
        e.age = "Please enter a valid age.";
      } else if (age < 10 || age > 120) {
        e.age =
          "Users must be older than 10 years to register.";
      }
    }

    // CONTACT NUMBER
    if (!form.contact_number.trim()) {
      e.contact = "Contact number is required.";
    } else if (!phoneRegex.test(form.contact_number)) {
      e.contact =
        "Please enter a valid mobile number.";
    }

    // NIC
    if (!form.nic_number.trim()) {
      e.nic = "NIC number is required.";
    } else if (
      !nicOldRegex.test(form.nic_number) &&
      !nicNewRegex.test(form.nic_number)
    ) {
      e.nic = "Please enter a valid NIC number.";
    }

    setErrors(e);

    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            age: parseInt(form.age) || 0,
          }),
        }
      );

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
          regNum
            ? "opacity-30 blur-sm pointer-events-none"
            : ""
        }`}
      >

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#1f6f8b]">
            RxLearn
          </h1>

          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
            Create Student Account
          </p>
        </div>

        {/* FORM */}
        <div className="grid md:grid-cols-2 gap-6">

          <div className="space-y-4">

            <InputField
              label="Full Name"
              value={form.full_name}
              error={errors.full_name}
              onChange={(v) =>
                setForm({
                  ...form,
                  full_name: v,
                })
              }
              placeholder="Student Name"
            />

            <InputField
              label="Username"
              value={form.username}
              error={errors.username}
              onChange={(v) =>
                setForm({
                  ...form,
                  username: v,
                })
              }
              placeholder="Username"
            />

            <InputField
              label="Email"
              value={form.email}
              error={errors.email}
              onChange={(v) =>
                setForm({
                  ...form,
                  email: v,
                })
              }
              placeholder="email@example.com"
            />

            <InputField
              label="Password"
              type="password"
              value={form.password}
              error={errors.password}
              onChange={(v) =>
                setForm({
                  ...form,
                  password: v,
                })
              }
              placeholder="Password"
            />
          </div>

          <div className="space-y-4">

            {/* GENDER */}
            <div>
              <label className="text-xs font-bold text-slate-500">
                Gender
              </label>

              <select
                className={`w-full mt-1 p-3 border rounded-xl bg-slate-50 ${
                  errors.gender
                    ? "border-red-500"
                    : ""
                }`}
                value={form.gender}
                onChange={(e) =>
                  setForm({
                    ...form,
                    gender: e.target.value,
                  })
                }
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

            <InputField
              label="Age"
              type="number"
              value={form.age}
              error={errors.age}
              onChange={(v) =>
                setForm({
                  ...form,
                  age: v,
                })
              }
              placeholder="Years"
            />

            <InputField
              label="Contact Number"
              value={form.contact_number}
              error={errors.contact}
              onChange={(v) =>
                setForm({
                  ...form,
                  contact_number: v,
                })
              }
              placeholder="07XXXXXXXX"
            />

            <InputField
              label="NIC Number"
              value={form.nic_number}
              error={errors.nic}
              onChange={(v) =>
                setForm({
                  ...form,
                  nic_number: v,
                })
              }
              placeholder="XXXXXXXXXXV"
            />
          </div>
        </div>

        {/* ACTION */}
        <div className="mt-8 flex flex-col items-center">

          <button
            onClick={handleSignup}
            className="w-full md:w-1/2 bg-[#1f6f8b] text-white py-3 rounded-xl font-bold hover:bg-[#15586e] transition-all"
          >
            {loading
              ? "Registering..."
              : "Register"}
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
              Your account has been created successfully.
            </p>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl border">
              <p className="text-xs text-slate-400">
                Registration ID
              </p>

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
function InputField({
  label,
  placeholder,
  type = "text",
  error,
  onChange,
  value,
}: InputProps) {

  const [showPassword, setShowPassword] =
    useState(false);

  const isPassword = type === "password";

  return (
    <div>
      <label className="text-xs font-bold text-slate-500">
        {label}
      </label>

      <div className="relative">

        <input
          type={
            isPassword
              ? showPassword
                ? "text"
                : "password"
              : type
          }
          value={value}
          placeholder={placeholder}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className={`w-full mt-1 p-3 border rounded-xl bg-slate-50 focus:border-[#1f6f8b] outline-none pr-16 ${
            error ? "border-red-500" : ""
          }`}
        />

        {/* SHOW / HIDE PASSWORD */}
        {isPassword && (
          <button
            type="button"
            onClick={() =>
              setShowPassword(!showPassword)
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#1f6f8b]"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-xs mt-1 font-bold italic">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}