export const TERMINAL_STATUSES = new Set(["completed", "cancelled", "archived"]);

export const serviceLabel = (service: string) => {
  const labels: Record<string, string> = {
    airport: "Aerodromski transfer",
    chauffeur: "Šofer servis",
    business: "Duge relacije",
    other: "Drugo"
  };

  return labels[service] ?? service;
};

export const statusLabel = (status: string, historicalSection = false) => {
  if (historicalSection && !TERMINAL_STATUSES.has(status)) {
    return "Prethodno";
  }

  const labels: Record<string, string> = {
    new: "Novo",
    contacted: "Kontaktiran",
    confirmed: "Potvrđeno",
    completed: "Završeno",
    cancelled: "Otkazano",
    archived: "Arhivirano"
  };

  return labels[status] ?? status;
};

export const paymentStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: "Na čekanju",
    paid: "Plaćeno",
    failed: "Neuspešno",
    expired: "Isteklo",
    cancelled: "Otkazano"
  };

  return labels[status] ?? status;
};

export const airportDirectionLabel = (direction: string) => {
  const labels: Record<string, string> = {
    from: "Sa aerodroma",
    to: "Ka aerodromu"
  };

  return labels[direction] ?? direction;
};

export const paymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    card: "Kartica",
    cash: "Gotovina"
  };

  return labels[method] ?? method;
};

export const communicationLabel = (method: string) => {
  const labels: Record<string, string> = {
    phone_sms: "Telefon / SMS",
    viber_whatsapp: "Viber / WhatsApp",
    email: "Email"
  };

  return labels[method] ?? method;
};

export const yesNoLabel = (value: boolean) => (value ? "Da" : "Ne");

export const formatStaffDate = (value: string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("sr-RS", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export const formatStaffAmount = (amountMinor: number, currency: string) => {
  const value = amountMinor / 100;
  return new Intl.NumberFormat("sr-RS", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2
  }).format(value);
};
