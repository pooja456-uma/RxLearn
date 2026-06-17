"use client";

import { useState, useEffect } from "react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [regNo, setRegNo] = useState<string>("GUEST");

  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  const [emailError, setEmailError] = useState(false);

  // AUTO POPULATE USER DATA
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("userName") || "";
      const storedReg = localStorage.getItem("userReg") || "GUEST";
      const storedEmail = localStorage.getItem("userEmail") || "";

      setForm((prev) => ({
        ...prev,
        name: storedName,
        email: storedEmail,
      }));

      setRegNo(storedReg);
    }
  }, []);

  // EMAIL VALIDATION
  const validateEmail = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
  };

  // HANDLE CHANGES
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    const cleanValue =
      name === "email" ? value.replace(/\s/g, "") : value;

    setForm({
      ...form,
      [name]: cleanValue,
    });

    if (status !== "idle") {
      setStatus("idle");
    }

    if (name === "email") {
      if (cleanValue.length > 0) {
        setEmailError(!validateEmail(cleanValue));
      } else {
        setEmailError(false);
      }
    }
  };

  // FORM VALIDATION
  const isValid =
    form.name.trim() !== "" &&
    form.email.trim() !== "" &&
    form.message.trim() !== "" &&
    !emailError;

  // SUBMIT
  const handleSubmit = async () => {
    if (!isValid) return;

    setStatus("sending");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/support/ticket",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            registration_number: regNo,
            name: form.name,
            email: form.email,
            message: form.message,
          }),
        }
      );

      if (response.ok) {
        setStatus("success");

        setTimeout(() => {
          setStatus("idle");

          setForm((prev) => ({
            ...prev,
            message: "",
          }));
        }, 3000);
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-xl p-10 md:p-14 rounded-[40px] border border-slate-100 shadow-2xl space-y-8 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-[#1f6f8b]/10 flex items-center justify-center mx-auto text-4xl shadow-inner">
          💬
        </div>

        <h1 className="text-4xl font-black tracking-tighter text-[#1f6f8b]">
          Support Hub
        </h1>

        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
          Academic & Technical Assistance Center
        </p>
      </div>

      {/* USER INFO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/80 p-6 rounded-3xl border border-slate-100 shadow-inner">

        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Student Name
          </p>

          <p className="text-sm font-black text-slate-700 mt-2">
            {form.name || "Loading..."}
          </p>
        </div>

        <div className="md:border-l border-slate-200 md:pl-6">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Registration ID
          </p>

          <p className="text-sm font-black text-[#1f6f8b] mt-2">
            {regNo}
          </p>
        </div>
      </div>

      {/* FORM */}
      <div className="space-y-6">

        {/* EMAIL */}
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Confirm Email Address
          </label>

          <div className="relative mt-2">

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@rxlearn.edu"
              className={`w-full p-4 pr-14 rounded-2xl outline-none font-bold text-sm transition-all duration-300 border
              
              ${
                form.email.length === 0
                  ? "border-slate-200 bg-slate-50 focus:border-[#1f6f8b]"
                  : emailError
                  ? "border-red-500 bg-red-50 focus:border-red-500"
                  : "border-emerald-500 bg-emerald-50 focus:border-emerald-500"
              }
              `}
            />

            {/* VALIDATION ICON */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-lg">
              {form.email.length > 0 && (
                <>
                  {emailError ? (
                    <span className="text-red-500">✖</span>
                  ) : (
                    <span className="text-emerald-500">✔</span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ERROR */}
          {emailError && (
            <p className="text-[10px] text-red-600 font-bold italic mt-2 animate-pulse">
              Please enter a valid email address
            </p>
          )}

          {/* SUCCESS */}
          {!emailError &&
            form.email.length > 5 &&
            validateEmail(form.email) && (
              <p className="text-[10px] text-emerald-600 font-bold italic mt-2">
                Valid institutional email
              </p>
            )}
        </div>

        {/* MESSAGE */}
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Describe Your Issue
          </label>

          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="How can the faculty assist you today?"
            rows={6}
            className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-medium text-sm mt-2 focus:border-[#1f6f8b] transition-all resize-none"
          />
        </div>

        {/* BUTTON */}
        <button
          disabled={!isValid || status === "sending"}
          onClick={handleSubmit}
          className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-xs transition-all duration-300 shadow-lg
          
          ${
            !isValid || status === "sending"
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-[#1f6f8b] text-white hover:bg-[#15586e] hover:scale-[1.02] active:scale-95 shadow-[#1f6f8b]/30"
          }
          `}
        >
          {status === "sending"
            ? "Transmitting..."
            : "Submit Support Ticket"}
        </button>
      </div>

      {/* SUCCESS */}
      {status === "success" && (
        <div className="bg-emerald-50 text-emerald-700 p-5 rounded-2xl text-center text-[11px] font-black border border-emerald-100 animate-in fade-in zoom-in-95 uppercase tracking-widest shadow-sm">
          ✅ Ticket Submitted Successfully
        </div>
      )}

      {/* ERROR */}
      {status === "error" && (
        <div className="bg-red-50 text-red-600 p-5 rounded-2xl text-center text-[11px] font-black border border-red-100 uppercase animate-in fade-in">
          ❌ Server connection failed
        </div>
      )}
    </div>
  );
}