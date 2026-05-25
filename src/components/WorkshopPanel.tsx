import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Clock, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { apiFetch } from '../api';
import { statusStyles } from '../data';
import { ProductFormModal } from './ProductFormModal';
import type { Product } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

type OrderTask = {
  id: number;
  product_id: number | null;
  product_name: string;
  status: string;
  assigned_to_id: number | null;
};

type OrderRecord = {
  id: number;
  client_id: number | null;
  client_name: string;
  client_vk: string;
  product_name: string;
  configuration: string;
  status: string;
  deadline: string | null;
  total: number;
  advance: number;
  balance: number;
  notes: string;
  assigned_to_id: number | null;
  assigned_to_name: string | null;
  created_at: string;
  order_type: string;
  set_id: number | null;
  set_name: string | null;
  tasks: OrderTask[];
};

type ClientRecord = {
  id: number;
  name: string;
  vk_url: string;
  status: string;
  notes: string;
  order_count: number;
  created_at: string;
};

type StaffUser = { id: number; username: string; fullName: string };

type MyOrderRow = {
  id: number;
  client_name: string;
  product_name: string;
  status: string;
  deadline: string | null;
  days_left: number | null;
};

type DashboardData = {
  status_counts: Record<string, number>;
  upcoming_deadlines: Array<{
    id: number;
    client_name: string;
    product_name: string;
    deadline: string;
    days_left: number;
    status: string;
    assigned_to_name: string | null;
  }>;
  my_active_count: number;
  my_orders: MyOrderRow[];
};

type Me = { id: number; username: string; fullName: string; isStaff: boolean; isSuperuser?: boolean };

type ProductSet = {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  image: string;
  badge: string;
  price_from: number;
  price_individual: number;
  discount: number;
  products: Array<{ id: number; name: string; slug: string; price_from: number; image: string }>;
};


type ApprovalEntry = {
  user_id: number;
  username: string;
  fullName: string;
  approved_product_ids: number[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

const ORDER_STATUSES = ['Новый', 'В работе', 'Выполнен', 'Отменён'] as const;
const CLIENT_STATUSES = ['Потенциальный', 'Действующий', 'Завершён'] as const;

const ORDER_STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  'Новый':    { bg: 'rgba(59,130,246,0.18)',  fg: '#93c5fd' },
  'В работе': { bg: 'rgba(245,158,11,0.18)',  fg: '#fcd34d' },
  'Выполнен': { bg: 'rgba(74,222,128,0.18)',  fg: '#86efac' },
  'Отменён':  { bg: 'rgba(239,68,68,0.18)',   fg: '#fca5a5' },
};

const CLIENT_STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  'Потенциальный': { bg: 'rgba(107,114,128,0.18)', fg: '#9ca3af' },
  'Действующий':   { bg: 'rgba(59,130,246,0.18)',  fg: '#93c5fd' },
  'Завершён':      { bg: 'rgba(74,222,128,0.18)',  fg: '#86efac' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function Badge({ text, colors }: { text: string; colors: Record<string, { bg: string; fg: string }> }) {
  const c = colors[text] ?? { bg: 'rgba(107,114,128,0.18)', fg: '#9ca3af' };
  return (
    <span style={{
      background: c.bg, color: c.fg,
      padding: '2px 10px', borderRadius: 12,
      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' as const,
    }}>{text}</span>
  );
}

function fmtMoney(n: number) {
  return n ? `${n.toLocaleString('ru-RU')} ₽` : '—';
}

function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(iso).getTime() - today.getTime()) / 86_400_000);
}

function fmtDate(iso: string | null) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function DeadlinePill({ deadline }: { deadline: string | null }) {
  const days = daysLeft(deadline);
  if (days === null) return null;
  const color = days < 0 ? '#fca5a5' : days <= 3 ? '#fb923c' : days <= 7 ? '#fcd34d' : '#86efac';
  const label = days < 0 ? `просрочен ${-days}д` : days === 0 ? 'сегодня' : `${days}д`;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color }}>
      {fmtDate(deadline)} ({label})
    </span>
  );
}

// ── New Order Modal ───────────────────────────────────────────────────────────

