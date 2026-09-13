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
  { name: 'echo-eyes-bot', status: 'cloudflare-fallback', url: process.env.ECHO_EYES_BOT_URL || 'https://bot.joserv.dpdns.org' },
  { name: 'echo-eyes-egx', status: 'cloudflare-fallback', url: process.env.ECHO_EYES_EGX_URL || 'https://echo-eyes-egx.2401055.workers.dev' },
  { name: 'echo-eyes-play-v2', status: 'cloudflare-fallback', url: process.env.ECHO_EYES_PLAY_URL || 'https://play.joserv.dpdns.org' },
  { name: 'echo-eyes-port', status: 'cloudflare-fallback', url: process.env.ECHO_EYES_PORT_URL || 'https://echo-eyes-port.2401055.workers.dev' },
  { name: 'echo-eyes-proxy', status: 'cloudflare-fallback', url: process.env.ECHO_EYES_PROXY_URL || 'https://echo-eyes-proxy.2401055.workers.dev' },
  { name: 'iot-security-monitor', status: 'cloudflare-fallback', url: process.env.IOT_MONITOR_URL || 'https://nada.dpdns.org' },
  { name: 'joserv-siem', status: 'cloudflare-fallback', url: process.env.JOSERV_SIEM_URL || 'https://joserv-siem.2401055.workers.dev' },
  { name: 'joserv-site', status: 'cloudflare-fallback', url: process.env.JOSERV_SITE_URL || 'https://joserv.dpdns.org' },
  { name: 'mytoolstown-automation', status: 'cloudflare-fallback', url: process.env.MYTOOLSTOWN_URL || 'https://mytoolstown-automation.2401055.workers.dev' },
  { name: 'url-shortener', status: 'cloudflare-fallback', url: process.env.URL_SHORTENER_URL || 'https://url-shortener.2401055.workers.dev' },
  { name: 'website-monitor', status: 'cloudflare-fallback', url: process.env.WEBSITE_MONITOR_URL || 'https://website-monitor.2401055.workers.dev' }
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
  if (u.pathname === '/health') return send(res, 200, JSON.stringify({ ok: true, service: 'email-bot-hub', mode: 'railway-integrated-catalog' }));
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
