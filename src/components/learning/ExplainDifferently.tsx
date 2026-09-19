"use client";

import { useState, useRef, useCallback } from "react";
import type { TeachingStyle } from "@/lib/agentcore/teaching";

const STYLES: {
  id: TeachingStyle;
  label: string;
  labelHi: string;
  icon: string;
  desc: string;
  descHi: string;
  gradient: string;
}[] = [
  {
    id: "simple",
    label: "Simple",
    labelHi: "सरल",
    icon: "💡",
    desc: "Clear, plain language",
    descHi: "सरल भाषा में",
    gradient: "linear-gradient(135deg,#34d399,#059669)",
  },
  {
    id: "socratic",
    label: "Socratic",
    labelHi: "सवाल-जवाब",
    icon: "❓",
    desc: "Guided questions",
    descHi: "सवालों से सीखें",
    gradient: "linear-gradient(135deg,#a78bfa,#7c3aed)",
  },
  {
    id: "visual",
    label: "Visual",
    labelHi: "दृश्य",
    icon: "🎨",
    desc: "Diagrams & analogies",
    descHi: "चित्र और उदाहरण",
    gradient: "linear-gradient(135deg,#60a5fa,#2563eb)",
  },
  {
    id: "interview",
    label: "Interview",
    labelHi: "इंटरव्यू",
    icon: "🎤",
    desc: "Real-world framing",
    descHi: "व्यावहारिक संदर्भ",
    gradient: "linear-gradient(135deg,#f472b6,#db2777)",
  },
];

function localFallback(topic: string, style: TeachingStyle, hindi: boolean): string {
  if (style === "socratic")
    return hindi
      ? `सोचें: ${topic} में कौन-सी जानकारी सबसे जल्दी ढूंढी जा सकती है?`
      : `Think about it — what information in ${topic} can be found fastest, and why does index-based access matter?`;
  if (style === "visual")
    return hindi
      ? `कल्पना करें: ${topic} एक पंक्ति में खड़े लोगों की तरह है जहाँ हर किसी का नंबर होता है।`
      : `Picture a row of numbered boxes — that's ${topic}. Each box holds one value at a fixed address, giving you O(1) lookup.`;
  if (style === "interview")
    return hindi
      ? `इंटरव्यू में पूछा जाए: "${topic} कब उपयोगी है और इसकी सीमाएँ क्या हैं?"`
      : `An interviewer might ask: "When would you reach for ${topic}, and what are its trade-offs?" Answer: use it for fast indexed reads; avoid when frequent insertions/deletions are needed.`;
  return hindi
    ? `${topic} जानकारी को एक सुव्यवस्थित तरीके से रखती है ताकि उसे O(1) समय में एक्सेस किया जा सके।`
    : `${topic} organises information so every element is reachable in constant time using its index — a core building block in computer science.`;
}

// Animated typing cursor
function Cursor() {
  return <span className="ed-cursor" aria-hidden="true">▌</span>;
}

