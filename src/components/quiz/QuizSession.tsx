"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { QuizQuestion } from "@/types/quiz";
import type { TeachingStyle } from "@/lib/agentcore/teaching";

type Assessment = {
  score: number;
  correct: number;
  total: number;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    nextStep: string;
    confidence: number;
    teacher: string;
    followUp: string;
  };
  recommendedStyle: TeachingStyle;
  nextStrategy: string;
  nextTopic: { slug: string; title: string };
};

// â”€â”€ Animated Score Ring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ScoreRing({ score, hindi }: { score: number; hindi: boolean }) {
  const r = 56;
  const circ = 2 * Math.PI * r;
  const [animatedScore, setAnimatedScore] = useState(0);
  const [filled, setFilled] = useState(0);

  // Animate on mount
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const duration = 1200;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const current = Math.round(eased * score);
      setAnimatedScore(current);
      setFilled((eased * score / 100) * circ);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, circ]);

  const color =
    score >= 80 ? "#34d399" : score >= 50 ? "#a78bfa" : "#f472b6";
  const trackColor =
    score >= 80 ? "rgba(52,211,153,0.12)" : score >= 50 ? "rgba(167,139,250,0.12)" : "rgba(244,114,182,0.12)";
  const emoji = score >= 80 ? "ðŸŽ‰" : score >= 50 ? "ðŸ‘" : "ðŸ’ª";

  return (
    <div className="score-ring-wrap" aria-label={`Score: ${score}%`}>
      <svg width="148" height="148" viewBox="0 0 148 148" aria-hidden="true">
        {/* Background track */}
        <circle cx="74" cy="74" r={r} fill={trackColor} stroke="rgba(255,255,255,0.06)" strokeWidth="11" />
        {/* Animated fill */}
        <circle
          cx="74"
          cy="74"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          strokeDashoffset={circ / 4}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
        {/* Emoji cap dot */}
        {animatedScore === score && (
          <text x="74" y="78" textAnchor="middle" fontSize="20">{emoji}</text>
        )}
      </svg>
      <div className="score-ring-label">
        <strong style={{ color }}>{animatedScore}%</strong>
        <span>{hindi ? "à¤¸à¥à¤•à¥‹à¤°" : "score"}</span>
      </div>
    </div>
  );
}

