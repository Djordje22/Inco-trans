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
  Hourglass,
  Clock,
  Search,
  Wifi,
  Bell,
  CarTaxiFront,
  Route as RouteIcon
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
import { siteConfig, routeMap, type Locale } from "@/lib/site-config";
import type { RoutePriceEstimate } from "@/lib/pricing";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import WhatsAppMark from "./icons/WhatsAppMark";
import DateTimePicker from "./DateTimePicker";
import CountryCodeSelect from "./CountryCodeSelect";

// ---------- Context ----------

type FlowKind = "choose" | "transfer" | "handle" | "phone" | "success";
type SubmitState = "idle" | "submitting" | "error";

type Ctx = {
  open: boolean;
  flow: FlowKind;
  openModal: (initialService?: ServiceType) => void;
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
  service?: ServiceType;
};

export function ReservationTrigger({
  className,
  children,
  variant,
  service
}: TriggerProps) {
  const { openModal } = useReservation();
  const cls = className ?? (variant === "ghost" ? "btn-ghost" : "btn-gold");
  return (
    <button type="button" onClick={() => openModal(service)} className={cls}>
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
  const initialServiceRef = useRef<ServiceType | undefined>(undefined);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const openModal = useCallback((initialService?: ServiceType) => {
    previousFocusRef.current = (document.activeElement as HTMLElement) || null;
    initialServiceRef.current = initialService;
    setFlow(initialService ? "transfer" : "choose");
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
        <ModalShell locale={locale} flow={flow} setFlow={setFlow} onClose={closeModal} initialService={initialServiceRef.current} />
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
  initialService?: ServiceType;
};

function ModalShell({ locale, flow, setFlow, onClose, initialService }: ShellProps) {
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
          className="overflow-y-auto overflow-x-hidden px-5 py-6 sm:px-6 sm:py-7 break-words"
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
              initialService={initialService}
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

// ---------- Step 1, Choose ----------

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
          icon={<CarIcon />}
          title={dict.step1.transfer.title}
          desc={dict.step1.transfer.desc}
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
  const edgeOffset = 50 / steps.length;
  const progressRatio =
    steps.length > 1 ? (current - 1) / (steps.length - 1) : 0;

  return (
    <div className="pb-4">
      <ol
        className="relative grid"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden="true"
          className="absolute top-3.5 h-px bg-white/15"
          style={{ left: `${edgeOffset}%`, right: `${edgeOffset}%` }}
        />
        <span
          aria-hidden="true"
          className="absolute top-3.5 h-px bg-gold-400/75"
          style={{
            left: `${edgeOffset}%`,
            width: `calc((100% - ${edgeOffset * 2}%) * ${progressRatio})`
          }}
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

// ---------- Transfer flow (3 steps) ----------

export type ServiceType = "airport" | "chauffeur" | "business" | "other";
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
const MIN_CHAUFFEUR_DURATION_HOURS = 4;
const CHAUFFEUR_DURATION_GRACE_MINUTES = 15;
const MAX_CHAUFFEUR_DURATION_HOURS = 24;
const STANDARD_CHAUFFEUR_DAY_HOURS = 10;
// Promo codes are validated server-side via /api/promo/validate

const makeStopId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "stop-" + Math.random().toString(36).slice(2, 9);

const BELGRADE_AIRPORT_COORDS = {
  latitude: 44.8184,
  longitude: 20.3091
};

const DRIVER_START_PLACE: AddressPlace = {
  placeId: "slavija-belgrade",
  label: "Slavija, Beograd, Srbija",
  formattedAddress: "Slavija, Beograd, Srbija",
  latitude: 44.802416,
  longitude: 20.465601,
  countryCode: "rs"
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
  dropoffDateTime: string;
  chauffeurDurationHours: number;
  passengers: number;
  luggage: number;
  wifi: boolean;
  flight: string;
  fullName: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
  companyName: string;
  companyVatNumber: string;
  companyAddress: string;
  preferredCommunication: PreferredCommunication | "";
  paymentMethod: PaymentMethod;
  termsAccepted: boolean;
  message: string;
  bookingForOther: boolean;
  passengerName: string;
  passengerPhoneCountryCode: string;
  passengerPhone: string;
  reminderRequested: boolean;
  promoCode: string;
  promoCodeApplied: boolean;
  promoCodeError: string;
  promoDiscountPercent: number;
  promoId: string;
  promoType: string;
  loyaltyOverageKm: number;
  loyaltyOveragePrice: number;
  linkProfile: boolean;
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
  dropoffDateTime: "",
  chauffeurDurationHours: 0,
  passengers: 1,
  luggage: 0,
  wifi: true,
  flight: "",
  fullName: "",
  email: "",
  phoneCountryCode: "+381",
  phone: "",
  companyName: "",
  companyVatNumber: "",
  companyAddress: "",
  preferredCommunication: "",
  paymentMethod: "cash",
  termsAccepted: false,
  message: "",
  bookingForOther: false,
  passengerName: "",
  passengerPhoneCountryCode: "+381",
  passengerPhone: "",
  reminderRequested: false,
  promoCode: "",
  promoCodeApplied: false,
  promoCodeError: "",
  promoDiscountPercent: 0,
  promoId: "",
  promoType: "",
  loyaltyOverageKm: 0,
  loyaltyOveragePrice: 0,
  linkProfile: false
};


const isEmailValid = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const isContactValid = (
  data: TransferData,
  options: { messageRequired?: boolean } = {}
) =>
  data.fullName.trim().length > 1 &&
  isEmailValid(data.email) &&
  data.phone.trim().length >= 5 &&
  data.preferredCommunication !== "" &&
  (!options.messageRequired || data.message.trim().length > 0) &&
  (!data.bookingForOther ||
    (data.passengerName.trim().length > 1 &&
      data.passengerPhone.trim().length >= 5));

function TransferFlow({
  locale,
  onBack,
  onDone,
  initialService
}: {
  locale: Locale;
  onBack: () => void;
  onDone: () => void;
  initialService?: ServiceType;
}) {
  const dict = t(locale).modal;
  const airportName = dict.rent.airportDirection.airportName;
  const [data, setData] = useState<TransferData>(() =>
    initialService ? { ...EMPTY, service: initialService } : EMPTY
  );
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [preStep, setPreStep] = useState<"service" | "direction" | null>(
    initialService
      ? initialService === "airport" ? "direction" : null
      : "service"
  );
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const set = <K extends keyof TransferData>(k: K, v: TransferData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const isAirport = data.service === "airport";
  const isChauffeur = data.service === "chauffeur";
  const onServiceScreen = preStep === "service";
  const onDirectionScreen = preStep === "direction";

  const serviceValid = data.service !== "";
  const directionValid = data.airportDirection !== "";
  const journeyValid =
    data.pickup.trim() !== "" &&
    data.destination.trim() !== "" &&
    data.dateTime.trim() !== "" &&
    (!isChauffeur ||
      (data.dropoffDateTime.trim() !== "" &&
        data.chauffeurDurationHours >= MIN_CHAUFFEUR_DURATION_HOURS));
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
    if (step === 2 && !contactValid) return;
    setStep((s) => (s + 1) as 2 | 3);
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
        dropoffDateTime: data.dropoffDateTime,
        chauffeurDurationHours: data.chauffeurDurationHours,
        passengers: data.passengers,
        luggage: data.luggage,
        wifi: data.wifi,
        flight: data.flight,
        fullName: data.fullName,
        email: data.email,
        phoneCountryCode: data.phoneCountryCode,
        phone: data.phone,
        companyName: data.companyName,
        companyVatNumber: data.companyVatNumber,
        companyAddress: data.companyAddress,
        preferredCommunication: data.preferredCommunication,
        paymentMethod: data.paymentMethod,
        message: data.message,
        bookingForOther: data.bookingForOther,
        passengerName: data.passengerName,
        passengerPhoneCountryCode: data.passengerPhoneCountryCode,
        passengerPhone: data.passengerPhone,
        reminderRequested: data.reminderRequested,
        reminderMinutesBefore: 1440,
        promoCode: data.promoCodeApplied ? data.promoCode.trim() : "",
        promoDiscountPercent: data.promoCodeApplied ? data.promoDiscountPercent : 0,
        promoId: data.promoCodeApplied ? data.promoId : "",
        termsAccepted: data.termsAccepted,
        priceEstimate: data.routeEstimate,
        linkProfile: data.linkProfile
      })
    });

    if (response.ok) {
      onDone();
      return;
    }

    setSubmitState("error");
  };

  return (
    <div>
      {preStep === null ? (
        <StepProgress
          steps={[
            dict.progress.journey,
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
          />
        ) : null}
        {preStep === null && step === 2 ? (
          <ContactFields
            locale={locale}
            data={data}
            set={set}
            showReminder={
              !!data.dateTime &&
              new Date(data.dateTime).getTime() - Date.now() > 24 * 60 * 60 * 1000
            }
          />
        ) : null}
        {preStep === null && step === 3 ? (
          <ReviewStep locale={locale} data={data} set={set} />
        ) : null}
      </div>

      <FormFooter
        locale={locale}
        onBack={onPrev}
        onNext={preStep !== null || step < 3 ? onNext : undefined}
        onSubmit={preStep === null && step === 3 ? submitRequest : undefined}
        nextDisabled={
          (onServiceScreen && !serviceValid) ||
          (onDirectionScreen && !directionValid) ||
          (preStep === null && step === 1 && !journeyValid) ||
          (preStep === null && step === 2 && !contactValid) ||
          (preStep === null && step === 3 && !data.termsAccepted) ||
          (preStep === null && step === 3 && data.routeEstimateStatus === "loading") ||
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
  const ServiceIcons: Record<ServiceType, typeof PlaneLanding> = {
    airport: PlaneLanding,
    chauffeur: CarTaxiFront,
    business: RouteIcon,
    other: HelpCircle
  };
  const options: { value: ServiceType; label: string; desc: string }[] = [
    {
      value: "airport",
      label: tf.serviceOptionAirport,
      desc: locale === "sr"
        ? "Aerodrom Nikola Tesla, adresa, hotel ili grad."
        : locale === "ru"
          ? "Аэропорт Никола Тесла, адрес, отель или город."
          : "Nikola Tesla Airport, address, hotel or city."
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
        ? "Duže rute po Srbiji, regionu ili van zemlje."
        : locale === "ru"
          ? "Дальние маршруты по Сербии, региону или за границу."
          : "Longer routes across Serbia, the region or abroad."
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
          const SvcIcon = ServiceIcons[opt.value];
          return (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => set("service", opt.value)}
                aria-pressed={active}
                className={
                  "w-full text-left rounded-xl border px-4 py-3 transition-colors flex items-center gap-3 " +
                  (active
                    ? "border-gold-400 bg-gold-400/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10")
                }
              >
                <span className={
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg " +
                  (active ? "bg-gold-400/20 text-gold-300" : "bg-white/5 text-white/50 ring-1 ring-white/10")
                }>
                  <SvcIcon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">
                    {opt.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-white/60">
                    {opt.desc}
                  </span>
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
  set
}: {
  locale: Locale;
  data: TransferData;
  set: <K extends keyof TransferData>(k: K, v: TransferData[K]) => void;
}) {
  const dict = t(locale).modal.rent.journey;
  const tf = t(locale).transportForm;
  const isAirport = data.service === "airport";
  const isChauffeur = data.service === "chauffeur";
  const isLongDistance = data.service === "business";
  const showStops = data.service !== "other";
  const showWaiting = isAirport || isChauffeur || isLongDistance;
  const showFlight = isAirport;
  const resetEstimate = () => {
    set("routeEstimate", undefined);
    set("routeEstimateStatus", "idle");
  };
  const setPickupDateTime = (value: string) => {
    set("dateTime", value);
    if (isChauffeur && data.dropoffDateTime) {
      set(
        "dropoffDateTime",
        addHoursToDateTime(
          value,
          data.chauffeurDurationHours || MIN_CHAUFFEUR_DURATION_HOURS
        )
      );
    }
    resetEstimate();
  };
  const setDropoffDateTime = (value: string) => {
    const duration = durationHoursBetween(data.dateTime, value);
    if (data.dateTime && duration < MIN_CHAUFFEUR_DURATION_HOURS) {
      const nextDuration = MIN_CHAUFFEUR_DURATION_HOURS;
      set("chauffeurDurationHours", nextDuration);
      set("dropoffDateTime", addHoursToDateTime(data.dateTime, nextDuration));
      resetEstimate();
      return;
    }
    if (data.dateTime) {
      const nextDuration = billableChauffeurDurationHours(duration);
      set("chauffeurDurationHours", nextDuration);
      set("dropoffDateTime", value);
    } else {
      set("dropoffDateTime", value);
    }
    resetEstimate();
  };
  const dateTimeField = (
    <Field
      label={isChauffeur ? dict.chauffeurPickupDateTime : dict.pickupDateTime}
      required
    >
      <DateTimePicker
        id="qf-dt"
        locale={locale}
        value={data.dateTime}
        onChange={setPickupDateTime}
        ariaLabel={
          isChauffeur ? dict.chauffeurPickupDateTime : dict.pickupDateTime
        }
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
        {dateTimeField}
        {isChauffeur ? (
          <>
            <Field label={dict.chauffeurDropoffDateTime} required>
              <DateTimePicker
                id="qf-dropoff-dt"
                locale={locale}
                value={data.dropoffDateTime}
                onChange={setDropoffDateTime}
                ariaLabel={dict.chauffeurDropoffDateTime}
                minValue={
                  data.dateTime
                    ? addHoursToDateTime(
                        data.dateTime,
                        MIN_CHAUFFEUR_DURATION_HOURS
                      )
                    : undefined
                }
              />
            </Field>
            {data.dropoffDateTime ? (
              <ChauffeurDurationCard locale={locale} data={data} set={set} />
            ) : null}
          </>
        ) : null}
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
          />
        </Field>
        {showStops ? (
          <>
            <StopsList locale={locale} data={data} set={set} />
          </>
        ) : null}
        {showWaiting ? (
          <WaitingHoursCard locale={locale} data={data} set={set} />
        ) : null}
        <WifiToggle locale={locale} checked={data.wifi} onChange={(next) => set("wifi", next)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label={dict.passengers} required>
            <input
              type="number"
              min={MIN_PASSENGERS}
              max={MAX_PASSENGERS}
              className="glass-input"
              value={data.passengers}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") { set("passengers", "" as any); return; }
                const n = Number(raw);
                if (Number.isFinite(n) && n >= 0 && n <= MAX_PASSENGERS) set("passengers", n);
              }}
              onBlur={() =>
                set("passengers", clampBookingCount(Number(data.passengers) || MIN_PASSENGERS, MIN_PASSENGERS, MAX_PASSENGERS))
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
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") { set("luggage", "" as any); return; }
                const n = Number(raw);
                if (Number.isFinite(n) && n >= 0 && n <= MAX_LUGGAGE) set("luggage", n);
              }}
              onBlur={() =>
                set("luggage", clampBookingCount(Number(data.luggage) || MIN_LUGGAGE, MIN_LUGGAGE, MAX_LUGGAGE))
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
        return " ";
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
    data.waitingHours,
    data.dropoffDateTime,
    data.chauffeurDurationHours,
    data.service
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
        points: [DRIVER_START_PLACE, ...points, DRIVER_START_PLACE],
        waitingHours: data.service === "chauffeur" ? 0 : data.waitingHours,
        chauffeurDurationHours: data.chauffeurDurationHours,
        service: data.service
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
        return " ";
    }
  })();

  const estimate = data.routeEstimate;
  const hasPriceEstimate =
    data.routeEstimateStatus === "available" && Boolean(estimate);
  const hasDistanceOverage = (estimate?.distanceOverageKm ?? 0) > 0;
  const isLongDistanceEstimate = estimate?.pricingModel === "long_distance";
  const isChauffeurEstimate = estimate?.pricingModel === "chauffeur";

  const serviceItems = [
    { label: dict.selectedServiceLabel, value: serviceWithDirection }
  ];
  const tripItems = [
    { label: dict.pickupLabel, value: data.pickup || " " },
    ...(stopValues.length > 0
      ? [{ label: dict.stopsLabel, value: stopsSummary }]
      : []),
    { label: dict.destinationLabel, value: data.destination || " " },
    {
      label: dict.whenLabel,
      value: data.dateTime ? formatDateTime(data.dateTime, locale) : " "
    },
    ...(data.service === "chauffeur"
      ? [
          {
            label: dict.dropoffWhenLabel,
            value: data.dropoffDateTime
              ? formatDateTime(data.dropoffDateTime, locale)
              : " "
          },
          {
            label: dict.durationLabel,
            value: data.chauffeurDurationHours
              ? `${data.chauffeurDurationHours} ${hourWord(
                  locale,
                  data.chauffeurDurationHours
                )}`
              : " "
          }
        ]
      : []),
    { label: dict.passengersLabel, value: String(data.passengers) },
    { label: dict.luggageLabel, value: String(data.luggage) },
    { label: dict.wifiLabel, value: data.wifi ? dict.yes : dict.no },
    ...(data.service === "airport"
      ? [{ label: dict.flightLabel, value: data.flight || " " }]
      : []),
    ...(data.waitingHours > 0
      ? [
          {
            label: dict.waitingLabel,
            value: `${data.waitingHours} ${hourWord(locale, data.waitingHours)}`
          }
        ]
      : []),
    ...(hasPriceEstimate && estimate
      ? [
          {
            label: dict.billableDistanceLabel,
            value: `${formatDistance(estimate.distanceKm, locale)} km`
          }
        ]
      : [])
  ];
  const contactItems = [
    { label: dict.fullNameLabel, value: data.fullName || " " },
    { label: dict.emailLabel, value: data.email || " " },
    {
      label: dict.phoneLabel,
      value:
        data.phoneCountryCode || data.phone
          ? `${data.phoneCountryCode} ${data.phone}`.trim()
          : " "
    },
    {
      label: dict.preferredCommunicationLabel,
      value: preferredCommunicationLabel
    },
    ...(data.bookingForOther
      ? [
          {
            label:
              locale === "sr"
                ? "Ime putnika"
                : locale === "ru"
                  ? "Имя пассажира"
                  : "Passenger name",
            value: data.passengerName || " "
          },
          {
            label:
              locale === "sr"
                ? "Telefon putnika"
                : locale === "ru"
                  ? "Телефон пассажира"
                  : "Passenger phone",
            value:
              data.passengerPhoneCountryCode || data.passengerPhone
                ? `${data.passengerPhoneCountryCode} ${data.passengerPhone}`.trim()
                : " "
          }
        ]
      : []),
    ...(data.reminderRequested
      ? [
          {
            label:
              locale === "sr"
                ? "Podsetnik"
                : locale === "ru"
                  ? "Напоминание"
                  : "Reminder",
            value:
              locale === "sr"
                ? "5 minuta nakon slanja zahteva"
                : locale === "ru"
                  ? "через 5 минут после отправки запроса"
                  : "5 minutes after request submission"
          }
        ]
      : []),
    { label: dict.companyNameLabel, value: data.companyName || " " },
    { label: dict.companyVatNumberLabel, value: data.companyVatNumber || " " },
    { label: dict.companyAddressLabel, value: data.companyAddress || " " },
    { label: dict.messageLabel, value: data.message || " " }
  ];
  const overageLabel = dict.distanceOverageLabel
    .replace("{overage}", formatDistance(estimate?.distanceOverageKm ?? 0, locale))
    .replace("{included}", formatDistance(estimate?.includedDistanceKm ?? 50, locale));
  const waitingPriceLabel = dict.waitingPriceLabel.replace(
    "{hours}",
    formatDistance(data.waitingHours, locale)
  );
  const longDistancePriceLabel = dict.longDistancePriceLabel.replace(
    "{distance}",
    formatDistance(estimate?.distanceKm ?? 0, locale)
  );
  const chauffeurBasePriceLabel = dict.chauffeurBasePriceLabel
    .replace(
      "{hours}",
      formatDistance(
        estimate?.chauffeurIncludedHours ?? STANDARD_CHAUFFEUR_DAY_HOURS,
        locale
      )
    )
    .replace(
      "{included}",
      formatDistance(estimate?.includedDistanceKm ?? 0, locale)
    );
  const chauffeurExtraHoursLabel = dict.chauffeurExtraHoursLabel.replace(
    "{hours}",
    formatDistance(
      estimate?.chauffeurExtraHours ?? estimate?.waitingHours ?? 0,
      locale
    )
  );
  const chauffeurPricingNote =
    estimate && isChauffeurEstimate
      ? buildChauffeurPricingNote(dict, estimate, locale)
      : "";
  const promoActive = data.promoCodeApplied && data.promoDiscountPercent > 0;
  const isLoyaltyCode = promoActive && data.promoType === "loyalty_free_ride";
  const promoDiscountAmount =
    estimate && promoActive && !isLoyaltyCode
      ? roundMoney(estimate.totalPrice * (data.promoDiscountPercent / 100))
      : 0;
  // For loyalty: final price = overage price + waiting price (waiting from estimate)
  const loyaltyTotal = isLoyaltyCode && estimate
    ? roundMoney(data.loyaltyOveragePrice + (estimate.waitingPrice ?? 0))
    : 0;
  const estimatedTotal = isLoyaltyCode
    ? loyaltyTotal
    : estimate ? roundMoney(estimate.totalPrice - promoDiscountAmount) : 0;
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
        <FleetAssignmentNote dict={dict} />
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
              {isLongDistanceEstimate ? (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-white/55">{longDistancePriceLabel}</dt>
                  <dd className="text-right font-medium text-white">
                    {formatPrice(estimate.overagePrice, locale)}
                  </dd>
                </div>
              ) : isChauffeurEstimate ? (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-white/55">{chauffeurBasePriceLabel}</dt>
                  <dd className="text-right font-medium text-white">
                    {formatPrice(estimate.basePrice, locale)}
                  </dd>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-white/55">{dict.basePriceLabel}</dt>
                  <dd className="text-right font-medium text-white">
                    {formatPrice(estimate.basePrice, locale)}
                  </dd>
                </div>
              )}
              {estimate.waitingPrice > 0 ? (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-white/55">
                    {isChauffeurEstimate
                      ? chauffeurExtraHoursLabel
                      : waitingPriceLabel}
                  </dt>
                  <dd className="text-right font-medium text-white">
                    {formatPrice(estimate.waitingPrice, locale)}
                  </dd>
                </div>
              ) : null}
              {hasDistanceOverage && !isLongDistanceEstimate ? (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-white/55">{overageLabel}</dt>
                  <dd className="text-right font-medium text-white">
                    {formatPrice(estimate.overagePrice, locale)}
                  </dd>
                </div>
              ) : null}
              {promoDiscountAmount > 0 && !isLoyaltyCode ? (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-white/55">
                    {dict.promoDiscountLabel.replace(
                      "{code}",
                      data.promoCode.trim().toUpperCase()
                    )}
                  </dt>
                  <dd className="text-right font-medium text-gold-200">
                    -{formatPrice(promoDiscountAmount, locale)}
                  </dd>
                </div>
              ) : null}
              {isLoyaltyCode ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-gold-300">
                      {locale === "sr" ? "Loyalty vožnja do 25km" : locale === "ru" ? "Поездка лояльности до 25 км" : "Loyalty ride up to 25km"}
                    </dt>
                    <dd className="text-right font-medium text-gold-200">
                      {formatPrice(0, locale)}
                    </dd>
                  </div>
                  {data.loyaltyOverageKm > 0 ? (
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-white/55">
                        {(locale === "sr" ? "Dodatna kilometraža" : locale === "ru" ? "Дополнительное расстояние" : "Additional distance") + ` (${data.loyaltyOverageKm} km × €1.15)`}
                      </dt>
                      <dd className="text-right font-medium text-white">
                        {formatPrice(data.loyaltyOveragePrice, locale)}
                      </dd>
                    </div>
                  ) : null}
                </>
              ) : null}
            </dl>
            <div className="my-3 h-px bg-white/10" />
            <div className="flex items-start justify-between gap-3">
              <span className="text-base font-semibold text-white">
                {dict.totalEstimateLabel}
              </span>
              <span className="text-right text-2xl font-semibold text-gold-200">
                {formatPrice(estimatedTotal, locale)}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/55">
              {isChauffeurEstimate && chauffeurPricingNote
                ? chauffeurPricingNote
                : dict.estimateDisclaimer}
            </p>
            {isChauffeurEstimate && chauffeurPricingNote ? (
              <p className="mt-1 text-xs leading-relaxed text-white/45">
                {dict.estimateDisclaimer}
              </p>
            ) : null}
          </section>
        ) : null}

        <PromoCodeCard dict={dict} data={data} set={set} />

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
            <dd className="max-w-[60%] text-right font-medium text-white break-all">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

type ReviewDictionary = ReturnType<typeof t>["modal"]["rent"]["review"];

function FleetAssignmentNote({ dict }: { dict: ReviewDictionary }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <h4 className="text-sm font-semibold text-white">
        {dict.assignedVehicleTitle}
      </h4>
      <p className="mt-2 text-sm leading-relaxed text-white/60">
        {dict.assignedVehicleDesc}
      </p>
    </section>
  );
}

function PromoCodeCard({
  dict,
  data,
  set
}: {
  dict: ReviewDictionary;
  data: TransferData;
  set: <K extends keyof TransferData>(k: K, v: TransferData[K]) => void;
}) {
  const [promoLoading, setPromoLoading] = useState(false);

  const applyPromo = async () => {
    const normalized = data.promoCode.trim().toUpperCase();
    if (!normalized) {
      set("promoCodeApplied", false);
      set("promoCodeError", "");
      return;
    }

    setPromoLoading(true);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: normalized,
          service: data.service,
          distanceMeters: data.routeEstimate?.distanceMeters ?? 0,
          waitingHours: data.waitingHours
        })
      });
      const result = await res.json();

      if (result.valid) {
        set("promoCode", result.code);
        set("promoCodeApplied", true);
        set("promoDiscountPercent", result.discountPercent);
        set("promoId", result.promoId);
        set("promoType", result.promoType ?? "referral_percent");
        set("loyaltyOverageKm", result.loyaltyOverageKm ?? 0);
        set("loyaltyOveragePrice", result.loyaltyOveragePrice ?? 0);
        set("promoCodeError", "");
      } else {
        set("promoCodeApplied", false);
        set("promoCodeError",
          result.error === "not_for_chauffeur"
            ? (dict as any).notForChauffeur ?? dict.promoInvalid
            : dict.promoInvalid
        );
      }
    } catch {
      set("promoCodeApplied", false);
      set("promoCodeError", dict.promoInvalid);
    }
    setPromoLoading(false);
  };

  return (
    <details className="group rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <summary className="flex cursor-pointer list-none select-none items-center gap-2 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">{dict.promoSummary}</span>
        <ChevronDown
          className="h-4 w-4 text-white/50 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          className="glass-input flex-1"
          placeholder={dict.promoPlaceholder}
          value={data.promoCode}
          onChange={(event) => {
            set("promoCode", event.target.value);
            set("promoCodeApplied", false);
            set("promoCodeError", "");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              applyPromo();
            }
          }}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={applyPromo}
          disabled={promoLoading}
          className="btn-ghost justify-center !py-2.5 !px-4"
        >
          {promoLoading ? "..." : dict.promoApply}
        </button>
      </div>
      {data.promoCodeApplied ? (
        <p className="mt-2 text-xs text-gold-300">
          {dict.promoApplied.replace("{percent}", String(data.promoDiscountPercent))}
        </p>
      ) : null}
      {data.promoCodeError ? (
        <p className="mt-2 text-xs text-red-200">{data.promoCodeError}</p>
      ) : null}
    </details>
  );
}

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
    disabled?: boolean;
    badge?: string;
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
      icon: <CreditCard className="h-4 w-4" aria-hidden="true" />,
      disabled: true,
      badge: dict.paymentCardSoon
    }
  ];

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <h4 className="text-[11px] uppercase tracking-[0.22em] text-white/55">
        {dict.paymentCardTitle}
      </h4>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {methods.map((method) => {
          const active = !method.disabled && selected === method.value;
          return (
            <button
              key={method.value}
              type="button"
              aria-pressed={active}
              disabled={method.disabled}
              onClick={() => !method.disabled && onSelect(method.value)}
              className={
                "rounded-xl border px-3.5 py-3 text-left transition-colors " +
                (method.disabled
                  ? "border-white/5 bg-white/[0.02] text-white/30 cursor-not-allowed"
                  : active
                    ? "border-white/85 bg-white/8 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/8")
              }
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className={method.disabled ? "text-white/20" : "text-white/70"}>{method.icon}</span>
                {method.title}
                {method.badge && (
                  <span className="ml-auto rounded-full bg-gold-400/15 px-2 py-0.5 text-[10px] font-medium text-gold-400">
                    {method.badge}
                  </span>
                )}
              </span>
              <span className={"mt-1 block text-xs leading-relaxed " + (method.disabled ? "text-white/25" : "text-white/45")}>
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

  const valid = isContactValid(data, { messageRequired: true });

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
        companyVatNumber: data.companyVatNumber,
        companyAddress: data.companyAddress,
        message: data.message,
        bookingForOther: data.bookingForOther,
        passengerName: data.passengerName,
        passengerPhoneCountryCode: data.passengerPhoneCountryCode,
        passengerPhone: data.passengerPhone
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
        <ContactFields
          locale={locale}
          data={data}
          set={set}
          messageRequired
          messagePlaceholder={dict.contact.handleMessagePlaceholder}
        />
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
  set,
  messageRequired = false,
  messagePlaceholder,
  showReminder = false
}: {
  locale: Locale;
  data: TransferData;
  set: <K extends keyof TransferData>(k: K, v: TransferData[K]) => void;
  messageRequired?: boolean;
  messagePlaceholder?: string;
  showReminder?: boolean;
}) {
  const authDict = t(locale).auth;
  const dict = t(locale).modal.contact;
  const [authUser, setAuthUser] = useState<{ id: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUser(user ? { id: user.id } : null);
      setAuthChecked(true);
    });
  }, []);

  const handleLinkToggle = async (checked: boolean) => {
    set("linkProfile", checked);
    if (!checked || !authUser) return;

    // Autofill from profile + auth user email as fallback
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone_country_code, phone, company_name, company_vat_number, company_address")
      .eq("id", authUser.id)
      .single();

    if (profile) {
      const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
      if (fullName) set("fullName", fullName);
      if (profile.email) set("email", profile.email);
      else if (user?.email) set("email", user.email);
      if (profile.phone_country_code) set("phoneCountryCode", profile.phone_country_code);
      if (profile.phone) set("phone", profile.phone);
      if (profile.company_name) set("companyName", profile.company_name);
      if (profile.company_vat_number) set("companyVatNumber", profile.company_vat_number);
      if (profile.company_address) set("companyAddress", profile.company_address);
    } else if (user?.email) {
      // Profile fetch failed (columns may not exist yet) — still fill email
      set("email", user.email);
    }
  };
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
      {authChecked && (
        authUser ? (
          <ToggleCard
            checked={data.linkProfile}
            onChange={handleLinkToggle}
            title={authDict.linkProfileToggle}
            description={authDict.linkProfileDesc}
          />
        ) : (
          <a
            href={routeMap.login[locale]}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-gold-400 hover:bg-white/5 transition-colors"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            {authDict.linkProfileSignIn}
          </a>
        )
      )}
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
          <CountryCodeSelect
            ariaLabel={dict.countryCode}
            value={data.phoneCountryCode}
            onChange={(value) => set("phoneCountryCode", value)}
          />
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
      <section className="rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
        <h4 className="font-display text-xl text-white">
          {dict.companyInformationTitle}
        </h4>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
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
          </div>
          <Field label={dict.companyVatNumber}>
            <input
              type="text"
              autoComplete="off"
              className="glass-input"
              placeholder={dict.companyVatNumberPlaceholder}
              value={data.companyVatNumber}
              onChange={(e) => set("companyVatNumber", e.target.value)}
            />
          </Field>
          <Field label={dict.companyAddress}>
            <input
              type="text"
              autoComplete="street-address"
              className="glass-input"
              placeholder={dict.companyAddressPlaceholder}
              value={data.companyAddress}
              onChange={(e) => set("companyAddress", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <ToggleCard
        checked={data.bookingForOther}
        onChange={(checked) => set("bookingForOther", checked)}
        title={dict.bookingForOtherTitle}
        description={dict.bookingForOtherDesc}
      />

      {data.bookingForOther ? (
        <div className="space-y-4 border-l-2 border-gold-500/70 pl-4">
          <Field label={dict.passengerName} required>
            <input
              type="text"
              autoComplete="off"
              className="glass-input"
              placeholder={dict.passengerNamePlaceholder}
              value={data.passengerName}
              onChange={(e) => set("passengerName", e.target.value)}
              required
            />
          </Field>
          <Field label={dict.passengerPhone} required>
            <div className="flex items-stretch gap-2">
              <CountryCodeSelect
                ariaLabel={dict.countryCode}
                value={data.passengerPhoneCountryCode}
                onChange={(value) => set("passengerPhoneCountryCode", value)}
              />
              <input
                type="tel"
                autoComplete="off"
                className="glass-input flex-1"
                placeholder={dict.phonePlaceholder}
                value={data.passengerPhone}
                onChange={(e) => set("passengerPhone", e.target.value)}
                required
              />
            </div>
          </Field>
        </div>
      ) : null}

      <Field label={dict.message} required={messageRequired}>
        <textarea
          rows={3}
          className="glass-input resize-none"
          placeholder={messagePlaceholder ?? dict.messagePlaceholder}
          value={data.message}
          onChange={(e) => set("message", e.target.value)}
          required={messageRequired}
        />
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
      {showReminder ? (
        <ReminderToggle
          checked={data.reminderRequested}
          onChange={(checked) => set("reminderRequested", checked)}
          title={dict.reminderTitle}
          description={dict.reminderDesc}
        />
      ) : null}
    </div>
  );
}

