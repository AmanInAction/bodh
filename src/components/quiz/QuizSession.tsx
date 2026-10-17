"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type {
  GradedQuestionResult,
  PublicQuizQuestion,
} from "@/types/quiz";
import type { TeachingStyle } from "@/lib/agentcore/teaching";
import { getTopicTitle } from "@/lib/i18n";

type FollowUpQuestionPayload = {
  question: PublicQuizQuestion;
  quizToken: string;
};

type Assessment = {
  score: number;
  effectiveScore?: number;
  correct: number;
  total: number;
  isRetest?: boolean;
  missedConcepts?: string[];
  masteredConcepts?: string[];
  gradedQuestions?: GradedQuestionResult[];
  feedback: {
    strengths: string[];
    weaknesses: string[];
    weakConcepts?: string[];
    misconceptions?: string[];
    recommendedAction?: string;
    nextStep: string;
    reasoningSummary?: string;
    confidence: number;
    teacher: string;
    followUp: string;
  };
  recommendedStyle: TeachingStyle;
  followUpQuestion?: FollowUpQuestionPayload;
  nextStrategy: string;
  nextTopic: { slug: string; title: string };
};

// ── Animated Score Ring ───────────────────────────────────────────────────────

function ScoreRing({ score, hindi }: { score: number; hindi: boolean }) {
  const r = 56;
  const circ = 2 * Math.PI * r;
  const [animatedScore, setAnimatedScore] = useState(0);
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const duration = 900;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(eased * score);
      setAnimatedScore(current);
      setFilled(((eased * score) / 100) * circ);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, circ]);

  const color =
    score >= 80 ? "#15803D" : score >= 50 ? "#1F5C4B" : "#D96B43";
  const trackColor =
    score >= 80
      ? "rgba(21,128,61,0.1)"
      : score >= 50
        ? "rgba(31,92,75,0.1)"
        : "rgba(217,107,67,0.1)";
  return (
    <div className="score-ring-wrap" aria-label={`Score: ${score}%`}>
      <svg width="148" height="148" viewBox="0 0 148 148" aria-hidden="true">
        <circle
          cx="74"
          cy="74"
          r={r}
          fill={trackColor}
          stroke="rgba(28,43,38,0.08)"
          strokeWidth="11"
        />
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
        />
      </svg>
      <div className="score-ring-label">
        <strong className="tabular-nums" style={{ color }}>
          {animatedScore}%
        </strong>
        <span className="score-text">{hindi ? "समझ" : "understanding"}</span>
      </div>
    </div>
  );
}

// ── Animated Confidence Meter ─────────────────────────────────────────────────

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
      ? hindi
        ? "मजबूत समझ"
        : "Strong grasp"
      : confidence >= 50
        ? hindi
          ? "अच्छी प्रगति"
          : "Building steadily"
        : hindi
          ? "अभ्यास जारी रखें"
          : "Needs a quick review";

  const fillColor =
    confidence >= 75
      ? "#15803D"
      : confidence >= 50
        ? "#1F5C4B"
        : "#D96B43";

  return (
    <div className="qs-confidence">
      <div className="qs-confidence-header">
        <span className="eyebrow">
          {hindi ? "आपकी समझ का स्तर" : "How well you know this topic"}
        </span>
        <span className="qs-conf-label">{label}</span>
      </div>
      <div
        className="qs-conf-track"
        role="progressbar"
        aria-valuenow={confidence}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="qs-conf-fill"
          style={{
            width: `${width}%`,
            background: fillColor,
            transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
        <div className="qs-conf-thumb" style={{ left: `${width}%` }} />
      </div>
      <div className="qs-conf-scale">
        <span>{hindi ? "शुरुआत" : "Getting started"}</span>
        <span className="qs-conf-pct tabular-nums">{confidence}%</span>
        <span>{hindi ? "आत्मविश्वासपूर्ण" : "Confident"}</span>
      </div>
    </div>
  );
}

// ── Chip Row (strengths / weaknesses) ────────────────────────────────────────

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
          <span aria-hidden="true">{variant === "green" ? "✓" : "△"}</span>{" "}
          {item}
        </span>
      ))}
    </div>
  );
}

// ── STYLES constant ───────────────────────────────────────────────────────────

const STYLES: {
  id: TeachingStyle;
  label: string;
  labelHi: string;
}[] = [
  { id: "simple", label: "Explain simply", labelHi: "सरल भाषा में समझें" },
  {
    id: "socratic",
    label: "Help me figure it out",
    labelHi: "सवालों से खुद समझें",
  },
  { id: "visual", label: "Show me visually", labelHi: "चित्र रूप में समझें" },
  {
    id: "interview",
    label: "Prepare me for interviews",
    labelHi: "इंटरव्यू की तैयारी",
  },
];

