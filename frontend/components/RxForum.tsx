"use client";

import { useState } from "react";

export default function RxForum() {
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);

  const [posts, setPosts] = useState([
    {
      id: "4552",
      tag: "OCR LAB",
      author: "Student #1024",
      content:
        "Does anyone have tips for scanning prescriptions in low lighting conditions?",
      replies: [
        { id: "c1", author: "Student #2011", text: "Try increasing contrast + use flash 📸" },
        { id: "c2", author: "Student #3302", text: "Also stabilize phone with both hands 👍" },
      ],
      likes: 4,
      liked: false,
    },
    {
      id: "4558",
      tag: "PHARMACOLOGY",
      author: "Student #2088",
      content:
        "Can someone explain Metformin contraindications in renal impairment?",
      replies: [
        { id: "c3", author: "Student #1450", text: "Avoid if eGFR < 30 🚫" },
      ],
      likes: 9,
      liked: false,
    },
  ]);

  // --- STATE DESIGN: STATEFUL LOOKUP OBJECT ---
  // Tracks separate text inputs for each post's comment box dynamically.
  // Using a Record object key-value map {[postId]: text} isolates state mutations 
  // so typing in one post's comment box does not cause text to mirror across others.
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  // --- LOCAL STATE SIMULATION (POST LAYERING) ---
  // Implements an optimistic, simulated asynchronous latency via setTimeout.
  // Layers new posts seamlessly into the primary state array without mutating existing records.
  const handlePost = () => {
    if (!newPost.trim()) return;

    setLoading(true);

    setTimeout(() => {
      const createdPost = {
        id: Math.random().toString(),
        tag: "GENERAL",
        author: "You",
        content: newPost,
        replies: [],
        likes: 0,
        liked: false,
      };

      setPosts([createdPost, ...posts]); // Prepends new object to start of list
      setNewPost("");
      setLoading(false);
    }, 500);
  };

  // --- IMMUTABLE MAPPING LOGIC (LIKE TOGGLER) ---
  // Uses functional state mapping to safely toggle flags deeply nested in arrays.
  // Prevents direct state mutation by using the spread operator (...p) to create 
  // an entire structural clone of the targeted object before updating values.
  const toggleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              likes: p.liked ? p.likes - 1 : p.likes + 1,
              liked: !p.liked,
            }
          : p
      )
    );
  };

  // --- DEEP NESTED DATA INJECTION (REPLY ENGINE) ---
  // Modifies an inner child array (replies) housed within a parent object array.
  // Clones the existing structure and drops the freshly typed comment array element 
  // directly into the precise sub-thread where it belongs.
  const addComment = (postId: string) => {
    const text = commentText[postId];
    if (!text?.trim()) return;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              replies: [
                ...p.replies,
                {
                  id: Math.random().toString(),
                  author: "You",
                  text,
                },
              ],
            }
          : p
      )
    );

    // Flushes input buffer cleanly for the explicit post's key entry field
    setCommentText((prev) => ({ ...prev, [postId]: "" }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 bg-[#EBF0F3] min-h-screen text-[#2D3136] selection:bg-[#1E7B92]/20 selection:text-[#1E7B92]">

      {/* HEADER */}
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-[#1E7B92] uppercase">
          RxLEARN FORUM
        </h1>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
          learn together, grow together
        </p>
      </div>

      {/* POST BOX */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-300/60 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-200" />
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Ask or share something..."
          className="w-full p-4 rounded-lg bg-slate-50 border border-slate-200 text-[#2D3136] placeholder-slate-400 outline-none focus:border-[#1E7B92] focus:bg-white text-xs font-semibold min-h-[120px] transition-all shadow-inner resize-none"
        />

        <div className="flex justify-end">
          <button
            onClick={handlePost}
            className="px-5 py-2.5 rounded-lg bg-[#00A3E0] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#008CBA] transition-all active:scale-[0.98] shadow-sm"
          >
            {loading ? "posting..." : "post asset"}
          </button>
        </div>
      </div>

      {/* POSTS LISTING */}
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-white p-6 rounded-xl border border-slate-300/60 shadow-sm space-y-4 transition-all duration-200 hover:shadow-md"
        >

          {/* POST HEADER META */}
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
            <span className="bg-[#EBF0F3] border border-slate-200 text-[#1E7B92] px-3 py-1 rounded-md">
              {post.tag}
            </span>
            <span className="text-slate-400">{post.author}</span>
          </div>

          <p className="text-sm font-medium text-slate-700">“{post.content}”</p>

          {/* ACTIONS INTERACTION BAR */}
          <div className="flex justify-between text-xs border-t border-slate-100 pt-3">
            <button
              onClick={() => toggleLike(post.id)}
              className={`font-bold transition-all active:scale-[0.95] ${post.liked ? "text-rose-600" : "text-rose-400 hover:text-rose-600"}`}
            >
              ❤️ {post.likes}
            </button>

            <button
              onClick={() =>
                setOpenComments(openComments === post.id ? null : post.id)
              }
              className="text-slate-400 hover:text-[#1E7B92] font-bold uppercase text-[10px] tracking-wider transition-colors"
            >
              💬 {post.replies.length} comments
            </button>
          </div>

          {/* CONDITIONAL COMMENTS COLLAPSE THREAD */}
          {openComments === post.id && (
            <div className="space-y-3 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">

              {/* RENDER CURRENT COMMENT NEST */}
              {post.replies.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs text-slate-600 font-medium"
                >
                  <span className="font-bold text-[#1E7B92] uppercase tracking-wide mr-1.5">
                    {c.author}:
                  </span>{" "}
                  {c.text}
                </div>
              ))}

              {/* REPLY FIELD ACTIONS */}
              <div className="flex gap-2 pt-1">
                <input
                  value={commentText[post.id] || ""}
                  onChange={(e) =>
                    setCommentText({
                      ...commentText,
                      [post.id]: e.target.value,
                    })
                  }
                  placeholder="Write a comment..."
                  className="flex-1 p-2.5 px-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-[#2D3136] outline-none focus:border-[#1E7B92] focus:bg-white shadow-inner transition-all"
                />
                <button
                  onClick={() => addComment(post.id)}
                  className="bg-[#1E7B92] text-white px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-[#15586e] active:scale-[0.97] transition-all"
                >
                  send
                </button>
              </div>

            </div>
          )}
        </div>
      ))}
    </div>
  );
}