// â”€â”€ Animated Confidence Meter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ConfidenceMeter({
  confidence,
  hindi,
}: {
  confidence: number;
  hindi: boolean;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(confidence), 100);
    return () => clearTimeout(timer);
  }, [confidence]);

  const label =
    confidence >= 75
      ? hindi ? "à¤‰à¤¤à¥à¤•à¥ƒà¤·à¥à¤Ÿ à¤¸à¤®à¤" : "Strong understanding"
      : confidence >= 50
      ? hindi ? "à¤…à¤šà¥à¤›à¥€ à¤ªà¥à¤°à¤—à¤¤à¤¿" : "Good progress"
      : hindi ? "à¤…à¤­à¥à¤¯à¤¾à¤¸ à¤œà¤¾à¤°à¥€ à¤°à¤–à¥‡à¤‚" : "Keep practising";

  const fillColor =
    confidence >= 75
      ? "linear-gradient(90deg,#34d399,#059669)"
      : confidence >= 50
      ? "linear-gradient(90deg,#a78bfa,#7c3aed)"
      : "linear-gradient(90deg,#f472b6,#db2777)";

  return (
    <div className="qs-confidence">
      <div className="qs-confidence-header">
        <span className="eyebrow">
          {hindi ? "AI à¤†à¤¤à¥à¤®à¤µà¤¿à¤¶à¥à¤µà¤¾à¤¸ à¤¸à¥à¤¤à¤°" : "AI confidence in your understanding"}
        </span>
        <span className="qs-conf-label">{label}</span>
      </div>
      <div className="qs-conf-track">
        <div
          className="qs-conf-fill"
          style={{
            width: `${width}%`,
            background: fillColor,
            transition: "width 1s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
        <div className="qs-conf-thumb" style={{ left: `${width}%` }} />
      </div>
      <div className="qs-conf-scale">
        <span>{hindi ? "à¤¨à¥Œà¤¸à¤¿à¤–à¤¿à¤¯à¤¾" : "Novice"}</span>
        <span className="qs-conf-pct">{confidence}%</span>
        <span>{hindi ? "à¤µà¤¿à¤¶à¥‡à¤·à¤œà¥à¤ž" : "Expert"}</span>
      </div>
    </div>
  );
}

// â”€â”€ Chip Row (strengths / weaknesses) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ChipRow({
  items,
  variant,
}: {
  items: string[];
  variant: "green" | "amber";
}) {
  if (!items.length) return null;
  return (
    <div className="qs-chip-row">
      {items.map((item, i) => (
        <span
          key={item}
          className={`qs-chip qs-chip-${variant}`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {variant === "green" ? "âœ“" : "â–³"} {item}
        </span>
      ))}
    </div>
  );
}

// â”€â”€ STYLES constant â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STYLES: {
  id: TeachingStyle;
  label: string;
  labelHi: string;
  icon: string;
  gradient: string;
}[] = [
  { id: "simple",    label: "Simple",    labelHi: "à¤¸à¤°à¤²",       icon: "ðŸ’¡", gradient: "linear-gradient(135deg,#34d399,#059669)" },
  { id: "socratic",  label: "Socratic",  labelHi: "à¤¸à¤µà¤¾à¤²-à¤œà¤µà¤¾à¤¬", icon: "â“", gradient: "linear-gradient(135deg,#a78bfa,#7c3aed)" },
  { id: "visual",    label: "Visual",    labelHi: "à¤¦à¥ƒà¤¶à¥à¤¯",      icon: "ðŸŽ¨", gradient: "linear-gradient(135deg,#60a5fa,#2563eb)" },
  { id: "interview", label: "Interview", labelHi: "à¤‡à¤‚à¤Ÿà¤°à¤µà¥à¤¯à¥‚",   icon: "ðŸŽ¤", gradient: "linear-gradient(135deg,#f472b6,#db2777)" },
];

