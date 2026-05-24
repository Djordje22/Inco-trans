"use client";

export default function StaffLogoutButton() {
  const handleLogout = async () => {
    await fetch("/api/staff/logout", { method: "POST" });
    window.location.href = "/staff/login";
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
    >
      Odjavi se
    </button>
  );
}
