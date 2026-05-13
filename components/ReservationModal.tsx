"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode
} from "react";
import { t } from "@/lib/i18n";
import {
  categoryLabels,
  type VehicleCategory
} from "@/lib/fleet-data";
import { siteConfig, type Locale } from "@/lib/site-config";

// ---------- Context ----------

type FlowKind = "choose" | "rent" | "handle" | "phone" | "success";

type Ctx = {
  open: boolean;
  flow: FlowKind;
  openModal: () => void;
  closeModal: () => void;
};

const ReservationContext = createContext<Ctx | null>(null);

export function useReservation(): Ctx {
  const ctx = useContext(ReservationContext);
  if (!ctx) {
    throw new Error("useReservation must be used inside ReservationModalProvider");
  }
  return ctx;
}

// ---------- Trigger button ----------

type TriggerProps = {
  className?: string;
  children: ReactNode;
  variant?: "gold" | "ghost";
};

export function ReservationTrigger({
  className,
  children,
  variant
}: TriggerProps) {
  const { openModal } = useReservation();
  const cls =
    className ??
    (variant === "ghost" ? "btn-ghost" : "btn-gold");
  return (
    <button type="button" onClick={openModal} className={cls}>
      {children}
    </button>
  );
}

// ---------- Provider ----------

type ProviderProps = {
  locale: Locale;
  children: ReactNode;
};