function NewOrderModal({
  onClose, onSaved,
}: {
  onClose: () => void;
  onSaved: (o: OrderRecord) => void;
}) {
  const [orderType, setOrderType] = useState<'product' | 'set' | 'service'>('product');
  const [products, setProducts] = useState<Product[]>([]);
  const [sets, setSets] = useState<ProductSet[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [setSearch, setSetSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSet, setSelectedSet] = useState<ProductSet | null>(null);
  const [form, setForm] = useState({
    client_name: '',
    client_vk: '',
    product_name: '',
    total: '',
    advance: '',
    deadline: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderType === 'product') {
      apiFetch('/api/catalog/products/').then(r => r.ok ? r.json() : []).then(setProducts);
    } else if (orderType === 'set') {
      apiFetch('/api/workshop/sets/').then(r => r.ok ? r.json() : []).then(setSets);
    }
  }, [orderType]);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val = e.target.value;
      setForm(f => {
        const next = { ...f, [k]: val };
        if (k === 'total') next.advance = String(Math.floor((parseInt(val) || 0) / 2));
        return next;
      });
    };

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    const total = p.priceFrom;
    setForm(f => ({ ...f, total: String(total), advance: String(Math.floor(total / 2)) }));
    setProductSearch('');
  };

  const handleSelectSet = (s: ProductSet) => {
    setSelectedSet(s);
    const total = s.price_from;
    setForm(f => ({ ...f, total: String(total), advance: String(Math.floor(total / 2)) }));
    setSetSearch('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        order_type: orderType,
        client_name: form.client_name,
        client_vk: form.client_vk,
        total: parseInt(form.total) || 0,
        advance_override: form.advance ? parseInt(form.advance) : null,
        deadline: form.deadline || null,
        notes: form.notes,
      };
      if (orderType === 'product' && selectedProduct) {
        body.product_id = selectedProduct.id;
      } else if (orderType === 'set' && selectedSet) {
        body.set_id = selectedSet.id;
      } else if (orderType === 'service') {
        body.product_name = form.product_name;
      }
      const resp = await apiFetch('/api/workshop/orders/create/', {
        method: 'POST', body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) { setError(data.detail ?? 'Ошибка сохранения.'); return; }
      onSaved(data as OrderRecord);
    } catch {
      setError('Нет связи с сервером.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );
  const filteredSets = sets.filter(s =>
    s.name.toLowerCase().includes(setSearch.toLowerCase())
  );

  return (
    <div className="ws-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ws-modal-box" style={{ maxWidth: 560 }}>
        <div className="ws-modal-header">
          <h2 style={{ margin: 0, fontSize: 18 }}>Новый заказ</h2>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Order type selector */}
          <div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Тип заказа</span>
            <div style={{ display: 'flex', gap: 0, background: 'var(--bg-panel-soft)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
              {(['product', 'set', 'service'] as const).map((t, i) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setOrderType(t); setSelectedProduct(null); setSelectedSet(null); setForm(f => ({ ...f, total: '' })); }}
                  style={{
                    flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 600,
                    background: orderType === t ? 'var(--accent)' : 'transparent',
                    color: orderType === t ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer', border: 'none',
                    borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {t === 'product' ? 'Предмет' : t === 'set' ? 'Комплект' : 'Услуга'}
                </button>
              ))}
            </div>
          </div>

          {/* Product selector */}
          {orderType === 'product' && (
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Предмет</span>
              {selectedProduct ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-panel-soft)', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <span style={{ flex: 1, fontSize: 14 }}>{selectedProduct.name}</span>
                  <button type="button" className="icon-button" onClick={() => { setSelectedProduct(null); setForm(f => ({ ...f, total: '' })); }}><X size={14} /></button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    placeholder="Поиск предмета..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-panel-soft)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-main)', outline: 'none' }}
                  />
                  {productSearch && filteredProducts.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, maxHeight: 200, overflowY: 'auto', marginTop: 2 }}>
                      {filteredProducts.slice(0, 10).map(p => (
                        <div key={p.id} onClick={() => handleSelectProduct(p)}
                          style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-panel-soft)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <strong>{p.name}</strong>
                          <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{p.priceFrom.toLocaleString('ru-RU')} ₽</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Set selector */}
          {orderType === 'set' && (
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Комплект</span>
              {selectedSet ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-panel-soft)', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <span style={{ flex: 1, fontSize: 14 }}>{selectedSet.name}</span>
                  <button type="button" className="icon-button" onClick={() => { setSelectedSet(null); setForm(f => ({ ...f, total: '' })); }}><X size={14} /></button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    placeholder="Поиск комплекта..."
                    value={setSearch}
                    onChange={e => setSetSearch(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-panel-soft)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-main)', outline: 'none' }}
                  />
                  {setSearch && filteredSets.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, maxHeight: 200, overflowY: 'auto', marginTop: 2 }}>
                      {filteredSets.slice(0, 10).map(s => (
                        <div key={s.id} onClick={() => handleSelectSet(s)}
                          style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-panel-soft)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <strong>{s.name}</strong>
                          <span style={{ marginLeft: 8, color: '#86efac', fontWeight: 600 }}>{s.price_from.toLocaleString('ru-RU')} ₽</span>
                          {s.discount > 0 && <span style={{ marginLeft: 6, color: 'var(--text-muted)', fontSize: 11, textDecoration: 'line-through' }}>{s.price_individual.toLocaleString('ru-RU')} ₽</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Service name */}
          {orderType === 'service' && (
            <label className="product-form-field">
              <span>Название услуги</span>
              <input value={form.product_name} onChange={set('product_name')} placeholder="Опишите услугу..." />
            </label>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <label className="product-form-field">
              <span>Клиент *</span>
              <input value={form.client_name} onChange={set('client_name')} required />
            </label>
            <label className="product-form-field">
              <span>ВКонтакте клиента</span>
              <input value={form.client_vk} onChange={set('client_vk')} placeholder="https://vk.com/..." />
            </label>
          </div>

          {selectedSet && selectedSet.discount > 0 && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(74,222,128,0.15)', color: '#86efac', fontSize: 13, fontWeight: 600 }}>
              Скидка комплекта: {selectedSet.discount.toLocaleString('ru-RU')} ₽
              <span style={{ fontWeight: 400, marginLeft: 8 }}>
                (по отдельности {selectedSet.price_individual.toLocaleString('ru-RU')} ₽)
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <label className="product-form-field">
              <span>Сумма, ₽</span>
              <input type="number" min="0" value={form.total} onChange={set('total')} placeholder="Авто" />
            </label>
            <label className="product-form-field">
              <span>Аванс, ₽ <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 11 }}>(50% авто)</span></span>
              <input type="number" min="0" value={form.advance} onChange={set('advance')} placeholder="Авто" />
            </label>
            <label className="product-form-field">
              <span>Дедлайн</span>
              <input type="date" value={form.deadline} onChange={set('deadline')} />
            </label>
          </div>

          <label className="product-form-field">
            <span>Примечания</span>
            <textarea value={form.notes} onChange={set('notes')} rows={2} />
          </label>

          {error && <p className="form-error">{error}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="icon-button" style={{ padding: '8px 20px' }} onClick={onClose}>Отмена</button>
            <button type="submit" className="cta-button" disabled={loading}>
              {loading ? 'Сохранение...' : 'Создать заказ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Order Form Modal (edit only) ──────────────────────────────────────────────

function OrderFormModal({
  order, staffUsers, currentUserId, isSuperuser, onClose, onSaved,
}: {
  order: Partial<OrderRecord>;
  staffUsers: StaffUser[];
  currentUserId: number;
  isSuperuser: boolean;
  onClose: () => void;
  onSaved: (o: OrderRecord) => void;
}) {
  const [form, setForm] = useState({
    client_name: order?.client_name ?? '',
    product_name: order?.product_name ?? '',
    configuration: order?.configuration ?? '',
    status: order?.status ?? 'Новый',
    deadline: order?.deadline?.slice(0, 10) ?? '',
    total: String(order?.total ?? ''),
    advance: String(order?.advance ?? ''),
    notes: order?.notes ?? '',
    assigned_to_id: String(order?.assigned_to_id ?? currentUserId),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = {
        ...form,
        total: parseInt(form.total) || 0,
        advance: parseInt(form.advance) || 0,
        assigned_to_id: form.assigned_to_id ? parseInt(form.assigned_to_id) : null,
      };
      const resp = await apiFetch(`/api/workshop/orders/${order!.id}/`, { method: 'PATCH', body: JSON.stringify(body) });
      const data = await resp.json();
      if (!resp.ok) { setError(data.detail ?? 'Ошибка сохранения.'); return; }
      onSaved(data as OrderRecord);
    } catch {
      setError('Нет связи с сервером.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ws-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ws-modal-box">
        <div className="ws-modal-header">
          <h2 style={{ margin: 0, fontSize: 18 }}>Редактировать заказ</h2>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <label className="product-form-field">
              <span>Клиент *</span>
              <input value={form.client_name} onChange={set('client_name')} required />
            </label>
            <label className="product-form-field">
              <span>Изделие</span>
              <input value={form.product_name} onChange={set('product_name')} />
            </label>
          </div>
          <label className="product-form-field">
            <span>Конфигурация</span>
            <textarea value={form.configuration} onChange={set('configuration')} rows={2} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: isSuperuser ? '1fr 1fr 1fr' : '1fr 1fr', gap: 14 }}>
            <label className="product-form-field">
              <span>Статус</span>
              <select value={form.status} onChange={set('status')}>
                {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="product-form-field">
              <span>Дедлайн</span>
              <input type="date" value={form.deadline} onChange={set('deadline')} />
            </label>
            {isSuperuser && (
              <label className="product-form-field">
                <span>Ответственный</span>
                <select value={form.assigned_to_id} onChange={set('assigned_to_id')}>
                  <option value="">—</option>
                  {staffUsers.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </label>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <label className="product-form-field">
              <span>Сумма, ₽</span>
              <input type="number" min="0" value={form.total} onChange={set('total')} />
            </label>
            <label className="product-form-field">
              <span>Аванс, ₽</span>
              <input type="number" min="0" value={form.advance} onChange={set('advance')} />
            </label>
          </div>
          <label className="product-form-field">
            <span>Примечания</span>
            <textarea value={form.notes} onChange={set('notes')} rows={2} />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="icon-button" style={{ padding: '8px 20px' }} onClick={onClose}>Отмена</button>
            <button type="submit" className="cta-button" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Client Form Modal ─────────────────────────────────────────────────────────

function ClientFormModal({
  client, onClose, onSaved,
}: {
  client: ClientRecord | null;
  onClose: () => void;
  onSaved: (c: ClientRecord) => void;
}) {
  const isNew = !client;
  const [form, setForm] = useState({
    name: client?.name ?? '',
    vk_url: client?.vk_url ?? '',
    status: client?.status ?? 'Потенциальный',
    notes: client?.notes ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const url = isNew ? '/api/workshop/clients/' : `/api/workshop/clients/${client!.id}/`;
      const resp = await apiFetch(url, { method: isNew ? 'POST' : 'PATCH', body: JSON.stringify(form) });
      const data = await resp.json();
      if (!resp.ok) { setError(data.detail ?? 'Ошибка сохранения.'); return; }
      onSaved(data as ClientRecord);
    } catch {
      setError('Нет связи с сервером.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ws-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ws-modal-box" style={{ maxWidth: 440 }}>
        <div className="ws-modal-header">
          <h2 style={{ margin: 0, fontSize: 18 }}>{isNew ? 'Новый клиент' : 'Редактировать клиента'}</h2>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label className="product-form-field">
            <span>Имя и Фамилия *</span>
            <input value={form.name} onChange={set('name')} required />
          </label>
          <label className="product-form-field">
            <span>ВКонтакте (ссылка)</span>
            <input value={form.vk_url} onChange={set('vk_url')} placeholder="https://vk.com/..." />
          </label>
          <label className="product-form-field">
            <span>Статус</span>
            <select value={form.status} onChange={set('status')}>
              {CLIENT_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="product-form-field">
            <span>Заметки</span>
            <textarea value={form.notes} onChange={set('notes')} rows={3} />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="icon-button" style={{ padding: '8px 20px' }} onClick={onClose}>Отмена</button>
            <button type="submit" className="cta-button" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────

// ── Order Detail Modal (read-only + take/done for masters) ────────────────────

function OrderDetailModal({
  orderId, meId, isSuperuser, approvedProductIds, onClose, onUpdated,
}: {
  orderId: number;
  meId: number;
  isSuperuser: boolean;
  approvedProductIds: number[];
  onClose: () => void;
  onUpdated: (order: OrderRecord) => void;
}) {
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch(`/api/workshop/orders/${orderId}/`).then(r => r.ok ? r.json() : null).then(setOrder);
  }, [orderId]);

  const patchTask = async (taskId: number, action: string) => {
    setSaving(true);
    try {
      const r = await apiFetch(`/api/workshop/tasks/${taskId}/`, {
        method: 'PATCH', body: JSON.stringify({ action }),
      });
      if (r.ok) {
        const res = await apiFetch(`/api/workshop/orders/${orderId}/`);
        if (res.ok) { const updated = await res.json(); setOrder(updated); onUpdated(updated); }
      }
    } finally { setSaving(false); }
  };

  if (!order) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <p style={{ color: 'var(--text-muted)', padding: 32 }}>Загрузка...</p>
      </div>
    </div>
  );

  const takeableTask = order.tasks.find(t =>
    t.status === 'pending' && (isSuperuser || (t.product_id !== null && approvedProductIds.includes(t.product_id)))
  );
  const myTask = order.tasks.find(t => t.assigned_to_id === meId && t.status === 'taken');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Заказ #{order.id}</p>
            <h2 style={{ margin: '4px 0 0', fontSize: 20 }}>{order.product_name || '—'}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="secondary-card" style={{ padding: '10px 14px' }}>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Клиент</p>
              <p style={{ margin: '4px 0 0', fontWeight: 700 }}>
                {order.client_vk
                  ? <a href={order.client_vk} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>{order.client_name}</a>
                  : order.client_name}
              </p>
            </div>
            <div className="secondary-card" style={{ padding: '10px 14px' }}>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Дедлайн</p>
              <p style={{ margin: '4px 0 0', fontWeight: 700 }}><DeadlinePill deadline={order.deadline} /></p>
            </div>
            <div className="secondary-card" style={{ padding: '10px 14px' }}>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Сумма / Аванс</p>
              <p style={{ margin: '4px 0 0', fontWeight: 700 }}>{fmtMoney(order.total)} / {fmtMoney(order.advance)}</p>
            </div>
            <div className="secondary-card" style={{ padding: '10px 14px' }}>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Статус</p>
              <p style={{ margin: '4px 0 0', fontWeight: 700 }}>{order.status}</p>
            </div>
          </div>
          {order.configuration && (
            <div className="secondary-card" style={{ padding: '10px 14px' }}>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Конфигурация</p>
              <p style={{ margin: '4px 0 0' }}>{order.configuration}</p>
            </div>
          )}
          {order.notes && (
            <div className="secondary-card" style={{ padding: '10px 14px' }}>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Примечания</p>
              <p style={{ margin: '4px 0 0' }}>{order.notes}</p>
            </div>
          )}
          {order.assigned_to_name && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              Исполнитель: <strong style={{ color: 'var(--text-main)' }}>{order.assigned_to_name}</strong>
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' as const }}>
          {takeableTask && !myTask && (
            <button
              className="cta-button"
              disabled={saving}
              onClick={() => patchTask(takeableTask.id, 'take')}
              style={{ flex: 1 }}
            >
              {saving ? '...' : 'Взять заказ'}
            </button>
          )}
          {myTask && (
            <>
              <button
                className="cta-button"
                disabled={saving}
                onClick={() => patchTask(myTask.id, 'done')}
                style={{ flex: 1, background: 'rgba(74,222,128,0.2)', color: '#86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <CheckCircle size={14} /> {saving ? '...' : 'Выполнено'}
              </button>
              <button
                disabled={saving}
                onClick={() => patchTask(myTask.id, 'release')}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}
              >
                Вернуть
              </button>
            </>
          )}
          {!takeableTask && !myTask && order.status !== 'Выполнен' && order.status !== 'Отменён' && !isSuperuser && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              Нет допуска к этому предмету
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Order status badge ────────────────────────────────────────────────────────

const ORDER_STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  'Новый':    { bg: 'rgba(147,197,253,0.15)', fg: '#93c5fd' },
  'В работе': { bg: 'rgba(252,211,77,0.15)',  fg: '#fcd34d' },
  'Выполнен': { bg: 'rgba(134,239,172,0.15)', fg: '#86efac' },
  'Отменён':  { bg: 'rgba(156,163,175,0.12)', fg: '#9ca3af' },
};

function OrderStatusBadge({ status }: { status: string }) {
  const s = ORDER_STATUS_STYLE[status] ?? { bg: 'rgba(255,255,255,0.06)', fg: 'var(--text-muted)' };
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: s.bg, color: s.fg }}>
      {status}
    </span>
  );
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────

function DashboardTab({ me, approvedProductIds }: { me: Me; approvedProductIds: number[] }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);

  useEffect(() => {
    apiFetch('/api/workshop/dashboard/').then(r => r.ok ? r.json() : null).then(setData);
  }, []);

  if (!data) return <p style={{ padding: 32, color: 'var(--text-muted)' }}>Загрузка...</p>;

  const sc = data.status_counts;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {detailOrderId !== null && (
        <OrderDetailModal
          orderId={detailOrderId}
          meId={me.id}
          isSuperuser={!!me.isSuperuser}
          approvedProductIds={approvedProductIds}
          onClose={() => setDetailOrderId(null)}
          onUpdated={() => setDetailOrderId(null)}
        />
      )}

      {/* ── Status counters ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
        {[
          { label: 'Новых',     key: 'Новый',    fg: '#93c5fd' },
          { label: 'В работе',  key: 'В работе', fg: '#fcd34d' },
          { label: 'Выполнено', key: 'Выполнен', fg: '#86efac' },
          { label: 'Отменено',  key: 'Отменён',  fg: '#9ca3af' },
        ].map(({ label, key, fg }) => (
          <div key={key} className="secondary-card" style={{ padding: '16px 20px' }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{label}</p>
            <p style={{ margin: '4px 0 0', fontSize: 30, fontWeight: 800, color: fg }}>{sc[key] ?? 0}</p>
          </div>
        ))}
        <div className="secondary-card" style={{ padding: '16px 20px' }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Мои активные</p>
          <p style={{ margin: '4px 0 0', fontSize: 30, fontWeight: 800 }}>{data.my_active_count}</p>
        </div>
      </div>

      {/* ── My orders (sorted by deadline) ── */}
      <div className="secondary-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={14} /> Мои заказы
          {data.my_orders.length > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>
              {data.my_orders.length} {plural(data.my_orders.length, 'заказ', 'заказа', 'заказов')} · по дедлайну ↑
            </span>
          )}
        </div>
        {data.my_orders.length === 0
          ? <p style={{ padding: '16px 18px', color: 'var(--text-muted)', fontSize: 13 }}>
              Нет взятых заказов
            </p>
          : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {data.my_orders.map(o => {
                  const urgent = o.days_left !== null && o.days_left <= 3;
                  const soon   = o.days_left !== null && o.days_left <= 7 && o.days_left > 3;
                  const deadlineFg = urgent ? '#f87171' : soon ? '#fbbf24' : 'var(--text-muted)';
                  return (
                    <tr
                      key={o.id}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => setDetailOrderId(o.id)}
                    >
                      <td style={{ padding: '10px 18px' }}>
                        <strong style={{ fontSize: 13 }}>{o.product_name || o.client_name}</strong>
                        {o.product_name && o.client_name && (
                          <><br /><span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{o.client_name}</span></>
                        )}
                      </td>
                      <td style={{ padding: '10px 18px' }}>
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td style={{ padding: '10px 18px', whiteSpace: 'nowrap' as const, color: deadlineFg, fontWeight: urgent ? 700 : 400 }}>
                        {o.deadline
                          ? <><DeadlinePill deadline={o.deadline} /></>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        }
      </div>

      {/* ── All upcoming deadlines (whole workshop) ── */}
      <div className="secondary-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={14} /> Дедлайны мастерской (14 дней)
        </div>
        {data.upcoming_deadlines.length === 0
          ? <p style={{ padding: '16px 18px', color: 'var(--text-muted)', fontSize: 13 }}>Горящих заказов нет</p>
          : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {data.upcoming_deadlines.map(d => (
                  <tr
                    key={d.id}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => setDetailOrderId(d.id)}
                  >
                    <td style={{ padding: '10px 18px' }}>
                      <strong>{d.product_name || d.client_name}</strong>
                      <br /><span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{d.client_name}</span>
                    </td>
                    <td style={{ padding: '10px 18px', whiteSpace: 'nowrap' as const }}>
                      <DeadlinePill deadline={d.deadline} />
                    </td>
                    <td style={{ padding: '10px 18px', color: 'var(--text-muted)', fontSize: 12 }}>
                      {d.assigned_to_name ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

// ── Orders Tab (Kanban) ───────────────────────────────────────────────────────

function OrdersTab({ me, approvedProductIds }: { me: Me; approvedProductIds: number[] }) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editOrder, setEditOrder] = useState<OrderRecord | undefined>(undefined);
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch(`/api/workshop/orders/${mine ? '?mine=1' : ''}`);
      if (r.ok) setOrders(await r.json());
    } finally {
      setLoading(false);
    }
  }, [mine]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    apiFetch('/api/workshop/users/').then(r => r.ok ? r.json() : []).then(setStaffUsers);
  }, []);

  const handleSaved = (o: OrderRecord) => {
    setOrders(prev => {
      const idx = prev.findIndex(x => x.id === o.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = o; return next; }
      return [o, ...prev];
    });
    setShowNewModal(false);
    setEditOrder(undefined);
  };

  const quickStatus = async (order: OrderRecord, newStatus: string) => {
    const r = await apiFetch(`/api/workshop/orders/${order.id}/`, {
      method: 'PATCH', body: JSON.stringify({ status: newStatus }),
    });
    if (r.ok) {
      const updated = await r.json() as OrderRecord;
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
    }
  };

  return (
    <div>
      {showNewModal && (
        <NewOrderModal
          onClose={() => setShowNewModal(false)}
          onSaved={handleSaved}
        />
      )}
      {editOrder !== undefined && (
        <OrderFormModal
          order={editOrder}
          staffUsers={staffUsers}
          currentUserId={me.id}
          isSuperuser={!!me.isSuperuser}
          onClose={() => setEditOrder(undefined)}
          onSaved={handleSaved}
        />
      )}
      {detailOrderId !== null && (
        <OrderDetailModal
          orderId={detailOrderId}
          meId={me.id}
          isSuperuser={!!me.isSuperuser}
          approvedProductIds={approvedProductIds}
          onClose={() => setDetailOrderId(null)}
          onUpdated={updated => {
            setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
            setDetailOrderId(null);
          }}
        />
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', background: 'var(--bg-panel-soft)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <button
            style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, background: !mine ? 'var(--accent)' : 'transparent', color: !mine ? '#fff' : 'var(--text-muted)', cursor: 'pointer', border: 'none' }}
            onClick={() => setMine(false)}>Все заказы</button>
          <button
            style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, background: mine ? 'var(--accent)' : 'transparent', color: mine ? '#fff' : 'var(--text-muted)', cursor: 'pointer', border: 'none' }}
            onClick={() => setMine(true)}>Мои</button>
        </div>
        <button className="cta-button" style={{ marginLeft: 'auto', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => setShowNewModal(true)}>
          <Plus size={15} /> Новый заказ
        </button>
      </div>

      <div className="ws-kanban">
        {ORDER_STATUSES.map(col => {
          const colOrders = orders.filter(o => o.status === col);
          const clr = ORDER_STATUS_COLORS[col];
          return (
            <div key={col} className="ws-kanban-col">
              <div className="ws-kanban-col-hdr" style={{ background: clr.bg, color: clr.fg }}>
                <span>{col}</span>
                <span className="ws-kanban-cnt">{colOrders.length}</span>
              </div>
              <div className="ws-kanban-cards">
                {loading && col === 'Новый' && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: 8 }}>Загрузка...</p>
                )}
                {colOrders.map(order => (
                  <div
                    key={order.id}
                    className="ws-kanban-card"
                    onClick={() => me.isSuperuser ? setEditOrder(order) : setDetailOrderId(order.id)}
                  >
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{order.product_name || order.client_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.client_name}</div>
                    <DeadlinePill deadline={order.deadline} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: 13 }}>
                      <span>{fmtMoney(order.total)}</span>
                      {order.assigned_to_name && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{order.assigned_to_name}</span>}
                    </div>
                    <div className="ws-status-btns" onClick={e => e.stopPropagation()}>
                      {ORDER_STATUSES.filter(s => s !== col).map(s => (
                        <button key={s} className="ws-status-btn"
                          style={{ background: ORDER_STATUS_COLORS[s].bg, color: ORDER_STATUS_COLORS[s].fg }}
                          onClick={() => quickStatus(order, s)}>
                          → {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Clients Tab ───────────────────────────────────────────────────────────────

function ClientsTab() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [q, setQ] = useState('');
  const [editClient, setEditClient] = useState<ClientRecord | 'new' | undefined>(undefined);

  useEffect(() => {
    apiFetch(`/api/workshop/clients/${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then(r => r.ok ? r.json() : [])
      .then(setClients);
  }, [q]);

  const handleSaved = (c: ClientRecord) => {
    setClients(prev => {
      const idx = prev.findIndex(x => x.id === c.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = c; return next; }
      return [c, ...prev];
    });
    setEditClient(undefined);
  };

  return (
    <div>
      {editClient !== undefined && (
        <ClientFormModal
          client={editClient === 'new' ? null : editClient}
          onClose={() => setEditClient(undefined)}
          onSaved={handleSaved}
        />
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' as const }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            style={{ padding: '8px 12px 8px 34px', background: 'var(--bg-panel-soft)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-main)', width: '100%', outline: 'none' }}
            placeholder="Поиск по имени..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <button className="cta-button" style={{ padding: '7px 16px', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => setEditClient('new')}>
          <Plus size={15} /> Добавить клиента
        </button>
      </div>

      <div className="secondary-card" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Клиент', 'Статус', 'ВКонтакте', 'Заказов', 'Заметки', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <strong>{c.name}</strong>
                  <br /><small style={{ color: 'var(--text-muted)' }}>{c.created_at}</small>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Badge text={c.status} colors={CLIENT_STATUS_COLORS} />
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {c.vk_url
                    ? <a href={c.vk_url} target="_blank" rel="noopener noreferrer" style={{ color: '#93c5fd', fontSize: 13 }}>VK ↗</a>
                    : '—'}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{c.order_count}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {c.notes || '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button className="icon-button" onClick={() => setEditClient(c)}><Pencil size={14} /></button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>Клиентов не найдено</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Approvals Tab ─────────────────────────────────────────────────────────────

function ApprovalsTab() {
  const [approvals, setApprovals] = useState<ApprovalEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/api/workshop/approvals/').then(r => r.ok ? r.json() : []),
      apiFetch('/api/catalog/products/').then(r => r.ok ? r.json() : []),
    ]).then(([a, p]) => {
      setApprovals(a);
      setProducts(p);
      if (a.length > 0) setSelectedId(a[0].user_id);
      setLoading(false);
    });
  }, []);

  const toggle = async (masterId: number, productId: number, currentlyApproved: boolean) => {
    const key = `${masterId}-${productId}`;
    setSaving(key);
    try {
      const r = await apiFetch('/api/workshop/approvals/', {
        method: 'POST',
        body: JSON.stringify({
          master_id: masterId,
          product_id: productId,
          action: currentlyApproved ? 'remove' : 'add',
        }),
      });
      if (r.ok) {
        setApprovals(prev => prev.map(entry => {
          if (entry.user_id !== masterId) return entry;
          const ids = currentlyApproved
            ? entry.approved_product_ids.filter(id => id !== productId)
            : [...entry.approved_product_ids, productId];
          return { ...entry, approved_product_ids: ids };
        }));
      }
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: 32 }}>Загрузка...</p>;

  const entry = approvals.find(a => a.user_id === selectedId) ?? null;
  const approvedIds = new Set(entry?.approved_product_ids ?? []);

  const q = search.trim().toLowerCase();
  const searchResults = q
    ? products.filter(p => p.name.toLowerCase().includes(q) && !approvedIds.has(p.id as unknown as number))
    : [];
  const approvedProducts = products.filter(p => approvedIds.has(p.id as unknown as number));

  return (
    <div style={{ display: 'flex', gap: 20, minHeight: 400 }}>

      {/* ── Left: master list ── */}
      <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Мастера</p>
        {approvals.map(a => (
          <button
            key={a.user_id}
            onClick={() => { setSelectedId(a.user_id); setSearch(''); }}
            style={{
              textAlign: 'left', padding: '10px 14px', borderRadius: 8, border: 'none',
              background: a.user_id === selectedId ? 'var(--accent)' : 'var(--bg-panel-soft)',
              color: a.user_id === selectedId ? '#fff' : 'var(--text-main)',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            <div>{a.fullName}</div>
            <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 400, marginTop: 2 }}>
              {a.approved_product_ids.length} допусков
            </div>
          </button>
        ))}
        {approvals.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Нет сотрудников</p>
        )}
      </div>

      {/* ── Right: approvals panel ── */}
      {entry && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Найти предмет и добавить допуск..."
              style={{
                width: '100%', padding: '9px 12px 9px 34px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg-panel-soft)',
                color: 'var(--text-main)', fontSize: 13, boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Search results — products not yet approved */}
          {q && (
            <div className="secondary-card" style={{ padding: 0, overflow: 'hidden' }}>
              {searchResults.length === 0
                ? <p style={{ padding: '12px 16px', margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                    {products.filter(p => p.name.toLowerCase().includes(q)).length === 0
                      ? 'Предмет не найден'
                      : 'Все найденные предметы уже добавлены'}
                  </p>
                : searchResults.map(p => {
                    const key = `${entry.user_id}-${p.id}`;
                    const busy = saving === key;
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{p.category}</span>
                        </div>
                        <button
                          disabled={busy}
                          onClick={() => toggle(entry.user_id, p.id as unknown as number, false)}
                          style={{
                            padding: '5px 14px', fontSize: 12, fontWeight: 700, borderRadius: 20,
                            border: '1px solid rgba(74,222,128,0.4)', background: 'rgba(74,222,128,0.12)',
                            color: '#86efac', cursor: busy ? 'wait' : 'pointer', flexShrink: 0,
                          }}
                        >
                          {busy ? '...' : '+ Добавить'}
                        </button>
                      </div>
                    );
                  })
              }
            </div>
          )}

          {/* Approved products */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Допущен к {approvedProducts.length} предметам
            </p>
            {approvedProducts.length === 0
              ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Нет допусков — мастер не увидит задач в стеке</p>
              : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {approvedProducts.map(p => {
                    const key = `${entry.user_id}-${p.id}`;
                    const busy = saving === key;
                    return (
                      <button
                        key={p.id}
                        disabled={busy}
                        onClick={() => toggle(entry.user_id, p.id as unknown as number, true)}
                        title="Нажмите, чтобы убрать допуск"
                        style={{
                          padding: '5px 10px 5px 12px', fontSize: 12, fontWeight: 600, borderRadius: 20,
                          border: '1px solid rgba(74,222,128,0.4)', background: 'rgba(74,222,128,0.12)',
                          color: '#86efac', cursor: busy ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        {p.name}
                        <X size={11} style={{ opacity: 0.7 }} />
                      </button>
                    );
                  })}
                </div>
              )
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ── Catalog Tab ───────────────────────────────────────────────────────────────

function CatalogTab({ products, onRefresh }: { products: Product[]; onRefresh: () => void }) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<Product | 'new' | undefined>(undefined);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить товар из каталога?')) return;
    setDeleting(id);
    try {
      await apiFetch(`/api/catalog/products/${id}/`, { method: 'DELETE' });
      onRefresh();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      {formTarget !== undefined && (
        <ProductFormModal
          product={formTarget === 'new' ? null : formTarget}
          onClose={() => setFormTarget(undefined)}
          onSaved={() => { onRefresh(); setFormTarget(undefined); }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="cta-button" style={{ padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => setFormTarget('new')}>
          <Plus size={15} /> Добавить товар
        </button>
      </div>
      <div className="secondary-card" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Название', 'Категория', 'Статус', 'Цена от', 'Создал', 'Изменил', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <strong>{p.name}</strong>
                  <br /><small style={{ color: 'var(--text-muted)' }}>{p.subtitle}</small>
                </td>
                <td style={{ padding: '12px 16px' }}>{p.category}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span className={statusStyles[p.status]}>{p.status}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>{p.priceFrom.toLocaleString('ru-RU')} ₽</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{p.createdBy ?? '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{p.updatedBy ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="icon-button" title="Редактировать" onClick={() => setFormTarget(p)}><Pencil size={15} /></button>
                    <button className="icon-button" title="Удалить" disabled={deleting === p.id} onClick={() => handleDelete(p.id)}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Reviews Manage Tab ────────────────────────────────────────────────────────

type ReviewRecord = { id: number; text: string; date: string; review_date: string; vk_url: string; photos: string[] };

function ReviewsManageTab() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [formTarget, setFormTarget] = useState<ReviewRecord | 'new' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch('/api/workshop/reviews/');
      if (r.ok) setReviews(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить отзыв?')) return;
    const r = await apiFetch(`/api/workshop/reviews/${id}/`, { method: 'DELETE' });
    if (r.ok || r.status === 204) setReviews(prev => prev.filter(rv => rv.id !== id));
  };

  return (
    <div>
      {formTarget !== null && (
        <ReviewFormModal
          review={formTarget === 'new' ? null : formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={(saved) => {
            if (formTarget === 'new') {
              setReviews(prev => [saved, ...prev]);
            } else {
              setReviews(prev => prev.map(rv => rv.id === saved.id ? saved : rv));
            }
            setFormTarget(null);
          }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="cta-button" style={{ padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => setFormTarget('new')}>
          <Plus size={15} /> Добавить отзыв
        </button>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Загрузка...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reviews.map(rv => (
          <div key={rv.id} className="secondary-card" style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Thumbnail strip */}
              {rv.photos && rv.photos.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {rv.photos.map((src, idx) => (
                    <img
                      key={idx}
                      src={src}
                      alt=""
                      style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }}
                    />
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                {rv.vk_url && (
                  <a href={rv.vk_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#4a9eda' }}>
                    ВКонтакте ↗
                  </a>
                )}
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{rv.date}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{rv.text}</p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button className="icon-button" style={{ padding: '5px 8px' }} onClick={() => setFormTarget(rv)} title="Редактировать">
                <Pencil size={13} />
              </button>
              <button className="icon-button" style={{ padding: '5px 8px', color: '#f87171' }} onClick={() => handleDelete(rv.id)} title="Удалить">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && reviews.length === 0 && (
        <div className="secondary-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Отзывов пока нет — добавьте первый.
        </div>
      )}
    </div>
  );
}

function ReviewFormModal({ review, onClose, onSaved }: {
  review: ReviewRecord | null;
  onClose: () => void;
  onSaved: (r: ReviewRecord) => void;
}) {
  const [text, setText] = useState(review?.text ?? '');
  const [date, setDate] = useState(review?.review_date ?? review?.date ?? '');
  const [vkUrl, setVkUrl] = useState(review?.vk_url ?? '');
  // Dynamic list of photo URLs
  const [photos, setPhotos] = useState<string[]>(
    review?.photos && review.photos.length > 0 ? review.photos : ['']
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setPhoto = (idx: number, val: string) =>
    setPhotos(prev => prev.map((p, i) => i === idx ? val : p));
  const addPhoto = () => setPhotos(prev => [...prev, '']);
  const removePhoto = (idx: number) =>
    setPhotos(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : ['']);

  const handleSave = async () => {
    if (!text.trim()) { setError('Введите текст отзыва'); return; }
    setSaving(true);
    setError('');
    const cleanPhotos = photos.map(p => p.trim()).filter(Boolean);
    const body = { text: text.trim(), review_date: date.trim(), vk_url: vkUrl.trim(), photos: cleanPhotos };
    const r = review
      ? await apiFetch(`/api/workshop/reviews/${review.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      : await apiFetch('/api/workshop/reviews/', { method: 'POST', body: JSON.stringify(body) });
    setSaving(false);
    if (r.ok) {
      onSaved(await r.json());
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.detail ?? 'Ошибка сохранения');
    }
  };

  const fieldStyle: React.CSSProperties = {
    padding: '9px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg-panel-soft)',
    color: 'var(--text-main)', fontSize: 13, flex: 1, minWidth: 0,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="secondary-card" style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{review ? 'Редактировать отзыв' : 'Новый отзыв'}</h3>
          <button className="icon-button" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            Текст отзыва *
            <textarea value={text} onChange={e => setText(e.target.value)}
              style={{ ...fieldStyle, flex: 'unset', minHeight: 100, resize: 'vertical' as const, width: '100%', boxSizing: 'border-box' }}
              placeholder="Слова клиента..." />
          </label>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            Дата (необязательно)
            <input value={date} onChange={e => setDate(e.target.value)}
              style={{ ...fieldStyle, flex: 'unset', width: '100%', boxSizing: 'border-box' }} placeholder="01.01.2025" />
          </label>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            Ссылка ВКонтакте (необязательно)
            <input value={vkUrl} onChange={e => setVkUrl(e.target.value)}
              style={{ ...fieldStyle, flex: 'unset', width: '100%', boxSizing: 'border-box' }} placeholder="https://vk.com/id..." />
          </label>

          {/* Dynamic photo URL list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Фото (URL, необязательно)
            </span>
            {photos.map((url, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {url && (
                  <img src={url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                )}
                <input
                  value={url}
                  onChange={e => setPhoto(idx, e.target.value)}
                  style={fieldStyle}
                  placeholder={`https://... (фото ${idx + 1})`}
                />
                <button
                  className="icon-button"
                  style={{ padding: '5px 8px', color: '#f87171', flexShrink: 0 }}
                  onClick={() => removePhoto(idx)}
                  title="Удалить фото"
                  type="button"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="icon-button"
              style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 10px' }}
              onClick={addPhoto}
            >
              <Plus size={13} /> Добавить фото
            </button>
          </div>
        </div>

        {error && <p style={{ margin: 0, color: '#f87171', fontSize: 13 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="icon-button" onClick={onClose}>Отмена</button>
          <button className="cta-button" onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tasks Tab ─────────────────────────────────────────────────────────────────

type TaskRecord = {
  id: number;
  order_id: number;
  order_client: string;
  order_deadline: string | null;
  product_id: number | null;
  product_name: string;
  product_image: string;
  status: string;
  assigned_to_id: number | null;
  assigned_to_name: string | null;
  notes: string;
};

function TasksTab({ me, approvedProductIds }: { me: Me; approvedProductIds: number[] }) {
  const [stackTasks, setStackTasks] = useState<TaskRecord[]>([]);
  const [mineTasks, setMineTasks] = useState<TaskRecord[]>([]);
  const [saving, setSaving] = useState<number | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);

  const loadStack = () =>
    apiFetch('/api/workshop/tasks/?view=stack').then(r => r.ok ? r.json() : []).then(setStackTasks);
  const loadMine  = () =>
    apiFetch('/api/workshop/tasks/?view=mine').then(r => r.ok ? r.json() : []).then(setMineTasks);

  useEffect(() => { loadStack(); loadMine(); }, []);

  const patchTask = async (taskId: number, action: string) => {
    setSaving(taskId);
    try {
      const r = await apiFetch(`/api/workshop/tasks/${taskId}/`, {
        method: 'PATCH', body: JSON.stringify({ action }),
      });
      if (r.ok) { loadStack(); loadMine(); }
      else {
        const d = await r.json().catch(() => ({}));
        alert(d.detail ?? 'Ошибка');
      }
    } finally { setSaving(null); }
  };

  const canTake = (t: TaskRecord) =>
    me.isSuperuser ||
    t.product_id === null ||                          // service task
    approvedProductIds.includes(t.product_id);        // has approval

  const cellStyle: React.CSSProperties = { padding: '10px 14px', verticalAlign: 'middle' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {detailOrderId !== null && (
        <OrderDetailModal
          orderId={detailOrderId}
          meId={me.id}
          isSuperuser={!!me.isSuperuser}
          approvedProductIds={approvedProductIds}
          onClose={() => setDetailOrderId(null)}
          onUpdated={() => { setDetailOrderId(null); loadStack(); loadMine(); }}
        />
      )}

      {/* ── Stack (available tasks) ── */}
      <div className="secondary-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={14} /> Стек задач
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>
            {stackTasks.length > 0 ? `${stackTasks.length} доступных` : 'нет доступных задач'}
          </span>
        </div>
        {stackTasks.length === 0
          ? <p style={{ padding: '16px 18px', color: 'var(--text-muted)', fontSize: 13 }}>
              {approvedProductIds.length === 0 && !me.isSuperuser
                ? 'У вас нет допусков — обратитесь к администратору'
                : 'Свободных задач нет'}
            </p>
          : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Предмет', 'Клиент', 'Дедлайн', 'Допуск', ''].map(h => (
                    <th key={h} style={{ ...cellStyle, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stackTasks.map(t => {
                  const ok = canTake(t);
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', opacity: ok ? 1 : 0.5 }}>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {t.product_image && (
                            <img src={t.product_image} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                          )}
                          <strong
                            style={{ cursor: 'pointer', color: 'var(--text-main)' }}
                            onClick={() => setDetailOrderId(t.order_id)}
                          >{t.product_name}</strong>
                        </div>
                      </td>
                      <td style={{ ...cellStyle, color: 'var(--text-muted)' }}>{t.order_client}</td>
                      <td style={{ ...cellStyle, whiteSpace: 'nowrap' as const }}>
                        {t.order_deadline ? <DeadlinePill deadline={t.order_deadline} /> : '—'}
                      </td>
                      <td style={cellStyle}>
                        {t.product_id === null
                          ? <span style={{ fontSize: 11, color: '#86efac' }}>Услуга</span>
                          : ok
                            ? <span style={{ fontSize: 11, color: '#86efac' }}>✓ Есть</span>
                            : <span style={{ fontSize: 11, color: '#f87171' }}>✗ Нет</span>
                        }
                      </td>
                      <td style={{ ...cellStyle, textAlign: 'right' }}>
                        {ok && (
                          <button
                            className="cta-button"
                            style={{ padding: '5px 14px', fontSize: 12 }}
                            disabled={saving === t.id}
                            onClick={() => patchTask(t.id, 'take')}
                          >
                            {saving === t.id ? '...' : 'Взять'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        }
      </div>

      {/* ── My taken tasks ── */}
      <div className="secondary-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={14} /> Мои задачи
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>
            {mineTasks.length > 0 ? `${mineTasks.length} активных` : 'нет активных'}
          </span>
        </div>
        {mineTasks.length === 0
          ? <p style={{ padding: '16px 18px', color: 'var(--text-muted)', fontSize: 13 }}>Нет взятых задач</p>
          : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Предмет', 'Клиент', 'Дедлайн', ''].map(h => (
                    <th key={h} style={{ ...cellStyle, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mineTasks.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={cellStyle}>
                      <strong
                        style={{ cursor: 'pointer' }}
                        onClick={() => setDetailOrderId(t.order_id)}
                      >{t.product_name}</strong>
                    </td>
                    <td style={{ ...cellStyle, color: 'var(--text-muted)' }}>{t.order_client}</td>
                    <td style={{ ...cellStyle, whiteSpace: 'nowrap' as const }}>
                      {t.order_deadline ? <DeadlinePill deadline={t.order_deadline} /> : '—'}
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        className="cta-button"
                        style={{ padding: '5px 14px', fontSize: 12, background: 'rgba(74,222,128,0.2)', color: '#86efac' }}
                        disabled={saving === t.id}
                        onClick={() => patchTask(t.id, 'done')}
                      >
                        <CheckCircle size={12} style={{ marginRight: 4, display: 'inline' }} />
                        {saving === t.id ? '...' : 'Готово'}
                      </button>
                      <button
                        style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}
                        disabled={saving === t.id}
                        onClick={() => patchTask(t.id, 'release')}
                      >Вернуть</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </div>
  );
}

// ── WorkshopPanel (root export) ───────────────────────────────────────────────

type TabId = 'dashboard' | 'orders' | 'tasks' | 'clients' | 'approvals' | 'catalog' | 'reviews';

export function WorkshopPanel({
  me, products, onRefresh,
}: {
  me: Me;
  products: Product[];
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<TabId>('dashboard');
  const [approvedProductIds, setApprovedProductIds] = useState<number[]>([]);

  useEffect(() => {
    apiFetch('/api/workshop/approvals/me/').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setApprovedProductIds(d.approved_product_ids);
    });
  }, []);

  const tabs: Array<{ id: TabId; label: string }> = ([
    { id: 'dashboard' as TabId, label: 'Сводка' },
    { id: 'orders' as TabId,    label: 'Заказы' },
    { id: 'tasks' as TabId,     label: 'Задачи' },
    { id: 'clients' as TabId,   label: 'Клиенты' },
    ...(me.isSuperuser ? [{ id: 'approvals' as TabId, label: 'Допуски' }] : []),
    { id: 'catalog' as TabId,   label: 'Каталог' },
    { id: 'reviews' as TabId,   label: 'Отзывы' },
  ]);

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <p className="eyebrow">Мастерская · {me.fullName}</p>
          <h1>Управление</h1>
        </div>
      </div>

      <div className="ws-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`ws-tab${tab === t.id ? ' ws-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        {tab === 'dashboard' && <DashboardTab me={me} approvedProductIds={approvedProductIds} />}
        {tab === 'orders'    && <OrdersTab me={me} approvedProductIds={approvedProductIds} />}
        {tab === 'tasks'     && <TasksTab me={me} approvedProductIds={approvedProductIds} />}
        {tab === 'clients'   && <ClientsTab />}
        {tab === 'approvals' && me.isSuperuser && <ApprovalsTab />}
        {tab === 'catalog'   && <CatalogTab products={products} onRefresh={onRefresh} />}
        {tab === 'reviews'   && <ReviewsManageTab />}
      </div>
    </section>
  );
}
