"use client";

import { useState } from "react";

export function LogoutButton({
  language = "en",
}: {
  language?: "en" | "hi";
}) {
  const [loading, setLoading] = useState(false);
  const isHindi = language === "hi";

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.replace("/");
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="logout-btn"
      aria-label={isHindi ? "लॉग आउट" : "Log out"}
    >
      {loading
        ? isHindi
          ? "लॉग आउट हो रहे हैं…"
          : "Logging out…"
        : isHindi
        ? "लॉग आउट"
        : "Log out"}
    </button>
  );
}
