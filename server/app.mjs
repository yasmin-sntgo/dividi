import { createServer } from 'node:http';
import {
  randomBytes,
  randomUUID,
  createHash,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { openStore } from './store.mjs';
import { payloadSchema } from './validation.mjs';

const scrypt = promisify(scryptCallback);
const emailSchema = z
  .string()
  .trim()
  .email('Informe um e-mail válido.')
  .max(254)
  .transform((s) => s.toLowerCase());
const credentials = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(10, 'A senha deve ter pelo menos 10 caracteres.')
    .max(128, 'A senha deve ter até 128 caracteres.'),
});
const registration = credentials.extend({
  name: z.string().trim().min(1, 'Informe seu nome.').max(60),
});
const tokenHash = (s) => createHash('sha256').update(s).digest('hex');
const sessionDuration = 7 * 24 * 60 * 60 * 1000;
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
async function passwordHash(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${key.toString('hex')}`;
}
async function passwordMatches(password, hash) {
  const [, salt, key] = hash.split(':');
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(key, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
const dummyHash = 'scrypt:00000000000000000000000000000000:' + '00'.repeat(64);
async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 2000000) throw new ApiError(413, 'Dados muito grandes.');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ApiError(400, 'Dados inválidos.');
  }
}
function validate(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) throw new ApiError(400, result.error.issues[0].message);
  return result.data;
}

export function createApp(options = {}) {
  const store = options.store || openStore();
  const production = options.production ?? process.env.NODE_ENV === 'production';
  const secure =
    options.secureCookie ??
    (process.env.DIVIDI_COOKIE_SECURE ? process.env.DIVIDI_COOKIE_SECURE === 'true' : production);
  const publicOrigin = options.publicOrigin || process.env.DIVIDI_PUBLIC_ORIGIN;
  const dist = resolve(options.dist || fileURLToPath(new URL('../dist', import.meta.url)));
  const limits = new Map();
  const cookie = (token, maxAge) =>
    `dividi_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
  function currentUser(req) {
    const token = req.headers.cookie
      ?.split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith('dividi_session='))
      ?.slice(15);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    return store.sessionUser(tokenHash(token));
  }
  function startSession(user, res) {
    const token = randomBytes(32).toString('hex');
    store.createSession(tokenHash(token), user.id, Date.now() + sessionDuration);
    res.setHeader('Set-Cookie', cookie(token, sessionDuration / 1000));
  }
  function checkOrigin(req) {
    if (req.headers['sec-fetch-site'] === 'cross-site')
      throw new ApiError(403, 'Solicitação não permitida.');
    const origin = req.headers.origin;
    if (!origin) return;
    const expected = publicOrigin || `${secure ? 'https' : 'http'}://${req.headers.host}`;
    if (origin !== expected) throw new ApiError(403, 'Solicitação não permitida.');
  }
  function rateLimit(req, email) {
    const now = Date.now();
    for (const [k, v] of limits) if (v.until <= now) limits.delete(k);
    if (limits.size > 10000)
      throw new ApiError(429, 'Muitas tentativas. Tente novamente mais tarde.');
    for (const [key, max] of [
      [`ip:${req.socket.remoteAddress}`, 40],
      [`email:${email}`, 15],
    ]) {
      const item = limits.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
      item.count++;
      limits.set(key, item);
      if (item.count > max) throw new ApiError(429, 'Muitas tentativas. Aguarde alguns minutos.');
    }
  }
  function json(res, status, value) {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify(value));
  }
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (path.startsWith('/api/')) {
        if (!['GET', 'HEAD'].includes(req.method)) checkOrigin(req);
        const user = currentUser(req);
        if (path === '/api/auth/me' && req.method === 'GET') {
          json(res, 200, { user: user ? { name: user.name, email: user.email } : null });
          return;
        }
        if (
          (path === '/api/auth/register' || path === '/api/auth/login') &&
          req.method === 'POST'
        ) {
          if (!req.headers['content-type']?.startsWith('application/json'))
            throw new ApiError(415, 'Envie dados JSON.');
          const raw = await readJson(req);
          if (!raw || typeof raw !== 'object') throw new ApiError(400, 'Dados inválidos.');
          rateLimit(
            req,
            typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : 'invalid',
          );
          if (path.endsWith('register')) {
            const value = validate(registration, raw);
            if (store.userByEmail(value.email))
              throw new ApiError(
                409,
                'Não foi possível criar esta conta. Se você já se cadastrou, use Entrar.',
              );
            const account = {
              id: randomUUID(),
              email: value.email,
              name: value.name,
              hash: await passwordHash(value.password),
            };
            try {
              store.createUser(account);
            } catch (e) {
              if (store.userByEmail(value.email))
                throw new ApiError(409, 'Conta já cadastrada. Use Entrar.');
              throw e;
            }
            startSession(account, res);
            json(res, 201, { user: { name: account.name, email: account.email } });
            return;
          }
          const value = validate(credentials, raw),
            account = store.userByEmail(value.email);
          const valid = await passwordMatches(value.password, account?.password_hash || dummyHash);
          if (!account || !valid) throw new ApiError(401, 'E-mail ou senha incorretos.');
          startSession(account, res);
          json(res, 200, { user: { name: account.name, email: account.email } });
          return;
        }
        if (path === '/api/auth/logout' && req.method === 'POST') {
          const token = req.headers.cookie
            ?.split(';')
            .map((s) => s.trim())
            .find((s) => s.startsWith('dividi_session='))
            ?.slice(15);
          if (token) store.deleteSession(tokenHash(token));
          res.setHeader('Set-Cookie', cookie('', 0));
          json(res, 200, { ok: true });
          return;
        }
        if (!user) throw new ApiError(401, 'Entre na sua conta para acessar seus grupos.');
        if (path === '/api/data' && req.method === 'GET') {
          json(res, 200, store.getData(user.id));
          return;
        }
        if (path === '/api/data' && req.method === 'PUT') {
          if (!req.headers['content-type']?.startsWith('application/json'))
            throw new ApiError(415, 'Envie dados JSON.');
          const { data, version } = validate(payloadSchema, await readJson(req));
          if (!store.saveData(user.id, data, version))
            throw new ApiError(409, 'Os dados mudaram em outra aba. Recarregue antes de salvar.');
          json(res, 200, { data, version: version + 1 });
          return;
        }
        throw new ApiError(404, 'Recurso não encontrado.');
      }
      if (!['GET', 'HEAD'].includes(req.method)) throw new ApiError(405, 'Método não permitido.');
      if (path.startsWith('/.')) throw new ApiError(404, 'Página não encontrada.');
      const candidate = resolve(dist, '.' + decodeURIComponent(path));
      if (candidate !== dist && !candidate.startsWith(dist + sep))
        throw new ApiError(404, 'Página não encontrada.');
      let file = candidate;
      try {
        if (!(await stat(file)).isFile()) file = resolve(dist, 'index.html');
      } catch {
        if (extname(path)) throw new ApiError(404, 'Arquivo não encontrado.');
        file = resolve(dist, 'index.html');
      }
      const actual = await realpath(file),
        root = await realpath(dist);
      if (!actual.startsWith(root + sep)) throw new ApiError(404, 'Arquivo não encontrado.');
      const content = await readFile(actual);
      res.writeHead(200, {
        'Content-Type': mime[extname(file)] || 'application/octet-stream',
        'Cache-Control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=3600',
      });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (e) {
      if (!e.status) console.error('Erro no servidor Dividi:', e);
      json(res, e.status || 500, {
        error: e.status ? e.message : 'Não foi possível concluir a solicitação. Tente novamente.',
      });
    }
  });
  server.headersTimeout = 15000;
  server.requestTimeout = 30000;
  server.on('close', () => {
    if (!options.store) store.close();
  });
  return { server, store };
}
