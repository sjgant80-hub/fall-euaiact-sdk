// test/sdk.test.js · node --test · the SDK modules around the gated kernel: classifier adapter and the deep (LLM)
// path, the article navigator, the Article 12 audit shim (in memory AND through an IndexedDB that behaves like a
// browser's), Annex IV documents, Article 50 badges and Ed25519 signing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  classify, deepClassify, TIERS, DEEP_PROMPT, classifyText,
  ARTICLES, ANNEX_III_CATEGORIES, PENALTIES, DEADLINES, searchArticles, getArticle, articlesForTier,
  createAuditShim, generateAnnexIV, getDocFields, validateValues, DOC_FIELDS, createAnnexIV, ANNEX_IV_LOCALES,
  createTransparencyBadge, ARTICLE_50_CATEGORIES, generateKeypair, sign, verify, SDK_VERSION, SPEC_VERSION,
} from '../src/index.js';

// ── classifier ──────────────────────────────────────────────────────────────────────────────────
test('classify is the gated kernel in the documented shape', () => {
  assert.deepEqual(classify('An AI system that screens CVs for a recruitment agency.'), {
    tier: 'high', label: 'HIGH RISK · Annex III · Articles 6-15',
    triggers: [{ note: 'employment · CV screening · hiring', article: 'Annex III(4)' }], articles: ['Annex III(4)'], confidence: 60,
  });
  for (const t of ['emotion recognition at work', 'facial recognition in public spaces for police', 'a chatbot', 'a spam filter']) {
    assert.equal(classify(t).tier, classifyText(t).tier, t);
  }
  assert.equal(classify('emotion recognition at work').tier, 'prohibited');
  for (const bad of ['', 42, null, undefined, {}]) assert.throws(() => classify(bad), /non-empty string/);
  assert.deepEqual(TIERS, { PROHIBITED: 'prohibited', HIGH: 'high', LIMITED: 'limited', MINIMAL: 'minimal' });
});

async function withFetch(resp, fn) {
  const calls = []; const real = globalThis.fetch;
  globalThis.fetch = async (url, init) => { calls.push({ url, init, body: init && init.body ? JSON.parse(init.body) : null }); return { json: async () => resp }; };
  try { return { out: await fn(), calls }; } finally { globalThis.fetch = real; }
}

test('deepClassify · Anthropic: request shape, current default model, fenced JSON, errors', async () => {
  const { out, calls } = await withFetch({ content: [{ text: '```json\n{"tier":"high","confidence":80}\n```' }] }, () => deepClassify('CV screening', { provider: 'anthropic', apiKey: 'k' }));
  assert.deepEqual(out, { tier: 'high', confidence: 80 });
  assert.equal(calls[0].url, 'https://api.anthropic.com/v1/messages');
  assert.equal(calls[0].init.headers['x-api-key'], 'k'); assert.equal(calls[0].init.headers['anthropic-version'], '2023-06-01');
  assert.equal(calls[0].body.model, 'claude-opus-5-5'); assert.equal(calls[0].body.max_tokens, 800);
  assert.ok(calls[0].body.messages[0].content.startsWith(DEEP_PROMPT)); assert.ok(calls[0].body.messages[0].content.endsWith('CV screening'));
  assert.equal((await withFetch({ content: [{ text: '{}' }] }, () => deepClassify('x', { provider: 'anthropic', apiKey: 'k', model: 'm1' }))).calls[0].body.model, 'm1');
  assert.deepEqual((await withFetch({ content: [] }, () => deepClassify('x', { provider: 'anthropic', apiKey: 'k' }))).out, {});
  await assert.rejects(withFetch({ error: { message: 'bad key' } }, () => deepClassify('x', { provider: 'anthropic', apiKey: 'k' })), /bad key/);
  await assert.rejects(withFetch({ error: {} }, () => deepClassify('x', { provider: 'anthropic', apiKey: 'k' })), /Anthropic API error/);
});

