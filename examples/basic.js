// examples/basic.js · classify, read the obligations, seal the verdict, log it, sign it · run: node examples/basic.js
import { classifyText, obligationsFor, assess, verifyAssessment, createAuditShim, createAnnexIV, generateKeypair, sign, verify, SDK_VERSION } from '../src/index.js';

console.log('fall-euaiact-sdk v' + SDK_VERSION);
const text = 'An AI system that screens CVs and ranks job applicants for a recruitment agency.';
const r = classifyText(text);
const o = obligationsFor(r.tier);
console.log(`tier: ${r.tier} (${r.articles.join(', ')}) · obligations apply from ${o.deadline}`);
const sealed = assess(text, { at: '2026-11-17' });
console.log('sealed:', sealed.hash.slice(0, 16) + '…', 'verifies:', verifyAssessment(sealed).valid, '· altered verifies:', verifyAssessment({ ...sealed, tier: 'minimal' }).valid);
const log = createAuditShim({ sink: 'memory' });
await log.log({ type: 'classification', input: text, output: r.tier });
console.log('audit chain:', JSON.stringify(await log.verifyChain()));
const kp = await generateKeypair();
const doc = createAnnexIV({ system_name: 'CV Ranker v1', provider: 'Example Ltd', purpose: 'Ranking applicants' }, { date: '2026-11-17' });
const { envelope, signature } = await doc.sign(kp.privateKey);
console.log('Annex IV draft signed; signature verifies:', await verify(JSON.stringify(envelope), signature, kp.publicKey), '· missing fields:', doc.missing().length);
if (r.tier !== 'high' || o.deadline !== '2027-12-02' || !verifyAssessment(sealed).valid || !(await verify(JSON.stringify(envelope), signature, kp.publicKey))) { console.error('the example did not produce what it should'); process.exit(1); }
void sign;
