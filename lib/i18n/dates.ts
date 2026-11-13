const UZ_MONTHS_SHORT = [
  "yan", "fev", "mar", "apr", "may", "iyn",
  "iyl", "avg", "sen", "okt", "noy", "dek",
];

const UZ_MONTHS_LONG = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

// Date.getDay(): 0 = yakshanba
const UZ_WEEKDAYS_SHORT = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];

const isUz = (locale: string) => locale.toLowerCase().startsWith("uz");

// Hafta kuni: "Sat" / "сб" / "Shan"
export function weekdayShort(date: Date, locale: string) {
  if (isUz(locale)) return UZ_WEEKDAYS_SHORT[date.getDay()];
  return date.toLocaleDateString(locale, { weekday: "short" });
}

// Oy qisqartmasi: "Oct" / "окт." / "okt"
export function monthShort(date: Date, locale: string) {
  if (isUz(locale)) return UZ_MONTHS_SHORT[date.getMonth()];
  return date.toLocaleDateString(locale, { month: "short" });
}

// Oy va yil: "November 2026" / "ноябрь 2026 г." / "Noyabr 2026"
export function monthYear(date: Date, locale: string) {
  if (isUz(locale)) {
    const name = UZ_MONTHS_LONG[date.getMonth()];
    return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${date.getFullYear()}`;
  }
  return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

// Kun va oy: "Oct 28" / "28 окт." / "28-okt"
export function dayMonth(date: Date, locale: string) {
  if (isUz(locale)) {
    return `${date.getDate()}-${UZ_MONTHS_SHORT[date.getMonth()]}`;
  }
  return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
}