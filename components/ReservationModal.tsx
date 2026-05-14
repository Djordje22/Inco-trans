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
import Image from "next/image";
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
  MapPin,
  PlaneLanding,
  PlaneTakeoff,
  Plus,
  Minus,
  GripVertical,
  Hourglass
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { t } from "@/lib/i18n";
import { vehicles } from "@/lib/fleet-data";
import { siteConfig, type Locale } from "@/lib/site-config";
import WhatsAppMark from "./icons/WhatsAppMark";
import DateTimePicker from "./DateTimePicker";

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
        className={
          "relative w-full glass-strong rounded-2xl overflow-hidden animate-fade-up " +
          (flow === "transfer" ? "sm:max-w-xl" : "sm:max-w-md")
        }
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
  const progress = ((current - 1) / (steps.length - 1)) * 100;

  return (
    <div className="pb-4">
      <ol className="relative grid grid-cols-4">
        <span
          aria-hidden="true"
          className="absolute left-[12.5%] right-[12.5%] top-3.5 h-px bg-white/15"
        />
        <span
          aria-hidden="true"
          className="absolute left-[12.5%] top-3.5 h-px bg-gold-400/75"
          style={{ width: `${progress * 0.75}%` }}
        />
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isCurrent = stepNum === current;
          const isDone = stepNum < current;
          return (
            <li key={label} className="relative z-10 flex flex-col items-center">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={
                  "inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold border " +
                  (isCurrent
                    ? "bg-white text-ink-900 border-white"
                    : isDone
                      ? "bg-gold-400 text-ink-900 border-gold-400"
                      : "bg-ink-900 text-white/55 border-white/20")
                }
              >
                {isDone ? <CheckIcon /> : stepNum}
              </span>
              <span
                className={
                  "mt-2 text-center text-[10px] uppercase tracking-widest whitespace-nowrap " +
                  (isCurrent ? "text-white/85" : "text-white/45")
                }
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------- Transfer flow (4 steps) ----------

type ServiceType = "airport" | "chauffeur" | "business" | "other";
type AirportDirection = "from" | "to" | "";

type Stop = { id: string; value: string };

const MIN_WAITING_HOURS = 1;
const MAX_WAITING_HOURS = 24;

const makeStopId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "stop-" + Math.random().toString(36).slice(2, 9);

type TransferData = {
  service: ServiceType | "";
  airportDirection: AirportDirection;
  pickup: string;
  destination: string;
  stops: Stop[];
  waitingHours: number; // 0 = none, otherwise 1..MAX_WAITING_HOURS
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
  airportDirection: "",
  pickup: "",
  destination: "",
  stops: [],
  waitingHours: 0,
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
  const airportName = dict.rent.airportDirection.airportName;
  const [data, setData] = useState<TransferData>(EMPTY);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [preStep, setPreStep] = useState<"service" | "direction" | null>(
    "service"
  );

  const set = <K extends keyof TransferData>(k: K, v: TransferData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const isAirport = data.service === "airport";
  const onServiceScreen = preStep === "service";
  const onDirectionScreen = preStep === "direction";

  const serviceValid = data.service !== "";
  const directionValid = data.airportDirection !== "";
  const journeyValid =
    data.pickup.trim() !== "" &&
    data.destination.trim() !== "" &&
    data.dateTime.trim() !== "";
  const vehicleValid = data.vehicle.trim() !== "";
  const contactValid =
    data.fullName.trim().length > 1 && data.phone.trim().length >= 5;

  const applyAirportDirection = () => {
    if (data.airportDirection === "from") {
      setData((d) => ({
        ...d,
        pickup: airportName,
        destination: d.destination === airportName ? "" : d.destination
      }));
      return;
    }
    setData((d) => ({
      ...d,
      destination: airportName,
      pickup: d.pickup === airportName ? "" : d.pickup
    }));
  };

  const onPrev = () => {
    if (onServiceScreen) {
      onBack();
      return;
    }
    if (onDirectionScreen) {
      setPreStep("service");
      return;
    }
    if (step === 1) {
      setPreStep(isAirport ? "direction" : "service");
      return;
    }
    setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const onNext = () => {
    if (onServiceScreen) {
      if (!serviceValid) return;
      setPreStep(isAirport ? "direction" : null);
      return;
    }
    if (onDirectionScreen) {
      if (!directionValid) return;
      applyAirportDirection();
      setPreStep(null);
      return;
    }
    if (step === 1 && !journeyValid) return;
    if (step === 2 && !vehicleValid) return;
    if (step === 3 && !contactValid) return;
    setStep((s) => (s + 1) as 2 | 3 | 4);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    onDone();
  };

  // Lock the prefilled endpoint so users can't edit it on the journey form.
  const lockPickup = isAirport && data.airportDirection === "from";
  const lockDestination = isAirport && data.airportDirection === "to";

  return (
    <div>
      {preStep === null ? (
        <StepProgress
          steps={[
            dict.progress.journey,
            dict.progress.vehicle,
            dict.progress.contact,
            dict.progress.review
          ]}
          current={step}
        />
      ) : null}

      <div className={preStep === null ? "mt-6" : ""}>
        {onServiceScreen ? (
          <ServiceStep locale={locale} data={data} set={set} />
        ) : null}
        {onDirectionScreen ? (
          <AirportDirectionStep locale={locale} data={data} set={set} />
        ) : null}
        {preStep === null && step === 1 ? (
          <JourneyStep
            locale={locale}
            data={data}
            set={set}
            lockPickup={lockPickup}
            lockDestination={lockDestination}
          />
        ) : null}
        {preStep === null && step === 2 ? (
          <VehicleStep locale={locale} data={data} set={set} />
        ) : null}
        {preStep === null && step === 3 ? (
          <ContactFields locale={locale} data={data} set={set} />
        ) : null}
        {preStep === null && step === 4 ? (
          <ReviewStep locale={locale} data={data} />
        ) : null}
      </div>

      <FormFooter
        locale={locale}
        onBack={onPrev}
        onNext={preStep !== null || step < 4 ? onNext : undefined}
        onSubmit={preStep === null && step === 4 ? onSubmit : undefined}
        nextDisabled={
          (onServiceScreen && !serviceValid) ||
          (onDirectionScreen && !directionValid) ||
          (preStep === null && step === 1 && !journeyValid) ||
          (preStep === null && step === 2 && !vehicleValid) ||
          (preStep === null && step === 3 && !contactValid)
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

function AirportDirectionStep({
  locale,
  data,
  set
}: {
  locale: Locale;
  data: TransferData;
  set: <K extends keyof TransferData>(k: K, v: TransferData[K]) => void;
}) {
  const dict = t(locale).modal.rent.airportDirection;
  const options: {
    value: AirportDirection & ("from" | "to");
    title: string;
    desc: string;
    Icon: typeof PlaneLanding;
  }[] = [
    {
      value: "from",
      title: dict.fromTitle,
      desc: dict.fromDesc,
      Icon: PlaneLanding
    },
    { value: "to", title: dict.toTitle, desc: dict.toDesc, Icon: PlaneTakeoff }
  ];

  return (
    <div>
      <StepHeading title={dict.heading} subtitle={dict.subheading} />
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:auto-rows-fr">
        {options.map((opt) => {
          const active = data.airportDirection === opt.value;
          const Icon = opt.Icon;
          return (
            <li key={opt.value} className="h-full">
              <button
                type="button"
                onClick={() => set("airportDirection", opt.value)}
                aria-pressed={active}
                className={
                  "h-full w-full text-left rounded-xl border px-4 py-4 transition-colors flex items-start gap-3 " +
                  (active
                    ? "border-gold-400 bg-gold-400/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10")
                }
              >
                <span
                  className={
                    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 " +
                    (active
                      ? "bg-gold-400/20 ring-gold-400/50 text-gold-200"
                      : "bg-white/5 ring-white/10 text-white/85")
                  }
                >
                  <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white">
                    {opt.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-white/60">
                    {opt.desc}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={
                    "mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border " +
                    (active
                      ? "border-gold-400 bg-gold-400"
                      : "border-white/30 bg-transparent")
                  }
                >
                  {active ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-ink-900" />
                  ) : null}
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
  set,
  lockPickup = false,
  lockDestination = false
}: {
  locale: Locale;
  data: TransferData;
  set: <K extends keyof TransferData>(k: K, v: TransferData[K]) => void;
  lockPickup?: boolean;
  lockDestination?: boolean;
}) {
  const dict = t(locale).modal.rent.journey;
  const tf = t(locale).transportForm;
  const isAirport = data.service === "airport";
  const showFlight = isAirport;
  const dateTimeField = (
    <Field label={dict.pickupDateTime} required>
      <DateTimePicker
        id="qf-dt"
        locale={locale}
        value={data.dateTime}
        onChange={(value) => set("dateTime", value)}
        ariaLabel={dict.pickupDateTime}
      />
    </Field>
  );

  return (
    <div>
      <StepHeading
        icon={<PinIcon className="h-5 w-5" />}
        title={dict.heading}
        subtitle={dict.subheading}
      />
      <div className="mt-5 space-y-4">
        {isAirport ? dateTimeField : null}
        <Field label={dict.pickup} required iconLabel>
          <input
            type="text"
            className="glass-input disabled:opacity-70 disabled:cursor-not-allowed"
            placeholder={tf.pickupPlaceholder}
            value={data.pickup}
            onChange={(e) => set("pickup", e.target.value)}
            disabled={lockPickup}
            readOnly={lockPickup}
            aria-readonly={lockPickup}
            autoComplete="off"
          />
        </Field>
        <Field label={dict.destination} required iconLabel>
          <input
            type="text"
            className="glass-input disabled:opacity-70 disabled:cursor-not-allowed"
            placeholder={tf.destinationPlaceholder}
            value={data.destination}
            onChange={(e) => set("destination", e.target.value)}
            disabled={lockDestination}
            readOnly={lockDestination}
            aria-readonly={lockDestination}
            autoComplete="off"
          />
        </Field>
        {isAirport ? (
          <>
            <StopsList locale={locale} data={data} set={set} />
            <WaitingHoursCard locale={locale} data={data} set={set} />
          </>
        ) : null}
        {!isAirport ? dateTimeField : null}
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
      </div>
    </div>
  );
}

function VehicleStep({
  locale,
  data,
  set
}: {
  locale: Locale;
  data: TransferData;
  set: <K extends keyof TransferData>(k: K, v: TransferData[K]) => void;
}) {
  const dict = t(locale).modal.rent.vehicle;
  const fleetDict = t(locale).fleetCard;

  return (
    <div>
      <StepHeading
        icon={<CarIcon />}
        title={dict.heading}
        subtitle={dict.subheading}
      />
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {vehicles.map((vehicle) => {
          const active = data.vehicle === vehicle.slug;
          const altText =
            locale === "sr"
              ? `${vehicle.name} iz Inco Trans flote`
              : locale === "ru"
                ? `${vehicle.name} из автопарка Inco Trans`
                : `${vehicle.name} from the Inco Trans fleet`;

          return (
            <li key={vehicle.slug}>
              <button
                type="button"
                onClick={() => set("vehicle", vehicle.slug)}
                aria-pressed={active}
                className={
                  "group h-full w-full overflow-hidden rounded-xl border bg-ink-900 text-left transition-colors " +
                  (active
                    ? "border-gold-400 shadow-gold"
                    : "border-white/12 hover:border-white/25 hover:bg-ink-800")
                }
              >
                <div className="relative aspect-[16/10] bg-ink-800">
                  <Image
                    src={vehicle.image}
                    alt={altText}
                    fill
                    sizes="(max-width: 640px) 100vw, 260px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-900 to-transparent"
                  />
                  <span
                    aria-hidden="true"
                    className={
                      "absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full border " +
                      (active
                        ? "border-gold-400 bg-gold-400"
                        : "border-white/35 bg-ink-950/70")
                    }
                  >
                    {active ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-ink-900" />
                    ) : null}
                  </span>
                </div>

                <div className="p-4">
                  <h4 className="font-display text-xl text-white">
                    {vehicle.name}
                  </h4>
                  <p className="mt-1 min-h-[2.5rem] text-xs leading-relaxed text-white/60">
                    {vehicle.tagline[locale]}
                  </p>
                  <dl className="mt-4 flex flex-wrap gap-2 text-xs text-white/75">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5">
                      <dt>{fleetDict.passengers}</dt>
                      <dd className="font-semibold text-white">
                        {vehicle.passengers}
                      </dd>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5">
                      <dt>{fleetDict.luggage}</dt>
                      <dd className="font-semibold text-white">
                        {vehicle.luggage}
                      </dd>
                    </div>
                  </dl>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
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

  const journeyDict = t(locale).modal.rent.journey;
  const stopValues = data.stops
    .map((s) => s.value.trim())
    .filter((v) => v.length > 0);
  const stopsSummary = stopValues.join(" · ");

  const items: { label: string; value: string }[] = [
    { label: dict.serviceLabel, value: serviceLabel },
    { label: dict.pickupLabel, value: data.pickup || "—" },
    ...(stopValues.length > 0
      ? [
          {
            label: journeyDict.stopLabel
              .replace("{n}", `1–${stopValues.length}`),
            value: stopsSummary
          }
        ]
      : []),
    { label: dict.destinationLabel, value: data.destination || "—" },
    {
      label: dict.whenLabel,
      value: data.dateTime ? formatDateTime(data.dateTime, locale) : "—"
    },
    { label: dict.passengersLabel, value: String(data.passengers) },
    ...(data.service === "airport"
      ? [{ label: dict.flightLabel, value: data.flight || "—" }]
      : []),
    ...(data.service === "airport" && data.waitingHours > 0
      ? [
          {
            label: journeyDict.waitingTitle,
            value: `${data.waitingHours} ${hourWord(locale, data.waitingHours)}`
          }
        ]
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

// ---------- Stops + waiting hours (airport-only blocks) ----------

function SortableStopRow({
  stop,
  index,
  locale,
  onChange,
  onRemove
}: {
  stop: Stop;
  index: number;
  locale: Locale;
  onChange: (id: string, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const dict = t(locale).modal.rent.journey;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: stop.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 30 : undefined
  };

  const label = dict.stopLabel.replace("{n}", String(index + 1));

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={
        "rounded-xl border px-3 py-2.5 " +
        (isDragging
          ? "border-gold-400/40 bg-ink-800 shadow-glass"
          : "border-white/10 bg-white/5")
      }
    >
      <div className="mb-1.5 flex items-center gap-1 text-[11px] uppercase tracking-widest text-white/60">
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={dict.reorderStop}
          {...attributes}
          {...listeners}
          className="touch-none inline-flex h-8 w-6 items-center justify-center rounded text-white/45 hover:text-white/85 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
        <input
          type="text"
          value={stop.value}
          onChange={(e) => onChange(stop.id, e.target.value)}
          className="glass-input flex-1"
          placeholder={dict.stopPlaceholder}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => onRemove(stop.id)}
          aria-label={dict.removeStop}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

function StopsList({
  locale,
  data,
  set
}: {
  locale: Locale;
  data: TransferData;
  set: <K extends keyof TransferData>(k: K, v: TransferData[K]) => void;
}) {
  const dict = t(locale).modal.rent.journey;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onChange = (id: string, value: string) => {
    set(
      "stops",
      data.stops.map((s) => (s.id === id ? { ...s, value } : s))
    );
  };

  const onRemove = (id: string) => {
    set(
      "stops",
      data.stops.filter((s) => s.id !== id)
    );
  };

  const onAdd = () => {
    set("stops", [...data.stops, { id: makeStopId(), value: "" }]);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = data.stops.findIndex((s) => s.id === active.id);
    const newIndex = data.stops.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    set("stops", arrayMove(data.stops, oldIndex, newIndex));
  };

  return (
    <div>
      {data.stops.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={data.stops.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-3">
              {data.stops.map((stop, i) => (
                <SortableStopRow
                  key={stop.id}
                  stop={stop}
                  index={i}
                  locale={locale}
                  onChange={onChange}
                  onRemove={onRemove}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : null}

      <button
        type="button"
        onClick={onAdd}
        className={
          "w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-white/80 hover:bg-white/[0.06] hover:border-white/25 transition-colors " +
          (data.stops.length > 0 ? "mt-3" : "")
        }
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {dict.addStop}
      </button>
    </div>
  );
}

function hourWord(locale: Locale, n: number): string {
  if (locale === "en") return n === 1 ? "hour" : "hours";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (locale === "sr") {
    if (mod100 >= 11 && mod100 <= 14) return "sati";
    if (mod10 === 1) return "sat";
    if (mod10 >= 2 && mod10 <= 4) return "sata";
    return "sati";
  }
  // ru
  if (mod100 >= 11 && mod100 <= 14) return "часов";
  if (mod10 === 1) return "час";
  if (mod10 >= 2 && mod10 <= 4) return "часа";
  return "часов";
}

function waitingBanner(locale: Locale, n: number): string {
  const h = hourWord(locale, n);
  if (locale === "sr") {
    return `+${n} ${h} čekanja biće dodato vašoj rezervaciji`;
  }
  if (locale === "ru") {
    return `+${n} ${h} ожидания будет добавлено к вашему бронированию`;
  }
  return `+${n} ${h} of waiting time will be added to your booking`;
}

function WaitingHoursCard({
  locale,
  data,
  set
}: {
  locale: Locale;
  data: TransferData;
  set: <K extends keyof TransferData>(k: K, v: TransferData[K]) => void;
}) {
  const dict = t(locale).modal.rent.journey;
  const hours = data.waitingHours;
  const showBanner = hours > 0;

  const setClamped = (next: number) => {
    if (next <= 0) {
      set("waitingHours", 0);
      return;
    }
    const clamped = Math.max(
      MIN_WAITING_HOURS,
      Math.min(MAX_WAITING_HOURS, Math.round(next))
    );
    set("waitingHours", clamped);
  };

  const decrement = () =>
    setClamped(hours === 0 ? 0 : hours - 1);
  const increment = () =>
    setClamped(hours === 0 ? MIN_WAITING_HOURS : hours + 1);

  const display = hours === 0 ? "0h" : `${hours}h`;

  return (
    <div>
      <div className="glass rounded-xl p-4 flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 text-gold-300">
          <Hourglass className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-sm text-white">
            {dict.waitingTitle}
          </h4>
          <p className="mt-0.5 text-xs text-white/55">{dict.waitingDesc}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={decrement}
            aria-label={dict.waitingDecreaseAria}
            disabled={hours === 0}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <span
            aria-live="polite"
            className="min-w-[2.5rem] text-center text-sm font-semibold text-white tabular-nums"
          >
            {display}
          </span>
          <button
            type="button"
            onClick={increment}
            aria-label={dict.waitingIncreaseAria}
            disabled={hours >= MAX_WAITING_HOURS}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      {showBanner ? (
        <p className="mt-2 text-xs text-gold-300">
          {waitingBanner(locale, hours)}
        </p>
      ) : null}
    </div>
  );
}

// ---------- Shared form bits ----------

function StepHeading({
  icon,
  title,
  subtitle
}: {
  icon?: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center">
      {icon ? (
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 text-white/85">
          {icon}
        </span>
      ) : null}
      <h3
        className={
          (icon ? "mt-3 " : "") +
          "font-display text-xl sm:text-2xl text-white"
        }
      >
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

function bcp47(locale: Locale): string {
  return locale === "sr" ? "sr-Latn" : locale === "ru" ? "ru-RU" : "en-US";
}

function dateFromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day || 1);
}

function parseDateTimeValue(value: string): { date: string; time: string } | null {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(value);
  if (!match) return null;
  return { date: match[1], time: match[2] };
}

function formatDateTime(iso: string, locale: Locale): string {
  try {
    const parsed = parseDateTimeValue(iso);
    if (!parsed) return iso;
    const d = dateFromKey(parsed.date);
    if (isNaN(d.getTime())) return iso;
    const formattedDate = d.toLocaleDateString(bcp47(locale), {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    return `${formattedDate} ${parsed.time}`;
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
