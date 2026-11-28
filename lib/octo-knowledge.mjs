/**
 * Curated, bundled game-guide answers. No runtime imports or remote services.
 * Facts checked against the user's local game sources on 2026-11-15:
 * sites/croba-planet/README.md
 * sites/rain-and-copper/README.md, dist/crafting.js, dist/backpack.js
 * sites/wooden-room/README.md, dist/creature-catalog.js, dist/duel.js
 * sites/tri-arena/README.md, dist/main.js
 * Mosswake Creek updated: copper-rain/README.md, dist/app.js and dist/watch.js (2026-11-21).
 * Croba update: immutable e8181e1950f75626ef8b3d79e0c9de263369fad9, including day-night-cycle and mobile-hud docs/modules (2026-11-25).
 * Blackroot Vale: README.md, dist/app.mjs, village-patrol.mjs, save-game.mjs, orc-meals.mjs and woodland-resident.mjs (2026-11-23).
 * Pond: frozen orbit-bloom bc82a9d README.md and dist/play/app.mjs, model.mjs, animal-model.mjs, lineage.mjs, scenes.mjs, slot-store.mjs, population-history.mjs and species-calls.mjs (2026-11-25).
 * These entries advise the visitor; they never inspect or control a live game.
 */
export const OCTO_KNOWLEDGE = Object.freeze([
  // Croba: expedition, swimming, wildlife, equipment and local saves.
  {
    id: 'croba-day-night', game: 'croba',
    question: 'How do Croba local time and its saved day and night cycle work?',
    keywords: ['day night cycle', 'day and night', '24 minute day', 'local time', 'day number', 'clock', 'sunrise', 'sunset', 'moonlight', 'time of day', 'paused time'],
    answer: 'A complete Croba day lasts 24 real minutes of active simulation: one simulation second advances one local minute. New expeditions begin at 08:00 on Day 1, and the day number changes at midnight. Sunrise is 05:00–07:00, day 07:00–17:00, sunset 17:00–19:00 and night otherwise, with smoothly changing light. The HUD shows local time and day. Menus, pause, hidden tabs and the opening cinematic freeze the cycle. Expedition saves preserve the same clock and lighting; loading adds no offline time. Water and underwater light darken at night, while the suit lamp remains available.',
  },
  {
    id: 'croba-phone-hud', game: 'croba',
    question: 'Where are Croba phone status, Tools, quick slots and movement stick?',
    keywords: ['phone hud', 'mobile hud', 'phone', 'mobile', 'tools drawer', 'compact status', 'full status', 'five quick slots', 'slot drawer', 'movement stick', 'joystick', 'phone map', 'smaller held supplies', 'held item size'],
    answer: 'On phones, tap ＋ to expand the compact status strip. Tools opens sound, guide, backpack, crafting, building, saves, bestiary and Map. Tap ⋯ beside the selected quick slot to reveal all five slots; selecting one closes the strip. Use the left movement stick and drag the world with your right thumb to look. The equipped-item USE activates the selected slot; JUMP / UP rises and DIVE descends. Most held supplies use a smaller, lower camera pose on phones; the physical copper yo-yo keeps its grip and string alignment. Tapping outside or opening another menu closes the expanded status.',
  },
  {
    id: 'croba-cliff-climb', game: 'croba',
    question: 'How do I climb the orange coastal ledges?',
    keywords: ['orange coastal cliffs', 'orange cliff', 'coastal ledges', 'climbing ledges', 'climb cliffs', 'crest lookout', 'cliff climb', 'waterline ledges'],
    answer: 'Follow the jagged orange coastal ledges from the waterline to a crest lookout. Use normal WASD movement and Space to jump; short entry ledges climb automatically as you leave the water. C or Shift still dives. Expedition saves keep your mid-climb position. Leave enough oxygen for the water approach and return swim.',
  },
  {
    id: 'croba-jellyfish-spires', game: 'croba',
    question: 'Where are Jellyfish Spires and how deep is the new basin?',
    keywords: ['jellyfish spires', 'spires basin', 'volcanic basin', '154 metres', '154 meters', 'deep stone spires', 'charcoal gravel', 'lantern jellies', 'marine gardens', 'crobon moss', 'new ocean biome'],
    answer: 'Jellyfish Spires extends the eastern Blue Ocean. Follow its gentler descending floor into a volcanic basin reaching 154 metres, with fractured stone spires, charcoal gravel, drifting jellies, blue-and-plum marine gardens and purple Crobon moss. The sector map and HUD identify the biome. Use Space to ascend and C or Shift to descend, and leave enough oxygen for the return swim. The dive lamp lights nearby terrain and wildlife.',
  },
  {
    id: 'croba-submarine', game: 'croba',
    question: 'Can I explore the broken submarine in Croba Planet?',
    keywords: ['broken submarine', 'alien submarine', 'submarine wreck', 'submarine interior', 'submarine breach', 'swim through submarine'],
    answer: 'Croba now includes a broken alien submarine with an overgrown, swimmable interior. Explore its hull and breaches using the normal swimming controls: Space ascends, and C or Shift descends. Watch your oxygen and use the dive lamp to see the wreck. Named expedition saves keep your position and normal expedition progress.',
  },
  {
    id: 'croba-oxygen', game: 'croba',
    question: 'How do I refill oxygen and avoid drowning?',
    keywords: ['oxygen', 'air', 'refill oxygen', 'drowning', 'breathing', 'tank', 'surface', 'swim up', 'deep dive'],
    answer: 'Swim to the surface to refill oxygen. Hold Space to ascend, and C or Shift to dive. A full tank lasts 100 seconds in Arctic water, or 500 seconds in the blue ocean’s automatic deep-dive mode. Leave enough air for the ascent; if oxygen runs out, the rescue tether returns you to the wreck.',
  },
  {
    id: 'croba-warmth', game: 'croba',
    question: 'How do I warm up and repair my suit?',
    keywords: ['warmth', 'cold', 'freezing', 'heat beacon', 'repair suit', 'integrity', 'heal', 'warm up'],
    answer: 'Return to the crash site or a heat beacon to restore suit warmth and integrity. Dry air in Violet Spruce Forest gradually restores warmth too. Oxygen refills at the water surface. If suit integrity reaches zero, your rescue tether returns you to the wreck and preserves your discoveries.',
  },
  {
    id: 'croba-forest-route', game: 'croba',
    question: 'How do I reach Violet Spruce Forest?',
    keywords: ['violet spruce forest', 'forest', 'woodland', 'purple trees', 'low beach', 'cliffs', 'southeast', 'shore'],
    answer: 'Follow the ice and ocean coast southeast from the wreck. Enter Violet Spruce Forest at the low beach on its northwestern tip: swim up the gentle shore instead of trying to scale the steep orange cliffs. The sector map marks the forest in purple and shows its main trail.',
  },
  {
    id: 'croba-bestiary', game: 'croba',
    question: 'How do I identify creatures and plants?',
    keywords: ['bestiary', 'identify', 'record creatures', 'discovery', 'field guide', 'plants', 'botany', 'species', 'ten metres'],
    answer: 'Approach within 10 metres of a creature’s body to record its species automatically, including height and depth. Press B or the field-book button to read the bestiary; opening it pauses play. Plants are identified with the illustrated Plants of Croba reference in the field guide, rather than unlocked through encounters.',
  },
  {
    id: 'croba-save-backup', game: 'croba',
    question: 'How do I save, continue or export an expedition?',
    keywords: ['save', 'saving', 'continue', 'saved expeditions', 'export', 'import', 'backup', 'progress', 'reload', 'slots'],
    answer: 'New expedition creates a local slot when storage is available. Croba autosaves every 30 seconds of play and on page exit. Saved Expeditions offers 12 named slots, renaming, manual saving and JSON export/import. Automatic saves stay in this browser; export a backup to move devices or protect progress before clearing site data.',
  },
  {
    id: 'croba-hunger-food', game: 'croba',
    question: 'Where can I find food and restore hunger?',
    keywords: ['food', 'hunger', 'hungry', 'starving', 'eat', 'rations', 'edible leaves', 'mango', 'backpack', 'harvest'],
    answer: 'Press E near Glassroot Blooms, Azure Sail Kelp, Crown Ferns or frozen basin flowers to gather edible leaves. Those plants regrow after two minutes of active play. Basin mango trees also provide fruit worth 26 hunger. Open the backpack with I or BAG, select food and choose Eat; you begin with three emergency rations.',
  },
  {
    id: 'croba-centipede', game: 'croba',
    question: 'How do I escape the giant ice centipede?',
    keywords: ['centipede', 'ice centipede', 'hunter', 'hunting', 'bite', 'escape', 'safe glacier', 'refuge'],
    answer: 'Enter the water before the hunting centipede reaches you; jumping between ice islands is unsafe because it crosses gaps and climbs edges. The crash glacier, original central island and large main glacier are refuges from pursuit and bites. Watch the HUD distance warning. A bite triggers rescue with your journal intact.',
  },
  {
    id: 'croba-copper-yoyo', game: 'croba',
    question: 'Where is the copper yo-yo and how do I use it?',
    keywords: ['yo-yo', 'yoyo', 'copper yoyo', 'copperstudio trunk', 'cargo', 'quick slots', 'gear', 'string'],
    answer: 'Find the solid copper yo-yo in the COPPERSTUDIO trunk on the original Icy Basin island. Collect it, open the backpack and assign it to a quick slot. Keys 1–5 select a slot. Hold F, the left mouse button or touch USE to extend the yo-yo; release to reel it in. The unique cargo claim and gear bindings save with the expedition.',
  },
  {
    id: 'croba-tree-stalker', game: 'croba',
    question: 'What should I do when the forest Tree Stalker chases me?',
    keywords: ['tree stalker', 'stalker', 'forest monster', 'antlers', 'chasing', 'sprint', 'hide', 'break sight'],
    answer: 'The Tree Stalker hides among the inland purple spruce, stalks slowly and sprints when it gets within 10 metres. Use terrain or solid tree trunks to break its sight; water offers an escape. If captured, the rescue tether returns you to the wreck with discoveries intact and resets the stalker to its forest home.',
  },

  // Rain & Copper: crafting.js is authoritative for ingredient quantities;
  // backpack.js displays the resource spelled "Tritoniem" (id: tritonium).
  {
    id: 'island-fishing-rod', game: 'island',
    question: 'Where do I get a fishing rod and how do I upgrade it?',
    keywords: ['fishing rod', 'get rod', 'hut rod', 'normal rod', 'active red fishing rod', 'red mouth tentacle', 'tri rod', 'upgrade rod'],
    answer: 'Collect the hut’s normal fishing rod with E, then open the inventory. Craft one rod plus one Red Mouth Tentacle into an Active Red Fishing Rod, or one Tri Eye plus a normal or Active Red rod into a Tri Rod. These upgraded rods can fish. Equip one in a quick slot before casting; upgrades consume the selected base rod.',
  },
  {
    id: 'island-cast-reel', game: 'island',
    question: 'How do I cast a line and reel in a fish?',
    keywords: ['cast', 'reel', 'catch fish', 'bite', 'float', 'fishing', 'pond', 'dock', 'line', 'full bag'],
    answer: 'Equip an Active Red Fishing Rod or Tri Rod on the pond bank or dock and aim into clear water. Click or press F to cast. The float dips after 3–7 seconds; use the same control within three seconds to reel in the catch. Reeling early cancels. If the bag is full, make room and reel again: the secured catch is preserved.',
  },
  {
    id: 'island-chop-wood', game: 'island',
    question: 'How do I chop trees and collect wood?',
    keywords: ['wood', 'chop', 'cut tree', 'birch', 'axe', 'copper axe', 'tri axe', 'collect wood', 'stump'],
    answer: 'Equip the Copper Axe and hit a nearby birch trunk three times; the Tri Axe needs one chop. Only axes fell trees. Each fallen birch leaves a stump and three wood drops. Press E nearby, controller X or mobile PICK UP to collect them. Copper Dimension birches use the same chopping rules but drop copper instead.',
  },
  {
    id: 'island-build-remove', game: 'island',
    question: 'How do I craft, place and remove building pieces?',
    keywords: ['build', 'building', 'wall plank', 'table', 'place', 'green preview', 'blocked', 'remove', 'recover furniture', 'construction'],
    answer: 'In inventory Crafting, one wood makes a Wall Plank or one Table. Equip the piece and aim at clear supported ground: green means valid and red means blocked. Click or F to place it. To recover your own piece, select slot 5 / Remove, aim within five metres and use it. A full bag leaves the structure in place.',
  },
  {
    id: 'island-tri-weapons', game: 'island',
    question: 'How do I craft Tri weapons and find their metal?',
    keywords: ['tri sword', 'tri axe', 'tritoniem', 'tritonium', 'weapon recipe', 'craft sword', 'tri drops', 'metal'],
    answer: 'Craft a Tri Sword from 3 Tritoniem and 1 wood, or a Tri Axe from 4 Tritoniem and 1 wood. Large Tri enemies guarantee Tritoniem; smaller Tri creatures have a rare chance to drop it. Collect the visible loot and use the inventory Crafting tab. Ingredients can come from the bag or your quick slots.',
  },
  {
    id: 'island-copper-portal', game: 'island',
    question: 'How do I activate the Copper Portal?',
    keywords: ['copper portal', 'portal', 'lake eyes', 'eye sockets', 'blood moon', 'lake beings', 'moon book', 'insert eyes'],
    answer: 'Find the portal in the northwest birch forest beyond the duck flock. It needs two Lake Eyes from defeated blood-moon Lake Beings. The hut moon book summons a blood moon every sixth reading. Equip the eyes in a hand slot, approach each empty socket and use E or Click/F to insert one. Both filled sockets open the gate permanently for that saved world.',
  },
  {
    id: 'island-awaken-giant', game: 'island',
    question: 'How do I awaken the Copper Giant?',
    keywords: ['awaken copper giant', 'copper giant', 'head piece', 'power core', 'inactive core', 'charge core', 'ruined tower', 'lightning'],
    answer: 'Fish up a Copper Head Piece and fit it to the fallen body in the Copper Dimension’s ruined tower. Craft an Inactive Power Core from 4 Copper, place it on clear ground and wait six seconds of active play for lightning to charge it. Pick up the charged core, hold it and fit it to the torso. An inactive core cannot awaken the giant.',
  },
  {
    id: 'island-save-export', game: 'island',
    question: 'How do I save or move my island world to another browser?',
    keywords: ['save', 'world save', 'autosave', 'export', 'import', 'backup', 'transfer', 'another browser', 'lost progress'],
    answer: 'Worlds save in this browser on this device, independently of ChatGPT sign-in. Autosave runs every 30 seconds and on pause or page exit. Use Export backup for a JSON copy, then Import world on another device; importing creates a separate world. Saves do not sync through your account, and clearing site data removes them.',
  },
  {
    id: 'island-local-coop', game: 'island',
    question: 'How do I play island co-op with a friend?',
    keywords: ['co-op', 'coop', 'multiplayer', 'local multiplayer', 'same wifi', 'same wi-fi', '2p', 'room code', 'host', 'join friend'],
    answer: 'Use two devices on the same Wi-Fi. The host opens a saved world, opens 2P and chooses Create room; the friend enters its six-character code in Join room. Setup needs internet, WebRTC and local peer connections. The host owns the save and handles fishing; the backpack is shared. Both visitors need game access, and leaving the host ends the session.',
  },

  // Card powers checked against creature-catalog.js and the matching duel.js
  // applyPower cases, rather than inferred from the original island creatures.
  {
    id: 'cards-win-rounds', game: 'cards',
    question: 'How do I win rounds and earn tokens?',
    keywords: ['win', 'winning', 'tokens', 'points', 'round', 'final reveal', 'secret hand', 'draw', 'stronger card'],
    answer: 'Start with one secret creature, draw a second, play one for its power and keep the other. Eliminate the rival or hold the stronger creature at the final reveal to win a token; first to three tokens wins. Equal final powers compare each player’s strongest played card. If that also ties, neither player gets a token.',
  },
  {
    id: 'cards-duck-tri', game: 'cards',
    question: 'Why does Duck beat The Tri, and should I play The Tri?',
    keywords: ['duck', 'the tri', 'tri card', 'highest card', 'rank ten', 'rank zero', 'discard tri', 'playing tri'],
    answer: 'The Tri has power 10, but Duck’s power-0 surprise beats it specifically at the final reveal. Playing The Tri, or being forced to discard it, knocks its holder out immediately. Duck has no knockout power when played. Keep these reveal rules separate from the creature’s ordinary numerical power.',
  },
  {
    id: 'cards-blob-guess', game: 'cards',
    question: 'What does the Tri Blob card do?',
    keywords: ['tri blob', 'blob card', 'watching eye', 'guess', 'guess power', 'guess one', 'knock out'],
    answer: 'Playing Tri Blob lets you guess the rival’s kept-card power, except power 1. A correct guess knocks the rival out; a wrong guess leaves the round going. Metal Llama protection blocks the attack. Use the public played cards and the menu’s copy counts to narrow down what the rival may still hold.',
  },
  {
    id: 'cards-lake-being', game: 'cards',
    question: 'What does Lake Being let me do with the draw pile?',
    keywords: ['lake being', 'below the surface', 'peek', 'next card', 'top card', 'bottom', 'reorder', 'draw pile'],
    answer: 'Lake Being shows you the next card in the draw pile. Choose to leave it on top or move it to the bottom; this does not reveal or replace the rival’s kept card. If the pile is empty, there is nothing to inspect. Complete the top/bottom prompt before the game can continue to the next turn.',
  },
  {
    id: 'cards-tri-ling', game: 'cards',
    question: 'How does the Tri Ling duel work?',
    keywords: ['tri ling', 'blue-legged duel', 'compare cards', 'lower power', 'equal power', 'duel card'],
    answer: 'Tri Ling compares the creature you keep after playing it with the rival’s kept creature. The lower power is knocked out. Equal powers leave both players in the round, and the rival’s Metal Llama protection blocks the challenge. Keep your other card’s strength in mind before choosing Tri Ling.',
  },
  {
    id: 'cards-metal-llama', game: 'cards',
    question: 'How long does Metal Llama protection last?',
    keywords: ['metal llama', 'copper shelter', 'protection', 'protected hand', 'shield', 'until next turn', 'block power'],
    answer: 'Playing Metal Llama protects your kept card from rival powers until your next turn. It blocks targeted effects such as Tri Blob guesses, Tri Ling challenges and forced swaps. It does not change your card’s numerical strength at the final reveal. Tri Brain replaces only hands that are not protected.',
  },
  {
    id: 'cards-gardener', game: 'cards',
    question: 'What happens when I play The Gardener?',
    keywords: ['gardener', 'fresh growth', 'forced discard', 'replacement card', 'discard the tri', 'rival discards'],
    answer: 'The Gardener makes an unprotected rival discard their kept card and draw a replacement, without using the discarded card’s power. If that card is The Tri, the rival is knocked out immediately. Metal Llama protection stops the effect. If no replacement is available, the rival loses the round.',
  },
  {
    id: 'cards-leapling', game: 'cards',
    question: 'How do I use Leapling and the hidden reserve?',
    keywords: ['leapling', 'hidden shortcut', 'reserve', 'hidden reserve', 'swap reserve', 'keep or swap', 'reserve card'],
    answer: 'Leapling lets you inspect the hidden reserve card, then keep your current kept creature or swap it with that reserve. Finish the keep/swap decision to continue the turn. The reserve is separate from the draw pile: Lake Being manipulates the next draw instead. If no reserve exists, Leapling has nothing to visit.',
  },
  {
    id: 'cards-brain-eye-giant', game: 'cards',
    question: 'How do Tri Brain, Tri Lord’s Eye and Copper Giant change hands?',
    keywords: ['tri brain', 'mind shuffle', 'tri lords eye', 'take hold', 'copper giant card', 'trade hands', 'swap cards', 'shuffle hands'],
    answer: 'Tri Brain returns every unprotected kept card to the pile, shuffles and deals replacements. Tri Lord’s Eye trades your kept creature with the rival’s unprotected card. Copper Giant swaps only if the unprotected rival holds The Tri; otherwise it does nothing. These are card powers, not commands to the island’s creatures.',
  },
  {
    id: 'cards-online-resume', game: 'cards',
    question: 'How do I host, join and resume a card duel?',
    keywords: ['host', 'join', 'online', 'room code', 'resume online room', 'save', 'reload', 'friend', '24 hours'],
    answer: 'Choose Host a game and give its six-character room code to one friend, who uses Join a friend. Both players need access; the same Wi-Fi is not required. Online rooms last up to 24 hours, and Resume online room recovers the seat stored in that browser tab. Solo matches restart on reload.',
  },

  // Arena controls and machine weak points are from the current README;
  // they supersede the early version that assigned Space to kick.
  {
    id: 'arena-cuts-controls', game: 'arena',
    question: 'How do I change sword cuts, block, jump and kick?',
    keywords: ['controls', 'cut direction', 'horizontal', 'vertical', 'slice', 'attack', 'block', 'jump', 'kick', 'space', 'right mouse'],
    answer: 'Left mouse slices vertically by default; A/D while attacking produces horizontal cuts, and V forces vertical cuts. F or J also attacks. Hold E or K to block, Shift to dash, Space to jump and right mouse to kick. WASD or arrow keys move, mouse aims, and Escape pauses. Touch has dedicated action buttons.',
  },
  {
    id: 'arena-shield-robots', game: 'arena',
    question: 'How do I get past shield robots?',
    keywords: ['shield robot', 'shield', 'armor', 'armour', 'two hits', 'rebound', 'disarm', 'sword robot', 'exposed legs'],
    answer: 'An intact shield pixel stops the blade and rebounds that swing. Each shield voxel takes two direct hits: the first sparks, the second opens it. Aim through broken areas or around the shield at exposed heads and legs. Remove the entire sword to disarm a robot; even one attached sword voxel can still attack.',
  },
  {
    id: 'arena-survival-upgrades', game: 'arena',
    question: 'How do Survival upgrades differ from Endless Waves?',
    keywords: ['survival', 'endless', 'upgrade', 'thirty seconds', '30 seconds', 'field repair', 'health restore', 'energy', 'level up'],
    answer: 'Survival keeps enemies spawning. Every 30 seconds danger rises and you choose an upgrade; combat and its timer pause for the choice, then resume the same fight and position. The milestone restores up to 15 health and 25 energy. Endless instead offers upgrades or a field repair after you clear each wave.',
  },
  {
    id: 'arena-war-player', game: 'arena',
    question: 'How do I set up armies and play in War Mode?',
    keywords: ['war mode', 'blue army', 'red army', 'place units', 'armies', 'player unit', 'let them fight', 'spectate', 'nine units'],
    answer: 'Choose a team and unit, then place it on that team’s half of the floor, or use Add to side. Each side allows nine active units including reinforcements. Let them fight starts the battle. Add the single optional Player to join a side with all nine permanent upgrades at maximum; if you fall, the fight continues in spectator view.',
  },
  {
    id: 'arena-octo-guest', game: 'arena',
    question: 'Where is Octo Nose in the arena and how do I talk to him?',
    keywords: ['octo nose', 'octo', 'war guest', 'talk to octo', 'follow order', 'guard order', 'heal allies', 'companion'],
    answer: 'Octo Nose is a War Mode guest, not an Endless, Survival or Practice enemy. In the actual arena, Talk to Octo or T opens conversation; while controlling a Player, approach within eight metres. A living allied Player can give allied Octos supported battle orders. This website guide cannot send those orders into your game.',
  },
  {
    id: 'arena-boss-schedules', game: 'arena',
    question: 'When do bosses appear in the Bonefields and Colosseum?',
    keywords: ['boss wave', 'boss rotation', 'boss schedule', 'every fifth', 'every third', 'colosseum', 'bonefields', 'wave 30'],
    answer: 'Bonefields Endless brings Copper Giant, Lake’s Corrupt Terror, Frost Triram, Eye of the Sky, Trilom Leader and Trilom Wraith at waves 5–30, then repeats. Colosseum Endless brings Tron every third wave, Giant every fifth and Fortress every tenth. Mega Drill joins wave 30 only; later waves do not automatically repeat it.',
  },
  {
    id: 'arena-copper-tron', game: 'arena',
    question: 'How do I defeat Copper Tron 1000?',
    keywords: ['copper tron', 'tron 1000', 'tripod', 'three legs', 'support legs', 'fabricator', 'machine gun', 'boss core'],
    answer: 'Each support-leg voxel takes two sword hits. Sever all three supports to lower Tron’s body into reach, then cut its exposed body or core; leg mass does not drain its main health. Damaging even one pixel of a fabricator disables that arm. Rear cannons and the machine gun can be severed separately to remove threats.',
  },
  {
    id: 'arena-copper-fortress', game: 'arena',
    question: 'What is the Copper Fortress weak point?',
    keywords: ['copper fortress', 'fortress', 'floating reactor', 'blue reactor', '7000', 'four hits', 'crew', 'hull'],
    answer: 'Copper Fortress has 10,000 health and each pixel takes four hits to break. Its hull walls are four voxels thick. Completely destroy the large floating blue reactor inside to deal 7,000 damage once, then damage the remaining hull to finish it. Surviving crew escape and fight on foot; defeated crew stay defeated.',
  },
  {
    id: 'arena-mega-drill', game: 'arena',
    question: 'How do I fight or board the Copper Mega Drill?',
    keywords: ['copper mega drill', 'mega drill', 'million health', 'reactors', '250000', 'rear ramp', 'board', 'factory', 'four rooms'],
    answer: 'Board the Mega Drill through its rear ramp; its moving rooms carry you. It has 1,000,000 health and four blue reactor cubes: completely destroying each removes 250,000 health once. Hull cuts also hurt it. Damaging a functional factory pixel disables that factory, and fully severing the drill stops its close-range attack.',
  },
  {
    id: 'arena-practice-records', game: 'arena',
    question: 'How do I practise a boss, and are arena runs saved?',
    keywords: ['practice', 'boss practice', 'practise', 'records', 'best wave', 'best score', 'save', 'retry', 'reload', 'resume run'],
    answer: 'Choose Practice, then an arena and a creature or boss; every listed choice is available immediately, with reinforcements and companions disabled. Practice and War do not change saved best-wave or best-score records. Normal active runs are session-local, and retrying begins the selected setup again with upgrades reset.',
  },
  // Mosswake Creek: material experiments and its separate endless Creek Watch.
  {
    id: 'sandbox-materials', game: 'sandbox',
    question: 'How do painting materials and weather work in Sandbox?',
    keywords: ['materials', 'painting', 'falling sand', 'creative building', 'water', 'basalt', 'embers', 'patina', 'weather', 'rain', 'storm'],
    answer: 'Drag or tap to paint: copper and sand fall, water flows, and basalt forms solid walls and dams. Water extinguishes embers; wet copper gradually turns green. Off, Rain and Storm change the visual weather. Use the Water tool to add actual water to the quarry.',
  },
  {
    id: 'sandbox-break-scenery', game: 'sandbox',
    question: 'How do I break terrain or place Normal and Tri scenery?',
    keywords: ['break', 'precision', 'one pixel', '1 px', 'eraser', 'rubble', 'scenery', 'normal palette', 'tri variants', 'huts', 'fences', 'docks'],
    answer: 'Press B for Break and choose a 1 px brush to chip individual pixels from terrain, scenery and creatures. Fragments keep their original colors. The eraser clears rubble or removes a whole placed object. Pick Normal or Tri variants, then Materials, Creatures or Scenery for the matching palette.',
  },
  {
    id: 'sandbox-tri-growth', game: 'sandbox',
    question: 'How does Tri spread and turn water into ichor?',
    keywords: ['tri growth', 'spread', 'pink', 'ichor', 'pool conversion', 'tri blob', 'tri ling', 'tri brain', '13 seconds', '75 seconds'],
    answer: 'Place Tri above dry ground with tool 9. Its growth advances at six map pixels per second, turning terrain, scenery and wildlife pink. Connected pools it touches become slower-flowing ichor; remove the touching Tri to clear that conversion. With room nearby, first births arrive at 13 seconds for a Blob, 75 seconds for a Ling and three minutes for a Brain.',
  },
  {
    id: 'sandbox-summon-bosses', game: 'sandbox',
    question: 'How do I summon or remove the sandbox bosses?',
    keywords: ['summon', 'copper giant', 'lake corrupt terror', 'eye of the sky', 'open air', 'erase boss', 'four minutes'],
    answer: 'Open Bosses and place the Copper Giant on dry ground, the Lake’s Corrupt Terror over water or ichor, or the Eye of the Sky in open air. Only one of each can roam at once. A Tri clump may awaken a sky eye after four active minutes if space permits. Touch a boss sprite with the eraser to remove it.',
  },
  {
    id: 'sandbox-creek-watch', game: 'sandbox',
    question: 'How do I survive the endless nights of Creek Watch?',
    keywords: ['creek watch', 'endless nights', 'defense', 'defence', 'palisades', 'signal tower', 'signal house', 'lake bridge', 'fifteen areas', 'paved road', 'day preparation', 'bell', 'copper stipend', 'supply caches', 'pigeons', 'daytime hunting', 'copper drops', 'win'],
    answer: 'Creek Watch has endless nights: defend the signal tower in the middle of the lake bridge until it falls. The watch spans all fifteen sandbox areas, with stretches of paved road in the grassy landscape. Map buttons walk you to either edge portal or the tower. Each day gives 160 seconds to collect copper and prepare palisades. Repair the tower by day or ring its bell for an early raid. Dawn pays a stipend and refills supplies. Guards hunt pigeons, which return at dawn, and carry loose daytime copper to drop at your feet. Your character picks it up nearby; guards return to defenses before night begins.',
  },
  {
    id: 'sandbox-sky-cycle', game: 'sandbox',
    question: 'How do Day, Night and Auto Sky controls work?',
    keywords: ['sky', 'auto sky', 'day night cycle', '80 seconds', '36 seconds', 'sun', 'moon', 'time of day', 'hold day', 'hold night'],
    answer: 'In Sandbox, choose Day or Night in the Sky controls to hold that time of day. Auto moves the sun and moon through 80 seconds of day followed by 36 seconds of night while the simulation runs. Pause freezes the simulation; the Day and Night choices let you experiment without waiting for the cycle.',
  },
  {
    id: 'sandbox-tri-portals', game: 'sandbox',
    question: 'How do I place Tri Portals and when do they spawn Blobs?',
    keywords: ['tri portal', 'portal', 'night spawn', 'dormant', 'scenery portal', 'close at dawn', 'remove portal'],
    answer: 'Choose Tri Portal from Scenery and place it on dry ground. Portals stay dormant by day, open and release Tri Blobs at night, then close at dawn. Use Break to chip pixels off a portal or Eraser to remove it. Sandbox Sky controls let you hold Day or Night or follow the automatic cycle.',
  },
  {
    id: 'sandbox-recruit-veterans', game: 'sandbox',
    question: 'How do I hire guards and train veterans at Creek Watch camps?',
    keywords: ['recruit', 'recruiting camps', 'camp', 'camp groups', 'two camps', 'four camps', 'tent marker', 'cloth flap', 'recruit hides', 'camp closed', 'hire guards', 'guards', 'balanced banks', 'fewer guards', 'guard limit', 'unlimited', 'spawn bank', 'three copper', '3 copper', 'three recruits', 'training button', 'veterans', 'train veterans', 'four copper', '4 copper', 'archers', 'double damage', 'accuracy', 'aim', 'miss shots', 'soldier shooting'],
    answer: 'Creek Watch has two recruiting camps on each bank between the tower and portals: four total. Choose either tent map marker to reach a group. Each camp has a different weathered twig-and-cloth tent and a recruit by the fire. When Tri Opus approach, the recruit hides and closes the flap; recruiting resumes after they pass. Use E or the action button at a camp to hire for 3 copper. Each hire goes to the bank with fewer guards; ties go west. There is no roster limit. After three guards in total, use the separate training button to upgrade a guard for 4 copper each, or keep hiring. Veteran archers shoot farther and deal double damage. All soldiers can miss shots, especially at long range or against flying targets. Veterans aim better than regular guards. A miss deals no damage and pigeon hunting only drops copper after a hit; named saves preserve the aiming sequence.',
  },
  {
    id: 'sandbox-guard-accuracy', game: 'sandbox',
    question: 'Can soldiers miss shots and how accurate are guards?',
    keywords: ['soldier aim', 'aim', 'accuracy', 'accurate', 'miss', 'misses', 'miss shots', 'arrow accuracy', 'hit chance', 'soldier shooting', 'veteran accuracy', 'arrow physics', 'arcing arrows', 'gravity', 'flight time', 'ballistic'],
    answer: 'Creek Watch soldiers can miss shots. They shoot real arrows upward in an arc: gravity pulls them down, and damage happens only on physical impact. Soldiers lead moving targets, but creatures can move clear and a stray arrow can hit another enemy. Veterans aim better than regular guards; distant and flying targets are harder. Arrows that miss everything go wide and deal no damage, then stick briefly in the ground. Pigeon hunting also needs an actual hit. Named saves keep arrows in flight and the aiming sequence, so reloading does not reroll a shot.',
  },
  {
    id: 'sandbox-tri-raiders', game: 'sandbox',
    question: 'What are Tri Opus in Creek Watch and Sandbox?',
    keywords: ['tri opus', 'opus', 'blue tentacle arms', 'one eye', 'pulse defenses', 'tri raider', 'tri raiders', 'raiders', 'night waves', 'edge portals', 'tower falls', 'larger waves'],
    answer: 'Tri Opus are pink creatures with one eye set into the body and blue tentacle arms. In Creek Watch, edge portals release them at dusk to walk toward the tower and pulse against its defenses; defeated Tri Opus drop copper. In Sandbox, choose Tri variants, then the creature palette, and click the ground to place one. Eraser or Break removes it. Placeable Sandbox portals still spawn limbless Tri Blobs.',
  },
  {
    id: 'sandbox-tri-flyers', game: 'sandbox',
    question: 'When do Tri Flyers appear and how do they infect soldiers?',
    keywords: ['tri flyers', 'tri flyer', 'flyers', 'flying bats', 'tri bats', 'infect', 'infection', 'infected', 'pink soldiers', 'hunched', 'day 40', 'night 40', 'land on guards'],
    answer: 'Tri Flyers join Creek Watch on night 40 and every later night, with two arriving from each portal. These small winged Tri crawl, take flight and try to land on a guard. They resemble Tri Opus, with four blue wing-arms and a mouth instead of an eye. One landing infects one soldier: the guard turns pink and hunched, leaves your friendly roster permanently and attacks the defenses with the same AI as a Tri Opus. Carried copper drops where the guard was infected. The bat lands and crawls before flying again. Guards can shoot airborne Flyers; your weapon can hit them while crawling or low enough during a descent. Infection and the current flying raid are kept in named Watch saves.',
  },
  {
    id: 'sandbox-ichor-sprayers', game: 'sandbox',
    question: 'When do Ichor Sprayers come from both sides?',
    keywords: ['ichor sprayer', 'ichor sprayers', 'sprayer', 'sprayers', 'spray', 'ichor volleys', 'blood moon', 'night 20', 'night 30', 'both sides', 'both portals'],
    answer: 'An Ichor Sprayer emerges from each portal on night 20 and every night from 30 onward: they come from both the west and east. Their volleys are slightly staggered. Each Sprayer can release three volleys, with three Tri Opus emerging where each volley lands. Defeating either Sprayer drops 6 copper. Every tenth night is a blood moon; Sprayers also return on ordinary nights from 30 onward.',
  },
  {
    id: 'sandbox-bridge-market', game: 'sandbox',
    question: 'How do I unlock the bridge market and use its weapons and Repair Kit?',
    keywords: ['bridge market', 'market', 'shop', 'forward palisades', 'forward walls', 'Rowan', 'Bram', 'sword', 'copper sword', 'battle hammer', 'repair kit', 'weapon', 'swing'],
    answer: 'Build both forward palisades for 5 copper each to unlock the bridge market. Approach a stall and use E to shop. Rowan sells a Sword for 5 copper and a Repair Kit for 4, reducing palisade repair to 1 copper. Bram sells a Copper Sword for 9 and a Copper Battle Hammer for 12. Bought weapons equip immediately; switch to an owned weapon at its seller. Face the enemy and press F or Swing to attack. The Copper Sword reaches farther, and the hammer hits up to two enemies per swing.',
  },
  {
    id: 'sandbox-builders', game: 'sandbox',
    question: 'How do I hire builders from the tents and repair my defenses?',
    keywords: ['builder', 'builders', 'builder guys', 'hire builder', 'recruit builders', 'builders from tents', 'builder hammer', 'repair workers', 'workers', 'automatic repairs', 'builder cost', 'builder repairs', 'builder recall', 'command builders', 'builder orders', 'stop repairs', 'fix walls', 'automatic repair cost'],
    answer: 'Open recruiting tents have a separate Hire builder button for 3 copper. Builders walk out of that actual tent and join the bank with fewer builders. After hiring, type fix walls in Builder orders or choose Repair defenses. They keep the order each day until stop repairs. Each wall or wall tower repair costs 2 copper, or 1 with the Repair Kit; the signal tower costs 3. Payment is taken once when work restores the first health point. It covers the rest at 1 health every 2 seconds, even across stops, night and save/load. Builders wait if you cannot afford a repair and resume automatically with enough coins. They return before night. Named saves keep orders and unfinished payments; old saves wait for your order. Use Upgrade walls for automatic upgrades.',
  },
  {
    id: 'sandbox-builder-upgrades', game: 'sandbox',
    question: 'How do builders automatically upgrade walls and how much does it cost?',
    keywords: ['auto upgrade', 'auto upgrades', 'automatic wall upgrades', 'upgrade walls', 'builders upgrade walls', 'builder upgrade', 'reinforce automatically', 'stop upgrades', 'stop upgrading'],
    answer: 'In Creek Watch, type upgrade walls or auto upgrade in Builder orders, or choose Upgrade walls. Builders repair damaged defenses first, then upgrade existing walls on their own bank: reinforce for 5 copper, then turn a reinforced wall into a wall tower for 200 copper. Each upgrade needs four seconds of work at the wall; its price is taken when it finishes. Normal repair fees still apply. Workers wait when coins are low and resume when you can afford the job. They keep the order across days and saves, returning before night. Use Stop work or type stop upgrades to cancel. Build empty wall sites yourself.',
  },
  {
    id: 'sandbox-wall-towers', game: 'sandbox',
    question: 'How do I turn walls into wall towers for 200 coins?',
    keywords: ['wall tower', 'wall towers', 'upgrade wall', 'upgrade walls', 'turn walls into towers', '200 coins', '200 copper', 'archer platform', 'guards shoot from the archer platform', 'defensive tower', 'reinforced wall', 'reinforce palisade', 'wall health'],
    answer: 'In Creek Watch, build and reinforce a palisade, then repair it to full health. Stand at the wall and press E or choose Build wall tower for 200 copper. All four wall positions support the upgrade. Each wall tower has 30 health. Two existing guards use the elevated platform at their bank’s outermost standing defense, and shoot their arcing arrows from up there. They still gather copper by day and return for the raid. The upgrade does not hire extra guards. Damaged or destroyed towers can be repaired at the normal cost without buying the upgrade again. Named Watch saves keep each wall tower and its health.',
  },
  {
    id: 'sandbox-tower-dining', game: 'sandbox',
    question: 'How do I upgrade the tower and enter its dining room?',
    keywords: ['tower upgrade', 'upgrade tower', 'upgrade the tower', '100 coins', '100 copper', 'dining room', 'dinner table', 'dinner tabel', 'red tablecloth', 'red table cloth', 'enter tower', 'enter the tower', 'inside tower', 'leave tower', 'chair', 'chairs', 'sit down', 'sit at table', 'stand up', 'seats'],
    answer: 'Walk to the signal tower during the day and use Upgrade tower for 100 copper. You pay once; the tower grows wider and taller, and Enter tower opens a compact dining room with a red tablecloth. The room has wooden walls, a larger centered door, extra space around the table and no window. Walk inside with A/D, the arrow keys or a tap. Approach any of the four chairs and press E or Sit to sit down. Press E or move to stand up. Use Leave tower room to return to the bridge. Time and the outside watch pause while you are inside. The upgrade, your room location and your seated chair are kept in named Watch save slots. Repairing the tower and ringing its dusk bell remain separate actions.',
  },
  {
    id: 'sandbox-guard-collectors', game: 'sandbox',
    question: 'How do guards carry coins to me and return before night in Creek Watch?',
    keywords: ['guards', 'guard collection', 'collect coins', 'collect copper', 'coins', 'pickup', 'pick up', 'enemy drops', 'pigeon drops', 'forage', 'foragers', 'carry coins', 'bring coins', 'drop coins', 'feet', 'bag', 'delivery', 'early bell', 'safe return', 'return home', 'night waiting'],
    answer: 'By day, guards gather loose copper across the whole map, including pigeon drops and copper from defeated enemies. They carry it to you and drop it at your feet, where your character automatically picks it up. Guards plan deliveries only with enough daylight to reach you and return to defenses. They keep carried copper until they can deliver safely, possibly the next day. An early bell recalls guards directly to defenses; passing guards can still drop a bag to you without a detour. Night and the portals wait until everyone is home.',
  },
  {
    id: 'sandbox-session-modes', game: 'sandbox',
    question: 'How do I save or load Creek Watch, and what happens to Sandbox edits?',
    keywords: ['modes', 'menu', 'switch modes', 'session', 'save', 'save slots', 'named saves', 'load', 'load slot', 'progress', 'reload', 'reset', 'clear world'],
    answer: 'Sandbox edits last only for the open tab. In Creek Watch, use Save slots to create a named save or update an existing slot. Open Creek Watch saves in the main menu and choose Load to resume its saved day or raid, tower, defenses, purchased gear, carried copper and delivered piles. Slots persist in the same browser profile and game address. Reset restarts only the selected mode; Clear world empties Sandbox and switches off rain.',
  },

  // Blackroot Vale: locally saved adventure and bundled companion speech.
  {
    id: 'blackroot-village-patrol', game: 'blackroot',
    question: 'What do the paired village patrol guards do?',
    keywords: ['village patrol', 'paired guards', 'patrol guards', 'house inspection', 'inspect houses', 'checking houses', 'south field patrol'],
    answer: 'Pairs of Opsing Guards walk from South Field to inspect two randomly chosen Thornwick houses, with one entering while the escort waits outside, then return to the field. Nearby status text announces patrols and house inspections. These village patrols do not damage or capture you or Blub; the mounted Rider and tower guards remain dangerous. Local saves keep the patrol cooldown, but loading restarts scheduling instead of restoring an active route.',
  },
  {
    id: 'blackroot-rider', game: 'blackroot',
    question: 'How do I hide from the Opsing Rider?',
    keywords: ['opsing rider', 'rider', 'hide', 'rider warning', 'house', 'houses', 'capture', 'caught', 'three sword strikes'],
    answer: 'When the Opsing Rider warning appears, sprint into a Thornwick house and stay inside until the warning says he is leaving. Hold Shift or the touch Sprint button to run. Three sword strikes send you to a cell with Blub in The Under Neath; being captured starts the escape part of the adventure.',
  },
  {
    id: 'blackroot-escape', game: 'blackroot',
    question: 'How do I escape The Under Neath and return to Thornwick?',
    keywords: ['under neath', 'cell gate', 'cell', 'dungeon', 'branching halls', 'service stair', 'ashen battlefield', 'lit marker', 'tower escape', 'spear', 'spears', 'guards'],
    answer: 'Use E at your cell gate to open it, then follow the branching halls into the tower. Dodge the Opsing Guards’ spear strikes: a hit returns you to the cell. The service stair leads out to the Ashen Battlefield. Follow its road to the lit marker to return to Thornwick. The arch in the guard hall leads to the throne room if you want to explore further.',
  },
  {
    id: 'blackroot-blub-follow', game: 'blackroot',
    question: 'How do I get Blub to follow me after escaping?',
    keywords: ['blub', 'follow me', 'follow', 'follows', 'companion', 'open doors', 'escape with blub', 'captured blub', 'winded', 'retry escape'],
    answer: 'Blub bolts when the shared cell gate opens and heads for the tower’s service stair. If the guards catch him after he gets winded or lost, talk to him at the open cell for another attempt. If he escapes first, he crosses the battlefield and wanders Thornwick. Once you and Blub are both outside in the same area, he follows you through open doors and between landmarks. Use E near him to talk; this page can explain his behavior but cannot command him remotely.',
  },
  {
    id: 'blackroot-sound', game: 'blackroot',
    question: 'How do I hear Blub and change the sound volume?',
    keywords: ['sound', 'volume', 'mute', 'muted', 'subtitles', 'voice', 'goblin voice', 'talk to blub', 'hear blub', 'silent'],
    answer: 'Press E near Blub to hear his bundled goblin voice. Open Sound to change the volume or mute the game; subtitles remain visible while muted. Volume and mute preferences are remembered in this browser. The voice clips ship with Blackroot Vale, so talking to him uses no paid speech or AI service.',
  },
  {
    id: 'blackroot-pine-hollow', game: 'blackroot',
    question: 'Where is Pine Hollow Cabin and who lives there?',
    keywords: ['pine hollow', 'pine hollow cabin', 'forest cabin', 'gloved resident', 'witch hat', 'outhouse', 'forest resident'],
    answer: 'Follow Blackroot Forest’s main trail north, then take the late western fork to Pine Hollow Cabin. A lantern marks the door; use E to enter. An unnamed resident wears a pointed felt hat, gloves and a brass-clasped mantle over a short robe. Her auburn hair forms a shoulder braid, and a scarf covers her lower face while leaving her eyes visible. While you are nearby, she visits the outhouse roughly every two minutes, ducks through the doorway and returns to the cabin. The outhouse door opens outward, so leave room for it.',
  },
  {
    id: 'blackroot-blub-meals', game: 'blackroot',
    question: 'How does Blub recover and get clean village clothes?',
    keywords: ['blub meals', 'blub recovery', 'feed blub', 'bread', 'clean clothes', 'prison grime', 'woodcutter', 'weaver', 'common house', 'three meals'],
    answer: 'After escaping to Thornwick, Blub stops for bread at the Woodcutter’s Cottage, the Weaver’s House and the Common House. He opens the door, sits at the table and rejoins you after eating. His first three meals restore his body, remove prison grime and give him clean village clothes. Meal and recovery progress are included in Blackroot’s local saves.',
  },
  {
    id: 'blackroot-session', game: 'blackroot',
    question: 'Does Blackroot Vale save the adventure or export progress?',
    keywords: ['save', 'saving', 'progress', 'reload', 'session', 'export', 'continue', 'sound preferences', 'manual save', 'autosave', 'load manual', 'load auto', 'new game'],
    answer: 'Blackroot Vale has one manual save and one autosave in this browser on this website. Open Save to save manually or load either slot. It autosaves every 8 seconds while visible, on area transitions and when leaving the tab, and resumes the newest save automatically. Saves keep your location, doors and gates, the Rider, and Blub’s escape, following, meals and recovery. Tower guards restart their patrols. New game replaces only the autosave and keeps your manual save. There is no JSON export or cloud sync; sound settings also stay local.',
  },
  // Pond: the system, globe, underwater ecosystem and land are separate views.
  {
    id: 'pond-creature-models', game: 'pond',
    question: 'How do I inspect the new 3D creature models?',
    keywords: ['3d creature models', 'creature model', 'creature close up', 'creature close-up', 'animal model', 'articulated body', 'inspect animal', 'shaded creatures', 'horns', 'frills', 'back spines', 'leg length', 'head size', 'neck length', 'body width'],
    answer: 'Click an evolved creature in Pond or Land to open its inspector and Creature close-up. The shaded 3D bodies show limbs, fins and tails according to inherited anatomy. Leg length, head size, neck length and body width are inherited too; horns, frills and back spines can grow or shrink over generations. In Land, choose a species in the roster to center on an animal or egg. Use Zoom in to look around its habitat, or Follow creature to keep the animal in view.',
  },
  {
    id: 'pond-species-calls', game: 'pond',
    question: 'How do I record, play, mute and save a species call?',
    keywords: ['species call', 'species calls', 'record call', 'recording', 'recordings', 'microphone', 'play call', 'remove call', 'enable calls', 'mute calls', 'creature sounds', 'animal sounds', 'audio clips'],
    answer: 'Select a creature and choose Species call → Record call; only that click asks your browser for microphone permission. Record up to 4 seconds and 96 KiB per clip, with one clip per species and up to 8 species per planet. Play call and Remove call appear after recording; Record again replaces its clip. Enable calls lets matching animals in view play their clip; Mute calls stops playback. Record call and Play call also enable playback. Calls start off after reloading the page; playback enablement stays in memory. Audio stays on your device and is included when you manually save the system or download a backup. Pond uses no upload, recording backend or paid speech service for this.',
  },
  {
    id: 'pond-species-mutations', game: 'pond',
    question: 'How do extra limbs mutate and how do I identify matching species?',
    keywords: ['extra limbs', 'extra limb', 'limb layout', 'limb mutation', 'mutated limbs', 'species markers', 'matching species', 'same species', 'mark species'],
    answer: 'Evolved swimmers and land animals can inherit extra limbs that grow as they mature. Mutations can change their number and layout, and offspring can inherit the changed anatomy. Select a creature to mark other animals of the same species in the current view. Species groups use body build, leg count and diet; matching colors alone do not define a species. Open Creature close-up to inspect the body and View lineage to compare inherited traits with its parents.',
  },
  {
    id: 'pond-trees', game: 'pond',
    question: 'How does grass establish trees and where do I find them?',
    keywords: ['trees', 'tree species', 'grow trees', 'mature grass', 'canopies', 'branches', 'tree seeds', 'find tree'],
    answer: 'Grass can spread across all dry ground. Once grass matures, it can establish up to 15 trees per planet on dry ground. Each planet has its own tree species, and each tree’s seed determines a different branch pattern. Mature canopies remain visible at the widest zoom in Planet and Land. In the Land controls, select a tree species under Trees to center on one and inspect its growth. Trees and their growth are included in manual system saves and backup files.',
  },
  {
    id: 'pond-create-system', game: 'pond',
    question: 'How do I create planets around Solara and start life?',
    keywords: ['create planet', 'place planet', 'solar system', 'solara', 'sun color', 'stone color', 'water color', 'planet size', 'orbits', 'start life'],
    answer: 'Start in System with Solara and empty orbits. Choose a Small, Medium or Large planet, its stone and water colors, then Place planet inside the outer orbit. Sun color has presets and a custom picker. Click a planet to open its globe, choose Place pond, then click the pool to enter. Release creature cells and plant cells there to start an ecosystem. Planets near Solara are warmer; distant ones can freeze. Larger planets make size-increasing creature mutations more likely.',
  },
  {
    id: 'pond-terrain-weather', game: 'pond',
    question: 'How do I carve basins, make oceans and control the weather?',
    keywords: ['carve basin', 'basins', 'rain', 'storm', 'oceans', 'dry depression', 'cycle weather', 'restore stone', 'terrain brush', 'undo brush', 'redo brush'],
    answer: 'On the Planet globe, Carve basin digs a dry depression. Choose Rain or Storm to fill it over time; carving alone does not add water. Cycle weather allows conditions to change automatically, while choosing weather directly holds that choice. Restore stone fills terrain back in. Turn the brush off to rotate, or Shift-drag or right-drag with it active. Undo brush and Redo brush reverse recent terrain strokes; that history starts fresh after loading.',
  },
  {
    id: 'pond-cell-evolution', game: 'pond',
    question: 'How do creature cells inherit traits and evolve onto land?',
    keywords: ['creature cells', 'release creature cells', 'evolution', 'mutation', 'mutations', 'genetics', 'anatomy', 'air tolerance', 'evolve legs', 'activity rhythm', 'predator caution'],
    answer: 'Enter a pond and use the First cell designer to choose body shape, colors, skin pattern, diet, locomotion and inherited behavior. Choose Release creature cells and place them in the underwater view. Offspring inherit anatomy and can gain or lose traits through mutation. Comfort temperature affects energy use; activity rhythm changes when animals move and sense best, and predator caution changes when they flee. Creatures with suitable legs and air tolerance can climb onto land. Inspect a descendant or its lineage to see what changed.',
  },
  {
    id: 'pond-large-lineages', game: 'pond',
    question: 'How do five small land species found large lineages and open the evolution tree?',
    keywords: ['large species', 'big species', 'big creatures', 'larger species', 'bigger creatures', 'large lineages', 'large lineage', 'large founders', 'five small species', 'five living members', 'evolution tree', 'view evolution tree', 'small ancestor', 'large evolution'],
    answer: 'When all five small land species each have at least five living members and a mature animal on dry land, one randomly chosen eligible adult from each becomes a large founder. Each founder grows by mutating its small ancestor’s anatomy. Descendants can continue changing, including their number of legs. The five large lineages have their own population slots alongside the small-species roster. In Land, open View evolution tree under Large species to trace each founder back to its small ancestor. Select an ancestor or founder to inspect its inherited traits; the simulation pauses while the viewer is open.',
  },
  {
    id: 'pond-schooling-herds', game: 'pond',
    question: 'How do schooling, herds and predator danger warnings work?',
    keywords: ['schooling', 'schools', 'herds', 'herd', 'social instinct', 'group behavior', 'danger warning', 'predator warning', 'warn group', 'regroup', 'young follow adults'],
    answer: 'Social instinct is inherited. Social swimmers form schools, and land animals of the same species travel in spaced herds. Young animals follow nearby adults. Animals can leave the group to eat, drink or hunt, then rejoin when it is safe. Spotting a predator makes an animal flee and warn nearby group members; they remember the danger briefly before regrouping. Parents with strong social instinct can also return to eggs and help them hatch sooner. Crowding, food and individual thirst can spread the group out.',
  },
  {
    id: 'pond-thirst-drinking', game: 'pond',
    question: 'How do land animals drink, use tongues and collect rain in head cups?',
    keywords: ['thirst', 'thirsty', 'hydration', 'drinking', 'seeking water', 'watering spots', 'drinking tongue', 'long tongues', 'rain cups', 'head cups', 'rain-catching head cup', 'dehydration'],
    answer: 'Land animals get thirsty and drink at ponds and ocean shores. Low hydration costs energy, so keep usable water near their habitat. Some offspring inherit longer drinking tongues that reach farther, or head cups that collect rain. A rain-catching cup helps while rain is falling; animals can still seek shore water. Select an animal to inspect its hydration and current behavior, such as Seeking water or Drinking, and use View lineage to compare inherited tongue and cup traits. Animals rest and become thirsty at different times, so watering visits happen in smaller groups.',
  },
  {
    id: 'pond-orbit-habitability', game: 'pond',
    question: 'Why are the hottest inner and coldest outer orbits inhospitable?',
    keywords: ['inhospitable', 'habitability', 'habitable orbit', 'inner orbits', 'outer orbits', 'too hot for life', 'too cold for life', 'cannot sustain life', 'temperate orbits', 'hottest planets', 'coldest planets'],
    answer: 'The hottest inner orbits and coldest outer orbits cannot sustain life. In System, check the temperature and habitability label when placing a planet around Solara. Too hot for life and Too cold for life mark inhospitable orbits; choose a temperate orbit for a living ecosystem. Nearer planets are warmer and farther planets are colder. Local latitude, altitude, seasons and daylight still affect habitats on a viable world; use Habitat map and Sample habitat to inspect those differences.',
  },
  {
    id: 'pond-algae-grass', game: 'pond',
    question: 'How do plant cells become algae and establish grass?',
    keywords: ['release plant cells', 'plant cell traits', 'algae', 'grass', 'shore adaptation', 'scatter grass seeds', 'spores', 'ocean algae', 'nutrients'],
    answer: 'In a pond, Release plant cells grows algae that feed grazers. Plant cell traits set growth, colony width, pigment and moisture preference; offspring vary and inherit these traits. Watch the Shore adaptation meter: a mature colony can establish grass with inherited algae traits. Scatter grass seeds needs an already-grown grass patch. Grass spreads, competes for light and exchanges traits through wind pollination. Mature algae can also send spores into nearby rain-filled oceans. Dead organisms break down into nutrients for plants.',
  },
  {
    id: 'pond-land-eggs', game: 'pond',
    question: 'How do land animals breed and what limits their eggs?',
    keywords: ['eggs', 'hatch', 'hatching', 'incubation', 'land breeding', 'mates', 'lone founder', 'land species', 'species cap', 'population cap', 'young animals'],
    answer: 'Compatible land animals seek mates and lay eggs that inherit traits from both parents. A lone founder can also lay an egg to establish a population. Click an egg to inspect its parents and incubation; keeping it selected follows the hatchling when it emerges. Reserved egg spaces count toward the limit of five active land species and six creatures per species, so eggs do not overfill the roster when they hatch. This is the small-species roster; large lineages have separate population slots. Young animals grow toward inherited adult size, and land animals mature before breeding.',
  },
  {
    id: 'pond-lineage-following', game: 'pond',
    question: 'How do I inspect lineage and follow an animal?',
    keywords: ['lineage', 'parents', 'ancestors', 'inherited traits', 'follow creature', 'follow animal', 'track animal', 'family tree'],
    answer: 'Select a creature, egg or plant and choose View lineage to compare its parents and inherited traits. Choose a parent to follow that branch; the simulation pauses while the viewer is open. Recent dead ancestors remain available, while older records gradually expire. Follow creature keeps a selected animal in view. Following a swimmer switches to Land when it climbs ashore; dragging the land view takes over the camera again.',
  },
  {
    id: 'pond-habitat-climate', game: 'pond',
    question: 'How do climate, seasons, soil moisture and ice affect habitats?',
    keywords: ['habitat map', 'sample habitat', 'temperature', 'soil moisture', 'daylight', 'climate', 'seasons', 'hemispheres', 'freezing', 'thaw', 'ice'],
    answer: 'Local temperature depends on latitude, altitude, seasons and daylight. Water buffers temperature swings, and soil dries gradually after rain. In Land, open Habitat map to show temperature, soil moisture or daylight. Sample habitat pins readings to one spot; the normal habitat readout follows the center of the view. Shores and flooded basins have wetter soil. Sustained cold freezes water and slows algae growth; warmth thaws it. The two hemispheres have opposite seasons, and grass grows best with suitable moisture and daylight.',
  },
  {
    id: 'pond-population-history', game: 'pond',
    question: 'How do I compare population history and traits across planets?',
    keywords: ['population history', 'history charts', 'births', 'hunts', 'population chart', 'compare planets', 'trait chart', 'average adult size', 'comfort temperature chart'],
    answer: 'Open Population history from Planet or Land. Compare animals, eggs and plants, then use the day slider or click the chart for counts, weather, births and hunts. Older samples become more widely spaced to keep history compact. Inherited traits charts compare average adult size, comfort temperature, speed, armor, social instinct and predator caution; comfort temperature can be shown beside the planet temperature. Choose a second planet to compare at the same time since each was placed. Values marked ≈ are estimates between recorded samples.',
  },
  {
    id: 'pond-save-backups', game: 'pond',
    question: 'How do Pond save slots and backup files preserve my system?',
    keywords: ['save slots', 'save system', 'three slots', 'indexeddb', 'backup files', 'download backup', 'open backup', 'local saves', 'random state'],
    answer: 'Save slots provides three manual slots for the full system. Name it when saving; population, terrain, weather, orientation, tools and random state are preserved. New saves use IndexedDB when available, and older browser saves still load. Slots belong to this browser and website address. Backup files offers Download backup and Open backup to move a system between devices or websites. Loading resets brush undo history. The same actions from a saved random state produce the same outcomes; there is no shared online world or cloud save.',
  },
  {
    id: 'pond-simulation-time', game: 'pond',
    question: 'How do I pause, fast-forward or advance one second?',
    keywords: ['pause simulation', 'advance one second', 'fast forward', 'simulation speed', 'time controls', '1x', '4x', '16x'],
    answer: 'Use Pause simulation to stop time. While paused, Advance one second takes a controlled simulation step. The 1×, 4× and 16× choices fast-forward up to that speed; larger ecosystems can advance more slowly so the camera and menus stay responsive. Lineage also pauses the world while open. The scene remains available for inspecting your system while time is paused.',
  },
].map(entry => Object.freeze({ ...entry, keywords: Object.freeze(entry.keywords) })));
