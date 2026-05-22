"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { User, LogOut, ClipboardList, UserCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { routeMap, type Locale } from "@/lib/site-config";
import { t } from "@/lib/i18n";

type Props = {
  locale: Locale;
};

export default function AccountMenu({ locale }: Props) {
  const dict = t(locale);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { id: data.user.id } : null);
      setLoaded(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id } : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!loaded) return null;

  if (!user) {
    return (
      <Link
        href={routeMap.login[locale]}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
        aria-label={dict.auth.login}
      >
        <User className="h-4 w-4" aria-hidden="true" />
      </Link>
    );
  }

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setOpen(false);
    window.location.href = routeMap.home[locale];
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 text-gold-300 hover:bg-gold-400/20"
        aria-label={dict.auth.profile}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <User className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-48 glass-strong rounded-xl py-1.5 z-50"
        >
          <Link
            href={routeMap.profile[locale]}
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white"
          >
            <UserCircle className="h-4 w-4" aria-hidden="true" />
            {dict.auth.profile}
          </Link>
          <Link
            href={routeMap.bookingHistory[locale]}
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white"
          >
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            {dict.auth.history}
          </Link>
          <div className="my-1 border-t border-white/10" />
          <button
            type="button"
            onClick={handleSignOut}
            role="menuitem"
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {dict.auth.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
