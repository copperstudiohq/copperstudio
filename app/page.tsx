import { CloudRain, Gamepad2, Layers, Pickaxe, Snowflake, Swords, Trees } from "lucide-react";
import QuartzWordmark from "@/components/quartz-wordmark";
import VisitCounter from "@/components/visit-counter";
import OctoNoseChat from "@/components/octo-nose-chat";

const games = [
  {
    number: "01", shortName: "Croba Planet", name: "Croba Planet", label: "Beyond the familiar", genre: "Alien exploration",
    description: [
      "Your spaceship lies broken on an alien glacier, and the only way to understand this world is to step outside. Cross windblown ice islands, swim beneath their spiked undersides, and follow blue coral and glowing plants into a deep cobalt ocean. Beyond the frozen coast, the Violet Spruce Forest offers a completely different landscape to explore.",
      "This is a first-person expedition built around curiosity and survival. Watch your suit’s warmth and integrity, plan each dive around your oxygen, and use your map to learn the way back. Explore Jellyfish Spires, a deep volcanic basin of fractured stone, glowing jellies and blue-and-plum marine gardens, or swim through an overgrown alien submarine. Young Crobonic Squid share the water with armored wildlife, while giant hunters make some discoveries more dangerous than others.",
    ],
    highlights: [
      { title: "Go deeper", text: "Dive through the blue ocean into the 154-metre Jellyfish Spires basin, with a lamp to light the rocks and drifting jellies." },
      { title: "Keep a field log", text: "Find three discoveries, record wildlife in your bestiary, and identify alien plants in your field guide." },
      { title: "Find your way back", text: "Reach the surface for air, recover near heat beacons, and let your rescue tether bring you home if your suit fails." },
    ],
    image: "/images/croba-concept-realistic.webp",
    alt: "Realistic concept art of a wrecked orange spacecraft on a fractured alien glacier beside a cobalt ocean, with blue coral beneath clear water",
    imageWidth: 1561, imageHeight: 1008,
    caption: "CROBA PLANET / CONCEPT ART",
    href: "/games/croba-planet/", color: "ice",
    features: ["Explore", "Discover", "Survive"], Icon: Snowflake,
  },
  {
    number: "02", shortName: "Rain & Copper", name: "Rain & Copper", label: "Something is growing", genre: "Island adventure",
    description: [
      "Rain falls through the birch trees, ducks wander beside the water, and a fishing hut waits on the shore. Start a named world and make this chunky, first-person island your own: gather wood, cast a line, craft new equipment, and build a little shelter. It is a place for quiet wandering — until you notice the strange pink growth spreading through the grass.",
      "The island’s friendly surface hides a much stranger adventure. Meet the living Tri infection and its creatures, discover unusual weapons and fishing-rod upgrades, and unlock portals into copper ruins and icy realms. Explore at your own pace, return to your saved world, or invite a second player on the same Wi-Fi to share the journey from another device.",
    ],
    highlights: [
      { title: "Make yourself at home", text: "Chop birches, collect materials, craft gear, and place planks, walls, and tables." },
      { title: "Follow the strange", text: "Learn about the island’s creatures, investigate portals, and face the dangers beyond them." },
      { title: "Come back or bring a friend", text: "Progress saves in this browser. Export a backup, or host a two-player world on the same Wi-Fi." },
    ],
    image: "/images/rain-and-copper.jpg",
    alt: "Rain and Copper concept artwork with a copper portal, a giant, and pink creatures on a green island",
    imageWidth: 1620, imageHeight: 971,
    caption: "FROM THE WORLD OF RAIN & COPPER",
    href: "https://rain-and-copper-island.davidwebstar.chatgpt.site", color: "copper",
    features: ["Craft", "Fish", "Adventure"], Icon: CloudRain,
  },
  {
    number: "03", shortName: "The Card Game", name: "Rain & Copper: The Card Game", label: "Take a seat. Keep a secret.", genre: "Creature card duel",
    description: [
      "Take a seat at an oak table in a warm wooden room, with a fireplace, red carpet, and a rival across from you. This first-person card duel brings eleven Rain and Copper creatures into a twenty-one-card deck, from the familiar Duck to the Copper Giant and the dangerous Tri.",
      "Start each round with a secret creature, draw another, then play one for its power while keeping the other hidden. Outlast your opponent or hold the stronger creature at the final reveal; the first player to three tokens wins. Play solo against the Watcher, an AI opponent, or invite a friend with a room code. Stand up to explore the room, scatter the physical cards, customize your outfit, or choose a song on the jukebox.",
    ],
    highlights: [
      { title: "Draw. Keep. Outwit.", text: "Learn eleven creature powers, protect your secret hand, and win three tokens. Even the Duck can beat the Tri at the final reveal." },
      { title: "Share the table", text: "Duel the solo AI or invite one friend online with a six-character room code. Both players need access to the game." },
      { title: "Make yourself comfortable", text: "Walk around the wooden room, choose your character’s outfit, and listen to eight songs from Rain and Copper." },
    ],
    image: "/images/rain-copper-card-room-realistic.webp",
    alt: "Realistic concept art of a warm wooden card room, with creature cards on an oak table, a glowing fireplace, lanterns, and a copper jukebox",
    imageWidth: 1561, imageHeight: 1008,
    caption: "THE CARD ROOM / CONCEPT ART",
    href: "https://wooden-room-red-carpet.davidwebstar.chatgpt.site", color: "tabletop",
    features: ["Cards", "Solo", "Online duel"], Icon: Layers,
  },
  {
    number: "04", shortName: "Rain Arena", name: "Rain Arena of Copper", label: "Aim. Cut. Survive.", genre: "Voxel arena combat",
    description: [
      "Step into the Tri Bonefields, where infected pink ground stretches between scattered bones, giant teeth, and watching eyes. This first-person voxel sword fighter brings the Tri creatures from Rain & Copper into an arena built for close combat. Aim your blade at an enemy’s body and choose horizontal or vertical cuts, then block, dash, or kick to make room for your next strike.",
      "Choose Endless Waves for upgrades between fights, Survival for continuous danger, Practice to learn an opponent, or War Mode to build red and blue armies. Fight in the Tri Bonefields, the copper Colosseum, or the Drill Mine, with creatures and machines drawn from Rain & Copper. Join a War battle with the Player unit or watch your armies fight. Your best wave and score are saved in this browser.",
    ],
    highlights: [
      { title: "Cut where you aim", text: "Place your strikes on an enemy’s body and switch between horizontal and vertical sword cuts." },
      { title: "Choose your battle", text: "Clear waves, survive continuous attacks, practise an opponent, or build two armies in War Mode." },
      { title: "Face the bosses", text: "Meet rotating bosses in the Bonefields and copper machines in the Colosseum and Drill Mine." },
    ],
    image: "/images/tri-arena-right-hand.webp",
    alt: "Realistic first-person concept art of a copper sword facing a pink one-eyed Tri creature with blue legs in a purple arena filled with bones and giant teeth",
    imageWidth: 1672, imageHeight: 941,
    caption: "RAIN ARENA OF COPPER / CONCEPT ART",
    href: "/games/tri-arena/", color: "arena",
    features: ["Combat", "Four modes", "Bosses"], Icon: Swords,
  },
  {
    number: "05", shortName: "Mosswake Creek", name: "Rain & Copper: Mosswake Creek", label: "Build. Break. Make it rain.", genre: "2D sandbox & creek defense",
    description: [
      "Return to Mosswake’s birch-lined pond, with its copper-roofed hut, dock, and wandering ducks. Paint falling copper and sand, pour flowing water, build basalt dams, and chip the landscape apart pixel by pixel. Explore five connected areas, change the rain, and experiment with creatures, scenery, and the spreading Tri.",
      "Enter Creek Watch as a faceless figure in a copper robe. Hire archers and hammer-carrying builders at the tents: guards gather and deliver copper, while your builder orders keep repairing and upgrading existing walls at the normal prices. Turn reinforced walls into 200-copper towers with raised archer platforms. Arrows arc under gravity, and moving targets can dodge them. Survive endless raids, including infectious Tri Flyers from night 40 and Ichor Sprayers from both sides. Spend 100 copper to enlarge the signal tower and visit its wooden dining room, with a long red-clothed table and four usable copper chairs. Named saves keep your watch, builder orders and paid work; Sandbox edits last for the tab.",
    ],
    highlights: [
      { title: "Build and break", text: "Pour materials, shape the water, place scenery, and chip away individual pixels with a brush as small as one pixel." },
      { title: "After dark", text: "Control the sky, let the Tri spread, and place portals that release Tri Blobs at night." },
      { title: "Hold the creek", text: "Command builders, train archers and upgrade wall towers. Save the watch, including paid repairs and work already underway." },
    ],
    image: "/images/mosswake-creek-gameplay.webp",
    alt: "Pixel art gameplay of Mosswake Creek with a copper-roofed fishing hut, birch trees, ducks, and a pond above layers of sand and copper ore",
    imageWidth: 768, imageHeight: 396,
    caption: "MOSSWAKE CREEK / GAMEPLAY",
    href: "/games/mosswake-creek/", color: "sandbox",
    features: ["Sandbox", "Pixel physics", "Creek Watch"], Icon: Pickaxe,
  },
  {
    number: "06", shortName: "Blackroot Vale", name: "Blackroot Vale", label: "Follow the lights. Watch the road.", genre: "Dark-fantasy exploration",
    description: [
      "Lanterns glow through the windows of Thornwick, a moonlit village at the edge of an enormous evergreen forest. Step inside seven furnished houses, meet households with human and creature ancestry, and follow the forest trail to Pine Hollow Cabin and its gloved resident. Watch paired Opsing Guards arrive from South Field to inspect village houses, then return along the road. Cross the barren field to study the ruined tower, or explore the rooms and open landscapes with keyboard or touch.",
      "The Opsing Rider sometimes approaches from the tower; watch for his warning and shelter in a house. Three sword strikes send you to The Under Neath, where Blub — the son of a goblin and an orc — shares your cell. Help him escape the guards and return through the tower and Ashen Battlefield. Reunite outside and he follows your journey, stopping for meals that help him recover and give him clean village clothes. Explore the four-eyed ruler’s throne room and painted history. A manual save and autosave now preserve the adventure in this browser, including your location, doors, the Rider and Blub’s progress.",
    ],
    highlights: [
      { title: "Explore by lantern light", text: "Visit seven furnished village houses, a towering evergreen forest and the barren South Field. Landmark buttons help you find your way between hunts." },
      { title: "Escape The Under Neath", text: "Shelter from the mounted Rider, or find your way out of the cells and branching halls while avoiding the tower guards’ spears." },
      { title: "Return to your journey", text: "Follow Blub’s escape and recovery, save manually, or resume the latest local autosave when you return." },
    ],
    image: "/games/blackroot-vale/art/village.webp",
    alt: "A moonlit medieval village beside an enormous evergreen forest, with wet cobblestones, slate roofs and warm lantern-lit windows",
    imageWidth: 1536, imageHeight: 1024,
    caption: "BLACKROOT VALE / THORNWICK ARTWORK",
    href: "/games/blackroot-vale/", color: "forest",
    features: ["Explore", "Escape", "Companions"], Icon: Trees,
  },
] as const;

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#worlds">Skip to the games</a>
      <header className="site-header shell">
        <a className="wordmark" href="#" aria-label="Copperstudio Games home">
          <img className="brand-mark" src="/copper-c.svg" width="32" height="32" alt="" aria-hidden="true" />
          <QuartzWordmark />
        </a>
        <nav aria-label="Main navigation">
          <a className="nav-link" href="#worlds">The games</a>
          <a className="nav-link" href="#octo-nose">Ask Octo</a>
          <a className="nav-link" href="#how-to-play">How to play</a>
        </nav>
      </header>
      <main>
        <section className="hero shell" aria-labelledby="hero-title">
          <div className="eyebrow">A LITTLE COLLECTION OF BIG ADVENTURES</div>
          <div className="hero-content">
            <h1 id="hero-title">Small games.<br /><span className="copper-text">Strange</span> worlds.</h1>
            <div className="hero-aside">
              <p>Across the ice. Into the rain.<br /> Around the table. Into the arena.<br /> Through the forest.<br /> Or build your own little world.</p>
              <div className="hero-actions"><a className="primary-link" href="#worlds">Explore the games</a><a className="secondary-link" href="#octo-nose">Meet your guide</a></div>
            </div>
          </div>
          <div className="hero-bottom"><span>MADE TO GET A LITTLE LOST IN.</span><span><Gamepad2 size={16} aria-hidden="true" /> PLAY IN YOUR BROWSER</span></div>
          <span className="hero-crystal" aria-hidden="true"><img src="/purple-quartz-crystal.svg" width="120" height="144" alt="" /></span>
        </section>
        <section className="worlds shell" id="worlds" aria-labelledby="worlds-title">
          <div className="worlds-heading"><div><span className="eyebrow">THE COLLECTION</span><h2 id="worlds-title">Find a world that feels like you.</h2></div><p>Six games. All in your browser.<br />Pick a place to begin.</p></div>
          <nav className="game-jump-nav" aria-label="Jump to a game">{games.map((game) => <a key={game.number} href={"#game-" + game.number}>{game.shortName}</a>)}</nav>
          <div className="game-grid">
            {games.map(({ Icon, ...game }) => {
              const local = game.href.startsWith("/");
              return (
                <article className={"game-card " + game.color + (game.color === "sandbox" || game.color === "forest" ? " game-featured" : "")} id={"game-" + game.number} key={game.name} aria-labelledby={"game-title-" + game.number}>
                  <a className="game-art" href={game.href} target="_blank" rel="noopener noreferrer" aria-label={"Open " + game.name + " (opens in a new tab)"}>
                    <img src={game.image} alt={game.alt} width={game.imageWidth} height={game.imageHeight} loading={game.number === "01" ? "eager" : "lazy"} fetchPriority={game.number === "01" ? "high" : "auto"} />
                    <span className="art-label"><Icon size={16} aria-hidden="true" />{game.label}</span>
                    <span className="art-caption">{game.caption}</span>
                  </a>
                  <div className="game-info">
                    <div className="game-category"><span>{game.genre}</span><span className="game-host">{local ? "Plays here" : "Original site"}</span></div>
                    <h3 className="copper-text" id={"game-title-" + game.number}>{game.name}</h3>
                    <div className="game-tags" aria-label={game.name + " themes"}>{game.features.map((feature) => <span key={feature}>{feature}</span>)}</div>
                    <p className="game-overview">{game.description[0]}</p>
                    <div className="game-footer"><a className="play-link" href={game.href} target="_blank" rel="noopener noreferrer" aria-label={"Play " + game.name + " (opens in a new tab)"}><Gamepad2 size={18} aria-hidden="true" />Play {game.shortName}</a><p className="game-access">{local ? "No sign-in needed." : "May ask you to sign in with ChatGPT."}<span>Opens in a new tab</span></p></div>
                    <details className="game-details">
                      <summary aria-label={"More about this game: " + game.name}><span>More about this game</span><span className="details-mark" aria-hidden="true">+</span></summary>
                      <div className="game-description">
                        {game.description.slice(1).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                        <ul className="game-highlights" aria-label={game.name + " highlights"}>
                          {game.highlights.map((highlight) => <li key={highlight.title}><strong>{highlight.title}</strong><span>{highlight.text}</span></li>)}
                        </ul>
                      </div>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <OctoNoseChat />
        <section className="play-guide shell" id="how-to-play" aria-labelledby="guide-title">
          <div className="guide-intro"><span className="eyebrow">BEFORE YOU WANDER</span><h2 id="guide-title">A small field guide.</h2><p>Pick a world. Open a new tab.<br />See where you end up.</p></div>
          <div className="guide-questions">
            <details><summary>How do I get started?<span aria-hidden="true">+</span></summary><div className="answer">Choose a game above to open it in a new tab. All six games run in your browser. Croba Planet, Rain Arena of Copper, Mosswake Creek and Blackroot Vale open directly from Copperstudio with no sign-in. The Rain &amp; Copper island and The Card Game keep their original sites and multiplayer, and may ask you to sign in with ChatGPT.</div></details>
            <details><summary>What are the controls?<span aria-hidden="true">+</span></summary><div className="answer"><p>In Croba Planet and the Rain &amp; Copper island adventure, use <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to move, the mouse or arrow keys to look, and <kbd>Space</kbd> to jump. Press <kbd>E</kbd> to interact and <kbd>Esc</kbd> to pause.</p><p>At the card table, <kbd>E</kbd> draws, <kbd>1</kbd>/<kbd>2</kbd> select cards, <kbd>R</kbd> raises or lowers your card, and <kbd>F</kbd> plays it. Press <kbd>C</kbd> to stand up or sit down.</p><p>In Rain Arena of Copper, use <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or the arrow keys to move and the mouse or a drag to look. Left-click to attack, using <kbd>A</kbd>/<kbd>D</kbd> for horizontal cuts or holding <kbd>V</kbd> to force vertical cuts. Right-click to kick, use <kbd>E</kbd> or <kbd>K</kbd> to block, <kbd>Shift</kbd> to dash, <kbd>Space</kbd> to jump, and <kbd>Esc</kbd> to pause.</p><p>In Mosswake Creek’s Sandbox, drag or tap to paint, use <kbd>1</kbd>–<kbd>9</kbd> for tools, <kbd>B</kbd> to break pixels, <kbd>E</kbd> to erase, and <kbd>A</kbd>/<kbd>D</kbd> to pan the map. <kbd>Space</kbd> pauses. In Creek Watch, use <kbd>A</kbd>/<kbd>D</kbd>, the arrow keys, or tap the ground to walk; <kbd>E</kbd> uses a nearby station. Press <kbd>F</kbd> or use Swing to attack with an equipped weapon. At the tower by day, use Upgrade tower for 100 copper, then Enter tower to visit the dining room. Near a chair, press <kbd>E</kbd> to sit or stand. Use Leave tower room to return outside.</p><p>In Blackroot Vale, use <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or the arrow keys to move and turn, drag to look, hold <kbd>Shift</kbd> to sprint, and press <kbd>E</kbd> near a door or Blub to interact. The Village, Forest and Field buttons jump between landmarks when a hunt is not active. Open Sound to adjust the volume or mute.</p><p>All six games have touch controls. The island adventure also supports standard game controllers. Each game has its own full control guide.</p></div></details>
            <details><summary>Where are my existing saves?<span aria-hidden="true">+</span></summary><div className="answer">Saves stay with the browser and website where you made them. To bring a Croba expedition here, open Saved Expeditions on the <a href="https://croba-planet-icebound.davidwebstar.chatgpt.site" target="_blank" rel="noopener noreferrer">original Croba Planet game</a>, export a JSON backup, then import it in Croba on Copperstudio. Arena records stay on the original site. Mosswake Creek’s Sandbox keeps edits in its open tab; Creek Watch has named save slots stored in this browser. Blackroot Vale keeps exploration progress in its current tab and remembers sound settings on your device.</div></details>
            <details><summary>Which game should I choose?<span aria-hidden="true">+</span></summary><div className="answer">Choose Croba Planet for alien wildlife, icy exploration, and deep ocean dives. Choose the Rain &amp; Copper island adventure for fishing, crafting, and strange creatures. Choose Rain &amp; Copper: The Card Game for secret hands, creature powers, and a solo or online duel across the table. Choose Rain Arena of Copper for sword combat, waves, upgrades, bosses and army battles. Choose Mosswake Creek for a pixel sandbox where you can build and break the world, plus an endless creek defense challenge. Choose Blackroot Vale for a moonlit village, a dark forest, an escape through guarded halls and a talkative goblin-orc companion.</div></details>
          </div>
        </section>
      </main>
      <footer className="site-footer shell"><a className="wordmark footer-wordmark" href="#"><img className="brand-mark" src="/copper-c.svg" width="32" height="32" alt="" aria-hidden="true" /><QuartzWordmark /></a><div className="footer-note"><p>A little curiosity goes a long way.</p><VisitCounter /></div><a className="back-top" href="#">Back to the surface</a></footer>
    </>
  );
}
