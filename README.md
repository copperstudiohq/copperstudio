# Copperstudio Games

The public Copperstudio Games landing page for [copperstudio.nl](https://copperstudio.nl). Built with Next.js and exported as static HTML, CSS, JavaScript, and local images/fonts. The footer reads a shared visit counter from a small AWS service; browsing the games page needs no sign-in.

## Development and build

Use Node.js 24 (see `.nvmrc`) and npm:

```sh
npm ci
npm run dev
```

For a production build and type check:

```sh
npm run build
npm run typecheck
npm test
```

The complete deployable site is written to `out/`. To preview it, serve that directory with any local static HTTP server. Asset URLs target the domain root; the site is configured for a custom domain rather than a GitHub project subpath.

## GitHub Pages

Set the repository's **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. The included workflow builds and checks pushes to `main`, uploads `out/`, and deploys through the `github-pages` environment. It can also be run manually. A failed build or type check prevents deployment. The workflow uses GitHub's automatic token and needs no repository secrets.

Configure **copperstudio.nl** as the repository's Pages custom domain before updating DNS. The exported `CNAME` records the intended domain, but GitHub ignores CNAME files for Actions deployments, so the Pages setting is required. Follow [GitHub's custom-domain DNS instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site); preserve unrelated mail and verification records. Enable **Enforce HTTPS** after GitHub provisions the certificate. `public/.nojekyll` is included in the export and artifact.

The prepared Route 53 change batch is in [`infra/route53-records.json`](infra/route53-records.json). Before applying it, verify that the selected public hosted zone is the zone delegated for `copperstudio.nl`, review the existing records, and preserve unrelated records.

## Browsing the collection

The landing page keeps the copper and quartz identity while providing a five-game jump menu, readable overviews and prominent Play links. Each game’s expandable details retain its longer description and feature highlights. The layout adapts from a two-column collection to single-column phone cards; Mosswake Creek has a wider desktop feature. Secondary cover images load lazily. Octo’s chat includes keyboard guidance, a visible input limit and accessible links that announce a new tab.

## Octo Nose chat

The section below the games reuses Octo Nose's local conversation rules and original nose, Tri, and Croba dialogue from Axolotl Major, Rain & Copper, and Tri Arena. Its static portrait is rendered from Rain & Copper's `dist/octo-rounded-model.js` through the game's `createOctoNose()` model wrapper, preserving its original 16×16 pixel cloth texture on the robe and scarf. The lossless WebP is rendered at 2560×1440; the landing page loads only that image. A bundled library adds source-checked answers about all five games, including recipes, card powers, oxygen, saves, bosses and Mosswake Creek's two modes. Local question matching tolerates common spelling mistakes and scores specific topics rather than choosing a random tip. It is a rule-based character and game guide, rather than a general-purpose language model; unsupported questions receive honest suggestions for things Octo can answer.

Octo remembers the current game through follow-up questions and small talk. If a question needs a game name, answering that clarification continues the original question. He can compare games, recommend one from stated interests and constraints, and adjust when a preference changes. He cannot inspect live game stats or control another game.

All chat replies are computed in the visitor's browser. The chat has no AI API, backend, model download, microphone, dialogue bridge, or per-message service charges. It does not change the existing visit counter's billing. Updating the original games' dialogue does not automatically update the bundled website copy.

Conversation memory lives only in the current page, with at most 24 visible messages and 300 characters per input. Remembered interests, recent fact IDs and pending clarification are bounded. Refreshing the page or choosing **Clear chat** resets the conversation, remembered name and interests. Messages are rendered as text and are never sent to a service or stored in cookies or local storage. The optional **Read aloud** setting starts off and uses only an English voice that the browser reports as local; it remains unavailable when there is no local voice. Text chat works either way.

`lib/octo-chat.mjs` coordinates conversation; `lib/octo-understanding.mjs` normalizes and matches questions; `lib/octo-knowledge.mjs` holds the curated answers and provenance; `lib/octo-advice.mjs` handles interests and comparisons. `lib/octo-dialogue.mjs` keeps the original character lines, and `components/octo-nose-chat.tsx` provides the accessible interface. `npm test` covers game routing, contextual dialogues, typo matching, input bounds, and local-only speech behavior alongside the visit counter tests.

## Shared visit counter

The footer shows total website visits since the counter launched. Each tab session counts once; refreshing that tab reads the latest total without incrementing it. This measures visits rather than unique people or completed game plays. With browser session storage disabled, each page load can count again. Automated visits and deliberate repeat requests can affect the total.

The public endpoint in `config/visits.json` is an AWS Lambda Function URL in `eu-west-1`. DynamoDB stores one aggregate number, updated atomically. The application stores no visitor IDs, cookies, IP addresses, or browsing history. Failure to load the counter shows an unavailable state while the rest of the site keeps working.

The CloudFormation generator embeds `infra/visit-counter/handler.cjs` directly. Lambda Node.js 24 supplies AWS SDK v3. Tests exercise the handler without network access. To provision or update the counter with an authenticated AWS CLI:

```sh
node infra/visit-counter/template.mjs outputs/visit-counter-template.json
aws cloudformation deploy --region eu-west-1 \
  --stack-name copperstudio-visit-counter \
  --template-file outputs/visit-counter-template.json \
  --capabilities CAPABILITY_IAM
aws cloudformation describe-stacks --region eu-west-1 \
  --stack-name copperstudio-visit-counter \
  --query 'Stacks[0].Outputs'
```

Set `config/visits.json` to the `CounterUrl` output before publishing. The URL is public and contains no credentials. Backend changes require the CloudFormation deployment; GitHub Actions deploys the static site only. The table is retained across stack deletion or replacement so routine deployments preserve the count. Lambda concurrency is limited to 2, table throughput to 20 read/write units per second, and application logs are retained for 7 days. These are small, usage-billed AWS resources; throughput limits are not a spending cap.

