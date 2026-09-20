// The curated dataset, checked by hand.
// Owner: dataset + recommendation logic.
//
// The UI depends on this shape — see CONTRACT in README before changing it.
//   id       stable slug, used by the "seen already" exclusion list
//   mood     one of productive | social | quiet | food | outdoors
//   tags     secondary moods, scored lower than a primary match
//   act      [shortest sensible visit, longest enjoyable visit] in minutes
//   cost     [low, high] in dollars for one person
//   indoor   true if the rain filter should keep it
//   openness hours profile: outdoor | campus | library | cafe | restaurant |
//            shop | museum | gym | evening | boathouse (see src/lib/hours.js)
//   hours    per-venue override, { open, close, note } in minutes from midnight
//   via      optional transit leg: { hub, ride, egress, mode }
//   delight  0-10, how good a story it makes. Tiebreak only.

/* Transit hubs used by the far-flung quests. */
export const HUB_UDIST   = { lat:47.6605, lng:-122.3137 };  // Link, U District
export const HUB_CAMPUSP = { lat:47.6566, lng:-122.3155 };  // Campus Pkwy bus bays
export const HUB_45TH    = { lat:47.6612, lng:-122.3134 };  // the 44 on NE 45th

/* Each quest: mood is the primary vibe, tags are the secondary ones.
   act = [shortest sensible visit, longest enjoyable visit] in minutes.
   cost = [low, high] in dollars for one person.
   delight = how much of a story it makes (0-10). */