test('deepClassify · OpenAI and Google: request shape, defaults, empty answers, errors', async () => {
  const o = await withFetch({ choices: [{ message: { content: '{"tier":"limited"}' } }] }, () => deepClassify('bot', { provider: 'openai', apiKey: 'k' }));
  assert.deepEqual(o.out, { tier: 'limited' });
  assert.equal(o.calls[0].url, 'https://api.openai.com/v1/chat/completions'); assert.equal(o.calls[0].init.headers.authorization, 'Bearer k');
  assert.equal(o.calls[0].body.model, 'gpt-4o-mini'); assert.deepEqual(o.calls[0].body.response_format, { type: 'json_object' });
  assert.deepEqual(o.calls[0].body.messages, [{ role: 'system', content: DEEP_PROMPT }, { role: 'user', content: 'bot' }]);
  assert.equal((await withFetch({ choices: [] }, () => deepClassify('x', { provider: 'openai', apiKey: 'k', model: 'm2' }))).calls[0].body.model, 'm2');
  assert.deepEqual((await withFetch({ choices: [] }, () => deepClassify('x', { provider: 'openai', apiKey: 'k' }))).out, {});
  await assert.rejects(withFetch({ error: { message: 'quota' } }, () => deepClassify('x', { provider: 'openai', apiKey: 'k' })), /quota/);
  await assert.rejects(withFetch({ error: {} }, () => deepClassify('x', { provider: 'openai', apiKey: 'k' })), /OpenAI API error/);
  const g = await withFetch({ candidates: [{ content: { parts: [{ text: '{"tier":"minimal"}' }] } }] }, () => deepClassify('spam', { provider: 'google', apiKey: 'gk' }));
  assert.deepEqual(g.out, { tier: 'minimal' });
  assert.ok(g.calls[0].url.includes('/models/gemini-1.5-flash:generateContent?key=gk'));
  assert.deepEqual(g.calls[0].body.generationConfig, { responseMimeType: 'application/json' });
  assert.ok((await withFetch({}, () => deepClassify('x', { provider: 'google', apiKey: 'k', model: 'm3' }))).calls[0].url.includes('/models/m3:'));
  assert.deepEqual((await withFetch({}, () => deepClassify('x', { provider: 'google', apiKey: 'k' }))).out, {});
  await assert.rejects(withFetch({ error: { message: 'denied' } }, () => deepClassify('x', { provider: 'google', apiKey: 'k' })), /denied/);
  await assert.rejects(withFetch({ error: {} }, () => deepClassify('x', { provider: 'google', apiKey: 'k' })), /Google AI API error/);
});

test('deepClassify refuses before calling anyone', async () => {
  const { calls } = await withFetch({}, async () => {
    await assert.rejects(deepClassify('', { provider: 'anthropic', apiKey: 'k' }), /description required/);
    await assert.rejects(deepClassify('x', { apiKey: 'k' }), /provider and opts.apiKey/);
    await assert.rejects(deepClassify('x', { provider: 'openai' }), /provider and opts.apiKey/);
    await assert.rejects(deepClassify('x'), /provider and opts.apiKey/);
    await assert.rejects(deepClassify('x', { provider: 'acme', apiKey: 'k' }), /unknown provider: acme/);
  });
  assert.equal(calls.length, 0);
});

// ── articles ────────────────────────────────────────────────────────────────────────────────────
test('articles carry the dates of Regulation (EU) 2026/1744', () => {
  assert.deepEqual(ARTICLES.map((a) => a.id), ['5', '6', '9', '10', '11', '12', '13', '14', '15', '26', '50', '51-55']);
  for (const id of ['6', '9', '10', '11', '12', '13', '14', '15', '26']) {
    assert.equal(getArticle(id).enforceFrom, '2027-12-02', id); assert.equal(getArticle(id).enforceFromAnnexI, '2028-08-02', id);
  }
  assert.equal(getArticle('5').enforceFrom, '2025-02-02'); assert.equal(getArticle('50').enforceFrom, '2026-08-02'); assert.equal(getArticle('51-55').enforceFrom, '2025-08-02');
  assert.deepEqual(DEADLINES.map((d) => d.date), ['2025-02-02', '2025-08-02', '2026-08-02', '2026-12-02', '2027-08-02', '2027-12-02', '2028-08-02']);
  assert.equal(ANNEX_III_CATEGORIES.length, 8); assert.equal(PENALTIES[0].max, '€35M or 7% global turnover');
  assert.equal(getArticle('99'), undefined);
});

