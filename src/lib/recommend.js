// Ranking. Filters in, ordered list out.
// Owner: dataset + recommendation logic.
//
// CONTRACT with the interface (agreed day 1, see DECISIONS.md #1):
//   recommend(filters) -> [{ quest, plan, score, why }] sorted best first
//   filters = { gap, budget, mood, setting, start, now, seed, exclude }
//             setting: "indoors" | "outdoors" | "either"
//             start:   a { lat, lng } — the UI resolves free text before calling
//             now:     { minutes, day } or null to ignore opening hours
//   plan    = { travel, mode, stay, total, spare, tight, closes }
//   why     = [[human-readable reason, "+points"], ...]
// The UI never recomputes anything from a quest: every number on screen comes
// out of `plan` or `why`.

import { QUESTS } from "../data/quests.js";
import { STARTS } from "../data/starts.js";
import { planFor } from "./travel.js";

/* Deterministic jitter; real variety comes from `exclude`. */
function hash(str){
  var h=2166136261;
  for(var i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); }
  return ((h>>>0)%1000)/1000;
}

export function scoreQuest(q, plan, f){
  var parts = [];
  var s = 0;

  if(q.mood === f.mood){ s += 42; parts.push(["Exactly the mood you picked","+42"]); }
  else if(q.tags.indexOf(f.mood) !== -1){ s += 22; parts.push(["Close enough to your mood","+22"]); }

  // Use most of the gap without sprinting for it.
  var use = plan.total / f.gap;
  var fit = 1 - Math.min(1, Math.abs(use - 0.78) / 0.55);
  var timePts = Math.round(26 * fit);
  s += timePts;
  parts.push(["Fills the gap without rushing","+" + timePts]);

  // Budget.
  if(f.budget === 0 && q.cost[1] === 0){ s += 14; parts.push(["Completely free","+14"]); }
  else if(q.cost[1] <= f.budget){ s += 12; parts.push(["Comfortably inside your budget","+12"]); }
  else if(q.cost[0] <= f.budget){ s += 5; parts.push(["Doable if you order carefully","+5"]); }

  // Weather.
  if(f.setting === "either"){
    // Nudge outside when they didn't care; anyone who did already said so.
    if(!q.indoor){ s += 8; parts.push(["Worth being outside for","+8"]); }
  }

  // Tiebreak only.
  var d = Math.round(q.delight * 1.2);
  s += d;
  if(q.delight >= 8) parts.push(["One of the good ones","+" + d]);

  // Right on the edge of the clock.
  if(plan.tight){ s -= 8; parts.push(["Cutting it a bit fine","-8"]); }

  s += Math.round(hash(q.id + "|" + f.seed) * 12);

  return { total:s, parts:parts };
}

export function recommend(f){
  // Either a known start id or a { lat, lng } resolved from free text.
  var start = f.start;
  if(typeof start === "string"){
    start = null;
    for(var i=0;i<STARTS.length;i++){ if(STARTS[i].id === f.start) start = STARTS[i]; }
  }
  if(!start || typeof start.lat !== "number") start = STARTS[0];

  var skip = f.exclude || [];
  var results = [], excluded = [];
  for(var j=0;j<QUESTS.length;j++){
    var q = QUESTS[j];
    if(q.cost[0] > f.budget) continue;                  // can't afford the floor
    if(f.setting === "indoors" && !q.indoor) continue;
    if(f.setting === "outdoors" && q.indoor) continue;
    var plan = planFor(q, start, f.gap, f.now);
    if(!plan) continue;                                 // doesn't fit the clock
    var sc = scoreQuest(q, plan, f);
    var row = { quest:q, plan:plan, score:sc.total, why:sc.parts };
    if(skip.indexOf(q.id) !== -1) excluded.push(row); else results.push(row);
  }
  // Repeat only if nothing else is left.
  if(!results.length) results = excluded;
  results.sort(function(a,b){ return b.score - a.score; });
  return results;
}



/* Nothing fits: find the smallest thing worth relaxing. */
export const GAP_LADDER = [30,60,90,120], BUDGET_LADDER = [0,10,25,40];
export const ALL_MOODS = ["productive","social","quiet","food","outdoors"];
export function loosenings(f){
  var out = [];
  function tryPatch(p){
    var g = {gap:f.gap,budget:f.budget,mood:f.mood,setting:f.setting,
             start:f.start,now:f.now,seed:f.seed,exclude:f.exclude};
    for(var k in p){ if(Object.prototype.hasOwnProperty.call(p,k)) g[k]=p[k]; }
    return recommend(g).length;
  }
  if(f.setting !== "either" && tryPatch({setting:"either"}))
    out.push({ label:"Either indoors or out", patch:{setting:"either"} });
  if(f.now && tryPatch({now:null}))
    out.push({ label:"Ignore opening hours", patch:{now:null} });
  var bi = BUDGET_LADDER.indexOf(f.budget);
  for(var i=bi+1;i<BUDGET_LADDER.length;i++){
    if(tryPatch({budget:BUDGET_LADDER[i]})){
      out.push({ label:"Spend up to $" + BUDGET_LADDER[i], patch:{budget:BUDGET_LADDER[i]} }); break;
    }
  }
  var gi = GAP_LADDER.indexOf(f.gap);
  for(var j=gi+1;j<GAP_LADDER.length;j++){
    if(tryPatch({gap:GAP_LADDER[j]})){
      out.push({ label:"Pretend the gap is " + GAP_LADDER[j] + " minutes", patch:{gap:GAP_LADDER[j]} }); break;
    }
  }
  for(var m=0;m<ALL_MOODS.length;m++){
    if(ALL_MOODS[m] === f.mood) continue;
    if(tryPatch({mood:ALL_MOODS[m]}) >= 3){
      out.push({ label:"Be open to something " + ALL_MOODS[m], patch:{mood:ALL_MOODS[m]} }); break;
    }
  }
  return out.slice(0,3);
}

