"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function StaffLoginForm() {
  const params = useSearchParams();
  const bookingId = params.get("booking") ?? "";
  const urlError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(urlError === "invalid" ? "Invalid or expired access link." : "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, bookingId })
    });

    if (!res.ok) {
      setError("Invalid credentials or expired session.");
      setLoading(false);
      return;
    }

    const data = await res.json();
    window.location.href = data.redirectTo;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />

      <div>
        <label htmlFor="staffEmail" className="block text-sm text-white/70 mb-1">
          Email
        </label>
        <input
          id="staffEmail"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="glass-input w-full"
        />
      </div>

      <div>
        <label htmlFor="staffPassword" className="block text-sm text-white/70 mb-1">
          Password
        </label>
        <input
          id="staffPassword"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="glass-input w-full"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !bookingId}
        className="btn-gold w-full justify-center"
      >
        {loading ? "..." : "Sign in"}
      </button>
    </form>
  );
}
