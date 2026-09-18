"use client";

import { useState } from "react";
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

// ── Score Ring (SVG) ──────────────────────────────────────────────────────────

function ScoreRing({ score, hindi }: { score: number; hindi: boolean }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? "#34d399" : score >= 50 ? "#a78bfa" : "#f472b6";
  return (
    <div className="score-ring-wrap">
      <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          strokeDashoffset={circ / 4}
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div className="score-ring-label">
        <strong>{score}%</strong>
        <span>{hindi ? "स्कोर" : "score"}</span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

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

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topicSlug: topic, answers, language, style }),
      });
      const result = await response.json();
      if (response.ok) {
        setAssessment(result);
        if (result.recommendedStyle) setStyle(result.recommendedStyle);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    } catch {
      setError(hindi ? "नेटवर्क में समस्या है।" : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Assessment / Scorecard Screen ──────────────────────────────────────────
  if (assessment) {
    const { feedback, score, correct, total, nextTopic, nextStrategy, recommendedStyle } = assessment;
    const STYLES: { id: TeachingStyle; label: string; labelHi: string }[] = [
      { id: "simple", label: "Simple", labelHi: "सरल" },
      { id: "socratic", label: "Socratic", labelHi: "सवाल-जवाब" },
      { id: "visual", label: "Visual", labelHi: "दृश्य" },
      { id: "interview", label: "Interview", labelHi: "इंटरव्यू" },
    ];

    return (
      <div className="assessment-result">
        {/* Score Ring + Header */}
        <div className="result-header">
          <ScoreRing score={score} hindi={hindi} />
          <div className="result-header-text">
            <span className="eyebrow">{hindi ? "आपका परिणाम" : "Your result"}</span>
            <h1>{score >= 80 ? (hindi ? "शानदार! 🎉" : "Excellent! 🎉") : score >= 50 ? (hindi ? "अच्छा प्रयास 👏" : "Good effort 👏") : (hindi ? "फिर कोशिश करें 💪" : "Keep going 💪")}</h1>
            <p className="result-sub">{correct} / {total} {hindi ? "सही उत्तर" : "correct answers"}</p>
          </div>
        </div>

        {/* Confidence Meter */}
        {feedback.confidence !== undefined && (
          <div className="confidence-meter">
            <span className="eyebrow">{hindi ? "AI आत्मविश्वास स्तर" : "AI confidence in your understanding"}</span>
            <div className="confidence-track">
              <div className="confidence-fill" style={{ width: `${feedback.confidence}%` }} />
            </div>
            <span className="confidence-value">{feedback.confidence}%</span>
          </div>
        )}

        {/* Strengths + Weaknesses */}
        <section className="feedback-card">
          <span className="eyebrow">{hindi ? "आपके बारे में" : "Your learning snapshot"}</span>
          {feedback.strengths?.length > 0 && (
            <div className="chip-row">
              {feedback.strengths.map((s) => (
                <span key={s} className="chip chip-green">✓ {s}</span>
              ))}
            </div>
          )}
          {feedback.weaknesses?.length > 0 && (
            <div className="chip-row">
              {feedback.weaknesses.map((w) => (
                <span key={w} className="chip chip-amber">△ {w}</span>
              ))}
            </div>
          )}
          {feedback.teacher && <p className="feedback-teacher">{feedback.teacher}</p>}
          {feedback.followUp && (
            <div className="feedback-followup">
              <span className="eyebrow">{hindi ? "सोचें:" : "Think about this:"}</span>
              <p>{feedback.followUp}</p>
            </div>
          )}
          {feedback.nextStep && (
            <p className="feedback-nextstep">→ {feedback.nextStep}</p>
          )}
        </section>

        {/* Next Strategy + Style Picker */}
        <section className="feedback-card">
          <span className="eyebrow">{hindi ? "अगली रणनीति" : "Next strategy"}</span>
          <p className="strategy-text">{nextStrategy}</p>
          <p className="style-prompt">
            {hindi ? "सीखने की शैली चुनें:" : "Choose how you want to learn next:"}
            {recommendedStyle && (
              <span className="recommended-badge">
                {hindi ? ` (AI सुझाव: ${recommendedStyle})` : ` (AI recommends: ${recommendedStyle})`}
              </span>
            )}
          </p>
          <div className="style-picker">
            {STYLES.map((s) => (
              <button
                key={s.id}
                className={`style-btn ${style === s.id ? "selected" : ""} ${recommendedStyle === s.id ? "recommended" : ""}`}
                onClick={() => setStyle(s.id)}
              >
                {hindi ? s.labelHi : s.label}
                {recommendedStyle === s.id && <span className="star">★</span>}
              </button>
            ))}
          </div>
        </section>

        {/* CTA */}
        <Link
          className="button button-primary"
          href={`/learn/${nextTopic.slug}?language=${language}`}
        >
          {hindi ? `${nextTopic.title} पर आगे बढ़ें` : `Continue to ${nextTopic.title}`}{" "}
          <span>→</span>
        </Link>
      </div>
    );
  }

  // ── Quiz Questions Screen ──────────────────────────────────────────────────

  function choose(index: number) {
    const next = [...answers];
    next[current] = index;
    setAnswers(next);
  }

  const selected = answers[current];
  return (
    <div className="quiz-session">
      <div className="quiz-progress">
        <span>
          {hindi
            ? `प्रश्न ${current + 1} / ${questions.length}`
            : `Question ${current + 1} of ${questions.length}`}
        </span>
        <div className="progress-track">
          <div style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
      </div>
      <div className="card">
        <span className="eyebrow">{hindi ? "छोटी जाँच" : "Quick check"}</span>
        <h2>{question.prompt}</h2>
        <div className="quiz-options">
          {question.options.map((option, index) => (
            <button
              className={`quiz-option ${selected === index ? "selected" : ""}`}
              key={option}
              onClick={() => choose(index)}
            >
              {String.fromCharCode(65 + index)} <span>{option}</span>
            </button>
          ))}
        </div>
      </div>
      {error && <p className="quiz-error">{error}</p>}
      <div className="quiz-actions">
        {current > 0 && (
          <button
            className="button button-quiet"
            onClick={() => setCurrent(current - 1)}
          >
            {hindi ? "पीछे" : "Back"}
          </button>
        )}
        {current < questions.length - 1 ? (
          <button
            className="button button-primary"
            disabled={selected === undefined}
            onClick={() => setCurrent(current + 1)}
          >
            {hindi ? "अगला" : "Next"} <span>→</span>
          </button>
        ) : (
          <button
            className="button button-primary"
            disabled={selected === undefined || loading}
            onClick={submit}
          >
            {loading
              ? hindi ? "जाँच हो रही है..." : "Checking..."
              : hindi ? "परिणाम देखें" : "See my result"}{" "}
            <span>→</span>
          </button>
        )}
      </div>
    </div>
  );
}
