"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DrugRecord {
  id?: number; 
  brand_name: string; 
  generic_name: string; 
  therapeutic_group: string;
  drug_class: string;
  indications: string; 
  mechanism_of_action: string; 
  contraindications: string;
  side_effects: string; 
  max_daily_dose: string; 
  counseling_points: string;
  interaction_risk: string; 
  storage_conditions: string;
}

interface UserRecord {
  registration_number: string; 
  full_name: string; 
  username: string; 
  email: string; 
  password?: string;
  gender: string; 
  age: number;
  contact_number: string;
  nic_number: string;
  role?: string;
}

interface TicketRecord {
  ticket_id: number; 
  registration_number: string; 
  student_name: string; 
  student_email: string; 
  issue_description: string; 
  status: string; 
  created_at: string;
}

export default function AdminPortalPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "drugs" | "users" | "tickets">("overview");
  const [drugs, setDrugs] = useState<DrugRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [drugSearch, setDrugSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  
  const [isEditingDrug, setIsEditingDrug] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [currentDrug, setCurrentDrug] = useState<DrugRecord>({
    brand_name: "", generic_name: "", therapeutic_group: "", drug_class: "", indications: "",
    mechanism_of_action: "", contraindications: "", side_effects: "",
    max_daily_dose: "", counseling_points: "", interaction_risk: "", storage_conditions: ""
  });

  const [currentUser, setCurrentUser] = useState<UserRecord>({
    registration_number: "", full_name: "", username: "", email: "", password: "",
    gender: "Female", age: 21, contact_number: "", nic_number: ""
  });

  const router = useRouter();

  const triggerNotification = (text: string, type: "success" | "error") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const fetchAllData = async () => {
    try {
      const drugRes = await fetch("http://127.0.0.1:8000/api/drugs/search?query=");
      if (drugRes.ok) setDrugs(await drugRes.json());

      const ticketRes = await fetch("http://127.0.0.1:8000/api/admin/tickets");
      if (ticketRes.ok) setTickets(await ticketRes.json());

      const userRes = await fetch("http://127.0.0.1:8000/api/admin/users");
      if (userRes.ok) setUsers(await userRes.json());
    } catch (err) {
      console.error("Failed to hydrate admin console tables", err);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "admin") {
      router.push("/");
    } else {
      fetchAllData();
    }
  }, []);

  // --- DRUG HANDLERS ---
  const handleDrugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldsToValidate = Object.entries(currentDrug).filter(([key]) => key !== 'id');
    if (fieldsToValidate.some(([_, value]) => !value || value.toString().trim() === "")) {
      triggerNotification("⚠️ Validation Failed: All formulation fields must be completely filled out!", "error");
      return; 
    }

    const url = isEditingDrug ? `http://127.0.0.1:8000/api/drugs/${currentDrug.id}` : "http://127.0.0.1:8000/api/drugs";
    const method = isEditingDrug ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(currentDrug) });
    if (res.ok) {
      fetchAllData();
      triggerNotification(isEditingDrug ? "🔄 Formulation updated successfully!" : "➕ New drug added successfully!", "success");
      resetDrugForm();
    }
  };

  const handleDeleteDrug = async (id?: number) => {
    if (!id || !confirm("Are you sure you want to delete this drug formulation?")) return;
    const res = await fetch(`http://127.0.0.1:8000/api/drugs/${id}`, { method: "DELETE" });
    if (res.ok) { fetchAllData(); triggerNotification("🗑️ Formulation deleted from system records.", "error"); }
  };

  const resetDrugForm = () => {
    setIsEditingDrug(false);
    setCurrentDrug({
      brand_name: "", generic_name: "", therapeutic_group: "", drug_class: "", indications: "",
      mechanism_of_action: "", contraindications: "", side_effects: "",
      max_daily_dose: "", counseling_points: "", interaction_risk: "", storage_conditions: ""
    });
  };

  // --- USER HANDLERS ---
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldsToValidate = Object.entries(currentUser).filter(([key]) => key !== 'registration_number' && key !== 'role');
    if (fieldsToValidate.some(([_, value]) => !value || value.toString().trim() === "")) {
      triggerNotification("⚠️ Validation Failed: All identity profile fields are required!", "error");
      return;
    }

    const url = isEditingUser ? `http://127.0.0.1:8000/api/admin/users/${currentUser.registration_number}` : "http://127.0.0.1:8000/api/admin/users";
    const method = isEditingUser ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(currentUser) });
    if (res.ok) {
      fetchAllData();
      triggerNotification(isEditingUser ? "🔄 Profile modified successfully!" : "👤 New profile appended successfully!", "success");
      resetUserForm();
    }
  };

  const handleDeleteUser = async (regNum: string) => {
    if (!regNum || !confirm(`Are you sure you want to permanently delete profile data for ${regNum}?`)) return;
    const res = await fetch(`http://127.0.0.1:8000/api/admin/users/${regNum}`, { method: "DELETE" });
    if (res.ok) { fetchAllData(); triggerNotification("🗑️ Institutional student profile dropped.", "error"); }
  };

  const resetUserForm = () => {
    setIsEditingUser(false);
    setCurrentUser({
      registration_number: "", full_name: "", username: "", email: "", password: "",
      gender: "Female", age: 21, contact_number: "", nic_number: ""
    });
  };

  const resolveTicket = async (id: number) => {
    const res = await fetch(`http://127.0.0.1:8000/api/admin/tickets/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Resolved" }) });
    if (res.ok) fetchAllData();
  };

  const handleSignOut = () => { localStorage.clear(); router.push("/"); };

  const filteredDrugs = drugs.filter(d => d.brand_name.toLowerCase().includes(drugSearch.toLowerCase()));
  const filteredUsers = users.filter(u => u.full_name.toLowerCase().includes(userSearch.toLowerCase()) || u.registration_number.toLowerCase().includes(userSearch.toLowerCase()));

  const maleCount = users.filter(u => u.gender?.toLowerCase() === "male").length;
  const femaleCount = users.filter(u => u.gender?.toLowerCase() === "female").length;

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#2D3136] flex flex-col font-sans relative">
      
      {/* FLOATING NOTIFICATION BANNER */}
      {statusMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] animate-in slide-in-from-top-5 duration-300">
          <div className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wide border shadow-md flex items-center gap-2 ${
            statusMessage.type === "success" ? "bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/10" : "bg-rose-500 text-white border-rose-600 shadow-rose-500/10"
          }`}>
            <span>{statusMessage.type === "success" ? "✨" : "⚠️"}</span> {statusMessage.text}
          </div>
        </div>
      )}
      
      {/* GLOBAL HEADER BAR */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-[#1E7B92]">System Administrator Portal</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Unified Database Management System Environment</p>
        </div>
        <button onClick={handleSignOut} className="px-5 py-2 bg-white border border-slate-300 hover:border-rose-300 hover:text-rose-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200">Disconnect Terminal 🚪</button>
      </nav>

      <div className="flex flex-grow">
        
        {/* SIDEBAR NAVIGATION LIST */}
        <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between sticky top-[73px] h-[calc(100vh-73px)]">
          <div className="space-y-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-4">Core Repositories</p>
            <button onClick={() => setActiveTab("overview")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === "overview" ? "bg-[#1E7B92]/10 text-[#1E7B92]" : "text-slate-500 hover:bg-slate-50"}`}><span>📊</span> System Overview</button>
            <button onClick={() => setActiveTab("drugs")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === "drugs" ? "bg-[#1E7B92]/10 text-[#1E7B92]" : "text-slate-500 hover:bg-slate-50"}`}><span>💊</span> Drugs Table ({drugs.length})</button>
            <button onClick={() => setActiveTab("users")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === "users" ? "bg-[#1E7B92]/10 text-[#1E7B92]" : "text-slate-500 hover:bg-slate-50"}`}><span>👥</span> Users Table ({users.length})</button>
            <button onClick={() => setActiveTab("tickets")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === "tickets" ? "bg-[#1E7B92]/10 text-[#1E7B92]" : "text-slate-500 hover:bg-slate-50"}`}><span>🎫</span> Ticket Desk ({tickets.filter(t=>t.status==="Pending").length} New)</button>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center"><p className="text-[10px] font-black text-[#1E7B92] uppercase tracking-wider">Node Status: Online</p></div>
        </aside>

        {/* MAIN DISPLAY WORKSPACE */}
        <main className="flex-grow p-8 max-w-5xl mx-auto w-full">
          
          {/* TAB 1: SYSTEM OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* CORE COUNTER CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm flex justify-between items-center hover:border-[#1E7B92]/40 transition-all">
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Formulary Drugs</p><p className="text-3xl font-black mt-1 text-slate-800">{drugs.length}</p></div>
                  <span className="text-2xl bg-[#1E7B92]/5 text-[#1E7B92] p-3 rounded-xl">📦</span>
                </div>
                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm flex justify-between items-center hover:border-[#1E7B92]/40 transition-all">
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Registered Users</p><p className="text-3xl font-black mt-1 text-slate-800">{users.length}</p></div>
                  <span className="text-2xl bg-indigo-50 text-indigo-600 p-3 rounded-xl">👥</span>
                </div>
                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm flex justify-between items-center hover:border-amber-300 transition-all">
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pending Issues</p><p className="text-3xl font-black text-amber-500 mt-1">{tickets.filter(t=>t.status!=="Resolved").length}</p></div>
                  <span className="text-2xl bg-amber-50 text-amber-600 p-3 rounded-xl">🎫</span>
                </div>
              </div>

              {/* RICH METRICS INTERFACE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* USER DEMOGRAPHICS PROFILE BLOCK */}
                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm lg:col-span-4 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b pb-2">User Demographics</h3>
                  <div className="pt-2 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1"><span>Female Enrolments</span><span className="font-black text-[#1E7B92]">{femaleCount} Profiles</span></div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-[#1E7B92] h-full rounded-full" style={{ width: `${users.length ? (femaleCount/users.length)*100 : 0}%` }}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1"><span>Male Enrolments</span><span className="font-black text-indigo-600">{maleCount} Profiles</span></div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-indigo-500 h-full rounded-full" style={{ width: `${users.length ? (maleCount/users.length)*100 : 0}%` }}></div></div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border text-[11px] font-medium text-slate-500 leading-relaxed italic">
                    "Live user matrix calculations pull straight from registered institutional profiles ledger grids."
                  </div>
                </div>

                {/* FAST TERMINAL SHORTCUT LINKS */}
                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm lg:col-span-8 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b pb-2">Quick Administrative Shortcuts</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <button onClick={() => setActiveTab("drugs")} className="p-4 border bg-slate-50/50 hover:bg-slate-50 rounded-xl text-left transition-all hover:border-[#1E7B92]/40">
                      <p className="text-xs font-black uppercase text-slate-700">💊 Open Drug Formulary</p>
                      <p className="text-[11px] text-slate-400 mt-1">Manage, add, update and purge formulation entities.</p>
                    </button>
                    <button onClick={() => setActiveTab("users")} className="p-4 border bg-slate-50/50 hover:bg-slate-50 rounded-xl text-left transition-all hover:border-indigo-300">
                      <p className="text-xs font-black uppercase text-slate-700">👥 Open Profile Registry</p>
                      <p className="text-[11px] text-slate-400 mt-1">Monitor credentials, add or drop student profiles.</p>
                    </button>
                    <button onClick={() => setActiveTab("tickets")} className="p-4 border bg-slate-50/50 hover:bg-slate-50 rounded-xl text-left transition-all hover:border-amber-300">
                      <p className="text-xs font-black uppercase text-slate-700">🎫 Open Support Tickets</p>
                      <p className="text-[11px] text-slate-400 mt-1">Review, audit and mark active student issues as settled.</p>
                    </button>
                    <div className="p-4 border bg-emerald-50/20 border-emerald-100 rounded-xl text-left flex flex-col justify-center">
                      <p className="text-xs font-black uppercase text-emerald-800 flex items-center gap-1.5"><span>●</span> System Status: Online</p>
                      <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">MySQL Node active across local port environments.</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: DRUGS TABLE REPO */}
          {activeTab === "drugs" && (
            <div className="grid lg:grid-cols-12 gap-6 animate-in fade-in duration-200 items-start">
              <form onSubmit={handleDrugSubmit} className="bg-white p-6 border rounded-2xl lg:col-span-4 space-y-4 shadow-sm max-h-[calc(100vh-140px)] overflow-y-auto sticky top-[95px]">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-xs font-black uppercase text-slate-500">{isEditingDrug ? "🔄 Edit Formulation" : "➕ Append Formulation"}</h3>
                  {isEditingDrug && <button type="button" onClick={resetDrugForm} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black uppercase">Add New Mode</button>}
                </div>
                <div className="space-y-3">
                  {["brand_name", "generic_name", "therapeutic_group", "drug_class", "max_daily_dose", "storage_conditions"].map(f => (
                    <div key={f}>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{f.replace(/_/g, " ")}</label>
                      <input required placeholder={`e.g., ${f}`} value={(currentDrug as any)[f]} onChange={e=>setCurrentDrug({...currentDrug, [f]:e.target.value})} className="w-full p-2.5 text-xs font-bold rounded-lg border bg-slate-50" />
                    </div>
                  ))}
                  {["indications", "mechanism_of_action", "contraindications", "side_effects", "counseling_points", "interaction_risk"].map(f => (
                    <div key={f}>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{f.replace(/_/g, " ")}</label>
                      <textarea required placeholder="..." value={(currentDrug as any)[f]} onChange={e=>setCurrentDrug({...currentDrug, [f]:e.target.value})} rows={2} className="w-full p-2.5 text-xs font-medium rounded-lg border bg-slate-50" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" className="flex-grow py-2.5 bg-[#1E7B92] hover:bg-[#15586e] text-white font-black uppercase text-xs rounded-lg shadow-sm transition-colors">{isEditingDrug ? "Update Formulation" : "Save Formulation"}</button>
                  <button type="button" onClick={resetDrugForm} className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold uppercase text-xs rounded-lg border transition-colors">Clear</button>
                </div>
              </form>
              <div className="lg:col-span-8 bg-white border rounded-2xl overflow-hidden shadow-sm h-fit">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center"><span className="text-xs font-black uppercase text-slate-500">Drugs Directory</span><input placeholder="🔍 Quick Brand Search..." value={drugSearch} onChange={e=>setDrugSearch(e.target.value)} className="p-2 border rounded-lg text-xs font-bold outline-none bg-white w-48 shadow-inner"/></div>
                <div className="overflow-y-auto max-h-[calc(100vh-210px)]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-400 font-black uppercase sticky top-0 border-b z-10"><tr><th className="p-4">Brand</th><th className="p-4">Generic Component</th><th className="p-4 text-center">Actions</th></tr></thead>
                    <tbody className="divide-y font-medium text-slate-700">
                      {filteredDrugs.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50/60">
                          <td className="p-4 font-black text-slate-800">{d.brand_name}</td><td className="p-4 italic">{d.generic_name}</td>
                          <td className="p-4 text-center space-x-1.5 flex justify-center items-center"><button onClick={()=>{setIsEditingDrug(true); setCurrentDrug(d);}} className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded font-bold uppercase text-[9px] transition-all">Edit</button><button onClick={()=>handleDeleteDrug(d.id)} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded font-bold uppercase text-[9px] transition-all">Delete</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USER PROFILES DIRECTORY */}
          {activeTab === "users" && (
            <div className="grid lg:grid-cols-12 gap-6 animate-in fade-in duration-200 items-start">
              <form onSubmit={handleUserSubmit} className="bg-white p-6 border rounded-2xl lg:col-span-4 space-y-4 shadow-sm max-h-[calc(100vh-140px)] overflow-y-auto sticky top-[95px]">
                <div className="flex justify-between items-center border-b pb-2"><h3 className="text-xs font-black uppercase text-slate-500">{isEditingUser ? "🔄 Edit Profile" : "➕ Add Profile"}</h3>{isEditingUser && <button type="button" onClick={resetUserForm} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black uppercase">New Profile</button>}</div>
                <div className="space-y-3">
                  {isEditingUser && (<div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Registration ID</label><input disabled value={currentUser.registration_number} className="w-full p-2.5 text-xs font-bold rounded-lg border bg-slate-200 text-slate-500 font-mono" /></div>)}
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Full Identity Name</label><input required placeholder="e.g., Hiruka Demitha" value={currentUser.full_name} onChange={e=>setCurrentUser({...currentUser, full_name:e.target.value})} className="w-full p-2.5 text-xs font-bold rounded-lg border bg-slate-50" /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Username Handle</label><input required placeholder="e.g., HiruDe" value={currentUser.username} onChange={e=>setCurrentUser({...currentUser, username:e.target.value})} className="w-full p-2.5 text-xs font-bold rounded-lg border bg-slate-50" /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Email Account Address</label><input required type="email" placeholder="e.g., name@gmail.com" value={currentUser.email} onChange={e=>setCurrentUser({...currentUser, email:e.target.value})} className="w-full p-2.5 text-xs font-bold rounded-lg border bg-slate-50" /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Account Access Password</label><input required placeholder="Access Password" value={currentUser.password} onChange={e=>setCurrentUser({...currentUser, password:e.target.value})} className="w-full p-2.5 text-xs font-bold rounded-lg border bg-slate-50" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Gender Matrix</label><select value={currentUser.gender} onChange={e=>setCurrentUser({...currentUser, gender:e.target.value})} className="w-full p-2.5 text-xs font-bold rounded-lg border bg-slate-50"><option value="Male">Male</option><option value="Female">Female</option></select></div>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Age Matrix</label><input required type="number" value={currentUser.age} onChange={e=>setCurrentUser({...currentUser, age:parseInt(e.target.value)||0})} className="w-full p-2.5 text-xs font-bold rounded-lg border bg-slate-50" /></div>
                  </div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Contact Handset Number</label><input required placeholder="Contact Number" value={currentUser.contact_number} onChange={e=>setCurrentUser({...currentUser, contact_number:e.target.value})} className="w-full p-2.5 text-xs font-bold rounded-lg border bg-slate-50" /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">National ID Card (NIC)</label><input required placeholder="NIC Identification" value={currentUser.nic_number} onChange={e=>setCurrentUser({...currentUser, nic_number:e.target.value})} className="w-full p-2.5 text-xs font-bold rounded-lg border bg-slate-50" /></div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" className="flex-grow py-2.5 bg-[#1E7B92] text-white font-black uppercase text-xs rounded-lg shadow-sm transition-colors"> {isEditingUser ? "Update Profile" : "Save Profile"}</button>
                  <button type="button" onClick={resetUserForm} className="px-3 py-2.5 bg-slate-100 text-slate-500 font-bold uppercase text-xs rounded-lg border transition-colors">Clear</button>
                </div>
              </form>
              <div className="lg:col-span-8 bg-white border rounded-2xl overflow-hidden shadow-sm h-fit">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center"><span className="text-xs font-black uppercase text-slate-500">Profiles Ledger</span><input placeholder="🔍 Name or Reg Code Lookup..." value={userSearch} onChange={e=>setUserSearch(e.target.value)} className="p-2 border rounded-lg text-xs font-bold outline-none bg-white w-48 shadow-inner"/></div>
                <div className="overflow-y-auto max-h-[calc(100vh-210px)]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-400 font-black uppercase sticky top-0 border-b z-10"><tr><th className="p-4">Reg Code</th><th className="p-4">Full Identity Name</th><th className="p-4">Email / Contact</th><th className="p-4 text-center">Actions</th></tr></thead>
                    <tbody className="divide-y font-medium text-slate-700">
                      {filteredUsers.map(u => (
                        <tr key={u.registration_number} className="hover:bg-slate-50/60">
                          <td className="p-4 font-black text-[#1E7B92] font-mono">{u.registration_number}</td>
                          <td className="p-4 font-bold"><div>{u.full_name}</div><div className="text-[10px] text-slate-400 font-mono">@{u.username} • {u.age}Y / {u.gender}</div></td>
                          <td className="p-4 text-slate-500"><div>{u.email}</div><div className="text-[10px] text-slate-400 font-mono">{u.contact_number}</div></td>
                          <td className="p-4 text-center space-x-1.5 flex justify-center items-center"><button onClick={()=>{setIsEditingUser(true); setCurrentUser(u);}} className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded font-bold uppercase text-[9px] transition-all">Edit</button><button onClick={()=>handleDeleteUser(u.registration_number)} className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded font-bold uppercase text-[9px] transition-all">Delete</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SUPPORT DESK */}
          {activeTab === "tickets" && (
            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200 h-fit">
              <div className="p-4 border-b bg-slate-50"><h3 className="text-xs font-black uppercase text-slate-500">Incoming Student Support Tickets</h3></div>
              <div className="overflow-y-auto max-h-[540px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-400 font-black uppercase border-b sticky top-0 z-10"><tr><th className="p-4">Student & Contact</th><th className="p-4">Issue Description</th><th className="p-4">Status</th><th className="p-4 text-center">Operation</th></tr></thead>
                  <tbody className="divide-y font-medium text-slate-700">
                    {tickets.map(t => (
                      <tr key={t.ticket_id} className="hover:bg-slate-50/60">
                        <td className="p-4"><p className="font-bold text-slate-800">{t.student_name}</p><p className="text-[10px] text-slate-400 font-mono">{t.student_email}</p></td>
                        <td className="p-4 text-slate-600 max-w-xs break-words font-medium italic">"{t.issue_description}"</td>
                        <td className="p-4"><span className={`px-2 py-0.5 text-[9px] font-black rounded-full border uppercase ${t.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>{t.status}</span></td>
                        <td className="p-4 text-center">{t.status === "Pending" ? <button onClick={()=>resolveTicket(t.ticket_id)} className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-black uppercase text-[9px] shadow-sm hover:bg-emerald-700 active:scale-95 transition-all">Mark Resolved ✓</button> : <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Settled</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}