// ── Main Component ────────────────────────────────────────────────────────────

export function QuizSession({
  topic,
  language,
  questions,
  quizToken,
  initialStyle = "simple",
}: {
  topic: string;
  language: string;
  questions: PublicQuizQuestion[];
  quizToken?: string;
  initialStyle?: TeachingStyle;
}) {
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [style, setStyle] = useState<TeachingStyle>(initialStyle);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [switchingStyle, setSwitchingStyle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Follow-up targeted re-test state (closes the learning loop)
  const [retestSelected, setRetestSelected] = useState<number | null>(null);
  const [retestLoading, setRetestLoading] = useState(false);
  const [retestResult, setRetestResult] = useState<{
    isCorrect: boolean;
    explanation: string;
    concept: string;
    newScore?: number;
  } | null>(null);

  const question = questions[current];
  const hindi = language === "hi";
  const cardRef = useRef<HTMLDivElement>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    setRetestSelected(null);
    setRetestResult(null);
    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topicSlug: topic,
          answers,
          language,
          style,
          quizToken,
          questions,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setAssessment(result);
        if (result.recommendedStyle) setStyle(result.recommendedStyle);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    } catch {
      setError(
        hindi ? "नेटवर्क में समस्या है।" : "Network error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function switchExplanationStyle(newStyle: TeachingStyle) {
    setStyle(newStyle);
    if (!assessment) return;
    setSwitchingStyle(true);
    try {
      const weakConcepts =
        assessment.missedConcepts ?? assessment.feedback.weaknesses ?? [];
      const res = await fetch("/api/teach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic: getTopicTitle(topic, language),
          topicSlug: topic,
          question:
            weakConcepts.length > 0
              ? `Explain "${weakConcepts.join(", ")}" in ${topic} using the ${newStyle} style.`
              : `Explain ${topic} using the ${newStyle} style.`,
          weakConcepts,
          style: newStyle,
          language,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssessment((prev) =>
          prev
            ? {
                ...prev,
                feedback: {
                  ...prev.feedback,
                  teacher: data.explanation ?? prev.feedback.teacher,
                  followUp: data.followUp ?? prev.feedback.followUp,
                },
                recommendedStyle: data.recommendedStyle ?? prev.recommendedStyle,
                followUpQuestion: data.followUpQuestion ?? prev.followUpQuestion,
              }
            : prev,
        );
        setRetestSelected(null);
        setRetestResult(null);
      }
    } catch {
      /* keep existing explanation on network hiccup */
    } finally {
      setSwitchingStyle(false);
    }
  }

  async function submitRetest() {
    if (
      retestSelected === null ||
      !assessment?.followUpQuestion
    ) {
      return;
    }
    setRetestLoading(true);
    try {
      const fq = assessment.followUpQuestion;
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topicSlug: topic,
          answers: [retestSelected],
          language,
          style,
          quizToken: fq.quizToken,
          questions: [fq.question],
          isRetest: true,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        const graded = result.gradedQuestions?.[0];
        const isCorrect = graded ? graded.isCorrect : result.score === 100;
        setRetestResult({
          isCorrect,
          explanation:
            graded?.explanation ??
            (isCorrect
              ? hindi
                ? "बिल्कुल सही! आपने इस अवधारणा को समझ लिया है।"
                : "Spot on! You've mastered this concept."
              : hindi
                ? "अभी भी थोड़ा अभ्यास बाकी है — ऊपर दी गई व्याख्या को एक बार फिर देखें।"
                : "Not quite — review the explanation above and trace a small example."),
          concept: fq.question.concept,
          newScore: result.effectiveScore,
        });
        if (isCorrect && typeof result.effectiveScore === "number") {
          setAssessment((prev) =>
            prev
              ? {
                  ...prev,
                  score: Math.max(prev.score, result.effectiveScore),
                }
              : prev,
          );
        }
      }
    } catch {
      /* ignore transient error */
    } finally {
      setRetestLoading(false);
    }
  }

  function choose(index: number) {
    const next = [...answers];
    next[current] = index;
    setAnswers(next);
  }

  function advance() {
    setCurrent((c) => c + 1);
    setTimeout(
      () =>
        cardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        }),
      50,
    );
  }

  // ── Assessment Screen ─────────────────────────────────────────────────────
  if (assessment) {
    const {
      feedback,
      score,
      correct,
      total,
      nextTopic,
      nextStrategy,
      recommendedStyle,
      gradedQuestions,
      followUpQuestion,
    } = assessment;

    return (
      <div className="qs-assessment">
        {/* Header with ring */}
        <div className="qs-result-header">
          <ScoreRing score={score} hindi={hindi} />
          <div className="qs-result-header-text">
            <span className="eyebrow">
              {hindi ? "आपका परिणाम" : "Practice summary"}
            </span>
            <h1 className="qs-result-title">
              {score >= 80
                ? hindi
                  ? "शानदार समझ!"
                  : "Well understood!"
                : score >= 50
                  ? hindi
                    ? "अच्छा प्रयास!"
                    : "Good progress!"
                  : hindi
                    ? "अभ्यास जारी रखें!"
                    : "Keep building!"}
            </h1>
            <p className="qs-result-sub tabular-nums">
              {correct} / {total} {hindi ? "सही उत्तर" : "correct answers"}
            </p>
          </div>
        </div>

        {/* Confidence meter */}
        {feedback.confidence !== undefined && (
          <ConfidenceMeter confidence={score} hindi={hindi} />
        )}

        {/* Learning snapshot (Agent 2 Assessment) */}
        <section className="qs-feedback-card">
          <span className="eyebrow">
            {hindi ? "आपकी समीक्षा" : "How it went"}
          </span>

          {feedback.strengths?.length > 0 && (
            <>
              <p className="qs-chip-label">
                {hindi ? "क्या अच्छा रहा" : "What went well"}
              </p>
              <ChipRow items={feedback.strengths} variant="green" />
            </>
          )}

          {feedback.weaknesses?.length > 0 && (
            <>
              <p className="qs-chip-label">
                {hindi ? "किन बातों पर ध्यान दें" : "What you need to work on"}
              </p>
              <ChipRow items={feedback.weaknesses} variant="amber" />
            </>
          )}

          {feedback.misconceptions && feedback.misconceptions.length > 0 && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--warning-soft)",
                border: "1px solid var(--warning-border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.875rem",
                color: "var(--text)",
              }}
            >
              <strong>
                {hindi ? "ध्यान देने योग्य पैटर्न: " : "Pattern noticed: "}
              </strong>
              {feedback.misconceptions[0]}
            </div>
          )}

          {/* Switch teaching style dynamically (Agent 3 Explain Differently) */}
          <div style={{ marginTop: "6px" }}>
            <p className="qs-style-prompt" style={{ marginBottom: "8px" }}>
              {hindi
                ? "इस अवधारणा को अपने पसंदीदा तरीके से समझें:"
                : "Understand this concept in another way:"}
            </p>
            <div className="qs-style-picker">
              {STYLES.map((s) => {
                const isSelected = style === s.id;
                const isRec = recommendedStyle === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={switchingStyle}
                    className={`qs-style-btn${isSelected ? " qs-style-selected" : ""}${isRec ? " qs-style-rec" : ""}`}
                    onClick={() => switchExplanationStyle(s.id)}
                  >
                    <span>{hindi ? s.labelHi : s.label}</span>
                    {isRec && (
                      <span
                        className="qs-rec-star"
                        title={hindi ? "सुझाया गया" : "Recommended"}
                      >
                        ★
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {feedback.teacher && (
            <p
              className="qs-teacher-note"
              style={{ opacity: switchingStyle ? 0.6 : 1, whiteSpace: "pre-wrap" }}
            >
              {feedback.teacher}
            </p>
          )}

          {feedback.followUp && (
            <div className="qs-followup">
              <span className="eyebrow">
                {hindi ? "सोचकर देखें:" : "Think about this:"}
              </span>
              <p>{feedback.followUp}</p>
            </div>
          )}

          {feedback.nextStep && (
            <p className="qs-nextstep">→ {feedback.nextStep}</p>
          )}
        </section>

        {/* Targeted Follow-Up Check Question (Objective D: Close the Learning Feedback Loop) */}
        {followUpQuestion && (
          <section className="qs-feedback-card card-tint">
            <span className="eyebrow">
              {hindi
                ? `त्वरित जाँच · ${followUpQuestion.question.concept}`
                : `Quick concept check · ${followUpQuestion.question.concept}`}
            </span>
            <h3 style={{ fontSize: "1.15rem", margin: "4px 0 8px" }}>
              {followUpQuestion.question.prompt}
            </h3>

            <div className="qs-options">
              {followUpQuestion.question.options.map((opt, idx) => {
                const isSel = retestSelected === idx;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={Boolean(retestResult)}
                    className={`qs-option${isSel ? " qs-option-selected" : ""}`}
                    onClick={() => setRetestSelected(idx)}
                  >
                    <span className="qs-option-letter">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="qs-option-text">{opt}</span>
                    {isSel && <span className="qs-option-check">✓</span>}
                  </button>
                );
              })}
            </div>

            {!retestResult ? (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                <button
                  type="button"
                  className="button button-primary button-sm"
                  disabled={retestSelected === null || retestLoading}
                  onClick={submitRetest}
                >
                  {retestLoading
                    ? hindi
                      ? "जाँच हो रही है…"
                      : "Checking…"
                    : hindi
                      ? "उत्तर जाँचें →"
                      : "Verify my answer →"}
                </button>
              </div>
            ) : (
              <div
                style={{
                  marginTop: "10px",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  background: retestResult.isCorrect
                    ? "var(--success-soft)"
                    : "var(--warning-soft)",
                  border: `1px solid ${
                    retestResult.isCorrect
                      ? "var(--success-border)"
                      : "var(--warning-border)"
                  }`,
                }}
              >
                <strong
                  style={{
                    color: retestResult.isCorrect
                      ? "var(--success)"
                      : "var(--warning)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {retestResult.isCorrect
                    ? hindi
                      ? "✓ शानदार सुधार! आपकी समझ अपडेट कर दी गई है।"
                      : "✓ Understanding improved! Your progress has been updated."
                    : hindi
                      ? "△ अच्छा प्रयास — नीचे कारण देखें:"
                      : "△ Good try — here is the key idea:"}
                </strong>
                <p style={{ fontSize: "0.9rem", color: "var(--text)" }}>
                  {retestResult.explanation}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Question-by-Question Review */}
        {gradedQuestions && gradedQuestions.length > 0 && (
          <section className="qs-feedback-card">
            <span className="eyebrow">
              {hindi ? "प्रश्नों की समीक्षा" : "Question review"}
            </span>
            <div style={{ display: "grid", gap: "12px" }}>
              {gradedQuestions.map((gq, i) => (
                <div
                  key={gq.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    background: "var(--bg-canvas)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      marginBottom: "4px",
                      color: gq.isCorrect ? "var(--success)" : "var(--warning)",
                    }}
                  >
                    <span>
                      {hindi ? `प्रश्न ${i + 1}` : `Question ${i + 1}`} ·{" "}
                      {gq.concept}
                    </span>
                    <span>
                      {gq.isCorrect
                        ? hindi
                          ? "✓ सही"
                          : "✓ Correct"
                        : hindi
                          ? "△ समीक्षा करें"
                          : "△ Review"}
                    </span>
                  </div>
                  <p
                    style={{
                      fontWeight: 500,
                      fontSize: "0.9375rem",
                      marginBottom: "6px",
                    }}
                  >
                    {gq.prompt}
                  </p>
                  {!gq.isCorrect && (
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                        marginBottom: "4px",
                      }}
                    >
                      <strong>{hindi ? "सही उत्तर: " : "Correct answer: "}</strong>
                      {gq.options[gq.correctAnswer]}
                    </p>
                  )}
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {gq.explanation}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Next strategy + CTA */}
        <section className="qs-feedback-card">
          <span className="eyebrow">
            {hindi ? "आगे क्या करें" : "What to do next"}
          </span>
          <p className="qs-strategy-text">{nextStrategy}</p>
        </section>

        <Link
          className="button button-primary qs-cta"
          href={`/learn/${nextTopic.slug}?language=${language}`}
        >
          {hindi
            ? `${getTopicTitle(nextTopic.slug, "hi")} पर आगे बढ़ें`
            : `Continue to ${getTopicTitle(nextTopic.slug, "en")}`}{" "}
          <span>→</span>
        </Link>
      </div>
    );
  }

  // ── Quiz Questions Screen ─────────────────────────────────────────────────

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
              ? `प्रश्न ${current + 1} / ${questions.length}`
              : `Question ${current + 1} of ${questions.length}`}
          </span>
          <span className="qs-progress-pct">{Math.round(progress)}%</span>
        </div>
        <div className="qs-progress-track">
          <div className="qs-progress-fill" style={{ width: `${progress}%` }} />
          <div className="qs-dots">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`qs-dot${
                  i < current
                    ? " qs-dot-done"
                    : i === current
                      ? " qs-dot-active"
                      : ""
                }`}
                style={{ left: `${((i + 0.5) / questions.length) * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Question card */}
      <div className="qs-card" ref={cardRef}>
        <span className="eyebrow">{hindi ? "छोटी जाँच" : "Quick check"}</span>
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
                {isSelected && <span className="qs-option-check">✓</span>}
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
            {hindi ? "पीछे" : "Back"}
          </button>
        )}

        {!isLast ? (
          <button
            className="button button-primary"
            disabled={selected === undefined}
            onClick={advance}
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
              ? hindi
                ? "जाँच हो रही है…"
                : "Checking…"
              : hindi
                ? "परिणाम देखें"
                : "See my result"}{" "}
            {!loading && <span>→</span>}
          </button>
        )}
      </div>

      {/* Answered count indicator */}
      <p className="qs-answered">
        {(() => {
          const done = answers.filter((a) => a !== undefined).length;
          return hindi
            ? `${done} / ${questions.length} प्रश्नों के उत्तर दिए`
            : `${done} of ${questions.length} answered`;
        })()}
      </p>
    </div>
  );
}