// â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function QuizSession({
  topic,
  language,
  questions,
}: {
  topic: string;
  language: string;
  questions: QuizQuestion[];
}) {
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [style, setStyle] = useState<TeachingStyle>("simple");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const question = questions[current];
  const hindi = language === "hi";
  const cardRef = useRef<HTMLDivElement>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topicSlug: topic, answers, language, style, questions }),
      });
      const result = await response.json();
      if (response.ok) {
        setAssessment(result);
        if (result.recommendedStyle) setStyle(result.recommendedStyle);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    } catch {
      setError(hindi ? "à¤¨à¥‡à¤Ÿà¤µà¤°à¥à¤• à¤®à¥‡à¤‚ à¤¸à¤®à¤¸à¥à¤¯à¤¾ à¤¹à¥ˆà¥¤" : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function choose(index: number) {
    const next = [...answers];
    next[current] = index;
    setAnswers(next);
  }

  function advance() {
    setCurrent((c) => c + 1);
    // Scroll card into view smoothly
    setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
  }

  // â”€â”€ Assessment Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (assessment) {
    const { feedback, score, correct, total, nextTopic, nextStrategy, recommendedStyle } = assessment;

    return (
      <div className="qs-assessment">
        {/* Header with ring */}
        <div className="qs-result-header">
          <ScoreRing score={score} hindi={hindi} />
          <div className="qs-result-header-text">
            <span className="eyebrow">{hindi ? "à¤†à¤ªà¤•à¤¾ à¤ªà¤°à¤¿à¤£à¤¾à¤®" : "Your result"}</span>
            <h1 className="qs-result-title">
              {score >= 80
                ? hindi ? "à¤¶à¤¾à¤¨à¤¦à¤¾à¤°!" : "Excellent!"
                : score >= 50
                ? hindi ? "à¤…à¤šà¥à¤›à¤¾ à¤ªà¥à¤°à¤¯à¤¾à¤¸!" : "Good effort!"
                : hindi ? "à¤«à¤¿à¤° à¤•à¥‹à¤¶à¤¿à¤¶ à¤•à¤°à¥‡à¤‚!" : "Keep going!"}
            </h1>
            <p className="qs-result-sub">
              {correct} / {total} {hindi ? "à¤¸à¤¹à¥€ à¤‰à¤¤à¥à¤¤à¤°" : "correct answers"}
            </p>
          </div>
        </div>

        {/* Confidence meter */}
        {feedback.confidence !== undefined && (
          <ConfidenceMeter confidence={feedback.confidence} hindi={hindi} />
        )}

        {/* Learning snapshot */}
        <section className="qs-feedback-card">
          <span className="eyebrow">{hindi ? "à¤†à¤ªà¤•à¥€ à¤à¤²à¤•" : "Your learning snapshot"}</span>

          {feedback.strengths?.length > 0 && (
            <>
              <p className="qs-chip-label">{hindi ? "à¤¤à¤¾à¤•à¤¤" : "Strengths"}</p>
              <ChipRow items={feedback.strengths} variant="green" />
            </>
          )}

          {feedback.weaknesses?.length > 0 && (
            <>
              <p className="qs-chip-label">{hindi ? "à¤¸à¥à¤§à¤¾à¤° à¤•à¥€ à¤œà¤°à¥‚à¤°à¤¤" : "Areas to improve"}</p>
              <ChipRow items={feedback.weaknesses} variant="amber" />
            </>
          )}

          {feedback.teacher && (
            <p className="qs-teacher-note">{feedback.teacher}</p>
          )}

          {feedback.followUp && (
            <div className="qs-followup">
              <span className="eyebrow">{hindi ? "à¤¸à¥‹à¤šà¥‡à¤‚:" : "Think about this:"}</span>
              <p>{feedback.followUp}</p>
            </div>
          )}

          {feedback.nextStep && (
            <p className="qs-nextstep">â†’ {feedback.nextStep}</p>
          )}
        </section>

        {/* Next strategy + style picker */}
        <section className="qs-feedback-card">
          <span className="eyebrow">{hindi ? "à¤…à¤—à¤²à¥€ à¤°à¤£à¤¨à¥€à¤¤à¤¿" : "Next strategy"}</span>
          <p className="qs-strategy-text">{nextStrategy}</p>

          <p className="qs-style-prompt">
            {hindi ? "à¤¸à¥€à¤–à¤¨à¥‡ à¤•à¥€ à¤¶à¥ˆà¤²à¥€ à¤šà¥à¤¨à¥‡à¤‚:" : "Choose how you want to learn next:"}
          </p>
          <div className="qs-style-picker">
            {STYLES.map((s) => {
              const isSelected = style === s.id;
              const isRec = recommendedStyle === s.id;
              return (
                <button
                  key={s.id}
                  className={`qs-style-btn${isSelected ? " qs-style-selected" : ""}${isRec ? " qs-style-rec" : ""}`}
                  onClick={() => setStyle(s.id)}
                  style={isSelected ? { background: s.gradient } : undefined}
                >
                  <span className="qs-style-icon">{s.icon}</span>
                  <span>{hindi ? s.labelHi : s.label}</span>
                  {isRec && <span className="qs-rec-star" title={hindi ? "AI à¤¸à¥à¤à¤¾à¤µ" : "AI recommended"}>â˜…</span>}
                </button>
              );
            })}
          </div>
          {recommendedStyle && (
            <p className="qs-rec-note">
              ðŸ’¡ {hindi
                ? `AI à¤¸à¥à¤à¤¾à¤µ: "${STYLES.find((s) => s.id === recommendedStyle)?.labelHi}" à¤¶à¥ˆà¤²à¥€`
                : `AI recommends: "${STYLES.find((s) => s.id === recommendedStyle)?.label}" style`}
            </p>
          )}
        </section>

        {/* CTA */}
        <Link
          className="button button-primary qs-cta"
          href={`/learn/${nextTopic.slug}?language=${language}`}
        >
          {hindi ? `${nextTopic.title} à¤ªà¤° à¤†à¤—à¥‡ à¤¬à¤¢à¤¼à¥‡à¤‚` : `Continue to ${nextTopic.title}`}{" "}
          <span>â†’</span>
        </Link>
      </div>
    );
  }

  // â”€â”€ Quiz Questions Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const selected = answers[current];
  const progress = ((current + 1) / questions.length) * 100;
  const isLast = current === questions.length - 1;

  return (
    <div className="qs-session">
      {/* Progress bar */}
      <div className="qs-progress-bar">
        <div className="qs-progress-meta">
          <span className="qs-progress-label">
            {hindi
              ? `à¤ªà¥à¤°à¤¶à¥à¤¨ ${current + 1} / ${questions.length}`
              : `Question ${current + 1} of ${questions.length}`}
          </span>
          <span className="qs-progress-pct">{Math.round(progress)}%</span>
        </div>
        <div className="qs-progress-track">
          <div className="qs-progress-fill" style={{ width: `${progress}%` }} />
          {/* Question dots */}
          <div className="qs-dots">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`qs-dot${i < current ? " qs-dot-done" : i === current ? " qs-dot-active" : ""}`}
                style={{ left: `${((i + 0.5) / questions.length) * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Question card */}
      <div className="qs-card" ref={cardRef}>
        <span className="eyebrow">{hindi ? "à¤›à¥‹à¤Ÿà¥€ à¤œà¤¾à¤à¤š" : "Quick check"}</span>
        <h2 className="qs-question">{question.prompt}</h2>

        <div className="qs-options">
          {question.options.map((option, index) => {
            const isSelected = selected === index;
            return (
              <button
                className={`qs-option${isSelected ? " qs-option-selected" : ""}`}
                key={option}
                onClick={() => choose(index)}
              >
                <span className="qs-option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="qs-option-text">{option}</span>
                {isSelected && <span className="qs-option-check">âœ“</span>}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="qs-error">{error}</p>}

      {/* Actions */}
      <div className="qs-actions">
        {current > 0 && (
          <button
            className="button button-quiet"
            onClick={() => {
                        setCurrent(current - 1);
            }}
          >
            {hindi ? "à¤ªà¥€à¤›à¥‡" : "Back"}
          </button>
        )}

        {!isLast ? (
          <button
            className="button button-primary"
            disabled={selected === undefined}
            onClick={advance}
          >
            {hindi ? "à¤…à¤—à¤²à¤¾" : "Next"} <span>â†’</span>
          </button>
        ) : (
          <button
            className="button button-primary"
            disabled={selected === undefined || loading}
            onClick={submit}
          >
            {loading
              ? hindi ? "à¤œà¤¾à¤à¤š à¤¹à¥‹ à¤°à¤¹à¥€ à¤¹à¥ˆâ€¦" : "Checkingâ€¦"
              : hindi ? "à¤ªà¤°à¤¿à¤£à¤¾à¤® à¤¦à¥‡à¤–à¥‡à¤‚" : "See my result"}{" "}
            {!loading && <span>â†’</span>}
          </button>
        )}
      </div>

      {/* Answered count indicator */}
      <p className="qs-answered">
        {(() => {
          const done = answers.filter((a) => a !== undefined).length;
          return hindi
            ? `${done} / ${questions.length} à¤ªà¥à¤°à¤¶à¥à¤¨à¥‹à¤‚ à¤•à¥‡ à¤‰à¤¤à¥à¤¤à¤° à¤¦à¤¿à¤`
            : `${done} of ${questions.length} answered`;
        })()}
      </p>
    </div>
  );
}