test('searchArticles and articlesForTier', () => {
  assert.equal(searchArticles('').length, 12); assert.notEqual(searchArticles(''), ARTICLES);
  assert.deepEqual(searchArticles('risk').map((a) => a.id), ['6', '9', '11', '12', '13', '14', '15', '26', '51-55']);
  assert.deepEqual(searchArticles('oversight').map((a) => a.id), ['13', '14', '26']);
  assert.deepEqual(searchArticles('PROHIBITED AI PRACTICES').map((a) => a.id), ['5']);
  assert.deepEqual(searchArticles('zzzq'), []);
  for (const j of [42, {}, [], true, Object.create(null)]) assert.equal(searchArticles(j).length, 12); // not a query: everything
  assert.deepEqual(articlesForTier('prohibited').map((a) => a.id), ['5']);
  assert.deepEqual(articlesForTier('high').map((a) => a.id), ['6', '9', '10', '11', '12', '13', '14', '15', '26']);
  assert.deepEqual(articlesForTier('limited').map((a) => a.id), ['50']);
  assert.deepEqual(articlesForTier('minimal'), []); assert.deepEqual(articlesForTier('x'), []);
});

// ── audit shim ──────────────────────────────────────────────────────────────────────────────────
const ZERO = '0'.repeat(64);
const rehash = (e) => { const { hash, id, ...rest } = e; return createHash('sha256').update(JSON.stringify(rest)).digest('hex'); };

test('audit (memory): each entry chains to the last, summaries are cut at 200, tampering is found', async () => {
  const a = createAuditShim({ sink: 'memory' });
  const e1 = await a.log({ type: 'inference', input: 'x'.repeat(300), output: 'y', operator: 'op1', metadata: { m: 1 } });
  assert.equal(e1.event_type, 'inference'); assert.equal(e1.input_summary.length, 200); assert.equal(e1.output_summary, 'y');
  assert.equal(e1.operator_id, 'op1'); assert.deepEqual(e1.metadata, { m: 1 }); assert.equal(e1.prev_hash, ZERO); assert.equal(e1.hash, rehash(e1));
  const e2 = await a.log({ input: 5, output: { o: 1 } });
  assert.equal(e2.event_type, 'unknown'); assert.equal(e2.input_summary, null); assert.equal(e2.output_summary, null);
  assert.equal(e2.operator_id, null); assert.equal(e2.metadata, null); assert.equal(e2.prev_hash, e1.hash);
  assert.deepEqual(await a.verifyChain(), { valid: true, total: 2 });
  const all = await a.exportAll(); assert.equal(all.length, 2);
  all[1].event_type = 'edited';
  assert.deepEqual(await a.verifyChain(), { valid: false, broken_at: 1, total: 2 });
  all[1].event_type = 'unknown'; all[1].prev_hash = '1'.repeat(64);
  assert.deepEqual(await a.verifyChain(), { valid: false, broken_at: 1, total: 2 });
  all[1].prev_hash = e1.hash; all[0].prev_hash = '2'.repeat(64);
  assert.deepEqual(await a.verifyChain(), { valid: false, broken_at: 0, total: 2 });
  await a.clear(); assert.deepEqual(await a.exportAll(), []); assert.deepEqual(await a.verifyChain(), { valid: true, total: 0 });
  assert.equal((await a.log({ type: 't' })).prev_hash, ZERO);
});

