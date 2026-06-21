"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, FileText, Brain, Pill, CheckCircle,
  Calendar, Trophy, TrendingUp, Flame,
} from "lucide-react";
import {
  Bar, BarChart, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizSession   { score: number; date: string }
interface OcrScan       { accuracy: number; date: string }
interface DrugCheck     { date: string }
interface ActivityDay   { day: string; quizzes: number; flashcards: number; ocr: number }

interface Stats {
  totalQuizzes:   number;
  avgPct:         number;
  xp:             number;
  flashMastered:  number;
  ocrScans:       number;
  ocrAccuracy:    number;
  drugChecks:     number;
  memoryScore:    number;
  streak:         number;
}

interface Badge {
  id:        string;
  name:      string;
  desc:      string;
  icon:      React.ReactNode;
  earned:    boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_NAMES = [
  "Intern", "Resident", "Pharmacist",
  "Senior Pharmacist", "Clinical Expert", "RxLearn Master",
];
const LEVEL_THRESHOLDS = [0, 500, 1200, 2200, 3500, 5000, Infinity];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLevelInfo(xp: number) {
  let lvl = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) lvl = i;
  }
  const current = LEVEL_THRESHOLDS[lvl];
  const next    = LEVEL_THRESHOLDS[lvl + 1];
  const pct     = next === Infinity ? 100 : Math.round(((xp - current) / (next - current)) * 100);
  const remaining = next === Infinity ? 0 : next - xp;
  return { level: lvl + 1, name: LEVEL_NAMES[lvl] ?? "Master", pct, remaining, next };
}

function calcStreak(
  history: QuizSession[],
  ocrScans: OcrScan[],
  drugChecks: DrugCheck[],
): number {
  const dates = new Set(
    [...history, ...ocrScans, ...drugChecks]
      .filter((i) => i.date)
      .map((i) => new Date(i.date).toDateString()),
  );
  let streak = 0;
  const d = new Date();
  while (dates.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function buildActivityData(
  history: QuizSession[],
  ocrScans: OcrScan[],
): ActivityDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toDateString();
    return {
      day: d.toLocaleDateString("en-GB", { weekday: "short" }),
      quizzes:    history.filter((h) => new Date(h.date).toDateString() === ds).length,
      flashcards: 0,
      ocr:        ocrScans.filter((s) => new Date(s.date).toDateString() === ds).length,
    };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon,
}: { label: string; value: string | number; sub: string; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-3">
        <span className="text-[#1E7B92]">{icon}</span> {label}
      </div>
      <p className="text-3xl font-black text-[#2D3136] leading-none">{value}</p>
      <p className="text-[11px] text-slate-400 font-medium mt-1.5">{sub}</p>
    </div>
  );
}

