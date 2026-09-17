import Link from "next/link";
export default function OnboardingPage() {
  return (
    <main className="onboarding">
      <div className="onboarding-mark">
        bodh<span>.</span>
      </div>
      <div className="onboarding-panel">
        <span className="eyebrow">A little context</span>
        <h1>What are you curious about today?</h1>
        <p>We will shape a gentle first session around your answer.</p>
        <div className="choice-grid">
          <Link href="/onboarding/language">
            I am starting from scratch <span>→</span>
          </Link>
          <Link href="/onboarding/language">
            I want stronger foundations <span>→</span>
          </Link>
          <Link href="/onboarding/language">
            I am preparing for interviews <span>→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
