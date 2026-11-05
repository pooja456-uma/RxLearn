"use client";

// ======================================================
// 1. IMPORTS AND TYPES
// ======================================================
import { useEffect, useRef, useState, type FormEvent } from "react";

type ChatMessage = {
  sender: "user" | "ai";
  text: string;
};

type AIChatboxProps = {
  // Question prepared by OCR Lab; never submitted automatically.
  initialPrompt?: string;
  // Increment when a new OCR question is requested, including repeats.
  promptRequestId?: number;
};

const API_URL = "http://127.0.0.1:8000/api/chat/query";
const WELCOME_MESSAGE: ChatMessage = {
  sender: "ai",
  text: "Hello! I am your Virtual Clinical Preceptor. Ask me about drug mechanisms, interactions, counseling, or pharmacology.",
};

// ======================================================
// 2. CHAT COMPONENT AND STATE
// ======================================================
export default function AIChatbox({
  initialPrompt = "",
  promptRequestId = 0,
}: AIChatboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const lastHandledRequestRef = useRef<number | null>(null);

  // ======================================================
  // 3. RECEIVE A QUESTION FROM OCR LAB
  // ======================================================
  // A new request opens the chat and fills the message box.
  // The user must click Send; no question is sent automatically.
  useEffect(() => {
    if (!initialPrompt.trim()) return;
    if (lastHandledRequestRef.current === promptRequestId) return;

    lastHandledRequestRef.current = promptRequestId;
    setInput(initialPrompt);
    setIsOpen(true);
  }, [initialPrompt, promptRequestId]);

  // ======================================================
  // 4. SCROLL TO THE MOST RECENT MESSAGE
  // ======================================================
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  // ======================================================
  // 5. FOCUS THE MESSAGE FIELD WHEN CHAT OPENS
  // ======================================================
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen, initialPrompt, promptRequestId]);

  // ======================================================
  // 6. SEND A MESSAGE TO FASTAPI AI PRECEPTOR
  // ======================================================
  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setLoading(true);

    const controller = new AbortController();
    requestRef.current = controller;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: typeof data.response === "string"
              ? data.response
              : "The Preceptor returned an unexpected response.",
          },
        ]);
      } else {
        // Show safe, readable FastAPI validation errors.
        const detail = typeof data.detail === "string"
          ? data.detail
          : "Unable to contact the AI Preceptor service.";
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: `⚠️ ${detail}` },
        ]);
      }
    } catch (error: unknown) {
      if (!controller.signal.aborted) {
        console.error("AI Preceptor request failed:", error);
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "❌ Connection error. Please check that your FastAPI server is running.",
          },
        ]);
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  };

  // ======================================================
  // 7. CANCEL REQUEST WHEN COMPONENT UNMOUNTS
  // ======================================================
  useEffect(() => {
    return () => requestRef.current?.abort();
  }, []);

  // ======================================================
  // 8. FLOATING CHAT BUTTON AND CHAT WINDOW
  // ======================================================
  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans text-left">
      {/* 8.1 - Collapsed floating trigger */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Preceptor"
          className="bg-[#1E7B92] hover:bg-[#15586e] text-white p-4 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95 border border-[#1E7B92]/20"
        >
          <span className="text-xl">💬</span>
          <span className="ml-2 text-xs font-black uppercase tracking-wider">
            AI Preceptor
          </span>
        </button>
      )}

      {/* 8.2 - Expanded interactive chat window */}
      {isOpen && (
        <div className="bg-white w-[calc(100vw-3rem)] max-w-96 h-[450px] max-h-[75vh] border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* 8.3 - Window header */}
          <div className="bg-[#1E7B92] p-4 text-white flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">
                Virtual Clinical Preceptor
              </h3>
              <p className="text-[10px] opacity-80 font-medium">
                RxLearn Interactive AI Assistant
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI Preceptor"
              className="text-white hover:text-slate-200 font-bold text-sm px-2"
            >
              ✕
            </button>
          </div>

          {/* 8.4 - Conversation history */}
          <div
            className="flex-grow p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs"
            aria-live="polite"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-xl leading-relaxed whitespace-pre-wrap break-words ${
                    message.sender === "user"
                      ? "bg-[#1E7B92] text-white rounded-br-none font-semibold"
                      : "bg-white border text-slate-700 rounded-bl-none font-medium shadow-sm"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border text-slate-400 p-3 rounded-xl rounded-bl-none font-bold animate-pulse">
                  Preceptor is preparing a response... ⚙️
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 8.5 - Educational-use reminder */}
          <p className="px-3 py-1.5 text-[10px] text-slate-500 bg-white border-t border-slate-100">
            Educational support only. Do not share identifiable patient information.
          </p>

          {/* 8.6 - Message input and send button */}
          <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex gap-2">
            <input
              ref={inputRef}
              required
              aria-label="Message to AI Preceptor"
              placeholder="Ask about drugs, mechanisms, counseling..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-w-0 flex-grow p-2.5 border rounded-xl text-xs outline-none bg-slate-50 font-medium focus:bg-white focus:border-[#1E7B92] transition-all text-slate-800"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#1E7B92] hover:bg-[#15586e] text-white px-4 rounded-xl text-xs font-black uppercase transition-all disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
