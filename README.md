# KasProve

Inscribe digital signatures of files or text on the Kaspa block DAG. Verify digital signatures against those inscriptions.

## Prerequisites

- Node.js (v24+)
- npm (11+)
- Vercel cli (or your choice of build tool for API & UI)

## Install

`npm i`

## Run

UI
`npm start`

API
`npm run start:api`

## Contributing

Send a PR or open an issue.

## Ethos

Fork and host your own instance! Adapt the code to your needs.

To achive a higher throughput system, it may be better to use an actual server instead of serverless functions.
The current deployment through Vercel has this low throughput caveat.

## Tools

- [Angular](https://angular.io) - Frontend framework
- [Express](https://expressjs.com) - Backend framework
- [Bootstrap](https://getbootstrap.com) - CSS framework
- [Vercel](https://vercel.com) - Deployment platform API
- [Cloudflare](https://cloudflare.com) - Deployment platform UI
- [Kaspa WASM](https://kaspa.aspectron.org/integrating-wasm/index.html) - Kaspa web assembly
- [KasFYI](https://docs.kas.fyi/api-reference) - Kaspa archival node
- [Kaspa Org](https://kaspa.org) - Kaspa archival node