// A fake IndexedDB that behaves like a browser's where it matters: async callbacks, and a keyPath 'id' generator
// that writes the generated key INTO the stored record.
function fakeIndexedDB({ failOpen = false } = {}) {
  const dbs = {}; const opened = [];
  return {
    opened, dbs,
    open(name) {
      opened.push(name); const req = {};
      setTimeout(() => {
        if (failOpen) { req.onerror({ target: { error: new Error('blocked') } }); return; }
        const fresh = !dbs[name]; const db = dbs[name] || (dbs[name] = makeDb());
        if (fresh && req.onupgradeneeded) req.onupgradeneeded({ target: { result: db } });
        req.onsuccess({ target: { result: db } });
      }, 0);
      return req;
    },
  };
}
function makeDb() {
  const stores = {};
  return {
    stores, created: [],
    objectStoreNames: { contains: (n) => Object.hasOwn(stores, n) },
    createObjectStore(n, opts) { this.created.push(n); stores[n] = { rows: [], seq: 0, opts }; return stores[n]; },
    transaction(n) {
      const st = stores[n]; const tx = {};
      const done = () => setTimeout(() => tx.oncomplete && tx.oncomplete(), 0);
      tx.objectStore = () => ({
        add(e) { st.seq += 1; e.id = st.seq; st.rows.push(structuredClone(e)); done(); },
        getAll() { const r = {}; setTimeout(() => { r.result = st.rows.map((x) => structuredClone(x)); r.onsuccess(); }, 0); return r; },
        clear() { st.rows = []; done(); },
      });
      return tx;
    },
  };
}

test('audit (IndexedDB): a browser log verifies, opens once, and survives being read back', async () => {
  const idb = fakeIndexedDB(); globalThis.indexedDB = idb;
  try {
    const a = createAuditShim({ dbName: 'my-log' }); // the sink defaults to IndexedDB where there is one
    await a.log({ type: 'one' }); await a.log({ type: 'two' });
    assert.deepEqual(idb.opened, ['my-log']); // the database is opened once and kept
    const db = idb.dbs['my-log'];
    assert.deepEqual(db.created, ['log']); assert.deepEqual(db.stores.log.opts, { keyPath: 'id', autoIncrement: true });
    const rows = await a.exportAll();
    assert.deepEqual(rows.map((r) => r.event_type), ['one', 'two']); assert.deepEqual(rows.map((r) => r.id), [1, 2]);
    assert.deepEqual(await a.verifyChain(), { valid: true, total: 2 }); // the stored key is not part of the hash
    db.stores.log.rows[0].event_type = 'edited';
    assert.deepEqual(await a.verifyChain(), { valid: false, broken_at: 0, total: 2 });
    await a.clear(); assert.deepEqual(await a.exportAll(), []);
    assert.equal((await a.log({ type: 'after' })).prev_hash, ZERO);
    const b = createAuditShim(); await b.log({ type: 'x' }); assert.ok(idb.dbs['eu-aiact-audit']); // default name
    const c = createAuditShim({ sink: 'memory' }); await c.log({ type: 'm' });
    assert.deepEqual((await c.exportAll()).map((r) => r.event_type), ['m']); assert.equal(idb.opened.length, 2); // memory never touches IndexedDB
    const again = fakeIndexedDB(); globalThis.indexedDB = again; again.dbs['pre'] = makeDb(); again.dbs['pre'].createObjectStore('log', {});
    const d = createAuditShim({ dbName: 'pre' }); await d.log({ type: 'p' });
    assert.deepEqual(again.dbs['pre'].created, ['log']); // an existing store is reused, not created twice
    globalThis.indexedDB = fakeIndexedDB({ failOpen: true });
    await assert.rejects(createAuditShim({ dbName: 'x' }).log({ type: 't' }), /blocked/);
  } finally { delete globalThis.indexedDB; }
  const m = createAuditShim(); await m.log({ type: 'node' });
  assert.deepEqual((await m.exportAll()).map((r) => r.event_type), ['node']); // no IndexedDB → memory
});

