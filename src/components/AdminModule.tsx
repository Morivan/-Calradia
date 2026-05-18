import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../api';
import { statusStyles } from '../data';
import { ProductFormModal } from './ProductFormModal';
import type { Product } from '../types';

type Me = { username: string; fullName: string; isStaff: boolean } | null;

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
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<Product | null | 'new'>(undefined as unknown as null);
  const formOpen = formTarget !== (undefined as unknown as null);

  useEffect(() => {
    apiFetch('/api/auth/me/')
      .then(r => r.ok ? r.json() : null)
      .then(data => setMe(data))
      .catch(() => setMe(null));
  }, []);

  const handleDelete = async (productId: string) => {
    if (!confirm('Удалить товар из каталога?')) return;
    setDeleting(productId);
    try {
      await apiFetch(`/api/catalog/products/${productId}/`, { method: 'DELETE' });
      onRefresh();
    } finally {
      setDeleting(null);
    }
  };

  if (me === 'loading') return <section className="admin-page"><p style={{ padding: '40px', color: 'var(--text-muted)' }}>Загрузка...</p></section>;
  if (!me || !me.isStaff) return <LoginForm onLogin={setMe} />;

  return (
    <section className="admin-page">
      {formOpen ? (
        <ProductFormModal
          product={formTarget === 'new' ? null : formTarget}
          onClose={() => setFormTarget(undefined as unknown as null)}
          onSaved={() => { onRefresh(); setFormTarget(undefined as unknown as null); }}
        />
      ) : null}

      <div className="admin-hero">
        <div>
          <p className="eyebrow">Управление · {me.fullName}</p>
          <h1>Каталог товаров</h1>
        </div>
        <button className="cta-button" onClick={() => setFormTarget('new')}>
          <Plus size={16} />
          Добавить товар
        </button>
      </div>

      <div className="secondary-card" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Название', 'Категория', 'Статус', 'Цена от', 'Создал', 'Изменил', ''].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <strong>{p.name}</strong>
                  <br />
                  <small style={{ color: 'var(--text-muted)' }}>{p.subtitle}</small>
                </td>
                <td style={{ padding: '12px 16px' }}>{p.category}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span className={statusStyles[p.status]}>{p.status}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>{p.priceFrom.toLocaleString('ru-RU')} ₽</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{p.createdBy ?? '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{p.updatedBy ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="icon-button" title="Редактировать" onClick={() => setFormTarget(p)}>
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button"
                      title="Удалить"
                      onClick={() => handleDelete(p.id)}
                      disabled={deleting === p.id}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
