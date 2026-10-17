"use client";

import { useState, useRef, useCallback } from "react";
import type { TeachingStyle } from "@/lib/agentcore/teaching";
import type { PublicQuizQuestion } from "@/types/quiz";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

const STYLES: {
  id: TeachingStyle;
  label: string;
  labelHi: string;
  shortLabel: string;
  shortLabelHi: string;
  desc: string;
  descHi: string;
}[] = [
  {
    id: "simple",
    label: "Explain simply",
    labelHi: "सरल भाषा में समझें",
    shortLabel: "Explain simply",
    shortLabelHi: "सरल भाषा",
    desc: "Plain language & everyday analogies",
    descHi: "रोज़मर्रा के उदाहरण और सीधी बात",
  },
  {
    id: "socratic",
    label: "Help me figure it out",
    labelHi: "सवालों से खुद समझें",
    shortLabel: "Help me figure it out",
    shortLabelHi: "सवाल-जवाब",
    desc: "Step-by-step guided questions",
    descHi: "कदम-दर-कदम सोचने वाले सवाल",
  },
  {
    id: "visual",
    label: "Show me visually",
    labelHi: "चित्र रूप में समझें",
    shortLabel: "Show me visually",
    shortLabelHi: "चित्र और मॉडल",
    desc: "Mental models & box-and-pointer traces",
    descHi: "मानसिक मॉडल और बॉक्स-पॉइंटर चित्र",
  },
  {
    id: "interview",
    label: "Prepare me for interviews",
    labelHi: "इंटरव्यू की तैयारी",
    shortLabel: "Prepare me for interviews",
    shortLabelHi: "इंटरव्यू तैयारी",
    desc: "Complexity trade-offs & edge cases",
    descHi: "टाइम-स्पेस ट्रेड-ऑफ और एज केस",
  },
];

function localFallback(topic: string, style: TeachingStyle, hindi: boolean): string {
  if (style === "socratic")
    return hindi
      ? `सोचें: ${topic} में कौन-सी जानकारी सबसे जल्दी ढूंढी जा सकती है?`
      : `Think about it — what information in ${topic} can be found fastest, and why does index-based access matter?`;
  if (style === "visual")
    return hindi
      ? `कल्पना करें: ${topic} एक पंक्ति में रखे डिब्बों की तरह है जहाँ हर डिब्बे का अपना नंबर होता है।`
      : `Picture a row of numbered boxes — that's ${topic}. Each box holds one value at a fixed position, giving you direct lookup.`;
  if (style === "interview")
    return hindi
      ? `इंटरव्यू में पूछा जाए: "${topic} कब उपयोगी है और इसकी सीमाएँ क्या हैं?"`
      : `A common question: "When would you choose ${topic}, and what are its trade-offs?" Use it for fast indexed reads; reconsider when frequent middle insertions are needed.`;
  return hindi
    ? `${topic} जानकारी को एक सुव्यवस्थित तरीके से रखती है ताकि उसे तुरंत ढूंढा और पढ़ा जा सके।`
    : `${topic} organises information so every element is reachable in a predictable way — a foundational building block in programming.`;
}

function Cursor() {
  return (
    <span className="ed-cursor" aria-hidden="true">
      ▌
    </span>
  );
}

