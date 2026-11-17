# EU AI Act SDK

**Live page, with a try-it panel, the API and the proof:** https://sjgant80-hub.github.io/fall-euaiact-sdk/

A JavaScript library for working with the EU AI Act: the risk classifier the fall-euaiact page runs (prohibited, high, limited or minimal, with the articles that apply), the obligations and the dates they apply from as amended by Regulation (EU) 2026/1744, sealed assessments anyone can check, an Article 12 audit log with a hash chain, Annex IV technical documentation in six languages, an Article 50 disclosure badge, and Ed25519 signing with the platform's own cryptography.

It is the [fall-euaiact](https://sjgant80-hub.github.io/fall-euaiact/) page's own code, as modules. The classifier is a keyword heuristic grounded in the Regulation: a documented starting point, not a legal judgment.

## Install

```bash
npm install github:sjgant80-hub/fall-euaiact-sdk
```

It is not on the npm registry; it installs from this repository. Pin a commit for production: `npm install github:sjgant80-hub/fall-euaiact-sdk#<commit>`.

## Use

```js
import { classifyText, obligationsFor, assess, verifyAssessment, createAuditShim } from '@ai-native-solutions/fall-euaiact-sdk';

const r = classifyText('An AI system that screens CVs for a recruitment agency.');
// { tier: 'high', articles: ['Annex III(4)'], confidencePct: 60, ... }
obligationsFor(r.tier).deadline;           // '2027-12-02'
const sealed = assess('An AI system that screens CVs…', { at: '2026-11-17' });
verifyAssessment(sealed).valid;            // true, and false if anything in it is changed
const log = createAuditShim();             // IndexedDB in a browser, memory in Node
```

## API

| Export | What it does |
|---|---|
| `classifyText(text) · classify(text)` | The risk tier with articles, triggers and confidence. classifyText never throws; classify keeps the older result shape and rejects an empty description. |
| `obligationsFor(tier) · deadlineFor(tier)` | What the tier requires and the date it applies from. |
| `assess(text, { at }) · verifyAssessment(a)` | Seal a verdict; check a sealed verdict was not altered. |
| `deepClassify(text, { provider, apiKey, model })` | A second opinion from a model you choose (Anthropic, OpenAI or Google), with your own key. The Anthropic default is claude-opus-5-5. |
| `ARTICLES · DEADLINES · PENALTIES · ANNEX_III_CATEGORIES · searchArticles · getArticle · articlesForTier` | The article navigator. |
| `createAuditShim({ sink, dbName })` | An Article 12 event log: log, exportAll, verifyChain, clear. |
| `createAnnexIV(values) · generateAnnexIV · validateValues · DOC_FIELDS` | Annex IV technical documentation: Markdown, HTML or JSON, in six languages, and signable. |
| `createTransparencyBadge({ category, language, … })` | An accessible Article 50 disclosure, with an impression log and a signed configuration. |
| `generateKeypair · sign · verify` | Ed25519 with the platform's WebCrypto; accepts 32-byte seeds and libsodium's 64-byte keys. |

## How it is kept honest

- src/kernel.js is a byte copy of the fall-euaiact repository's kernel.mjs: the classifier the live page runs, proven by that repository's tests and mutation gate. classify() is a thin adapter over it. The product's own gate fails if its sdk/kernel.js differs from kernel.mjs, and this repository's parity check fails if src/ differs from the product's sdk/ by a single byte.
- The classifier runs the Article 5 prohibitions first, then the Annex III high-risk uses, then the Article 50 transparency cases; the first tier with a match wins, so a prohibited use is never softened to high. No match is minimal. Confidence is 40 plus 20 per matching trigger, capped at 95.
- The dates are Article 113 as amended by Regulation (EU) 2026/1744: Article 5 since 2 February 2025; Article 50 from 2 August 2026; high-risk for Annex III systems from 2 December 2027 and for AI in Annex I products from 2 August 2028.
- A sealed assessment hashes the exact text, the tier and the articles together; change any of them and verification fails.
- The audit log chains each entry to the previous one by SHA-256. In a browser it uses IndexedDB; the chain check ignores the key IndexedDB writes into each record (before this repair it did not, so every non-empty browser log reported itself as tampered).

Run it yourself: `npm test`, `npm run parity`, `npm run example`. CI runs the same, plus the mutation gate, on every push.

## Not included

- The hosted REST worker and its OpenAPI spec: they stay in the fall-euaiact repository (sdk/worker.js), deployed separately.
- Legal review of borderline systems.

## Licence and supplier

MIT, © Simon Gant. Supplied by [AI Native Solutions](https://www.ai-nativesolutions.com); support is agreed per deployment.
