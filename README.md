# Factory-MIOS client demo

A standalone interactive demonstration of Factory-MIOS manufacturing intelligence.

Demo: https://pratapsinghsisodiya.github.io/factory-mios-demo/

Explore six distinct operating views for one automotive-components plant: energy management, water balance, production OEE, warehouse inventory, motor maintenance and RFID traceability. No account is needed.

All data is synthetic, with a fixed reference scenario of 21–22 October 2026 (IST). Changes are saved only in the visitor's browser; use **Methods & demo reset** to start again. This repository contains the demonstration interface and generated sample data only. It does not include the application's Python backend, database, credentials, or real client records. Live ingestion and account onboarding belong to the full application.

- Energy: 15-minute kW/kVA demand, kWh register reconciliation, power factor, electrical readings and configurable example tariff.
- Water: fresh intake, metered uses, storage change, residual, treated-water reuse and cooling-tower balance.
- OEE: machine/shift-specific availability, performance and first-pass quality, with count inputs and a complete time-loss balance.
- Warehouse: stock by SKU/lot/bin, reservations, QC hold, receipts, issues, transfers, counts, releases and a movement ledger.
- Maintenance: named motor/sensor positions, vibration and bearing temperature, due work orders, manual completion, on-time execution and before/after readings at recorded speed/load.
- RFID: passive-tag TX/backscatter/RX signal path, six portals, EPC-to-lot mapping, duplicate filtering, route validation and a quality gate linked to warehouse release.

The in-app methodology page documents formulas, source references and scenario assumptions. Sensor limits are example site settings, not universal engineering standards. The factory schematic uses simplified illustrative geometry.

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
