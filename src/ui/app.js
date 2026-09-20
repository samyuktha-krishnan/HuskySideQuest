// Interface: collect filters, resolve the location, render the result.
// Owner: interface + filtering + result cards.
//
// Knows nothing about walking speed, scoring or hours. If you're doing
// arithmetic on a quest in here, the number belongs in `plan` — see the
// CONTRACT in src/lib/recommend.js.

import { STARTS } from "../data/starts.js";
import { PLACES } from "../data/places.js";
import { recommend, loosenings } from "../lib/recommend.js";
import { locate } from "../lib/locate.js";
import { hoursNote, hoursSource, nowParts, ENRICHED_AT } from "../lib/hours.js";
import { VENUES } from "../data/venues.js";
import { QUESTS } from "../data/quests.js";

var TIMES = [30, 60, 90, 120];
var MONEY = [[0, "free"], [10, "$10"], [25, "$25"], [40, "$40"]];
var MOODS = ["productive", "social", "quiet", "food", "outdoors"];
var SETTINGS = [["indoors", "indoors"], ["outdoors", "outdoors"], ["either", "either"]];

// Stable catalogue numbers, so a quest keeps its number between sessions.
var TOTAL = QUESTS.length;
var QUEST_INDEX = {};
QUESTS.forEach(function (q, i) { QUEST_INDEX[q.id] = String(i + 1).padStart(2, "0"); });

var state = {
  gap: 60, budget: 10, mood: "quiet", setting: "either",
  typed: "Red Square", place: PLACES[0],
  clock: null,        // "HH:MM", defaults to now
  seed: 1
};
var recent = [];      // already offered this round

try {
  var saved = JSON.parse(localStorage.getItem("sidequest-uw") || "null");
  if (saved && typeof saved === "object") {
    ["gap", "budget", "mood", "setting", "typed"].forEach(function (k) {
      if (saved[k] !== undefined) state[k] = saved[k];
    });
    var again = locate(state.typed);
    if (again.place) state.place = again.place;
  }
} catch (e) { /* private browsing */ }

function save() {
  try {
    localStorage.setItem("sidequest-uw", JSON.stringify({
      gap: state.gap, budget: state.budget, mood: state.mood,
      setting: state.setting, typed: state.typed
    }));
  } catch (e) {}
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

/* ---------- clock ---------- */
function nowMinutes() {
  if (state.clock) {
    var bits = state.clock.split(":");
    return (+bits[0]) * 60 + (+bits[1]);
  }
  var d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
function currentNow() {
  var p = nowParts();
  return { minutes: nowMinutes(), day: p.day };
}
function clockOf(minutes) {
  var m = ((minutes % 1440) + 1440) % 1440;
  var h = Math.floor(m / 60), mm = m % 60;
  var ampm = h >= 12 ? "pm" : "am";
  var h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + ":" + (mm < 10 ? "0" : "") + mm + ampm;
}

/* ---------- form ---------- */
function options(host, items, key, label) {
  host.innerHTML = "";
  items.forEach(function (it) {
    var value = Array.isArray(it) ? it[0] : it;
    var text = Array.isArray(it) ? it[1] : label ? label(it) : it;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "opt";
    b.textContent = text;
    b.setAttribute("data-key", key);
    b.setAttribute("data-val", String(value));
    b.setAttribute("aria-pressed", String(state[key] === value));
    b.addEventListener("click", function () {
      state[key] = value;
      Array.prototype.forEach.call(host.children, function (c) {
        c.setAttribute("aria-pressed", "false");
      });
      b.setAttribute("aria-pressed", "true");
      save();
    });
    host.appendChild(b);
  });
}

options(document.getElementById("v-gap"), TIMES, "gap", function (t) { return t + " min"; });
options(document.getElementById("v-budget"), MONEY, "budget");
options(document.getElementById("v-mood"), MOODS, "mood");
options(document.getElementById("v-setting"), SETTINGS, "setting");

// Native autocomplete, so the common case needs no JS.
var list = document.getElementById("places");
PLACES.forEach(function (p) {
  var o = document.createElement("option");
  o.value = p.name;
  list.appendChild(o);
});

var where = document.getElementById("where");
var resolved = document.getElementById("resolved");
where.value = state.typed;

var simplify = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ""); };

