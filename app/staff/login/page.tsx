import { Suspense } from "react";
import Link from "next/link";
import StaffLoginForm from "@/components/staff/StaffLoginForm";

export const metadata = { title: "Prijava za administraciju", robots: "noindex" };

export default function StaffLoginPage() {
  return (
    <div className="min-h-screen bg-ink-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="font-display text-xl font-semibold">Administrativni pristup</h1>
          <p className="mt-1 text-sm text-white/50">
            Unesite podatke za pristup rezervacijama.
          </p>
        </div>
        <div className="glass rounded-2xl p-6">
          <Suspense fallback={<div className="py-4 text-center text-white/50">...</div>}>
            <StaffLoginForm />
          </Suspense>
        </div>
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-white/40 hover:text-white/70 transition-colors">
            &larr; Nazad na sajt
          </Link>
        </div>
      </div>
    </div>
  );
}