// ── Annex IV ────────────────────────────────────────────────────────────────────────────────────
const ALL = Object.fromEntries(DOC_FIELDS.map((f) => [f.id, 'V-' + f.id]));
test('generateAnnexIV: date, draft warning, values and the placeholder for what is missing', () => {
  const md = generateAnnexIV({ system_name: 'S1' }, { date: '2026-06-03' });
  assert.ok(md.startsWith('# Technical Documentation · EU AI Act Annex IV\n\n> Generated: 2026-06-03 · per Regulation (EU) 2024/1689'));
  assert.ok(md.includes('⚠ This is a starting draft')); assert.ok(md.includes('**System name & version:** S1'));
  assert.ok(md.includes('**Provider:** _[fill in]_'));
  assert.ok(!generateAnnexIV({}, { draftWarning: false }).includes('starting draft'));
  assert.match(generateAnnexIV(null), /> Generated: \d{4}-\d{2}-\d{2}/);
  const full = generateAnnexIV(ALL, { date: 'd' });
  for (const f of DOC_FIELDS) assert.ok(full.includes('V-' + f.id), f.id);
  assert.equal(getDocFields().length, 14); assert.notEqual(getDocFields(), DOC_FIELDS);
});

test('validateValues lists missing and blank fields', () => {
  assert.deepEqual(validateValues(ALL), []);
  assert.deepEqual(validateValues({ ...ALL, provider: '   ', purpose: '' }), ['provider', 'purpose']);
  assert.equal(validateValues({}).length, 14); assert.equal(validateValues(undefined).length, 14);
});

test('createAnnexIV: export as Markdown, HTML or JSON, in six languages, validate, sign', async () => {
  const doc = createAnnexIV({ system_name: 'S1', provider: 'P' }, { date: '2026-06-03' });
  assert.deepEqual(doc.supportedLanguages, ['en', 'de', 'fr', 'es', 'it', 'nl']); assert.equal(doc.fields.length, 14);
  assert.deepEqual(doc.toJSON(), { values: { system_name: 'S1', provider: 'P' }, opts: { date: '2026-06-03', draftWarning: true } });
  assert.equal(doc.validate().complete, false); assert.equal(doc.missing().length, 12);
  assert.equal(createAnnexIV(ALL).validate().complete, true);
  assert.equal(await doc.export(), generateAnnexIV({ system_name: 'S1', provider: 'P' }, { date: '2026-06-03', draftWarning: true }));
  const de = await doc.export({ language: 'de' });
  assert.ok(de.startsWith('# ' + ANNEX_IV_LOCALES.de.title)); assert.ok(de.includes('## 1 · ' + ANNEX_IV_LOCALES.de.sect1));
  assert.ok(de.includes('## 3 · ' + ANNEX_IV_LOCALES.de.sect3 + ' (Article 13)')); assert.ok(de.includes('## 5 · ' + ANNEX_IV_LOCALES.de.sect5 + ' (Article 47)'));
  assert.ok(de.includes(ANNEX_IV_LOCALES.de.draftWarn)); assert.ok(!de.includes('General description'));
  const html = await doc.export({ format: 'html', language: 'fr' });
  assert.ok(html.startsWith('<!doctype html>')); assert.ok(html.includes('<h1>' + ANNEX_IV_LOCALES.fr.title.replace(/&/g, '&amp;') + '</h1>'));
  assert.ok(html.includes('<blockquote class="warn">')); assert.ok(html.includes('<em class="todo">[fill in]</em>'));
  const env = await doc.export({ format: 'json', language: 'it' });
  assert.equal(env.kind, 'fall-euaiact-annexiv-v1'); assert.equal(env.language, 'it'); assert.equal(env.generated, '2026-06-03');
  assert.equal(env.systemName, 'S1'); assert.equal(env.provider, 'P'); assert.equal(env.purpose, null);
  const fullEnv = await createAnnexIV(ALL).export({ format: 'json' });
  assert.deepEqual([fullEnv.systemName, fullEnv.provider, fullEnv.purpose, fullEnv.intendedUsers, fullEnv.architecture, fullEnv.trainingData, fullEnv.dataGovernance,
    fullEnv.riskManagement, fullEnv.accuracy, fullEnv.humanOversight, fullEnv.cybersecurity, fullEnv.logging, fullEnv.deployerInstructions, fullEnv.postMarketMonitoring],
    ['system_name', 'provider', 'purpose', 'users', 'architecture', 'training_data', 'data_governance', 'risk_mgmt', 'accuracy', 'human_oversight', 'cybersecurity', 'logging', 'instructions', 'post_market'].map((k) => 'V-' + k));
  assert.deepEqual(fullEnv.fields[0], { id: 'system_name', value: 'V-system_name', articleRef: 'Annex IV(1)(a)' });
  assert.equal((await createAnnexIV({}).export({ format: 'json' })).fields[0].value, null);
  await assert.rejects(doc.export({ format: 'pdf' }), /format must be one of: markdown, html, json/);
  await assert.rejects(doc.export({ language: 'pt' }), /language must be one of/);
  assert.equal(createAnnexIV(null).missing().length, 14);
  assert.equal(createAnnexIV({}, { draftWarning: false }).toJSON().opts.draftWarning, false);
  const kp = await generateKeypair();
  const { envelope, signature } = await doc.sign(kp.privateKey);
  assert.equal(envelope.language, 'en'); assert.equal(await verify(JSON.stringify(envelope), signature, kp.publicKey), true);
});

