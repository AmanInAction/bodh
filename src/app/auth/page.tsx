"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "email" | "otp" | "signup";

export default function AuthPage() {
  const router = useRouter();

  const [step, setStep]         = useState<Step>("email");
  const [email, setEmail]       = useState("");
  const [code, setCode]         = useState("");
  const [name, setName]         = useState("");
  const [language, setLang]     = useState<"en" | "hi">("en");
  const [error, setError]       = useState("");
  const [info, setInfo]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // ── Step 1: request OTP ────────────────────────────────────────────────────
  async function handleRequestCode(e: FormEvent) {
    e.preventDefault();
    setError(""); setInfo(""); setLoading(true);
    try {
      const res  = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "Something went wrong.");
      setInfo("Check your inbox — a 6-digit code is on its way.");
      setStep("otp");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2 / 3: verify OTP (+ collect name on signup) ─────────────────────
  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      // On the "signup" step the code is already consumed — just redirect.
      if (step === "signup") {
        router.push("/onboarding");
        return;
      }

      const res  = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code, name: name || undefined, language }),
      });
      const data = await res.json() as { ok?: boolean; isNewUser?: boolean; error?: string };
      if (!res.ok) return setError(data.error ?? "Invalid or expired code.");

      if (data.isNewUser) {
        // First-time user: ask for their name before finishing
        setIsNewUser(true);
        setStep("signup");
        setError("");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  // ── Shared submit handler ──────────────────────────────────────────────────
  function onSubmit(e: FormEvent) {
    if (step === "email") return handleRequestCode(e);
    return handleVerify(e);
  }

  const stepLabel: Record<Step, string> = {
    email:  "Send my code →",
    otp:    "Continue →",
    signup: "Create my account →",
  };

  return (
    <main className="auth-page">
      <Link className="brand" href="/">
        bodh<span>.</span>
      </Link>

      <div className="auth-panel">
        <span className="eyebrow">
          {step === "email"  && "Your learning space"}
          {step === "otp"    && "One-time code"}
          {step === "signup" && "Almost there"}
        </span>

        <h1>
          {step === "email"  && <>Come as<br />you are.</>}
          {step === "otp"    && <>Enter your<br />code.</>}
          {step === "signup" && <>Nice to<br />meet you.</>}
        </h1>

        <p>
          {step === "email"  && "Use your email to pick up where your thinking left off."}
          {step === "otp"    && `We sent a 6-digit code to ${email}.`}
          {step === "signup" && "Tell us a bit about yourself so we can personalise your path."}
        </p>

        <form onSubmit={onSubmit} className="auth-form">
          {/* ── Step: email ── */}
          {step === "email" && (
            <label>
              Email address
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
              />
            </label>
          )}

          {/* ── Step: OTP ── */}
          {(step === "otp" || step === "signup") && (
            <label>
              Verification code
              <input
                id="auth-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                disabled={loading}
              />
            </label>
          )}

          {/* ── Step: signup extras ── */}
          {step === "signup" && (
            <>
              <label>
                Your name
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Arjun"
                  disabled={loading}
                />
              </label>

              <label>
                Preferred language
                <div className="auth-lang-toggle">
                  <button
                    type="button"
                    id="auth-lang-en"
                    className={`auth-lang-btn${language === "en" ? " active" : ""}`}
                    onClick={() => setLang("en")}
                    disabled={loading}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    id="auth-lang-hi"
                    className={`auth-lang-btn${language === "hi" ? " active" : ""}`}
                    onClick={() => setLang("hi")}
                    disabled={loading}
                  >
                    हिंदी
                  </button>
                </div>
              </label>
            </>
          )}

          {error && <p className="auth-error">{error}</p>}
          {info  && <p className="auth-message">{info}</p>}

          <button
            id="auth-submit"
            className="button button-primary full-button"
            disabled={loading}
          >
            {loading ? "Please wait…" : stepLabel[step]}
          </button>
        </form>

        {/* Back links */}
        {step !== "email" && (
          <button
            className="auth-back"
            onClick={() => { setStep("email"); setCode(""); setError(""); setInfo(""); }}
          >
            ← Use a different email
          </button>
        )}
      </div>
    </main>
  );
}
