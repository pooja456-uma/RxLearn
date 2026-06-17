"use client";

import { useState, useEffect, useMemo } from "react";

type LevelTier = "beginner" | "intermediate" | "advanced";

interface MatchBlock {
  id: string;
  drugId: number;
  text: string;
  type: "brand" | "generic";
}

export default function EducationalLab() {
  const [mode, setMode] = useState<
    "menu" | "category" | "directions" | "tierSelect" | "quiz" | "flashcards" | "speedMatch" | "results" | "resources" | "interaction"
  >("menu");

  const [activeTask, setActiveTask] = useState<"quiz" | "flashcards" | "speedMatch" | null>(null);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedTier, setSelectedTier] = useState<LevelTier>("beginner");
  const [drugs, setDrugs] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [question, setQuestion] = useState<any>(null);

  // Gamification & Scoring Core
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(20);

  // Progressive Locking State
  const [unlockedTiers, setUnlockedTiers] = useState<Record<string, LevelTier[]>>({});

  // Speed Match Configuration States
  const [matchBlocks, setMatchBlocks] = useState<MatchBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<MatchBlock | null>(null);
  const [matchedDrugIds, setMatchedDrugIds] = useState<number[]>([]);

  // Flashcard States
  const [cardIndex, setCardIndex] = useState(0);
  const [flashcardPhase, setFlashcardPhase] = useState<"brand" | "generic" | "monograph">("brand");
  const [knownCards, setKnownCards] = useState<number[]>([]);
  const [reviseCards, setReviseCards] = useState<number[]>([]);

  // Interaction Checker States
  const [drugA, setDrugA] = useState("");
  const [drugB, setDrugB] = useState("");
  const [interactionResult, setInteractionResult] = useState<any>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/categories")
      .then((res) => res.json())
      .then((data) => {
        const cats = data.categories || [];
        setCategories(cats);
        
        const baseLocks: Record<string, LevelTier[]> = {};
        cats.forEach((cat: string) => {
          baseLocks[cat] = ["beginner"];
        });
        setUnlockedTiers(baseLocks);
      });

    fetch("http://127.0.0.1:8000/api/drugs/search?query=")
      .then((res) => res.json())
      .then((data) => setDrugs(data || []));
  }, []);

  const studyList = useMemo(
    () => drugs.filter((d) => d.therapeutic_group === selectedGroup),
    [drugs, selectedGroup]
  );

  // TIME DECREMENTER LIFE-CYCLE ENGINE
  useEffect(() => {
    if ((mode === "quiz" && !answered && question) || mode === "speedMatch") {
      if (timeLeft <= 0) {
        if (mode === "quiz") handleTimeout();
        else setMode("results");
        return;
      }

      const timer = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, mode, answered, question]);

  // AUTOMATIC FIRST QUESTION GENERATOR
  useEffect(() => {
    if (mode === "quiz" && totalAttempted === 0 && studyList.length >= 2 && !question) {
      generateQuestion();
    }
  }, [studyList, mode, totalAttempted, question]);

  const getRandomQuestionType = () => {
    if (selectedTier === "beginner") return ["brand", "group"][Math.floor(Math.random() * 2)];
    if (selectedTier === "intermediate") return ["brand", "indication", "sideeffect"][Math.floor(Math.random() * 3)];
    return ["indication", "sideeffect", "counseling"][Math.floor(Math.random() * 3)];
  };

  // INTELLIGENT QUESTION ENGINE
  const generateQuestion = () => {
    if (totalAttempted >= 20) {
      evaluateTierProgression();
      setMode("results");
      return;
    }

    if (studyList.length < 2) return;

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
    setTimeLeft(selectedTier === "beginner" ? 25 : selectedTier === "intermediate" ? 15 : 10);
  };

  const evaluateTierProgression = () => {
    if (score >= 12) {
      setUnlockedTiers((prev) => {
        const currentUnlocked = prev[selectedGroup] || ["beginner"];
        if (selectedTier === "beginner" && !currentUnlocked.includes("intermediate")) {
          return { ...prev, [selectedGroup]: [...currentUnlocked, "intermediate"] };
        }
        if (selectedTier === "intermediate" && !currentUnlocked.includes("advanced")) {
          return { ...prev, [selectedGroup]: [...currentUnlocked, "advanced"] };
        }
        return prev;
      });
    }
  };

  // INITIALIZE FORMULA SPEED MATCH DATA SPLIT MATRIX
  const initializeSpeedMatch = () => {
    if (studyList.length < 4) return;

    const selectedMeds = [...studyList].sort(() => Math.random() - 0.5).slice(0, 4);
    const blocks: MatchBlock[] = [];
    
    selectedMeds.forEach((d) => {
      blocks.push({ id: `brand-${d.id}`, drugId: d.id, text: d.brand_name, type: "brand" });
      blocks.push({ id: `generic-${d.id}`, drugId: d.id, text: d.generic_name, type: "generic" });
    });

    setMatchBlocks(blocks.sort(() => Math.random() - 0.5));
    setMatchedDrugIds([]);
    setSelectedBlock(null);
    setScore(0);
    setXp(0);
    setTimeLeft(25); // Hard 25 second limit countdown
    setMode("speedMatch");
  };

  const handleBlockClick = (block: MatchBlock) => {
    if (matchedDrugIds.includes(block.drugId)) return;
    if (selectedBlock?.id === block.id) {
      setSelectedBlock(null);
      return;
    }

    if (!selectedBlock) {
      setSelectedBlock(block);
    } else {
      if (selectedBlock.drugId === block.drugId && selectedBlock.type !== block.type) {
        const stepMatches = [...matchedDrugIds, block.drugId];
        setMatchedDrugIds(stepMatches);
        setScore((p) => p + 1);
        setXp((p) => p + 30); // Award 30 XP per matching link matrix completed
        setSelectedBlock(null);

        if (stepMatches.length === 4) {
          setTimeout(() => setMode("results"), 500);
        }
      } else {
        setSelectedBlock(block);
      }
    }
  };

  const handleStartCategorySelection = (category: string) => {
    setSelectedGroup(category);
    setMode("directions"); // Divert straight to directions screen
  };

  const proceedFromDirections = () => {
    if (activeTask === "quiz") {
      setMode("tierSelect");
    } else if (activeTask === "speedMatch") {
      initializeSpeedMatch();
    } else if (activeTask === "flashcards") {
      setCardIndex(0);
      setKnownCards([]);
      setReviseCards([]);
      setFlashcardPhase("brand");
      setMode("flashcards");
    }
  };

  const handleStartQuizArena = (tier: LevelTier) => {
    setSelectedTier(tier);
    setScore(0);
    setXp(0);
    setStreak(0);
    setTotalAttempted(0);
    setQuestion(null);
    setMode("quiz");
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
      const rewardWeight = selectedTier === "beginner" ? 10 : selectedTier === "intermediate" ? 15 : 25;
      setXp((p) => p + rewardWeight);
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
    setFlashcardPhase("brand");
  };

  const advanceCardPhase = () => {
    if (flashcardPhase === "brand") setFlashcardPhase("generic");
    else if (flashcardPhase === "generic") setFlashcardPhase("monograph");
  };

  // CLEANUP RETURN ENGINE FOR BOUNDED WORKSPACES
  // Instead of throwing the user back to the primary main menu, it checks the active task context
  const handleExitWorkflow = () => {
    setDrugA("");
    setDrugB("");
    setInteractionResult(null);
    
    if (mode === "quiz" || mode === "flashcards" || mode === "speedMatch" || mode === "tierSelect" || mode === "directions") {
      setMode("category"); // Drop back onto the context modules panel safely
    } else {
      setMode("menu"); // If inside category selection or interaction/resources, return to dashboard menu
      setActiveTask(null);
    }
  };

  // CLINICAL INTERACTION CHECKER
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

  // DYNAMIC QUESTION RENDERING
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
    <div className="max-w-7xl mx-auto px-6 pb-20 space-y-10 text-[#2D3136] selection:bg-[#1E7B92]/20 selection:text-[#1E7B92]">

      {/* HEADER */}
      <div className="bg-white p-8 rounded-xl shadow-sm flex justify-between items-center border border-slate-300/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1E7B92]" />
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1E7B92] uppercase">
            RxLearn Interactive Academy
          </h1>
          <p className="uppercase text-[10px] tracking-wider mt-1 font-bold text-slate-400">
            Clinical Training Simulation Engine
          </p>
        </div>

        {mode !== "menu" && (
          <button
            onClick={handleExitWorkflow}
            className="px-6 py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-600 hover:text-[#2D3136] rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-[0.98]"
          >
            {mode === "category" || mode === "resources" || mode === "interaction" ? "Exit Lab" : "Exit Task"}
          </button>
        )}
      </div>

      {/* DYNAMIC METRICS HUD */}
      {(mode === "quiz" || mode === "speedMatch") && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatusCard title={mode === "quiz" ? "Score Trace" : "Matched Structural Units"} value={mode === "quiz" ? `${score}/20` : `${matchedDrugIds.length}/4`} />
          <StatusCard title="XP Reward Metrics" value={`+${xp}`} />
          <StatusCard title="Countdown Speed Gauge" value={`${timeLeft}s`} urgent={timeLeft <= 5} />
          <StatusCard title="Operational Context" value={mode === "quiz" ? `MCQ Arena` : `Speed Match Grid`} />
        </div>
      )}

      {/* CORE MENU NAVIGATION */}
      {mode === "menu" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MenuCard
            title="MCQ Battle Arena"
            icon="🎯"
            desc="Progressive timed multi-tiered competency pharmacy testing panels."
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
            title="Drug Speed Matcher"
            icon="⚡"
            desc="Rapid block puzzle matching to forge instant formulation connectivity matrices."
            onClick={() => {
              setActiveTask("speedMatch");
              setMode("category");
            }}
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
        <div className="max-w-4xl mx-auto bg-white p-10 rounded-xl shadow-sm border border-slate-300/60 space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase text-[#2D3136] tracking-tight">Drug Interaction Lab</h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-wider uppercase">Cross-Reference Clinical Records</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase ml-1 text-slate-400 tracking-wider">Primary Medication</label>
                <div className="relative">
                  <select 
                    value={drugA}
                    onChange={(e) => setDrugA(e.target.value)}
                    className="w-full p-4 rounded-lg border border-slate-300 outline-none text-[#2D3136] focus:border-[#1E7B92] font-bold text-xs bg-slate-50 cursor-pointer appearance-none shadow-inner"
                  >
                    <option value="">Select Medication A...</option>
                    {drugs.map(d => (
                      <option key={`a-${d.id}`} value={d.generic_name}>{d.generic_name} ({d.brand_name})</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 font-bold text-xs">▼</div>
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase ml-1 text-slate-400 tracking-wider">Secondary Medication</label>
                <div className="relative">
                  <select 
                    value={drugB}
                    onChange={(e) => setDrugB(e.target.value)}
                    className="w-full p-4 rounded-lg border border-slate-300 outline-none text-[#2D3136] focus:border-[#1E7B92] font-bold text-xs bg-slate-50 cursor-pointer appearance-none shadow-inner"
                  >
                    <option value="">Select Medication B...</option>
                    {drugs.map(d => (
                      <option key={`b-${d.id}`} value={d.generic_name}>{d.generic_name} ({d.brand_name})</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 font-bold text-xs">▼</div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={checkInteraction}
              disabled={!drugA || !drugB}
              className="w-full py-3.5 bg-[#00A3E0] text-white rounded-lg font-bold uppercase text-xs tracking-wider hover:bg-[#008CBA] disabled:bg-slate-300 transition-all active:scale-[0.98] shadow-sm"
            >
              Run Clinical Analysis
            </button>
            <button 
              onClick={clearInteraction}
              className="w-full py-3.5 bg-slate-100 text-[#2D3136] border border-slate-300 rounded-lg font-bold uppercase text-xs tracking-wider hover:bg-slate-200 transition-all active:scale-[0.98] shadow-sm"
            >
              Clear Fields
            </button>
          </div>

          {interactionResult && (
            <div className={`p-6 rounded-lg border transition-all animate-in zoom-in-95 duration-300 ${
              interactionResult.severity === "High" ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"
            }`}>
              <div className="flex items-center gap-4 mb-3">
                <span className={`px-3 py-1 rounded text-[9px] font-bold uppercase text-white shadow-sm tracking-wider ${
                   interactionResult.severity === "High" ? "bg-rose-600" : "bg-emerald-600"
                }`}>
                  Severity: {interactionResult.severity}
                </span>
              </div>
              <p className={`text-base font-medium leading-relaxed ${interactionResult.severity === "High" ? "text-rose-700" : "text-emerald-800"}`}>
                "{interactionResult.note}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* CATEGORY SELECT MODULE LIST */}
      {mode === "category" && (
        <div className="max-w-4xl mx-auto space-y-4">
          <h2 className="text-center text-xs font-black uppercase tracking-widest text-slate-400 mb-6">
            Select Therapeutic Module
          </h2>

          {categories.map((c) => (
            <button
              key={c}
              onClick={() => handleStartCategorySelection(c)}
              className="w-full bg-white p-5 px-8 rounded-xl border border-slate-300/60 flex justify-between items-center hover:border-[#1E7B92] text-[#2D3136] hover:text-[#1E7B92] transition-all duration-200 shadow-sm active:scale-[0.99]"
            >
              <div className="text-left">
                <p className="text-lg font-black uppercase tracking-tight">{c}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">
                  Launch Competency Framework for {activeTask === "quiz" ? "MCQ" : activeTask === "flashcards" ? "Flashcards" : "Speed Match"}
                </p>
              </div>
              <span className="font-bold text-xs uppercase tracking-wider">Select Module →</span>
            </button>
          ))}
        </div>
      )}

      {/* 📋 INNOVATIVE SECTOR: DIRECTIONS & EXPERT HINTS GATEKEEPER DISPLAY */}
      {mode === "directions" && (
        <div className="max-w-3xl mx-auto bg-white border border-slate-300/60 shadow-sm rounded-xl p-10 space-y-8 animate-in zoom-in-95 duration-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#1E7B92]" />
          
          <div className="text-center space-y-2">
            <span className="text-3xl">
              {activeTask === "quiz" ? "🎯" : activeTask === "flashcards" ? "🧠" : "⚡"}
            </span>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
              {activeTask === "quiz" ? "MCQ Arena Rules" : activeTask === "flashcards" ? "Flashcard Guidelines" : "Speed Match Rules"}
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Therapeutic Variant: {selectedGroup}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Instructions:</h4>
            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2 font-medium">
              {activeTask === "quiz" && (
                <>
                  <li>You will face a randomized series of <strong>20 critical pharmacy questions</strong>.</li>
                  <li>Questions adapt dynamically based on your chosen tier framework level.</li>
                  <li>A passing accuracy score of <strong>$\ge 12/20$ ($60\%$)</strong> is mandated to unlock successive tiers.</li>
                </>
              )}
              {activeTask === "flashcards" && (
                <>
                  <li>This engine handles an advanced <strong>3-Phase active memory extraction framework</strong>.</li>
                  <li>Clicking a card extracts deeply nested pharmaceutical data fields progressively.</li>
                  <li>Evaluate your retention accurately to update your personal competency record map.</li>
                </>
              )}
              {activeTask === "speedMatch" && (
                <>
                  <li>A matrix board showing scrambled formulation items will generate on-screen.</li>
                  <li>You have a tight countdown window of <strong>25 seconds</strong> to link matching properties.</li>
                  <li>Click a commercial Brand variant block followed immediately by its corresponding active Generic core block.</li>
                </>
              )}
            </ul>
          </div>

          <div className="p-5 bg-[#1E7B92]/5 border border-[#1E7B92]/20 rounded-xl space-y-1.5">
            <h4 className="text-xs font-black uppercase text-[#1E7B92] tracking-wider flex items-center gap-1.5">💡 Expert Clinical Tips:</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {activeTask === "quiz" ? "Keep a sharp eye on the moving speed caps. Intermediate and Advanced modes shrink your countdown windows drastically to simulate acute ward prescription verification pressures." : 
               activeTask === "flashcards" ? "Do not just memorize commercial brand elements. Focus closely on Phase 3's high-alert callout blocks—mastering drug counseling tips safeguards real patient outcomes." : 
               "Speed matches reward pure fast recall. Scan the structural layout of the board components quickly before executing clicks to lock down high-multiplier streak XP rewards."}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setMode("category")}
              className="flex-1 py-3 bg-slate-100 border border-slate-300 text-slate-600 font-bold uppercase text-xs rounded-lg tracking-wider hover:bg-slate-200 transition-all active:scale-[0.98]"
            >
              ← Back to Modules
            </button>
            <button
              onClick={proceedFromDirections}
              className="flex-1 py-3 bg-[#1E7B92] text-white font-bold uppercase text-xs rounded-lg tracking-wider hover:bg-[#15586e] shadow-sm transition-all active:scale-[0.98]"
            >
              Initialize Session →
            </button>
          </div>
        </div>
      )}

      {/* MCQ LEVEL PROGRESSIVE SEGREGATION MATRIX */}
      {mode === "tierSelect" && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <span className="text-[#1E7B92] text-xs font-bold uppercase tracking-widest bg-[#1E7B92]/10 px-4 py-1.5 rounded-full">{selectedGroup}</span>
            <h2 className="text-xl font-black uppercase mt-4 text-slate-700 tracking-tight">Configure Arena Complexity Level</h2>
            <p className="text-xs text-slate-400 font-bold mt-1">Unlock superior tiers by passing previous module metrics ($\ge 12/20$ Score Required).</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 pt-6">
            {(["beginner", "intermediate", "advanced"] as LevelTier[]).map((tier) => {
              const isUnlocked = unlockedTiers[selectedGroup]?.includes(tier);
              return (
                <button
                  key={tier}
                  disabled={!isUnlocked}
                  onClick={() => handleStartQuizArena(tier)}
                  className={`p-6 rounded-xl border flex flex-col justify-between text-left transition-all duration-300 relative overflow-hidden ${
                    isUnlocked 
                      ? "bg-white border-slate-300 hover:border-[#1E7B92] hover:-translate-y-1 cursor-pointer group" 
                      : "bg-slate-50 border-slate-200 cursor-not-allowed opacity-60"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center w-full">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        tier === "beginner" ? "bg-blue-100 text-blue-700" : tier === "intermediate" ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"
                      }`}>{tier}</span>
                      {!isUnlocked && <span className="text-xs">🔒 Locked</span>}
                    </div>
                    <h3 className="text-lg font-black uppercase mt-4 text-slate-700 group-hover:text-[#1E7B92] transition-colors">
                      {tier === "beginner" ? "Core Monograph" : tier === "intermediate" ? "Clinical Action" : "Dispensing Alert"}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed">
                      {tier === "beginner" ? "Targeting basic drug matching, chemical structures, and core class parameters. [25s Timer]" : 
                       tier === "intermediate" ? "Tests active indications, clinical actions, and diagnostic criteria matches. [15s Timer]" : 
                       "High-stakes focus on high-alert side effects and dispensing warnings. [10s Timer]"}
                    </p>
                  </div>
                  <span className={`text-[10px] font-black uppercase mt-6 tracking-wider transition-colors ${isUnlocked ? "text-[#1E7B92] group-hover:text-[#15586e]" : "text-slate-400"}`}>
                    {isUnlocked ? "Initialize Run →" : "Requires Previous Tier Pass"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* DRUG SPEED MATCHER BOARD SYSTEM */}
      {mode === "speedMatch" && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
          <div className="text-center">
            <span className="text-[#1E7B92] text-xs font-bold uppercase tracking-widest bg-[#1E7B92]/10 px-4 py-1.5 rounded-full">{selectedGroup}</span>
            <h2 className="text-2xl font-black uppercase text-slate-700 tracking-tight mt-3">Drug Speed Matcher</h2>
            <p className="text-xs text-slate-400 font-bold mt-1">Match commercial therapeutic options to corresponding active pharmaceutical ingredient core structures.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
            {matchBlocks.map((block) => {
              const isMatched = matchedDrugIds.includes(block.drugId);
              const isSelected = selectedBlock?.id === block.id;

              let style = "bg-white border-slate-300 text-slate-700 hover:border-[#1E7B92] hover:bg-slate-50 cursor-pointer shadow-sm";
              if (isMatched) style = "bg-emerald-50 border-emerald-200 text-emerald-700 opacity-40 cursor-default shadow-none";
              else if (isSelected) style = "bg-[#1E7B92] border-[#15586e] text-white scale-[1.02] shadow-md ring-2 ring-[#1E7B92]/30";

              return (
                <button
                  key={block.id}
                  disabled={isMatched}
                  onClick={() => handleBlockClick(block)}
                  className={`min-h-[110px] p-4 rounded-xl border font-black text-center text-xs uppercase transition-all duration-200 flex flex-col justify-center items-center gap-2 relative group overflow-hidden ${style}`}
                >
                  <span className={`text-[8px] tracking-widest font-bold absolute top-2 left-3 rounded px-1.5 opacity-60 ${
                    block.type === "brand" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                  } group-hover:opacity-100 ${isSelected ? "!bg-white/20 !text-white opacity-100" : ""}`}>
                    {block.type}
                  </span>
                  <span className="leading-snug px-2 mt-2">{block.text}</span>
                  {isMatched && <span className="text-[10px] font-bold text-emerald-600 mt-1">✓ Connected</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* QUIZ ARENA */}
      {mode === "quiz" && question && (
        <div className="max-w-4xl mx-auto bg-white p-10 rounded-xl shadow-sm border border-slate-300/60 space-y-6">
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${timeLeft <= 5 ? "bg-rose-500" : "bg-[#1E7B92]"}`}
              style={{ width: `${(timeLeft / (selectedTier === "beginner" ? 25 : selectedTier === "intermediate" ? 15 : 10)) * 100}%` }}
            />
          </div>

          <h2 className="text-xl font-black uppercase tracking-tight text-[#2D3136] leading-snug">
            {renderQuestionText()}
          </h2>

          <div className="grid gap-3 mt-8">
            {question.options.map((opt: any) => {
              const isCorrect = opt.id === question.correct.id;
              const isSelected = opt.id === selectedAnswerId;

              let style = "bg-white border-slate-300 text-[#2D3136] hover:border-slate-400 hover:bg-slate-50";

              if (answered) {
                if (isCorrect) style = "bg-emerald-600 text-white border-emerald-700";
                else if (isSelected) style = "bg-rose-50 border-rose-300 text-rose-700";
                else style = "bg-slate-50 text-slate-400 border-slate-200";
              }

              return (
                <button
                  key={opt.id}
                  disabled={answered}
                  onClick={() => handleAnswerSelection(opt)}
                  className={`p-4 px-6 rounded-lg border font-bold text-left text-sm flex justify-between items-center transition-all active:scale-[0.99] ${style}`}
                >
                  <span>{renderOptionLabel(opt)}</span>

                  {answered && isCorrect && (
                    <span className="text-xs font-black text-white bg-emerald-700 w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                      ✓
                    </span>
                  )}

                  {answered && isSelected && !isCorrect && (
                    <span className="text-xs font-black text-white bg-rose-600 w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                      ✕
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {feedback && (
            <div
              className={`p-6 rounded-lg text-white animate-in zoom-in-95 duration-200 ${
                feedback.isCorrect ? "bg-emerald-600" : "bg-rose-50/90 border border-rose-200 !text-rose-900"
              }`}
            >
              <div>
                <p className={`uppercase text-[10px] tracking-widest font-black mb-3 ${feedback.isCorrect ? "text-white" : "text-rose-700"}`}>
                  {feedback.isCorrect ? "✓ Answer Verified" : "✕ Discrepancy Found"}
                </p>
                
                {!feedback.isCorrect && (
                  <p className="mb-4 text-xs font-bold bg-rose-100/60 text-rose-800 border border-rose-200 p-2 px-4 rounded-md inline-block uppercase tracking-wide">
                    Target Profile: {renderOptionLabel(question.correct)}
                  </p>
                )}
              </div>

              <p className={`text-sm font-medium italic ${feedback.isCorrect ? "text-white" : "text-slate-700"}`}>💡 {feedback.note}</p>

              <button
                onClick={generateQuestion}
                className={`w-full mt-6 py-3.5 rounded-lg font-bold uppercase text-xs tracking-wider transition-all shadow-sm active:scale-[0.98] ${
                  feedback.isCorrect ? "bg-white text-[#2D3136] hover:bg-slate-50" : "bg-rose-600 text-white hover:bg-rose-700"
                }`}
              >
                Next Challenge →
              </button>
            </div>
          )}
        </div>
      )}

      {/* CORE SUMMARY EVALUATION REPORT PANEL */}
      {mode === "results" && (
        <div className="max-w-3xl mx-auto bg-white p-12 rounded-xl border border-slate-300/60 shadow-sm text-center space-y-8">
          <div className="text-5xl animate-bounce">🏆</div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#2D3136]">Module Session Concluded</h2>
          <p className="text-xs text-slate-400 font-bold -mt-4 uppercase tracking-wider">
            {activeTask === "quiz" ? `Module Track: MCQ Arena (${selectedTier.toUpperCase()})` : activeTask === "speedMatch" ? "Module Track: Drug Speed Matcher" : "Active Study Session"}
          </p>

          <div className="grid grid-cols-3 gap-4">
            <ResultMini title={activeTask === "quiz" ? "Score Trace" : activeTask === "speedMatch" ? "Assembled Links" : "Completed Metrics"} value={activeTask === "quiz" ? `${score}/20` : activeTask === "speedMatch" ? `${matchedDrugIds.length}/4` : `${cardIndex}/${studyList.length}`} />
            <ResultMini title="Net Accuracy" value={`${Math.round(((activeTask === "quiz" ? score : activeTask === "speedMatch" ? matchedDrugIds.length : cardIndex) / (activeTask === "quiz" ? 20 : activeTask === "speedMatch" ? 4 : studyList.length || 1)) * 100)}%`} />
            <ResultMini title="Total XP Earned" value={`${xp}`} />
          </div>

          {activeTask === "quiz" && score < 12 && (
            <p className="text-xs text-rose-600 font-bold italic bg-rose-50 p-3 rounded-lg border border-rose-100">
              ⚠️ Score fell below passing threshold ($60\%$). Next tier unlock sequence remained locked for this module run.
            </p>
          )}
          {activeTask === "quiz" && score >= 12 && (
            <p className="text-xs text-emerald-700 font-bold italic bg-emerald-50 p-3 rounded-lg border border-emerald-100">
              🎉 Performance metrics verified! Progression sequence updated successfully.
            </p>
          )}

          <button
            onClick={() => setMode("category")} // Clean redirect targeted back onto categories select layer instead of root menu reset
            className="w-full py-3.5 bg-[#1E7B92] text-white rounded-lg font-bold uppercase text-xs tracking-wider hover:bg-[#15586e] shadow-sm"
          >
            Return to Modules
          </button>
        </div>
      )}

      {/* COGNITIVE FLASHCARDS INTERFACE */}
      {mode === "flashcards" && currentCard && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatusCard title="Batch Progress" value={`${cardIndex + 1}/${studyList.length}`} />
            <StatusCard title="Mastered Matrix" value={`${knownCards.length}`} />
            <StatusCard title="Needs Review" value={`${reviseCards.length}`} />
            <StatusCard title="Queue Remainder" value={`${studyList.length - (cardIndex + 1)}`} />
          </div>

          <div
            onClick={advanceCardPhase}
            className={`bg-white min-h-[380px] rounded-xl border border-slate-300/60 shadow-sm p-10 flex flex-col justify-center items-center text-center relative overflow-hidden transition-all duration-300 ${
              flashcardPhase !== "monograph" ? "cursor-pointer hover:border-[#1E7B92]" : "cursor-default"
            }`}
          >
            <div className={`absolute top-0 left-0 w-full h-1.5 transition-colors duration-500 ${
              flashcardPhase === "brand" ? "bg-slate-200" : flashcardPhase === "generic" ? "bg-amber-400" : "bg-[#1E7B92]"
            }`} />
            
            {flashcardPhase === "brand" && (
              <div className="animate-in fade-in zoom-in-95 duration-200 space-y-4">
                <span className="px-3 py-1 bg-slate-100 border text-slate-400 font-bold text-[9px] uppercase tracking-widest rounded">Phase 1: Visual Prompt</span>
                <p className="uppercase text-[10px] tracking-wider text-slate-400 font-bold mt-4">Brand Designation</p>
                <h2 className="text-4xl font-black text-[#2D3136] uppercase tracking-tight">{currentCard.brand_name}</h2>
                <div className="pt-10">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest bg-slate-50 border px-4 py-2 rounded-lg animate-pulse">Tap Card to Extract Active Matrix</span>
                </div>
              </div>
            )}

            {flashcardPhase === "generic" && (
              <div className="animate-in fade-in zoom-in-95 duration-200 space-y-4">
                <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[9px] uppercase tracking-widest rounded">Phase 2: Chemical Core</span>
                <p className="uppercase text-[10px] tracking-wider text-amber-600 font-bold mt-4">Active Pharmaceutical Ingredient (API)</p>
                <h2 className="text-4xl font-black text-[#1E7B92] uppercase tracking-tight">{currentCard.generic_name}</h2>
                <div className="pt-10">
                  <span className="text-slate-500 font-bold uppercase text-[9px] tracking-widest bg-amber-50/50 border border-amber-200 px-4 py-2 rounded-lg">Tap Again for Full Clinical Monograph</span>
                </div>
              </div>
            )}

            {flashcardPhase === "monograph" && (
              <div className="w-full max-w-2xl space-y-6 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="text-center border-b pb-4 space-y-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[9px] uppercase tracking-widest rounded">Phase 3: Verified Monograph</span>
                  <h2 className="text-3xl font-black text-[#1E7B92] uppercase tracking-tight mt-3">{currentCard.generic_name}</h2>
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Commercial Variant: {currentCard.brand_name}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Clinical Indications & Actions</h4>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed mt-1">{currentCard.indications}</p>
                  </div>
                  <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-lg space-y-1">
                    <h4 className="text-[9px] uppercase font-black text-rose-600 tracking-widest flex items-center gap-1">⚠️ High-Alert Dispensing Counsel</h4>
                    <p className="text-xs text-rose-900 font-medium italic leading-relaxed">{currentCard.counseling_points}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => nextFlashCard("know")} disabled={flashcardPhase !== "monograph"} className="py-3 bg-emerald-600 disabled:bg-slate-200 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all active:scale-[0.98] shadow-sm cursor-pointer disabled:cursor-not-allowed">Mastered Matrix</button>
            <button onClick={() => nextFlashCard("revise")} disabled={flashcardPhase !== "monograph"} className="py-3 bg-amber-500 disabled:bg-slate-200 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-amber-600 transition-all active:scale-[0.98] shadow-sm cursor-pointer disabled:cursor-not-allowed">Needs Review</button>
            <button onClick={() => nextFlashCard()} className="py-3 bg-[#2D3136] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all active:scale-[0.98] shadow-sm cursor-pointer">Skip Core Card</button>
          </div>
        </div>
      )}

      {/* EXTERNAL REPOSITORIES */}
      {mode === "resources" && (
        <div className="max-w-4xl mx-auto grid gap-4">
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
    <div className={`p-4 rounded-lg border text-center shadow-sm transition-all ${urgent ? "bg-rose-50/60 text-rose-700 animate-pulse border-rose-300 shadow-rose-50" : "bg-white border-slate-300/60"}`}>
      <p className={`text-[9px] uppercase tracking-wider font-bold ${urgent ? "text-rose-600" : "text-slate-400"}`}>{title}</p>
      <h3 className="text-2xl font-black mt-1.5 tracking-tight">{value}</h3>
    </div>
  );
}

function ResultMini({ title, value }: any) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{title}</p>
      <h3 className="text-2xl font-black mt-2 text-[#2D3136]">{value}</h3>
    </div>
  );
}

function ResourceCard({ title, sub, link, icon }: any) {
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className="group bg-white p-6 px-8 rounded-xl border border-slate-300/60 flex justify-between items-center hover:border-[#1E7B92] hover:shadow-sm transition-all text-[#2D3136]">
      <div className="flex items-center gap-6">
        <div className="text-3xl opacity-80 group-hover:scale-110 transition-transform duration-200">{icon}</div>
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight group-hover:text-[#1E7B92] transition-colors">{title}</h3>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">{sub}</p>
        </div>
      </div>
      <div className="text-slate-400 group-hover:text-[#1E7B92] group-hover:translate-x-0.5 transition-all text-xs">↗</div>
    </a>
  );
}

function MenuCard({ title, icon, desc, onClick }: any) {
  return (
    <div onClick={onClick} className="group p-8 bg-white rounded-xl border border-slate-300/60 text-center cursor-pointer hover:border-[#1E7B92] hover:shadow-sm hover:-translate-y-1 transition-all duration-300">
      <div className="text-5xl mb-6 transition-transform group-hover:scale-105 duration-300">{icon}</div>
      <h3 className="text-base font-black uppercase tracking-tight text-[#2D3136] group-hover:text-[#1E7B92] transition-colors">{title}</h3>
      <p className="text-xs text-slate-500 font-medium mt-3 leading-relaxed">{desc}</p>
    </div>
  );
}