import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 3000);
const sessions = new Map();
const addresses = new Map();
let temporaryServiceLinks = {};
const telegramKeyboard = { keyboard: [['Email'], ['بيانات السهم'], ['تشغيل الخدمات', 'حالة الخدمات'], ['روابط الخدمات'], ['Railway Projects'], ['Help']], resize_keyboard: true, is_persistent: true };
const emailKeyboard = { keyboard: [['New address', 'My addresses'], ['Send email', 'Home']], resize_keyboard: true, is_persistent: true };

const bots = [
  { name: 'email-bot', status: 'railway-primary', url: process.env.EMAIL_BOT_URL || 'https://email-bot.2401055.workers.dev' },
  { name: 'ai-skills-bot-site', status: 'integrated', url: process.env.AI_SKILLS_SITE_URL || 'https://ai-skills-bot-site.2401055.workers.dev' },
  { name: 'mytoolstown-automation', status: 'cloudflare-fallback', url: process.env.MYTOOLSTOWN_URL || 'https://mytoolstown-automation.2401055.workers.dev' }
];
const railwayServices = [
  { name: 'searxng', title: 'SearXNG', category: 'search', port: 8080, path: 'railway-services/searxng', status: 'ready-with-config', env: 'SEARXNG_URL', needs: ['persistent volumes', 'optional Valkey'] },
  { name: 'reactive-resume', title: 'Reactive Resume', category: 'productivity', port: 3000, path: 'railway-services/reactive-resume', status: 'ready-with-config', env: 'REACTIVE_RESUME_URL', needs: ['PostgreSQL', 'APP_URL, DATABASE_URL, AUTH_SECRET'] },
  { name: 'changedetection-io', title: 'changedetection.io', category: 'monitoring', port: 5000, path: 'railway-services/changedetection-io', status: 'ready-with-config', env: 'CHANGEDETECTION_URL', needs: ['datastore volume', 'optional browser service'] },
  { name: 'suwayomi', title: 'Suwayomi', category: 'media', port: 4567, path: 'railway-services/suwayomi', status: 'ready-with-config', env: 'SUWAYOMI_URL', needs: ['persistent storage'] },
  { name: 'libretranslate', title: 'LibreTranslate', category: 'ai', port: 5000, path: 'railway-services/libretranslate', status: 'ready-with-config', env: 'LIBRETRANSLATE_URL', needs: ['RAM and model storage'] },
  { name: 'archivebox', title: 'ArchiveBox', category: 'archiving', port: 8000, path: 'railway-services/archivebox', status: 'ready-with-config', env: 'ARCHIVEBOX_URL', needs: ['data volume', 'backups'] },
  { name: 'vaultwarden', title: 'Vaultwarden', category: 'security', port: 80, path: 'railway-services/vaultwarden', status: 'ready-with-config', env: 'VAULTWARDEN_URL', needs: ['data volume', 'HTTPS and backups'] }
];
const projectInventory = [
  { name: 'Cobalt', status: 'source-required', railway: 'candidate' },
  { name: 'gallery-dl', status: 'source-required', railway: 'worker-or-cron' },
  { name: 'AutoResearch', status: 'compute-and-credentials-required', railway: 'conditional' },
  { name: 'video-use', status: 'browser-and-ffmpeg-required', railway: 'conditional' },
  { name: 'Agent-Reach', status: 'source-and-cli-dependencies-required', railway: 'conditional' },
  { name: 'free-claude-code', status: 'provider-credentials-required', railway: 'conditional' },
  { name: 'LocalSend', status: 'local-network-app', railway: 'not-suitable' }
];

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
function send(res, status, body, type = 'application/json') { res.writeHead(status, { 'content-type': type }); res.end(body); }
async function body(req) { const chunks = []; for await (const c of req) chunks.push(c); return Buffer.concat(chunks).toString('utf8'); }
function userState(id) { if (!sessions.has(String(id))) sessions.set(String(id), { loggedIn: false, stage: null, expires: 0 }); return sessions.get(String(id)); }
function menuFor() { return telegramKeyboard; }
function configuredSecret(name) { return String(process.env[name] || '').trim().replace(/^(["'])(.*)\1$/, '$2').trim(); }
async function tg(method, payload) { const token = process.env.TELEGRAM_BOT_TOKEN; if (!token) return false; const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }); return r.ok; }
async function reply(id, text, keyboard = menuFor(id)) { return tg('sendMessage', { chat_id: id, text, reply_markup: keyboard, disable_web_page_preview: true }); }
function serviceUrl(x) { return x.env ? String(process.env[x.env] || '').replace(/\/$/, '') : ''; }
async function serviceHealth(x) { const url = serviceUrl(x); if (!url) return { state: 'غير مربوط', url: '' }; try { const r = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(4000) }); return { state: r.ok ? `يعمل (${r.status})` : `استجابة ${r.status}`, url }; } catch { return { state: 'غير متاح', url }; } }
async function railwayText() { const rows = await Promise.all(railwayServices.map(async (x, i) => { const h = await serviceHealth(x); return `${i + 1}. ${x.title} — ${h.state}${h.url ? `\n   ${h.url}` : ''}`; })); return ['خدمات Railway:', ...rows, '', 'للتفاصيل: /project <name>'].join('\n'); }
async function projectText(name) { const x = railwayServices.find(p => p.name.toLowerCase() === String(name || '').toLowerCase() || p.title.toLowerCase() === String(name || '').toLowerCase()); if (!x) return 'المشروع غير موجود. استخدم /projects.'; const h = await serviceHealth(x); return [`${x.title}`, `الحالة: ${h.state}`, h.url ? `الرابط: ${h.url}` : 'الرابط: غير مضبوط', `التصنيف: ${x.category}`, `المنفذ: ${x.port}`, `المسار: ${x.path}`, `المتطلبات: ${x.needs.join('؛ ')}`].join('\n'); }
function botsText() { return ['البوتات الموجودة داخل Email Bot:', ...bots.map(x => `${x.name} — ${x.status}`)].join('\n'); }
async function stockText() {
  try { const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/COMI.CA?interval=1d&range=1d', { headers: { 'User-Agent': 'EmailBot/1.0' } }); const x = await r.json(); const m = x.chart.result[0].meta; return `بيانات COMI (EGX)\nالسعر: ${m.regularMarketPrice ?? '-'}\nالتغير: ${m.regularMarketChangePercent ?? '-'}%`; } catch { return 'تعذر قراءة بيانات السهم حاليًا.'; }
}
async function githubRequest(endpoint, options = {}) {
  const token = process.env.GITHUB_ACTIONS_TOKEN;
  if (!token) return { ok: false, error: 'GITHUB_ACTIONS_TOKEN غير مضبوط في Railway Variables.' };
  const r = await fetch(`https://api.github.com${endpoint}`, { ...options, headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${token}`, 'x-github-api-version': '2022-11-28', ...(options.headers || {}) } });
  const data = await r.json().catch(() => ({}));
  return r.ok ? { ok: true, data } : { ok: false, error: data.message || `GitHub HTTP ${r.status}` };
}
function githubRepo() { return process.env.GITHUB_REPO || '2401055/email-bot'; }
async function startServicesText() {
  const r = await githubRequest(`/repos/${githubRepo()}/actions/workflows/compose-test.yml/dispatches`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ref: 'main' }) });
  return r.ok ? 'بدأ تشغيل الخدمات على GitHub Actions. استخدم /services_status بعد دقيقة لمتابعة الحالة.\nمهم: التشغيل مؤقت وسيُغلق بعد انتهاء الاختبار.' : `تعذر بدء الخدمات: ${r.error}`;
}
async function servicesStatusText() {
  const r = await githubRequest(`/repos/${githubRepo()}/actions/workflows/compose-test.yml/runs?branch=main&per_page=1`);
  if (!r.ok) return `تعذر قراءة الحالة: ${r.error}`;
  const run = r.data.workflow_runs?.[0];
  if (!run) return 'لا يوجد تشغيل للخدمات حتى الآن.';
  const state = run.status === 'completed' ? `انتهى: ${run.conclusion}` : `جارٍ: ${run.status}`;
  return [`حالة اختبار الخدمات: ${state}`, `Commit: ${run.head_sha.slice(0, 7)}`, `الرابط: ${run.html_url}`].join('\n');
}
function serviceLinkRows() { return Object.entries(temporaryServiceLinks).filter(([, url]) => /^https:\/\/[a-z0-9-]+\.trycloudflare\.com\/?$/i.test(url)); }
async function serviceLinksReply(id) { const rows = serviceLinkRows(); if (!rows.length) return reply(id, 'لا توجد روابط خدمات الآن. اضغط «تشغيل الخدمات» وانتظر حوالي دقيقة.'); return tg('sendMessage', { chat_id: id, text: 'افتح الخدمة المطلوبة:', reply_markup: { inline_keyboard: rows.map(([name, url]) => [{ text: name, url }]) }, disable_web_page_preview: true }); }
async function sendEmail(id, to, subject, text) { if (!process.env.RESEND_API_KEY) return reply(id, 'تم تجهيز الرسالة، لكن RESEND_API_KEY غير مضبوط في Railway Variables.', emailKeyboard); const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM || 'noreply@joserv.dpdns.org', to: [to], subject, text }) }); return reply(id, r.ok ? 'تم إرسال الرسالة عبر Resend.' : 'فشل إرسال الرسالة.', emailKeyboard); }
async function handleTelegram(update) {
  const m = update?.message; if (!m?.chat?.id) return;
  const id = String(m.chat.id), text = String(m.text || '').trim(), s = userState(id), cmd = text.split(/\s+/)[0].toLowerCase();
  if (cmd === '/start' || text === 'Start') { s.stage = null; s.loggedIn = true; s.expires = Date.now() + 86400000; return reply(id, 'أهلًا بك. اختر الخدمة من القائمة.'); }
  if (cmd === '/help' || text === 'Help') return reply(id, 'الأوامر المتاحة:\nEmail — البريد\nبيانات السهم — EGX\nتشغيل الخدمات — تشغيل GitHub Actions\nحالة الخدمات — حالة الاختبار\n/projects /project <name> /bots /health');
  if (cmd === '/projects' || text === 'Railway Projects') return reply(id, await railwayText());
  if (cmd === '/project') return reply(id, await projectText(text.split(/\s+/).slice(1).join(' ')));
  if (cmd === '/bots') return reply(id, botsText());
  if (cmd === '/services_start' || text === 'تشغيل الخدمات') return reply(id, await startServicesText());
  if (cmd === '/services_status' || text === 'حالة الخدمات') return reply(id, await servicesStatusText());
  if (cmd === '/service_links' || text === 'روابط الخدمات') return serviceLinksReply(id);
  if (text === 'Email') { s.stage = null; return reply(id, 'اختر خدمة البريد', emailKeyboard); }
  if (text === 'بيانات السهم') return reply(id, await stockText());
  if (text === 'New address') { s.stage = 'new-address'; return reply(id, 'اكتب اسم العنوان مثل support', emailKeyboard); }
  if (text === 'My addresses') return reply(id, addresses.get(id)?.join(', ') || 'لا توجد عناوين', emailKeyboard);
  if (text === 'Send email') { s.stage = 'email-to'; return reply(id, 'اكتب بريد المستلم', emailKeyboard); }
  if (s.stage === 'new-address') { const a = text.toLowerCase(); if (!/^[a-z0-9_-]{1,49}$/.test(a)) return reply(id, 'اسم غير صالح', emailKeyboard); const list = addresses.get(id) || []; if (!list.includes(a)) list.push(a); addresses.set(id, list); s.stage = null; return reply(id, `تم إنشاء ${a}@${process.env.EMAIL_DOMAIN || 'joserv.dpdns.org'}`, emailKeyboard); }
  if (s.stage === 'email-to') { s.to = text; s.stage = 'email-subject'; return reply(id, 'اكتب الموضوع', emailKeyboard); }
  if (s.stage === 'email-subject') { s.subject = text; s.stage = 'email-body'; return reply(id, 'اكتب الرسالة', emailKeyboard); }
  if (s.stage === 'email-body') { s.stage = null; return sendEmail(id, s.to, s.subject, text); }
  return reply(id, 'اختر من الأزرار أو أرسل /help.');
}

async function proxy(req, res, target) { try { const r = await fetch(target, { method: req.method, headers: { 'content-type': req.headers['content-type'] || '' }, body: ['GET', 'HEAD'].includes(req.method) ? undefined : req }); send(res, r.status, await r.text(), r.headers.get('content-type') || 'text/plain'); } catch { send(res, 502, JSON.stringify({ ok: false, error: 'upstream unavailable' })); } }
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host}`);
  if (u.pathname === '/health') return send(res, 200, JSON.stringify({ ok: true, service: 'email-bot-hub', mode: 'full-original-plus-railway', telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN), services: railwayServices.length }));
  if (u.pathname === '/telegram/webhook' && req.method === 'POST') { if (process.env.TELEGRAM_WEBHOOK_SECRET && req.headers['x-telegram-bot-api-secret-token'] !== process.env.TELEGRAM_WEBHOOK_SECRET) return send(res, 401, JSON.stringify({ ok: false, error: 'unauthorized' })); try { await handleTelegram(JSON.parse(await body(req))); return send(res, 200, JSON.stringify({ ok: true })); } catch { return send(res, 400, JSON.stringify({ ok: false, error: 'bad update' })); } }
  if (u.pathname === '/api/bots') return send(res, 200, JSON.stringify({ ok: true, bots }, null, 2));
  if (u.pathname === '/api/railway-services') return send(res, 200, JSON.stringify({ ok: true, services: railwayServices }, null, 2));
  if (u.pathname === '/api/projects') return send(res, 200, JSON.stringify({ ok: true, prepared: railwayServices, inventory: projectInventory }, null, 2));
  if (u.pathname === '/api/bot-menu') return send(res, 200, JSON.stringify({ ok: true, original: ['Email', 'بيانات السهم'], new: ['تشغيل الخدمات', 'حالة الخدمات', 'روابط الخدمات', 'Railway Projects', '/projects', '/project <name>', '/bots', '/health'], bots }, null, 2));
  if (u.pathname === '/api/service-links' && req.method === 'POST') { try { const data = JSON.parse(await body(req)); const links = Object.fromEntries(Object.entries(data.links || {}).filter(([, url]) => /^https:\/\/[a-z0-9-]+\.trycloudflare\.com\/?$/i.test(String(url)))); temporaryServiceLinks = links; return send(res, 200, JSON.stringify({ ok: true, count: Object.keys(links).length })); } catch { return send(res, 400, JSON.stringify({ ok: false, error: 'bad links payload' })); } }
  if (u.pathname.startsWith('/cf/')) { const name = u.pathname.split('/')[2]; const b = bots.find(x => x.name === name); if (!b) return send(res, 404, JSON.stringify({ ok: false, error: 'unknown bot' })); return proxy(req, res, `${b.url}/${u.pathname.split('/').slice(3).join('/')}${u.search}`); }
  const file = u.pathname === '/' ? '/index.html' : u.pathname; const full = path.resolve(root, 'site', file.slice(1)); if (!full.startsWith(path.resolve(root, 'site')) || !fs.existsSync(full)) return send(res, 404, 'Not Found', 'text/plain'); return send(res, 200, fs.readFileSync(full), mime[path.extname(full)] || 'application/octet-stream');
});
server.listen(port, '0.0.0.0', () => console.log(`email-bot-hub listening on ${port}`));
