/* GENESIS web app. The browser only shows data from the backend and sends the user's requests to it. */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n, d = 0) => Number(n).toLocaleString(undefined, { maximumFractionDigits: d });
let S = null, C = null, mode = 'observe', sel = null, placing = null, chartKey = 'population', hist = [], ws = null, lastDay = -1;
let X = { pol: [], res: null, exp: null, snaps: [], branches: [] }, cmpSel = new Set(['main']), cmpResult = null, panelBusy = false;

async function api(path, method = 'GET', body) {
  const r = await fetch('/api' + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  let d = {}; try { d = await r.json(); } catch (e) { }
  if (!r.ok) throw new Error(typeof d.detail === 'string' ? d.detail : 'Please check your input and try again.');
  return d;
}
function toast(msg, err) { const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg; $('#toasts').appendChild(t); setTimeout(() => t.remove(), err ? 6000 : 3500); }
async function guard(fn) { try { return await fn(); } catch (e) { toast(e.message, true); } }
function openModal(html) { $('#modalBox').innerHTML = html; $('#modal').hidden = false; const b = $('#modalBox button'); if (b) b.focus(); }
function closeModal() { $('#modal').hidden = true; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); cancelPlace(); } });
const pill = (st, t) => `<span class="pill ${esc(st)}">${esc(t)}</span>`;
const LBL = { good: 'Healthy', warn: 'Needs attention', bad: 'Critical', info: 'Info' };

/* ---------------- connection ---------------- */
function connect() {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.type === 'state') onState(m.data); };
  ws.onclose = () => setTimeout(connect, 2000);
}
async function refreshState() { onState(await api('/state')); }
async function refreshExtras() {
  const [pol, res, exp, snaps, br] = await Promise.all([api('/policies'), api('/research'), api('/experiments'), api('/snapshots'), api('/branches')]);
  X = { pol, res, exp, snaps, branches: br }; if (mode === 'control') renderPanel();
}
async function loadHistory() { hist = await api('/history?limit=400'); if (mode === 'observe') renderPanel(); }

function onState(st) {
  S = st; $('#loading').hidden = true;
  World3D.update(st); renderClock();
  const dayChanged = st.meta.day !== lastDay;
  if (dayChanged) { lastDay = st.meta.day; loadHistory(); refreshExtras().catch(() => { }); if (sel) reselect(); }
  renderPanel();
}
function renderClock() {
  const m = S.meta, yr = Math.floor(m.day / C.days_per_year) + 1, d = m.day % C.days_per_year + 1;
  $('#civName').textContent = m.name; $('#clock').innerHTML = `Day <b>${m.day}</b> (Year ${yr}, day ${d}) &middot; ${S.running ? 'Running at ' + m.speed + 'x' : 'Paused'} &middot; Treasury <b>${fmt(S.economy.treasury)}</b>`;
}

/* ---------------- panels ---------------- */
function renderPanel() {
  if (!S) return; const p = $('#panel'), top = p.scrollTop, active = document.activeElement;
  if (active && ['INPUT', 'SELECT'].includes(active.tagName) && p.contains(active)) return;   // don't interrupt typing
  p.innerHTML = mode === 'observe' ? observeHTML() : controlHTML(); p.scrollTop = top; if (mode === 'observe') drawChart();
}
function observeHTML() { return inspectorHTML() + todayHTML() + cardsHTML() + chartHTML() + eventsHTML() + feedHTML(); }
function controlHTML() { return inspectorHTML() + timeHTML() + recsHTML() + buildHTML() + policyHTML() + researchHTML() + expHTML() + futuresHTML() + progressHTML() + dangerHTML(); }

