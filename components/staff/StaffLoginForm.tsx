"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function StaffLoginForm() {
  const params = useSearchParams();
  const bookingId = params.get("booking") ?? "";
  const urlError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(urlError === "invalid" ? "Neispravan ili istekao link za pristup." : "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        ...(bookingId ? { bookingId } : {})
      })
    });

    if (!res.ok) {
      await res.json().catch(() => null);
      setError(res.status === 429
        ? "Previše pokušaja. Sačekajte nekoliko minuta."
        : "Neispravni podaci za prijavu.");
      setLoading(false);
      return;
    }

    const data = await res.json();
    window.location.href = data.redirectTo;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          Lozinka
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
        disabled={loading}
        className="btn-gold w-full justify-center"
      >
        {loading ? "..." : "Prijavi se"}
      </button>
    </form>
  );
}
