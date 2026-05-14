import { useState } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '../api';
import type { AuthUser } from '../types';

export function LoginPage({
  onLogin,
  onCancel,
}: {
  onLogin: (user: AuthUser) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await apiFetch('/api/auth/login/', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || 'Ошибка входа.');
      } else {
        onLogin(data as AuthUser);
      }
    } catch {
      setError('Нет связи с сервером.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-overlay" role="dialog" aria-modal="true">
      <div className="contact-dialog">
        <div className="contact-header">
          <div>
            <h3>Вход</h3>
            <p>Доступ к управлению каталогом</p>
          </div>
          <button className="icon-button" onClick={onCancel} aria-label="Закрыть">
            <X size={16} />
          </button>
        </div>
        <form className="contact-form" onSubmit={submit}>
          <label>
            <span>Логин</span>
            <input
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            />
          </label>
          <label>
            <span>Пароль</span>
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="contact-form-actions contact-form-wide">
            <button type="button" className="cta-button cta-muted" onClick={onCancel}>
              Отмена
            </button>
            <button type="submit" className="cta-button" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
