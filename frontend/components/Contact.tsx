"use client";

import { useState, useEffect } from "react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [regNo, setRegNo] = useState<string>("GUEST");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [emailError, setEmailError] = useState(false);

  // ✅ AUTO-POPULATE DATA FROM DATABASE (via localStorage)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("userName") || "";
      const storedReg = localStorage.getItem("userReg") || "GUEST";
      const storedEmail = localStorage.getItem("userEmail") || ""; // We will update login to save this

      setForm((prev) => ({
        ...prev,
        name: storedName,
        email: storedEmail,
      }));

      setRegNo(storedReg);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (emailError) setEmailError(false);
    if (status !== "idle") setStatus("idle");
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValid = form.name.trim() !== "" && form.email.trim() !== "" && form.message.trim() !== "";

  const handleSubmit = async () => {
    if (!isValid) return;
    if (!validateEmail(form.email)) {
      setEmailError(true);
      return;
    }

    setStatus("sending");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_number: regNo,
          name: form.name,
          email: form.email,
          message: form.message,
        }),
      });

      if (response.ok) {
        setStatus("success");
        setTimeout(() => {
          setStatus("idle");
          setForm((prev) => ({ ...prev, message: "" }));
        }, 3000);
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-10 md:p-14 rounded-[40px] border border-slate-100 shadow-2xl space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black tracking-tighter italic text-[#1f6f8b]">
          Support Hub
        </h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Institutional Academic & Technical Assistance
        </p>
      </div>

      {/* AUTO-POPULATED IDENTITY INFO */}
      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Student Name</p>
          <p className="text-sm font-black text-slate-700 mt-1">{form.name || "Loading..."}</p>
        </div>
        <div className="border-l border-slate-200 pl-4">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Registration ID</p>
          <p className="text-sm font-black text-[#1f6f8b] mt-1">{regNo}</p>
        </div>
      </div>

      {/* FORM */}
      <div className="space-y-5">
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Email Address</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="example@rxlearn.edu"
            className={`w-full p-4 rounded-2xl bg-slate-50 border outline-none font-bold text-sm mt-1 transition-all ${
              emailError ? "border-red-500 bg-red-50" : "border-slate-200 focus:border-[#1f6f8b]"
            }`}
          />
          {emailError && (
            <p className="text-[10px] text-red-600 font-bold italic mt-1">** Please enter a valid email address</p>
          )}
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Describe Your Issue</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="How can the faculty assist you today?"
            rows={5}
            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-medium text-sm mt-1 focus:border-[#1f6f8b]"
          />
        </div>

        <button
          disabled={!isValid || status === "sending"}
          onClick={handleSubmit}
          className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${
            !isValid || status === "sending"
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-[#1f6f8b] text-white hover:bg-[#15586e] active:scale-95 shadow-[#1f6f8b]/20"
          }`}
        >
          {status === "sending" ? "Transmitting..." : "Submit Support Ticket"}
        </button>
      </div>

      {/* FEEDBACK MESSAGES */}
      {status === "success" && (
        <div className="bg-emerald-50 text-emerald-700 p-5 rounded-2xl text-center text-[11px] font-black border border-emerald-100 animate-in fade-in zoom-in-95 uppercase tracking-widest">
          ✅ Ticket Submitted Successfully
        </div>
      )}

      {status === "error" && !emailError && (
        <div className="bg-red-50 text-red-600 p-5 rounded-2xl text-center text-[11px] font-black border border-red-100 uppercase">
          ❌ Server connection failed
        </div>
      )}
    </div>
  );
}