"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { validateEmailFormat } from "@/lib/auth/email-format";
import { Navbar } from "@/components/ui/Navbar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { resolveLanguage, setClientLanguage, type SupportedLanguage } from "@/lib/i18n";

type Step = "email" | "otp" | "signup";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";
  const initialLang = resolveLanguage(
    searchParams.get("language"),
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("bodh_lang="))
          ?.split("=")[1]
      : undefined,
  );

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [language, setLang] = useState<SupportedLanguage>(initialLang);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const isHindi = (searchParams.get("language") ?? language) === "hi";

  // ── Step 1: request OTP ────────────────────────────────────────────────────
  async function handleRequestCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    const formatCheck = validateEmailFormat(email);
    if (!formatCheck.valid) {
      setError(
        formatCheck.error ??
          (isHindi
            ? "कृपया एक मान्य ईमेल पता दर्ज करें।"
            : "Please enter a valid email address."),
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: formatCheck.normalizedEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error ??
            (isHindi
              ? "कोड भेजने में समस्या हुई। कृपया दोबारा कोशिश करें।"
              : "Could not send code right now. Please try again."),
        );
        return;
      }
      setInfo(
        isHindi
          ? "अपना ईमेल जांचें — हमने 6 अंकों का कोड भेजा है।"
          : "Check your inbox — a 6-digit code is on its way.",
      );
      setStep("otp");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: verify OTP ─────────────────────────────────────────────────────
  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        isNewUser?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setError(
          data.error ??
            (isHindi
              ? "यह कोड मान्य नहीं है या समाप्त हो गया है।"
              : "Invalid or expired code. Please check and try again."),
        );
        return;
      }

      if (data.isNewUser) {
        setStep("signup");
        return;
      }

      router.push(nextPath);
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: finish signup (name + language) ───────────────────────────────
  async function handleFinishSignup(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      setClientLanguage(language);
      if (name.trim()) {
        await fetch("/api/student", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: name.trim(), language }),
        });
      }
      router.push(`/onboarding?language=${language}`);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    if (step === "email") return handleRequestCode(e);
    if (step === "otp") return handleVerify(e);
    if (step === "signup") return handleFinishSignup(e);
  }

  const stepLabel: Record<Step, string> = isHindi
    ? {
        email: "मेरा कोड भेजें →",
        otp: "आगे बढ़ें →",
        signup: "खाता बनाएं →",
      }
    : {
        email: "Send my code →",
        otp: "Continue →",
        signup: "Create my account →",
      };

  return (
    <main className="auth-page">
      <Navbar
        language={isHindi ? "hi" : "en"}
        backHref={`/?language=${isHindi ? "hi" : "en"}`}
        backLabel={isHindi ? "← मुख्य पृष्ठ" : "← Home"}
      />

      <div className="auth-panel">
        <span className="eyebrow">
          {step === "email" && (isHindi ? "आपका अध्ययन स्थान" : "Your learning space")}
          {step === "otp" && (isHindi ? "एक-बारगी कोड" : "One-time code")}
          {step === "signup" && (isHindi ? "बस एक कदम और" : "Almost there")}
        </span>

        <h1>
          {step === "email" && (isHindi ? "आइए शुरू करें।" : "Welcome back.")}
          {step === "otp" && (isHindi ? "अपना कोड दर्ज करें।" : "Enter your code.")}
          {step === "signup" && (isHindi ? "आपसे मिलकर खुशी हुई।" : "Nice to meet you.")}
        </h1>

        <p>
          {step === "email" &&
            (isHindi
              ? "साइन इन करें या नया खाता बनाएं — बस अपना ईमेल लिखें।"
              : "Sign in or create an account with your email address.")}
          {step === "otp" &&
            (isHindi
              ? `हमने ${email} पर 6 अंकों का कोड भेजा है।`
              : `We sent a 6-digit verification code to ${email}.`)}
          {step === "signup" &&
            (isHindi
              ? "अपना नाम और पसंदीदा भाषा चुनें ताकि हम आपके सीखने का सफर तैयार कर सकें।"
              : "Tell us your name and preferred language so we can personalize your lessons.")}
        </p>

        <form onSubmit={onSubmit} className="auth-form">
          {step === "email" && (
            <Input
              id="auth-email"
              label={isHindi ? "ईमेल पता" : "Email address"}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              placeholder="you@example.com"
              disabled={loading}
            />
          )}

          {step === "otp" && (
            <Input
              id="auth-code"
              label={isHindi ? "6-अंकों का कोड" : "Verification code"}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              disabled={loading}
              autoFocus
            />
          )}

          {step === "signup" && (
            <>
              <Input
                id="auth-name"
                label={isHindi ? "आपका नाम" : "Your name"}
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isHindi ? "अर्जुन" : "Arjun"}
                disabled={loading}
                autoFocus
              />

              <div className="ds-field">
                <span className="ds-label">
                  {isHindi ? "सीखने की भाषा" : "Preferred language"}
                </span>
                <div className="auth-lang-toggle" role="group" aria-label="Preferred language">
                  <button
                    type="button"
                    id="auth-lang-en"
                    aria-pressed={language === "en"}
                    className={`auth-lang-btn${language === "en" ? " active" : ""}`}
                    onClick={() => setLang("en")}
                    disabled={loading}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    id="auth-lang-hi"
                    aria-pressed={language === "hi"}
                    className={`auth-lang-btn${language === "hi" ? " active" : ""}`}
                    onClick={() => setLang("hi")}
                    disabled={loading}
                  >
                    हिंदी
                  </button>
                </div>
              </div>
            </>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="auth-message" role="status">
              {info}
            </p>
          )}

          <Button
            id="auth-submit"
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            loadingLabel={isHindi ? "कृपया प्रतीक्षा करें…" : "Please wait…"}
          >
            {stepLabel[step]}
          </Button>
        </form>

        {step !== "email" && (
          <button
            type="button"
            className="auth-back"
            onClick={() => {
              setStep("email");
              setCode("");
              setError("");
              setInfo("");
            }}
          >
            {isHindi ? "← दूसरा ईमेल उपयोग करें" : "← Use a different email"}
          </button>
        )}

        {step === "email" && (
          <p
            style={{
              marginTop: "20px",
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              textAlign: "center",
            }}
          >
            {isHindi
              ? "किसी पासवर्ड की आवश्यकता नहीं है। हम हर बार एक सुरक्षित कोड भेजते हैं।"
              : "No password needed. We send a one-time code to your email."}
          </p>
        )}
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
