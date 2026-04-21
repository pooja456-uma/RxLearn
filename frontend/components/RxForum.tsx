"use client";

import { useState } from "react";

export default function RxForum() {
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);

  const [posts, setPosts] = useState([
    {
      id: "4552",
      tag: "OCR LAB",
      author: "Student #1024",
      content:
        "Does anyone have tips for scanning prescriptions in low lighting conditions?",
      replies: 12,
      likes: 4,
      liked: false,
    },
    {
      id: "4558",
      tag: "PHARMACOLOGY",
      author: "Student #2088",
      content:
        "Can someone explain Metformin contraindications in renal impairment?",
      replies: 5,
      likes: 9,
      liked: false,
    },
  ]);

  const handlePost = () => {
    if (!newPost.trim()) return;

    setLoading(true);

    setTimeout(() => {
      const createdPost = {
        id: Math.floor(Math.random() * 9000).toString(),
        tag: "GENERAL",
        author: "You",
        content: newPost,
        replies: 0,
        likes: 0,
        liked: false,
      };

      setPosts([createdPost, ...posts]);
      setNewPost("");
      setLoading(false);
    }, 500);
  };

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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 bg-pink-50 min-h-screen">

      {/* HEADER */}
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-black text-slate-800">
          💊 Rx<span className="text-pink-500">Forum</span>
        </h1>
        <p className="text-xs text-slate-400 uppercase tracking-[0.3em]">
          friendly pharmacy discussion space ✨
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          {/* POST BOX */}
          <div className="bg-white p-6 rounded-[30px] shadow-sm border border-pink-100 space-y-4">

            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share your question or idea... 💬"
              className="w-full p-5 rounded-2xl bg-pink-50 border-none outline-none focus:ring-2 focus:ring-pink-200 min-h-[120px] text-sm"
            />

            <div className="flex justify-end">
              <button
                onClick={handlePost}
                disabled={!newPost.trim() || loading}
                className="px-6 py-3 rounded-full bg-pink-500 text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-pink-600 disabled:opacity-40 transition-all"
              >
                {loading ? "posting..." : "post 💌"}
              </button>
            </div>

          </div>

          {/* POSTS */}
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white p-6 rounded-[30px] border border-pink-100 shadow-sm space-y-4 hover:shadow-md transition-all"
            >

              {/* TAG */}
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                <span className="bg-pink-100 text-pink-600 px-2 py-1 rounded-full">
                  {post.tag}
                </span>
                <span className="text-slate-300">
                  {post.author} ✨
                </span>
              </div>

              {/* CONTENT */}
              <p className="text-slate-700 font-medium italic">
                “{post.content}”
              </p>

              {/* ACTIONS */}
              <div className="flex justify-between items-center pt-3 border-t border-pink-50">

                <button
                  onClick={() => toggleLike(post.id)}
                  className={`text-[10px] font-black uppercase flex items-center gap-1 ${
                    post.liked
                      ? "text-rose-400"
                      : "text-slate-400 hover:text-rose-400"
                  }`}
                >
                  💖 {post.likes}
                </button>

                <span className="text-[10px] text-slate-400">
                  💬 {post.replies} replies
                </span>

                <button className="bg-slate-800 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase hover:bg-pink-500 transition-all">
                  join ✨
                </button>

              </div>
            </div>
          ))}
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">

          <div className="bg-white p-6 rounded-[30px] border border-pink-100">
            <h3 className="text-xs font-black uppercase text-slate-400 mb-4">
              trending 🌸
            </h3>

            <div className="space-y-3 text-sm">
              {["#OCR_Tips", "#DosageFun", "#PharmaLife"].map((t) => (
                <p
                  key={t}
                  className="font-bold text-slate-700 hover:text-pink-500 cursor-pointer transition-colors"
                >
                  {t}
                </p>
              ))}
            </div>
          </div>

          <div className="bg-pink-100 p-6 rounded-[30px] text-xs text-slate-600">
            <p className="font-black text-pink-600 mb-2">
              community rules 💖
            </p>
            Be kind, respect others, and never share patient data.
          </div>

        </div>
      </div>
    </div>
  );
}