// ── Article 50 badge ────────────────────────────────────────────────────────────────────────────
test('createTransparencyBadge: category and language are checked, defaults fill in, the HTML escapes', async () => {
  assert.deepEqual(ARTICLE_50_CATEGORIES, ['chatbot', 'generated-text', 'generated-image', 'audio', 'video']);
  assert.throws(() => createTransparencyBadge(), /category must be one of/); assert.throws(() => createTransparencyBadge(null), /category must be one of/);
  assert.throws(() => createTransparencyBadge({ category: 'radio' }), /category must be one of/);
  assert.throws(() => createTransparencyBadge({ category: 'chatbot', language: 'pt' }), /language must be one of/);
  const b = createTransparencyBadge({ category: 'chatbot' });
  assert.deepEqual(b.toJSON(), { category: 'chatbot', language: 'en', systemId: 'unknown', optOutUrl: null, label: 'You are interacting with an AI · not a human.' });
  const h = b.html();
  assert.ok(h.includes('data-system-id="unknown"')); assert.ok(h.includes('font:12.5px/1.4')); assert.ok(h.includes('padding:6px 12px'));
  assert.ok(h.includes('background:#11131a;color:#e8e8ea')); assert.ok(!h.includes('<a href'));
  const c = b.html({ compact: true }); assert.ok(c.includes('font:11px/1.4')); assert.ok(c.includes('padding:3px 9px'));
  const de = createTransparencyBadge({ category: 'video', language: 'de', systemId: 'S<1>', optOutUrl: 'https://x.test/h?a=1&b=2', customLabel: 'KI <b>', styleVars: { bg: '#000' } });
  assert.equal(de.toJSON().language, 'de'); assert.equal(de.toJSON().label, 'KI <b>');
  const dh = de.html();
  assert.ok(dh.includes('data-system-id="S&lt;1&gt;"')); assert.ok(dh.includes('KI &lt;b&gt;')); assert.ok(dh.includes('href="https://x.test/h?a=1&amp;b=2"'));
  assert.ok(dh.includes('background:#000;color:#e8e8ea'));
});

