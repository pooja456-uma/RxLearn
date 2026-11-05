"use client";

import { useEffect, useRef, useState } from "react";

// ============================================================
// 1. TYPES, CONFIGURATION AND EDUCATIONAL CONTENT
// ============================================================
type Medication = {
  brand_name?: string; generic_name?: string; strength?: string;
  frequency?: string; verified?: boolean; confidence?: number;
  description?: string; raw_text?: string;
};
type EducationalReport = {
  drug_education?: string[]; prescription_abbreviations?: string[];
  safety_observations?: string[]; missing_information?: string[];
  patient_counseling?: string[]; learning_takeaways?: string[];
};
type HistorySummary = { id: number; title: string; created_at: string };
type SavedCase = HistorySummary & {
  image_data_url: string; medications: Medication[];
  analysis: string[]; educational_report: EducationalReport;
};
type QuizQuestion = { question: string; choices: string[]; answer: number; explanation: string };
type OcrLabProps = {
  // Connect these callbacks in page.tsx when that file is updated.
  onExploreDrug?: (drugName: string) => void;
  onAskPreceptor?: (prefilledQuestion: string) => void;
};

const API = "http://127.0.0.1:8000";
const DISCLAIMER = "RxLearn is for pharmacy education only. AI-generated extraction and explanations are not clinically verified and must not be used to dispense medication or make treatment decisions.";
const validDrugName = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name && !["null", "none", "n/a", "na", "not specified", "unknown", "undefined"].includes(name.toLowerCase()) ? name : null;
};
const displayName = (m: Medication) => validDrugName(m.brand_name) || validDrugName(m.generic_name) || "Unidentified medication";
const reportSections: { key: keyof EducationalReport; title: string; icon: string; tone: string; description: string }[] = [
  { key: "drug_education", title: "Pharmacology & Drug Education", icon: "💊", tone: "border-[#1E7B92]/20 bg-[#EBF0F3]/40", description: "Understand the drug and its therapeutic purpose" },
  { key: "prescription_abbreviations", title: "Prescription Abbreviations", icon: "📝", tone: "border-sky-200 bg-sky-50/60", description: "Learn the language of prescription instructions" },
  { key: "safety_observations", title: "Safety & Verification Points", icon: "🛡️", tone: "border-amber-200 bg-amber-50/60", description: "Items to review, not a clinical safety approval" },
  { key: "missing_information", title: "Missing or Unclear Information", icon: "🔎", tone: "border-orange-200 bg-orange-50/60", description: "What still needs to be confirmed" },
  { key: "patient_counseling", title: "Patient Counseling Education", icon: "💬", tone: "border-teal-200 bg-teal-50/60", description: "General pharmacy counseling considerations" },
  { key: "learning_takeaways", title: "Student Learning Takeaways", icon: "🎓", tone: "border-indigo-200 bg-indigo-50/60", description: "Key lessons from this practice case" },
];
const checklistItems = [
  "Patient identity/details checked against original", "Prescription date checked",
  "Prescriber details/signature checked", "Drug names checked against original",
  "Strength and dosage form checked", "Dose and frequency checked",
  "Route of administration checked", "Duration/quantity checked",
  "Allergies, interactions and contraindications reviewed with trusted references",
  "Unclear handwriting or missing information flagged for clarification",
];

