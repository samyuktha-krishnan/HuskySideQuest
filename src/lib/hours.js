// Is it open when you'd get there, and open long enough to be worth it.
// Owner: dataset + recommendation logic.
import { VENUES, ENRICHED_AT } from "../data/venues.js";

// Google hours win; these profiles are the fallback. They are category
// estimates, not verified times — enough to stop us sending someone to a
// bookshop at 9pm, not enough to promise it's open at 6:55.
//
// Minutes from midnight, weekday 0 = Sunday.
const ALL_WEEK = [0, 1, 2, 3, 4, 5, 6];
const hhmm = (h, m = 0) => h * 60 + m;

export const PROFILES = {
  outdoor: { open: hhmm(0), close: hhmm(24), days: ALL_WEEK, note: "any time" },

  // card-access outside these hours
  campus: { open: hhmm(7), close: hhmm(22), days: [1, 2, 3, 4, 5], weekend: { open: hhmm(9), close: hhmm(18) }, note: "term-time building hours" },

  library: { open: hhmm(8), close: hhmm(22), days: ALL_WEEK, weekend: { open: hhmm(10), close: hhmm(20) }, note: "library hours" },

  cafe: { open: hhmm(7), close: hhmm(18), days: ALL_WEEK, note: "café hours" },

  restaurant: { open: hhmm(11), close: hhmm(21), days: ALL_WEEK, note: "kitchen hours" },

  shop: { open: hhmm(10), close: hhmm(19), days: ALL_WEEK, note: "shop hours" },

  museum: { open: hhmm(10), close: hhmm(17), days: [0, 2, 3, 4, 5, 6], note: "closed Mondays" },

  gym: { open: hhmm(6), close: hhmm(22), days: [1, 2, 3, 4, 5], weekend: { open: hhmm(8), close: hhmm(20) }, note: "IMA hours" },

  evening: { open: hhmm(19), close: hhmm(22), days: [1, 3, 5], note: "open evenings only" },

  boathouse: { open: hhmm(10), close: hhmm(18), days: ALL_WEEK, note: "daylight hours, seasonal" },
};

// Periods for a day as [[open, close], ...]; "always" = never shuts, null =
// closed today. Authority: Google, then hand-written override, then profile.
// `venues` is injectable so tests can use a fixture.
export function periodsFor(quest, day, venues = VENUES) {
  const v = venues[quest.id];
  if (v && v.hours) {
    if (v.hours === "always") return "always";
    const today = v.hours[day];
    if (!today) return null;                  // unknown
    return today.length ? today : null;       // [] = shut today
  }

  if (quest.hours) {
    if (quest.hours.days && !quest.hours.days.includes(day)) return null;
    return [[quest.hours.open, quest.hours.close]];
  }

  const p = PROFILES[quest.openness || "outdoor"];
  if (!p) return "always";
  if (p.days && !p.days.includes(day)) return null;
  const weekend = day === 0 || day === 6;
  const w = weekend && p.weekend ? { ...p, ...p.weekend } : p;
  if (w.close - w.open >= 24 * 60) return "always";
  return [[w.open, w.close]];
}

export function alwaysOpen(quest, venues = VENUES) {
  const v = venues[quest.id];
  if (v && v.hours) return v.hours === "always";
  return (quest.openness || "outdoor") === "outdoor" && !quest.hours;
}

// Shown to the user, so they know whether to trust the times.
export function hoursSource(quest, venues = VENUES) {
  return venues[quest.id]?.hours ? "google" : "estimated";
}

/**
 * How long you could stay, given when you'd arrive.
 * Returns the latest you could leave (minutes from midnight), or null if it
 * is shut when you get there.
 */
export function closingTime(quest, arrivalMinutes, day, venues = VENUES) {
  const periods = periodsFor(quest, day, venues);
  if (!periods) return null;
  if (periods === "always") return arrivalMinutes + 24 * 60;
  for (const [open, close] of periods) {      // lunch breaks mean 2 periods
    if (arrivalMinutes >= open && arrivalMinutes < close) return close;
  }
  return null;   // shut on arrival; we don't make people wait
}

function clock(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + (m ? ":" + String(m).padStart(2, "0") : "") + ampm;
}

export function hoursNote(quest, day, venues = VENUES) {
  const periods = periodsFor(quest, day, venues);
  if (periods === "always") return "any time";
  if (!periods) return "shut today";

  if (hoursSource(quest, venues) === "google") {
    const [open, close] = periods[0];
    return clock(open) + "–" + clock(periods[periods.length - 1][1] === close
      ? close : periods[periods.length - 1][1]);
  }
  if (quest.hours) return quest.hours.note || "check hours";
  const p = PROFILES[quest.openness || "outdoor"];
  return (p ? p.note : "check hours") + ", estimated";
}

export { ENRICHED_AT };

export function nowParts(date = new Date()) {
  return { minutes: date.getHours() * 60 + date.getMinutes(), day: date.getDay() };
}
