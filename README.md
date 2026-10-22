# Factory-MIOS client demo

A standalone interactive demonstration of Factory-MIOS manufacturing intelligence.

Demo: https://pratapsinghsisodiya.github.io/factory-mios-demo/

Explore fourteen dashboard views, plant and time filters, a Three.js factory, maintenance/inventory/safety/traceability records, downtime logging, CSV exports, and a sample-data assistant. No account is needed.

All data is synthetic. Changes are saved only in the visitor's browser; use **Guide & reset** to start again. The assistant uses preset rules, not a hosted AI service. This repository contains the demonstration interface and generated sample data only. It does not include the application's Python backend, database, credentials, or real client records. Live ingestion and account onboarding belong to the full application.

## Develop and verify

Requires Node.js 20.9+ and npm.

```sh
npm ci
npm test
npm run build
npm run dev
```

Development URL: http://localhost:3000/factory-mios-demo/

The build exports static files to `out/`. The base path is `/factory-mios-demo`; preserve it when serving locally or change it in `next.config.js` before building for a different repository.

## Publish

GitHub Pages uses GitHub Actions as its source. Pushing `main` runs the tests, builds the static export, and publishes the `out/` artifact. Only a successful deployment makes the demo URL available. No secrets are required by the workflow.
