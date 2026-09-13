import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'..');
const port=Number(process.env.PORT||3000);
const bots=[
 {name:'email-bot',status:'cloudflare-fallback',url:process.env.EMAIL_BOT_URL||'https://email-bot.2401055.workers.dev'},
 {name:'ai-skills-bot-site',status:'integrated',url:process.env.AI_SKILLS_SITE_URL||'https://ai-skills-bot-site.2401055.workers.dev'},
 {name:'echo-eyes-bot',status:'cloudflare-fallback',url:process.env.ECHO_EYES_BOT_URL||'https://bot.joserv.dpdns.org'},
 {name:'echo-eyes-egx',status:'cloudflare-fallback',url:process.env.ECHO_EYES_EGX_URL||'https://echo-eyes-egx.2401055.workers.dev'},
 {name:'echo-eyes-play-v2',status:'cloudflare-fallback',url:process.env.ECHO_EYES_PLAY_URL||'https://play.joserv.dpdns.org'},
 {name:'echo-eyes-port',status:'cloudflare-fallback',url:process.env.ECHO_EYES_PORT_URL||'https://echo-eyes-port.2401055.workers.dev'},
 {name:'echo-eyes-proxy',status:'cloudflare-fallback',url:process.env.ECHO_EYES_PROXY_URL||'https://echo-eyes-proxy.2401055.workers.dev'},
 {name:'iot-security-monitor',status:'cloudflare-fallback',url:process.env.IOT_MONITOR_URL||'https://nada.dpdns.org'},
 {name:'joserv-siem',status:'cloudflare-fallback',url:process.env.JOSERV_SIEM_URL||'https://joserv-siem.2401055.workers.dev'},
 {name:'joserv-site',status:'cloudflare-fallback',url:process.env.JOSERV_SITE_URL||'https://joserv.dpdns.org'},
 {name:'mytoolstown-automation',status:'cloudflare-fallback',url:process.env.MYTOOLSTOWN_URL||'https://mytoolstown-automation.2401055.workers.dev'},
 {name:'url-shortener',status:'cloudflare-fallback',url:process.env.URL_SHORTENER_URL||'https://url-shortener.2401055.workers.dev'},
 {name:'website-monitor',status:'cloudflare-fallback',url:process.env.WEBSITE_MONITOR_URL||'https://website-monitor.2401055.workers.dev'}
];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
function send(res,status,body,type='application/json'){res.writeHead(status,{'content-type':type});res.end(body)}
async function proxy(req,res,target){try{const u=new URL(target);const r=await fetch(u,{method:req.method,headers:{'content-type':req.headers['content-type']||''},body:['GET','HEAD'].includes(req.method)?undefined:req});send(res,r.status,await r.text(),r.headers.get('content-type')||'text/plain')}catch(e){send(res,502,JSON.stringify({ok:false,error:'upstream unavailable'}))}}
const server=http.createServer(async(req,res)=>{const u=new URL(req.url,`http://${req.headers.host}`);if(u.pathname==='/health')return send(res,200,JSON.stringify({ok:true,service:'email-bot-hub',mode:'railway-bridge'}));if(u.pathname==='/api/bots')return send(res,200,JSON.stringify({ok:true,mode:'hybrid',bots},null,2));if(u.pathname.startsWith('/cf/')){const name=u.pathname.split('/')[2];const b=bots.find(x=>x.name===name);if(!b)return send(res,404,JSON.stringify({ok:false,error:'unknown bot'}));return proxy(req,res,b.url+u.pathname.split('/').slice(3).join('/'));}let file=u.pathname==='/'?'/index.html':u.pathname;const full=path.resolve(root,'site',file.slice(1));if(!full.startsWith(path.resolve(root,'site'))||!fs.existsSync(full))return send(res,404,'Not Found','text/plain');send(res,200,fs.readFileSync(full),mime[path.extname(full)]||'application/octet-stream')});server.listen(port,'0.0.0.0',()=>console.log(`email-bot-hub listening on ${port}`));
