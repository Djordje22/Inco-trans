"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Check,
  ChevronLeft as LucideChevronLeft,
  ChevronRight as LucideChevronRight,
  ChevronDown,
  Car,
  Handshake,
  Phone,
  Mail,
  CreditCard,
  Banknote,
  HelpCircle,
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
import {
  clampBookingCount,
  MAX_LUGGAGE,
  MAX_PASSENGERS,
  MIN_LUGGAGE,
  MIN_PASSENGERS
} from "@/lib/booking-constraints";
import { vehicles } from "@/lib/fleet-data";
import { siteConfig, type Locale } from "@/lib/site-config";
import type { RoutePriceEstimate } from "@/lib/pricing";
import WhatsAppMark from "./icons/WhatsAppMark";
import DateTimePicker from "./DateTimePicker";

// ---------- Context ----------

type FlowKind = "choose" | "transfer" | "handle" | "phone" | "success";
type SubmitState = "idle" | "submitting" | "error";

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
type PreferredCommunication = "phone_sms" | "viber_whatsapp" | "email";
type PaymentMethod = "card" | "cash";
type RouteEstimateStatus = "idle" | "loading" | "available" | "unavailable";

type AddressPlace = {
  placeId?: string;
  label: string;
  formattedAddress?: string;
  latitude: number;
  longitude: number;
  countryCode?: string;
};

type Stop = { id: string; value: string; place?: AddressPlace };

type PlaceSuggestion = {
  placeId: string;
  text: string;
  mainText: string;
  secondaryText?: string;
};

const MIN_WAITING_HOURS = 1;
const MAX_WAITING_HOURS = 24;

const makeStopId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "stop-" + Math.random().toString(36).slice(2, 9);

const BELGRADE_AIRPORT_COORDS = {
  latitude: 44.8184,
  longitude: 20.3091
};

const airportPlace = (label: string): AddressPlace => ({
  placeId: "belgrade-nikola-tesla-airport",
  label,
  formattedAddress: label,
  ...BELGRADE_AIRPORT_COORDS,
  countryCode: "rs"
});

type TransferData = {
  service: ServiceType | "";
  airportDirection: AirportDirection;
  pickup: string;
  destination: string;
  stops: Stop[];
  pickupPlace?: AddressPlace;
  destinationPlace?: AddressPlace;
  routeEstimate?: RoutePriceEstimate;
  routeEstimateStatus: RouteEstimateStatus;
  waitingHours: number; // 0 = none, otherwise 1..MAX_WAITING_HOURS
  dateTime: string;
  passengers: number;
  luggage: number;
  flight: string;
  vehicle: string;
  fullName: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
  companyName: string;
  preferredCommunication: PreferredCommunication | "";
  paymentMethod: PaymentMethod;
  termsAccepted: boolean;
  message: string;
};

const EMPTY: TransferData = {
  service: "",
  airportDirection: "",
  pickup: "",
  destination: "",
  stops: [],
  pickupPlace: undefined,
  destinationPlace: undefined,
  routeEstimate: undefined,
  routeEstimateStatus: "idle",
  waitingHours: 0,
  dateTime: "",
  passengers: 1,
  luggage: 0,
  flight: "",
  vehicle: "",
  fullName: "",
  email: "",
  phoneCountryCode: "+381",
  phone: "",
  companyName: "",
  preferredCommunication: "",
  paymentMethod: "cash",
  termsAccepted: false,
  message: ""
};

const PHONE_COUNTRY_CODES = [
  { code: "+381", flag: "🇷🇸" },
  { code: "+382", flag: "🇲🇪" },
  { code: "+387", flag: "🇧🇦" },
  { code: "+385", flag: "🇭🇷" },
  { code: "+386", flag: "🇸🇮" },
  { code: "+389", flag: "🇲🇰" },
  { code: "+49", flag: "🇩🇪" },
  { code: "+43", flag: "🇦🇹" },
  { code: "+41", flag: "🇨🇭" },
  { code: "+44", flag: "🇬🇧" },
  { code: "+1", flag: "🇺🇸" }
];

