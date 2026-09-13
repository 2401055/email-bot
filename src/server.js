import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 3000);

const bots = [
  { name: 'email-bot', status: 'cloudflare-fallback', url: process.env.EMAIL_BOT_URL || 'https://email-bot.2401055.workers.dev' },
  { name: 'ai-skills-bot-site', status: 'integrated', url: process.env.AI_SKILLS_SITE_URL || 'https://ai-skills-bot-site.2401055.workers.dev' },
  { name: 'mytoolstown-automation', status: 'cloudflare-fallback', url: process.env.MYTOOLSTOWN_URL || 'https://mytoolstown-automation.2401055.workers.dev' }
];

const railwayServices = [
  { name: 'searxng', title: 'SearXNG', category: 'search', port: 8080, path: 'railway-services/searxng', status: 'ready-with-config', needs: ['Volumes /etc/searxng and /var/cache/searxng', 'optional Valkey'] },
  { name: 'reactive-resume', title: 'Reactive Resume', category: 'productivity', port: 3000, path: 'railway-services/reactive-resume', status: 'ready-with-config', needs: ['PostgreSQL', 'APP_URL, DATABASE_URL, AUTH_SECRET', 'Volume /app/data if S3 is disabled'] },
  { name: 'changedetection-io', title: 'changedetection.io', category: 'monitoring', port: 5000, path: 'railway-services/changedetection-io', status: 'ready-with-config', needs: ['Volume /datastore', 'optional browser service'] },
  { name: 'suwayomi', title: 'Suwayomi', category: 'media', port: 4567, path: 'railway-services/suwayomi', status: 'ready-with-config', needs: ['persistent server/download storage'] },
  { name: 'libretranslate', title: 'LibreTranslate', category: 'ai', port: 5000, path: 'railway-services/libretranslate', status: 'ready-with-config', needs: ['RAM and model storage', 'API rate limits'] },
  { name: 'archivebox', title: 'ArchiveBox', category: 'archiving', port: 8000, path: 'railway-services/archivebox', status: 'ready-with-config', needs: ['Volume /data', 'tested image tag and backups'] },
  { name: 'vaultwarden', title: 'Vaultwarden', category: 'security', port: 80, path: 'railway-services/vaultwarden', status: 'ready-with-config', needs: ['Volume /data', 'HTTPS, admin token, tested backups'] }
];

const projectInventory = [
  { name: 'Cobalt', status: 'source-required', railway: 'candidate' },
  { name: 'gallery-dl', status: 'source-required', railway: 'worker-or-cron' },
  { name: 'AutoResearch', status: 'compute-and-credentials-required', railway: 'conditional' },
  { name: 'video-use', status: 'browser-and-ffmpeg-required', railway: 'conditional' },
  { name: 'Agent-Reach', status: 'source-and-cli-dependencies-required', railway: 'conditional' },
  { name: 'free-claude-code', status: 'provider-credentials-required', railway: 'conditional' },
  { name: 'LocalSend', status: 'excluded-local-network', railway: 'not-suitable' },
  { name: 'VODER', status: 'GPU-required', railway: 'not-suitable-for-standard-railway' },
  { name: 'Google Cloud deployment', status: 'deployment-target-not-app', railway: 'not-a-service' },
  { name: 'Oracle Cloud', status: 'deployment-target-not-app', railway: 'not-a-service' }
];

