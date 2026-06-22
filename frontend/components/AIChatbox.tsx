"use client";

import { useState } from "react";

export default function AIChatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Hello! I am your Virtual Clinical Preceptor. Ask me any questions about drug mechanisms, interactions, or formulary protocols." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/chat/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessages((prev) => [...prev, { sender: "ai", text: data.response }]);
      } else {
        // Displays the detailed string validation/API trace message from your FastAPI backend
        const systemError = data.detail || "Unable to establish connection to preceptor node.";
        setMessages((prev) => [...prev, { sender: "ai", text: `⚠️ ${systemError}` }]);
      }
    } catch {
      setMessages((prev) => [...prev, { sender: "ai", text: "❌ Connection error. Please verify your FastAPI server terminal status." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans text-left">
      {/* COLLAPSED TRIGGER BUTTON */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="bg-[#1E7B92] hover:bg-[#15586e] text-white p-4 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95 border border-[#1E7B92]/20">
          <span className="text-xl">💬</span>
          <span className="ml-2 text-xs font-black uppercase tracking-wider">AI Preceptor</span>
        </button>
      )}

      {/* ACTIVE INTERACTIVE CHAT WINDOW */}
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 h-[450px] border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* WINDOW HEADER */}
          <div className="bg-[#1E7B92] p-4 text-white flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">Virtual Clinical Preceptor</h3>
              <p className="text-[10px] opacity-80 font-medium">RxLearn Interactive AI Assistant</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-slate-200 font-bold text-sm px-2">✕</button>
          </div>

          {/* STREAM VIEW AREA */}
          <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-xl leading-relaxed ${m.sender === "user" ? "bg-[#1E7B92] text-white rounded-br-none font-semibold" : "bg-white border text-slate-700 rounded-bl-none font-medium shadow-sm"}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border text-slate-400 p-3 rounded-xl rounded-bl-none font-bold animate-pulse">
                  Preceptor is analyzing clinical data... ⚙️
                </div>
              </div>
            )}
          </div>

          {/* MESSAGE FORM FIELD */}
          <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex gap-2">
            <input required placeholder="Ask about amoxicillin, interactions, side effects..." value={input} onChange={(e) => setInput(e.target.value)} className="flex-grow p-2.5 border rounded-xl text-xs outline-none bg-slate-50 font-medium focus:bg-white focus:border-[#1E7B92] transition-all text-slate-800" />
            <button type="submit" disabled={loading} className="bg-[#1E7B92] hover:bg-[#15586e] text-white px-4 rounded-xl text-xs font-black uppercase transition-all disabled:opacity-50">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}