const msgHTML = m => `<div class="msg ${esc(m.kind)}"><b>${esc(m.what || m.title)}</b>${m.why ? `<div class="w"><u>Why:</u> ${esc(m.why)}</div>` : ''}${m.effect ? `<div class="w"><u>Effect:</u> ${esc(m.effect)}</div>` : ''}${m.action ? `<div class="w"><u>You can:</u> ${esc(m.action)}</div>` : ''}</div>`;
function todayHTML() {
  return `<section class="card"><h2>What happened today</h2>${S.today.length ? S.today.map(msgHTML).join('') : '<p class="mut">Nothing special yet. Press <b>Start</b> in the Control tab, or advance one day, to see your civilisation change.</p>'}</section>`;
}
function cardsHTML() {
  return `<section class="card"><h2>Your civilisation</h2><p class="mut small">Click any card to learn what it means.</p><div class="grid">${S.cards.map(c =>
    `<button class="stat" data-act="card" data-key="${esc(c.key)}"><div class="l">${esc(c.label)}</div><div class="v">${esc(c.value)}</div>${pill(c.status, c.status_text)}</button>`).join('')}</div></section>`;
}
const CH = [['population', 'Population', 1], ['gdp', 'GDP', 1], ['unemployment_rate', 'Unemployment %', 100], ['avg_health', 'Health', 1], ['avg_happiness', 'Happiness', 1],
['food_availability', 'Food %', 100], ['pollution', 'Pollution', 1], ['env_health', 'Environment', 1], ['treasury', 'Treasury', 1]];
function chartHTML() {
  return `<section class="card"><h2>History</h2><div class="tabs">${CH.map(c => `<button class="${c[0] === chartKey ? 'on' : ''}" data-act="chart" data-key="${c[0]}">${c[1]}</button>`).join('')}</div>
  <canvas class="chart" id="chart" role="img" aria-label="Line chart of ${esc(chartKey)} over simulation days"></canvas><p class="small mut" id="chartNote"></p></section>`;
}
function drawChart() {
  const cv = $('#chart'); if (!cv) return; const dpr = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr;
  const g = cv.getContext('2d'); g.scale(dpr, dpr); const k = CH.find(c => c[0] === chartKey)[2], v = hist.map(x => x[chartKey] * k);
  const css = getComputedStyle(document.body); g.fillStyle = css.color; g.font = '11px sans-serif';
  if (v.length < 2) { g.fillText('Advance a few days to see a chart.', 10, 20); return; }
  let lo = Math.min(...v), hi = Math.max(...v); if (hi === lo) { hi += 1; lo -= 1; } const pad = 34, W = w - pad - 8, H = h - 26;
  g.strokeStyle = '#8884'; g.beginPath(); g.moveTo(pad, 6); g.lineTo(pad, H); g.lineTo(w - 6, H); g.stroke();
  g.fillText(fmt(hi, 1), 2, 14); g.fillText(fmt(lo, 1), 2, H); g.fillText('day ' + hist[0].day, pad, h - 6); g.fillText('day ' + hist[hist.length - 1].day, w - 60, h - 6);
  g.strokeStyle = '#2b5fd9'; g.lineWidth = 2; g.beginPath(); v.forEach((y, i) => { const px = pad + W * i / (v.length - 1), py = H - (y - lo) / (hi - lo) * (H - 10) - 2; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke();
  $('#chartNote').textContent = `Latest: ${fmt(v[v.length - 1], 1)} (from real simulation data, last ${v.length} days)`;
}
function eventsHTML() {
  const a = S.events.active; return `<section class="card"><h2>Events</h2>${a.length ? a.map(e => `<div class="msg ${e.kind}"><b>${esc(e.name)}</b> <span class="small">(day ${e.start}-${e.ends})</span><div class="w"><u>Why:</u> ${esc(e.cause)}</div><div class="w"><u>Effect:</u> ${esc(e.consequences)}</div>${e.responses.length ? `<div class="w"><u>You can:</u> ${esc(e.responses.slice(0, 2).join(' '))}</div>` : ''}</div>`).join('') : '<p class="mut">No active events.</p>'}</section>`;
}
function feedHTML() { return `<section class="card"><h2>Civilisation timeline</h2>${S.feed.slice(-14).reverse().map(f => `<div class="small mut">Day ${f.day}</div>${msgHTML({ ...f, what: f.title + ': ' + f.what })}`).join('')}</section>`; }

/* ---------------- inspector ---------------- */
const need = v => v >= 70 ? ['good', 'Good'] : v >= 40 ? ['warn', 'Low'] : ['bad', 'Critical'];
function inspectorHTML() {
  if (!sel) return `<section class="card"><h2>Inspector</h2><p class="mut">Click a person or a building in the 3D world to see details.</p></section>`;
  if (sel.type === 'citizen') {
    const d = sel.data, c = d.citizen, sk = Object.entries(c.skills).sort((a, b) => b[1] - a[1]).slice(0, 4);
    return `<section class="card"><div class="row sp"><h2>${esc(c.name)}</h2><button class="sm" data-act="deselect">Close</button></div><p>${esc(d.summary)}</p>
    <p class="small">Health ${fmt(c.health)}/100 &middot; Happiness ${fmt(c.happiness)}/100 &middot; Income ${fmt(c.income, 1)}/day &middot; Savings ${fmt(c.savings)}${c.sick_days > 0 ? ' &middot; ' + pill('bad', 'Sick') : ''}</p>
    <p class="small">Education: ${esc(d.education_name)} &middot; Learning ability ${c.learning} &middot; ${d.workplace ? 'Works at ' + esc(d.workplace.type.replace('_', ' ')) + ' ' + esc(d.workplace.id) : 'No fixed workplace'}</p>
    <h3>Needs</h3>${Object.entries(c.needs).map(([k, v]) => { const n = need(v); return `<div class="row sp small"><span>${k}</span><span>${pill(n[0], n[1])}</span></div><div class="bar"><i style="width:${v}%"></i></div>`; }).join('')}
    <h3>Best skills</h3><p class="small">${sk.map(s => `${s[0]} ${fmt(s[1])}`).join(' &middot; ')}</p>
    <h3>Family</h3><p class="small">${d.partner ? `Partner: <button class="sm" data-act="pick" data-key="${d.partner.id}">${esc(d.partner.name)}</button>` : 'No partner'}${d.children.length ? '<br>Children: ' + d.children.map(k => `<button class="sm" data-act="pick" data-key="${k.id}">${esc(k.name)} (${k.age})</button>`).join(' ') : ''}</p>
    <h3>Memories</h3>${c.memories.slice(-6).reverse().map(m => `<p class="small"><span class="mut">Day ${m.day}:</span> ${esc(m.text)}</p>`).join('')}</section>`;
  }
  const d = sel.data, b = d.building, i = d.info, st = b.status === 'building' ? pill('info', `Under construction: ${b.remaining} days left`) : pill(b.condition >= 60 ? 'good' : b.condition >= 40 ? 'warn' : 'bad', `Condition ${fmt(b.condition)}%`);
  return `<section class="card"><div class="row sp"><h2>${esc(i.label)} (${esc(b.id)})</h2><button class="sm" data-act="deselect">Close</button></div><p>${esc(i.purpose)}</p>
  <p class="small">Level ${b.level} &middot; ${st} &middot; Upkeep ${d.maintenance_per_day}/day</p>
  <p class="small"><b>What it does:</b> ${esc(i.benefit)}</p><p class="small"><b>Limitation:</b> ${esc(i.limitation)}</p>
  ${b.status === 'active' && i.label !== 'Housing block' && i.label !== 'Park' ? `<p class="small">Staffed ${fmt(b.staff_ratio * 100)}% (${b.workers} workers)</p>` : ''}
  ${d.residents != null ? `<p class="small">${d.residents} residents live here.</p>` : ''}
  ${d.workers.length ? `<p class="small"><b>Workers:</b> ${d.workers.slice(0, 8).map(w => `<button class="sm" data-act="pick" data-key="${w.id}">${esc(w.name)}</button>`).join(' ')}</p>` : ''}
  ${mode === 'control' && d.upgrade ? `<button class="primary" data-act="upgrade" data-key="${b.id}">Upgrade (${d.upgrade.cost} money, ${d.upgrade.materials} materials)</button>` : (mode === 'observe' && d.upgrade ? '<p class="small mut">Switch to Control to upgrade this building.</p>' : '')}</section>`;
}
async function selectCitizen(id) { await guard(async () => { sel = { type: 'citizen', id, data: await api('/citizens/' + id) }; World3D.highlightCitizen(id); renderPanel(); }); }
async function selectBuilding(id) { await guard(async () => { const d = await api('/buildings/' + id); sel = { type: 'building', id, data: d }; World3D.highlightCitizen(null); World3D.highlightBuilding(d.building); renderPanel(); }); }
async function reselect() { try { sel.type === 'citizen' ? sel.data = await api('/citizens/' + sel.id) : sel.data = await api('/buildings/' + sel.id); } catch (e) { sel = null; World3D.highlightCitizen(null); } }

/* ---------------- control panel sections ---------------- */
function timeHTML() {
  const r = S.running;
  return `<section class="card"><h2>Time</h2><p class="small mut">One simulation day is one update of the whole civilisation. At 1x a day takes 2 seconds; a year is ${C.days_per_year} days.</p>
  <div class="row">${r ? '<button class="primary" data-act="pause">&#10074;&#10074; Pause</button>' : `<button class="primary" data-act="start">&#9654; ${S.meta.day ? 'Resume' : 'Start'}</button>`}
  <button data-act="step" data-key="1" ${r ? 'disabled' : ''}>Advance 1 day</button><button data-act="step" data-key="7" ${r ? 'disabled' : ''}>Advance 7 days</button>
  <label class="small">Speed <select id="speed">${S.speeds.map(x => `<option ${x === S.meta.speed ? 'selected' : ''} value="${x}">${x}x</option>`).join('')}</select></label></div></section>`;
}
function recsHTML() {
  if (!S.recommendations.length) return `<section class="card"><h2>Suggestions</h2><p class="mut">No problems detected. Nice work!</p></section>`;
  return `<section class="card"><h2>Suggestions</h2><p class="small mut">Advice from your real numbers. Nothing happens unless you choose it.</p>${S.recommendations.map(r =>
    `<div class="msg ${r.level}"><b>${esc(r.text)}</b><div class="w"><u>Why this appears:</u> ${esc(r.why)}</div>${r.action.type === 'build' ? `<button class="sm" data-act="place" data-key="${r.action.key}">Choose where to build</button>` : r.action.type === 'policy' ? `<button class="sm" data-act="policy-on" data-key="${r.action.key}">Review policy</button>` : ''}</div>`).join('')}</section>`;
}
function buildHTML() {
  return `<section class="card"><h2>Construct buildings</h2><p class="small mut">Pick a building, then click a green tile on the map. You will see a confirmation before any money is spent.</p>${Object.entries(C.buildings).map(([k, b]) =>
    `<div class="item"><div class="row sp"><h3>${esc(b.label)}</h3><button class="sm primary" data-act="place" data-key="${k}">Build</button></div><p class="small">${esc(b.purpose)}</p><p class="small"><b>Cost:</b> ${b.cost} money + ${b.materials} materials &middot; ${b.build_days} days &middot; upkeep ${b.maintenance}/day</p><p class="small"><b>Expected effect:</b> ${esc(b.benefit)}</p><p class="small mut"><b>Limitation:</b> ${esc(b.limitation)}</p></div>`).join('')}</section>`;
}
function policyHTML() {
  return `<section class="card"><h2>Government policies</h2>${X.pol.map(p => `<div class="item"><div class="row sp"><h3>${esc(p.label)}</h3>${p.active ? pill('good', 'Active until day ' + p.ends) : ''}</div>
  <p class="small">${esc(p.intended)}</p><p class="small"><b>Cost:</b> ${p.cost} + ${p.upkeep}/day for ${p.duration} days</p><p class="small"><b>Advantages:</b> ${esc(p.advantages)}</p><p class="small mut"><b>Disadvantages:</b> ${esc(p.disadvantages)}</p>
  ${p.active ? `${p.report.map(r => `<p class="small">Measured: ${esc(r.metric.replace(/_/g, ' '))} ${r.before == null ? '-' : fmt(r.before, 2)} &rarr; ${r.now == null ? '-' : fmt(r.now, 2)}${r.change != null ? ' (' + (r.change >= 0 ? '+' : '') + fmt(r.change, 2) + ')' : ''}</p>`).join('')}<button class="sm danger" data-act="policy-off" data-key="${p.key}">Cancel policy</button>` : `<button class="sm primary" data-act="policy-on" data-key="${p.key}">Introduce policy</button>`}</div>`).join('')}</section>`;
}
function researchHTML() {
  const r = X.res; if (!r) return '';
  return `<section class="card"><h2>Research</h2><p class="small">Research points: <b>${r.points_total}</b> total &middot; +${r.rp_today}/day ${r.pool ? '&middot; ' + r.pool + ' banked' : ''}</p>${r.techs.map(t => `<div class="item"><div class="row sp"><h3>${esc(t.label)}</h3>${pill(t.status === 'unlocked' ? 'good' : t.status === 'locked' ? 'warn' : 'info', t.status === 'unlocked' ? 'Unlocked' : t.status === 'locked' ? 'Locked' : t.status === 'researching' ? 'Researching' : 'Available')}</div>
  <p class="small">${esc(t.desc)}</p><p class="small mut">${esc(t.area)} &middot; ${t.cost} points${t.status !== 'unlocked' ? ` &middot; progress ${t.progress}/${t.cost}` : ''}</p>${t.missing.length ? `<p class="small">Needs: ${esc(t.missing.join('; '))}</p>` : ''}
  ${t.status === 'available' ? `<button class="sm primary" data-act="research" data-key="${t.key}">Start researching</button>` : ''}</div>`).join('')}</section>`;
}
function expHTML() {
  if (!X.exp) return ''; const bal = X.exp.grc.balance;
  const list = X.exp.experiments.slice().reverse();
  return `<section class="card"><h2>Experiments</h2><p class="small">Genesis Research Credits (GRC): <b>${bal}</b>. Credits only unlock experiments; they never change results.</p>${C.experiments.map(e => `<div class="item"><div class="row sp"><h3>${esc(e.question)}</h3><button class="sm primary" data-act="exp" data-key="${e.key}" ${bal < e.cost ? 'disabled' : ''}>Run (${e.cost} GRC)</button></div><p class="small">${esc(e.description)} ${e.branches} branches, ${e.duration} days.</p></div>`).join('')}
  <h3>Experiment history</h3>${list.length ? list.map(x => `<div class="item"><div class="row sp"><b>${esc(x.name)}</b>${pill(x.status === 'completed' ? 'good' : x.status === 'failed' ? 'bad' : 'info', x.status)}</div><p class="small mut">Started day ${x.created_day}</p>${x.error ? `<p class="small">Failed: ${esc(x.error)}. Credits were refunded.</p>` : ''}${x.result ? resultHTML(x.result) : ''}</div>`).join('') : '<p class="mut small">No experiments yet.</p>'}</section>`;
}
function resultHTML(r) {
  const keys = Object.keys(r.labels);
  return `<p class="small"><b>${esc(r.kind)}</b> (not a prediction):</p><table><tr><th></th>${r.branches.map(b => `<th>${esc(b.label)}</th>`).join('')}</tr>${keys.map(k => `<tr><td>${esc(r.labels[k])}</td>${r.branches.map(b => `<td>${fmt(b.metrics[k], 2)}</td>`).join('')}</tr>`).join('')}</table>
  ${r.summary.map(s => `<p class="small">${esc(s)}</p>`).join('')}<details><summary class="small">Assumptions</summary>${r.assumptions.map(a => `<p class="small mut">${esc(a)}</p>`).join('')}</details>`;
}
function futuresHTML() {
  const presets = Object.entries(C.presets);
  return `<section class="card"><h2>Save &amp; compare futures</h2>
  <div class="row"><input id="snapName" placeholder="Snapshot name" aria-label="Snapshot name"><button data-act="snap">Save snapshot</button></div>
  <p class="small mut">${X.snaps.length} snapshot(s) saved. Futures are independent copies; changing them never changes your original civilisation.</p>
  <h3>Create a future</h3><div class="row"><select id="preset" aria-label="Future type">${presets.map(([k, p]) => `<option value="${k}">${esc(p.label)}</option>`).join('')}</select>
  <select id="snapSrc" aria-label="Start from"><option value="">from now (day ${S.meta.day})</option>${X.snaps.map(s => `<option value="${s.id}">from snapshot: ${esc(s.name)} (day ${s.day})</option>`).join('')}</select><button class="primary" data-act="branch">Create</button></div>
  <h3>Your futures</h3>${X.branches.length ? X.branches.map(b => `<div class="item"><div class="row sp"><label><input type="checkbox" data-act="cmp" data-key="${b.id}" ${cmpSel.has(b.id) ? 'checked' : ''}> <b>${esc(b.name)}</b></label><span class="small mut">day ${b.day} &middot; pop ${b.summary.population ?? '-'}</span></div><div class="row"><button class="sm" data-act="badv" data-key="${b.id}">Advance 30 days</button><button class="sm danger" data-act="bdel" data-key="${b.id}">Delete</button></div></div>`).join('') : '<p class="mut small">No futures yet.</p>'}
  <label class="small"><input type="checkbox" data-act="cmp" data-key="main" ${cmpSel.has('main') ? 'checked' : ''}> Include original civilisation</label><div><button data-act="compare">Compare selected</button></div>${cmpResult ? cmpHTML() : ''}</section>`;
}
function cmpHTML() {
  return `<table><tr><th>Measure</th>${cmpResult.worlds.map(w => `<th>${esc(w.name)}<br><span class="mut">day ${w.day}</span></th>`).join('')}</tr>${cmpResult.rows.map(r => `<tr><td>${esc(r.label)}</td>${cmpResult.worlds.map(w => `<td>${fmt(r.values[w.id], 2)}</td>`).join('')}</tr>`).join('')}</table><p class="small mut">Real values from each civilisation's simulation. Futures keep their own day count.</p>`;
}
function progressHTML() {
  const p = S.progression, e = X.exp; if (!e) return '';
  return `<section class="card"><h2>Progress</h2><p>Level <b>${p.level}</b> &middot; ${p.xp} experience &middot; ${e.grc.balance} GRC</p><h3>Missions</h3>${e.missions.map(m => `<div class="small row sp"><span>${m.done ? '&#10003; ' : ''}${esc(m.name)} <span class="mut">(+${m.grc} GRC)</span></span><span>${fmt(m.value)}/${m.target}</span></div><div class="bar"><i style="width:${Math.min(100, m.value / m.target * 100)}%"></i></div>`).join('')}
  <h3>Achievements</h3>${e.achievements.map(a => `<p class="small">${a.done ? '&#10003;' : '&#9675;'} <b>${esc(a.name)}</b> - ${esc(a.desc)} (+${a.grc} GRC)</p>`).join('')}
  <h3>Credit history</h3><table>${e.grc.ledger.slice(-8).reverse().map(l => `<tr><td>Day ${l.day}</td><td>${esc(l.reason)}</td><td>${l.amount > 0 ? '+' : ''}${l.amount}</td></tr>`).join('')}</table></section>`;
}
function dangerHTML() { return `<section class="card"><h2>New civilisation</h2><p class="small mut">Start over with a fresh seeded world. Your current one is replaced.</p><button class="danger" data-act="newworld">Start a new civilisation&hellip;</button></section>`; }

/* ---------------- confirmation flow ---------------- */
function previewHTML(kind, p) {
  const row = (a, b) => `<tr><td><b>${a}</b></td><td>${b}</td></tr>`;
  if (kind === 'build') return `<table>${row('Purpose', esc(p.purpose))}${row('Cost', p.cost + ' money + ' + p.materials + ' raw materials')}${row('Build time', p.build_days + ' days')}${row('Expected effect', esc(p.benefit))}${row('Possible limitation', esc(p.limitation) + ' Upkeep ' + p.maintenance_per_day + '/day.')}${row('Location', 'tile (' + p.x + ', ' + p.z + ')')}</table>`;
  if (kind === 'upgrade') return `<table>${row('Upgrade', 'Level ' + p.from_level + ' to ' + p.to_level)}${row('Cost', p.cost + ' money + ' + p.materials + ' materials')}${row('Expected effect', esc(p.benefit))}${row('Possible limitation', esc(p.limitation))}</table>`;
  if (kind === 'policy') return `<table>${row('Purpose', esc(p.intended))}${row('Cost', p.cost + ' now + ' + p.upkeep + ' per day')}${row('Duration', p.duration + ' days')}${row('Advantages', esc(p.advantages))}${row('Disadvantages', esc(p.disadvantages))}</table>`;
  if (kind === 'exp') return `<table>${row('Question', esc(p.question))}${row('What happens', esc(p.description))}${row('Cost', p.cost + ' GRC (you have ' + p.balance + ')')}${row('Branches', p.branches)}${row('Duration', p.duration + ' simulated days')}${row('You will see', esc(p.expected.join(', ').replace(/_/g, ' ')))}${row('Assumptions', p.assumptions.map(esc).join('<br>'))}</table>`;
  return `<p>${esc(p.warning || '')}</p>`;
}
async function confirmFlow(kind, title, path, body, after) {
  await guard(async () => {
    const r = await api(path, 'POST', { ...body, confirm: false });
    if (!r.needs_confirmation) return;
    const p = r.preview; if (kind === 'exp') p.balance = r.grc_balance;
    window._confirm = async () => { closeModal(); await guard(async () => { const d = await api(path, 'POST', { ...body, confirm: true }); toast(d.message || 'Done.'); if (after) after(); await refreshState(); await refreshExtras(); }); };
    openModal(`<h2>${esc(title)}</h2>${previewHTML(kind, p)}<div class="row" style="margin-top:12px"><button data-act="close">Cancel</button><button class="primary" onclick="window._confirm()">Confirm</button></div>`);
  });
}

/* ---------------- placement ---------------- */
function startPlace(type) {
  placing = type; mode = 'control'; syncTabs();
  const water = S.map.water, occ = S.buildings;
  World3D.setPlacement(type, (x, z) => !(x % 6 === 0 || z % 6 === 0) && !water.some(w => w[0] === x && w[1] === z) && !occ.some(b => b.x === x && b.z === z));
  const b = $('#banner'); b.hidden = false; b.innerHTML = `Click a green tile to place your ${esc(C.buildings[type].label.toLowerCase())} &middot; <button class="sm" data-act="cancel-place">Cancel</button>`;
}
function cancelPlace() { placing = null; World3D.setPlacement(null); $('#banner').hidden = true; }
function onTile(x, z) { if (!placing) return; const t = placing; confirmFlow('build', 'Construct a ' + C.buildings[t].label, '/buildings', { type: t, x, z }, cancelPlace); }

/* ---------------- onboarding / help ---------------- */
const TOUR = [
  ['Welcome to GENESIS', 'GENESIS is a living virtual civilisation. Hundreds of individual citizens work, learn, fall ill, have families and react to what you do. It is a simulation, not a picture.'],
  ['What is a virtual civilisation?', 'It is a small artificial society: people, farms, hospitals, schools, factories, money and nature all affect each other. If food runs short, people get unhappy and unhealthy.'],
  ['Observe mode', 'Observe lets you explore without changing anything. Rotate the 3D world, zoom, and read the dashboard to understand how your society is doing.'],
  ['Control mode', 'Control is where you act: build, choose policies, research technologies, run experiments and create alternative futures. Switching modes never resets your civilisation.'],
  ['The dashboard', 'The cards show population, jobs, health, happiness, resources, economy and environment. Green means fine, yellow needs attention, red is critical. Click a card to learn what it means.'],
  ['How time works', 'One simulation day is one update of everything. Use Start to let days pass automatically (1 day = 2 seconds at normal speed) or advance a day yourself. A year is 60 days.'],
  ['Inspect a citizen', 'Click a small figure in the 3D world to see their profile: job, health, needs, skills, family and memories. Colours show professions; red means sick.'],
  ['Inspect a building', 'Click any building to see what it does, how well it is staffed and how worn it is.'],
  ['Constructing buildings', 'In Control, press Build, click a green tile, then confirm. Construction costs money and raw materials and takes a few days.'],
  ['Policies and experiments', 'Policies change how your society works for a set time and cost money every day. Experiments (paid with research credits) simulate alternative futures so you can compare them before deciding.']];
function tour(i = 0) {
  const t = TOUR[i];
  openModal(`<p class="small mut">Step ${i + 1} of ${TOUR.length}</p><h2>${esc(t[0])}</h2><p>${esc(t[1])}</p><div class="row sp" style="margin-top:12px"><button data-act="skip">Skip introduction</button><span>${i > 0 ? `<button data-act="tour" data-key="${i - 1}">Back</button>` : ''} ${i < TOUR.length - 1 ? `<button class="primary" data-act="tour" data-key="${i + 1}">Next</button>` : '<button class="primary" data-act="skip">Start exploring</button>'}</span></div>`);
}
function help() {
  openModal(`<h2>How to use GENESIS</h2><p><b>Observe</b> to understand. <b>Control</b> to act. Click anything to learn more.</p><div class="row"><button data-act="tour" data-key="0">Replay the introduction</button><button data-act="close">Close</button></div>
  <h3>Time</h3><p class="small">1 simulation day = 1 update. At 1x speed a day lasts 2 seconds; 1 year = ${C.days_per_year} days. ${C.offline.enabled ? `Offline progression is ON: ${C.offline.days_per_hour} days pass per hour you are away (max ${C.offline.max_days}).` : 'Your world pauses while GENESIS is closed (offline progression is off).'}</p>
  <h3>Colours</h3><p class="small">${pill('good', 'Healthy')} ${pill('warn', 'Needs attention')} ${pill('bad', 'Critical')} ${pill('info', 'Information')} - always shown with text.</p>
  <h3>Glossary</h3>${Object.entries(C.glossary).map(([k, v]) => `<p class="small"><b>${esc(k.replace(/_/g, ' '))}:</b> ${esc(v)}</p>`).join('')}`);
}

/* ---------------- events ---------------- */
function syncTabs() { $('#tabObserve').setAttribute('aria-selected', mode === 'observe'); $('#tabControl').setAttribute('aria-selected', mode === 'control'); }
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t || t.tagName === 'INPUT') return; const k = t.dataset.key;
  switch (t.dataset.act) {
    case 'mode': mode = k; if (mode === 'observe') cancelPlace(); syncTabs(); renderPanel(); if (mode === 'control') refreshExtras(); break;
    case 'help': help(); break; case 'close': closeModal(); break;
    case 'tour': tour(+k); break; case 'skip': localStorage.setItem('genesis_tour', 'done'); closeModal(); break;
    case 'card': { const c = S.cards.find(x => x.key === k); openModal(`<h2>${esc(c.label)}: ${esc(c.value)}</h2><p>${pill(c.status, c.status_text)}</p><p><b>Right now:</b> ${esc(c.text)}</p><p><b>What it means:</b> ${esc(c.meaning)}</p><button data-act="close">Got it</button>`); break; }
    case 'chart': chartKey = k; renderPanel(); break;
    case 'start': guard(async () => { await api('/sim/start', 'POST'); await refreshState(); }); break;
    case 'pause': guard(async () => { await api('/sim/pause', 'POST'); await refreshState(); }); break;
    case 'step': guard(async () => { await api('/sim/step', 'POST', { days: +k }); await refreshState(); }); break;
    case 'place': startPlace(k); break; case 'cancel-place': cancelPlace(); break;
    case 'upgrade': confirmFlow('upgrade', 'Upgrade building', `/buildings/${k}/upgrade`, {}, () => reselect().then(renderPanel)); break;
    case 'policy-on': confirmFlow('policy', 'Introduce policy', `/policies/${k}/activate`, {}); break;
    case 'policy-off': guard(async () => { await api(`/policies/${k}/cancel`, 'POST'); toast('Policy cancelled.'); await refreshState(); await refreshExtras(); }); break;
    case 'research': guard(async () => { const d = await api('/research/start', 'POST', { tech: k }); toast(d.message); await refreshState(); await refreshExtras(); }); break;
    case 'exp': confirmFlow('exp', 'Run experiment', '/experiments', { key: k }); break;
    case 'snap': guard(async () => { const d = await api('/snapshots', 'POST', { name: $('#snapName').value }); toast('Saved snapshot "' + d.name + '".'); await refreshExtras(); }); break;
    case 'branch': guard(async () => { const d = await api('/branches', 'POST', { preset: $('#preset').value, snapshot_id: $('#snapSrc').value || null }); toast('Created: ' + d.name); cmpSel.add(d.id); await refreshState(); await refreshExtras(); }); break;
    case 'badv': guard(async () => { await api(`/branches/${k}/advance`, 'POST', { days: 30 }); toast('Future advanced 30 days.'); await refreshExtras(); cmpResult = null; }); break;
    case 'bdel': guard(async () => { await api(`/branches/${k}`, 'DELETE'); cmpSel.delete(k); cmpResult = null; await refreshExtras(); }); break;
    case 'compare': guard(async () => { cmpResult = await api('/compare?ids=' + [...cmpSel].join(',')); renderPanel(); }); break;
    case 'pick': selectCitizen(k); break; case 'deselect': sel = null; World3D.highlightCitizen(null); World3D.highlightBuilding(null); renderPanel(); break;
    case 'newworld': confirmFlow('world', 'Start a new civilisation', '/world/new', { seed: Math.floor(Math.random() * 100000), name: 'My Civilisation' }, () => { sel = null; cmpResult = null; }); break;
  }
});
document.addEventListener('change', e => {
  if (e.target.id === 'speed') guard(async () => { await api('/sim/speed', 'POST', { speed: +e.target.value }); await refreshState(); });
  if (e.target.dataset.act === 'cmp') { e.target.checked ? cmpSel.add(e.target.dataset.key) : cmpSel.delete(e.target.dataset.key); }
});

/* ---------------- start ---------------- */
(async function boot() {
  try {
    C = await api('/catalog');
    World3D.init($('#view'), { onCitizen: selectCitizen, onBuilding: selectBuilding, onTile });
    $('#legend').innerHTML = ['farmer', 'doctor', 'nurse', 'teacher', 'student', 'engineer', 'scientist', 'factory_worker', 'unemployed', 'child'].map(p => `<span><i style="background:#${World3D.PROF[p].toString(16).padStart(6, '0')}"></i>${p.replace('_', ' ')}</span>`).join('') + '<span><i style="background:#e53935"></i>sick</span>';
    await refreshState(); await loadHistory(); connect();
    if (!localStorage.getItem('genesis_tour')) tour(0);
  } catch (e) { $('#loading').textContent = 'Could not start: ' + e.message; }
})();