const botMenu = {
  title: 'Email Bot Hub',
  groups: [
    { name: 'AI Skills', items: [{ command: 'Social Media Skills', action: 'ai-skills' }, { command: 'UI UX Pro Max', action: 'ui-ux' }] },
    { name: 'Railway projects', items: railwayServices.map(s => ({ command: s.title, action: 'railway-project', project: s.name, status: s.status })) },
    { name: 'Cloudflare bots', items: bots.map(b => ({ command: b.name, action: 'cloudflare-bot', url: b.url, status: b.status })) }
  ]
};

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const telegramKeyboard = { keyboard: [[{ text: 'Railway Projects' }, { text: 'Cloudflare Bots' }], [{ text: 'AI Skills' }, { text: 'Health' }], [{ text: 'Help' }]], resize_keyboard: true, is_persistent: true };
function telegramText() { return ['Email Bot Hub', '', 'البوت يجمع خدمات Railway المجهزة، AI Skills، والبوتات المتبقية.', '', 'الأوامر:', '/projects — خدمات Railway وبقية المشاريع', '/project <name> — تفاصيل مشروع', '/bots — البوتات المرتبطة', '/skills — AI Skills', '/health — حالة البوت', '/help — المساعدة'].join('\n'); }
function railwayText() { return ['خدمات Railway المجهزة:', ...railwayServices.map((x, i) => `${i + 1}. ${x.title} — ${x.status}`), '', 'استخدم /project <name> للتفاصيل.'].join('\n'); }
function botsText() { return ['البوتات الموجودة داخل Email Bot:', ...bots.map((x, i) => `${i + 1}. ${x.name} — ${x.status}`)].join('\n'); }
function projectDetails(name) { const x = railwayServices.find(item => item.name.toLowerCase() === String(name || '').toLowerCase() || item.title.toLowerCase() === String(name || '').toLowerCase()); if (!x) return 'المشروع غير موجود. استخدم /projects لعرض القائمة.'; return [`${x.title}`, `الحالة: ${x.status}`, `التصنيف: ${x.category}`, `المنفذ: ${x.port}`, `المسار: ${x.path}`, `المتطلبات: ${x.needs.join('؛ ')}`].join('\n'); }
async function telegramSend(chatId, text) { const token = process.env.TELEGRAM_BOT_TOKEN; if (!token) return false; const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text, reply_markup: telegramKeyboard, disable_web_page_preview: true }) }); return r.ok; }
async function telegramHandle(update) { const msg = update?.message; if (!msg?.chat?.id) return; const text = String(msg.text || '').trim(); const command = text.split(/\s+/)[0].toLowerCase(); let reply; if (command === '/start' || command === '/help' || text === 'Help') reply = telegramText(); else if (command === '/projects' || text === 'Railway Projects') reply = railwayText(); else if (command === '/bots' || text === 'Cloudflare Bots') reply = botsText(); else if (command === '/skills' || text === 'AI Skills') reply = 'AI Skills داخل Email Bot:\n\nSocial Media Skills — اكتب طلب محتوى أو Hook أو خطة نشر.\nUI UX Pro Max — اكتب وصف الواجهة أو الموقع المطلوب.'; else if (command === '/health' || text === 'Health') reply = 'Email Bot Hub يعمل.\nRailway catalog: ' + railwayServices.length + ' services\nBots: ' + bots.length; else if (command === '/project') reply = projectDetails(text.split(/\s+/).slice(1).join(' ')); else reply = 'استخدم /help لعرض القائمة والأوامر.'; await telegramSend(msg.chat.id, reply); }
async function readRequestBody(req) { const chunks = []; for await (const chunk of req) chunks.push(chunk); return Buffer.concat(chunks).toString('utf8'); }
function send(res, status, body, type = 'application/json') { res.writeHead(status, { 'content-type': type }); res.end(body); }
async function proxy(req, res, target) {
  try {
    const u = new URL(target);
    const upstream = await fetch(u, { method: req.method, headers: { 'content-type': req.headers['content-type'] || '' }, body: ['GET', 'HEAD'].includes(req.method) ? undefined : req });
    send(res, upstream.status, await upstream.text(), upstream.headers.get('content-type') || 'text/plain');
  } catch { send(res, 502, JSON.stringify({ ok: false, error: 'upstream unavailable' })); }
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host}`);
  if (u.pathname === '/health') return send(res, 200, JSON.stringify({ ok: true, service: 'email-bot-hub', mode: 'railway-integrated-catalog', telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN) }));
  if (u.pathname === '/telegram/webhook' && req.method === 'POST') {
    if (process.env.TELEGRAM_WEBHOOK_SECRET && req.headers['x-telegram-bot-api-secret-token'] !== process.env.TELEGRAM_WEBHOOK_SECRET) return send(res, 401, JSON.stringify({ ok: false, error: 'unauthorized' }));
    try { await telegramHandle(JSON.parse(await readRequestBody(req))); return send(res, 200, JSON.stringify({ ok: true })); } catch { return send(res, 400, JSON.stringify({ ok: false, error: 'bad update' })); }
  }
  if (u.pathname === '/api/bots') return send(res, 200, JSON.stringify({ ok: true, bots }, null, 2));
  if (u.pathname === '/api/railway-services') return send(res, 200, JSON.stringify({ ok: true, services: railwayServices }, null, 2));
  if (u.pathname === '/api/projects') return send(res, 200, JSON.stringify({ ok: true, prepared: railwayServices, inventory: projectInventory }, null, 2));
  if (u.pathname === '/api/bot-menu') return send(res, 200, JSON.stringify({ ok: true, menu: botMenu }, null, 2));
  if (u.pathname.startsWith('/cf/')) {
    const name = u.pathname.split('/')[2];
    const bot = bots.find(x => x.name === name);
    if (!bot) return send(res, 404, JSON.stringify({ ok: false, error: 'unknown bot' }));
    const suffix = u.pathname.split('/').slice(3).join('/');
    return proxy(req, res, `${bot.url}${suffix ? `/${suffix}` : ''}${u.search}`);
  }
  const file = u.pathname === '/' ? '/index.html' : u.pathname;
  const full = path.resolve(root, 'site', file.slice(1));
  if (!full.startsWith(path.resolve(root, 'site')) || !fs.existsSync(full)) return send(res, 404, 'Not Found', 'text/plain');
  send(res, 200, fs.readFileSync(full), mime[path.extname(full)] || 'application/octet-stream');
});
server.listen(port, '0.0.0.0', () => console.log(`email-bot-hub listening on ${port}`));
