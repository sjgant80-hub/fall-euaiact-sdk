// fall-euaiact SDK · sovereign single-file library · MIT · AI-Native Solutions
// Extracted from fall-euaiact/index.html · 41373 bytes of source logic
// Public-safe: no primes/glyphs/dyad references

const PRIME = 607;
const KONOMI = { tier:'sovereign', minted:null, mintPending:true, prime:PRIME };
let bc;
try { bc = new BroadcastChannel('fall-signal'); } catch(_){}
function emit(kind, payload){ try{ bc && bc.postMessage({source:'fall-euaiact', kind, payload, prime:PRIME, ts:new Date().toISOString()}); }catch(_){} }
try { emit('fall_euaiact_online', { version:'1.0', prime:PRIME }); } catch(_){}
// ─── SAMPLES ───
const SAMPLES = [
  "An AI system that screens CVs for a recruitment agency. Takes uploaded CVs, scores each candidate 0-100 against the job description, ranks them, and rejects the bottom 50% automatically without human review.",
  "A customer support chatbot on an e-commerce website. Handles FAQs, order status, returns. Hands off to a human agent for complex issues. Discloses it's AI in the opening message.",
  "An AI scoring credit applications for a consumer lender. Combines income, employment, credit history, behavioural data to produce an approval/decline + suggested interest rate.",
  "A social scoring system for citizens that aggregates online behaviour, financial conduct, and social network activity into a single trust score that determines access to government services.",
  "An email spam filter that classifies incoming emails as spam or legit using bag-of-words and logistic regression. Falls back to a heuristic rule set when the model is uncertain.",
];
// ─── RISK CLASSIFIER (T0 keyword heuristic) ───
const RULES = [
  { tier:'prohibited', label:'PROHIBITED · Article 5',
    triggers:[
      { re:/social scor|citizen scor|trust score.*citizen/i, art:'5(1)(c)', note:'social scoring by public authorities' },
      { re:/predictive polic|assess.*risk.*committ.*crim/i, art:'5(1)(d)', note:'predictive policing on individuals' },
      { re:/scrap.*facial|facial.*scrap.*CCTV/i, art:'5(1)(e)', note:'untargeted scraping for facial recognition' },
      { re:/emotion recognition.*workplace|emotion.*employee|emotion.*school/i, art:'5(1)(f)', note:'emotion recognition in workplace/education' },
      { re:/biometric categor.*(?:race|religion|political|sexual)/i, art:'5(1)(g)', note:'biometric categorisation by sensitive attributes' },
      { re:/real.?time.*biometric.*public|real.?time.*facial.*recogn.*public/i, art:'5(1)(h)', note:'real-time remote biometric ID in public for LE' },
      { re:/subliminal|manipulat.*behaviour.*harm/i, art:'5(1)(a)', note:'subliminal/manipulative techniques causing harm' },
      { re:/exploit.*vulnerab.*(?:age|disability|economic)/i, art:'5(1)(b)', note:'exploitation of vulnerabilities' },
    ] },
  { tier:'high', label:'HIGH RISK · Annex III · Articles 6-15',
    triggers:[
      { re:/\b(cv|c\.v\.|resume|résumé)s?\b.{0,30}(screen|scor|rank|filter|reject)|screen.{0,30}\b(cv|c\.v\.|resume|résumé)s?\b|hire.*decision|hir.*algorithm|recruit.*(automat|agency|agent)|applicant.*scor/i, art:'Annex III(4)', note:'employment · CV screening · hiring' },
      { re:/performance evaluat|worker.*manag|task allocat.*algorithm|monitor.*employee/i, art:'Annex III(4)', note:'workplace performance evaluation' },
      { re:/credit.{0,20}(scoring|decision|approval|application|review|risk)|scor.{0,20}credit|loan.*decision|underwrit/i, art:'Annex III(5)', note:'access to essential financial services' },
      { re:/insurance.*pric|health.*insurance.*risk/i, art:'Annex III(5)', note:'insurance underwriting · health/life' },
      { re:/emergency.*dispatch|triage.*emerg/i, art:'Annex III(5)', note:'emergency service dispatch' },
      { re:/public benefit.*eligib|welfare.*decis|social.*assistance.*decis/i, art:'Annex III(5)', note:'eligibility for public benefits' },
      { re:/student.*admiss|exam.*scor.*automat|cheating detect.*exam/i, art:'Annex III(3)', note:'education · admissions/scoring/cheating' },
      { re:/critical infrastruct|grid.*manag|water.*manag.*AI|gas.*pipeline.*AI/i, art:'Annex III(2)', note:'critical infrastructure management' },
      { re:/law enforcement.*evid|criminal.*profil|crime.*analyt|polic.*risk.*assess/i, art:'Annex III(6)', note:'law enforcement (non-prohibited categories)' },
      { re:/migrat.*assess|asylum.*decis|border.*control.*AI|visa.*decis.*algorithm/i, art:'Annex III(7)', note:'migration / asylum / border control' },
      { re:/judicial.*decis|court.*ruling.*assist|democratic.*process.*influence/i, art:'Annex III(8)', note:'administration of justice / democracy' },
      { re:/biometric.*identif(?!.*public)|fingerprint.*match|face.*verif|voice.*identif/i, art:'Annex III(1)', note:'biometric identification (non-prohibited)' },
    ] },
  { tier:'limited', label:'LIMITED RISK · Article 50 transparency',
    triggers:[
      { re:/chatbot|customer support.*AI|conversation.*assistant|virtual.*agent/i, art:'50(1)', note:'chatbot · disclose AI to user' },
      { re:/deepfake|synthetic.*video|generated.*image|AI.*generated.*content|content.*manipulat/i, art:'50(4)', note:'deepfake / AI-generated content disclosure' },
      { re:/emotion recognition(?!.*workplace)/i, art:'50(3)', note:'emotion recognition (outside workplace) disclosure' },
      { re:/biometric categor/i, art:'50(3)', note:'biometric categorisation disclosure' },
      { re:/AI.*generated.*text.*(?:news|public|article)/i, art:'50(4)', note:'AI-generated public interest text disclosure' },
    ] },
];
function classify(){
  if (!text){ alert('paste a system description first'); return; }
  let bestTier = 'minimal', bestLabel = 'MINIMAL RISK · default tier', hits = [];
  // run all tiers in priority order · prohibited > high > limited > minimal
  for (const tier of RULES) {
    for (const trig of tier.triggers) {
      if (trig.re.test(text)) hits.push({ tier: tier.tier, label: tier.label, ...trig });
    }
    if (hits.some(h => h.tier === tier.tier)) {
      bestTier = tier.tier; bestLabel = tier.label;
      break;
    }
  }
  v.className = 'verdict show ' + bestTier;
  const tierHits = hits.filter(h => h.tier === bestTier);
  const confidence = tierHits.length === 0 ? 'low (no specific triggers · default to minimal)' :
                     tierHits.length === 1 ? 'one trigger matched · moderate confidence' :
                     tierHits.length + ' triggers matched · high confidence';
  let html = `<h3>${bestLabel}</h3>`;
  html += `<div class="conf">${confidence}</div>`;
  if (tierHits.length){
    html += `<div class="triggers">${tierHits.map(h => `<span class="trig">${h.note}</span>`).join('')}</div>`;
    html += `<h4>Read these articles</h4><ul>`;
    const arts = [...new Set(tierHits.map(h => h.art))];
    for (const a of arts) html += `<li>Article <code>${a}</code></li>`;
    html += `</ul>`;
  }
  // estate bridges · broadcast to sibling tools
  const lastVerdict = { tier: bestTier, label: bestLabel, triggers: tierHits.map(h => ({ note: h.note, article: h.art })), articles: [...new Set(tierHits.map(h => h.art))], confidence: tierHits.length === 0 ? 0 : Math.min(95, 40 + tierHits.length * 20) };
  html += `<h4>Send to estate sibling</h4>`;
  html += `<button class="ghost small" onclick='bridgeToLegalmon(${JSON.stringify(lastVerdict).replace(/'/g, "&apos;")}, "Your AI System")'>◐ Battle in Legalmon</button></div>`;
  if (bestTier === 'prohibited'){
    html += `<h4>Action</h4><p>Do not deploy in the EU. Re-scope the use case OR remove the prohibited element. If you need to argue an exception, get written legal opinion first.</p>`;
  } else if (bestTier === 'high'){
    html += `<h4>Action</h4><p>You're in the high-risk regime. Read Articles 8-15 + Article 26 (deployer obligations). Complete the Annex IV documentation checklist below. Compliance deadline: <code>2 Dec 2027</code> (Annex III; <code>2 Aug 2028</code> for AI in products covered by Annex I), after Regulation (EU) 2026/1744.</p>`;
  } else if (bestTier === 'limited'){
    html += `<h4>Action</h4><p>Add the transparency disclosure required by Article 50 — see the badge generator below. Most other obligations don't apply.</p>`;
  } else {
    html += `<h4>Action</h4><p>Minimal risk · no specific AI Act obligations beyond voluntary codes of conduct. Other EU law (GDPR · Product Safety · sectoral rules) still applies.</p>`;
  }
  v.innerHTML = html;
  emit('fall_euaiact_classified', { tier: bestTier, trigger_count: tierHits.length });
  logEntry(text, bestTier, bestLabel, tierHits.map(h => h.art));
}
// ─── ARTICLE SEARCH ───
function filterArticles(){
    const tags = d.dataset.tags || '';
    const txt = d.textContent.toLowerCase();
    d.style.display = (!q || tags.includes(q) || txt.includes(q)) ? 'block' : 'none';
  });
}
// ─── BADGE GENERATOR ───
const BADGES = {
  emotion:   { glyph:'◐', text:'Emotion recognition active', code:'<div role="status" aria-label="Emotion recognition disclosure">◐ This system uses emotion recognition · per EU AI Act Article 50(3)</div>' },
  biometric: { glyph:'●', text:'Biometric categorisation active', code:'<div role="status" aria-label="Biometric categorisation disclosure">● This system uses biometric categorisation · per EU AI Act Article 50(3)</div>' },
  deepfake:  { glyph:'△', text:'AI-generated / manipulated content', code:'<div role="status" aria-label="AI-generated content disclosure">△ This content is AI-generated or manipulated · per EU AI Act Article 50(4)</div>' },
  public:    { glyph:'〜', text:'AI-generated public-interest text', code:'<div role="status" aria-label="AI text disclosure">〜 This text is AI-generated · per EU AI Act Article 50(4)</div>' },
};
function renderBadge(){
  const b = BADGES[t];
  out.style.display = 'inline-flex';
  out.innerHTML = `<span class="b">${b.glyph}</span> <span>${b.text}</span>`;
  code.style.display = 'block';
  code.innerHTML = '<button class="copy" onclick="copySnippet(this)">copy</button>' + b.code.replace(/</g, '&lt;');
  emit('fall_euaiact_badge_generated', { type: t });
}
// ─── COPY snippet ───
function copySnippet(btn){
  const txt = btn.parentElement.innerText.replace(/copy$/, '').trim();
  navigator.clipboard.writeText(txt).then(()=>{
    btn.textContent='copied';
    setTimeout(()=>btn.textContent='copy', 1200);
  }).catch(()=>prompt('Copy:', txt));
}
// ─── ANNEX IV CHECKLIST ───
const CHECK_ITEMS = [
  { lab:'General description', art:'Annex IV(1)', desc:'intended purpose · provider · version · interactions with other systems' },
  { lab:'System architecture', art:'Annex IV(2)(a)', desc:'computational resources · model architecture · training methods' },
  { lab:'Data governance documented', art:'Article 10 + IV(2)(d)', desc:'training data sources · annotation · curation · representativeness · bias examination' },
  { lab:'Risk management system', art:'Article 9 + IV(2)(f)', desc:'identified risks · mitigation measures · residual risks · tested' },
  { lab:'Validation & testing report', art:'Annex IV(2)(g)', desc:'metrics · test datasets · results against accuracy/robustness/cybersecurity' },
  { lab:'Cybersecurity measures', art:'Article 15 + IV(2)(h)', desc:'protection against adversarial examples · data poisoning · model evasion' },
  { lab:'Performance per group', art:'Annex IV(3)', desc:'metrics broken down by gender · age · race · disability where relevant' },
  { lab:'Human oversight measures', art:'Article 14 + IV(2)(e)', desc:'how oversight is enabled · stop mechanism · override capacity · automation bias awareness' },
  { lab:'Predictable changes / lifecycle', art:'Annex IV(2)(i)', desc:'planned updates · retraining · how performance is maintained' },
  { lab:'Instructions for deployers', art:'Article 13', desc:'capacity · limitations · accuracy levels · risks · oversight setup' },
  { lab:'EU declaration of conformity', art:'Article 47', desc:'signed · contact details · conformity statement · standards applied' },
  { lab:'Logging design', art:'Article 12', desc:'what events are logged · retention · access · structure (see drop-in shim)' },
  { lab:'Post-market monitoring plan', art:'Article 72', desc:'how performance/risks are monitored after deployment · who reviews · cadence' },
  { lab:'Serious incident reporting process', art:'Article 73', desc:'how serious incidents are detected · 15-day reporting to authority · investigation' },
];
function renderChecklist(){
    <label><input type="checkbox" data-i="${i}" onchange="updateCheck()"><div><div class="lab">${it.lab} <span class="art">${it.art}</span></div><div class="desc">${it.desc}</div></div></label>
  `).join('');
  loadCheckState();
}
function updateCheck(){
  const done = Array.from(boxes).filter(b => b.checked).length;
  const total = boxes.length;
  el.textContent = done === total ? `✓ ${done}/${total} documented · ready for conformity assessment` : `${done} / ${total} documented`;
  el.classList.toggle('ready', done === total);
  // persist
  try {
    const state = Array.from(boxes).map(b => b.checked);
    localStorage.setItem('euaiact_checklist', JSON.stringify(state));
  } catch(_){}
  emit('fall_euaiact_checklist_progress', { done, total });
}
function loadCheckState(){
  try {
    const state = JSON.parse(localStorage.getItem('euaiact_checklist') || '[]');
      if (state[i]) b.checked = true;
    });
    updateCheck();
  } catch(_){}
}
// ─── IndexedDB classification log ───
const DB = 'fall-euaiact';
let db;
function openDb(){
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('log')) d.createObjectStore('log', { keyPath:'id', autoIncrement:true });
    };
    r.onsuccess = e => { db = e.target.result; res(db); };
    r.onerror = e => rej(e.target.error);
  });
}
async function logEntry(text, tier, label, articles){
  if (!db) await openDb();
  const e = { ts:new Date().toISOString(), excerpt: text.slice(0, 200), tier, label, articles };
  const tx = db.transaction('log','readwrite');
  tx.objectStore('log').add(e);
  tx.oncomplete = renderLog;
}
async function renderLog(){
  if (!db) await openDb();
  const tx = db.transaction('log','readonly');
  const r = tx.objectStore('log').getAll();
  r.onsuccess = () => {
    const all = r.result.slice().reverse().slice(0, 30);
    if (!all.length){ el.innerHTML = '<div class="empty">No classifications yet · paste a description above to start</div>'; return; }
    el.innerHTML = all.map(e => `
      <div class="log-entry">
        <div class="ts">${e.ts.replace('T',' ').slice(0,19)} <span class="tier ${e.tier}">${e.tier}</span></div>
        <div class="what">${escapeHtml(e.excerpt)}${e.excerpt.length >= 200 ? '…' : ''}</div>
        <div class="ts" style="margin-top:4px">articles: ${(e.articles||[]).join(' · ') || '—'}</div>
      </div>`).join('');
  };
}
async function clearLog(){
  if (!confirm('clear classification log?')) return;
  if (!db) await openDb();
  const tx = db.transaction('log','readwrite');
  tx.objectStore('log').clear();
  tx.oncomplete = renderLog;
}
async function exportLog(){
  if (!db) await openDb();
  const tx = db.transaction('log','readonly');
  const r = tx.objectStore('log').getAll();
  r.onsuccess = () => {
    const blob = new Blob([JSON.stringify(r.result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'euaiact-classifications-' + new Date().toISOString().slice(0,10) + '.json'; a.click();
    URL.revokeObjectURL(url);
  };
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
// ─── ESTATE BRIDGES · broadcast classifications to sibling tools ───
function bridgeToFallBrief(verdict, sysDesc){
  try {
    if (!bc) return alert('fall-signal mesh not available');
    bc.postMessage({
      type: 'fall_signal', source: 'fall-euaiact', target: 'fallbrief',
      kind: 'euaia_classification',
      payload: {
        agent: 'BRUSSELS', domain: 'EU AI Act · Regulation 2024/1689',
        query_type: 'compliance_classification',
        tier: verdict.tier, system_description: sysDesc,
        confidence: verdict.confidence, articles_to_research: verdict.articles,
        triggers: verdict.triggers, reasoning: verdict.label,
      },
      ts: new Date().toISOString(),
    });
  } catch(e){ alert('bridge failed: ' + e.message); }
}
function bridgeToLegalmon(verdict, sysName){
  try {
    if (!bc) return alert('fall-signal mesh not available');
    const tierMeta = {
      prohibited: { hp: 30, arena: 'Brussels Tribunal · Article 5 Forbidden Zone', opp_hp: 200, opp_name: 'EU AI Office · Enforcement Squad' },
      high:       { hp: 100, arena: 'Annex III Battle Stadium', opp_hp: 150, opp_name: 'EU AI Office · High-Risk Reviewer' },
      limited:    { hp: 120, arena: 'Article 50 Disclosure Beach', opp_hp: 60, opp_name: 'Light Touch Inspector' },
      minimal:    { hp: 200, arena: 'Minimal Risk Park', opp_hp: 30, opp_name: 'Voluntary Code Volunteer' },
    }[verdict.tier] || {};
    bc.postMessage({
      type: 'fall_signal', source: 'fall-euaiact', target: 'legalmon',
      kind: 'euaia_battle_request',
      payload: {
        battle_id: `euaia-${verdict.tier}-${Date.now()}`,
        title: `${sysName} vs EU AI Office`,
        arena: tierMeta.arena,
        your_pokemon: { name: sysName, hp: tierMeta.hp, moves: (verdict.articles || []).map(a => ({ name: `Article ${a}`, type: 'Compliance' })) },
        opponent_pokemon: { name: tierMeta.opp_name, hp: tierMeta.opp_hp },
        metadata: { source: 'fall-euaiact', tier: verdict.tier, confidence: verdict.confidence },
      },
      ts: new Date().toISOString(),
    });
    alert('◐ broadcast to Legalmon · open Legalmon (teslasolar/Legalmon) to render the battle');
  } catch(e){ alert('bridge failed: ' + e.message); }
}
// ─── i18n (UI strings only · article text stays in English with EUR-Lex links) ───
const I18N = {
  en: { byok_h:'Settings · BYOK deep classifier', byok_intro:'T0 keyword classifier always runs (offline · no key). T2 adds LLM-powered deeper analysis using your own API key. Key stays in localStorage on your device · never sent anywhere except the provider you choose.', provider:'Provider', apikey:'API key', save:'Save settings', clear_key:'Clear key', classifier_h:'Risk classifier', classifier_intro:'Paste a plain-English description of what your AI system does. The classifier matches against the Act\'s risk tiers and returns the most-likely category with the article cites you need to read.', classifier_ph:'Example: An AI system that screens CVs for a recruitment agency. Takes uploaded CVs, scores each candidate 0-100 against the job description, ranks them, and rejects the bottom 50% automatically without human review.', classify_btn:'Classify', deep_btn:'Deep classify (LLM)', clear_btn:'Clear', disclaimer:'RESEARCH ONLY · NOT LEGAL ADVICE · verify with counsel', docgen_h:'Annex IV documentation generator', docgen_intro:'Fill in each field. Output is a downloadable Markdown document structured per Annex IV. Use as the starting draft for your technical documentation file.', docgen_btn:'Generate Markdown', docgen_clear:'Clear form', docgen_download:'Download .md' },
  de: { byok_h:'Einstellungen · BYOK tiefer Klassifikator', byok_intro:'Der T0-Schlüsselwort-Klassifikator läuft immer (offline · kein Schlüssel). T2 fügt LLM-gestützte tiefere Analyse mit Ihrem eigenen API-Schlüssel hinzu. Der Schlüssel bleibt im localStorage Ihres Geräts · wird nirgendwohin gesendet außer zum gewählten Anbieter.', provider:'Anbieter', apikey:'API-Schlüssel', save:'Einstellungen speichern', clear_key:'Schlüssel löschen', classifier_h:'Risikoklassifikator', classifier_intro:'Fügen Sie eine Beschreibung Ihres KI-Systems in einfacher Sprache ein. Der Klassifikator gleicht mit den Risikostufen ab und gibt die wahrscheinlichste Kategorie mit den relevanten Artikeln zurück.', classifier_ph:'Beispiel: Ein KI-System, das Lebensläufe für eine Personalvermittlung prüft...', classify_btn:'Klassifizieren', deep_btn:'Tiefe Klassifikation (LLM)', clear_btn:'Leeren', disclaimer:'NUR ZUR RECHERCHE · KEINE RECHTSBERATUNG · mit Anwalt prüfen', docgen_h:'Anhang-IV-Dokumentationsgenerator', docgen_intro:'Füllen Sie jedes Feld aus. Die Ausgabe ist ein herunterladbares Markdown-Dokument gemäß Anhang IV.', docgen_btn:'Markdown generieren', docgen_clear:'Formular leeren', docgen_download:'.md herunterladen' },
  fr: { byok_h:'Paramètres · classificateur approfondi BYOK', byok_intro:'Le classificateur de mots-clés T0 fonctionne toujours (hors ligne · sans clé). T2 ajoute une analyse approfondie par LLM avec votre propre clé API. La clé reste dans le localStorage de votre appareil · n\'est jamais envoyée ailleurs que chez le fournisseur choisi.', provider:'Fournisseur', apikey:'Clé API', save:'Enregistrer', clear_key:'Effacer la clé', classifier_h:'Classificateur de risque', classifier_intro:'Collez une description en langage simple de ce que fait votre système d\'IA. Le classificateur correspond aux niveaux de risque de la Loi et renvoie la catégorie la plus probable avec les articles à lire.', classifier_ph:'Exemple : Un système d\'IA qui examine les CV pour une agence de recrutement...', classify_btn:'Classifier', deep_btn:'Classification approfondie (LLM)', clear_btn:'Effacer', disclaimer:'RECHERCHE UNIQUEMENT · PAS UN CONSEIL JURIDIQUE · vérifier avec un avocat', docgen_h:'Générateur de documentation Annexe IV', docgen_intro:'Remplissez chaque champ. La sortie est un document Markdown téléchargeable structuré selon l\'Annexe IV.', docgen_btn:'Générer Markdown', docgen_clear:'Effacer', docgen_download:'Télécharger .md' },
  es: { byok_h:'Configuración · clasificador profundo BYOK', byok_intro:'El clasificador de palabras clave T0 siempre se ejecuta (sin conexión · sin clave). T2 añade análisis profundo con LLM usando tu propia clave API. La clave permanece en el localStorage de tu dispositivo · nunca se envía a ningún sitio excepto al proveedor que elijas.', provider:'Proveedor', apikey:'Clave API', save:'Guardar', clear_key:'Borrar clave', classifier_h:'Clasificador de riesgo', classifier_intro:'Pega una descripción en lenguaje sencillo de lo que hace tu sistema de IA. El clasificador compara con los niveles de riesgo de la Ley y devuelve la categoría más probable con los artículos a leer.', classifier_ph:'Ejemplo: Un sistema de IA que filtra CVs para una agencia de reclutamiento...', classify_btn:'Clasificar', deep_btn:'Clasificación profunda (LLM)', clear_btn:'Limpiar', disclaimer:'SOLO INVESTIGACIÓN · NO ASESORAMIENTO LEGAL · verificar con abogado', docgen_h:'Generador de documentación Anexo IV', docgen_intro:'Rellena cada campo. La salida es un documento Markdown descargable estructurado según el Anexo IV.', docgen_btn:'Generar Markdown', docgen_clear:'Limpiar formulario', docgen_download:'Descargar .md' },
  nl: { byok_h:'Instellingen · BYOK diepe classificeerder', byok_intro:'De T0-trefwoordclassificeerder draait altijd (offline · geen sleutel). T2 voegt LLM-aangedreven diepere analyse toe met je eigen API-sleutel. De sleutel blijft in de localStorage van je apparaat · wordt nergens anders heen verzonden dan naar de gekozen provider.', provider:'Provider', apikey:'API-sleutel', save:'Opslaan', clear_key:'Sleutel wissen', classifier_h:'Risicoclassificeerder', classifier_intro:'Plak een eenvoudige beschrijving van wat je AI-systeem doet. De classificeerder vergelijkt met de risiconiveaus van de Wet en geeft de meest waarschijnlijke categorie terug.', classifier_ph:'Voorbeeld: Een AI-systeem dat CV\'s screent voor een uitzendbureau...', classify_btn:'Classificeren', deep_btn:'Diepe classificatie (LLM)', clear_btn:'Wissen', disclaimer:'ALLEEN ONDERZOEK · GEEN JURIDISCH ADVIES · verifieer met advocaat', docgen_h:'Bijlage IV documentatiegenerator', docgen_intro:'Vul elk veld in. De output is een downloadbaar Markdown-document gestructureerd volgens Bijlage IV.', docgen_btn:'Markdown genereren', docgen_clear:'Formulier wissen', docgen_download:'.md downloaden' },
  pl: { byok_h:'Ustawienia · głęboki klasyfikator BYOK', byok_intro:'Klasyfikator słów kluczowych T0 zawsze działa (offline · bez klucza). T2 dodaje głębszą analizę LLM z użyciem własnego klucza API. Klucz pozostaje w localStorage Twojego urządzenia · nigdy nie jest wysyłany nigdzie poza wybranym dostawcą.', provider:'Dostawca', apikey:'Klucz API', save:'Zapisz', clear_key:'Wyczyść klucz', classifier_h:'Klasyfikator ryzyka', classifier_intro:'Wklej opis swojego systemu AI prostym językiem. Klasyfikator dopasowuje do poziomów ryzyka Aktu i zwraca najbardziej prawdopodobną kategorię.', classifier_ph:'Przykład: System AI przesiewający CV dla agencji rekrutacyjnej...', classify_btn:'Klasyfikuj', deep_btn:'Głęboka klasyfikacja (LLM)', clear_btn:'Wyczyść', disclaimer:'TYLKO BADANIA · NIE PORADA PRAWNA · zweryfikuj z prawnikiem', docgen_h:'Generator dokumentacji Załącznika IV', docgen_intro:'Wypełnij każde pole. Wynik to pobierany dokument Markdown według Załącznika IV.', docgen_btn:'Generuj Markdown', docgen_clear:'Wyczyść formularz', docgen_download:'Pobierz .md' },
};
function setLang(lang){
  const t = I18N[lang] || I18N.en;
  document.documentElement.lang = lang;
  try { localStorage.setItem('euaiact_lang', lang); } catch(_){}
}
// ─── BYOK keys ───
function saveKey(){
  try {
    localStorage.setItem('euaiact_provider', p);
    if (k) localStorage.setItem('euaiact_apikey_' + p, k);
}
function clearKey(){
  try {
    const p = localStorage.getItem('euaiact_provider');
    if (p) localStorage.removeItem('euaiact_apikey_' + p);
    localStorage.removeItem('euaiact_provider');
  } catch(_){}
}
// ─── T2 DEEP CLASSIFY (BYOK) ───
const DEEP_PROMPT = `You are an EU AI Act (Regulation 2024/1689) compliance analyst. Given a description of an AI system, return a JSON object with this exact shape:
{
  "tier": "prohibited" | "high" | "limited" | "minimal",
  "confidence": 0-100,
  "articles": ["5(1)(c)", "Annex III(4)", ...],
  "reasoning": "2-4 sentences explaining the classification",
  "key_risks": ["risk 1", "risk 2", ...],
  "next_steps": ["concrete action 1", "concrete action 2", ...]
}
The tiers:
- prohibited: matches Article 5 (social scoring, predictive policing, untargeted facial scraping, workplace emotion recognition, biometric categorisation by sensitive attributes, real-time biometric ID in public for LE, subliminal manipulation, exploitation of vulnerabilities)
- high: matches Annex III (biometrics, critical infrastructure, education, employment, essential services like credit, law enforcement, migration, justice/democracy)
- limited: matches Article 50 (chatbots, deepfakes, emotion recognition outside workplace, biometric categorisation, AI-generated public-interest text)
- minimal: everything else
Be honest about confidence. If the description is ambiguous, say so in reasoning. Return ONLY the JSON object, no markdown, no preamble.`;
async function deepClassify(){
  if (!text){ alert('paste a system description first'); return; }
  const provider = localStorage.getItem('euaiact_provider');
  const key = provider && localStorage.getItem('euaiact_apikey_' + provider);
  if (!provider || !key){ alert('configure BYOK provider + API key in Settings first'); return; }
  out.className = 'verdict show';
  out.style.borderLeftColor = 'var(--gold)';
  out.innerHTML = '<h3 style="color:var(--gold)">Deep classifying...</h3><div class="conf">querying ' + provider + '...</div>';
  try {
    let result;
    if (provider === 'anthropic'){
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body: JSON.stringify({ model:'claude-3-5-sonnet-20241022', max_tokens:800, messages:[{role:'user', content: DEEP_PROMPT + '\n\nSystem description:\n' + text}] })
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error.message || 'API error');
      result = JSON.parse((data.content?.[0]?.text || '{}').replace(/^```json\s*|\s*```$/g, ''));
    } else if (provider === 'openai'){
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST', headers:{'content-type':'application/json','authorization':'Bearer '+key},
        body: JSON.stringify({ model:'gpt-4o-mini', messages:[{role:'system', content: DEEP_PROMPT},{role:'user', content: text}], response_format:{type:'json_object'} })
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error.message || 'API error');
      result = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    } else if (provider === 'google'){
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({ contents:[{parts:[{text: DEEP_PROMPT + '\n\nSystem description:\n' + text}]}], generationConfig:{responseMimeType:'application/json'} })
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error.message || 'API error');
      result = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
    }
    const tier = result.tier || 'minimal';
    out.className = 'verdict show ' + tier;
    let html = `<h3>LLM verdict · ${(tier+'').toUpperCase()} RISK</h3>`;
    html += `<div class="conf">${provider} · confidence ${result.confidence || '?'}% · LLM analysis (BYOK)</div>`;
    html += `<div class="why">${escapeHtml(result.reasoning || '')}</div>`;
    if (result.articles?.length){ html += `<h4>Articles cited</h4><ul>${result.articles.map(a=>`<li><code>${escapeHtml(a)}</code></li>`).join('')}</ul>`; }
    if (result.key_risks?.length){ html += `<h4>Key risks</h4><ul>${result.key_risks.map(r=>`<li>${escapeHtml(r)}</li>`).join('')}</ul>`; }
    if (result.next_steps?.length){ html += `<h4>Next steps</h4><ul>${result.next_steps.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ul>`; }
    out.innerHTML = html;
    emit('fall_euaiact_deep_classified', { tier, confidence: result.confidence, provider });
  } catch(e){
    out.innerHTML = `<h3 style="color:var(--red)">Deep classify failed</h3><div class="conf">${escapeHtml(e.message)}</div><p style="color:var(--cream);font-size:0.88rem;margin-top:8px">Check your API key and provider in Settings. T0 verdict above is still valid.</p>`;
  }
}
// ─── ANNEX IV DOC GENERATOR ───
const DOC_FIELDS = [
  { id:'system_name', q:'System name & version', placeholder:'e.g. FallVet CV Scorer v2.3', art:'Annex IV(1)(a)' },
  { id:'provider', q:'Provider name + address + contact', placeholder:'Your company name · registered address · contact email', art:'Annex IV(1)(a)' },
  { id:'purpose', q:'Intended purpose (specific use case)', placeholder:'Scoring software-engineer CVs against role specifications for a SaaS company recruitment agency in Germany', art:'Annex IV(1)(b)' },
  { id:'users', q:'Intended users + deployment context', placeholder:'In-house recruiters at Acme GmbH · screen 200-500 applications per month · German labour market', art:'Annex IV(1)(c)' },
  { id:'architecture', q:'System architecture · models · components', placeholder:'TF-IDF + logistic regression baseline · BERT embedding similarity for skills match · scoring rubric weighted blend · all runs in browser', art:'Annex IV(2)(a)' },
  { id:'training_data', q:'Training data origin · curation · annotation', placeholder:'5000 anonymised CVs + role pairings · sourced from public CV-sharing datasets + synthetic augmentation · annotated by 3 senior recruiters with calibration', art:'Annex IV(2)(d)' },
  { id:'data_governance', q:'Data governance · bias examination', placeholder:'Gender/age/ethnicity-blind labelling protocol · group-fairness metrics (TPR · FPR) measured per protected attribute · quarterly audit', art:'Article 10' },
  { id:'risk_mgmt', q:'Risk management system (identified risks + mitigations)', placeholder:'Risk: bias against career gaps → mitigation: explicit feature exclusion + recruiter review threshold · Risk: data drift → mitigation: monthly retraining on fresh labels', art:'Article 9' },
  { id:'accuracy', q:'Accuracy metrics + test datasets + results', placeholder:'F1 = 0.83 on held-out test (n=500) · ROC-AUC = 0.91 · calibrated against recruiter judgment · per-group F1 in appendix', art:'Article 15' },
  { id:'human_oversight', q:'Human oversight measures (Article 14)', placeholder:'Threshold gate: scores < 60 reviewed by senior recruiter before rejection · clear-stop UI button visible at all times · audit log of every override', art:'Article 14' },
  { id:'cybersecurity', q:'Cybersecurity measures', placeholder:'Input sanitisation against prompt injection · adversarial test against typo / obfuscated CVs · runs client-side so no API attack surface · CSP headers enforced', art:'Article 15' },
  { id:'logging', q:'Logging design (Article 12)', placeholder:'Every inference logged: timestamp · input hash · output score · operator ID · prevHash chain (SHA-256). Retained for 12 months in IndexedDB + monthly cold export.', art:'Article 12' },
  { id:'instructions', q:'Instructions for deployers', placeholder:'User guide v1.0 · explains limitations (no protected-attribute inference) · threshold tuning guidance · escalation paths · provided as part of onboarding kit', art:'Article 13' },
  { id:'post_market', q:'Post-market monitoring + serious incident reporting', placeholder:'Weekly performance dashboard reviewed by ML team · 24h triage SLA for any group-fairness regression · serious incident process documented · authority contact list maintained', art:'Articles 72-73' },
];
function renderDocForm(){
  const html = DOC_FIELDS.map(f => `
    <div>
      <label style="display:block;color:var(--brass);font-family:'Libre Baskerville',serif;font-size:0.95rem;margin-bottom:4px">${f.q} <span style="color:var(--gold);font-family:'IBM Plex Mono',monospace;font-size:0.75rem;margin-left:6px">${f.art}</span></label>
      <textarea id="doc_${f.id}" placeholder="${f.placeholder}" oninput="saveDocField('${f.id}')" style="min-height:70px"></textarea>
    </div>`).join('');
  loadDocFields();
}
function saveDocField(id){
}
function loadDocFields(){
  try {
    DOC_FIELDS.forEach(f => {
      const v = localStorage.getItem('euaiact_doc_' + f.id);
    });
  } catch(_){}
}
function clearDocForm(){
  if (!confirm('clear all documentation fields?')) return;
}
function generateDoc(){
  const today = new Date().toISOString().slice(0,10);
  const values = {};
  let md = `# Technical Documentation · EU AI Act Annex IV\n\n`;
  md += `> Generated: ${today} · per Regulation (EU) 2024/1689 · DRAFT\n\n`;
  md += `> This is a starting draft generated by fall-euaiact. Review with qualified counsel before use as official conformity documentation.\n\n`;
  md += `---\n\n## 1 · General description\n\n`;
  md += `**System name & version:** ${values.system_name || '_[fill in]_'}\n\n`;
  md += `**Provider:** ${values.provider || '_[fill in]_'}\n\n`;
  md += `**Intended purpose:** ${values.purpose || '_[fill in]_'}\n\n`;
  md += `**Intended users + deployment context:** ${values.users || '_[fill in]_'}\n\n`;
  md += `---\n\n## 2 · Description of system elements\n\n`;
  md += `### 2.1 Architecture & components\n\n${values.architecture || '_[fill in]_'}\n\n`;
  md += `### 2.2 Training data (Article 10)\n\n${values.training_data || '_[fill in]_'}\n\n`;
  md += `### 2.3 Data governance & bias examination\n\n${values.data_governance || '_[fill in]_'}\n\n`;
  md += `### 2.4 Risk management system (Article 9)\n\n${values.risk_mgmt || '_[fill in]_'}\n\n`;
  md += `### 2.5 Accuracy, robustness & cybersecurity (Article 15)\n\n**Accuracy:** ${values.accuracy || '_[fill in]_'}\n\n`;
  md += `**Cybersecurity:** ${values.cybersecurity || '_[fill in]_'}\n\n`;
  md += `### 2.6 Human oversight (Article 14)\n\n${values.human_oversight || '_[fill in]_'}\n\n`;
  md += `### 2.7 Logging (Article 12)\n\n${values.logging || '_[fill in]_'}\n\n`;
  md += `---\n\n## 3 · Instructions for deployers (Article 13)\n\n${values.instructions || '_[fill in]_'}\n\n`;
  md += `---\n\n## 4 · Post-market monitoring & incident reporting (Articles 72-73)\n\n${values.post_market || '_[fill in]_'}\n\n`;
  md += `---\n\n## 5 · EU Declaration of Conformity (Article 47)\n\n_To be signed by the provider once all other sections are complete and verified by qualified counsel._\n\n`;
  md += `- Name & address of provider: _[fill in]_\n`;
  md += `- AI system identification: ${values.system_name || '_[fill in]_'}\n`;
  md += `- Declaration of conformity with Regulation (EU) 2024/1689\n`;
  md += `- Harmonised standards applied: _[list if applicable]_\n`;
  md += `- Date · Place · Signature\n\n`;
  md += `---\n\n_Generated by fall-euaiact (prime 607) · MIT · sjgant80-hub.github.io/fall-euaiact_\n`;
  emit('fall_euaiact_doc_generated', { fields_filled: Object.values(values).filter(Boolean).length, total: DOC_FIELDS.length });
}
function downloadDoc(){
  const blob = new Blob([md], { type:'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}-annex-iv-${new Date().toISOString().slice(0,10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
// init
renderChecklist();
renderDocForm();
openDb().then(renderLog).catch(()=>{});
// load saved BYOK + language
try {
  const p = localStorage.getItem('euaiact_provider') || '';
  if (p && localStorage.getItem('euaiact_apikey_' + p)){
  }
  const lang = localStorage.getItem('euaiact_lang') || 'en';
  if (lang !== 'en') setLang(lang);
} catch(_){}

// Named exports for the primary API surface
export { emit };
export { loadSample };
export { clearClassify };
export { classify };
export { filterArticles };
export { renderBadge };
export { copySnippet };
export { renderChecklist };
export { updateCheck };
export { loadCheckState };

export { PRIME };
export { KONOMI };
export { SAMPLES };
export { RULES };
export { BADGES };
export { CHECK_ITEMS };
export { DB };
export { I18N };
export { DEEP_PROMPT };
export { DOC_FIELDS };
