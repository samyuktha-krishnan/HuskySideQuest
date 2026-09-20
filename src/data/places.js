// Gazetteer for the free-text location field. No geocoding API — the deployed
// page makes no outbound requests — so matching is local (src/lib/locate.js).
// Owner: dataset + recommendation logic.
//
// Coords are building centres, ±150m ≈ ±2 min. Fine for "can I get there and
// back", not for turn-by-turn.
//
// `aliases` = what people actually type: course codes (MGH, CSE2, HSB),
// nicknames, common misspellings.

export const PLACES = [
  // --- central campus ---
  { name: "Red Square", lat: 47.6558, lng: -122.3089, aliases: ["red square", "central plaza", "the square"] },
  { name: "Suzzallo Library", lat: 47.6557, lng: -122.3080, aliases: ["suzzallo", "suz", "suzallo", "suzzalo", "reading room"] },
  { name: "Allen Library", lat: 47.6560, lng: -122.3073, aliases: ["allen library", "allen"] },
  { name: "Odegaard Library", lat: 47.6566, lng: -122.3105, aliases: ["odegaard", "ode", "oug", "odegard", "ugl"] },
  { name: "Kane Hall", lat: 47.6563, lng: -122.3095, aliases: ["kane", "kne"] },
  { name: "Gerberding Hall", lat: 47.6553, lng: -122.3082, aliases: ["gerberding", "ger"] },
  { name: "Mary Gates Hall", lat: 47.6552, lng: -122.3070, aliases: ["mary gates", "mgh"] },
  { name: "Gowen Hall", lat: 47.6557, lng: -122.3068, aliases: ["gowen", "gwn"] },
  { name: "Savery Hall", lat: 47.6566, lng: -122.3072, aliases: ["savery", "sav"] },
  { name: "Smith Hall", lat: 47.6570, lng: -122.3076, aliases: ["smith", "smi"] },
  { name: "Raitt Hall", lat: 47.6573, lng: -122.3078, aliases: ["raitt", "rai"] },
  { name: "Miller Hall", lat: 47.6577, lng: -122.3072, aliases: ["miller", "mlr"] },
  { name: "Thomson Hall", lat: 47.6564, lng: -122.3063, aliases: ["thomson", "thompson hall", "thO"] },
  { name: "Communications Building", lat: 47.6566, lng: -122.3054, aliases: ["communications", "cmu", "comm"] },
  { name: "Art Building", lat: 47.6576, lng: -122.3059, aliases: ["art building", "art", "ceramic"] },
  { name: "Music Building", lat: 47.6583, lng: -122.3062, aliases: ["music building", "music", "mus"] },
  { name: "Meany Hall", lat: 47.6559, lng: -122.3105, aliases: ["meany", "mny"] },
  { name: "Parrington Hall", lat: 47.6577, lng: -122.3097, aliases: ["parrington", "par"] },
  { name: "Denny Hall", lat: 47.6588, lng: -122.3081, aliases: ["denny", "dEN"] },
  { name: "Lewis Hall", lat: 47.6585, lng: -122.3080, aliases: ["lewis hall"] },
  { name: "Clark Hall", lat: 47.6583, lng: -122.3075, aliases: ["clark hall"] },
  { name: "The Quad", lat: 47.6572, lng: -122.3070, aliases: ["the quad", "quad", "liberal arts quad", "cherry trees"] },
  { name: "Padelford Hall", lat: 47.6572, lng: -122.3040, aliases: ["padelford", "pdl"] },
  { name: "The HUB", lat: 47.6553, lng: -122.3050, aliases: ["hub", "husky union", "husky union building", "student union"] },

  // --- science and engineering ---
  { name: "Bagley Hall", lat: 47.6540, lng: -122.3086, aliases: ["bagley", "bag", "chemistry"] },
  { name: "Johnson Hall", lat: 47.6540, lng: -122.3094, aliases: ["johnson", "jhn", "geology"] },
  { name: "Guggenheim Hall", lat: 47.6541, lng: -122.3057, aliases: ["guggenheim", "gug", "aero"] },
  { name: "Paul G. Allen Center", lat: 47.6531, lng: -122.3048, aliases: ["allen center", "cse", "cse1", "paul allen", "computer science"] },
  { name: "Gates Center", lat: 47.6533, lng: -122.3055, aliases: ["gates center", "cse2", "bill gates hall"] },
  { name: "Electrical Engineering", lat: 47.6536, lng: -122.3053, aliases: ["ece", "eeb", "electrical engineering"] },
  { name: "Mechanical Engineering", lat: 47.6537, lng: -122.3062, aliases: ["meb", "mechanical engineering"] },
  { name: "More Hall", lat: 47.6536, lng: -122.3040, aliases: ["more hall", "mor", "civil engineering"] },
  { name: "Loew Hall", lat: 47.6541, lng: -122.3044, aliases: ["loew", "low hall"] },
  { name: "Sieg Hall", lat: 47.6538, lng: -122.3058, aliases: ["sieg", "sig"] },
  { name: "Benson Hall", lat: 47.6535, lng: -122.3050, aliases: ["benson", "bns"] },
  { name: "Roberts Hall", lat: 47.6535, lng: -122.3065, aliases: ["roberts", "rob"] },
  { name: "Mueller Hall", lat: 47.6538, lng: -122.3068, aliases: ["mueller", "mul"] },
  { name: "Fluke Hall", lat: 47.6545, lng: -122.3030, aliases: ["fluke", "flk"] },
  { name: "Physics/Astronomy Building", lat: 47.6600, lng: -122.3105, aliases: ["physics", "astronomy", "pab", "paa", "phys"] },
  { name: "Kincaid Hall", lat: 47.6524, lng: -122.3097, aliases: ["kincaid", "kin", "biology"] },
  { name: "Hitchcock Hall", lat: 47.6520, lng: -122.3105, aliases: ["hitchcock", "hck"] },
  { name: "Life Sciences Building", lat: 47.6518, lng: -122.3095, aliases: ["life sciences", "lsb"] },
  { name: "Winkenwerder Hall", lat: 47.6533, lng: -122.3072, aliases: ["winkenwerder", "wfs", "forestry"] },
  { name: "Anderson Hall", lat: 47.6531, lng: -122.3078, aliases: ["anderson hall", "and"] },
  { name: "Bloedel Hall", lat: 47.6529, lng: -122.3073, aliases: ["bloedel", "bld"] },

  // --- south campus and health sciences ---
  { name: "Health Sciences Building", lat: 47.6510, lng: -122.3085, aliases: ["health sciences", "hsb", "magnuson", "t wing", "hsc"] },
  { name: "UW Medical Center", lat: 47.6505, lng: -122.3075, aliases: ["uw medical", "uwmc", "the hospital", "medical center"] },
  { name: "South Campus Center", lat: 47.6503, lng: -122.3095, aliases: ["south campus center", "scc"] },
  { name: "Ocean Sciences Building", lat: 47.6525, lng: -122.3120, aliases: ["ocean sciences", "osb", "oceanography"] },
  { name: "Marine Sciences Building", lat: 47.6525, lng: -122.3128, aliases: ["marine sciences", "msb"] },
  { name: "Fishery Sciences Building", lat: 47.6522, lng: -122.3155, aliases: ["fishery sciences", "fsh", "fisheries"] },
  { name: "Husky Stadium", lat: 47.6500, lng: -122.3015, aliases: ["husky stadium", "the stadium", "football stadium"] },
  { name: "UW Light Rail Station", lat: 47.6497, lng: -122.3040, aliases: ["uw station", "husky stadium station", "the link", "light rail"] },
  { name: "Hec Edmundson Pavilion", lat: 47.6530, lng: -122.3010, aliases: ["hec ed", "pavilion", "alaska airlines arena"] },
  { name: "IMA", lat: 47.6534, lng: -122.3008, aliases: ["ima", "intramural", "the gym", "rec center"] },

  // --- west campus ---
  { name: "Gould Hall", lat: 47.6553, lng: -122.3132, aliases: ["gould", "gld", "architecture"] },
  { name: "Architecture Hall", lat: 47.6546, lng: -122.3120, aliases: ["architecture hall", "arc"] },
  { name: "Hutchinson Hall", lat: 47.6552, lng: -122.3125, aliases: ["hutchinson", "htc", "drama"] },
  { name: "Schmitz Hall", lat: 47.6561, lng: -122.3138, aliases: ["schmitz", "smz", "registrar", "financial aid"] },
  { name: "Condon Hall", lat: 47.6563, lng: -122.3160, aliases: ["condon", "cdh"] },
  { name: "Campus Parkway", lat: 47.6566, lng: -122.3155, aliases: ["campus parkway", "campus pkwy", "the bus stop"] },
  { name: "Alder Hall", lat: 47.6549, lng: -122.3160, aliases: ["alder", "alder hall"] },
  { name: "Elm Hall", lat: 47.6546, lng: -122.3163, aliases: ["elm", "elm hall"] },
  { name: "Lander Hall", lat: 47.6553, lng: -122.3168, aliases: ["lander"] },
  { name: "Maple Hall", lat: 47.6539, lng: -122.3165, aliases: ["maple", "maple hall"] },
  { name: "Poplar Hall", lat: 47.6539, lng: -122.3157, aliases: ["poplar"] },
  { name: "Terry Hall", lat: 47.6556, lng: -122.3145, aliases: ["terry", "terry hall"] },
  { name: "Mercer Court", lat: 47.6537, lng: -122.3176, aliases: ["mercer court", "mercer"] },
  { name: "Cedar Apartments", lat: 47.6558, lng: -122.3175, aliases: ["cedar apartments", "cedar"] },
  { name: "Stevens Court", lat: 47.6550, lng: -122.3180, aliases: ["stevens court"] },

  // --- north campus ---
  { name: "McMahon Hall", lat: 47.6603, lng: -122.3040, aliases: ["mcmahon", "mac mahon"] },
  { name: "Haggett Hall", lat: 47.6606, lng: -122.3050, aliases: ["haggett"] },
  { name: "Oak Hall", lat: 47.6603, lng: -122.3055, aliases: ["oak hall"] },
  { name: "Hansee Hall", lat: 47.6603, lng: -122.3085, aliases: ["hansee"] },
  { name: "Burke Museum", lat: 47.6605, lng: -122.3117, aliases: ["burke", "burke museum", "natural history"] },
  { name: "Henry Art Gallery", lat: 47.6573, lng: -122.3115, aliases: ["henry", "henry art", "the henry"] },
  { name: "Greek Row", lat: 47.6600, lng: -122.3060, aliases: ["greek row", "frat row", "17th ave"] },
  { name: "Foster School of Business", lat: 47.6593, lng: -122.3070, aliases: ["foster", "paccar", "paccar hall", "dempsey", "business school"] },

  // --- off campus ---
  { name: "The Ave at NE 45th", lat: 47.6613, lng: -122.3130, aliases: ["the ave", "ave", "university way", "45th"] },
  { name: "The Ave at NE 42nd", lat: 47.6578, lng: -122.3130, aliases: ["42nd", "lower ave", "ave and 42nd"] },
  { name: "U District Light Rail Station", lat: 47.6605, lng: -122.3137, aliases: ["u district station", "brooklyn station", "udistrict station"] },
  { name: "University Village", lat: 47.6626, lng: -122.2996, aliases: ["u village", "university village", "uvillage", "the village"] },
  { name: "Roosevelt Station", lat: 47.6762, lng: -122.3175, aliases: ["roosevelt station", "roosevelt"] },
  { name: "Ravenna", lat: 47.6700, lng: -122.3050, aliases: ["ravenna", "ravenna park"] },
  { name: "Wallingford", lat: 47.6613, lng: -122.3340, aliases: ["wallingford", "n 45th"] },
  { name: "Montlake", lat: 47.6440, lng: -122.3045, aliases: ["montlake", "montlake bridge"] },
  { name: "Portage Bay", lat: 47.6522, lng: -122.3160, aliases: ["portage bay", "boat street", "boat st"] },
];

// alias -> index, built once.
export const ALIAS_INDEX = (() => {
  const map = new Map();
  PLACES.forEach((p, i) => {
    map.set(p.name.toLowerCase(), i);
    for (const a of p.aliases) map.set(a.toLowerCase(), i);
  });
  return map;
})();
