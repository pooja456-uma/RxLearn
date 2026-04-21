"use client";

import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState<
    "idle" | "sending" | "success"
  >("idle");

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isValid =
    form.name.trim().length > 0 &&
    form.email.includes("@") &&
    form.message.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid) return;

    setStatus("sending");

    // simulate API call
    setTimeout(() => {
      setStatus("success");

      setTimeout(() => {
        setStatus("idle");
        setForm({ name: "", email: "", message: "" });
      }, 2500);
    }, 1200);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-10 md:p-14 rounded-3xl border shadow-sm space-y-8">

      {/* HEADER */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black tracking-widest uppercase text-slate-900">
          Support Hub
        </h1>
        <p className="text-sm text-slate-500">
          RxLearn Academic & Technical Assistance System
        </p>
      </div>

      {/* INFO BOXES */}
      <div className="grid md:grid-cols-2 gap-3 text-center text-xs font-bold">
        <div className="bg-slate-50 p-4 rounded-2xl">
          University of Moratuwa
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl text-blue-700">
          support@rxlearn.edu
        </div>
      </div>

      {/* FORM */}
      <div className="space-y-4">

        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Full Name"
          className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email Address"
          className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="Describe your issue or academic question..."
          rows={5}
          className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        {/* SUBMIT BUTTON */}
        <button
          disabled={!isValid || status === "sending"}
          onClick={handleSubmit}
          className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all ${
            !isValid || status === "sending"
              ? "bg-slate-300 text-white cursor-not-allowed"
              : "bg-slate-900 text-white hover:bg-blue-600"
          }`}
        >
          {status === "sending"
            ? "Submitting Ticket..."
            : "Submit Support Ticket"}
        </button>
      </div>

      {/* SUCCESS MESSAGE */}
      {status === "success" && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center text-sm font-semibold">
          ✅ Your support ticket has been submitted successfully.  
          We will respond within 24–48 hours.
        </div>
      )}

      {/* FOOTER */}
      <p className="text-center text-xs text-slate-400">
        For urgent academic or system issues, contact your department directly.
      </p>
    </div>
  );
}