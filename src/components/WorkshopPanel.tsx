import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Clock, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { apiFetch } from '../api';
import { statusStyles } from '../data';
import { ProductFormModal } from './ProductFormModal';
import type { Product } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

type OrderRecord = {
  id: number;
  client_id: number | null;
  client_name: string;
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

type MaterialRecord = {
  id: number;
  name: string;
  type: string;
  direction: string;
  unit: string;
  price: number | null;
  stock: number;
  min_stock: number;
  supplier: string;
  notes: string;
  low_stock: boolean;
};

type StaffUser = { id: number; username: string; fullName: string };

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
  low_stock: Array<{
    id: number;
    name: string;
    direction: string;
    stock: number;
    min_stock: number;
    unit: string;
  }>;
  my_active_count: number;
};

type Me = { id: number; username: string; fullName: string; isStaff: boolean };

// ── Constants ─────────────────────────────────────────────────────────────────

const ORDER_STATUSES = ['Новый', 'В работе', 'Выполнен', 'Отменён'] as const;
const CLIENT_STATUSES = ['Потенциальный', 'Действующий', 'Завершён'] as const;
const DIRECTIONS = ['Дерево', 'Плечи', 'Железо', 'Броня'] as const;

const ORDER_STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  'Новый':    { bg: '#dbeafe', fg: '#1a6fc4' },
  'В работе': { bg: '#fef9c3', fg: '#854d0e' },
  'Выполнен': { bg: '#dcfce7', fg: '#166534' },
  'Отменён':  { bg: '#fee2e2', fg: '#991b1b' },
};

const CLIENT_STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  'Потенциальный': { bg: '#f3f4f6', fg: '#374151' },
  'Действующий':   { bg: '#dbeafe', fg: '#1a6fc4' },
  'Завершён':      { bg: '#dcfce7', fg: '#166534' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function Badge({ text, colors }: { text: string; colors: Record<string, { bg: string; fg: string }> }) {
  const c = colors[text] ?? { bg: '#f3f4f6', fg: '#374151' };
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
  const color = days < 0 ? '#991b1b' : days <= 3 ? '#dc5a00' : days <= 7 ? '#854d0e' : '#166534';
  const label = days < 0 ? `просрочен ${-days}д` : days === 0 ? 'сегодня' : `${days}д`;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color }}>
      {fmtDate(deadline)} ({label})
    </span>
  );
}

// ── Order Form Modal ──────────────────────────────────────────────────────────