function ModuleCard({
  name, sub, value, barColor, bgColor, icon,
}: {
  name: string; sub: string; value: number;
  barColor: string; bgColor: string; icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-300/60 rounded-xl p-5">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-9 h-9 rounded-lg ${bgColor} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-2xl font-black text-[#2D3136] tracking-tight">{value}%</span>
      </div>
      <p className="text-sm font-bold text-[#2D3136] uppercase tracking-tight">{name}</p>
      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide mb-3">{sub}</p>
      <div className="h-1.5 bg-[#EBF0F3] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function BadgeItem({ badge }: { badge: Badge }) {
  return (
    <div
      className={`flex items-center gap-3 border rounded-xl p-3 transition-all ${
        badge.earned
          ? "border-[#1E7B92]/30 bg-[#EBF0F3]/40"
          : "border-slate-200 bg-white opacity-40"
      }`}
    >
      <div className="text-xl w-7 text-center">{badge.icon}</div>
      <div>
        <p className="text-[12px] font-bold text-[#2D3136] uppercase tracking-tight">{badge.name}</p>
        <p className="text-[10px] text-slate-400 font-medium">{badge.desc}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProgressPage() {
  const router = useRouter();
  const [stats, setStats]         = useState<Stats | null>(null);
  const [history, setHistory]     = useState<QuizSession[]>([]);
  const [badges, setBadges]       = useState<Badge[]>([]);
  const [activityData, setActivity] = useState<ActivityDay[]>([]);
  const [streakDays, setStreakDays]  = useState<{ date: Date; active: boolean }[]>([]);
  const [animXP, setAnimXP]       = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const quizHistory: QuizSession[]  = JSON.parse(localStorage.getItem("rxlearn_history")       || "[]");
    const knownCards:  string[]        = JSON.parse(localStorage.getItem("rxlearn_known_cards")   || "[]");
    const ocrScans:    OcrScan[]       = JSON.parse(localStorage.getItem("rxlearn_ocr_scans")     || "[]");
    const drugChecks:  DrugCheck[]     = JSON.parse(localStorage.getItem("rxlearn_drug_checks")   || "[]");

    const totalScore   = quizHistory.reduce((a, c) => a + c.score, 0);
    const avgPct       = quizHistory.length > 0
      ? Math.round((totalScore / (quizHistory.length * 20)) * 100)
      : 0;
    const xp           = totalScore * 10 + knownCards.length * 5 + ocrScans.length * 15 + drugChecks.length * 8;
    const ocrAvg       = ocrScans.length > 0
      ? Math.round(ocrScans.reduce((a, s) => a + (s.accuracy ?? 0), 0) / ocrScans.length)
      : 0;
    const memScore     = knownCards.length > 0
      ? Math.min(100, Math.round((knownCards.length / Math.max(knownCards.length, 30)) * 100))
      : 0;

    const computed: Stats = {
      totalQuizzes:  quizHistory.length,
      avgPct,
      xp,
      flashMastered: knownCards.length,
      ocrScans:      ocrScans.length,
      ocrAccuracy:   ocrAvg,
      drugChecks:    drugChecks.length,
      memoryScore:   memScore,
      streak:        calcStreak(quizHistory, ocrScans, drugChecks),
    };

    setStats(computed);
    setHistory(quizHistory);
    setActivity(buildActivityData(quizHistory, ocrScans));

    // 30-day streak calendar
    const activeDates = new Set(
      [...quizHistory, ...ocrScans, ...drugChecks]
        .filter((i) => i.date)
        .map((i) => new Date(i.date).toDateString()),
    );
    const today = new Date();
    setStreakDays(
      Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (29 - i));
        return { date: d, active: activeDates.has(d.toDateString()) };
      }),
    );

    // Badges
    setBadges([
      { id:"first_quiz",  name:"First dose",        desc:"Completed first quiz",     icon:"💊", earned: quizHistory.length >= 1 },
      { id:"quiz5",       name:"Quiz streak ×5",    desc:"Completed 5 quizzes",      icon:"🧪", earned: quizHistory.length >= 5 },
      { id:"flash10",     name:"Memory keeper",     desc:"Mastered 10 flashcards",   icon:"🃏", earned: knownCards.length >= 10 },
      { id:"ocr1",        name:"Script reader",     desc:"Scanned first prescription",icon:"📋",earned: ocrScans.length >= 1 },
      { id:"drug5",       name:"Interaction hunter",desc:"Checked 5 drug pairs",     icon:"⚗️", earned: drugChecks.length >= 5 },
      { id:"xp1000",      name:"Knowledge surge",   desc:"Earned 1000 XP",           icon:"⚡", earned: xp >= 1000 },
    ]);

    // Animate XP counter
    let start: number | null = null;
    const duration = 1200;
    function tick(ts: number) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimXP(Math.round(ease * xp));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (!stats) return null;

  const lvl = getLevelInfo(stats.xp);

  return (
    <div className="max-w-6xl mx-auto px-6 pb-24 space-y-10">

      {/* ── Top bar ── */}
      <div className="flex items-start justify-between gap-4 pt-2 pb-6 border-b border-slate-300/60">
        <div>
          <h1 className="text-3xl font-black text-[#2D3136] tracking-tight uppercase">My progress</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">RxLearn · Academic year 2025–26</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-300 text-[#1E7B92] text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg shrink-0 shadow-sm">
          <Zap className="w-3.5 h-3.5 fill-current" />
          {animXP.toLocaleString()} XP · Level {lvl.level}
        </div>
      </div>

      {/* ── Level bar ── */}
      <div>
        <div className="flex justify-between text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">
          <span className="text-[#2D3136]">Level {lvl.level} — {lvl.name}</span>
          <span>
            {lvl.remaining > 0
              ? `${stats.xp.toLocaleString()} / ${lvl.next.toLocaleString()} XP to next level`
              : "Max level reached"}
          </span>
        </div>
        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1E7B92] rounded-full transition-all duration-[1400ms] ease-out"
            style={{ width: `${lvl.pct}%` }}
          />
        </div>
      </div>

      {/* ── Stat grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Quizzes"        value={stats.totalQuizzes}  sub={`avg ${stats.avgPct}%`}           icon={<CheckCircle className="w-3.5 h-3.5" />} />
        <StatCard label="Flashcards"     value={stats.flashMastered} sub="mastered"                         icon={<Brain className="w-3.5 h-3.5" />} />
        <StatCard label="OCR scans"      value={stats.ocrScans}      sub={`accuracy ${stats.ocrAccuracy}%`} icon={<FileText className="w-3.5 h-3.5" />} />
        <StatCard label="Drug checks"    value={stats.drugChecks}    sub="interactions checked"              icon={<Pill className="w-3.5 h-3.5" />} />
        <StatCard label="Memory power"   value={`${stats.memoryScore}%`} sub={`${stats.flashMastered} cards retained`} icon={<TrendingUp className="w-3.5 h-3.5" />} />
        <StatCard label="Study streak"   value={stats.streak}        sub="days in a row"                    icon={<Flame className="w-3.5 h-3.5" />} />
      </div>

      {/* ── Module mastery ── */}
      <div>
        <h2 className="text-xs font-black uppercase text-[#2D3136] tracking-wider mb-4">Module mastery</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ModuleCard
            name="MCQ battle arena"   sub="Quiz performance"
            value={stats.avgPct}
            bgColor="bg-slate-50" barColor="bg-[#1E7B92]"
            icon={<CheckCircle className="w-4 h-4 text-[#1E7B92]" />}
          />
          <ModuleCard
            name="Flashcard lab"      sub="Mastery score"
            value={Math.min(100, stats.flashMastered * 3)}
            bgColor="bg-slate-50" barColor="bg-[#1E7B92]"
            icon={<Brain className="w-4 h-4 text-[#1E7B92]" />}
          />
          <ModuleCard
            name="Neural Rx lab"      sub="OCR scan accuracy"
            value={stats.ocrAccuracy}
            bgColor="bg-slate-50" barColor="bg-[#00A3E0]"
            icon={<FileText className="w-4 h-4 text-[#00A3E0]" />}
          />
          <ModuleCard
            name="Drug interaction checker" sub="Usage engagement"
            value={Math.min(100, stats.drugChecks * 10)}
            bgColor="bg-slate-50" barColor="bg-slate-500"
            icon={<Pill className="w-4 h-4 text-slate-500" />}
          />
        </div>
      </div>

      {/* ── History + Badges ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Quiz history */}
        <div className="bg-white border border-slate-300/60 rounded-xl p-6 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#2D3136] mb-4">Quiz history</h2>
          {history.length === 0 ? (
            <p className="text-xs text-slate-400 font-bold uppercase text-center py-8">No quiz sessions yet</p>
          ) : (
            <div className="space-y-2">
              {history
                .slice(-6)
                .reverse()
                .map((h, i) => {
                  const pct = Math.round((h.score / 20) * 100);
                  const label = new Date(h.date).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short",
                  });
                  return (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-none">
                      <span className="text-xs font-bold text-slate-600 w-10 shrink-0">{pct}%</span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1E7B92] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0">{label}</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="bg-white border border-slate-300/60 rounded-xl p-6 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#2D3136] mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#1E7B92]" /> Achievements
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {badges.map((b) => (
              <BadgeItem key={b.id} badge={b} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Weekly activity chart ── */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-wider text-[#2D3136] mb-2">Weekly activity</h2>
        <div className="flex gap-4 mb-4 flex-wrap">
          {[
            { color: "bg-[#1E7B92]", label: "Quizzes" },
            { color: "bg-slate-400", label: "Flashcards" },
            { color: "bg-[#00A3E0]", label: "OCR" },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span className={`w-2.5 h-2.5 rounded-sm ${l.color}`} /> {l.label}
            </span>
          ))}
        </div>
        <div className="bg-white border border-slate-300/60 rounded-xl p-6 shadow-sm">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={activityData} barSize={12} barCategoryGap="35%">
              <CartesianGrid vertical={false} stroke="#EBF0F3" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: "bold" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: "bold" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 11, backgroundColor: "#fff", fontWeight: "bold" }}
                cursor={{ fill: "#EBF0F3" }}
              />
              <Bar dataKey="quizzes"    fill="#1E7B92" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="flashcards" fill="#94a3b8" radius={[0, 0, 0, 0]} stackId="a" />
              <Bar dataKey="ocr"        fill="#00A3E0" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 30-day streak calendar ── */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-wider text-[#2D3136] mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" /> 30-day streak calendar
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {streakDays.map(({ date, active }, i) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div
                key={i}
                title={date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all
                  ${isToday ? "bg-[#1E7B92] text-white border-[#1E7B92]" : active ? "bg-[#EBF0F3] text-[#1E7B92] border-slate-300" : "bg-slate-50 text-slate-300 border-slate-200"}`}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CTA buttons ── */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-300/60">
        {[
          { label: "Start a quiz",        mode: "quiz",       color: "bg-[#1E7B92] text-white hover:bg-[#15586e]" },
          { label: "Practice flashcards", mode: "flashcards", color: "bg-slate-600 text-white hover:bg-slate-700" },
          { label: "Scan a prescription", mode: "ocr",        color: "bg-[#00A3E0] text-white hover:bg-[#008CBA]" },
          { label: "Check drug interactions", mode: "drug",  color: "bg-slate-400 text-white hover:bg-slate-500" },
        ].map((btn) => (
          <button
            key={btn.mode}
            onClick={() => router.push(`/educational-lab?mode=${btn.mode}`)}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-sm ${btn.color}`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}