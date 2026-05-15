import type { Locale } from "./site-config";

type LegalPageContent = {
  title: string;
  subtitle: string;
  description: string;
  sections: { title: string; body: string[] }[];
};

export const termsContent: Record<Locale, LegalPageContent> = {
  sr: {
    title: "Uslovi korišćenja",
    subtitle: "Pravila za korišćenje sajta i rezervaciju Inco Trans usluga.",
    description:
      "Uslovi korišćenja sajta i rezervacije Inco Trans šofer i transfer usluga.",
    sections: [
      {
        title: "Rezervacije",
        body: [
          "Slanjem upita putem sajta ne nastaje automatski potvrđena rezervacija. Rezervacija je potvrđena tek kada naš tim potvrdi dostupnost vozila, vreme, rutu i cenu.",
          "Korisnik je odgovoran za tačnost podataka koje pošalje, uključujući adresu, vreme preuzimanja, broj putnika, prtljag i kontakt podatke."
        ]
      },
      {
        title: "Cene i plaćanje",
        body: [
          "Cene prikazane na sajtu ili u formularu su okvirne. Konačnu cenu potvrđuje Inco Trans tim pre vožnje.",
          "Plaćanje je moguće gotovinom ili karticom, osim ako nije drugačije dogovoreno u potvrdi rezervacije."
        ]
      },
      {
        title: "Promene i otkazivanje",
        body: [
          "Promene vremena, rute ili dodatnih zahteva zavise od dostupnosti vozila i mogu uticati na cenu.",
          "U slučaju kašnjenja leta, za aerodromske transfere koristimo dostavljeni broj leta kako bismo prilagodili vreme preuzimanja kada je to moguće."
        ]
      },
      {
        title: "Odgovornost",
        body: [
          "Inco Trans nastoji da uslugu pruži tačno i profesionalno, ali ne odgovara za okolnosti van razumne kontrole, kao što su vanredni zastoji, zatvaranje puteva, vremenski uslovi ili netačni podaci korisnika.",
          "Korišćenjem sajta prihvatate ove uslove i saglasni ste da komunikacija o rezervaciji može biti obavljena telefonom, emailom, SMS-om, Viberom ili WhatsAppom."
        ]
      }
    ]
  },
  en: {
    title: "Terms of Use",
    subtitle: "Rules for using the site and booking Inco Trans services.",
    description:
      "Terms of use for the Inco Trans website and chauffeur service bookings.",
    sections: [
      {
        title: "Bookings",
        body: [
          "Submitting a request through the website does not automatically create a confirmed booking. A booking is confirmed only after our team confirms vehicle availability, time, route and price.",
          "The customer is responsible for the accuracy of submitted details, including pickup address, pickup time, passenger count, luggage and contact information."
        ]
      },
      {
        title: "Prices and Payment",
        body: [
          "Prices shown on the website or in the form are estimates. The final price is confirmed by the Inco Trans team before the ride.",
          "Payment is available by cash or card unless agreed otherwise in the booking confirmation."
        ]
      },
      {
        title: "Changes and Cancellations",
        body: [
          "Changes to time, route or additional requests depend on vehicle availability and may affect the price.",
          "For airport transfers, when a flight number is provided, we use it to adjust pickup time where possible."
        ]
      },
      {
        title: "Liability",
        body: [
          "Inco Trans aims to provide punctual and professional service, but is not responsible for circumstances outside reasonable control, such as exceptional traffic, road closures, weather or incorrect customer details.",
          "By using this site, you accept these terms and agree that booking communication may take place by phone, email, SMS, Viber or WhatsApp."
        ]
      }
    ]
  },
  ru: {
    title: "Условия использования",
    subtitle: "Правила использования сайта и бронирования услуг Inco Trans.",
    description:
      "Условия использования сайта Inco Trans и бронирования услуг с водителем.",
    sections: [
      {
        title: "Бронирование",
        body: [
          "Отправка запроса через сайт не означает автоматическое подтверждение бронирования. Бронирование подтверждается только после того, как наша команда подтвердит доступность автомобиля, время, маршрут и цену.",
          "Клиент отвечает за точность отправленных данных, включая адрес, время подачи, количество пассажиров, багаж и контактную информацию."
        ]
      },
      {
        title: "Цены и Оплата",
        body: [
          "Цены на сайте или в форме являются ориентировочными. Финальную цену подтверждает команда Inco Trans до поездки.",
          "Оплата возможна наличными или картой, если иное не согласовано в подтверждении бронирования."
        ]
      },
      {
        title: "Изменения и Отмена",
        body: [
          "Изменения времени, маршрута или дополнительных требований зависят от доступности автомобиля и могут повлиять на цену.",
          "Для трансферов из аэропорта при наличии номера рейса мы используем его, чтобы по возможности скорректировать время встречи."
        ]
      },
      {
        title: "Ответственность",
        body: [
          "Inco Trans стремится предоставить пунктуальный и профессиональный сервис, но не несёт ответственности за обстоятельства вне разумного контроля, включая необычные пробки, перекрытия дорог, погодные условия или неверные данные клиента.",
          "Используя сайт, вы принимаете эти условия и соглашаетесь, что коммуникация по бронированию может происходить по телефону, email, SMS, Viber или WhatsApp."
        ]
      }
    ]
  }
};