// ============================================================
// 2. QUIZ BUILDER: QUESTIONS ONLY ABOUT EXTRACTED TEXT
// ============================================================
// These are reading-comprehension questions, not clinical recommendations.
function buildQuiz(meds: Medication[]): QuizQuestion[] {
  // 2A. Use extracted facts and add educational questions if OCR data is sparse.
  const questions: QuizQuestion[] = [];
  const add = (question: string, correct: string, wrong: string[], explanation: string) => {
    if (questions.length >= 5) return;
    const choices = [correct, ...wrong.filter(x => x !== correct)].slice(0, 4);
    if (choices.length < 2) return;
    const offset = questions.length % choices.length;
    const shuffled = [...choices.slice(offset), ...choices.slice(0, offset)];
    questions.push({ question, choices: shuffled, answer: shuffled.indexOf(correct), explanation });
  };
  const known = meds.filter(m => validDrugName(m.brand_name) || validDrugName(m.generic_name));
  for (const m of known) {
    const name = displayName(m);
    add("Which medication name appears in the OCR extraction?", name,
      ["No medication was identified", "Only patient details were extracted", "Only a date was extracted"],
      `The OCR output contains “${name}”. Always check the original image.`);
    if (m.strength && validDrugName(m.strength)) add(`What strength was extracted for ${name}?`, m.strength,
      ["Strength was not extracted", "The prescription date", "The patient's age"],
      `OCR reported “${m.strength}”. This is not independent dose verification.`);
    if (m.frequency && validDrugName(m.frequency)) add(`What frequency was extracted for ${name}?`, m.frequency,
      ["Frequency was not extracted", "The patient's name", "The prescriber's address"],
      `OCR reported “${m.frequency}”. Verify the instructions manually.`);
    if (questions.length >= 5) break;
  }
  // 2B. Guaranteed fallback: 3–5 questions even for one or zero extracted drugs.
  add("What should a student do before relying on an OCR-extracted drug name?",
    "Compare it with the original prescription",
    ["Dispense immediately", "Assume the OCR is always accurate", "Ignore unclear handwriting"],
    "OCR can misread handwritten text. Always verify against the original.");
  add("Does a high AI confidence score establish clinical accuracy?",
    "No, it is only a model estimate",
    ["Yes, it authorizes dispensing", "Yes, it confirms the dose is safe", "Yes, it replaces pharmacist review"],
    "AI confidence is not a clinical safety assessment.");
  add("How should missing or unclear prescription information be handled?",
    "Flag it for clarification",
    ["Guess the missing value", "Ignore it", "Treat AI guesses as confirmed"],
    "Unclear details must be resolved through appropriate review.");
  add("What is the main purpose of the prescription review checklist?",
    "Practice manually checking important prescription details",
    ["Automatically approve dispensing", "Replace a pharmacist", "Guarantee there are no interactions"],
    "Checklist ticks record a student's review, not clinical safety approval.");
  add("When is an AI-extracted prescription suitable for use in RxLearn?",
    "For supervised educational practice with manual verification",
    ["For immediate dispensing without checks", "As a replacement for a legal prescription", "As proof of medication safety"],
    "RxLearn is an educational simulation, not a dispensing decision tool.");
  return questions.slice(0, 5);
}

