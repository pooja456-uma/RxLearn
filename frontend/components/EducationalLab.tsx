"use client";

import { useState, useEffect, useMemo } from "react";

export default function EducationalLab() {
  const [mode, setMode] = useState<
    "menu" | "category" | "quiz" | "flashcards" | "results" | "resources" | "interaction"
  >("menu");

  const [activeTask, setActiveTask] = useState<"quiz" | "flashcards" | null>(null);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [drugs, setDrugs] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [question, setQuestion] = useState<any>(null);

  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<any>(null);

  const [timeLeft, setTimeLeft] = useState(20);

  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<number[]>([]);
  const [reviseCards, setReviseCards] = useState<number[]>([]);

  // Interaction Checker States
  const [drugA, setDrugA] = useState("");
  const [drugB, setDrugB] = useState("");
  const [interactionResult, setInteractionResult] = useState<any>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));

    fetch("http://127.0.0.1:8000/api/drugs/search?query=")
      .then((res) => res.json())
      .then((data) => setDrugs(data || []));
  }, []);

  const studyList = useMemo(
    () => drugs.filter((d) => d.therapeutic_group === selectedGroup),
    [drugs, selectedGroup]
  );

  useEffect(() => {
    if (mode === "quiz" && !answered && question) {
      if (timeLeft <= 0) {
        handleTimeout();
        return;
      }

      const timer = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, mode, answered, question]);

  const getRandomQuestionType = () => {
    const types = ["brand", "indication", "sideeffect", "counseling", "group"];
    return types[Math.floor(Math.random() * types.length)];
  };

  const generateQuestion = () => {
    if (totalAttempted >= 20) {
      setMode("results");
      return;
    }

    if (studyList.length < 2) {
      alert("Insufficient drug data in this category");
      setMode("category");
      return;
    }

    const correct = studyList[Math.floor(Math.random() * studyList.length)];
    const randomOthers = drugs
      .filter((d) => d.id !== correct.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options = [correct, ...randomOthers].sort(() => Math.random() - 0.5);

    setQuestion({
      correct,
      options,
      type: getRandomQuestionType(),
    });

    setAnswered(false);
    setSelectedAnswerId(null);
    setFeedback(null);
    setTimeLeft(20);
  };

  const handleStart = (category: string) => {
    setSelectedGroup(category);
    setScore(0);
    setXp(0);
    setStreak(0);
    setTotalAttempted(0);
    setCardIndex(0);
    setKnownCards([]);
    setReviseCards([]);
    setFlipped(false);

    setMode(activeTask!);

    if (activeTask === "quiz") {
      setTimeout(() => generateQuestion(), 100);
    }
  };

  const handleTimeout = () => {
    setAnswered(true);
    setTotalAttempted((p) => p + 1);
    setStreak(0);
    setFeedback({
      isCorrect: false,
      note: "⏰ Time expired! " + question.correct.counseling_points,
    });
  };

  const handleAnswerSelection = (opt: any) => {
    if (answered) return;

    setAnswered(true);
    setSelectedAnswerId(opt.id);
    setTotalAttempted((p) => p + 1);

    const isCorrect = opt.id === question.correct.id;

    if (isCorrect) {
      setScore((p) => p + 1);
      setXp((p) => p + 10);
      setStreak((p) => p + 1);
    } else {
      setStreak(0);
    }

    setFeedback({
      isCorrect,
      note: question.correct.counseling_points,
    });
  };

  const nextFlashCard = (type?: "know" | "revise") => {
    if (!currentCard) return;

    if (type === "know") setKnownCards([...knownCards, currentCard.id]);
    if (type === "revise") setReviseCards([...reviseCards, currentCard.id]);

    if (cardIndex + 1 >= studyList.length) {
      setMode("results");
      return;
    }

    setCardIndex((p) => p + 1);
    setFlipped(false);
  };

  const checkInteraction = () => {
    if (!drugA || !drugB) return;
    
    const d1 = drugs.find(d => d.generic_name === drugA);
    const d2 = drugs.find(d => d.generic_name === drugB);

    if (!d1 || !d2) {
        setInteractionResult({ 
            severity: "Unknown", 
            note: "One or both medications not found in current clinical records." 
        });
        return;
    }

    if (d1.therapeutic_group === d2.therapeutic_group) {
      setInteractionResult({
        severity: "High",
        note: `Both medicines belong to ${d1.therapeutic_group}. Co-administration may lead to therapeutic duplication and increased toxicity risk.`
      });
    } else {
      setInteractionResult({
        severity: "Minimal",
        note: "No major contraindications found in primary records. Always verify with clinical guidelines."
      });
    }
  };

  const clearInteraction = () => {
    setDrugA("");
    setDrugB("");
    setInteractionResult(null);
  };

  const renderQuestionText = () => {
    if (!question) return "";

    switch (question.type) {
      case "brand":
        return `Identify the Generic Name for "${question.correct.brand_name}"`;
      case "indication":
        return `Which medicine is indicated for "${question.correct.indications}"`;
      case "sideeffect":
        return `Which drug commonly causes "${question.correct.side_effects}"`;
      case "counseling":
        return `Which drug matches this counseling point: "${question.correct.counseling_points}"`;
      case "group":
        return `Which medication belongs to therapeutic class "${question.correct.therapeutic_group}"`;
      default:
        return "";
    }
  };

  const renderOptionLabel = (opt: any) => {
    if (!question) return "";
    if (question.type === "brand") return opt.generic_name;
    if (question.type === "group") return opt.generic_name;
    if (question.type === "indication") return opt.brand_name;
    if (question.type === "sideeffect") return opt.brand_name;
    if (question.type === "counseling") return opt.generic_name;
    return opt.generic_name;
  };

  const currentCard = studyList[cardIndex % (studyList.length || 1)];

  return (
    <div className="max-w-7xl mx-auto px-6 pb-20 space-y-10 animate-in fade-in duration-700">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#4f7c99] via-[#2c5d7d] to-[#4f7c99] text-slate-900 p-12 rounded-[40px] shadow-2xl flex justify-between items-center border-2 border-white">
        <div>
          <h1 className="text-4xl font-black tracking-tight italic drop-shadow-sm">
            RxLearn Interactive Academy
          </h1>
          <p className="uppercase text-[11px] tracking-[0.45em] mt-3 font-bold text-slate-700">
            Clinical Training Simulation Engine
          </p>
        </div>

        {mode !== "menu" && (
          <button
            onClick={() => { setMode("menu"); clearInteraction(); }}
            className="px-8 py-3 bg-white text-slate-800 hover:bg-rose-500 hover:text-white rounded-2xl text-[11px] font-black uppercase transition-all shadow-md"
          >
            Exit Lab
          </button>
        )}
      </div>

      {/* QUIZ STATUS */}
      {mode === "quiz" && (
        <div className="grid md:grid-cols-5 gap-4">
          <StatusCard title="Score" value={`${score}/20`} />
          <StatusCard title="XP" value={`${xp}`} />
          <StatusCard title="Streak" value={`${streak}`} />
          <StatusCard title="Timer" value={`${timeLeft}s`} urgent={timeLeft <= 5} />
          <StatusCard title="Question" value={`${totalAttempted + 1}/20`} />
        </div>
      )}

      {/* MENU */}
      {mode === "menu" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <MenuCard
            title="MCQ Battle Arena"
            icon="🎯"
            desc="20 timed intelligent randomized pharmacy questions."
            onClick={() => {
              setActiveTask("quiz");
              setMode("category");
            }}
          />
          <MenuCard
            title="Flip Flashcards"
            icon="🧠"
            desc="Interactive memory retention with clear study completion."
            onClick={() => {
              setActiveTask("flashcards");
              setMode("category");
            }}
          />
          <MenuCard
            title="Interaction Checker"
            icon="⚖️"
            desc="Verify clinical contraindications between two medications."
            onClick={() => setMode("interaction")}
          />
          <MenuCard
            title="Clinical Resources"
            icon="📚"
            desc="Verified national and international pharmacy repositories."
            onClick={() => setMode("resources")}
          />
        </div>
      )}

      {/* DRUG INTERACTION CHECKER */}
      {mode === "interaction" && (
        <div className="max-w-4xl mx-auto bg-white p-16 rounded-[60px] shadow-2xl border-2 border-black space-y-10">
          <div className="text-center">
            <h2 className="text-3xl font-black italic uppercase text-slate-800 tracking-tight">Drug Interaction Lab</h2>
            <p className="text-xs font-bold text-slate-400 mt-2 tracking-widest uppercase">Cross-Reference Clinical Records</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
             <div className="space-y-3">
                <label className="text-[10px] font-black uppercase ml-4 text-slate-400">Primary Medication</label>
                <select 
                  value={drugA}
                  onChange={(e) => setDrugA(e.target.value)}
                  className="w-full p-6 rounded-full border-2 border-slate-100 outline-none focus:border-black font-bold appearance-none bg-slate-50 cursor-pointer"
                >
                  <option value="">Select Medication A...</option>
                  {drugs.map(d => (
                    <option key={`a-${d.id}`} value={d.generic_name}>{d.generic_name} ({d.brand_name})</option>
                  ))}
                </select>
             </div>
             <div className="space-y-3">
                <label className="text-[10px] font-black uppercase ml-4 text-slate-400">Secondary Medication</label>
                <select 
                  value={drugB}
                  onChange={(e) => setDrugB(e.target.value)}
                  className="w-full p-6 rounded-full border-2 border-slate-100 outline-none focus:border-black font-bold appearance-none bg-slate-50 cursor-pointer"
                >
                  <option value="">Select Medication B...</option>
                  {drugs.map(d => (
                    <option key={`b-${d.id}`} value={d.generic_name}>{d.generic_name} ({d.brand_name})</option>
                  ))}
                </select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={checkInteraction}
              disabled={!drugA || !drugB}
              className="w-full py-6 bg-black text-white rounded-full font-black uppercase tracking-widest hover:bg-[#2c5d7d] disabled:bg-slate-200 transition-all"
            >
              Run Clinical Analysis
            </button>
            <button 
              onClick={clearInteraction}
              className="w-full py-6 bg-slate-100 text-slate-800 rounded-full font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
            >
              Clear Fields
            </button>
          </div>

          {interactionResult && (
            <div className={`p-10 rounded-[40px] border-2 animate-in zoom-in-95 duration-300 ${
              interactionResult.severity === "High" ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"
            }`}>
              <div className="flex items-center gap-4 mb-4">
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase text-white ${
                   interactionResult.severity === "High" ? "bg-rose-600" : "bg-emerald-600"
                }`}>
                  Severity: {interactionResult.severity}
                </span>
              </div>
              <p className="text-xl font-bold italic text-slate-800 leading-relaxed">
                "{interactionResult.note}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* CATEGORY */}
      {mode === "category" && (
        <div className="max-w-5xl mx-auto space-y-5">
          <h2 className="text-center text-2xl font-black uppercase tracking-[0.3em] text-slate-700">
            Select Therapeutic Module
          </h2>

          {categories.map((c) => (
            <button
              key={c}
              onClick={() => handleStart(c)}
              className="w-full bg-white p-8 px-12 rounded-full border-2 border-black flex justify-between items-center hover:shadow-xl hover:bg-slate-50 transition-all"
            >
              <div className="text-left">
                <p className="text-xl font-black uppercase">{c}</p>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">
                  Launch Interactive Module
                </p>
              </div>
              <span className="font-black">START →</span>
            </button>
          ))}
        </div>
      )}

      {/* QUIZ */}
      {mode === "quiz" && question && (
        <div className="max-w-5xl mx-auto bg-white p-16 rounded-[60px] shadow-2xl border-2 border-black space-y-8">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${timeLeft <= 5 ? "bg-rose-500" : "bg-[#1f6f8b]"}`}
              style={{ width: `${(timeLeft / 20) * 100}%` }}
            />
          </div>

          <h2 className="text-3xl font-black italic text-slate-800 leading-relaxed">
            {renderQuestionText()}
          </h2>

          <div className="grid gap-4 mt-10">
            {question.options.map((opt: any) => {
              const isCorrect = opt.id === question.correct.id;
              const isSelected = opt.id === selectedAnswerId;

              let style = "bg-white border-black hover:bg-slate-50";

              if (answered) {
                if (isCorrect) style = "bg-emerald-500 text-white border-emerald-600";
                else if (isSelected) style = "bg-red-500 text-white border-red-600";
                else style = "bg-slate-50 text-slate-300 border-slate-200";
              }

              return (
                <button
                  key={opt.id}
                  disabled={answered}
                  onClick={() => handleAnswerSelection(opt)}
                  className={`p-6 px-10 rounded-full border-2 font-black text-left text-lg flex justify-between items-center transition-all ${style}`}
                >
                  <span>{renderOptionLabel(opt)}</span>

                  {answered && isCorrect && (
                    <span className="text-3xl font-black text-white bg-emerald-700 w-10 h-10 rounded-full flex items-center justify-center">
                      ✔
                    </span>
                  )}

                  {answered && isSelected && !isCorrect && (
                    <span className="text-3xl font-black text-white bg-red-700 w-10 h-10 rounded-full flex items-center justify-center">
                      ✖
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {feedback && (
            <div
              className={`p-10 rounded-[35px] text-white ${
                feedback.isCorrect ? "bg-emerald-700" : "bg-red-700"
              }`}
            >
              <div>
                <p className="uppercase text-sm tracking-[0.3em] font-black mb-4">
                  {feedback.isCorrect ? "✅ ANSWER CORRECT" : "❌ ANSWER WRONG"}
                </p>
                
                {/* SHOW CORRECT ANSWER ON MISTAKE */}
                {!feedback.isCorrect && (
                  <p className="mb-4 text-sm font-bold bg-white/20 p-3 rounded-2xl inline-block">
                    Correct Answer: <span className="underline underline-offset-4 tracking-wider uppercase">
                      {renderOptionLabel(question.correct)}
                    </span>
                  </p>
                )}
              </div>

              <p className="text-xl italic">💡 {feedback.note}</p>

              <button
                onClick={generateQuestion}
                className="w-full mt-8 py-5 bg-white text-black rounded-full font-black uppercase text-[11px] tracking-widest hover:bg-[#1f6f8b] hover:text-white transition-all shadow-lg"
              >
                Next Challenge →
              </button>
            </div>
          )}
        </div>
      )}

      {/* RESULTS */}
      {mode === "results" && (
        <div className="max-w-3xl mx-auto bg-white p-20 rounded-[70px] border-4 border-black shadow-2xl text-center space-y-10">
          <div className="text-7xl">🏆</div>
          <h2 className="text-4xl font-black italic uppercase">Module Completed</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <ResultMini title="Score" value={`${score}/20`} />
            <ResultMini title="Accuracy" value={`${Math.round((score / 20) * 100)}%`} />
            <ResultMini title="XP Earned" value={`${xp}`} />
          </div>

          <button
            onClick={() => setMode("menu")}
            className="w-full py-5 bg-black text-white rounded-full font-black uppercase tracking-widest hover:bg-[#1f6f8b]"
          >
            Return Home
          </button>
        </div>
      )}

      {/* FLASHCARDS */}
      {mode === "flashcards" && currentCard && (
        <div className="max-w-4xl mx-auto space-y-8">

          <div className="grid md:grid-cols-4 gap-4">
            <StatusCard title="Viewed" value={`${cardIndex + 1}/${studyList.length}`} />
            <StatusCard title="Known" value={`${knownCards.length}`} />
            <StatusCard title="Revise" value={`${reviseCards.length}`} />
            <StatusCard title="Remaining" value={`${studyList.length - (cardIndex + 1)}`} />
          </div>

          <div
            onClick={() => setFlipped(!flipped)}
            className="cursor-pointer bg-white min-h-[520px] rounded-[70px] border-4 border-black shadow-2xl p-20 flex flex-col justify-center items-center text-center"
          >
            {!flipped ? (
              <>
                <p className="uppercase text-[10px] tracking-[0.5em] text-slate-400 font-black">Brand Name</p>
                <h2 className="text-6xl font-black italic mt-8">{currentCard.brand_name}</h2>
                <p className="mt-20 text-slate-400 uppercase text-xs">Tap card to reveal answer</p>
              </>
            ) : (
              <>
                <p className="uppercase text-[10px] tracking-[0.5em] text-[#1f6f8b] font-black">Generic Name</p>
                <h2 className="text-5xl font-black italic mt-6">{currentCard.generic_name}</h2>
                <p className="mt-8 text-lg text-slate-500">{currentCard.indications}</p>
                <p className="mt-6 italic text-rose-500">{currentCard.counseling_points}</p>
              </>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <button onClick={() => nextFlashCard("know")} className="py-5 bg-emerald-500 text-white rounded-full font-black uppercase">
              I Know This
            </button>

            <button onClick={() => nextFlashCard("revise")} className="py-5 bg-amber-500 text-white rounded-full font-black uppercase">
              Revise Again
            </button>

            <button onClick={() => nextFlashCard()} className="py-5 bg-black text-white rounded-full font-black uppercase">
              Next Card
            </button>
          </div>
        </div>
      )}

      {/* RESOURCES */}
      {mode === "resources" && (
        <div className="max-w-6xl mx-auto grid gap-5">
          <ResourceCard title="DRUGS.COM DATABASE" sub="Comprehensive Clinical Drug Information" link="https://www.drugs.com" icon="💊" />
          <ResourceCard title="SRI LANKA MEDICAL COUNCIL" sub="National Regulatory Guidelines" link="https://www.slmc.gov.lk" icon="🇱🇰" />
          <ResourceCard title="BRITISH NATIONAL FORMULARY" sub="Prescribing Standards" link="https://bnf.nice.org.uk" icon="🇬🇧" />
          <ResourceCard title="WHO ESSENTIAL MEDICINES" sub="WHO Model Lists" link="https://www.who.int" icon="🌐" />
          <ResourceCard title="MEDLINEPLUS" sub="Drug Pharmacology Resource" link="https://medlineplus.gov/druginformation.html" icon="🔬" />
        </div>
      )}
    </div>
  );
}

function StatusCard({ title, value, urgent = false }: any) {
  return (
    <div
      className={`p-6 rounded-[25px] shadow-lg border text-center ${
        urgent
          ? "bg-rose-500 text-white animate-pulse border-rose-600"
          : "bg-white border-slate-200"
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.25em] font-black opacity-70">{title}</p>
      <h3 className="text-3xl font-black mt-2">{value}</h3>
    </div>
  );
}

function ResultMini({ title, value }: any) {
  return (
    <div className="bg-slate-50 rounded-[30px] p-8">
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">{title}</p>
      <h3 className="text-3xl font-black mt-3">{value}</h3>
    </div>
  );
}

function ResourceCard({ title, sub, link, icon }: any) {
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className="group bg-white p-10 px-14 rounded-full border-2 border-black flex justify-between items-center hover:shadow-xl transition-all">
      <div className="flex items-center gap-8">
        <div className="text-4xl">{icon}</div>
        <div>
          <h3 className="text-2xl font-black uppercase">{title}</h3>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">{sub}</p>
        </div>
      </div>
      <div>↗</div>
    </a>
  );
}

function MenuCard({ title, icon, desc, onClick }: any) {
  return (
    <div onClick={onClick} className="p-14 bg-white rounded-[60px] border-2 border-black text-center cursor-pointer hover:-translate-y-2 hover:shadow-2xl transition-all">
      <div className="text-7xl mb-8">{icon}</div>
      <h3 className="text-2xl font-black uppercase">{title}</h3>
      <p className="text-slate-400 mt-4">{desc}</p>
    </div>
  );
}