export function ExplainDifferently({
  topic,
  topicSlug,
  weakConcepts,
  language = "en",
}: {
  topic: string;
  topicSlug?: string;
  weakConcepts?: string[];
  language?: string;
}) {
  const hindi = language === "hi";
  const [style, setStyle] = useState<TeachingStyle>("simple");
  const [streaming, setStreaming] = useState(false);
  const [text, setText] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [recommended, setRecommended] = useState<TeachingStyle | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Follow-up targeted re-test state
  const [followUpQuestion, setFollowUpQuestion] = useState<{
    question: PublicQuizQuestion;
    quizToken: string;
  } | null>(null);
  const [retestChoice, setRetestChoice] = useState<number | null>(null);
  const [retestLoading, setRetestLoading] = useState(false);
  const [retestFeedback, setRetestFeedback] = useState<{
    isCorrect: boolean;
    explanation: string;
  } | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchExplanation = useCallback(
    async (chosenStyle: TeachingStyle) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStyle(chosenStyle);
      setStreaming(true);
      setError(null);
      setText("");
      setFollowUp("");
      setRecommended(null);
      setConfidence(null);
      setFollowUpQuestion(null);
      setRetestChoice(null);
      setRetestFeedback(null);

      try {
        const res = await fetch("/api/teach", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            topic,
            topicSlug,
            weakConcepts,
            question: hindi
              ? `इस विषय को ${chosenStyle} तरीके से समझाएं।`
              : `Explain this topic in a ${chosenStyle} way.`,
            style: chosenStyle,
            language,
          }),
          signal: controller.signal,
        });

        if (res.status === 401) {
          const words = localFallback(topic, chosenStyle, hindi).split(" ");
          for (const word of words) {
            if (controller.signal.aborted) return;
            await new Promise((r) => setTimeout(r, 35));
            setText((t) => (t ? t + " " + word : word));
          }
          setStreaming(false);
          return;
        }

        if (!res.ok)
          throw new Error(
            hindi
              ? "अभी व्याख्या तैयार नहीं हो सकी। कृपया दोबारा कोशिश करें।"
              : "We couldn't prepare that explanation right now. Please try again.",
          );

        const data = (await res.json()) as {
          explanation: string;
          followUp: string;
          recommendedStyle: TeachingStyle;
          confidence?: number;
          followUpQuestion?: {
            question: PublicQuizQuestion;
            quizToken: string;
          };
        };

        const chars = data.explanation.split("");
        for (const char of chars) {
          if (controller.signal.aborted) return;
          const delay = chars.length > 500 ? 3 : 8;
          await new Promise((r) => setTimeout(r, delay));
          setText((t) => t + char);
        }

        setFollowUp(data.followUp ?? "");
        setRecommended(data.recommendedStyle ?? null);
        setConfidence(data.confidence ?? null);
        if (data.followUpQuestion) {
          setFollowUpQuestion(data.followUpQuestion);
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(
          e instanceof Error
            ? e.message
            : hindi
              ? "कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।"
              : "Something went wrong. Please try again.",
        );
      } finally {
        setStreaming(false);
      }
    },
    [topic, topicSlug, weakConcepts, language, hindi],
  );

  async function verifyRetestAnswer() {
    if (retestChoice === null || !followUpQuestion) return;
    setRetestLoading(true);
    try {
      const slug =
        topicSlug || topic.toLowerCase().trim().replace(/\s+/g, "-");
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topicSlug: slug,
          answers: [retestChoice],
          language,
          style,
          quizToken: followUpQuestion.quizToken,
          questions: [followUpQuestion.question],
          isRetest: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const graded = data.gradedQuestions?.[0];
        const isCorrect = graded ? graded.isCorrect : data.score === 100;
        setRetestFeedback({
          isCorrect,
          explanation:
            graded?.explanation ??
            (isCorrect
              ? hindi
                ? "बिल्कुल सही! आपकी समझ पक्की हो गई है।"
                : "Correct! Your understanding is verified."
              : hindi
                ? "ऊपर दी गई व्याख्या को एक बार फिर देखें और छोटे उदाहरण पर सोचें।"
                : "Review the explanation above and trace a small example."),
        });
      }
    } catch {
      /* ignore */
    } finally {
      setRetestLoading(false);
    }
  }

  const hasContent = text.length > 0;
  const activeStyle = STYLES.find((s) => s.id === style);

  return (
    <div className="ed-box">
      <div className="ed-header">
        <span className="eyebrow">
          {hindi ? "अलग दृष्टिकोण" : "Explain differently"}
        </span>
        <h3 className="ed-title">
          {hindi
            ? "इसे किसी और तरीके से समझना चाहते हैं?"
            : "Want to understand this another way?"}
        </h3>
        <p className="ed-subtitle">
          {hindi
            ? "वह तरीका चुनें जो आपके सीखने के ढंग से सबसे अच्छा मेल खाए।"
            : "Choose the learning style that fits how you think best."}
        </p>
      </div>

      {/* Style selector */}
      <div
        className="ed-style-grid"
        role="group"
        aria-label={
          hindi ? "समझने का तरीका चुनें" : "Choose an explanation style"
        }
      >
        {STYLES.map((s) => {
          const isActive = style === s.id && (hasContent || streaming);
          const isPulsing = streaming && style === s.id;
          return (
            <button
              key={s.id}
              id={`explain-style-${s.id}`}
              type="button"
              aria-pressed={isActive}
              className={`ed-style-btn${isActive ? " ed-active" : ""}${isPulsing ? " ed-pulsing" : ""}`}
              onClick={() => fetchExplanation(s.id)}
              disabled={streaming}
            >
              <span className="ed-style-label">
                {hindi ? s.labelHi : s.label}
              </span>
              <span className="ed-style-desc">
                {hindi ? s.descHi : s.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {streaming && !hasContent && (
        <LoadingState
          language={hindi ? "hi" : "en"}
          label={
            hindi
              ? "आपकी व्याख्या तैयार हो रही है…"
              : "Preparing your explanation…"
          }
        />
      )}

      {/* Error state */}
      {error && !streaming && (
        <ErrorState
          language={hindi ? "hi" : "en"}
          message={error}
          onRetry={() => fetchExplanation(style)}
        />
      )}

      {/* Result */}
      {hasContent && (
        <div className="ed-result">
          <div className="ed-result-badge">
            <span>{hindi ? activeStyle?.labelHi : activeStyle?.label}</span>
          </div>

          <div className="ed-explanation">
            <p>
              {text}
              {streaming && <Cursor />}
            </p>
          </div>

          {!streaming && confidence !== null && (
            <div className="ed-confidence">
              <ProgressBar
                value={confidence}
                label={hindi ? "स्पष्टता स्तर" : "Clarity match"}
                showValue
                size="sm"
              />
            </div>
          )}

          {!streaming && followUp && (
            <div className="ed-followup">
              <span className="eyebrow">
                {hindi ? "सोचकर देखें:" : "Think about this:"}
              </span>
              <p>{followUp}</p>
            </div>
          )}

          {/* Targeted 1-question check right inside Explain Differently */}
          {!streaming && followUpQuestion && (
            <div
              style={{
                padding: "16px 18px",
                borderTop: "1px solid var(--border)",
                background: "var(--bg-surface)",
              }}
            >
              <span className="eyebrow">
                {hindi
                  ? `समझ की जाँच · ${followUpQuestion.question.concept}`
                  : `Quick check · ${followUpQuestion.question.concept}`}
              </span>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  margin: "6px 0 12px",
                  color: "var(--text)",
                }}
              >
                {followUpQuestion.question.prompt}
              </p>
              <div className="qs-options">
                {followUpQuestion.question.options.map((opt, idx) => {
                  const isSel = retestChoice === idx;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={Boolean(retestFeedback)}
                      className={`qs-option${isSel ? " qs-option-selected" : ""}`}
                      onClick={() => setRetestChoice(idx)}
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

              {!retestFeedback ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "10px",
                  }}
                >
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={retestChoice === null || retestLoading}
                    onClick={verifyRetestAnswer}
                  >
                    {retestLoading
                      ? hindi
                        ? "जाँच हो रही है…"
                        : "Checking…"
                      : hindi
                        ? "उत्तर जाँचें →"
                        : "Check answer →"}
                  </Button>
                </div>
              ) : (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    background: retestFeedback.isCorrect
                      ? "var(--success-soft)"
                      : "var(--warning-soft)",
                    border: `1px solid ${
                      retestFeedback.isCorrect
                        ? "var(--success-border)"
                        : "var(--warning-border)"
                    }`,
                    fontSize: "0.875rem",
                  }}
                >
                  <strong
                    style={{
                      color: retestFeedback.isCorrect
                        ? "var(--success)"
                        : "var(--warning)",
                      display: "block",
                      marginBottom: "2px",
                    }}
                  >
                    {retestFeedback.isCorrect
                      ? hindi
                        ? "✓ सही उत्तर! समझ में सुधार दर्ज किया गया।"
                        : "✓ Correct! Improvement recorded."
                      : hindi
                        ? "△ एक बार और सोचें:"
                        : "△ Let's review:"}
                  </strong>
                  <span>{retestFeedback.explanation}</span>
                </div>
              )}
            </div>
          )}

          {!streaming && recommended && recommended !== style && (
            <div className="ed-recommend">
              {(() => {
                const rec = STYLES.find((s) => s.id === recommended);
                return (
                  <>
                    <span>
                      {hindi
                        ? `सुझाव: "${rec?.labelHi}" तरीका भी आज़माकर देखें`
                        : `Next step: Try "${rec?.label}" for another perspective`}
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fetchExplanation(recommended)}
                    >
                      {hindi ? "आज़माएं →" : "Try this way →"}
                    </Button>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
