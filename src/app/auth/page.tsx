"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/auth/request-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error);
    setSent(true);
    setMessage("Check your inbox for a six-digit code.");
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error);
    router.push("/dashboard");
  }

  return (
    <main className="auth-page">
      <Link className="brand" href="/">
        bodh<span>.</span>
      </Link>
      <div className="auth-panel">
        <span className="eyebrow">Your learning space</span>
        <h1>Come as you are.</h1>
        <p>Use your email to pick up where your thinking left off.</p>
        {sent ? (
          <form onSubmit={verify}>
            <label>
              Verification code
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="123456"
              />
            </label>
            <button className="button button-primary full-button">
              Enter bodh. <span>→</span>
            </button>
          </form>
        ) : (
          <form onSubmit={requestCode}>
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <button className="button button-primary full-button">
              Send my code <span>→</span>
            </button>
          </form>
        )}
        {message && <p className="auth-message">{message}</p>}
      </div>
    </main>
  );
}
