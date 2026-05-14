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
import {
  X,
  Check,
  ChevronLeft as LucideChevronLeft,
  ChevronRight as LucideChevronRight,
  Car,
  Handshake,
  Phone,
  ClipboardList,
  UserRound,
  MapPin
} from "lucide-react";
import { t } from "@/lib/i18n";
import { vehicles } from "@/lib/fleet-data";
import { siteConfig, type Locale } from "@/lib/site-config";
import WhatsAppMark from "./icons/WhatsAppMark";

// ---------- Context ----------

type FlowKind = "choose" | "transfer" | "handle" | "phone" | "success";

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
  const cls = className ?? (variant === "ghost" ? "btn-ghost" : "btn-gold");
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
        className="relative w-full sm:max-w-md glass-strong rounded-2xl overflow-hidden animate-fade-up"
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
          {flow === "transfer" ? (
            <TransferFlow
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
        {/* WhatsApp first — primary CTA */}
        <li>
          <a
            href={siteConfig.contact.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group w-full flex items-center gap-3 rounded-xl border border-gold-400/40 bg-gold-400/10 px-3 py-3 hover:bg-gold-400/15 transition-colors"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-400/20 ring-1 ring-gold-400/40 text-gold-200">
              <WhatsappIcon />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-semibold text-white text-sm sm:text-[15px]">
                {dict.step1.whatsapp.title}
              </span>
              <span className="mt-0.5 block text-xs text-gold-200/85 truncate">
                {siteConfig.contact.whatsapp}
              </span>
            </span>
            <ChevronRight className="text-gold-200/70" />
          </a>
        </li>

        <ServiceCard
          icon={<CarIcon />}
          title={dict.step1.transfer.title}
          desc={dict.step1.transfer.desc}
          chip={dict.step1.learnMore}
          onClick={() => onPick("transfer")}
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

// ---------- Progress indicator ----------

function StepProgress({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center justify-between gap-2">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isCurrent = stepNum === current;
        const isDone = stepNum < current;
        return (
          <li key={label} className="flex flex-col items-center flex-1 min-w-0">
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

// ---------- Transfer flow (4 steps) ----------

type ServiceType = "airport" | "chauffeur" | "business" | "other";

type TransferData = {
  service: ServiceType | "";
  pickup: string;
  destination: string;
  dateTime: string;
  passengers: number;
  flight: string;
  vehicle: string;
  fullName: string;
  email: string;
  phone: string;
  whatsappSame: boolean;
  message: string;
};

const EMPTY: TransferData = {
  service: "",
  pickup: "",
  destination: "",
  dateTime: "",
  passengers: 1,
  flight: "",
  vehicle: "",
  fullName: "",
  email: "",
  phone: "",
  whatsappSame: true,
  message: ""
};

function TransferFlow({
  locale,
  onBack,
  onDone
}: {
  locale: Locale;
  onBack: () => void;
  onDone: () => void;
}) {
  const dict = t(locale).modal;
  const [data, setData] = useState<TransferData>(EMPTY);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const set = <K extends keyof TransferData>(k: K, v: TransferData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const serviceValid = data.service !== "";
  const journeyValid =
    data.pickup.trim() !== "" &&
    data.destination.trim() !== "" &&
    data.dateTime.trim() !== "";
  const contactValid =
    data.fullName.trim().length > 1 &&
    data.phone.trim().length >= 5;

  const onPrev = () => {
    if (step === 1) onBack();
    else setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const onNext = () => {
    if (step === 1 && !serviceValid) return;
    if (step === 2 && !journeyValid) return;
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
          dict.progress.service,
          dict.progress.journey,
          dict.progress.contact,
          dict.progress.review
        ]}
        current={step}
      />

      <div className="mt-6">
        {step === 1 ? (
          <ServiceStep locale={locale} data={data} set={set} />
        ) : null}
        {step === 2 ? (
          <JourneyStep locale={locale} data={data} set={set} />
        ) : null}
        {step === 3 ? (
          <ContactFields locale={locale} data={data} set={set} />
        ) : null}
        {step === 4 ? <ReviewStep locale={locale} data={data} /> : null}
      </div>

      <FormFooter
        locale={locale}
        onBack={onPrev}
        onNext={step < 4 ? onNext : undefined}
        onSubmit={step === 4 ? onSubmit : undefined}
        nextDisabled={
          (step === 1 && !serviceValid) ||
          (step === 2 && !journeyValid) ||
          (step === 3 && !contactValid)
        }
      />
    </div>
  );
}

function ServiceStep({
  locale,
  data,
  set
}: {
  locale: Locale;
  data: TransferData;
  set: <K extends keyof TransferData>(k: K, v: TransferData[K]) => void;
}) {
  const dict = t(locale).modal.rent.service;
  const tf = t(locale).transportForm;
  const options: { value: ServiceType; label: string; desc: string }[] = [
    {
      value: "airport",
      label: tf.serviceOptionAirport,
      desc: locale === "sr"
        ? "Aerodrom Nikola Tesla — adresa, hotel ili grad."
        : locale === "ru"
          ? "Аэропорт Никола Тесла — адрес, отель или город."
          : "Nikola Tesla Airport — address, hotel or city."
    },
    {
      value: "chauffeur",
      label: tf.serviceOptionChauffeur,
      desc: locale === "sr"
        ? "Vozač na sat ili po zahtevu, više stajališta."
        : locale === "ru"
          ? "Водитель почасово или по запросу, несколько остановок."
          : "Driver by the hour or on demand, multiple stops."
    },
    {
      value: "business",
      label: tf.serviceOptionBusiness,
      desc: locale === "sr"
        ? "Korporativni i VIP transfer, kartica ili faktura."
        : locale === "ru"
          ? "Корпоративный и VIP-трансфер, карта или счёт."
          : "Corporate and VIP transfer, card or invoice."
    },
    {
      value: "other",
      label: tf.serviceOptionOther,
      desc: locale === "sr"
        ? "Drugačiji zahtev — opišite u napomeni."
        : locale === "ru"
          ? "Иной запрос — опишите в комментарии."
          : "Different request — describe in notes."
    }
  ];

  return (
    <div>
      <StepHeading
        icon={<HandshakeIcon />}
        title={dict.heading}
        subtitle={dict.subheading}
      />
      <ul className="mt-5 space-y-2.5">
        {options.map((opt) => {
          const active = data.service === opt.value;
          return (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => set("service", opt.value)}
                aria-pressed={active}
                className={
                  "w-full text-left rounded-xl border px-4 py-3 transition-colors " +
                  (active
                    ? "border-gold-400 bg-gold-400/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10")
                }
              >
                <span className="block text-sm font-semibold text-white">
                  {opt.label}
                </span>
                <span className="mt-0.5 block text-xs text-white/60">
                  {opt.desc}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function JourneyStep({
  locale,
  data,
  set
}: {
  locale: Locale;
  data: TransferData;
  set: <K extends keyof TransferData>(k: K, v: TransferData[K]) => void;
}) {
  const dict = t(locale).modal.rent.journey;
  const tf = t(locale).transportForm;
  const showFlight = data.service === "airport";
  return (
    <div>
      <StepHeading
        icon={<PinIcon className="h-5 w-5" />}
        title={dict.heading}
        subtitle={dict.subheading}
      />
      <div className="mt-5 space-y-4">
        <Field label={dict.pickup} required iconLabel>
          <input
            type="text"
            className="glass-input"
            placeholder={tf.pickupPlaceholder}
            value={data.pickup}
            onChange={(e) => set("pickup", e.target.value)}
            autoComplete="off"
          />
        </Field>
        <Field label={dict.destination} required iconLabel>
          <input
            type="text"
            className="glass-input"
            placeholder={tf.destinationPlaceholder}
            value={data.destination}
            onChange={(e) => set("destination", e.target.value)}
            autoComplete="off"
          />
        </Field>
        <Field label={dict.pickupDateTime} required>
          <input
            type="datetime-local"
            className="glass-input"
            value={data.dateTime}
            onChange={(e) => set("dateTime", e.target.value)}
          />
        </Field>
        <Field label={dict.passengers} required>
          <input
            type="number"
            min={1}
            max={8}
            className="glass-input"
            value={data.passengers}
            onChange={(e) => set("passengers", Number(e.target.value) || 1)}
          />
        </Field>
        {showFlight ? (
          <Field label={dict.flightNumber} hint={dict.flightHint}>
            <input
              type="text"
              className="glass-input"
              placeholder="JU 401"
              value={data.flight}
              onChange={(e) => set("flight", e.target.value)}
              autoComplete="off"
            />
          </Field>
        ) : null}
        <Field label={dict.vehiclePreference}>
          <select
            className="glass-input appearance-none"
            value={data.vehicle}
            onChange={(e) => set("vehicle", e.target.value)}
          >
            <option value="">{tf.vehicleAny}</option>
            {vehicles.map((v) => (
              <option key={v.slug} value={v.slug}>
                {v.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

function ReviewStep({
  locale,
  data
}: {
  locale: Locale;
  data: TransferData;
}) {
  const dict = t(locale).modal.rent.review;
  const tf = t(locale).transportForm;
  const serviceLabel = (() => {
    switch (data.service) {
      case "airport":
        return tf.serviceOptionAirport;
      case "chauffeur":
        return tf.serviceOptionChauffeur;
      case "business":
        return tf.serviceOptionBusiness;
      case "other":
        return tf.serviceOptionOther;
      default:
        return "—";
    }
  })();
  const vehicleLabel = data.vehicle
    ? vehicles.find((v) => v.slug === data.vehicle)?.name ?? tf.vehicleAny
    : tf.vehicleAny;

  const items: { label: string; value: string }[] = [
    { label: dict.serviceLabel, value: serviceLabel },
    { label: dict.pickupLabel, value: data.pickup || "—" },
    { label: dict.destinationLabel, value: data.destination || "—" },
    {
      label: dict.whenLabel,
      value: data.dateTime ? formatDateTime(data.dateTime, locale) : "—"
    },
    { label: dict.passengersLabel, value: String(data.passengers) },
    ...(data.service === "airport"
      ? [{ label: dict.flightLabel, value: data.flight || "—" }]
      : []),
    { label: dict.vehicleLabel, value: vehicleLabel }
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
        {dict.paymentNote}
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
  const [data, setData] = useState<TransferData>(EMPTY);
  const set = <K extends keyof TransferData>(k: K, v: TransferData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const valid =
    data.fullName.trim().length > 1 && data.phone.trim().length >= 5;

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
        <ContactFields locale={locale} data={data} set={set} />
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
  set
}: {
  locale: Locale;
  data: TransferData;
  set: <K extends keyof TransferData>(k: K, v: TransferData[K]) => void;
}) {
  const dict = t(locale).modal.contact;
  return (
    <div className="space-y-4">
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
      <Toggle
        label={dict.whatsappSame}
        checked={data.whatsappSame}
        onChange={(v) => set("whatsappSame", v)}
      />
      <Field label={dict.email}>
        <input
          type="email"
          autoComplete="email"
          className="glass-input"
          placeholder={dict.emailPlaceholder}
          value={data.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </Field>
      <Field label={dict.message}>
        <textarea
          rows={3}
          className="glass-input resize-none"
          placeholder={dict.messagePlaceholder}
          value={data.message}
          onChange={(e) => set("message", e.target.value)}
        />
      </Field>
    </div>
  );
}

// ---------- Book by Phone / WhatsApp panel ----------

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
        {/* WhatsApp first */}
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-gold-400/40 bg-gold-400/10 px-4 py-3.5 hover:bg-gold-400/15"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold-400/20 text-gold-200">
            <WhatsappIcon />
          </span>
          <span className="flex-1">
            <span className="block text-[11px] uppercase tracking-widest text-gold-200/80">
              {dict.phonePanel.whatsappCta}
            </span>
            <span className="block font-semibold text-white">
              {siteConfig.contact.whatsapp}
            </span>
          </span>
          <ChevronRight className="text-white/55" />
        </a>

        <a
          href={phoneHref}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 hover:bg-white/10"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 text-white/85">
            <PhoneIcon />
          </span>
          <span className="flex-1">
            <span className="block text-[11px] uppercase tracking-widest text-white/55">
              {dict.phonePanel.callCta}
            </span>
            <span className="block font-semibold text-white">{phone}</span>
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
      <div className="mt-6 space-y-2">
        <a
          href={siteConfig.contact.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold w-full justify-center"
        >
          <WhatsappIcon />
          {dict.phonePanel.whatsappCta}
        </a>
        <button
          type="button"
          onClick={onClose}
          className="btn-ghost w-full justify-center"
        >
          {dict.success.done}
        </button>
      </div>
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
    const bcp47 =
      locale === "sr" ? "sr-Latn" : locale === "ru" ? "ru-RU" : "en-GB";
    return d.toLocaleString(bcp47, {
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

// ---------- Icons (Lucide-backed wrappers + WhatsApp brand mark) ----------

const STROKE = 1.7;

function CloseIcon() {
  return <X className="h-4 w-4" strokeWidth={STROKE} aria-hidden="true" />;
}
function ChevronRight({ className }: { className?: string }) {
  return (
    <LucideChevronRight
      className={(className ?? "") + " h-4 w-4"}
      strokeWidth={STROKE}
      aria-hidden="true"
    />
  );
}
function ChevronLeft() {
  return (
    <LucideChevronLeft className="h-4 w-4" strokeWidth={STROKE} aria-hidden="true" />
  );
}
function CheckIcon() {
  return (
    <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
  );
}
function CheckBigIcon() {
  return <Check className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />;
}
function CarIcon() {
  return <Car className="h-5 w-5" strokeWidth={STROKE} aria-hidden="true" />;
}
function HandshakeIcon() {
  return (
    <Handshake className="h-5 w-5" strokeWidth={STROKE} aria-hidden="true" />
  );
}
function PhoneIcon() {
  return <Phone className="h-5 w-5" strokeWidth={STROKE} aria-hidden="true" />;
}
function WhatsappIcon() {
  return <WhatsAppMark className="h-5 w-5" />;
}
function ClipboardIcon() {
  return (
    <ClipboardList
      className="h-5 w-5"
      strokeWidth={STROKE}
      aria-hidden="true"
    />
  );
}
function UserIcon() {
  return (
    <UserRound className="h-5 w-5" strokeWidth={STROKE} aria-hidden="true" />
  );
}
function PinIcon({ className }: { className?: string }) {
  return (
    <MapPin
      className={className ?? "h-4 w-4"}
      strokeWidth={STROKE}
      aria-hidden="true"
    />
  );
}