Local previews intentionally cannot increment the live counter because its origins are restricted to the two production domains. The public API accepts only a fixed read or +1 operation, with no client-selected counter or increment amount. CORS is browser protection rather than authentication. Avoid automatically retrying failed POSTs: an uncertain response can still represent a successful increment.

## Game access and assets

Croba Planet, **Rain Arena of Copper** (also known as Tri Arena), and Mosswake Creek run directly from this GitHub Pages site with no sign-in or game backend. Their files are served from `public/games/croba-planet/`, `public/games/tri-arena/`, and `public/games/mosswake-creek/`. No paid service is added for these games. The landing page's existing AWS visit counter is separate and unchanged.

The Rain & Copper island and The Card Game retain their original hosted sites and multiplayer services. Their sign-in, sharing settings, saved data and multiplayer behavior stay with those sites; publishing this landing page does not grant access to them.

The Croba export preserves the original client game and uses local DM Sans and Space Grotesk variable fonts, with their OFL licenses in `assets/fonts/`. The Arena export excludes its generated `server/` Worker and substitutes a no-network `octo-dialogue-sync.js` compatibility module. Octo keeps his bundled lines and local chat; updates from the private cross-game dialogue bridge are unavailable on this static copy. The game's menu-linked model viewers remain included. Arena canonical metadata points to its Copperstudio URL.

Browser saves belong to their website origin. Croba expeditions on the old Site can be exported as JSON in **Saved Expeditions** and imported on Copperstudio. Neither Croba saves nor Arena records/preferences transfer automatically; the original sites keep their existing browser data.

**Rain & Copper: Mosswake Creek** is hosted directly at [`/games/mosswake-creek/`](https://copperstudio.nl/games/mosswake-creek/) with no sign-in. `public/games/mosswake-creek/` contains a static build of the original `copper-rain` game. It has no third-party runtime dependencies or network services. Sandbox edits stay in the current tab. The separate endless Creek Watch mode has named save slots stored locally in the same browser profile and game address; use **Save slots** during play and **Creek Watch saves → Load** from the main menu. The card image is an actual Sandbox gameplay capture.

The current Creek copy includes Sandbox **Day / Night / Auto** sky controls (80-second days and 36-second nights) and placeable Tri Portals that spawn creatures after dark. Creek Watch spans all five areas with its signal tower on the lake bridge. Two recruiting camps sit on each bank between the tower and the portals, with a map marker for each bank's pair. Recruits shelter in their tents when Tri Opus approach and return when it is safe. Guards cost 3 copper and fill both banks evenly, with no fixed roster cap. After three total recruits, a separate training button upgrades a guard for 4 copper; veterans have greater range and double damage.

Creek Watch's Tri Opus are pink, one-eyed creatures with long blue arms that walk toward the tower and pulse against its defenses. Waves grow larger and tougher over the early nights and continue until the tower falls. Daytime pigeons drop copper when guards hunt them and return at dawn. Sandbox portals spawn limbless Tri Blobs, and Tri Opus can be placed from the Tri creature palette. The current `index.html` is a standalone bundle with embedded CSS and game modules; the separate source modules remain included for future manual updates.

Hired guards automatically gather coins across the whole map during daylight, carry them back to the player, and drop them at the player’s feet for pickup. Coins enter the player’s total after delivery, not remotely. Guards budget enough time to return to their defenses before night; if a delivery cannot be completed safely, they keep the coins for the next day. Ringing the bell early recalls the guards, and the raid begins once they are back. Guard positions, carried coins, and pending recalls survive save/load, including existing save slots.

Build both forward palisades for 5 copper each to unlock the bridge market. Rowan sells a Sword and a Repair Kit; Bram sells a Copper Sword and a Copper Battle Hammer. Use E at a stall to shop, then F or Swing to attack with the equipped weapon. Purchased gear and forward defenses are stored in Watch save slots.

Upgrade the signal tower during daylight for 100 copper. The one-time upgrade makes the tower wider and taller and unlocks an enterable, windowless dining room with wooden walls, a larger centered entrance, a long red-clothed table in front of the door and more floor space; use the tower button to enter and Leave tower room to return outside. The four chairs support sitting: approach one and press E or Sit, then press E or move to stand up. A/D, arrow keys and ground taps move inside. The outside watch pauses indoors. Named saves retain the upgrade, room location and seated chair, and existing save slots remain compatible. Bridge stalls have layered wood, cloth and copper textures, and Rowan and Bram have detailed pixel-art portraits embedded in the standalone game.

Game updates are manual. To update Mosswake Creek, take a source snapshot, run its existing `npm run bundle:local` command, then copy the complete `dist/` contents into its public directory, keeping relative module and stylesheet paths intact. Building in a temporary copy preserves the authoring project when other work is in progress. For Croba and Arena, exclude generated backend output and deployment metadata; retain Croba's local font declarations/assets and Arena's no-network dialogue adapter when refreshing the client files. Run the source game's relevant tests, this repository's export tests, the site build and browser smoke checks before publishing. Source projects and original hosted versions remain separate from these published copies.

The initial Croba export retains four failing assertions in the original source's controller tests (jump timing and fixed-step frame timing); it does not modify gameplay to satisfy those assertions. The selected source suite passed 101 of 105 tests. Browser checks confirmed toolbar-focused jumping and pause/resume on the exported game. Arena's 68 selected source tests passed at the initial export. Each Creek refresh runs its captured source tests and legacy-save compatibility checks before publication.

The supplied SVG logos, artwork, and responsive layout are preserved from the existing Copperstudio page. The DM Sans and DM Serif fonts are served locally; their SIL Open Font License texts are retained in `public/fonts/`.