function ToggleCard({
  checked,
  onChange,
  title,
  description
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-4 rounded-xl bg-white/[0.025] px-4 py-4 text-left transition-colors hover:bg-white/[0.05]"
    >
      <span
        aria-hidden="true"
        className={
          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors " +
          (checked
            ? "border-white bg-white text-ink-950"
            : "border-white/35 bg-transparent text-transparent")
        }
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-white">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-white/50">
          {description}
        </span>
      </span>
    </button>
  );
}

function ReminderToggle({
  checked,
  onChange,
  title,
  description
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-4 rounded-xl px-0 py-2 text-left transition-colors hover:bg-white/[0.03] sm:px-1"
    >
      <span
        aria-hidden="true"
        className={
          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors " +
          (checked
            ? "border-white bg-white text-ink-950"
            : "border-white/35 bg-transparent text-transparent")
        }
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-gold-300">
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-white">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-white/50">
          {description}
        </span>
      </span>
    </button>
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
              WhatsApp
            </span>
            <span className="block font-semibold text-white">
              {locale === "sr" ? "Pošaljite poruku" : locale === "ru" ? "Отправить сообщение" : "Send a message"}
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
        <button
          type="button"
          onClick={onClose}
          className="btn-gold w-full justify-center"
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

function clampChauffeurDuration(value: number): number {
  if (!Number.isFinite(value)) return MIN_CHAUFFEUR_DURATION_HOURS;
  return Math.max(
    MIN_CHAUFFEUR_DURATION_HOURS,
    Math.min(MAX_CHAUFFEUR_DURATION_HOURS, Math.round(value))
  );
}

function billableChauffeurDurationHours(durationHours: number): number {
  if (!Number.isFinite(durationHours)) return MIN_CHAUFFEUR_DURATION_HOURS;
  const wholeHours = Math.floor(durationHours);
  const extraMinutes = Math.round((durationHours - wholeHours) * 60);
  const billable =
    extraMinutes <= CHAUFFEUR_DURATION_GRACE_MINUTES
      ? wholeHours
      : Math.ceil(durationHours);
  return clampChauffeurDuration(billable);
}

function ChauffeurDurationCard({
  locale,
  data,
  set
}: {
  locale: Locale;
  data: TransferData;
  set: <K extends keyof TransferData>(k: K, v: TransferData[K]) => void;
}) {
  const dict = t(locale).modal.rent.journey;
  const hours = clampChauffeurDuration(
    data.chauffeurDurationHours || MIN_CHAUFFEUR_DURATION_HOURS
  );

  const setDuration = (next: number) => {
    const clamped = clampChauffeurDuration(next);
    set("chauffeurDurationHours", clamped);
    if (data.dateTime) {
      set("dropoffDateTime", addHoursToDateTime(data.dateTime, clamped));
    }
    set("routeEstimate", undefined);
    set("routeEstimateStatus", "idle");
  };

  return (
    <div>
      <div className="glass grid grid-cols-[auto_1fr] gap-3 rounded-xl p-4 sm:grid-cols-[auto_1fr_auto] sm:items-start">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 text-gold-300">
          <Clock className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-sm text-white">
            {dict.chauffeurDurationTitle}
          </h4>
          <p className="mt-0.5 text-xs leading-relaxed text-white/55">
            {dict.chauffeurDurationDesc.replace("{hours}", String(hours))}
          </p>
        </div>
        <div className="col-span-2 flex items-center justify-end gap-2 shrink-0 sm:col-span-1">
          <button
            type="button"
            onClick={() => setDuration(hours - 1)}
            aria-label={dict.chauffeurDurationDecreaseAria}
            disabled={hours <= MIN_CHAUFFEUR_DURATION_HOURS}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <span
            aria-live="polite"
            className="min-w-[2.5rem] text-center text-sm font-semibold text-white tabular-nums"
          >
            {hours}h
          </span>
          <button
            type="button"
            onClick={() => setDuration(hours + 1)}
            aria-label={dict.chauffeurDurationIncreaseAria}
            disabled={hours >= MAX_CHAUFFEUR_DURATION_HOURS}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-white/45">
        {dict.chauffeurStandardDayNote}
      </p>
    </div>
  );
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
      <div className="glass grid grid-cols-[auto_1fr] gap-3 rounded-xl p-4 sm:grid-cols-[auto_1fr_auto] sm:items-start">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 text-gold-300">
          <Hourglass className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-sm text-white">
            {dict.waitingTitle}
          </h4>
          <p className="mt-0.5 text-xs leading-relaxed text-white/55">
            {dict.waitingDesc}
          </p>
        </div>
        <div className="col-span-2 flex items-center justify-end gap-2 shrink-0 sm:col-span-1">
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

function WifiToggle({
  locale,
  checked,
  onChange
}: {
  locale: Locale;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  const dict = t(locale).modal.rent.journey;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="glass flex w-full items-center gap-3 rounded-xl p-4 text-left transition-colors hover:bg-white/8"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 text-gold-300">
        <Wifi className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-white">
          {dict.wifiLabel}
        </span>
        <span className="mt-0.5 block text-xs text-white/55">
          {dict.wifiDesc}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors " +
          (checked
            ? "border-gold-400/50 bg-gold-400"
            : "border-white/15 bg-white/10")
        }
      >
        <span
          className={
            "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform " +
            (checked ? "translate-x-6" : "translate-x-1")
          }
        />
      </span>
    </button>
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

function dateTimeValueToDate(value: string): Date | null {
  const parsed = parseDateTimeValue(value);
  if (!parsed) return null;
  const [year, month, day] = parsed.date.split("-").map(Number);
  const [hours, minutes] = parsed.time.split(":").map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateToDateTimeValue(date: Date): string {
  const pad = (value: number) => (value < 10 ? `0${value}` : String(value));
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addHoursToDateTime(value: string, hours: number): string {
  const date = dateTimeValueToDate(value);
  if (!date) return "";
  const next = new Date(date.getTime() + hours * 60 * 60 * 1000);
  return dateToDateTimeValue(next);
}

function durationHoursBetween(startValue: string, endValue: string): number {
  const start = dateTimeValueToDate(startValue);
  const end = dateTimeValueToDate(endValue);
  if (!start || !end) return 0;
  return (end.getTime() - start.getTime()) / (60 * 60 * 1000);
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
  const rounded = roundMoney(value);
  const hasDecimals = !Number.isInteger(rounded);
  const amount = new Intl.NumberFormat(bcp47(locale), {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0
  }).format(rounded);

  return `€${amount}`;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatDistance(value: number, locale: Locale): string {
  return new Intl.NumberFormat(bcp47(locale), {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1
  }).format(value);
}

function buildChauffeurPricingNote(
  dict: ReviewDictionary,
  estimate: RoutePriceEstimate,
  locale: Locale
): string {
  const overageText =
    estimate.distanceOverageKm > 0
      ? dict.chauffeurOverageText
          .replace("{overage}", formatDistance(estimate.distanceOverageKm, locale))
          .replace("{rate}", formatDistance(estimate.distanceOverageRate, locale))
      : dict.chauffeurNoOverageText;

  return dict.chauffeurPricingNote
    .replace(
      "{hours}",
      formatDistance(estimate.chauffeurDurationHours ?? 0, locale)
    )
    .replace("{included}", formatDistance(estimate.includedDistanceKm, locale))
    .replace("{distance}", formatDistance(estimate.distanceKm, locale))
    .replace("{overageText}", overageText);
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
