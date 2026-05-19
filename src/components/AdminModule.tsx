import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import type { Product } from '../types';
import { WorkshopPanel } from './WorkshopPanel';

type Me = { id: number; username: string; fullName: string; isStaff: boolean } | null;

function LoginForm({ onLogin }: { onLogin: (me: Me) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await apiFetch('/api/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.detail ?? 'Ошибка входа.');
      } else {
        onLogin(data);
      }
    } catch {
      setError('Нет связи с сервером.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <p className="eyebrow">Управление</p>
          <h1>Вход в панель</h1>
        </div>
      </div>
      <div className="secondary-card" style={{ maxWidth: 360, padding: '24px' }}>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label className="product-form-field">
            <span>Логин</span>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required />
          </label>
          <label className="product-form-field">
            <span>Пароль</span>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="cta-button" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </section>
  );
}

export function AdminModule({
  products,
  onRefresh,
}: {
  products: Product[];
  onRefresh: () => void;
}) {
  const [me, setMe] = useState<Me | 'loading'>('loading');

  useEffect(() => {
    apiFetch('/api/auth/me/')
      .then(r => r.ok ? r.json() : null)
      .then(data => setMe(data))
      .catch(() => setMe(null));
  }, []);

  if (me === 'loading') {
    return <section className="admin-page"><p style={{ padding: '40px', color: 'var(--text-muted)' }}>Загрузка...</p></section>;
  }
  if (!me || !me.isStaff) return <LoginForm onLogin={setMe} />;

  return <WorkshopPanel me={me} products={products} onRefresh={onRefresh} />;
}