export default function ReservationModalProvider({
  locale,
  children
}: ProviderProps) {
  const [open, setOpen] = useState(false);
  const [flow, setFlow] = useState<FlowKind>("choose");
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const openModal = useCallback(() => {
    previousFocusRef.current = (document.activeElement as HTMLElement) || null;
    setFlow("choose");
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setFlow("choose");
    if (previousFocusRef.current) {
      previousFocusRef.current.focus({ preventScroll: true });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeModal]);

  const ctxValue = useMemo<Ctx>(
    () => ({ open, flow, openModal, closeModal }),
    [open, flow, openModal, closeModal]
  );

  return (
    <ReservationContext.Provider value={ctxValue}>
      {children}
      {open ? (
        <ModalShell locale={locale} flow={flow} setFlow={setFlow} onClose={closeModal} />
      ) : null}
    </ReservationContext.Provider>
  );
}

// ---------- Modal shell ----------

type ShellProps = {
  locale: Locale;
  flow: FlowKind;
  setFlow: (f: FlowKind) => void;
  onClose: () => void;
};

function ModalShell({ locale, flow, setFlow, onClose }: ShellProps) {
  const dict = t(locale).modal;
  const titleId = "reservation-modal-title";
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-2 sm:p-4"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />
      <div
        className="relative w-full sm:max-w-md glass-strong rounded-2xl sm:rounded-2xl overflow-hidden animate-fade-up"
        style={{ maxHeight: "92vh" }}
      >
        <header className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
          <h2
            id={titleId}
            className="font-display text-base sm:text-lg tracking-wide uppercase text-white/95"
          >
            {dict.title}
          </h2>
          <span aria-hidden="true" className="h-px flex-1 bg-white/15" />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={dict.close}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/85"
          >
            <CloseIcon />
          </button>
        </header>

        <div
          className="overflow-y-auto px-5 py-6 sm:px-6 sm:py-7"
          style={{ maxHeight: "calc(92vh - 64px)" }}
        >
          {flow === "choose" ? (
            <ChooseStep locale={locale} onPick={setFlow} />
          ) : null}
          {flow === "rent" ? (
            <RentFlow
              locale={locale}
              onBack={() => setFlow("choose")}
              onDone={() => setFlow("success")}
            />
          ) : null}
          {flow === "handle" ? (
            <HandleFlow
              locale={locale}
              onBack={() => setFlow("choose")}
              onDone={() => setFlow("success")}
            />
          ) : null}
          {flow === "phone" ? (
            <PhonePanel locale={locale} onBack={() => setFlow("choose")} />
          ) : null}
          {flow === "success" ? (
            <SuccessPanel locale={locale} onClose={onClose} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ---------- Step 1 — Choose ----------

function ChooseStep({
  locale,
  onPick
}: {
  locale: Locale;
  onPick: (f: FlowKind) => void;
}) {
  const dict = t(locale).modal;

  return (
    <div>
      <div className="text-center">
        <h3 className="font-display text-2xl sm:text-3xl text-white">
          {dict.step1.heading}
        </h3>
        <p className="mt-1.5 text-[11px] uppercase tracking-[0.22em] text-white/55">
          {dict.step1.subheading}
        </p>
      </div>

      <ul className="mt-7 space-y-3">
        <ServiceCard
          icon={<KeyIcon />}
          title={dict.step1.rent.title}
          desc={dict.step1.rent.desc}
          chip={dict.step1.learnMore}
          onClick={() => onPick("rent")}
        />
        <ServiceCard
          icon={<HandshakeIcon />}
          title={dict.step1.handle.title}
          desc={dict.step1.handle.desc}
          onClick={() => onPick("handle")}
        />
        <ServiceCard
          icon={<PhoneIcon />}
          title={dict.step1.phone.title}
          desc={siteConfig.contact.phone}
          onClick={() => onPick("phone")}
        />
      </ul>
    </div>
  );
}

function ServiceCard({
  icon,
  title,
  desc,
  chip,
  onClick
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  chip?: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="group w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left hover:bg-white/8 hover:border-white/20 transition-colors"
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 text-white/85">
          {icon}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold text-white text-sm sm:text-[15px] leading-tight">
            {title}
          </span>
          <span className="mt-0.5 block text-xs text-white/60 truncate">
            {desc}
          </span>
        </span>
        {chip ? (
          <span className="hidden sm:inline-flex items-center rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-widest text-white/65">
            {chip}
          </span>
        ) : null}
        <ChevronRight className="text-white/45 group-hover:text-white/80 shrink-0" />
      </button>
    </li>
  );
}

// ---------- Step progress indicator ----------

function StepProgress({
  steps,
  current
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="flex items-center justify-between gap-2">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isCurrent = stepNum === current;
        const isDone = stepNum < current;
        return (
          <li
            key={label}
            className="flex flex-col items-center flex-1 min-w-0"
          >
            <div className="flex items-center w-full">
              {i !== 0 ? (
                <span
                  className={
                    "h-px flex-1 " +
                    (isDone || isCurrent ? "bg-gold-400/70" : "bg-white/12")
                  }
                />
              ) : (
                <span className="flex-1" />
              )}
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={
                  "shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold border " +
                  (isCurrent
                    ? "bg-white text-ink-900 border-white"
                    : isDone
                      ? "bg-gold-400 text-ink-900 border-gold-400"
                      : "bg-transparent text-white/55 border-white/20")
                }
              >
                {isDone ? <CheckIcon /> : stepNum}
              </span>
              {i !== steps.length - 1 ? (
                <span
                  className={
                    "h-px flex-1 " +
                    (isDone ? "bg-gold-400/70" : "bg-white/12")
                  }
                />
              ) : (
                <span className="flex-1" />
              )}
            </div>
            <span
              className={
                "mt-1.5 text-[10px] uppercase tracking-widest truncate max-w-full " +
                (isCurrent ? "text-white/85" : "text-white/45")
              }
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ---------- Rent a Car flow ----------

type RentData = {
  pickup: string;
  return: string;
  location: string;
  crossBorder: boolean;
  vehicle: VehicleCategory | "";
  pastClient: boolean;
  fullName: string;
  email: string;
  phone: string;
  company: string;
};

const EMPTY_RENT: RentData = {
  pickup: "",
  return: "",
  location: "",
  crossBorder: false,
  vehicle: "",
  pastClient: false,
  fullName: "",
  email: "",
  phone: "",
  company: ""
};

function RentFlow({
  locale,
  onBack,
  onDone
}: {
  locale: Locale;
  onBack: () => void;
  onDone: () => void;
}) {
  const dict = t(locale).modal;
  const [data, setData] = useState<RentData>(EMPTY_RENT);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const set = <K extends keyof RentData>(k: K, v: RentData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const journeyValid =
    data.pickup.trim() !== "" &&
    data.return.trim() !== "" &&
    data.location.trim() !== "";
  const vehicleValid = data.vehicle !== "";
  const contactValid =
    data.fullName.trim().length > 1 &&
    data.email.includes("@") &&
    data.phone.trim().length >= 5;

  const onPrev = () => {
    if (step === 1) onBack();
    else setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const onNext = () => {
    if (step === 1 && !journeyValid) return;
    if (step === 2 && !vehicleValid) return;
    if (step === 3 && !contactValid) return;
    setStep((s) => (s + 1) as 2 | 3 | 4);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    onDone();
  };

  return (
    <div>
      <StepProgress
        steps={[
          dict.progress.journey,
          dict.progress.vehicle,
          dict.progress.contact,
          dict.progress.review
        ]}
        current={step}
      />

      <div className="mt-6">
        {step === 1 ? (
          <RentStepJourney locale={locale} data={data} set={set} />
        ) : null}
        {step === 2 ? (
          <RentStepVehicle locale={locale} data={data} set={set} />
        ) : null}
        {step === 3 ? (
          <ContactFields locale={locale} data={data} set={set} />
        ) : null}
        {step === 4 ? <RentStepReview locale={locale} data={data} /> : null}
      </div>

      <FormFooter
        locale={locale}
        onBack={onPrev}
        onNext={step < 4 ? onNext : undefined}
        onSubmit={step === 4 ? onSubmit : undefined}
        nextDisabled={
          (step === 1 && !journeyValid) ||
          (step === 2 && !vehicleValid) ||
          (step === 3 && !contactValid)
        }
      />
    </div>
  );
}

function RentStepJourney({
  locale,
  data,
  set
}: {
  locale: Locale;
  data: RentData;
  set: <K extends keyof RentData>(k: K, v: RentData[K]) => void;
}) {
  const dict = t(locale).modal.rent.journey;
  return (
    <div>
      <StepHeading
        icon={<CalendarIcon />}
        title={dict.heading}
        subtitle={dict.subheading}
      />
      <div className="mt-5 space-y-4">
        <Field label={dict.pickup} required>
          <input
            type="datetime-local"
            className="glass-input"
            value={data.pickup}
            onChange={(e) => set("pickup", e.target.value)}
          />
        </Field>
        <Field label={dict.return} required>
          <input
            type="datetime-local"
            className="glass-input"
            value={data.return}
            onChange={(e) => set("return", e.target.value)}
          />
        </Field>
        <Field label={dict.location} required iconLabel>
          <input
            type="text"
            className="glass-input"
            placeholder={dict.locationPlaceholder}
            value={data.location}
            onChange={(e) => set("location", e.target.value)}
          />
        </Field>
        <Toggle
          label={dict.crossBorder}
          checked={data.crossBorder}
          onChange={(v) => set("crossBorder", v)}
        />
      </div>
    </div>
  );
}

function RentStepVehicle({
  locale,
  data,
  set
}: {
  locale: Locale;
  data: RentData;
  set: <K extends keyof RentData>(k: K, v: RentData[K]) => void;
}) {
  const dict = t(locale).modal.rent.vehicle;
  const cats: VehicleCategory[] = ["sedan", "suv", "sport", "van"];
  return (
    <div>
      <StepHeading
        icon={<CarIcon />}
        title={dict.heading}
        subtitle={dict.subheading}
      />
      <ul className="mt-5 grid grid-cols-2 gap-3">
        {cats.map((c) => {
          const active = data.vehicle === c;
          return (
            <li key={c}>
              <button
                type="button"
                onClick={() => set("vehicle", c)}
                aria-pressed={active}
                className={
                  "w-full text-left rounded-xl border px-3 py-3 transition-colors " +
                  (active
                    ? "border-gold-400 bg-gold-400/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10")
                }
              >
                <span className="block text-sm font-semibold text-white">
                  {categoryLabels[c][locale]}
                </span>
                <span className="mt-0.5 block text-[11px] uppercase tracking-widest text-white/55">
                  {c}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RentStepReview({
  locale,
  data
}: {
  locale: Locale;
  data: RentData;
}) {
  const dict = t(locale).modal.rent.review;
  const items: { label: string; value: string }[] = [
    {
      label: dict.pickupLabel,
      value: data.pickup ? formatDateTime(data.pickup, locale) : "—"
    },
    {
      label: dict.returnLabel,
      value: data.return ? formatDateTime(data.return, locale) : "—"
    },
    { label: dict.locationLabel, value: data.location || "—" },
    {
      label: dict.vehicleLabel,
      value: data.vehicle ? categoryLabels[data.vehicle][locale] : "—"
    },
    {
      label: locale === "sr" ? "Granica" : "Border",
      value: data.crossBorder ? dict.crossBorderYes : dict.crossBorderNo
    }
  ];

  return (
    <div>
      <StepHeading
        icon={<ClipboardIcon />}
        title={dict.heading}
        subtitle={dict.subheading}
      />
      <dl className="mt-5 glass rounded-xl divide-y divide-white/8 overflow-hidden">
        {items.map((it) => (
          <div
            key={it.label}
            className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
          >
            <dt className="text-white/55">{it.label}</dt>
            <dd className="text-white text-right">{it.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 rounded-lg border border-gold-400/25 bg-gold-400/8 px-3 py-2 text-xs text-gold-200">
        {dict.cashNote}
      </p>
    </div>
  );
}

// ---------- Let us handle flow (1 step) ----------

function HandleFlow({
  locale,
  onBack,
  onDone
}: {
  locale: Locale;
  onBack: () => void;
  onDone: () => void;
}) {
  const dict = t(locale).modal;
  const [data, setData] = useState<RentData>(EMPTY_RENT);
  const set = <K extends keyof RentData>(k: K, v: RentData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const valid =
    data.fullName.trim().length > 1 &&
    data.email.includes("@") &&
    data.phone.trim().length >= 5;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onDone();
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <StepHeading
        icon={<UserIcon />}
        title={dict.contact.heading}
        subtitle={dict.contact.subheading}
      />
      <div className="mt-5">
        <ContactFields locale={locale} data={data} set={set} compact />
      </div>
      <FormFooter
        locale={locale}
        onBack={onBack}
        submitLabel={dict.contact.submitInquiry}
        onSubmit={onSubmit}
        nextDisabled={!valid}
      />
    </form>
  );
}

// ---------- Shared contact fields ----------

function ContactFields({
  locale,
  data,
  set,
  compact = false
}: {
  locale: Locale;
  data: RentData;
  set: <K extends keyof RentData>(k: K, v: RentData[K]) => void;
  compact?: boolean;
}) {
  const dict = t(locale).modal.contact;
  return (
    <div className="space-y-4">
      <Toggle
        label={dict.pastClient}
        checked={data.pastClient}
        onChange={(v) => set("pastClient", v)}
      />
      <Field label={dict.fullName} required>
        <input
          type="text"
          autoComplete="name"
          className="glass-input"
          placeholder={dict.fullNamePlaceholder}
          value={data.fullName}
          onChange={(e) => set("fullName", e.target.value)}
        />
      </Field>
      <Field label={dict.email} required>
        <input
          type="email"
          autoComplete="email"
          className="glass-input"
          placeholder={dict.emailPlaceholder}
          value={data.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </Field>
      <Field label={dict.phone} required>
        <div className="flex items-stretch gap-2">
          <span className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-2.5 text-sm text-white/80">
            +381
          </span>
          <input
            type="tel"
            autoComplete="tel"
            className="glass-input flex-1"
            placeholder={dict.phonePlaceholder}
            value={data.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
      </Field>
      {!compact ? null : null /* keep symmetric structure */}
      <Field label={dict.company} hint={dict.companyHint}>
        <input
          type="text"
          autoComplete="organization"
          className="glass-input"
          placeholder={dict.companyPlaceholder}
          value={data.company}
          onChange={(e) => set("company", e.target.value)}
        />
      </Field>
    </div>
  );
}

// ---------- Book by Phone panel ----------

function PhonePanel({
  locale,
  onBack
}: {
  locale: Locale;
  onBack: () => void;
}) {
  const dict = t(locale).modal;
  const phone = siteConfig.contact.phone;
  const phoneHref = siteConfig.contact.phoneHref;
  const wa = siteConfig.contact.whatsappHref;
  const hours = siteConfig.contact.hours[locale];

  return (
    <div>
      <StepHeading
        icon={<PhoneIcon />}
        title={dict.phonePanel.heading}
        subtitle={dict.phonePanel.subheading}
      />

      <div className="mt-6 space-y-3">
        <a
          href={phoneHref}
          className="flex items-center gap-3 rounded-xl border border-gold-400/40 bg-gold-400/10 px-4 py-3.5 hover:bg-gold-400/15"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold-400/20 text-gold-200">
            <PhoneIcon />
          </span>
          <span className="flex-1">
            <span className="block text-[11px] uppercase tracking-widest text-gold-200/80">
              {dict.phonePanel.callCta}
            </span>
            <span className="block font-semibold text-white">{phone}</span>
          </span>
          <ChevronRight className="text-white/55" />
        </a>

        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 hover:bg-white/10"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 text-white/85">
            <WhatsappIcon />
          </span>
          <span className="flex-1">
            <span className="block text-[11px] uppercase tracking-widest text-white/55">
              {dict.phonePanel.whatsappCta}
            </span>
            <span className="block font-semibold text-white">
              {siteConfig.contact.whatsapp}
            </span>
          </span>
          <ChevronRight className="text-white/55" />
        </a>
      </div>

      <div className="mt-5 glass rounded-xl px-4 py-3 text-xs">
        <span className="text-white/55 uppercase tracking-widest text-[10px]">
          {dict.phonePanel.hours}
        </span>
        <p className="mt-1 text-white/80">{hours}</p>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={onBack}
          className="btn-ghost w-full justify-center"
        >
          <ChevronLeft />
          {dict.buttons.back}
        </button>
      </div>
    </div>
  );
}

// ---------- Success ----------

function SuccessPanel({
  locale,
  onClose
}: {
  locale: Locale;
  onClose: () => void;
}) {
  const dict = t(locale).modal;
  return (
    <div className="text-center">
      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold-400/15 ring-1 ring-gold-400/40 text-gold-200">
        <CheckBigIcon />
      </div>
      <h3 className="mt-4 font-display text-2xl text-white">
        {dict.success.title}
      </h3>
      <p className="mt-2 text-sm text-white/65 max-w-sm mx-auto">
        {dict.success.body}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="btn-gold mt-6 w-full justify-center"
      >
        {dict.success.done}
      </button>
    </div>
  );
}

// ---------- Shared form bits ----------

function StepHeading({
  icon,
  title,
  subtitle
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 text-white/85">
        {icon}
      </span>
      <h3 className="mt-3 font-display text-xl sm:text-2xl text-white">
        {title}
      </h3>
      <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/55">
        {subtitle}
      </p>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  iconLabel,
  children
}: {
  label: string;
  required?: boolean;
  hint?: string;
  iconLabel?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-[11px] uppercase tracking-widest text-white/60">
        {iconLabel ? <PinIcon className="h-3.5 w-3.5" /> : null}
        {label}
        {required ? (
          <span aria-hidden="true" className="text-gold-300">
            *
          </span>
        ) : null}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[11px] text-white/45">{hint}</span>
      ) : null}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
      <span className="text-sm text-white/85">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
          "relative h-6 w-11 shrink-0 rounded-full transition-colors " +
          (checked ? "bg-gold-400" : "bg-white/15")
        }
      >
        <span
          className={
            "absolute top-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition-transform " +
            (checked ? "translate-x-5" : "translate-x-0.5")
          }
        />
      </button>
    </label>
  );
}

function FormFooter({
  locale,
  onBack,
  onNext,
  onSubmit,
  submitLabel,
  nextDisabled
}: {
  locale: Locale;
  onBack: () => void;
  onNext?: () => void;
  onSubmit?: (e: FormEvent) => void;
  submitLabel?: string;
  nextDisabled?: boolean;
}) {
  const dict = t(locale).modal;
  const isSubmit = !!onSubmit;
  const primaryLabel = submitLabel ?? dict.buttons.submitRequest;
  return (
    <div className="mt-7 flex items-center justify-between gap-3">
      <button type="button" onClick={onBack} className="btn-ghost !py-2 !px-3.5">
        <ChevronLeft />
        {dict.buttons.back}
      </button>
      {isSubmit ? (
        <button
          type="submit"
          onClick={onSubmit}
          disabled={nextDisabled}
          className="btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {primaryLabel}
          <ChevronRight />
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {dict.buttons.continue}
          <ChevronRight />
        </button>
      )}
    </div>
  );
}

// ---------- Helpers ----------

function formatDateTime(iso: string, locale: Locale): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString(locale === "sr" ? "sr-Latn" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

// ---------- Icons (inline svg, no extra deps) ----------

function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-5 w-5"}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function CloseIcon() {
  return (
    <Svg className="h-4 w-4">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </Svg>
  );
}
function ChevronRight({ className }: { className?: string }) {
  return (
    <Svg className={(className ?? "") + " h-4 w-4"}>
      <polyline points="9 6 15 12 9 18" />
    </Svg>
  );
}
function ChevronLeft() {
  return (
    <Svg className="h-4 w-4">
      <polyline points="15 6 9 12 15 18" />
    </Svg>
  );
}
function CheckIcon() {
  return (
    <Svg className="h-3.5 w-3.5">
      <polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}
function CheckBigIcon() {
  return (
    <Svg className="h-7 w-7">
      <polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}
function KeyIcon() {
  return (
    <Svg>
      <circle cx="8" cy="15" r="3" />
      <path d="M10.5 12.5 21 2" />
      <path d="m17 6 3 3" />
      <path d="m14 9 3 3" />
    </Svg>
  );
}
function HandshakeIcon() {
  return (
    <Svg>
      <path d="m11 17 2 2a2 2 0 1 0 3-3" />
      <path d="m14 14 3 3a2 2 0 1 0 3-3l-5-5-2 2a2 2 0 1 1-3-3l4-4a3 3 0 0 1 4 0l5 5" />
      <path d="M2 13l5 5a3 3 0 0 0 4 0l3-3" />
      <path d="M9 8 4 13" />
    </Svg>
  );
}
function PhoneIcon() {
  return (
    <Svg>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92Z" />
    </Svg>
  );
}
function WhatsappIcon() {
  return (
    <Svg>
      <path d="M3 21l2-6a8 8 0 1 1 4 4l-6 2Z" />
      <path d="M9 10c.5 1.5 1.5 2.5 3 3 .8.3 1.5.2 2-.2l1-.7c.3-.2.7-.2 1 0l1.5 1c.3.2.4.5.3.8-.4 1-1.5 1.6-2.5 1.6-2.5 0-5-2-6-4-.4-1-.2-2.2.6-2.6l.7-.4c.3-.2.6-.1.8.1L11 9c.2.3.2.7 0 1l-.7 1c-.4.4-.5.5-1.3 0" />
    </Svg>
  );
}
function CalendarIcon() {
  return (
    <Svg>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </Svg>
  );
}
function CarIcon() {
  return (
    <Svg>
      <path d="M3 13l2-5a3 3 0 0 1 3-2h8a3 3 0 0 1 3 2l2 5v4h-2a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H3v-4Z" />
      <circle cx="7.5" cy="15.5" r="0.5" />
      <circle cx="16.5" cy="15.5" r="0.5" />
    </Svg>
  );
}
function ClipboardIcon() {
  return (
    <Svg>
      <rect x="6" y="4" width="12" height="18" rx="2" />
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </Svg>
  );
}
function UserIcon() {
  return (
    <Svg>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Svg>
  );
}
function PinIcon({ className }: { className?: string }) {
  return (
    <Svg className={className ?? "h-4 w-4"}>
      <path d="M12 21s-7-7-7-12a7 7 0 1 1 14 0c0 5-7 12-7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </Svg>
  );
}
