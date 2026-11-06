import { useState } from 'react';
import type { User } from './model';
import { sendJson } from './api';
export default function AuthForm({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login'),
    [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await sendJson<{ user: User }>(`/api/auth/${mode}`, 'POST', {
        name,
        email,
        password,
      });
      setPassword('');
      onAuthenticated(result.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-form">
      <div className="auth-tabs">
        <button
          type="button"
          className={mode === 'login' ? 'selected' : ''}
          disabled={busy}
          onClick={() => {
            setMode('login');
            setError('');
          }}
        >
          Entrar
        </button>
        <button
          type="button"
          className={mode === 'register' ? 'selected' : ''}
          disabled={busy}
          onClick={() => {
            setMode('register');
            setError('');
          }}
        >
          Criar conta
        </button>
      </div>
      <p>
        {mode === 'login'
          ? 'Entre para consultar seus grupos.'
          : 'Crie sua conta para começar a organizar os gastos.'}
      </p>
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={submit}>
        {mode === 'register' && (
          <label>
            Seu nome
            <input
              required
              autoComplete="name"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </label>
        )}
        <label>
          E-mail
          <input
            required
            type="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
        </label>
        <label>
          Senha
          <input
            required
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            minLength={10}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
        </label>
        {mode === 'register' && (
          <p className="muted">Use uma senha com pelo menos 10 caracteres.</p>
        )}
        <button className="primary full" disabled={busy}>
          {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar minha conta'}
        </button>
      </form>
    </section>
  );
}
