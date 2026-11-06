import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { openStore } from '../server/store.mjs';
import { createApp } from '../server/app.mjs';

test('Cadastro, sessão própria, persistência, isolamento e validação das despesas', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'dividi-test-'));
  let store = openStore(join(directory, 'test.sqlite'));
  const { server } = createApp({ store, secureCookie: false });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  async function request(path, { method = 'GET', cookie, body, headers = {} } = {}) {
    const res = await fetch(origin + path, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return {
      status: res.status,
      data: await res.json(),
      cookie: res.headers.get('set-cookie')?.split(';')[0],
      cookieHeader: res.headers.get('set-cookie'),
    };
  }
  try {
    assert.equal((await request('/api/data')).status, 401);
    const alice = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Ana', email: 'ANA@example.com', password: 'senha-de-teste-123' },
    });
    assert.equal(alice.status, 201);
    assert.equal(alice.data.user.email, 'ana@example.com');
    assert.match(alice.cookieHeader, /HttpOnly/);
    const aliceRecord = store.userByEmail('ana@example.com');
    assert.match(aliceRecord.password_hash, /^scrypt:/);
    assert.ok(!aliceRecord.password_hash.includes('senha-de-teste-123'));
    const group = {
      id: 'g1',
      name: 'Viagem',
      category: 'Viagem',
      people: [
        { id: 'ana', name: 'Ana' },
        { id: 'bia', name: 'Bia' },
      ],
      expenses: [
        {
          id: 'e1',
          title: 'Almoço',
          cents: 10001,
          payer: 'ana',
          shares: { ana: 5001, bia: 5000 },
          date: '2026-10-03',
        },
      ],
      payments: [],
    };
    const data = { name: 'Ana', groups: [group] };
    const saved = await request('/api/data', {
      method: 'PUT',
      cookie: alice.cookie,
      body: { version: 0, data },
    });
    assert.equal(saved.status, 200);
    assert.equal(saved.data.version, 1);
    assert.deepEqual((await request('/api/data', { cookie: alice.cookie })).data.data, data);
    assert.equal(
      (
        await request('/api/data', {
          method: 'PUT',
          cookie: alice.cookie,
          body: { version: 0, data },
        })
      ).status,
      409,
    );
    const invalid = structuredClone(data);
    invalid.groups[0].expenses[0].shares.ana = 5000;
    assert.equal(
      (
        await request('/api/data', {
          method: 'PUT',
          cookie: alice.cookie,
          body: { version: 1, data: invalid },
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request('/api/data', {
          method: 'PUT',
          cookie: alice.cookie,
          body: { version: 1, data },
          headers: { Origin: 'https://outro-site.example' },
        })
      ).status,
      403,
    );
    const bob = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Bia', email: 'bia@example.com', password: 'outra-senha-123' },
    });
    assert.equal(bob.status, 201);
    assert.deepEqual((await request('/api/data', { cookie: bob.cookie })).data.data.groups, []);
    assert.equal(
      (
        await request('/api/auth/login', {
          method: 'POST',
          body: { email: 'ana@example.com', password: 'senha-errada-123' },
        })
      ).status,
      401,
    );
    const signed = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'ana@example.com', password: 'senha-de-teste-123' },
    });
    assert.equal(signed.status, 200);
    await request('/api/auth/logout', { method: 'POST', cookie: signed.cookie });
    assert.equal((await request('/api/data', { cookie: signed.cookie })).status, 401);
    await new Promise((resolve) => server.close(resolve));
    store.close();
    store = openStore(join(directory, 'test.sqlite'));
    assert.deepEqual(store.getData(aliceRecord.id).data, data);
  } finally {
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('Cookie seguro em produção e limite de tentativas de login', async () => {
  const store = openStore(':memory:'),
    { server } = createApp({ store, production: true, publicOrigin: 'https://dividi.example' });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const registered = await fetch(origin + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://dividi.example' },
      body: JSON.stringify({
        name: 'Teste',
        email: 'test@example.com',
        password: 'senha-de-teste-123',
      }),
    });
    assert.equal(registered.status, 201);
    assert.match(registered.headers.get('set-cookie'), /; Secure/);
    let status = 0;
    for (let i = 0; i < 16; i++) {
      const res = await fetch(origin + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nobody@example.com', password: 'senha-incorreta-123' }),
      });
      status = res.status;
      await res.text();
    }
    assert.equal(status, 429);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.close();
  }
});
