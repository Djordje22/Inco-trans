import type { Locale } from "./site-config";

type Dict = {
  nav: {
    home: string;
    fleet: string;
    quote: string;
    about: string;
    contact: string;
    requestQuote: string;
  };
  hero: {
    eyebrow: string;
    title1: string;
    title2: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  quoteCard: {
    title: string;
    pickup: string;
    pickupPlaceholder: string;
    return: string;
    returnPlaceholder: string;
    vehicle: string;
    vehicleAny: string;
    name: string;
    phone: string;
    message: string;
    submit: string;
    submitNote: string;
    cashOnly: string;
  };
  categories: {
    title: string;
    subtitle: string;
    items: { title: string; desc: string }[];
  };
  fleetPreview: {
    title: string;
    subtitle: string;
    viewAll: string;
  };
  fleetCard: {
    passengers: string;
    luggage: string;
    transmission: string;
    fuel: string;
    perDay: string;
    pricePlaceholder: string;
    reserve: string;
  };
  why: {
    title: string;
    items: { title: string; desc: string }[];
  };
  how: {
    title: string;
    steps: { title: string; desc: string }[];
  };
  about: {
    title: string;
    body: string[];
    valuesTitle: string;
    values: string[];
  };
  contact: {
    title: string;
    subtitle: string;
    formTitle: string;
    fullName: string;
    email: string;
    phone: string;
    message: string;
    submit: string;
    submitNote: string;
    addressLabel: string;
    hoursLabel: string;
    mapPlaceholder: string;
  };
  footer: {
    rights: string;
    quickLinks: string;
    contact: string;
    payments: string;
    paymentsValue: string;
    disclaimer: string;
  };
  fleetPage: {
    title: string;
    subtitle: string;
    filterAll: string;
    empty: string;
  };
  quotePage: {
    title: string;
    subtitle: string;
  };
  modal: {
    title: string;
    close: string;
    step1: {
      heading: string;
      subheading: string;
      learnMore: string;
      rent: { title: string; desc: string };
      handle: { title: string; desc: string };
      phone: { title: string };
    };
    progress: {
      journey: string;
      vehicle: string;
      contact: string;
      review: string;
    };
    rent: {
      journey: {
        heading: string;
        subheading: string;
        pickup: string;
        return: string;
        location: string;
        locationPlaceholder: string;
        crossBorder: string;
      };
      vehicle: {
        heading: string;
        subheading: string;
        anyClass: string;
      };
      review: {
        heading: string;
        subheading: string;
        pickupLabel: string;
        returnLabel: string;
        locationLabel: string;
        vehicleLabel: string;
        crossBorderYes: string;
        crossBorderNo: string;
        cashNote: string;
      };
    };
    contact: {
      heading: string;
      subheading: string;
      pastClient: string;
      fullName: string;
      fullNamePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      phone: string;
      phonePlaceholder: string;
      company: string;
      companyPlaceholder: string;
      companyHint: string;
      submitInquiry: string;
    };
    buttons: {
      back: string;
      continue: string;
      submitRequest: string;
    };
    success: {
      title: string;
      body: string;
      callPhone: string;
      whatsapp: string;
      done: string;
    };
    phonePanel: {
      heading: string;
      subheading: string;
      callCta: string;
      whatsappCta: string;
      hours: string;
    };
  };
};

const sr: Dict = {
  nav: {
    home: "Početna",
    fleet: "Flota",
    quote: "Ponuda",
    about: "O nama",
    contact: "Kontakt",
    requestQuote: "Zatraži ponudu"
  },
  hero: {
    eyebrow: "Beograd, Srbija",
    title1: "Luksuzno iznajmljivanje",
    title2: "automobila u Beogradu",
    subtitle:
      "Vozite sami. Održana premium flota, jasni uslovi i transparentne cene u gotovini.",
    ctaPrimary: "Zatraži ponudu",
    ctaSecondary: "Pogledaj flotu"
  },
  quoteCard: {
    title: "Brza ponuda",
    pickup: "Datum preuzimanja",
    pickupPlaceholder: "Odaberi datum",
    return: "Datum vraćanja",
    returnPlaceholder: "Odaberi datum",
    vehicle: "Klasa vozila",
    vehicleAny: "Bilo koja klasa",
    name: "Ime i prezime",
    phone: "Telefon",
    message: "Napomena",
    submit: "Pošalji upit",
    submitNote: "Slanje uskoro — ovo je demo forma.",
    cashOnly: "Plaćanje isključivo gotovinom."
  },
  categories: {
    title: "Usluge iznajmljivanja",
    subtitle: "Izaberite klasu vozila koja odgovara vašoj potrebi.",
    items: [
      {
        title: "Limuzine",
        desc: "Udobne premium limuzine za poslovne dane i duža putovanja."
      },
      {
        title: "SUV vozila",
        desc: "Prostrana i sigurna vozila za porodice i grupe."
      },
      {
        title: "Sportski / luxury",
        desc: "Posebne prilike kada želite vozilo koje se primećuje."
      },
      {
        title: "Vanovi",
        desc: "Veći kapacitet kada putujete sa grupom ili više prtljaga."
      }
    ]
  },
  fleetPreview: {
    title: "Izabrano iz naše flote",
    subtitle: "Demo prikaz vozila koja se mogu rezervisati.",
    viewAll: "Pogledaj celu flotu"
  },
  fleetCard: {
    passengers: "putnika",
    luggage: "prtljag",
    transmission: "menjač",
    fuel: "gorivo",
    perDay: "po danu",
    pricePlaceholder: "na upit",
    reserve: "Rezerviši"
  },
  why: {
    title: "Zašto Inco Trans",
    items: [
      {
        title: "Premium flota",
        desc: "Pažljivo održavana vozila viših klasa, redovni servisi."
      },
      {
        title: "Transparentne cene",
        desc: "Cena bez skrivenih troškova. Plaćanje u gotovini."
      },
      {
        title: "Beograd kao baza",
        desc: "Brzo preuzimanje vozila u centru Beograda."
      },
      {
        title: "Diskrecija",
        desc: "Lični podaci se ne dele i ne koriste van rezervacije."
      }
    ]
  },
  how: {
    title: "Kako rezervisati",
    steps: [
      {
        title: "1. Pošalji upit",
        desc: "Popuni kratku formu sa datumima i klasom vozila."
      },
      {
        title: "2. Potvrda i uslovi",
        desc: "Javljamo se sa dostupnim vozilima i jasnim uslovima."
      },
      {
        title: "3. Preuzimanje",
        desc: "Preuzimanje u Beogradu, plaćanje u gotovini."
      }
    ]
  },
  about: {
    title: "O Inco Trans",
    body: [
      "Inco Trans je premium servis za iznajmljivanje automobila u Beogradu. Specijalizovani smo za vozila viših klasa namenjena samostalnoj vožnji.",
      "Cilj nam je jednostavna i diskretna usluga — bez nepotrebne komplikacije, sa transparentnim uslovima i pažljivo održavanom flotom."
    ],
    valuesTitle: "Naše vrednosti",
    values: [
      "Diskrecija i privatnost klijenata",
      "Redovno održavana vozila",
      "Transparentno gotovinsko plaćanje",
      "Dostupnost u Beogradu"
    ]
  },
  contact: {
    title: "Kontakt",
    subtitle: "Najbrži način da rezervišete vozilo je da nam pošaljete poruku.",
    formTitle: "Pošalji poruku",
    fullName: "Ime i prezime",
    email: "Email",
    phone: "Telefon",
    message: "Poruka",
    submit: "Pošalji",
    submitNote: "Slanje uskoro — ovo je demo forma.",
    addressLabel: "Adresa",
    hoursLabel: "Radno vreme",
    mapPlaceholder: "Mapa će biti dostupna uskoro."
  },
  footer: {
    rights: "Sva prava zadržana.",
    quickLinks: "Brzi linkovi",
    contact: "Kontakt",
    payments: "Plaćanje",
    paymentsValue: "Isključivo gotovina",
    disclaimer:
      "Demo verzija sajta. Cene i dostupnost vozila su orijentacioni i potvrđuju se prilikom rezervacije."
  },
  fleetPage: {
    title: "Naša flota",
    subtitle:
      "Demo prikaz vozila iz različitih klasa. Tačna dostupnost se potvrđuje na upit.",
    filterAll: "Sve klase",
    empty: "Trenutno nema vozila u ovoj kategoriji."
  },
  quotePage: {
    title: "Zatraži ponudu",
    subtitle:
      "Pošaljite kratak upit i javljamo se sa dostupnim vozilima i jasnom cenom."
  },
  modal: {
    title: "Rezerviši iskustvo",
    close: "Zatvori",
    step1: {
      heading: "Kako želite da rezervišete?",
      subheading: "Izaberite način rezervacije",
      learnMore: "Saznaj više",
      rent: {
        title: "Iznajmi auto",
        desc: "Vozite sami u luksuznom vozilu"
      },
      handle: {
        title: "Pustite nas da sredimo sve",
        desc: "Naš tim pripremiće ponudu po meri"
      },
      phone: {
        title: "Pozovi telefonom"
      }
    },
    progress: {
      journey: "Datumi",
      vehicle: "Vozilo",
      contact: "Kontakt",
      review: "Pregled"
    },
    rent: {
      journey: {
        heading: "Detalji putovanja",
        subheading: "Recite nam kada i gde",
        pickup: "Datum i vreme preuzimanja",
        return: "Datum i vreme vraćanja",
        location: "Mesto preuzimanja",
        locationPlaceholder: "Unesite adresu u Beogradu",
        crossBorder: "Planiram da pređem granicu Srbije"
      },
      vehicle: {
        heading: "Klasa vozila",
        subheading: "Izaberite tip koji vam odgovara",
        anyClass: "Bilo koja klasa"
      },
      review: {
        heading: "Pregled zahteva",
        subheading: "Proverite podatke pre slanja",
        pickupLabel: "Preuzimanje",
        returnLabel: "Vraćanje",
        locationLabel: "Mesto preuzimanja",
        vehicleLabel: "Klasa vozila",
        crossBorderYes: "Sa prelaskom granice",
        crossBorderNo: "Bez prelaska granice",
        cashNote: "Plaćanje isključivo gotovinom prilikom preuzimanja."
      }
    },
    contact: {
      heading: "Vaši kontakt podaci",
      subheading: "Kako možemo da vas kontaktiramo?",
      pastClient: "Već sam koristio vaše usluge",
      fullName: "Ime i prezime",
      fullNamePlaceholder: "Unesite ime i prezime",
      email: "Email adresa",
      emailPlaceholder: "vasa@adresa.com",
      phone: "Broj telefona",
      phonePlaceholder: "XX XXX XXXX",
      company: "Ime kompanije",
      companyPlaceholder: "Naziv firme",
      companyHint: "Opciono — za fakturisanje",
      submitInquiry: "Pošalji upit"
    },
    buttons: {
      back: "Nazad",
      continue: "Dalje",
      submitRequest: "Pošalji zahtev"
    },
    success: {
      title: "Hvala vam!",
      body: "Demo verzija sajta — zahtev nije zaista poslat. U produkciji se javljamo u najkraćem roku.",
      callPhone: "Pozovi",
      whatsapp: "WhatsApp",
      done: "Zatvori"
    },
    phonePanel: {
      heading: "Pozovi nas",
      subheading: "Najbrži način — javljamo se odmah",
      callCta: "Pozovi",
      whatsappCta: "Otvori WhatsApp",
      hours: "Radno vreme"
    }
  }
};

const en: Dict = {
  nav: {
    home: "Home",
    fleet: "Fleet",
    quote: "Quote",
    about: "About",
    contact: "Contact",
    requestQuote: "Request a quote"
  },
  hero: {
    eyebrow: "Belgrade, Serbia",
    title1: "Luxury self-drive",
    title2: "car rental in Belgrade",
    subtitle:
      "Drive yourself. A maintained premium fleet, simple terms and transparent prices in cash.",
    ctaPrimary: "Request a quote",
    ctaSecondary: "Browse the fleet"
  },
  quoteCard: {
    title: "Quick quote",
    pickup: "Pick-up date",
    pickupPlaceholder: "Select date",
    return: "Return date",
    returnPlaceholder: "Select date",
    vehicle: "Vehicle class",
    vehicleAny: "Any class",
    name: "Full name",
    phone: "Phone",
    message: "Note",
    submit: "Send request",
    submitNote: "Submission coming soon — this is a demo form.",
    cashOnly: "Cash payment only."
  },
  categories: {
    title: "Rental categories",
    subtitle: "Pick the class that fits your trip.",
    items: [
      {
        title: "Sedans",
        desc: "Comfortable premium sedans for business days and longer trips."
      },
      {
        title: "SUVs",
        desc: "Spacious and safe vehicles for families and groups."
      },
      {
        title: "Sport / luxury",
        desc: "Special occasions when you want a car that gets noticed."
      },
      {
        title: "Vans",
        desc: "More capacity when travelling with a group or extra luggage."
      }
    ]
  },
  fleetPreview: {
    title: "Selected from our fleet",
    subtitle: "Demo preview of vehicles available to rent.",
    viewAll: "View full fleet"
  },
  fleetCard: {
    passengers: "passengers",
    luggage: "luggage",
    transmission: "transmission",
    fuel: "fuel",
    perDay: "per day",
    pricePlaceholder: "on request",
    reserve: "Reserve"
  },
  why: {
    title: "Why Inco Trans",
    items: [
      {
        title: "Premium fleet",
        desc: "Higher-class vehicles, regularly serviced and prepared."
      },
      {
        title: "Transparent pricing",
        desc: "No hidden fees. Payment in cash on pick-up."
      },
      {
        title: "Belgrade based",
        desc: "Fast vehicle pick-up in the centre of Belgrade."
      },
      {
        title: "Discretion",
        desc: "Personal details are kept private and used only for the booking."
      }
    ]
  },
  how: {
    title: "How rental works",
    steps: [
      {
        title: "1. Send a request",
        desc: "Fill the short form with dates and a vehicle class."
      },
      {
        title: "2. Confirmation",
        desc: "We reply with available vehicles and clear terms."
      },
      {
        title: "3. Pick-up",
        desc: "Pick-up in Belgrade, payment in cash."
      }
    ]
  },
  about: {
    title: "About Inco Trans",
    body: [
      "Inco Trans is a premium car rental service in Belgrade focused on higher-class vehicles for self-drive use.",
      "Our goal is a simple and discreet experience — no unnecessary friction, transparent terms and a carefully maintained fleet."
    ],
    valuesTitle: "Our values",
    values: [
      "Client privacy and discretion",
      "Well-maintained vehicles",
      "Transparent cash pricing",
      "Belgrade availability"
    ]
  },
  contact: {
    title: "Contact",
    subtitle: "The fastest way to reserve a car is to send us a short message.",
    formTitle: "Send a message",
    fullName: "Full name",
    email: "Email",
    phone: "Phone",
    message: "Message",
    submit: "Send",
    submitNote: "Submission coming soon — this is a demo form.",
    addressLabel: "Address",
    hoursLabel: "Opening hours",
    mapPlaceholder: "Map coming soon."
  },
  footer: {
    rights: "All rights reserved.",
    quickLinks: "Quick links",
    contact: "Contact",
    payments: "Payment",
    paymentsValue: "Cash only",
    disclaimer:
      "Demo version of the website. Prices and vehicle availability are indicative and confirmed at booking."
  },
  fleetPage: {
    title: "Our fleet",
    subtitle:
      "Demo preview across different classes. Exact availability is confirmed on request.",
    filterAll: "All classes",
    empty: "No vehicles in this category yet."
  },
  quotePage: {
    title: "Request a quote",
    subtitle:
      "Send a short request and we will reply with available vehicles and a clear price."
  },
  modal: {
    title: "Book your experience",
    close: "Close",
    step1: {
      heading: "How would you like to book?",
      subheading: "Choose your preferred way to reserve",
      learnMore: "Learn more",
      rent: {
        title: "Rent a car",
        desc: "Drive yourself in luxury"
      },
      handle: {
        title: "Let us handle everything",
        desc: "Our team will create a custom offer"
      },
      phone: {
        title: "Book by phone"
      }
    },
    progress: {
      journey: "Journey",
      vehicle: "Vehicle",
      contact: "Contact",
      review: "Review"
    },
    rent: {
      journey: {
        heading: "Journey details",
        subheading: "Tell us when and where",
        pickup: "Pickup date & time",
        return: "Return date & time",
        location: "Pickup location",
        locationPlaceholder: "Enter an address in Belgrade",
        crossBorder: "I plan to cross the Serbian border"
      },
      vehicle: {
        heading: "Vehicle class",
        subheading: "Pick the type that fits you",
        anyClass: "Any class"
      },
      review: {
        heading: "Review your request",
        subheading: "Check the details before sending",
        pickupLabel: "Pickup",
        returnLabel: "Return",
        locationLabel: "Pickup location",
        vehicleLabel: "Vehicle class",
        crossBorderYes: "Cross-border trip",
        crossBorderNo: "No border crossing",
        cashNote: "Payment in cash only, on pickup."
      }
    },
    contact: {
      heading: "Your contact details",
      subheading: "How can we reach you?",
      pastClient: "I've used your services before",
      fullName: "Full name",
      fullNamePlaceholder: "Enter your full name",
      email: "Email address",
      emailPlaceholder: "your@email.com",
      phone: "Phone number",
      phonePlaceholder: "XX XXX XXXX",
      company: "Company name",
      companyPlaceholder: "Company name",
      companyHint: "Optional — for business invoicing",
      submitInquiry: "Submit inquiry"
    },
    buttons: {
      back: "Back",
      continue: "Continue",
      submitRequest: "Submit request"
    },
    success: {
      title: "Thank you!",
      body: "Demo version — your request was not actually sent. In production we'd reply shortly.",
      callPhone: "Call us",
      whatsapp: "WhatsApp",
      done: "Close"
    },
    phonePanel: {
      heading: "Call us",
      subheading: "Fastest path — we pick up right away",
      callCta: "Call",
      whatsappCta: "Open WhatsApp",
      hours: "Opening hours"
    }
  }
};

export const translations: Record<Locale, Dict> = { sr, en };

export function t(locale: Locale): Dict {
  return translations[locale];
}