const isEmailValid = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const isContactValid = (data: TransferData) =>
  data.fullName.trim().length > 1 &&
  isEmailValid(data.email) &&
  data.phone.trim().length >= 5 &&
  data.preferredCommunication !== "";

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
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

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
  const contactValid = isContactValid(data);

  const applyAirportDirection = () => {
    if (data.airportDirection === "from") {
      setData((d) => ({
        ...d,
        pickup: airportName,
        pickupPlace: airportPlace(airportName),
        destination: d.destination === airportName ? "" : d.destination
      }));
      return;
    }
    setData((d) => ({
      ...d,
      destination: airportName,
      destinationPlace: airportPlace(airportName),
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

  const submitRequest = async () => {
    if (!data.termsAccepted) return;
    setSubmitState("submitting");

    const response = await fetch("/api/booking-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        source: "reservation_modal",
        service: data.service,
        airportDirection: data.airportDirection,
        pickup: data.pickup,
        destination: data.destination,
        stops: data.stops.map((stop) => stop.value),
        pickupPlace: data.pickupPlace,
        destinationPlace: data.destinationPlace,
        stopPlaces: data.stops.map((stop) => stop.place).filter(Boolean),
        waitingHours: data.waitingHours,
        dateTime: data.dateTime,
        passengers: data.passengers,
        luggage: data.luggage,
        flight: data.flight,
        vehicle: data.vehicle,
        fullName: data.fullName,
        email: data.email,
        phoneCountryCode: data.phoneCountryCode,
        phone: data.phone,
        companyName: data.companyName,
        preferredCommunication: data.preferredCommunication,
        paymentMethod: data.paymentMethod,
        message: data.message,
        termsAccepted: data.termsAccepted,
        priceEstimate: data.routeEstimate
      })
    });

    if (response.ok) {
      onDone();
      return;
    }

    setSubmitState("error");
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
          <ReviewStep locale={locale} data={data} set={set} />
        ) : null}
      </div>

      <FormFooter
        locale={locale}
        onBack={onPrev}
        onNext={preStep !== null || step < 4 ? onNext : undefined}
        onSubmit={preStep === null && step === 4 ? submitRequest : undefined}
        nextDisabled={
          (onServiceScreen && !serviceValid) ||
          (onDirectionScreen && !directionValid) ||
          (preStep === null && step === 1 && !journeyValid) ||
          (preStep === null && step === 2 && !vehicleValid) ||
          (preStep === null && step === 3 && !contactValid) ||
          (preStep === null && step === 4 && !data.termsAccepted) ||
          (preStep === null && step === 4 && data.routeEstimateStatus === "loading") ||
          submitState === "submitting"
        }
      />
      {submitState === "error" ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-100"
        >
          We could not send the request. Please try WhatsApp or phone.
        </p>
      ) : null}
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
          <AddressAutocomplete
            locale={locale}
            placeholder={tf.pickupPlaceholder}
            value={data.pickup}
            selectedPlace={data.pickupPlace}
            onChange={(value, place) => {
              set("pickup", value);
              set("pickupPlace", place);
              set("routeEstimate", undefined);
              set("routeEstimateStatus", "idle");
            }}
            disabled={lockPickup}
            readOnly={lockPickup}
          />
        </Field>
        <Field label={dict.destination} required iconLabel>
          <AddressAutocomplete
            locale={locale}
            placeholder={tf.destinationPlaceholder}
            value={data.destination}
            selectedPlace={data.destinationPlace}
            onChange={(value, place) => {
              set("destination", value);
              set("destinationPlace", place);
              set("routeEstimate", undefined);
              set("routeEstimateStatus", "idle");
            }}
            disabled={lockDestination}
            readOnly={lockDestination}
          />
        </Field>
        {isAirport ? (
          <>
            <StopsList locale={locale} data={data} set={set} />
            <WaitingHoursCard locale={locale} data={data} set={set} />
          </>
        ) : null}
        {!isAirport ? dateTimeField : null}
        <div className="grid grid-cols-2 gap-3">
          <Field label={dict.passengers} required>
            <input
              type="number"
              min={MIN_PASSENGERS}
              max={MAX_PASSENGERS}
              className="glass-input"
              value={data.passengers}
              onChange={(e) =>
                set(
                  "passengers",
                  clampBookingCount(
                    Number(e.target.value),
                    MIN_PASSENGERS,
                    MAX_PASSENGERS
                  )
                )
              }
              required
            />
          </Field>
          <Field label={dict.luggage} required>
            <input
              type="number"
              min={MIN_LUGGAGE}
              max={MAX_LUGGAGE}
              className="glass-input"
              value={data.luggage}
              onChange={(e) =>
                set(
                  "luggage",
                  clampBookingCount(
                    Number(e.target.value),
                    MIN_LUGGAGE,
                    MAX_LUGGAGE
                  )
                )
              }
              required
            />
          </Field>
        </div>
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
                    className="object-cover"
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
  data,
  set
}: {
  locale: Locale;
  data: TransferData;
  set: <K extends keyof TransferData>(k: K, v: TransferData[K]) => void;
}) {
  const dict = t(locale).modal.rent.review;
  const tf = t(locale).transportForm;
  const contactDict = t(locale).modal.contact;
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
  const serviceWithDirection =
    data.service === "airport"
      ? `${serviceLabel} (${
          data.airportDirection === "from"
            ? dict.airportArrival
            : dict.airportDeparture
        })`
      : serviceLabel;
  const vehicleLabel = data.vehicle
    ? vehicles.find((v) => v.slug === data.vehicle)?.name ?? tf.vehicleAny
    : tf.vehicleAny;
  const routePointKey = [
    data.pickupPlace
      ? `${data.pickupPlace.latitude},${data.pickupPlace.longitude}`
      : "",
    ...data.stops.map((stop) =>
      stop.place ? `${stop.place.latitude},${stop.place.longitude}` : ""
    ),
    data.destinationPlace
      ? `${data.destinationPlace.latitude},${data.destinationPlace.longitude}`
      : "",
    data.waitingHours
  ].join("|");

  useEffect(() => {
    const stopPlaces = data.stops
      .map((stop) => stop.place)
      .filter((place): place is AddressPlace => Boolean(place));
    const hasUnresolvedStop = data.stops.some(
      (stop) => stop.value.trim().length > 0 && !stop.place
    );
    const points = [data.pickupPlace, ...stopPlaces, data.destinationPlace];

    if (
      points.length < 2 ||
      !data.pickupPlace ||
      !data.destinationPlace ||
      hasUnresolvedStop
    ) {
      set("routeEstimate", undefined);
      set("routeEstimateStatus", "unavailable");
      return;
    }

    let cancelled = false;
    set("routeEstimateStatus", "loading");

    void fetch("/api/routes/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        points,
        waitingHours: data.waitingHours
      })
    })
      .then((response) => response.json())
      .then((result) => {
        if (cancelled) return;
        if (result?.available && result?.estimate) {
          set("routeEstimate", result.estimate);
          set("routeEstimateStatus", "available");
          return;
        }
        set("routeEstimate", undefined);
        set("routeEstimateStatus", "unavailable");
      })
      .catch(() => {
        if (cancelled) return;
        set("routeEstimate", undefined);
        set("routeEstimateStatus", "unavailable");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routePointKey]);

  const stopValues = data.stops
    .map((s) => s.value.trim())
    .filter((v) => v.length > 0);
  const stopsSummary = stopValues.join(" · ");

  const preferredCommunicationLabel = (() => {
    switch (data.preferredCommunication) {
      case "phone_sms":
        return contactDict.preferredPhoneSms;
      case "viber_whatsapp":
        return contactDict.preferredViberWhatsapp;
      case "email":
        return contactDict.preferredEmail;
      default:
        return "—";
    }
  })();

  const estimate = data.routeEstimate;
  const hasPriceEstimate =
    data.routeEstimateStatus === "available" && Boolean(estimate);
  const hasDistanceOverage = (estimate?.distanceOverageKm ?? 0) > 0;

  const serviceItems = [
    { label: dict.selectedServiceLabel, value: serviceWithDirection }
  ];
  const tripItems = [
    { label: dict.pickupLabel, value: data.pickup || "—" },
    ...(stopValues.length > 0
      ? [{ label: dict.stopsLabel, value: stopsSummary }]
      : []),
    { label: dict.destinationLabel, value: data.destination || "—" },
    {
      label: dict.whenLabel,
      value: data.dateTime ? formatDateTime(data.dateTime, locale) : "—"
    },
    { label: dict.passengersLabel, value: String(data.passengers) },
    { label: dict.luggageLabel, value: String(data.luggage) },
    ...(data.service === "airport"
      ? [{ label: dict.flightLabel, value: data.flight || "—" }]
      : []),
    ...(data.service === "airport" && data.waitingHours > 0
      ? [
          {
            label: dict.waitingLabel,
            value: `${data.waitingHours} ${hourWord(locale, data.waitingHours)}`
          }
        ]
      : []),
  ];
  const vehicleItems = [{ label: dict.vehicleLabel, value: vehicleLabel }];
  const contactItems = [
    { label: dict.fullNameLabel, value: data.fullName || "—" },
    { label: dict.emailLabel, value: data.email || "—" },
    {
      label: dict.phoneLabel,
      value:
        data.phoneCountryCode || data.phone
          ? `${data.phoneCountryCode} ${data.phone}`.trim()
          : "—"
    },
    {
      label: dict.preferredCommunicationLabel,
      value: preferredCommunicationLabel
    },
    { label: dict.companyNameLabel, value: data.companyName || "—" },
    { label: dict.messageLabel, value: data.message || "—" }
  ];
  const overageLabel = dict.distanceOverageLabel
    .replace("{total}", formatDistance(estimate?.distanceKm ?? 0, locale))
    .replace("{included}", formatDistance(estimate?.includedDistanceKm ?? 50, locale));
  const waitingPriceLabel = dict.waitingPriceLabel.replace(
    "{hours}",
    formatDistance(data.waitingHours, locale)
  );
  const termsHref = legalHref(locale, "terms");
  const privacyHref = legalHref(locale, "privacy");

  return (
    <div>
      <StepHeading
        icon={<ClipboardIcon />}
        title={dict.heading}
        subtitle={dict.subheading}
      />
      <div className="mt-5 space-y-3">
        <details className="group mx-auto w-full max-w-sm rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <summary className="flex cursor-pointer list-none select-none items-center gap-2 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
            <HelpCircle className="h-4 w-4 text-white/55" aria-hidden="true" />
            <span className="min-w-0 flex-1">{dict.processTitle}</span>
            <ChevronDown
              className="h-4 w-4 text-white/50 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <ol className="mt-3 space-y-2 text-xs leading-relaxed text-white/65">
            {dict.processSteps.map((step, index) => (
              <li key={step} className="flex gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-[10px] font-semibold text-gold-200">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </details>

        <ReviewCard title={dict.serviceCardTitle} items={serviceItems} />
        <ReviewCard title={dict.tripCardTitle} items={tripItems} />
        <ReviewCard title={dict.vehicleCardTitle} items={vehicleItems} />
        <ReviewCard title={dict.contactCardTitle} items={contactItems} />

        <PaymentCard
          dict={dict}
          selected={data.paymentMethod}
          onSelect={(method) => set("paymentMethod", method)}
        />

        {hasPriceEstimate && estimate ? (
          <section className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <h4 className="text-sm font-semibold text-white">
              {dict.estimateCardTitle}
            </h4>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-white/55">{dict.basePriceLabel}</dt>
                <dd className="text-right font-medium text-white">
                  {formatPrice(estimate.basePrice, locale)}
                </dd>
              </div>
              {estimate.waitingPrice > 0 ? (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-white/55">{waitingPriceLabel}</dt>
                  <dd className="text-right font-medium text-white">
                    {formatPrice(estimate.waitingPrice, locale)}
                  </dd>
                </div>
              ) : null}
              {hasDistanceOverage ? (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-white/55">{overageLabel}</dt>
                  <dd className="text-right font-medium text-white">
                    {formatPrice(estimate.overagePrice, locale)}
                  </dd>
                </div>
              ) : null}
            </dl>
            <div className="my-3 h-px bg-white/10" />
            <div className="flex items-start justify-between gap-3">
              <span className="text-base font-semibold text-white">
                {dict.totalEstimateLabel}
              </span>
              <span className="text-right text-2xl font-semibold text-gold-200">
                {formatPrice(estimate.totalPrice, locale)}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/55">
              {dict.estimateDisclaimer}
            </p>
          </section>
        ) : null}

        <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={data.termsAccepted}
            onChange={(e) => set("termsAccepted", e.target.checked)}
            className="peer sr-only"
            required
          />
          <span
            aria-hidden="true"
            className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/35 peer-checked:border-gold-400 peer-checked:bg-gold-400 peer-checked:[&>span]:opacity-100"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-ink-900 opacity-0" />
          </span>
          <span>
            {dict.termsPrefix}{" "}
            <Link href={termsHref} className="text-gold-200 underline-offset-4 hover:underline">
              {dict.termsLink}
            </Link>{" "}
            {dict.termsMiddle}{" "}
            <Link href={privacyHref} className="text-gold-200 underline-offset-4 hover:underline">
              {dict.privacyLink}
            </Link>
            .
          </span>
        </label>
      </div>
    </div>
  );
}

function ReviewCard({
  title,
  items
}: {
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <dl className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-3">
            <dt className="text-white/55">{item.label}</dt>
            <dd className="max-w-[60%] text-right font-medium text-white">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

type ReviewDictionary = ReturnType<typeof t>["modal"]["rent"]["review"];

function PaymentCard({
  dict,
  selected,
  onSelect
}: {
  dict: ReviewDictionary;
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}) {
  const methods: {
    value: PaymentMethod;
    title: string;
    desc: string;
    icon: ReactNode;
  }[] = [
    {
      value: "cash",
      title: dict.paymentCash,
      desc: dict.paymentCashDesc,
      icon: <Banknote className="h-4 w-4" aria-hidden="true" />
    },
    {
      value: "card",
      title: dict.paymentCard,
      desc: dict.paymentCardDesc,
      icon: <CreditCard className="h-4 w-4" aria-hidden="true" />
    }
  ];

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <h4 className="text-[11px] uppercase tracking-[0.22em] text-white/55">
        {dict.paymentCardTitle}
      </h4>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {methods.map((method) => {
          const active = selected === method.value;
          return (
            <button
              key={method.value}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(method.value)}
              className={
                "rounded-xl border px-3.5 py-3 text-left transition-colors " +
                (active
                  ? "border-white/85 bg-white/8 text-white"
                  : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/8")
              }
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className="text-white/70">{method.icon}</span>
                {method.title}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-white/45">
                {method.desc}
              </span>
            </button>
          );
        })}
      </div>
    </section>
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
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const set = <K extends keyof TransferData>(k: K, v: TransferData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const valid = isContactValid(data);

  const submitInquiry = async () => {
    if (!valid) return;
    setSubmitState("submitting");

    const response = await fetch("/api/contact-messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        source: "reservation_modal",
        fullName: data.fullName,
        email: data.email,
        phoneCountryCode: data.phoneCountryCode,
        phone: data.phone,
        preferredCommunication: data.preferredCommunication,
        companyName: data.companyName,
        message: data.message
      })
    });

    if (response.ok) {
      onDone();
      return;
    }

    setSubmitState("error");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submitInquiry();
      }}
      noValidate
    >
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
        onSubmit={submitInquiry}
        nextDisabled={!valid || submitState === "submitting"}
      />
      {submitState === "error" ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-100"
        >
          We could not send the inquiry. Please try WhatsApp or phone.
        </p>
      ) : null}
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
  const communicationOptions: {
    value: PreferredCommunication;
    label: string;
    icon: ReactNode;
  }[] = [
    {
      value: "phone_sms",
      label: dict.preferredPhoneSms,
      icon: <Phone className="h-4 w-4" aria-hidden="true" />
    },
    {
      value: "viber_whatsapp",
      label: dict.preferredViberWhatsapp,
      icon: <WhatsAppMark className="h-4 w-4" />
    },
    {
      value: "email",
      label: dict.preferredEmail,
      icon: <Mail className="h-4 w-4" aria-hidden="true" />
    }
  ];

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
          required
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
          required
        />
      </Field>
      <Field label={dict.phone} required>
        <div className="flex items-stretch gap-2">
          <select
            aria-label={dict.countryCode}
            className="glass-input w-32 shrink-0 appearance-auto px-2.5"
            value={data.phoneCountryCode}
            onChange={(e) => set("phoneCountryCode", e.target.value)}
          >
            {PHONE_COUNTRY_CODES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.flag} {item.code}
              </option>
            ))}
          </select>
          <input
            type="tel"
            autoComplete="tel"
            className="glass-input flex-1"
            placeholder={dict.phonePlaceholder}
            value={data.phone}
            onChange={(e) => set("phone", e.target.value)}
            required
          />
        </div>
      </Field>
      <fieldset>
        <legend className="mb-1.5 flex items-center gap-1 text-[11px] uppercase tracking-widest text-white/60">
          {dict.preferredCommunication}
          <span aria-hidden="true" className="text-gold-300">
            *
          </span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {communicationOptions.map((option) => {
            const active = data.preferredCommunication === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => set("preferredCommunication", option.value)}
                className={
                  "flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors " +
                  (active
                    ? "border-gold-400 bg-gold-400/10 text-white"
                    : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10")
                }
              >
                <span
                  className={
                    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md " +
                    (active ? "bg-gold-400/20 text-gold-200" : "bg-white/8 text-white/75")
                  }
                >
                  {option.icon}
                </span>
                <span className="font-medium leading-tight">{option.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <Field label={dict.companyName}>
        <input
          type="text"
          autoComplete="organization"
          className="glass-input"
          placeholder={dict.companyNamePlaceholder}
          value={data.companyName}
          onChange={(e) => set("companyName", e.target.value)}
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

const newAddressSessionToken = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function AddressAutocomplete({
  locale,
  value,
  selectedPlace,
  onChange,
  placeholder,
  disabled = false,
  readOnly = false,
  className = ""
}: {
  locale: Locale;
  value: string;
  selectedPlace?: AddressPlace;
  onChange: (value: string, place?: AddressPlace) => void;
  placeholder: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState(newAddressSessionToken);
  const requestRef = useRef(0);

  useEffect(() => {
    if (disabled || readOnly || value.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (selectedPlace && selectedPlace.label === value) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const requestId = ++requestRef.current;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/places/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: value, locale, sessionToken })
        });
        const data = await response.json().catch(() => null);
        if (requestRef.current !== requestId) return;
        const nextSuggestions = Array.isArray(data?.suggestions)
          ? data.suggestions
          : [];
        setSuggestions(nextSuggestions);
        setOpen(nextSuggestions.length > 0);
      } catch {
        if (requestRef.current === requestId) {
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        if (requestRef.current === requestId) setLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [disabled, locale, readOnly, selectedPlace, sessionToken, value]);

  const selectSuggestion = async (suggestion: PlaceSuggestion) => {
    setOpen(false);
    setSuggestions([]);
    setLoading(true);
    try {
      const response = await fetch("/api/places/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: suggestion.placeId,
          locale,
          sessionToken
        })
      });
      const data = await response.json().catch(() => null);
      if (data?.place) {
        onChange(data.place.formattedAddress || data.place.label, data.place);
      } else {
        onChange(suggestion.text, undefined);
      }
    } catch {
      onChange(suggestion.text, undefined);
    } finally {
      setLoading(false);
      setSessionToken(newAddressSessionToken());
    }
  };

  return (
    <div className={"relative " + className}>
      <input
        type="text"
        className="glass-input disabled:opacity-70 disabled:cursor-not-allowed"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value, undefined)}
        onFocus={() => setOpen(suggestions.length > 0)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        disabled={disabled}
        readOnly={readOnly}
        aria-readonly={readOnly}
        autoComplete="off"
      />
      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-ink-900 shadow-glass">
          <ul className="max-h-64 overflow-auto py-1">
            {suggestions.map((suggestion) => (
              <li key={suggestion.placeId}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void selectSuggestion(suggestion)}
                  className="w-full px-3 py-2.5 text-left hover:bg-white/[0.08]"
                >
                  <span className="block text-sm font-medium text-white">
                    {suggestion.mainText}
                  </span>
                  {suggestion.secondaryText ? (
                    <span className="mt-0.5 block text-xs text-white/55">
                      {suggestion.secondaryText}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-widest text-white/35">
            Powered by Google
          </div>
        </div>
      ) : null}
      {loading ? (
        <span className="pointer-events-none absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-gold-300" />
      ) : null}
    </div>
  );
}

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
  onChange: (id: string, value: string, place?: AddressPlace) => void;
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
        <AddressAutocomplete
          locale={locale}
          value={stop.value}
          selectedPlace={stop.place}
          onChange={(value, place) => onChange(stop.id, value, place)}
          placeholder={dict.stopPlaceholder}
          className="flex-1"
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

  const onChange = (id: string, value: string, place?: AddressPlace) => {
    set(
      "stops",
      data.stops.map((s) => (s.id === id ? { ...s, value, place } : s))
    );
    set("routeEstimate", undefined);
    set("routeEstimateStatus", "idle");
  };

  const onRemove = (id: string) => {
    set(
      "stops",
      data.stops.filter((s) => s.id !== id)
    );
    set("routeEstimate", undefined);
    set("routeEstimateStatus", "idle");
  };

  const onAdd = () => {
    set("stops", [...data.stops, { id: makeStopId(), value: "" }]);
    set("routeEstimate", undefined);
    set("routeEstimateStatus", "idle");
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = data.stops.findIndex((s) => s.id === active.id);
    const newIndex = data.stops.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    set("stops", arrayMove(data.stops, oldIndex, newIndex));
    set("routeEstimate", undefined);
    set("routeEstimateStatus", "idle");
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
  onSubmit?: () => void;
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
          type="button"
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

function formatPrice(value: number, locale: Locale): string {
  const rounded = Math.round(value * 100) / 100;
  const hasDecimals = !Number.isInteger(rounded);
  const amount = new Intl.NumberFormat(bcp47(locale), {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0
  }).format(rounded);

  return `€${amount}`;
}

function formatDistance(value: number, locale: Locale): string {
  return new Intl.NumberFormat(bcp47(locale), {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1
  }).format(value);
}

function legalHref(locale: Locale, page: "terms" | "privacy"): string {
  if (page === "terms") {
    return locale === "sr" ? "/uslovi-koriscenja" : `/${locale}/terms`;
  }
  return locale === "sr" ? "/politika-privatnosti" : `/${locale}/privacy`;
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
