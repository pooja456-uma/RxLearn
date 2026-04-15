"use client";

export default function RxForum() {
  const posts = [
    {
      id: "4552",
      tag: "OCR LAB",
      author: "Student #1024",
      content: "Does anyone have tips for scanning prescriptions with very low lighting in the OCR lab?",
      replies: 12
    },
    {
      id: "4558",
      tag: "PHARMACOLOGY",
      author: "Student #2088",
      content: "Can someone explain the primary contraindications for Metformin in patients with renal impairment?",
      replies: 5
    }
  ];

  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      
      {/* --- FORUM HEADER --- */}
      <div className="bg-[#0f172a] p-12 rounded-[50px] text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-4xl font-black italic tracking-tighter uppercase">Rx<span className="text-blue-500">Forum</span></h3>
          <p className="text-blue-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">
            The Digital Pharmacy Discussion Hub
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 opacity-10 blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- MAIN FEED --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* New Post Input Box */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xs shadow-inner">P</div>
              <input 
                type="text" 
                placeholder="Start a new discussion..." 
                className="flex-1 bg-slate-50 border-none outline-none p-4 rounded-2xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#0f172a] transition-all">
                Post
              </button>
            </div>
          </div>

          {/* Discussion Cards */}
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:border-blue-200 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                  {post.tag} • ID #{post.id}
                </span>
                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{post.author}</span>
              </div>
              
              <p className="text-slate-800 font-bold text-sm leading-relaxed mb-6 italic group-hover:text-[#0f172a] transition-colors">
                "{post.content}"
              </p>
              
              <div className="h-[1px] w-full bg-slate-50 mb-6"></div>
              
              <div className="flex justify-between items-center">
                <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 flex items-center gap-2">
                  <span>💬</span> {post.replies} Replies
                </button>
                <button className="text-[9px] font-black text-white bg-[#0f172a] px-5 py-2 rounded-xl uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200">
                  Join Discussion
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* --- SIDEBAR: TRENDING --- */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[50px] border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Trending Topics</h4>
            <div className="space-y-4">
              {["#DosageMath", "#OCR_Troubles", "#EthicsAssignment"].map((topic, i) => (
                <div key={i} className="flex justify-between items-center group cursor-pointer">
                  <span className="text-xs font-black text-[#0f172a] group-hover:text-blue-600 transition-colors">{topic}</span>
                  <span className="text-[9px] font-bold text-slate-300">2.4k posts</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-8 rounded-[50px] border border-blue-100">
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-3">Forum Guidelines</p>
            <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
              Maintain professional ethics. Do not share confidential patient data or specific exam answers.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}