// Serves the built site (dist/) and stores contact-form submissions.
// No dependencies. Usage: node server.mjs   (PORT defaults to 9204)
import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { appendFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';

// Minimal .env loader (Node 18 has no --env-file). Real environment variables win.
try {
  const envPath = fileURLToPath(new URL('./.env', import.meta.url));
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const root = resolve(fileURLToPath(new URL('./dist', import.meta.url)));
const dataFile = resolve(fileURLToPath(new URL('./data/inquiries.jsonl', import.meta.url)));
const port = Number(process.env.PORT ?? 9204);

// Notification mail. Enabled only when SMTP_HOST, SMTP_USER, SMTP_PASS and NOTIFY_TO are set.
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFY_TO, MAIL_FROM } = process.env;
const mailer = SMTP_HOST && SMTP_USER && SMTP_PASS && NOTIFY_TO
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 465),
      secure: Number(SMTP_PORT ?? 465) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

async function notify(entry) {
  if (!mailer) return;
  await mailer.sendMail({
    from: MAIL_FROM || SMTP_USER,
    to: NOTIFY_TO,
    replyTo: entry.email,
    subject: `[헬로월드] 새 문의: ${entry.role} (${entry.size})`,
    text: [
      '새 문의가 접수되었습니다. 이 메일에 답장하면 문의자에게 전달됩니다.',
      '',
      `회사 규모: ${entry.size}`,
      `직무: ${entry.role}`,
      `이메일: ${entry.email}`,
      '',
      '문의 내용:',
      entry.message,
    ].join('\n'),
  });
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const SIZES = ['1~10명', '11~50명', '51~200명', '201~1000명', '1000명 이상'];
const hits = new Map(); // ip -> timestamps, simple rate limit: 5 per hour

function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function handleInquiry(req, res) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 10_000) return send(res, 413, { error: '내용이 너무 깁니다.' });
  }
  let data;
  try { data = JSON.parse(raw); } catch { return send(res, 400, { error: '잘못된 요청입니다.' }); }

  if (data.website) return send(res, 200, { ok: true }); // honeypot: pretend success
  const ip = req.socket.remoteAddress ?? 'unknown';
  if (limited(ip)) return send(res, 429, { error: '잠시 후 다시 시도해 주세요.' });

  const entry = {
    size: String(data.size ?? '').trim(),
    role: String(data.role ?? '').trim().slice(0, 100),
    message: String(data.message ?? '').trim().slice(0, 4000),
    email: String(data.email ?? '').trim().slice(0, 200),
  };
  if (!SIZES.includes(entry.size)) return send(res, 400, { error: '회사 규모를 선택해 주세요.' });
  if (!entry.role) return send(res, 400, { error: '직무를 입력해 주세요.' });
  if (!entry.message) return send(res, 400, { error: '문의 내용을 입력해 주세요.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email)) return send(res, 400, { error: '이메일 주소를 확인해 주세요.' });

  await mkdir(resolve(dataFile, '..'), { recursive: true });
  await appendFile(dataFile, JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n');
  // The inquiry is already saved; a mail failure must not fail the visitor's submission.
  notify(entry).catch((err) => console.error('notify failed:', err.message));
  send(res, 200, { ok: true });
}

function serveFile(req, res) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let path = normalize(decodeURIComponent(url.pathname));
  let file = join(root, path);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    return existsSync(join(root, '404.html')) ? createReadStream(join(root, '404.html')).pipe(res) : res.end('Not found');
  }
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const pathname = (req.url ?? '/').split('?')[0];
  if (pathname === '/api/inquiry') {
    if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
    return handleInquiry(req, res).catch(() => send(res, 500, { error: '서버 오류입니다.' }));
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  serveFile(req, res);
}).listen(port, '0.0.0.0', () => console.log(`http://localhost:${port}/  (mail notification: ${mailer ? 'on' : 'off'})`));