// ============================================================
// 3. MAIN OCR LAB COMPONENT AND STATE
// ============================================================
export default function OcrLab({ onExploreDrug, onAskPreceptor }: OcrLabProps) {
  const [image, setImage] = useState<string | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [analysis, setAnalysis] = useState<string[]>([]);
  const [report, setReport] = useState<EducationalReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [caseTitle, setCaseTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistorySummary[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyBusy, setHistoryBusy] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checked, setChecked] = useState<number[]>([]);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const imageRef = useRef<string | null>(null);
  const currentRequest = useRef(0);
  const hasReport = Boolean(report && reportSections.some(s => Array.isArray(report[s.key]) && (report[s.key]?.length || 0) > 0));
  const hasResults = medications.length > 0 || analysis.length > 0 || hasReport;
  const questions = buildQuiz(medications);

  // ============================================================
  // 4. AUTHENTICATED REQUEST HELPER
  // ============================================================
  const authFetch = (path: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("Please log in again to use Prescription History.");
    return fetch(`${API}${path}`, {
      ...options,
      headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), Authorization: `Bearer ${token}`, ...options.headers },
    });
  };
  const readError = async (res: Response) => {
    const data = await res.json().catch(() => ({}));
    return typeof data.detail === "string" ? data.detail : `Request failed (HTTP ${res.status}).`;
  };

  // ============================================================
  // 5. CLEAR CASE AND HANDLE IMAGE UPLOAD
  // ============================================================
  const clearAll = () => {
    currentRequest.current += 1;
    requestRef.current?.abort();
    requestRef.current = null;
    setLoading(false); setImage(null); imageRef.current = null;
    setMedications([]); setAnalysis([]); setReport(null);
    setError(""); setNotice(""); setHasAnalyzed(false); setSavedId(null);
    setCaseTitle(""); setChecked([]); setChecklistOpen(false);
    setQuizOpen(false); setQuizAnswers({}); setQuizSubmitted(false);
    if (fileRef.current) fileRef.current.value = "";
  };
  const handleFileChange = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPEG, PNG or WebP prescription image."); return;
    }
    if (file.size > 6_000_000) { setError("Choose an image smaller than 6 MB."); return; }
    clearAll();
    const reader = new FileReader();
    reader.onload = () => { const result = reader.result; if (typeof result === "string") { imageRef.current = result; setImage(result); } };
    reader.readAsDataURL(file);
  };

  // ============================================================
  // 6. GEMINI OCR ANALYSIS
  // ============================================================
  const analyze = async () => {
    if (!image || loading) return;
    const id = ++currentRequest.current;
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true); setError(""); setNotice(""); setHasAnalyzed(false);
    setSavedId(null); setMedications([]); setAnalysis([]); setReport(null);
    setChecked([]); setQuizAnswers({}); setQuizSubmitted(false); setQuizOpen(false);
    const timeout = setTimeout(() => controller.abort(), 90000);
    try {
      const blob = await (await fetch(image)).blob();
      const formData = new FormData();
      formData.append("file", blob, `rx_scan.${blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg"}`);
      const res = await fetch(`${API}/ocr`, { method: "POST", body: formData, signal: controller.signal });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.detail || data.error || data.message || `OCR failed (HTTP ${res.status}).`);
      if (id !== currentRequest.current) return;
      setMedications(Array.isArray(data.medications) ? data.medications : []);
      setAnalysis(Array.isArray(data.analysis) ? data.analysis : []);
      setReport(data.educational_report && typeof data.educational_report === "object" ? data.educational_report : null);
      setHasAnalyzed(true);
      setCaseTitle(`Prescription Practice - ${new Date().toLocaleDateString()}`);
    } catch (err) {
      if (id !== currentRequest.current) return;
      setError(controller.signal.aborted ? "Analysis was cancelled or exceeded 90 seconds. Try a clearer image." : `Analysis unsuccessful: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      clearTimeout(timeout);
      if (id === currentRequest.current) { setLoading(false); requestRef.current = null; }
    }
  };

  // ============================================================
  // 7. SAVE REPORT TO THE AUTHENTICATED STUDENT'S MYSQL HISTORY
  // ============================================================
  const saveReport = async () => {
    // 7A. Explain all precondition failures instead of silently returning.
    setError(""); setNotice("");
    if (saving) { setNotice("Saving is already in progress."); return; }
    if (savedId !== null) { setNotice(`Already saved as case #${savedId}.`); return; }
    if (!image) { setError("Please upload a prescription image first."); return; }
    if (!hasAnalyzed) { setError("Please analyze the prescription before saving."); return; }
    if (!caseTitle.trim()) { setError("Enter a case title before saving."); return; }
    const token = localStorage.getItem("accessToken");
    if (!token) { setError("Login token missing. Please sign out and log in again before saving."); return; }

    setSaving(true);
    try {
      // 7B. POST the complete case to the JWT-protected history endpoint.
      const res = await fetch(`${API}/api/prescriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: caseTitle.trim(), image_data_url: image,
          medications, analysis, educational_report: report || {}
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await readError(res)}`);
      const result = await res.json();
      const id = Number(result.id ?? result.case_id);
      if (!Number.isFinite(id) || id <= 0) {
        throw new Error("The API did not return a valid saved case ID. Check the POST response.");
      }
      // 7C. Show a visible confirmation and refresh history.
      setSavedId(id);
      setNotice(`✓ Prescription saved successfully! Case #${id} is available in My History, even after Clear All.`);
      if (historyOpen) void loadHistory(historySearch);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(`Save Report failed: ${message}`);
      console.error("RxLearn save report error:", err);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // 8. LOAD, SEARCH AND OPEN PRESCRIPTION HISTORY
  // ============================================================
  const loadHistory = async (search = "") => {
    setHistoryBusy(true); setError("");
    try {
      const res = await authFetch(`/api/prescriptions?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error(await readError(res));
      setHistory(await res.json());
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load history."); }
    finally { setHistoryBusy(false); }
  };
  useEffect(() => {
    if (!historyOpen) return;
    const timer = setTimeout(() => { void loadHistory(historySearch); }, 250);
    return () => clearTimeout(timer);
    // The search is intentionally refreshed only when the panel or query changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyOpen, historySearch]);
  const openSavedCase = async (caseId: number) => {
    setHistoryBusy(true); setError("");
    try {
      const res = await authFetch(`/api/prescriptions/${caseId}`);
      if (!res.ok) throw new Error(await readError(res));
      const data: SavedCase = await res.json();
      clearAll();
      setImage(data.image_data_url); imageRef.current = data.image_data_url;
      setMedications(Array.isArray(data.medications) ? data.medications : []);
      setAnalysis(Array.isArray(data.analysis) ? data.analysis : []);
      setReport(data.educational_report || null);
      setCaseTitle(data.title); setSavedId(data.id); setHasAnalyzed(true);
      setHistoryOpen(false); setNotice("Saved prescription opened without running OCR again.");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to open case."); }
    finally { setHistoryBusy(false); }
  };

  // ============================================================
  // 9. RENAME AND DELETE SAVED CASES
  // ============================================================
  const renameCase = async (item: HistorySummary) => {
    const title = window.prompt("New prescription title:", item.title)?.trim();
    if (!title || title === item.title) return;
    try {
      const res = await authFetch(`/api/prescriptions/${item.id}`, { method: "PATCH", body: JSON.stringify({ title }) });
      if (!res.ok) throw new Error(await readError(res));
      if (savedId === item.id) setCaseTitle(title);
      await loadHistory(historySearch);
      setNotice("Prescription renamed.");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to rename case."); }
  };
  const deleteCase = async (item: HistorySummary) => {
    if (!window.confirm(`Permanently delete “${item.title}”?`)) return;
    try {
      const res = await authFetch(`/api/prescriptions/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readError(res));
      if (savedId === item.id) setSavedId(null);
      await loadHistory(historySearch);
      setNotice("Saved prescription deleted.");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to delete case."); }
  };

  // ============================================================
  // 10. DOWNLOAD PDF VIA THE BROWSER'S SAVE-AS-PDF PRINT DIALOG
  // ============================================================
  // No third-party PDF package is required. The print view includes the image,
  // medication extraction, observations, all six report sections and disclaimer.
  const downloadPdf = () => {
    if (!hasAnalyzed) return;
    const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
    const list = (items?: string[]) => items?.length ? `<ul>${items.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>` : "<p>None recorded.</p>";
    const medsHtml = medications.map((m, i) => `<section><h3>Medication ${i + 1}: ${escapeHtml(displayName(m))}</h3><p><b>Generic:</b> ${escapeHtml(validDrugName(m.generic_name) || "Not confirmed")}</p><p><b>Strength:</b> ${escapeHtml(m.strength || "Not identified")}</p><p><b>Frequency:</b> ${escapeHtml(m.frequency || "Not identified")}</p><p><b>Description:</b> ${escapeHtml(m.description || "Not available")}</p><p><b>Raw OCR:</b> ${escapeHtml(m.raw_text || "Not available")}</p></section>`).join("");
    const reportHtml = reportSections.map(s => `<section><h2>${escapeHtml(s.title)}</h2>${list(report?.[s.key])}</section>`).join("");
    const printWindow = window.open("", "_blank");
    if (!printWindow) { setError("Allow pop-ups for this site to export your report."); return; }
    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(caseTitle || "RxLearn Prescription Report")}</title><style>body{font:14px Arial,sans-serif;color:#2D3136;max-width:820px;margin:25px auto;line-height:1.5}h1,h2{color:#1E7B92}h1{border-bottom:3px solid #1E7B92;padding-bottom:12px}section{border-bottom:1px solid #ddd;padding:10px 0;break-inside:avoid}img{max-width:100%;max-height:400px;object-fit:contain}li{margin:5px 0}.warning{padding:12px;background:#fef3c7;border:1px solid #fcd34d}@media print{body{margin:0;padding:12px}section{break-inside:avoid}}</style></head><body><h1>RxLearn Prescription Learning Report</h1><p><b>Case:</b> ${escapeHtml(caseTitle || "Prescription Practice")}</p><p><b>Exported:</b> ${escapeHtml(new Date().toLocaleString())}</p><div class="warning">${escapeHtml(DISCLAIMER)}</div>${image ? `<section><h2>Prescription Image</h2><img src="${image}" alt="Prescription image"></section>` : ""}<section><h2>Extracted Medications</h2>${medsHtml || "<p>No medications extracted.</p>"}</section><section><h2>Prescription Review Observations</h2>${list(analysis)}</section>${reportHtml}<p><b>Educational use only.</b> Verify all details against the original prescription and trusted references.</p></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    // Let the new tab finish rendering its image before opening Print.
    printWindow.onload = () => printWindow.print();
    setNotice("In the print dialog, choose ‘Save as PDF’ as the destination.");
  };

  // ============================================================
  // 11. OPEN DICTIONARY AND AI PRECEPTOR VIA PAGE CALLBACKS
  // ============================================================
  const exploreDrug = (m: Medication) => {
    const name = validDrugName(m.generic_name) || validDrugName(m.brand_name);
    if (!name) { setError("This medication has no confirmed name to search."); return; }
    if (onExploreDrug) onExploreDrug(name);
    else { navigator.clipboard?.writeText(name).catch(() => {}); setNotice(`“${name}” copied if clipboard access is available. Dictionary navigation will be connected in page.tsx.`); }
  };
  const askPreceptor = () => {
    const names = medications.map(displayName).join(", ") || "the prescription";
    const question = `For pharmacy education only, explain the pharmacology, counseling considerations, and details students should verify for the medicines extracted in this practice prescription: ${names}. Do not assume the OCR is accurate or give patient-specific treatment advice.`;
    if (onAskPreceptor) onAskPreceptor(question);
    else { navigator.clipboard?.writeText(question).catch(() => {}); setNotice("Educational question copied if clipboard access is available. AI navigation will be connected in page.tsx."); }
  };

  // ============================================================
  // 12. RENDER OCR LAB WORKSPACE
  // ============================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#EBF0F3] font-sans text-[#2D3136]">
      {/* 12A. TOP BAR: UPLOAD, ANALYZE, HISTORY AND RESET */}
      <div className="flex flex-wrap justify-between items-center gap-4 px-5 md:px-10 py-5 bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div><h1 className="text-xl font-black text-[#1E7B92] tracking-tight">RxLEARN LAB</h1><p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mt-0.5">Neural Prescription Analysis · Educational Workspace</p></div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button onClick={() => fileRef.current?.click()} className="bg-white border border-slate-300 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm">📂 Upload Rx</button>
          <button onClick={analyze} disabled={!image || loading} className="bg-[#00A3E0] text-white px-6 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-[#008CBA] disabled:bg-slate-300">{loading ? "Analyzing..." : "✨ Analyze"}</button>
          <button onClick={() => setHistoryOpen(x => !x)} className="bg-white border border-[#1E7B92]/30 text-[#1E7B92] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#EBF0F3]">🕘 My History</button>
          <button onClick={clearAll} className="bg-white border border-slate-300 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-rose-50 hover:text-rose-600">🗑️ Clear All</button>
        </div>
        <input ref={fileRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={e => handleFileChange(e.target.files?.[0])} />
      </div>

      {/* 12B. HISTORY PANEL: SEARCH, OPEN, RENAME AND DELETE */}
      {historyOpen && <section className="mx-5 md:mx-10 mt-5 bg-white border border-[#1E7B92]/20 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4"><div><h2 className="font-black text-[#1E7B92]">🕘 My Prescription Practice History</h2><p className="text-xs text-slate-500 mt-1">Saved cases are private to your signed-in account.</p></div><button onClick={() => setHistoryOpen(false)} className="text-sm font-bold text-slate-500">Close ✕</button></div>
        <input value={historySearch} onChange={e => setHistorySearch(e.target.value)} placeholder="Search saved case titles..." className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm mb-4 outline-none focus:border-[#1E7B92]" />
        {historyBusy ? <p className="text-sm text-slate-500">Loading history...</p> : history.length === 0 ? <p className="text-sm text-slate-500">No saved cases found.</p> : <div className="space-y-2 max-h-72 overflow-y-auto">{history.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 rounded-xl p-3"><div><p className="font-bold text-sm">{item.title}</p><p className="text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</p></div><div className="flex gap-2"><button onClick={() => void openSavedCase(item.id)} className="text-xs font-bold px-3 py-2 rounded-lg bg-[#1E7B92] text-white">Open</button><button onClick={() => void renameCase(item)} className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-300">Rename</button><button onClick={() => void deleteCase(item)} className="text-xs font-bold px-3 py-2 rounded-lg border border-rose-200 text-rose-600">Delete</button></div></div>)}</div>}
      </section>}

      {/* 12C. MAIN TWO-COLUMN LAYOUT */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* LEFT: ORIGINAL PRESCRIPTION IMAGE AND ANALYSIS LOADER */}
        <div className="lg:w-[46%] flex flex-col items-center justify-center p-5 md:p-9 relative bg-slate-900/5 min-h-[340px] lg:min-h-[640px]">
          <div className="absolute top-5 left-5 text-[10px] font-black tracking-widest uppercase text-[#1E7B92] bg-white/90 px-3 py-2 rounded-lg shadow-sm">📄 Prescription Preview</div>
          {!image ? <div className="text-center text-slate-400 border-2 border-dashed border-slate-300 rounded-2xl px-8 py-16 bg-white/50"><div className="text-5xl mb-4">📄</div><p className="font-bold text-xs uppercase tracking-wider">Upload a medical script to begin analysis</p><p className="text-xs mt-2 normal-case">Use a fictional or de-identified prescription</p></div> : <div className="relative group mt-10"><img src={image} alt="Uploaded prescription preview" className="max-h-[68vh] max-w-full object-contain rounded-xl shadow-xl border-4 border-white" /><button onClick={() => { if (hasAnalyzed && savedId === null && !window.confirm("This prescription has not been saved. Clear it anyway?")) return; clearAll(); }} aria-label="Remove prescription" className="absolute -top-3 -right-3 bg-rose-500 text-white w-8 h-8 rounded-full shadow-md">✕</button></div>}
          {loading && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20"><div className="text-center bg-white border border-slate-200 shadow-lg rounded-2xl p-8 max-w-xs"><div className="text-4xl mb-3 animate-pulse">🧠</div><p className="text-[#1E7B92] font-black text-xs tracking-wider uppercase">Analyzing prescription...</p><p className="text-slate-500 text-xs mt-3 leading-relaxed">Extracting medications and preparing your educational report. This can take a little while.</p><div className="mt-5 h-1.5 bg-[#EBF0F3] rounded-full overflow-hidden"><div className="w-1/2 h-full bg-[#00A3E0] animate-pulse rounded-full" /></div><button onClick={() => requestRef.current?.abort()} className="text-xs font-bold text-slate-500 hover:text-rose-600 mt-4">Cancel analysis</button></div></div>}
        </div>

        {/* RIGHT: EXTRACTION RESULTS, ACTIONS, CHECKLIST, QUIZ, REPORT */}
        <div className="lg:w-[54%] bg-white p-5 md:p-8 lg:max-h-[calc(100vh-155px)] lg:overflow-y-auto border-l border-slate-200">
          <div className="flex items-center justify-between gap-3 mb-5"><div><h2 className="text-sm font-black uppercase tracking-widest">Clinical Extractions</h2><p className="text-xs text-slate-400 mt-1">AI-assisted prescription interpretation</p></div>{hasResults && <span className="text-[10px] font-black text-[#1E7B92] bg-[#EBF0F3] px-3 py-1.5 rounded-full">{medications.length} medication{medications.length === 1 ? "" : "s"}</span>}</div>
          {error && <div role="alert" className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">⚠️ {error}</div>}
          {notice && <div role="status" className="mb-5 p-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-sm">ℹ️ {notice}</div>}
          {!hasResults && !hasAnalyzed && !loading && !error && <div className="text-center py-16 text-slate-400"><div className="text-4xl mb-4">🧪</div><p className="text-xs font-bold uppercase tracking-wider">Waiting for data processing...</p></div>}

          {/* 12D. ACTION TOOLBAR AFTER SUCCESSFUL ANALYSIS */}
          {hasAnalyzed && <section className="mb-6 p-4 rounded-2xl border border-[#1E7B92]/20 bg-[#EBF0F3]/50">
            <h3 className="text-sm font-black text-[#1E7B92] mb-3">🧰 Prescription Learning Tools</h3>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Practice case title</label>
            <input value={caseTitle} onChange={e => setCaseTitle(e.target.value)} disabled={savedId !== null} maxLength={160} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3 disabled:bg-slate-100" />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => void saveReport()} disabled={saving || savedId !== null} className="bg-[#1E7B92] text-white rounded-xl px-3 py-2.5 text-xs font-bold disabled:bg-slate-400">{savedId !== null ? "✓ Saved to History" : saving ? "Saving..." : "💾 Save Report"}</button>
              <button onClick={downloadPdf} className="bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold">📄 Download PDF</button>
              <button onClick={() => setChecklistOpen(x => !x)} className="bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold">☑️ Review Checklist</button>
              <button onClick={() => { setQuizOpen(x => !x); setQuizAnswers({}); setQuizSubmitted(false); }} className="bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold">🧠 Prescription Quiz</button>
              <button onClick={askPreceptor} className="col-span-2 bg-[#00A3E0] text-white rounded-xl px-3 py-2.5 text-xs font-bold">💬 Ask AI Preceptor</button>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">PDF export opens the browser print dialog; select “Save as PDF”. Save History requires a valid login token.</p>
          </section>}

          {/* 12E. INTERACTIVE REVIEW CHECKLIST (MANUAL, NOT CLINICAL APPROVAL) */}
          {hasAnalyzed && checklistOpen && <section className="mb-6 border border-amber-200 bg-amber-50 rounded-2xl p-4"><h3 className="text-sm font-black text-amber-950">☑️ Student Prescription Review Checklist</h3><p className="text-xs text-amber-900 mt-1 mb-3">Tick only what you have manually checked. Completing this checklist does not establish prescription safety.</p><p className="text-xs font-bold mb-3">{checked.length} / {checklistItems.length} reviewed</p><div className="space-y-2">{checklistItems.map((item, i) => <label key={i} className="flex gap-3 items-start bg-white/80 rounded-lg p-3 text-xs"><input type="checkbox" checked={checked.includes(i)} onChange={e => setChecked(prev => e.target.checked ? [...prev, i] : prev.filter(x => x !== i))} className="mt-0.5 accent-[#1E7B92]" /><span>{item}</span></label>)}</div><button onClick={() => setChecked([])} className="mt-3 text-xs font-bold text-amber-900 underline">Reset checklist</button></section>}

          {/* 12F. PRESCRIPTION-BASED READING QUIZ */}
          {hasAnalyzed && quizOpen && <section className="mb-6 border border-indigo-200 bg-indigo-50/60 rounded-2xl p-4"><h3 className="text-sm font-black text-indigo-950">🧠 Prescription-Based Quiz</h3><p className="text-xs text-indigo-800 mt-1 mb-4">Questions test the OCR extraction, not clinical correctness.</p>{questions.length === 0 ? <p className="text-xs text-slate-600">Not enough extracted medication details to generate a useful quiz for this case.</p> : <><div className="space-y-5">{questions.map((q, i) => <div key={i} className="bg-white rounded-xl p-4 border border-indigo-100"><p className="text-sm font-bold mb-3">{i + 1}. {q.question}</p><div className="space-y-2">{q.choices.map((choice, j) => <label key={j} className={`flex items-start gap-2 text-xs p-2 rounded-lg border ${quizSubmitted && j === q.answer ? "border-emerald-600 bg-emerald-100 text-emerald-900 font-bold ring-1 ring-emerald-200" : quizSubmitted && quizAnswers[i] === j && j !== q.answer ? "border-rose-600 bg-rose-100 text-rose-900 font-bold ring-1 ring-rose-200" : "border-slate-200"}`}><input type="radio" name={`rx-quiz-${i}`} disabled={quizSubmitted} checked={quizAnswers[i] === j} onChange={() => setQuizAnswers(prev => ({ ...prev, [i]: j }))} className="accent-[#1E7B92]" />{choice}{quizSubmitted && j === q.answer && <span className="ml-auto text-emerald-700 font-black">✓ Correct</span>}{quizSubmitted && quizAnswers[i] === j && j !== q.answer && <span className="ml-auto text-rose-700 font-black">✕ Wrong</span>}</label>)}</div>{quizSubmitted && <p className="text-xs text-slate-600 mt-3">{quizAnswers[i] === q.answer ? "✓ Correct. " : "✗ Incorrect. Review this entry. "}{q.explanation}</p>}</div>)}</div>{quizSubmitted ? <div className="mt-4"><p className="font-black text-[#1E7B92]">Score: {questions.filter((q, i) => quizAnswers[i] === q.answer).length} / {questions.length}</p><button onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }} className="mt-3 text-xs font-bold underline">Try again</button></div> : <button onClick={() => setQuizSubmitted(true)} disabled={Object.keys(quizAnswers).length !== questions.length} className="mt-4 bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:bg-slate-400">Submit Answers</button>}</>}</section>}

          {/* 12G. MEDICATION CARDS WITH DICTIONARY ACTION */}
          {medications.map((m, i) => <div key={i} className="mb-5 p-5 rounded-2xl border border-[#1E7B92]/20 bg-[#EBF0F3]/30 shadow-sm"><div className="flex justify-between items-start gap-2 mb-4"><div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Medication {i + 1}</p><h3 className="font-black text-[#2D3136] text-lg uppercase mt-1">{displayName(m)}</h3><p className="text-xs font-bold text-[#1E7B92] uppercase mt-1">{validDrugName(m.brand_name) ? (validDrugName(m.generic_name) || "Generic not confirmed") : validDrugName(m.generic_name) ? "Generic name · Brand not specified" : "Drug name requires verification"}</p></div><span className="text-[10px] bg-white border border-[#1E7B92]/20 text-[#1E7B92] px-2.5 py-1 rounded-lg font-bold whitespace-nowrap">{typeof m.confidence === "number" ? `${m.confidence}% AI estimate` : "AI interpreted"}</span></div><div className="grid grid-cols-2 gap-3 mb-3"><div className="bg-white p-3 rounded-xl border border-slate-200"><p className="text-[10px] font-bold text-slate-400 uppercase">Strength</p><p className="text-sm font-bold mt-1">{m.strength || "Not identified"}</p></div><div className="bg-white p-3 rounded-xl border border-slate-200"><p className="text-[10px] font-bold text-slate-400 uppercase">Frequency</p><p className="text-sm font-bold mt-1">{m.frequency || "Not identified"}</p></div></div>{m.description && <div className="bg-white border border-slate-200 p-3 rounded-xl text-xs text-slate-600 leading-relaxed"><span className="font-black text-[#1E7B92] uppercase text-[10px] block mb-1">Clinical Insight</span>{m.description}</div>}<div className="mt-3 pt-3 border-t border-slate-200"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">OCR raw interpretation</p><p className="text-xs font-mono italic text-slate-500 break-words">{m.raw_text || "Not available"}</p></div>{(validDrugName(m.generic_name) || validDrugName(m.brand_name)) && <button onClick={() => exploreDrug(m)} className="mt-3 text-xs font-bold text-[#1E7B92] bg-white border border-[#1E7B92]/20 px-3 py-2 rounded-lg hover:bg-teal-50">📚 Explore Drug in Dictionary</button>}</div>)}

          {/* 12H. SAFETY NOTICE AND PRESCRIPTION OBSERVATIONS */}
          {hasAnalyzed && <div className="my-5 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900 leading-relaxed">ℹ️ <strong>Educational simulation:</strong> AI-generated identifications and confidence values are not clinically verified. Always check the original prescription and trusted references.</div>}
          {analysis.length > 0 && <section className="mt-7 pt-6 border-t border-slate-200"><h3 className="text-sm font-black mb-3">🛡️ Prescription Review Observations</h3><div className="space-y-2">{analysis.map((a, i) => <div key={i} className="flex gap-3 bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-950 leading-relaxed"><span>🔍</span><p>{a}</p></div>)}</div></section>}

          {/* 12I. ALL SIX ORIGINAL EDUCATIONAL REPORT SECTIONS */}
          {hasReport && <section className="mt-8 pt-6 border-t border-slate-200"><div className="mb-5"><p className="text-[10px] font-black tracking-widest uppercase text-[#1E7B92]">RxLearn Learning Companion</p><h2 className="text-xl font-black mt-1">Prescription Learning Report</h2><p className="text-xs text-slate-500 mt-2">Explore the pharmacology and prescription-reading lessons from this case.</p></div><div className="space-y-4">{reportSections.map(section => { const items = report?.[section.key]; if (!Array.isArray(items) || items.length === 0) return null; return <div key={section.key} className={`rounded-2xl border p-4 ${section.tone}`}><div className="flex gap-3 items-start mb-3"><span className="text-xl">{section.icon}</span><div><h3 className="text-sm font-black">{section.title}</h3><p className="text-[11px] text-slate-500 mt-1">{section.description}</p></div></div><ul className="space-y-2">{items.map((item, i) => <li key={i} className="flex gap-2 items-start text-xs text-slate-700 leading-relaxed bg-white/75 rounded-lg p-3"><span className="text-[#1E7B92] font-bold">•</span><span>{item}</span></li>)}</ul></div>; })}</div></section>}
          <p className="text-[11px] text-slate-400 mt-7 leading-relaxed">{DISCLAIMER}</p>
        </div>
      </div>
      {/* 12J. ORIGINAL FOOTER */}
      <div className="bg-[#1E7B92] text-white text-[10px] py-3 px-5 md:px-10 flex flex-wrap gap-2 justify-between font-bold uppercase tracking-widest"><span>💊 RxLearn Lab • Institutional Simulation v2.0</span><span>Western Province • Sri Lanka</span></div>
    </div>
  );
}