function showResolved(result) {
  if (result.place) {
    // Echo unless they typed the name itself; "mgh" with no feedback leaves
    // you guessing whether it landed.
    resolved.innerHTML = simplify(result.typed) === simplify(result.place.name)
      ? ""
      : "Reading that as <b>" + esc(result.place.name) + "</b>.";
    return;
  }
  if (result.suggestions && result.suggestions.length) {
    resolved.innerHTML = "Did you mean:" +
      '<span class="guesses">' + result.suggestions.map(function (p) {
        return '<button type="button" data-place="' + esc(p.name) + '">' + esc(p.name) + "</button>";
      }).join("") + "</span>";
    Array.prototype.forEach.call(resolved.querySelectorAll("[data-place]"), function (btn) {
      btn.addEventListener("click", function () {
        where.value = btn.getAttribute("data-place");
        resolveWhere(true);
        where.focus();
      });
    });
    return;
  }
  resolved.innerHTML = "Don't know that one. Try a building name, or " +
    "<b>" + esc(PLACES[0].name) + "</b>.";
}

var lastResolved = null;

function resolveWhere(force) {
  // Blur fires before a click on the suggestion buttons; re-rendering here
  // detaches them mid-click. Unchanged input is a no-op.
  if (!force && where.value === lastResolved) return null;
  lastResolved = where.value;
  state.typed = where.value;
  var result = locate(where.value);
  if (result.place) state.place = result.place;
  showResolved(result);
  save();
  return result;
}
where.addEventListener("change", function () { resolveWhere(); });
where.addEventListener("blur", function () { resolveWhere(); });