export const privacyContent: Record<Locale, LegalPageContent> = {
  sr: {
    title: "Politika privatnosti",
    subtitle: "Kako prikupljamo i koristimo podatke za obradu vašeg upita.",
    description:
      "Politika privatnosti Inco Trans sajta i obrade podataka za rezervacije.",
    sections: [
      {
        title: "Podaci koje prikupljamo",
        body: [
          "Kada pošaljete upit, možemo prikupiti ime i prezime, email, telefon, željeni način komunikacije, naziv kompanije, detalje vožnje, broj leta i napomenu.",
          "Podatke koristimo isključivo da bismo odgovorili na upit, pripremili ponudu, potvrdili rezervaciju i pružili dogovorenu uslugu."
        ]
      },
      {
        title: "Komunikacija",
        body: [
          "Možemo vas kontaktirati putem telefona, emaila, SMS-a, Vibera ili WhatsAppa, u skladu sa podacima i preferencijama koje ste poslali.",
          "Ne prodajemo vaše podatke trećim stranama."
        ]
      },
      {
        title: "Čuvanje podataka",
        body: [
          "Podatke čuvamo onoliko koliko je potrebno za obradu upita, realizaciju rezervacije, administrativne potrebe i zakonske obaveze.",
          "Možete zatražiti pristup, ispravku ili brisanje svojih podataka kontaktiranjem Inco Trans tima."
        ]
      },
      {
        title: "Bezbednost",
        body: [
          "Preduzimamo razumne tehničke i organizacione mere da zaštitimo podatke koje nam dostavite.",
          "Ako imate pitanja o privatnosti ili obradi podataka, kontaktirajte nas putem podataka navedenih na sajtu."
        ]
      }
    ]
  },
  en: {
    title: "Privacy Policy",
    subtitle: "How we collect and use data to process your request.",
    description:
      "Privacy policy for the Inco Trans website and booking request data.",
    sections: [
      {
        title: "Data We Collect",
        body: [
          "When you submit a request, we may collect your full name, email, phone number, preferred communication method, company name, trip details, flight number and notes.",
          "We use this data only to answer your request, prepare an offer, confirm a booking and provide the agreed service."
        ]
      },
      {
        title: "Communication",
        body: [
          "We may contact you by phone, email, SMS, Viber or WhatsApp according to the details and preferences you submit.",
          "We do not sell your personal data to third parties."
        ]
      },
      {
        title: "Data Retention",
        body: [
          "We keep data only as long as needed to process requests, complete bookings, handle administration and meet legal obligations.",
          "You may request access, correction or deletion of your data by contacting the Inco Trans team."
        ]
      },
      {
        title: "Security",
        body: [
          "We take reasonable technical and organizational measures to protect the information you provide.",
          "If you have questions about privacy or data processing, contact us using the details listed on the website."
        ]
      }
    ]
  },
  ru: {
    title: "Политика конфиденциальности",
    subtitle: "Как мы собираем и используем данные для обработки вашего запроса.",
    description:
      "Политика конфиденциальности сайта Inco Trans и данных заявок на бронирование.",
    sections: [
      {
        title: "Какие данные мы собираем",
        body: [
          "При отправке запроса мы можем собирать имя и фамилию, email, телефон, предпочтительный способ связи, название компании, детали поездки, номер рейса и комментарий.",
          "Мы используем эти данные только для ответа на запрос, подготовки предложения, подтверждения бронирования и предоставления согласованной услуги."
        ]
      },
      {
        title: "Коммуникация",
        body: [
          "Мы можем связаться с вами по телефону, email, SMS, Viber или WhatsApp в соответствии с данными и предпочтениями, которые вы отправили.",
          "Мы не продаём ваши персональные данные третьим лицам."
        ]
      },
      {
        title: "Хранение данных",
        body: [
          "Мы храним данные только столько, сколько необходимо для обработки запросов, выполнения бронирований, административных целей и соблюдения юридических обязательств.",
          "Вы можете запросить доступ, исправление или удаление ваших данных, связавшись с командой Inco Trans."
        ]
      },
      {
        title: "Безопасность",
        body: [
          "Мы принимаем разумные технические и организационные меры для защиты предоставленной информации.",
          "Если у вас есть вопросы о конфиденциальности или обработке данных, свяжитесь с нами по контактам, указанным на сайте."
        ]
      }
    ]
  }
};
