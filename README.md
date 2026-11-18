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

The first four game links open their existing sites in a new tab. Those games keep their own hosting, sign-in, sharing settings, saved data, and multiplayer behavior; publishing this landing page does not grant access to a linked game.

**Rain & Copper: Mosswake Creek** is hosted directly at [`/games/mosswake-creek/`](https://copperstudio.nl/games/mosswake-creek/) with no sign-in. `public/games/mosswake-creek/` contains an unchanged copy of the original `copper-rain/dist/` game. It has no build step, third-party runtime dependencies, network services or persistent saves. Its Sandbox and five-night Creek Watch campaign retain separate state while the tab stays open; reloading starts over. The card image is an actual Sandbox gameplay capture.

To update this copy, copy the original game's complete `dist/` contents into that public directory, keeping relative module and stylesheet paths intact. Run the source game's existing tests, build this site, and smoke-check both modes from the exported path before publishing. The original local game and its standalone HTML remain separate from this published copy.

The supplied SVG logos, artwork, and responsive layout are preserved from the existing Copperstudio page. The DM Sans and DM Serif fonts are served locally; their SIL Open Font License texts are retained in `public/fonts/`.
