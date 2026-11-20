import { ArrowDown, ArrowUpRight, CloudRain, Gamepad2, Layers, Pickaxe, Snowflake, Swords } from "lucide-react";
import QuartzWordmark from "@/components/quartz-wordmark";
import VisitCounter from "@/components/visit-counter";
import OctoNoseChat from "@/components/octo-nose-chat";

const games = [
  {
    number: "01", name: "Croba Planet", label: "Beyond the familiar", genre: "Alien exploration",
    description: [
      "Your spaceship lies broken on an alien glacier, and the only way to understand this world is to step outside. Cross windblown ice islands, swim beneath their spiked undersides, and follow blue coral and glowing plants into a deep cobalt ocean. Beyond the frozen coast, the Violet Spruce Forest offers a completely different landscape to explore.",
      "This is a first-person expedition built around curiosity and survival. Watch your suit’s warmth and integrity, plan each dive around your oxygen, and use your map to learn the way back. Peaceful young Crobonic Squid share the water with armored alien wildlife, while a giant ice centipede and a forest stalker make some discoveries more dangerous than others.",
    ],
    highlights: [
      { title: "Go deeper", text: "Descend into a 100-metre ocean basin, with a dive light to guide you through the dark." },
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
    number: "02", name: "Rain & Copper", label: "Something is growing", genre: "Island adventure",
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
    number: "03", name: "Rain & Copper: The Card Game", label: "Take a seat. Keep a secret.", genre: "Creature card duel",
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
    number: "04", name: "Rain Arena of Copper", label: "Aim. Cut. Survive.", genre: "Voxel arena combat",
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
    number: "05", name: "Rain & Copper: Mosswake Creek", label: "Build. Break. Make it rain.", genre: "2D sandbox & creek defense",
    description: [
      "Return to Mosswake’s birch-lined pond, with its copper-roofed hut, dock, and wandering ducks. Paint falling copper and sand, pour flowing water, build basalt dams, and chip the landscape apart pixel by pixel. Explore five connected areas, change the rain, and experiment with creatures, scenery, and the spreading Tri.",
      "Choose day, night, or an automatic sky cycle, and place Tri Portals that wake after dark. For a different challenge, enter Creek Watch as a faceless figure in a copper robe. Travel all five areas, collect copper, and hire guards at the recruiting camps. Guards fill both banks evenly, gather coins across the map by day, bring them back to you, and return before night. Train veterans, fortify the banks, and protect the tower through endless raids. Save 100 copper to upgrade the tower and step into its dining room, with a small table under a red cloth. Save your watch in named slots in this browser; your Sandbox edits stay in the current tab.",
    ],
    highlights: [
      { title: "Build and break", text: "Pour materials, shape the water, place scenery, and chip away individual pixels with a brush as small as one pixel." },
      { title: "After dark", text: "Control the sky, let the Tri spread, and place portals that release Tri Blobs at night." },
      { title: "Hold the creek", text: "Recruit guards, train veterans, and defend the bridge through endless nights. Save your watch to return later." },
    ],
    image: "/images/mosswake-creek-gameplay.webp",
    alt: "Pixel art gameplay of Mosswake Creek with a copper-roofed fishing hut, birch trees, ducks, and a pond above layers of sand and copper ore",
    imageWidth: 768, imageHeight: 396,
    caption: "MOSSWAKE CREEK / GAMEPLAY",
    href: "/games/mosswake-creek/", color: "sandbox",
    features: ["Sandbox", "Pixel physics", "Creek Watch"], Icon: Pickaxe,
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
          <a className="nav-link" href="#worlds">The games <span>{String(games.length).padStart(2, "0")}</span></a>
          <a className="nav-link" href="#how-to-play">How to play <ArrowUpRight size={15} aria-hidden="true" /></a>
        </nav>
      </header>
      <main>
        <section className="hero shell" aria-labelledby="hero-title">
          <div className="eyebrow"><span className="status-dot" /> A LITTLE COLLECTION OF BIG ADVENTURES</div>
          <div className="hero-content">
            <h1 id="hero-title">Small games.<br /><span className="copper-text">Strange</span> worlds.</h1>
            <div className="hero-aside">
              <p>Across the ice. Into the rain.<br /> Around the table. Into the arena.<br /> Or build your own little world.</p>
              <a className="explore-link" href="#worlds">Find your world <span><ArrowDown size={18} aria-hidden="true" /></span></a>
            </div>
          </div>
          <div className="hero-bottom"><span>MADE TO GET A LITTLE LOST IN.</span><span><Gamepad2 size={16} aria-hidden="true" /> PLAY IN YOUR BROWSER</span></div>
          <span className="hero-crystal" aria-hidden="true"><img src="/purple-quartz-crystal.svg" width="120" height="144" alt="" /></span>
        </section>
        <section className="worlds shell" id="worlds" aria-labelledby="worlds-title">
          <div className="section-label"><h2 id="worlds-title">CHOOSE YOUR NEXT ADVENTURE</h2><span>FIVE GAMES. YOUR CALL.</span></div>
          <div className="game-grid">
            {games.map(({ Icon, ...game }) => (
              <article className={"game-card " + game.color} key={game.name} aria-labelledby={"game-title-" + game.number}>
                <a className="game-art" href={game.href} target="_blank" rel="noopener noreferrer" aria-label={"Play " + game.name + " (opens in a new tab)"}>
                  <img src={game.image} alt={game.alt} width={game.imageWidth} height={game.imageHeight} fetchPriority={game.number === "01" ? "high" : "auto"} />
                  <span className="art-label"><Icon size={14} aria-hidden="true" /> {game.label}</span>
                  <span className="art-arrow"><ArrowUpRight size={26} aria-hidden="true" /></span>
                  <span className="art-caption">{game.caption}</span>
                </a>
                <div className="game-info">
                  <div className="game-category"><span>{game.genre}</span><span>GAME / {game.number}</span></div>
                  <h3 className="copper-text" id={"game-title-" + game.number}>{game.name}</h3>
                  <div className="game-description">
                    {game.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    <ul className="game-highlights" aria-label={game.name + " highlights"}>
                      {game.highlights.map((highlight) => <li key={highlight.title}><strong>{highlight.title}</strong><span>{highlight.text}</span></li>)}
                    </ul>
                  </div>
                  <div className="game-footer"><div className="game-tags">{game.features.map((feature) => <span key={feature}>{feature}</span>)}</div><a className="play-link" href={game.href} target="_blank" rel="noopener noreferrer" aria-label={"Start " + game.name + " (opens in a new tab)"}>Let’s play <ArrowUpRight size={18} aria-hidden="true" /></a></div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <OctoNoseChat />
        <section className="play-guide shell" id="how-to-play" aria-labelledby="guide-title">
          <div className="guide-intro"><span className="eyebrow">BEFORE YOU WANDER</span><h2 id="guide-title">A small field guide.</h2><p>Pick a world. Open a new tab.<br />See where you end up.</p></div>
          <div className="guide-questions">
            <details><summary>How do I get started?<span aria-hidden="true">+</span></summary><div className="answer">Choose a game above to open it in a new tab. All five games run in your browser. Croba Planet, Rain Arena of Copper and Mosswake Creek open directly from Copperstudio with no sign-in. The Rain &amp; Copper island and The Card Game keep their original sites and multiplayer, and may ask you to sign in with ChatGPT.</div></details>
            <details><summary>What are the controls?<span aria-hidden="true">+</span></summary><div className="answer"><p>In Croba Planet and the Rain &amp; Copper island adventure, use <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to move, the mouse or arrow keys to look, and <kbd>Space</kbd> to jump. Press <kbd>E</kbd> to interact and <kbd>Esc</kbd> to pause.</p><p>At the card table, <kbd>E</kbd> draws, <kbd>1</kbd>/<kbd>2</kbd> select cards, <kbd>R</kbd> raises or lowers your card, and <kbd>F</kbd> plays it. Press <kbd>C</kbd> to stand up or sit down.</p><p>In Rain Arena of Copper, use <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or the arrow keys to move and the mouse or a drag to look. Left-click to attack, using <kbd>A</kbd>/<kbd>D</kbd> for horizontal cuts or holding <kbd>V</kbd> to force vertical cuts. Right-click to kick, use <kbd>E</kbd> or <kbd>K</kbd> to block, <kbd>Shift</kbd> to dash, <kbd>Space</kbd> to jump, and <kbd>Esc</kbd> to pause.</p><p>In Mosswake Creek’s Sandbox, drag or tap to paint, use <kbd>1</kbd>–<kbd>9</kbd> for tools, <kbd>B</kbd> to break pixels, <kbd>E</kbd> to erase, and <kbd>A</kbd>/<kbd>D</kbd> to pan the map. <kbd>Space</kbd> pauses. In Creek Watch, use <kbd>A</kbd>/<kbd>D</kbd>, the arrow keys, or tap the ground to walk; <kbd>E</kbd> uses a nearby station. Press <kbd>F</kbd> or use Swing to attack with an equipped weapon. At the tower by day, use Upgrade tower for 100 copper, then Enter tower to visit the dining room. Press <kbd>E</kbd> or Leave tower to return outside.</p><p>All five games have touch controls. The island adventure also supports standard game controllers. Each game has its own full control guide.</p></div></details>
            <details><summary>Where are my existing saves?<span aria-hidden="true">+</span></summary><div className="answer">Saves stay with the browser and website where you made them. To bring a Croba expedition here, open Saved Expeditions on the <a href="https://croba-planet-icebound.davidwebstar.chatgpt.site" target="_blank" rel="noopener noreferrer">original game</a>, export a JSON backup, then import it in Croba on Copperstudio. Arena records stay on the original site. Mosswake Creek’s Sandbox keeps edits in its open tab; Creek Watch has named save slots stored in this browser.</div></details>
            <details><summary>Which game should I choose?<span aria-hidden="true">+</span></summary><div className="answer">Choose Croba Planet for alien wildlife, icy exploration, and deep ocean dives. Choose the Rain &amp; Copper island adventure for fishing, crafting, and strange creatures. Choose Rain &amp; Copper: The Card Game for secret hands, creature powers, and a solo or online duel across the table. Choose Rain Arena of Copper for sword combat, waves, upgrades, bosses and army battles. Choose Mosswake Creek for a pixel sandbox where you can build and break the world, plus an endless creek defense challenge.</div></details>
          </div>
        </section>
      </main>
      <footer className="site-footer shell"><a className="wordmark footer-wordmark" href="#"><img className="brand-mark" src="/copper-c.svg" width="32" height="32" alt="" aria-hidden="true" /><QuartzWordmark /></a><div className="footer-note"><p>A little curiosity goes a long way.</p><VisitCounter /></div><a className="back-top" href="#">Back to the surface <ArrowUpRight size={15} aria-hidden="true" /></a></footer>
    </>
  );
}