test('badge: impressions record and export by date range, mount needs a browser, the signature verifies', async () => {
  const b = createTransparencyBadge({ category: 'audio', systemId: 'sys' });
  const e = await b.recordImpression('u1', { ts: 1000, page: 'p' });
  assert.deepEqual(e, { ts: 1000, userId: 'u1', systemId: 'sys', category: 'audio', language: 'en', page: 'p' });
  assert.equal((await b.recordImpression()).userId, 'anonymous');
  await b.recordImpression('u2', { ts: 2000 }); await b.recordImpression('u3', { ts: 999 }); await b.recordImpression('u4', { ts: 2001 });
  await b.recordImpression('future', { ts: Date.now() + 1e9 });
  const iso = (t) => new Date(t).toISOString();
  assert.deepEqual((await b.export({ from: iso(1000), to: iso(2000) })).map((x) => x.userId), ['u1', 'u2']);
  assert.deepEqual((await b.export({ to: iso(1000) })).map((x) => x.userId), ['u1', 'u3']);
  assert.ok(!(await b.export()).some((x) => x.userId === 'future'));
  assert.ok((await b.export({ from: iso(Date.now() - 60000) })).some((x) => x.userId === 'anonymous'));
  assert.throws(() => b.mount('#x'), /requires a browser environment/);
  const appended = []; const el = { appendChild: (n) => appended.push(n) };
  globalThis.document = { querySelector: (s) => (s === '#here' ? el : null), createElement: () => ({ set innerHTML(v) { this.firstChild = { html: v }; } }) };
  try {
    assert.equal(b.mount('#here'), el); assert.ok(appended[0].html.includes('class="ai-disclosure"'));
    assert.equal(b.mount(el, { compact: true }), el); assert.ok(appended[1].html.includes('font:11px'));
    assert.throws(() => b.mount('#missing'), /mount target not found: #missing/);
  } finally { delete globalThis.document; }
  const kp = await generateKeypair();
  const { envelope, signature } = await b.sign(kp.privateKey);
  assert.equal(envelope.kind, 'fall-euaiact-article50-badge-v1'); assert.equal(envelope.impressionsCount, 6);
  assert.equal(envelope.labelHash, createHash('sha256').update('This audio was generated by AI.').digest('hex'));
  assert.equal(await verify(JSON.stringify(envelope), signature, kp.publicKey), true);
});

// ── Ed25519 ─────────────────────────────────────────────────────────────────────────────────────
const SEED = '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60';
const PUB = 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';
const SIG = 'e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b';
test('sign / verify match RFC 8032 and refuse bad keys', async () => {
  assert.equal(await sign('', SEED), SIG); assert.equal(await sign('', SEED + PUB), SIG); assert.equal(await sign(new Uint8Array(0), SEED), SIG);
  assert.equal(await verify('', SIG, PUB), true); assert.equal(await verify('x', SIG, PUB), false); assert.equal(await verify(new Uint8Array(0), SIG, PUB), true);
  for (const [a, b, c] of [['', '', PUB], ['', SIG, ''], ['', 'zz', PUB], ['', SIG, 'zz'], ['', SIG.slice(2), PUB], [null, null, null]]) assert.equal(await verify(a, b, c), false);
  await assert.rejects(sign('x', ''), /requires a privateKeyHex/);
  await assert.rejects(sign('x', 'ab'), /32 or 64 bytes/);
  await assert.rejects(sign('x', SEED + 'zz'.repeat(32)), /not a hex string/);
  await assert.rejects(sign('x', SEED.slice(0, 63) + 'g'), /not a hex string/);
  const kp = await generateKeypair();
  assert.match(kp.publicKey, /^[0-9a-f]{64}$/); assert.match(kp.privateKey, /^[0-9a-f]{128}$/); assert.ok(kp.privateKey.endsWith(kp.publicKey));
  assert.equal(await verify('hello', await sign('hello', kp.privateKey), kp.publicKey), true);
  assert.equal(await verify('hello', await sign('hello', kp.privateKey.slice(0, 64)), kp.publicKey), true);
  assert.equal(SDK_VERSION, '1.2.0'); assert.match(SPEC_VERSION, /2026\/1744/);
});
