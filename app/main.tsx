import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Dividi from './dividi';
import './globals.css';
import type { User } from './model';
import { request, sendJson } from './api';
function App() {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await request<{ user: User | null }>('/api/auth/me');
      setUser(data.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function logout() {
    await sendJson('/api/auth/logout', 'POST');
    setUser(null);
  }
  if (loading) return <div className="loading">Carregando Dividi…</div>;
  if (error)
    return (
      <div className="auth-unavailable">
        <h1>Não foi possível conectar</h1>
        <p>{error}</p>
        <button className="primary" onClick={() => void load()}>
          Tentar novamente
        </button>
      </div>
    );
  return (
    <Dividi
      key={user?.email || 'visitor'}
      user={user}
      onAuthenticated={setUser}
      onLogout={logout}
    />
  );
}
createRoot(document.getElementById('root')!).render(<App />);