var clockInput = document.getElementById("clock");
(function initClock() {
  var p = nowParts();
  var h = Math.floor(p.minutes / 60), m = p.minutes % 60;
  clockInput.value = (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
})();
clockInput.addEventListener("change", function () {
  state.clock = clockInput.value || null;
});

/* ---------- render ---------- */
// Ticking clock: the whole app is about time, so show it moving.
(function tick() {
  var el = document.getElementById("tick");
  if (!el) return;
  var paint = function () { el.textContent = clockOf(nowMinutes()); };
  paint();
  setInterval(paint, 15000);
})();

// Say how stale the data is; nobody should assume it's live.
(function freshness() {
  var el = document.getElementById("freshness");
  if (!el) return;
  var n = Object.keys(VENUES).length;
  el.textContent = ENRICHED_AT
    ? n + " venues, hours checked " + ENRICHED_AT
    : "57 places, hours estimated";
})();

var out = document.getElementById("out");
var lastResults = [];

function filters() {
  return {
    gap: state.gap, budget: state.budget, mood: state.mood, setting: state.setting,
    start: state.place, now: currentNow(), seed: state.seed, exclude: recent
  };
}

function syncForm() {
  Array.prototype.forEach.call(document.querySelectorAll(".opt"), function (c) {
    var k = c.getAttribute("data-key");
    c.setAttribute("aria-pressed", String(String(state[k]) === c.getAttribute("data-val")));
  });
}

function run() {
  lastResults = recommend(filters());
  render(lastResults, 0);
}

function money(cost) {
  if (cost[1] === 0) return "free";
  if (cost[0] === 0) return "under $" + cost[1];
  if (cost[0] === cost[1]) return "$" + cost[0];
  return "$" + cost[0] + "–" + cost[1];
}

function mapsUrl(q) {
  // place id pins the exact venue; address text can hit the wrong branch.
  var v = VENUES[q.id];
  var url = "https://www.google.com/maps/dir/?api=1&destination=" +
    encodeURIComponent(v && v.name ? v.name + ", Seattle WA" : q.addr);
  if (v && v.placeId) url += "&destination_place_id=" + encodeURIComponent(v.placeId);
  return url;
}

function render(results, idx) {
  if (!results.length) {
    var ways = loosenings(filters());
    out.innerHTML = '<div class="empty"><b>Nothing fits that exactly.</b>' +
      "<p>" + (ways.length
        ? "Relax one thing and there's plenty."
        : "Try a longer gap or a different mood.") + "</p>" +
      (ways.length ? '<div class="actions">' + ways.map(function (w, i) {
        return '<button class="again" type="button" data-loosen="' + i + '">' +
          esc(w.label) + "</button>";
      }).join("") + "</div>" : "") + "</div>";

    Array.prototype.forEach.call(out.querySelectorAll("[data-loosen]"), function (btn) {
      btn.addEventListener("click", function () {
        var w = ways[+btn.getAttribute("data-loosen")];
        for (var k in w.patch) {
          if (Object.prototype.hasOwnProperty.call(w.patch, k)) state[k] = w.patch[k];
        }
        syncForm(); save(); run();
      });
    });
    return;
  }

  var r = results[idx], q = r.quest, p = r.plan;
  var start = nowMinutes();
  var arrive = start + p.travel;
  var leave = arrive + p.stay;
  var back = leave + p.travel;

  // Say so rather than quietly handing over a different mood.
  var fallback = q.mood === state.mood
    ? ""
    : '<p class="fallback">Nothing ' + esc(state.mood) + " fits this gap from here" +
      (state.setting !== "either" ? " " + esc(state.setting) : "") +
      ", so here's the closest thing that does.</p>";

  var pct = function (m) { return (m / state.gap * 100).toFixed(2) + "%"; };
  var spare = Math.max(0, state.gap - p.total);

  var alts = results.slice(0, 6).filter(function (x, i) { return i !== idx; }).slice(0, 3);

  var num = QUEST_INDEX[q.id];

  out.innerHTML =
    '<div class="panel"><article class="result"><div class="panel-in">' +
      '<p class="idx"><span>no. ' + num + " / " + TOTAL + "</span>" +
        "<span>" + esc(q.area.toLowerCase()) + "</span></p>" +
      '<p class="tags"><i>' + esc(q.mood) + "</i><s>/</s>" +
        (p.mode === "walk" ? "on foot" : esc(p.mode)) +
        "<s>/</s>" + esc(hoursNote(q, currentNow().day)) + "</p>" +
      "<h2>" + esc(q.name) + "</h2>" +
      fallback +
      '<p class="blurb">' + esc(q.blurb) + "</p>" +

      '<div class="gap-bar" role="img" aria-label="' +
        p.travel + " minutes there, " + p.stay + " minutes at the quest, " +
        p.travel + " minutes back, " + spare + ' minutes spare">' +
        '<span class="walk" style="width:' + pct(p.travel) + '"></span>' +
        '<span class="stay" style="width:' + pct(p.stay) + '"></span>' +
        '<span class="walk" style="width:' + pct(p.travel) + '"></span>' +
        '<span class="spare" style="width:' + pct(spare) + '"></span>' +
      "</div>" +
      '<p class="clock"><span>leave <b>' + clockOf(start) + "</b></span>" +
        "<span>there " + clockOf(arrive) + "–" + clockOf(leave) + "</span>" +
        "<span>back <b>" + clockOf(back) + "</b>, " + spare + " to spare</span></p>" +

      '<div class="facts">' +
        '<div><span class="n">' + p.travel + ' min</span><span class="k">each way</span></div>' +
        '<div><span class="n">' + p.stay + ' min</span><span class="k">there</span></div>' +
        '<div><span class="n">' + esc(money(q.cost)) + '</span><span class="k">roughly</span></div>' +
        '<div><span class="n">' + (q.indoor ? "indoors" : "outdoors") + '</span><span class="k">' +
          (p.closes ? "until " + clockOf(p.closes) : "any time") + "</span></div>" +
      "</div>" +

      '<p class="tip"><b>Insider bit.</b> ' + esc(q.tip) + "</p>" +

      '<div class="actions">' +
        '<a class="go-maps" href="' + mapsUrl(q) + '" target="_blank" rel="noopener">Open in Maps</a>' +
        '<button class="again" type="button" id="reroll">Something else</button>' +
      "</div>" +

      '<details class="why"><summary>Why this one</summary><ul>' +
        r.why.map(function (w) {
          return "<li><span>" + esc(w[0]) + "</span><b>" + esc(w[1]) + "</b></li>";
        }).join("") +
        "<li><span>Out of " + results.length + " that fit right now</span><b>" + r.score + "</b></li>" +
      "</ul></details>" +
    "</div></article></div>" +
    (alts.length
      ? '<div class="alts"><p class="k">Also possible</p>' + alts.map(function (a, i) {
          return '<button class="alt" type="button" data-id="' + esc(a.quest.id) + '">' +
            '<span class="no">' + String(i + 1).padStart(2, "0") + "</span>" +
            '<span class="an">' + esc(a.quest.name) + "</span>" +
            '<span class="am">' + a.plan.total + " min, " + esc(money(a.quest.cost)) + "</span>" +
          "</button>";
        }).join("") + "</div>"
      : "");

  var rr = document.getElementById("reroll");
  if (rr) rr.addEventListener("click", function () {
    state.seed++;
    recent.push(q.id);
    if (recent.length > 8) recent.shift();
    run();
    out.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  Array.prototype.forEach.call(out.querySelectorAll(".alt"), function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-id");
      for (var i = 0; i < lastResults.length; i++) {
        if (lastResults[i].quest.id === id) {
          if (recent.indexOf(q.id) === -1) recent.push(q.id);
          render(lastResults, i);
          break;
        }
      }
      out.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

document.getElementById("form").addEventListener("submit", function (e) {
  e.preventDefault();
  resolveWhere(true);
  state.seed++;
  recent = [];
  run();
});