export const QUESTS = [
/* ---- on campus, free, strange ---- */
{id:"suzzallo", name:"Read one chapter in the Suzzallo Reading Room", area:"Central campus",
 addr:"Suzzallo Library, University of Washington, Seattle WA",
 mood:"quiet", tags:["productive"], lat:47.6557, lng:-122.3080, indoor:true, openness:"library",
 cost:[0,0], act:[15,50], delight:9,
 blurb:"Sixty-five foot vaulted ceilings, stained glass, absolute silence. Bring anything to read and sit at one of the long oak tables like you're in a film about studying.",
 tip:"Sit on the north side in the afternoon — the window light is the whole point."},

{id:"sylvan", name:"Find the four columns in Sylvan Grove", area:"West campus edge",
 addr:"Sylvan Grove Theater, University of Washington, Seattle WA",
 mood:"quiet", tags:["outdoors"], lat:47.6542, lng:-122.3117, indoor:false, openness:"outdoor",
 cost:[0,0], act:[10,25], delight:8,
 blurb:"Four white columns from the University's original 1861 downtown building, hauled here and stood in a hidden grove of firs. Most students graduate without ever finding it.",
 tip:"They're named Loyalty, Industry, Faith and Efficiency. Yes, really."},

{id:"herb", name:"Walk the Medicinal Herb Garden", area:"Central campus",
 addr:"UW Medicinal Herb Garden, Seattle WA",
 mood:"outdoors", tags:["quiet"], lat:47.6531, lng:-122.3036, indoor:false, openness:"outdoor",
 cost:[0,0], act:[15,35], delight:7,
 blurb:"A working teaching garden from 1911, still growing things that are technically drugs. Read the little metal labels and feel briefly like a botanist.",
 tip:"Look for the two stone monkeys guarding the east entrance."},

{id:"drumheller", name:"Sit at Drumheller Fountain and check if the mountain is out", area:"Central campus",
 addr:"Drumheller Fountain, University of Washington, Seattle WA",
 mood:"outdoors", tags:["quiet","social"], lat:47.6531, lng:-122.3060, indoor:false, openness:"outdoor",
 cost:[0,0], act:[10,25], delight:6,
 blurb:"Rainier Vista points straight at the mountain on purpose. On a clear day it's the best free view on campus; on a grey day it's still a fountain you can sit by.",
 tip:"Stand at the north rim and line the fountain up with the Vista before you look up."},

{id:"henry", name:"See one room at the Henry Art Gallery", area:"North campus",
 addr:"Henry Art Gallery, 15th Ave NE & NE 41st St, Seattle WA",
 mood:"quiet", tags:["productive"], lat:47.6573, lng:-122.3115, indoor:true, openness:"museum",
 cost:[0,0], act:[22,70], delight:8,
 blurb:"Contemporary art, usually unsettling, usually excellent. Free with your Husky Card. Don't try to see all of it — pick one gallery and actually look.",
 tip:"The James Turrell Skyspace outside is free and open even when the galleries aren't."},

{id:"burke", name:"Go stare at the Burke Museum's fossils", area:"North campus",
 addr:"Burke Museum, 4300 15th Ave NE, Seattle WA",
 mood:"quiet", tags:["productive","social"], lat:47.6605, lng:-122.3117, indoor:true, openness:"museum",
 cost:[0,0], act:[35,95], delight:8,
 blurb:"Natural history and Northwest Native art, with glass-walled labs where you can watch people actually working on the collections.",
 tip:"Free with your Husky Card. The T. rex skull is real, and it's called Tufts-Love."},

{id:"grieg", name:"Have a quiet ten minutes in Grieg Garden", area:"Central campus",
 addr:"Grieg Garden, University of Washington, Seattle WA",
 mood:"quiet", tags:["outdoors"], lat:47.6558, lng:-122.3095, indoor:false, openness:"outdoor",
 cost:[0,0], act:[10,18], delight:6,
 blurb:"A sunken garden with a bust of a Norwegian composer in it, thirty seconds off Red Square and somehow always empty.",
 tip:"Best bench is the one facing away from the path."},

{id:"observatory", name:"Look through the Jacobsen Observatory telescope", area:"North campus",
 addr:"Theodor Jacobsen Observatory, University of Washington, Seattle WA",
 mood:"quiet", tags:["social","outdoors"], lat:47.6604, lng:-122.3093, indoor:true, openness:"evening",
 cost:[0,0], act:[30,50], delight:9,
 blurb:"An 1895 sandstone observatory with a brass refracting telescope, opened to the public on clear evenings by volunteer astronomers. Free.",
 tip:"Evenings only and weather-dependent — check the schedule before you walk over."},

{id:"hubgames", name:"Bowl two frames in the HUB basement", area:"Central campus",
 addr:"Husky Union Building, 4001 E Stevens Way NE, Seattle WA",
 mood:"social", tags:["productive"], lat:47.6553, lng:-122.3050, indoor:true, openness:"campus",
 cost:[4,12], act:[30,60], delight:7,
 blurb:"There are bowling lanes and pool tables under the HUB. Student rates. Almost nobody uses them at 2pm on a Tuesday.",
 tip:"Cheaper per game if you're not alone — text someone from your lecture."},

{id:"odegaard", name:"Claim a window seat on Odegaard's top floor", area:"Central campus",
 addr:"Odegaard Undergraduate Library, Seattle WA",
 mood:"productive", tags:["quiet"], lat:47.6566, lng:-122.3105, indoor:true, openness:"library",
 cost:[0,0], act:[22,110], delight:4,
 blurb:"Not romantic, but it's the highest-density-of-focus room within a two-minute walk of Red Square. Third floor, west windows, phone in your bag.",
 tip:"If it's full, the Allen Library reading rooms next door almost never are."},

{id:"blindshelf", name:"Pick a random shelf in Allen Library and read the first page", area:"Central campus",
 addr:"Allen Library, University of Washington, Seattle WA",
 mood:"quiet", tags:["productive"], lat:47.6560, lng:-122.3073, indoor:true, openness:"library",
 cost:[0,0], act:[14,40], delight:8,
 blurb:"Go into the stacks, pick a floor you've never been to, close your eyes, pull a book, read page one. You are allowed to hate it and put it back.",
 tip:"Floors 3 and 4 of Allen South are where the genuinely strange things live."},

{id:"fill", name:"Bird-watch the Union Bay Natural Area", area:"East of campus",
 addr:"Union Bay Natural Area, 3501 NE 41st St, Seattle WA",
 mood:"outdoors", tags:["quiet"], lat:47.6575, lng:-122.2900, indoor:false, openness:"outdoor",
 cost:[0,0], act:[35,80], delight:8,
 blurb:"Locals call it the Montlake Fill. It's a capped landfill turned wetland and it's one of the best birding spots in the city, with the lake on three sides.",
 tip:"Wear shoes you don't mind ruining. It is a swamp with ambitions."},

{id:"canoe", name:"Rent a canoe at the Waterfront Activities Center", area:"South campus",
 addr:"UW Waterfront Activities Center, 3710 Montlake Blvd NE, Seattle WA",
 mood:"outdoors", tags:["social"], lat:47.6492, lng:-122.2978, indoor:false, openness:"boathouse",
 cost:[14,22], act:[60,110], delight:10,
 blurb:"Cheap hourly canoe rental behind Husky Stadium, and you paddle straight into the Arboretum lily pads. The single best thing on this list.",
 tip:"Seasonal and daylight-only — bring your Husky Card for the student rate."},

{id:"burkegilman", name:"Walk the Burke-Gilman out to Sakuma Viewpoint and back", area:"South campus",
 addr:"Burke-Gilman Trail, University of Washington, Seattle WA",
 mood:"outdoors", tags:["quiet"], lat:47.6512, lng:-122.3047, indoor:false, openness:"outdoor",
 cost:[0,0], act:[25,60], delight:5,
 blurb:"Flat, paved, water on one side. Go out until it stops being interesting, then turn around. Watch for cyclists who will not slow down for you.",
 tip:"Sakuma Viewpoint looks over Portage Bay and is a good place to take a phone call."},

{id:"obelisk", name:"Work out what the Broken Obelisk in Red Square is for", area:"Central campus",
 addr:"Broken Obelisk, Red Square, University of Washington, Seattle WA",
 mood:"quiet", tags:["outdoors","productive"], lat:47.6559, lng:-122.3093, indoor:false, openness:"outdoor",
 cost:[0,0], act:[10,16], delight:6,
 blurb:"A five-storey rust-coloured Barnett Newman sculpture balanced point-to-point that you have walked past two hundred times without reading the plaque.",
 tip:"Then go stand on the grate between the two brick pyramids and look straight up."},

{id:"farm", name:"Visit the UW Farm at Mercer Court", area:"West campus",
 addr:"UW Farm, Mercer Court, Seattle WA",
 mood:"outdoors", tags:["quiet","productive"], lat:47.6538, lng:-122.3175, indoor:false, openness:"outdoor",
 cost:[0,0], act:[20,45], delight:7,
 blurb:"A real student-run farm in the middle of the dorms, growing food for campus dining. Rows of chard where you'd expect a parking lot.",
 tip:"They run drop-in work parties most weeks if you want dirt under your fingernails."},

{id:"ima", name:"Drop in at the IMA for one honest hour", area:"South campus",
 addr:"Intramural Activities Building, 3501 NE Belvoir Pl, Seattle WA",
 mood:"social", tags:["productive","outdoors"], lat:47.6534, lng:-122.3008, indoor:true, openness:"gym",
 cost:[0,0], act:[35,110], delight:5,
 blurb:"Already paid for in your fees. Courts, climbing wall, pool, treadmills with a view of the lake. The hardest part is the walk over, and you're already doing that.",
 tip:"Bring your Husky Card or you're not getting through the turnstile."},

{id:"kane", name:"Sit in on a lecture you're not taking", area:"Central campus",
 addr:"Kane Hall, University of Washington, Seattle WA",
 mood:"productive", tags:["social","quiet"], lat:47.6563, lng:-122.3095, indoor:true, openness:"campus",
 cost:[0,0], act:[15,45], delight:9,
 blurb:"Walk into one of Kane's big lecture halls, sit at the back, and learn twenty minutes of something you will never be examined on.",
 tip:"Large halls only, arrive with the crowd, don't take the seat someone needs. Oceanography and astronomy lectures are the reliably good ones."},

{id:"denny", name:"Walk through Denny Hall, the oldest building on campus", area:"North campus",
 addr:"Denny Hall, University of Washington, Seattle WA",
 mood:"quiet", tags:["productive","outdoors"], lat:47.6588, lng:-122.3081, indoor:true, openness:"campus",
 cost:[0,0], act:[10,25], delight:7,
 blurb:"Built in 1895, when the whole university was this one building and a field. Renovated, still creaky, with a bell tower and stairs worn into curves.",
 tip:"Go up to the top floor. The corridor windows look out over the north campus trees."},

{id:"gould", name:"Stand in the Gould Hall atrium and look up", area:"West campus",
 addr:"Gould Hall, 3950 University Way NE, Seattle WA",
 mood:"quiet", tags:["productive"], lat:47.6553, lng:-122.3132, indoor:true, openness:"campus",
 cost:[0,0], act:[10,25], delight:7,
 blurb:"The architecture building is a concrete cathedral of open studio balconies stacked around a courtyard. Models, drawings, and students who have clearly not slept.",
 tip:"The pinned-up studio work on the upper levels is free and better than most galleries."},

{id:"hublounge", name:"Take the HUB lounge with your phone in your bag", area:"Central campus",
 addr:"Husky Union Building, 4001 E Stevens Way NE, Seattle WA",
 mood:"social", tags:["quiet"], lat:47.6553, lng:-122.3050, indoor:true, openness:"campus",
 cost:[0,0], act:[15,40], delight:5,
 blurb:"Big armchairs, tall windows, a fireplace, and the entire university walking past you. Free, dry, and two minutes from almost everywhere.",
 tip:"The upstairs lounges are much quieter than the ground floor food court."},

{id:"hsl", name:"Take a table in the Health Sciences Library", area:"South campus",
 addr:"Health Sciences Library, 1959 NE Pacific St, Seattle WA",
 mood:"productive", tags:["quiet"], lat:47.6509, lng:-122.3082, indoor:true, openness:"library",
 cost:[0,0], act:[15,100], delight:5,
 blurb:"Open to every UW student, not just the medics, and almost nobody outside the health schools knows that. Deep silence and a shortage of people fighting you for a seat.",
 tip:"South campus's best-kept quiet room, and it's three minutes from the hospital cafés."},

{id:"uwstation", name:"Look at the glass wall inside UW light rail station", area:"Husky Stadium",
 addr:"University of Washington Station, 3720 Montlake Blvd NE, Seattle WA",
 mood:"quiet", tags:["productive","social"], lat:47.6497, lng:-122.3040, indoor:true, openness:"shop", hours:{ open:5*60, close:24*60, note:"train hours" },
 cost:[0,0], act:[10,22], delight:8,
 blurb:"The station is a 100-foot concrete box with a wall of coloured glass panels running its full depth, lit so it changes as you ride the escalator down. Free, dry, and almost nobody stops to look.",
 tip:"Ride the escalator down slowly and look left. You don't have to tap in to see it."},

{id:"writingcenter", name:"Take something you're stuck on to the Odegaard Writing Center", area:"Central campus",
 addr:"Odegaard Writing and Research Center, Odegaard Library, Seattle WA",
 mood:"productive", tags:["quiet"], lat:47.6566, lng:-122.3103, indoor:true, openness:"campus",
 cost:[0,0], act:[30,60], delight:6,
 blurb:"Free one-on-one help with any writing at any stage, including the stage where it's three bullet points and a bad feeling. You've already paid for this.",
 tip:"Drop-ins exist but appointments go fast — book on the way over."},

{id:"studyroom", name:"Book a group study room and use it entirely alone", area:"Central campus",
 addr:"Suzzallo Library, University of Washington, Seattle WA",
 mood:"productive", tags:["quiet"], lat:47.6557, lng:-122.3078, indoor:true, openness:"campus",
 cost:[0,0], act:[25,110], delight:7,
 blurb:"Whiteboard, door that closes, a screen you can plug into, no one watching your screen. Reserve it for one person and stand at the whiteboard like a lunatic.",
 tip:"Book it from your phone while you walk. Same-day slots open up constantly."},

{id:"avewalk", name:"Walk the Ave end to end, 42nd to 50th", area:"The Ave",
 addr:"University Way NE, Seattle WA",
 mood:"outdoors", tags:["social"], lat:47.6595, lng:-122.3130, indoor:false, openness:"outdoor",
 cost:[0,0], act:[15,30], delight:6,
 blurb:"Eight blocks of bubble tea, barbers, board game shops and at least one thing that has changed hands since you last looked up. Walk it without going into anything.",
 tip:"The cross streets are where the odd shops hide. Look down 42nd and 45th as you pass."},

{id:"dennyfield", name:"Lie down on Denny Field", area:"North campus",
 addr:"Denny Field, University of Washington, Seattle WA",
 mood:"outdoors", tags:["social","quiet"], lat:47.6597, lng:-122.3060, indoor:false, openness:"outdoor",
 cost:[0,0], act:[10,30], delight:5,
 blurb:"The open field on north campus where the stadium used to be, ringed by trees. Intramural games in the evening, completely empty in the middle of a weekday.",
 tip:"The north edge gets the last sun of the day. Useful in February."},

/* ---- food and coffee ---- */
{id:"allegro", name:"Find Cafe Allegro down the alley", area:"The Ave",
 addr:"Cafe Allegro, 4214 University Way NE, Seattle WA",
 mood:"food", tags:["quiet","productive"], lat:47.6577, lng:-122.3126, indoor:true, openness:"cafe",
 cost:[4,9], act:[25,55], delight:9,
 blurb:"Seattle's oldest espresso bar, hidden in an alley behind a newsstand since 1975. Dark wood, no music, people writing dissertations.",
 tip:"The entrance is genuinely an unmarked alley door off NE 42nd. That's not a mistake."},

{id:"bulldog", name:"Read a magazine you'd never buy at Bulldog News", area:"The Ave",
 addr:"Bulldog News, 4208 University Way NE, Seattle WA",
 mood:"food", tags:["quiet"], lat:47.6578, lng:-122.3130, indoor:true, openness:"cafe",
 cost:[3,12], act:[20,45], delight:7,
 blurb:"A wall of international magazines and an espresso counter. Buy a coffee, take something about Japanese architecture or Norwegian fishing to a stool.",
 tip:"They'll let you browse for a long time if you've bought a drink. Buy the drink."},

{id:"thanbros", name:"Get pho and a free cream puff at Than Brothers", area:"The Ave",
 addr:"Than Brothers Pho, 4207 University Way NE, Seattle WA",
 mood:"food", tags:[], lat:47.6578, lng:-122.3128, indoor:true, openness:"restaurant",
 cost:[11,17], act:[30,45], delight:8,
 blurb:"Every bowl of pho comes with a complimentary cream puff, which arrives first and makes no sense and is correct.",
 tip:"Small is enormous. Order the small."},

{id:"thaitom", name:"Sit at the counter at Thai Tom and watch the wok", area:"The Ave",
 addr:"Thai Tom, 4543 University Way NE, Seattle WA",
 mood:"food", tags:["social"], lat:47.6614, lng:-122.3130, indoor:true, openness:"restaurant",
 cost:[12,18], act:[30,55], delight:8,
 blurb:"Tiny, loud, one cook, flames a foot high, a line out the door at peak. The counter seats are the show.",
 tip:"Go at an odd hour or you'll spend your whole gap in the queue. Heat levels are not a bluff."},

{id:"udon", name:"Build your own bowl at U:Don", area:"The Ave",
 addr:"U:Don Fresh Japanese Noodle Station, 4515 University Way NE, Seattle WA",
 mood:"food", tags:[], lat:47.6610, lng:-122.3131, indoor:true, openness:"restaurant",
 cost:[10,16], act:[25,40], delight:7,
 blurb:"Noodles cut in front of you, then you walk down a line adding tempura like it's a cafeteria designed by someone who loves you.",
 tip:"Fastest sit-down meal on the Ave when you're on a 45-minute clock."},

{id:"aladdin", name:"Get a gyro from Aladdin and eat it walking", area:"The Ave",
 addr:"Aladdin Gyro-cery, 4139 University Way NE, Seattle WA",
 mood:"food", tags:["outdoors"], lat:47.6572, lng:-122.3128, indoor:true, openness:"restaurant",
 cost:[9,14], act:[20,35], delight:7,
 blurb:"Enormous, cheap, wrapped in foil, engineered for exactly this situation. Eat it on the walk back and you've spent nothing but calories.",
 tip:"Ask for extra sauce; it comes in a cup and changes everything."},

{id:"solstice", name:"Set up at Cafe Solstice for a real work block", area:"The Ave",
 addr:"Cafe Solstice, 4116 University Way NE, Seattle WA",
 mood:"productive", tags:["food","quiet"], lat:47.6568, lng:-122.3132, indoor:true, openness:"cafe",
 cost:[4,10], act:[45,110], delight:6,
 blurb:"Big room, big tables, everyone silently working. The default U District study café for a reason.",
 tip:"Outlets cluster along the walls. Arrive before 3pm if you want one."},

{id:"suzzespresso", name:"Take an espresso up to the Suzzallo mezzanine", area:"Central campus",
 addr:"Suzzallo Library, University of Washington, Seattle WA",
 mood:"food", tags:["productive","quiet"], lat:47.6556, lng:-122.3083, indoor:true, openness:"cafe",
 cost:[3,7], act:[20,45], delight:6,
 blurb:"There's an espresso counter on Suzzallo's ground floor. Ninety seconds from Red Square, and you get the cathedral upstairs as a reading room.",
 tip:"Drinks aren't allowed in the Reading Room itself — finish it on the mezzanine."},

{id:"portagebay", name:"Eat a proper breakfast at Portage Bay Cafe", area:"Roosevelt",
 addr:"Portage Bay Cafe, 4130 Roosevelt Way NE, Seattle WA",
 mood:"food", tags:["social"], lat:47.6572, lng:-122.3175, indoor:true, openness:"shop", hours:{ open:8*60, close:15*60, note:"breakfast and lunch only" },
 cost:[18,30], act:[45,80], delight:8,
 blurb:"The famous toppings bar: your pancakes come plain and you go load them with berries and cream yourself. Expensive, enormous, worth it once a quarter.",
 tip:"Weekend waits are brutal. A weekday gap is the correct time to do this."},

{id:"aguaverde", name:"Eat tacos over the water at Agua Verde", area:"Portage Bay",
 addr:"Agua Verde Cafe, 1303 NE Boat St, Seattle WA",
 mood:"food", tags:["outdoors","social"], lat:47.6522, lng:-122.3160, indoor:true, openness:"restaurant",
 cost:[14,24], act:[40,75], delight:9,
 blurb:"Mexican food on a deck over Portage Bay with kayaks below you. The most vacation you can feel while still technically being on campus.",
 tip:"Sit outside even when it's grey. That's the entire point of the place."},

{id:"mollymoon", name:"Get a scoop at Molly Moon's in U Village", area:"U Village",
 addr:"Molly Moon's Homemade Ice Cream, U Village, Seattle WA",
 mood:"food", tags:["social"], lat:47.6626, lng:-122.2996, indoor:true, openness:"shop", hours:{ open:12*60, close:22*60, note:"open late" },
 cost:[6,11], act:[25,50], delight:7,
 blurb:"Salted caramel, honey lavender, and a line of people who all made the same decision you did. U Village is an odd, tidy little world worth twenty minutes.",
 tip:"They'll give you a taste spoon of anything. Use that power responsibly."},

{id:"dicks", name:"Walk to Dick's in Wallingford for a Deluxe", area:"Wallingford",
 addr:"Dick's Drive-In, 111 NE 45th St, Seattle WA",
 mood:"food", tags:["social","outdoors"], lat:47.6612, lng:-122.3260, indoor:false, openness:"shop", hours:{ open:10*60+30, close:24*60, note:"open very late" },
 cost:[6,13], act:[25,45], delight:8,
 via:{hub:HUB_45TH, ride:7, egress:2, mode:"the 44 bus"},
 blurb:"A Seattle institution since 1954 with no indoor seating, no wifi and a menu of six things. You eat standing at a counter outside in the rain like a local.",
 tip:"Cash-friendly, fast, and the fries are hand-cut. Deluxe, fries, shake — don't overthink it."},

/* ---- shops, books, weird retail ---- */
{id:"magus", name:"Get lost in Magus Books", area:"The Ave",
 addr:"Magus Books, 1408 NE 42nd St, Seattle WA",
 mood:"quiet", tags:["productive"], lat:47.6579, lng:-122.3129, indoor:true, openness:"shop",
 cost:[0,18], act:[25,50], delight:9,
 blurb:"A proper cramped used bookshop half a block off the Ave, floor to ceiling, slightly dusty, run by people who know where everything is.",
 tip:"Cheap paperback philosophy and sci-fi are the strengths. Bring a little cash."},

{id:"scarecrow", name:"Browse the impossible shelves at Scarecrow Video", area:"Roosevelt",
 addr:"Scarecrow Video, 5030 Roosevelt Way NE, Seattle WA",
 mood:"quiet", tags:["social","productive"], lat:47.6661, lng:-122.3175, indoor:true, openness:"shop", hours:{ open:11*60, close:22*60, note:"open late" },
 cost:[0,6], act:[30,65], delight:10,
 blurb:"A nonprofit archive of roughly 145,000 films, including thousands that exist nowhere else and stream nowhere at all. Browsing is free and faintly overwhelming.",
 tip:"Ask a staff member for a recommendation by mood. It's what they're there for."},

{id:"gargoyles", name:"Visit Gargoyles Statuary", area:"The Ave",
 addr:"Gargoyles Statuary, 4550 University Way NE, Seattle WA",
 mood:"quiet", tags:["social"], lat:47.6615, lng:-122.3134, indoor:true, openness:"shop",
 cost:[0,20], act:[15,35], delight:9,
 blurb:"A shop on the Ave selling gothic statuary, gargoyles and general cathedral wreckage. Free to wander, extremely free to buy nothing.",
 tip:"Check the hours before you walk up — it keeps its own schedule."},

{id:"buffalo", name:"Try on one ridiculous thing at Buffalo Exchange", area:"The Ave",
 addr:"Buffalo Exchange, 4530 University Way NE, Seattle WA",
 mood:"social", tags:["quiet"], lat:47.6613, lng:-122.3133, indoor:true, openness:"shop",
 cost:[0,28], act:[25,50], delight:6,
 blurb:"Secondhand, well-sorted, heavy on things other students got bored of. The rule for this quest is you must try on one item you would never buy.",
 tip:"They buy clothes too — bring a bag next time and fund the next quest."},

{id:"mcphee", name:"Go to Archie McPhee and buy something stupid", area:"Wallingford",
 addr:"Archie McPhee, 1300 N 45th St, Seattle WA",
 mood:"social", tags:["quiet"], lat:47.6613, lng:-122.3382, indoor:true, openness:"shop",
 cost:[0,15], act:[30,55], delight:10,
 via:{hub:HUB_45TH, ride:11, egress:2, mode:"the 44 bus"},
 blurb:"A novelty shop of genuine international renown: rubber chickens, horse-head masks, tinned unicorn meat. There is a bacon-flavoured section.",
 tip:"There's a free rubber chicken museum in the back. This sentence is not a joke."},

{id:"halfprice", name:"Dig through Half Price Books on Roosevelt", area:"Roosevelt",
 addr:"Half Price Books, 4709 Roosevelt Way NE, Seattle WA",
 mood:"quiet", tags:["productive"], lat:47.6633, lng:-122.3173, indoor:true, openness:"shop",
 cost:[0,16], act:[30,55], delight:6,
 blurb:"Big, bright, well-organised, and the clearance section is where textbooks go to become three dollars.",
 tip:"Check the clearance shelves first — they're by the back wall and they turn over fast."},

{id:"ubookstore", name:"Go to the top floor of the University Book Store", area:"The Ave",
 addr:"University Book Store, 4326 University Way NE, Seattle WA",
 mood:"quiet", tags:["productive"], lat:47.6592, lng:-122.3131, indoor:true, openness:"shop",
 cost:[0,20], act:[20,45], delight:5,
 blurb:"Everyone goes for course texts and leaves. Upstairs there's a general bookshop, a pen counter, and a window seat nobody uses.",
 tip:"Staff picks shelves here are unusually good and unusually ignored."},

{id:"elliottbay", name:"Take the Link to Elliott Bay Book Company", area:"Capitol Hill",
 addr:"Elliott Bay Book Company, 1521 10th Ave, Seattle WA",
 mood:"quiet", tags:["productive"], lat:47.6142, lng:-122.3200, indoor:true, openness:"shop", hours:{ open:10*60, close:22*60, note:"open late" },
 cost:[0,25], act:[40,70], delight:9,
 via:{hub:HUB_UDIST, ride:8, egress:5, mode:"the Link"},
 blurb:"Cedar shelves, a skylit main room and handwritten staff notes on half the books. Six minutes of light rail and you're in a different neighbourhood entirely.",
 tip:"Their fiction staff notes are worth reading even if you buy nothing."},

/* ---- out in the city ---- */
{id:"ravenna", name:"Walk the ravine in Ravenna Park", area:"Ravenna",
 addr:"Ravenna Park, 5520 Ravenna Ave NE, Seattle WA",
 mood:"outdoors", tags:["quiet"], lat:47.6717, lng:-122.3030, indoor:false, openness:"outdoor",
 cost:[0,0], act:[35,65], delight:9,
 blurb:"A deep wooded gorge with a creek at the bottom, twenty minutes from Red Square. Descend the trail and the city noise just stops.",
 tip:"Enter at Cowen Park and walk east down the ravine — the descent is gentler that way."},

{id:"cowen", name:"Take a lap of Cowen Park", area:"Ravenna",
 addr:"Cowen Park, 5849 15th Ave NE, Seattle WA",
 mood:"outdoors", tags:["quiet"], lat:47.6684, lng:-122.3103, indoor:false, openness:"outdoor",
 cost:[0,0], act:[20,35], delight:5,
 blurb:"The small, friendly end of the Ravenna ravine. Big trees, a bridge, dogs. Enough nature to reset a bad seminar.",
 tip:"If you've got more time, keep walking east and it becomes Ravenna Park."},

{id:"gasworks", name:"Climb the sundial hill at Gas Works Park", area:"Wallingford",
 addr:"Gas Works Park, 2101 N Northlake Way, Seattle WA",
 mood:"outdoors", tags:["social","quiet"], lat:47.6456, lng:-122.3344, indoor:false, openness:"outdoor",
 cost:[0,0], act:[40,75], delight:9,
 via:{hub:HUB_CAMPUSP, ride:14, egress:6, mode:"a bus down Stone Way"},
 blurb:"Rusting 1906 gasification towers left standing in a park, with the whole downtown skyline across the water from the top of the hill.",
 tip:"The sundial at the summit uses your own shadow to tell the time. Stand on today's date."},

{id:"troll", name:"Shake hands with the Fremont Troll", area:"Fremont",
 addr:"Fremont Troll, N 36th St, Seattle WA",
 mood:"outdoors", tags:["social"], lat:47.6510, lng:-122.3475, indoor:false, openness:"outdoor",
 cost:[0,0], act:[20,40], delight:9,
 via:{hub:HUB_CAMPUSP, ride:16, egress:5, mode:"the 31 or 32 bus"},
 blurb:"An eighteen-foot concrete troll crushing a real Volkswagen Beetle under a bridge. Climb it. Everyone climbs it.",
 tip:"Fremont's centre is five minutes downhill if your gap can take it."},

{id:"greenlake", name:"Do a lap of Green Lake", area:"Green Lake",
 addr:"Green Lake Park, Seattle WA",
 mood:"outdoors", tags:["social"], lat:47.6806, lng:-122.3277, indoor:false, openness:"outdoor",
 cost:[0,0], act:[55,80], delight:8,
 via:{hub:HUB_UDIST, ride:5, egress:12, mode:"the Link to Roosevelt"},
 blurb:"A flat 2.8-mile loop around the water, permanently full of runners, dogs and people on strange wheeled devices. Hard to feel bad doing it.",
 tip:"The inner path is for walking, the outer for wheels. People are serious about this."},

{id:"arboretum", name:"Cross the floating trail to Foster Island", area:"Arboretum",
 addr:"Washington Park Arboretum, 2300 Arboretum Dr E, Seattle WA",
 mood:"outdoors", tags:["quiet"], lat:47.6400, lng:-122.2950, indoor:false, openness:"outdoor",
 cost:[0,0], act:[45,85], delight:9,
 blurb:"A waterfront trail on floating boardwalks through marsh and lily pads, with herons and the freeway humming overhead. Genuinely strange and beautiful.",
 tip:"Start from the Museum of History and Industry end and walk south into the Arboretum."},

{id:"montlake", name:"Watch a boat go through the Montlake Cut", area:"Montlake",
 addr:"Montlake Bridge, Seattle WA",
 mood:"outdoors", tags:["quiet"], lat:47.6473, lng:-122.3045, indoor:false, openness:"outdoor",
 cost:[0,0], act:[20,40], delight:7,
 blurb:"A hand-dug canal connecting two lakes, with a 1925 drawbridge that opens on demand. Stand on the south bank and wait for the bells.",
 tip:"The bridge opens for any tall enough boat. Traffic hates it; you have nowhere to be."},

/* ---- pure challenges ---- */
{id:"under10", name:"The Ave under-ten challenge", area:"The Ave",
 addr:"University Way NE, Seattle WA",
 mood:"food", tags:["social","outdoors"], lat:47.6595, lng:-122.3130, indoor:false, openness:"restaurant",
 cost:[7,10], act:[30,50], delight:8,
 blurb:"Walk the Ave from 42nd to 50th and eat the best meal you can build for under ten dollars. You're allowed exactly two stops.",
 tip:"The optimal play involves one savoury stop and one thing sweet you weren't planning on."},

{id:"quadphoto", name:"Photograph the Quad from a spot you've never stood in", area:"Central campus",
 addr:"Liberal Arts Quadrangle, University of Washington, Seattle WA",
 mood:"outdoors", tags:["quiet"], lat:47.6572, lng:-122.3070, indoor:false, openness:"outdoor",
 cost:[0,0], act:[15,30], delight:7,
 blurb:"Thirty Yoshino cherry trees planted in 1962. In late March it's unbearable; the rest of the year it's a Gothic courtyard nobody photographs properly.",
 tip:"Go up the steps at the south end and shoot back through the arches instead of at the trees."},

{id:"onestop", name:"Ride the Link one stop and walk back", area:"U District",
 addr:"U District Station, Brooklyn Ave NE, Seattle WA",
 mood:"social", tags:["outdoors","quiet"], lat:47.6605, lng:-122.3137, indoor:false, openness:"outdoor",
 cost:[0,3], act:[35,60], delight:8,
 blurb:"Take the train one stop to Roosevelt, get out, and walk back through a neighbourhood you've only ever passed through underground.",
 tip:"Roosevelt has a good record shop and a bakery on the way back. Tap your card properly."}
];