function OrderFormModal({
  order, staffUsers, currentUserId, onClose, onSaved,
}: {
  order: Partial<OrderRecord> | null;
  staffUsers: StaffUser[];
  currentUserId: number;
  onClose: () => void;
  onSaved: (o: OrderRecord) => void;
}) {
  const isNew = !order?.id;
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
      const url = isNew ? '/api/workshop/orders/' : `/api/workshop/orders/${order!.id}/`;
      const resp = await apiFetch(url, { method: isNew ? 'POST' : 'PATCH', body: JSON.stringify(body) });
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
          <h2 style={{ margin: 0, fontSize: 18 }}>{isNew ? 'Новый заказ' : 'Редактировать заказ'}</h2>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
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
            <label className="product-form-field">
              <span>Ответственный</span>
              <select value={form.assigned_to_id} onChange={set('assigned_to_id')}>
                <option value="">—</option>
                {staffUsers.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </label>
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

function DashboardTab({ me: _me }: { me: Me }) {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    apiFetch('/api/workshop/dashboard/').then(r => r.ok ? r.json() : null).then(setData);
  }, []);

  if (!data) return <p style={{ padding: 32, color: 'var(--text-muted)' }}>Загрузка...</p>;

  const sc = data.status_counts;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
        {[
          { label: 'Новых',     key: 'Новый',    fg: '#1a6fc4' },
          { label: 'В работе',  key: 'В работе', fg: '#854d0e' },
          { label: 'Выполнено', key: 'Выполнен', fg: '#166534' },
          { label: 'Отменено',  key: 'Отменён',  fg: '#6b7280' },
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="secondary-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14} /> Дедлайны (14 дней)
          </div>
          {data.upcoming_deadlines.length === 0
            ? <p style={{ padding: '16px 18px', color: 'var(--text-muted)', fontSize: 13 }}>Горящих заказов нет</p>
            : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {data.upcoming_deadlines.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 18px' }}>
                        <strong>{d.client_name}</strong>
                        {d.product_name && <><br /><span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{d.product_name}</span></>}
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

        <div className="secondary-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} /> Мало на складе
          </div>
          {data.low_stock.length === 0
            ? <p style={{ padding: '16px 18px', color: 'var(--text-muted)', fontSize: 13 }}>Все запасы в норме</p>
            : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {data.low_stock.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 18px' }}>
                        <strong style={{ color: '#dc5a00' }}>{m.name}</strong>
                        <br /><span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{m.direction}</span>
                      </td>
                      <td style={{ padding: '10px 18px', whiteSpace: 'nowrap' as const, color: '#991b1b', fontWeight: 700 }}>
                        {m.stock} / {m.min_stock} {m.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </div>
    </div>
  );
}

// ── Orders Tab (Kanban) ───────────────────────────────────────────────────────

function OrdersTab({ me }: { me: Me }) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState(false);
  const [editOrder, setEditOrder] = useState<Partial<OrderRecord> | 'new' | undefined>(undefined);

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
      {editOrder !== undefined && (
        <OrderFormModal
          order={editOrder === 'new' ? {} : editOrder}
          staffUsers={staffUsers}
          currentUserId={me.id}
          onClose={() => setEditOrder(undefined)}
          onSaved={handleSaved}
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
          onClick={() => setEditOrder('new')}>
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
                  <div key={order.id} className="ws-kanban-card" onClick={() => setEditOrder(order)}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{order.client_name}</div>
                    {order.product_name && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.product_name}</div>}
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
                    ? <a href={c.vk_url} target="_blank" rel="noopener noreferrer" style={{ color: '#4d7cfe', fontSize: 13 }}>VK ↗</a>
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

// ── Materials Tab ─────────────────────────────────────────────────────────────

function MaterialsTab() {
  const [materials, setMaterials] = useState<MaterialRecord[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [stockValue, setStockValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch('/api/workshop/materials/').then(r => r.ok ? r.json() : []).then(setMaterials);
  }, []);

  useEffect(() => {
    if (editingId !== null) inputRef.current?.focus();
  }, [editingId]);

  const startEdit = (mat: MaterialRecord) => {
    setEditingId(mat.id);
    setStockValue(String(mat.stock));
  };

  const saveStock = async (id: number) => {
    const val = parseFloat(stockValue);
    if (!isNaN(val)) {
      const r = await apiFetch(`/api/workshop/materials/${id}/`, {
        method: 'PATCH', body: JSON.stringify({ stock: val }),
      });
      if (r.ok) {
        const updated = await r.json() as MaterialRecord;
        setMaterials(prev => prev.map(m => m.id === id ? updated : m));
      }
    }
    setEditingId(null);
  };

  const byDir: Record<string, MaterialRecord[]> = {};
  for (const m of materials) { (byDir[m.direction] ??= []).push(m); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {DIRECTIONS.filter(d => byDir[d]?.length).map(dir => (
        <div key={dir} className="secondary-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>{dir}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Наименование', 'Тип', 'Ед.', 'Цена', 'Остаток', 'Мин.', 'Поставщик'].map(h => (
                  <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byDir[dir].map(mat => (
                <tr key={mat.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 500 }}>{mat.name}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{mat.type}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{mat.unit}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>
                    {mat.price != null ? `${mat.price} ₽` : '—'}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    {editingId === mat.id ? (
                      <input
                        ref={inputRef}
                        type="number"
                        step="0.1"
                        value={stockValue}
                        onChange={e => setStockValue(e.target.value)}
                        onBlur={() => saveStock(mat.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveStock(mat.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        style={{ width: 80, padding: '4px 8px', background: 'var(--bg-panel-soft)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-main)', outline: 'none' }}
                      />
                    ) : (
                      <span
                        title="Нажмите для редактирования"
                        onClick={() => startEdit(mat)}
                        style={{
                          cursor: 'pointer', fontWeight: 700, fontSize: 13,
                          display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                          background: mat.low_stock ? '#fee2e2' : '#dcfce7',
                          color: mat.low_stock ? '#991b1b' : '#166534',
                        }}
                      >{mat.stock}</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{mat.min_stock}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{mat.supplier || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {materials.length === 0 && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>Материалов нет. Добавьте через Django Admin.</p>
      )}
      <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 0 }}>
        Нажмите на остаток для быстрого редактирования
      </p>
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

// ── WorkshopPanel (root export) ───────────────────────────────────────────────

type TabId = 'dashboard' | 'orders' | 'clients' | 'materials' | 'catalog';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'dashboard', label: 'Сводка' },
  { id: 'orders',    label: 'Заказы' },
  { id: 'clients',   label: 'Клиенты' },
  { id: 'materials', label: 'Материалы' },
  { id: 'catalog',   label: 'Каталог' },
];

export function WorkshopPanel({
  me, products, onRefresh,
}: {
  me: Me;
  products: Product[];
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<TabId>('dashboard');

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <p className="eyebrow">Мастерская · {me.fullName}</p>
          <h1>Управление</h1>
        </div>
      </div>

      <div className="ws-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`ws-tab${tab === t.id ? ' ws-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        {tab === 'dashboard' && <DashboardTab me={me} />}
        {tab === 'orders'    && <OrdersTab me={me} />}
        {tab === 'clients'   && <ClientsTab />}
        {tab === 'materials' && <MaterialsTab />}
        {tab === 'catalog'   && <CatalogTab products={products} onRefresh={onRefresh} />}
      </div>
    </section>
  );
}