export function ExplainDifferently({
  topic,
  language = "en",
}: {
  topic: string;
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
  const [provider, setProvider] = useState<"bedrock" | "local" | null>(null);
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
      setProvider(null);

      try {
        const res = await fetch("/api/teach", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            topic,
            question: hindi
              ? `इस विषय को ${chosenStyle} तरीके से समझाएं।`
              : `Explain this topic in a ${chosenStyle} way.`,
            style: chosenStyle,
            language,
          }),
          signal: controller.signal,
        });

        // Auth fallback — gracefully stream local text
        if (res.status === 401) {
          const words = localFallback(topic, chosenStyle, hindi).split(" ");
          for (const word of words) {
            if (controller.signal.aborted) return;
            await new Promise((r) => setTimeout(r, 35));
            setText((t) => (t ? t + " " + word : word));
          }
          setProvider("local");
          setStreaming(false);
          return;
        }

        if (!res.ok)
          throw new Error(
            hindi ? "AI कोच अभी उपलब्ध नहीं है।" : "Teaching team unavailable."
          );

        const data = (await res.json()) as {
          explanation: string;
          followUp: string;
          recommendedStyle: TeachingStyle;
          confidence?: number;
          provider?: "bedrock" | "local";
        };

        // Stream the explanation character-by-character for premium feel
        const chars = data.explanation.split("");
        for (const char of chars) {
          if (controller.signal.aborted) return;
          // Faster for longer texts, slower at start
          const delay = chars.length > 500 ? 4 : 10;
          await new Promise((r) => setTimeout(r, delay));
          setText((t) => t + char);
        }

        setFollowUp(data.followUp ?? "");
        setRecommended(data.recommendedStyle ?? null);
        setConfidence(data.confidence ?? null);
        setProvider(data.provider ?? "bedrock");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(
          e instanceof Error
            ? e.message
            : hindi
            ? "कुछ गड़बड़ हो गई।"
            : "Something went wrong."
        );
      } finally {
        setStreaming(false);
      }
    },
    [topic, language, hindi]
  );

  const hasContent = text.length > 0;
  const activeStyle = STYLES.find((s) => s.id === style);

  return (
    <div className="ed-box">
      {/* Header */}
      <div className="ed-header">
        <span className="eyebrow">{hindi ? "AI कोच" : "AI coach"}</span>
        <h3 className="ed-title">
          {hindi ? "अलग तरीके से समझना है?" : "Need a different angle?"}
        </h3>
        <p className="ed-subtitle">
          {hindi
            ? "वह शैली चुनें जो आपके सोचने के तरीके से मेल खाए।"
            : "Pick the style that matches how you think."}
        </p>
      </div>

      {/* Style selector */}
      <div className="ed-style-grid">
        {STYLES.map((s) => {
          const isActive = style === s.id;
          const isPulsing = streaming && isActive;
          return (
            <button
              key={s.id}
              id={`explain-style-${s.id}`}
              className={`ed-style-btn${isActive ? " ed-active" : ""}${isPulsing ? " ed-pulsing" : ""}`}
              onClick={() => fetchExplanation(s.id)}
              disabled={streaming}
              title={hindi ? s.descHi : s.desc}
              style={isActive ? { background: s.gradient } : undefined}
            >
              <span className="ed-style-icon">{s.icon}</span>
              <span className="ed-style-label">{hindi ? s.labelHi : s.label}</span>
              <span className="ed-style-desc">{hindi ? s.descHi : s.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Loading shimmer */}
      {streaming && !hasContent && (
        <div className="ed-loading" aria-live="polite">
          <div className="ed-shimmer-wrap">
            <div className="ed-shimmer" />
            <div className="ed-shimmer ed-shimmer-short" />
            <div className="ed-shimmer ed-shimmer-shorter" />
          </div>
          <p className="ed-loading-text">
            <span className="ed-spinner" />
            {hindi ? "आपका AI शिक्षक सोच रहा है…" : "Your AI teacher is thinking…"}
          </p>
        </div>
      )}

      {/* Error */}
      {error && !streaming && (
        <div className="ed-error">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Result */}
      {hasContent && (
        <div className="ed-result" style={{ borderColor: activeStyle ? "transparent" : undefined }}>
          {/* Active style badge */}
          <div
            className="ed-result-badge"
            style={{ background: activeStyle?.gradient }}
          >
            <span>{activeStyle?.icon}</span>
            <span>{hindi ? activeStyle?.labelHi : activeStyle?.label}</span>
            {provider === "local" && (
              <span className="ed-local-badge">{hindi ? "स्थानीय" : "offline"}</span>
            )}
          </div>

          {/* Streamed explanation */}
          <div className="ed-explanation">
            <p>
              {text}
              {streaming && <Cursor />}
            </p>
          </div>

          {/* Confidence bar (shown when done streaming) */}
          {!streaming && confidence !== null && (
            <div className="ed-confidence">
              <span className="eyebrow">
                {hindi ? "AI का विश्वास" : "AI confidence"}
              </span>
              <div className="ed-conf-track">
                <div
                  className="ed-conf-fill"
                  style={{
                    width: `${confidence}%`,
                    background:
                      confidence >= 75
                        ? "linear-gradient(90deg,#34d399,#059669)"
                        : confidence >= 50
                        ? "linear-gradient(90deg,#a78bfa,#7c3aed)"
                        : "linear-gradient(90deg,#f472b6,#db2777)",
                  }}
                />
              </div>
              <span className="ed-conf-value">{confidence}%</span>
            </div>
          )}

          {/* Follow-up question */}
          {!streaming && followUp && (
            <div className="ed-followup">
              <span className="eyebrow">
                {hindi ? "सोचें:" : "Think about this:"}
              </span>
              <p>{followUp}</p>
            </div>
          )}

          {/* Recommended style chip */}
          {!streaming && recommended && recommended !== style && (
            <div className="ed-recommend">
              {(() => {
                const rec = STYLES.find((s) => s.id === recommended);
                return (
                  <>
                    <span className="ed-rec-icon">💡</span>
                    <span>
                      {hindi
                        ? `AI सुझाव: "${rec?.labelHi}" शैली आज़माएं`
                        : `AI suggests trying "${rec?.label}" style next`}
                    </span>
                    <button
                      className="ed-rec-btn"
                      onClick={() => fetchExplanation(recommended)}
                    >
                      {hindi ? "आज़माएं" : "Try it"} →
                    </button>
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
