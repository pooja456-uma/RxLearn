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

  const [commentText, setCommentText] = useState<Record<string, string>>({});

  const handlePost = () => {
    if (!newPost.trim()) return;

    setLoading(true);

    setTimeout(() => {
      const createdPost = {
        id: Math.random().toString(),
        tag: "GENERAL",
        author: "You 💖",
        content: newPost,
        replies: [],
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
                  author: "You 💖",
                  text,
                },
              ],
            }
          : p
      )
    );

    setCommentText((prev) => ({ ...prev, [postId]: "" }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 bg-gradient-to-b from-pink-50 via-white to-purple-50 min-h-screen">

      {/* HEADER */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black">
          💊 Rx<span className="text-pink-500">Forum</span>
        </h1>
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold">
          learn together, grow together ✨
        </p>
      </div>

      {/* POST BOX */}
      <div className="bg-white p-6 rounded-[30px] shadow-sm border border-pink-100 space-y-4">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Ask or share something 💬"
          className="w-full p-5 rounded-2xl bg-pink-50 outline-none min-h-[120px] text-sm"
        />

        <div className="flex justify-end">
          <button
            onClick={handlePost}
            className="px-6 py-3 rounded-full bg-pink-500 text-white text-[10px] font-black"
          >
            {loading ? "posting..." : "post 💌"}
          </button>
        </div>
      </div>

      {/* POSTS */}
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-white p-6 rounded-[30px] border border-pink-100 space-y-4"
        >

          {/* POST */}
          <div className="flex justify-between text-[10px] font-black uppercase">
            <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full">
              {post.tag}
            </span>
            <span className="text-slate-400">{post.author}</span>
          </div>

          <p className="italic text-slate-700">“{post.content}”</p>

          {/* ACTIONS */}
          <div className="flex justify-between text-xs border-t pt-3">

            <button
              onClick={() => toggleLike(post.id)}
              className="text-rose-400 font-black"
            >
              💖 {post.likes}
            </button>

            <button
              onClick={() =>
                setOpenComments(openComments === post.id ? null : post.id)
              }
              className="text-slate-500 font-bold"
            >
              💬 {post.replies.length} comments
            </button>

          </div>

          {/* COMMENTS SECTION */}
          {openComments === post.id && (
            <div className="space-y-3 pt-3 border-t">

              {/* existing comments */}
              {post.replies.map((c) => (
                <div
                  key={c.id}
                  className="bg-pink-50 p-3 rounded-xl text-xs text-slate-700"
                >
                  <span className="font-bold text-pink-500">
                    {c.author}
                  </span>{" "}
                  {c.text}
                </div>
              ))}

              {/* add comment */}
              <div className="flex gap-2">
                <input
                  value={commentText[post.id] || ""}
                  onChange={(e) =>
                    setCommentText({
                      ...commentText,
                      [post.id]: e.target.value,
                    })
                  }
                  placeholder="Write a comment..."
                  className="flex-1 p-2 rounded-xl bg-pink-50 text-xs outline-none"
                />
                <button
                  onClick={() => addComment(post.id)}
                  className="bg-pink-500 text-white px-3 rounded-xl text-[10px]"
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