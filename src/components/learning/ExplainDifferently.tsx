"use client";

import { useState } from "react";
import type { TeachingStyle } from "@/lib/agentcore/teaching";

type TeachingResult = {
  explanation: string;
  followUp: string;
  recommendedStyle: TeachingStyle;
  confidence: number;
};

const STYLES: { id: TeachingStyle; label: string; labelHi: string; icon: string }[] = [
  { id: "simple", label: "Simple", labelHi: "सरल", icon: "💡" },
  { id: "socratic", label: "Socratic", labelHi: "सवाल-जवाब", icon: "❓" },
  { id: "visual", label: "Visual", labelHi: "दृश्य", icon: "🎨" },
  { id: "interview", label: "Interview", labelHi: "इंटरव्यू", icon: "🎤" },
];

export function ExplainDifferently({
  topic,
  language = "en",
}: {
  topic: string;
  language?: string;
}) {
  const hindi = language === "hi";
  const [style, setStyle] = useState<TeachingStyle>("simple");
  const [result, setResult] = useState<TeachingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchExplanation(chosenStyle: TeachingStyle) {
    setStyle(chosenStyle);
    setLoading(true);
    setError(null);
    setResult(null);
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
      });
      if (!res.ok) throw new Error("Teaching team unavailable.");
      const data = (await res.json()) as TeachingResult;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="explain-box">
      {/* Header */}
      <div className="explain-header">
        <span className="eyebrow">{hindi ? "AI कोच" : "AI coach"}</span>
        <h3>{hindi ? "अलग तरीके से समझना है?" : "Need a different angle?"}</h3>
        <p>
          {hindi
            ? "वह शैली चुनें जो आपके सोचने के तरीके से मेल खाए।"
            : "Pick the style that matches how you think."}
        </p>
      </div>

      {/* Style Picker */}
      <div className="explain-actions">
        {STYLES.map((s) => (
          <button
            key={s.id}
            className={`explain-style-btn ${style === s.id ? "selected" : ""} ${loading && style === s.id ? "loading" : ""}`}
            onClick={() => fetchExplanation(s.id)}
            disabled={loading}
          >
            <span className="style-icon">{s.icon}</span>
            <span>{hindi ? s.labelHi : s.label}</span>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="explain-loading">
          <div className="explain-shimmer" />
          <div className="explain-shimmer short" />
          <p className="explain-loading-text">
            {hindi ? "आपका AI शिक्षक सोच रहा है..." : "Your AI teacher is thinking..."}
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <p className="explain-error">{error}</p>
      )}

      {/* Result card */}
      {result && !loading && (
        <div className="explain-result">
          <div className="explain-explanation">
            <span className="eyebrow">{hindi ? "व्याख्या" : "Explanation"}</span>
            <p>{result.explanation}</p>
          </div>
          {result.followUp && (
            <div className="explain-followup">
              <span className="eyebrow">{hindi ? "सोचें:" : "Think about this:"}</span>
              <p>{result.followUp}</p>
            </div>
          )}
          {result.recommendedStyle && result.recommendedStyle !== style && (
            <p className="explain-recommend">
              {hindi
                ? `💡 AI सुझाव: "${STYLES.find(s => s.id === result.recommendedStyle)?.labelHi}" शैली आपके लिए बेहतर हो सकती है।`
                : `💡 AI suggests trying the "${result.recommendedStyle}" style next.`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
