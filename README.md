# Copperstudio Games

The public Copperstudio Games landing page for [copperstudio.nl](https://copperstudio.nl). Built with Next.js and exported as static HTML, CSS, JavaScript, and local images/fonts. No server, sign-in, environment variables, or external data services are required for this landing page.

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
```

The complete deployable site is written to `out/`. To preview it, serve that directory with any local static HTTP server. Asset URLs target the domain root; the site is configured for a custom domain rather than a GitHub project subpath.

## GitHub Pages

Set the repository's **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. The included workflow builds and checks pushes to `main`, uploads `out/`, and deploys through the `github-pages` environment. It can also be run manually. A failed build or type check prevents deployment. The workflow uses GitHub's automatic token and needs no repository secrets.

Configure **copperstudio.nl** as the repository's Pages custom domain before updating DNS. The exported `CNAME` records the intended domain, but GitHub ignores CNAME files for Actions deployments, so the Pages setting is required. Follow [GitHub's custom-domain DNS instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site); preserve unrelated mail and verification records. Enable **Enforce HTTPS** after GitHub provisions the certificate. `public/.nojekyll` is included in the export and artifact.

The prepared Route 53 change batch is in [`infra/route53-records.json`](infra/route53-records.json). Before applying it, verify that the selected public hosted zone is the zone delegated for `copperstudio.nl`, review the existing records, and preserve unrelated records.

## Game access and assets

The three game links open their existing sites in a new tab. Those games keep their own hosting, sign-in, sharing settings, saved data, and multiplayer behavior; publishing this landing page does not grant access to a linked game.

The supplied SVG logos, artwork, and responsive layout are preserved from the existing Copperstudio page. The DM Sans and DM Serif fonts are served locally; their SIL Open Font License texts are retained in `public/fonts/`.
