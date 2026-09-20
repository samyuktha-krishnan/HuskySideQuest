// Travel time, and whether a quest physically fits the gap.
// Owner: dataset + recommendation logic.
// No opinion about which quest is *good* — that's recommend.js.
import { closingTime, alwaysOpen } from "./hours.js";
import { CALIBRATION } from "../data/calibration.js";
import { VENUES } from "../data/venues.js";

/* --- geometry --- */
export function haversine(a,b){
  var R=6371000, t=Math.PI/180;
  var dLat=(b.lat-a.lat)*t, dLng=(b.lng-a.lng)*t;
  var la1=a.lat*t, la2=b.lat*t;
  var h=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)*Math.sin(dLng/2);
  return 2*R*Math.asin(Math.sqrt(h));
}
// From calibration.js; `npm run calibrate` fits these to real routes.
export const WALK_M_PER_MIN = CALIBRATION.speedMetresPerMinute;
export const DETOUR = CALIBRATION.factor;

export function walkMinutes(a,b){
  return Math.max(1, Math.round(haversine(coords(a),coords(b))*DETOUR/WALK_M_PER_MIN));
}

/* Google's coords beat our hand-typed ones when we have them. */
export function coords(p){
  var v = p && p.id ? VENUES[p.id] : null;
  return (v && typeof v.lat === "number") ? v : p;
}

/* Travel is the faster of walking the whole way or bussing/training via a hub. */
export function travelFor(q, start){
  var w = walkMinutes(start, q);
  var best = { minutes:w, mode:"walk" };
  if(q.via){
    var t = walkMinutes(start, q.via.hub) + q.via.ride + q.via.egress;
    if(t < w) best = { minutes:t, mode:q.via.mode };
  }
  return best;
}

export const BUFFER = 5; // minutes of "don't miss your next class" slack, always reserved

/* How long you'd actually spend there given the gap, or null if it can't be done. */
export function planFor(q, start, gapMinutes, now){
  var travel = travelFor(q, start);
  var room = gapMinutes - travel.minutes*2 - BUFFER;
  if(room < q.act[0]) return null;
  var stay = Math.min(q.act[1], room);

  // Closing time is a second ceiling on the visit. Shut on arrival = dropped,
  // not shown with a caveat.
  var closes = null;
  if(now){
    var arrival = now.minutes + travel.minutes;
    var close = closingTime(q, arrival, now.day);
    if(close === null) return null;
    stay = Math.min(stay, close - arrival);
    if(stay < q.act[0]) return null;
    // null, not the +24h sentinel — that leaked into the UI as "until 7:58pm"
    // on a park that never shuts.
    closes = alwaysOpen(q) ? null : close;
  }

  var total = travel.minutes*2 + stay;
  return {
    travel: travel.minutes,
    mode: travel.mode,
    stay: stay,
    total: total,
    spare: gapMinutes - total,
    closes: closes,
    tight: (gapMinutes - travel.minutes*2 - q.act[0]) < 10
  };
}

