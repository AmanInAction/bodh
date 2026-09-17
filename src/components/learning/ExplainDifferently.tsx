"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ExplainDifferently({ topic }: { topic: string }) {
  const [style, setStyle] = useState("simple");
  return (
    <div className="explain-box">
      <div>
        <span className="eyebrow">AI coach</span>
        <h3>Need a different angle?</h3>
        <p>Ask for a version that fits how you think.</p>
      </div>
      <div className="explain-actions">
        {["simple", "analogy", "step-by-step"].map((option) => (
          <Button
            key={option}
            variant={style === option ? "primary" : "quiet"}
            onClick={() => setStyle(option)}
          >
            {option}
          </Button>
        ))}
      </div>
      <p className="ai-response">
        Here is a {style} explanation of {topic}: begin with a tiny example,
        then connect it to the bigger pattern.
      </p>
    </div>
  );
}
