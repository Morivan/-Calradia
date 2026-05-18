import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../api';

interface NewsPost {
  id: number;
  text: string;
  photo_url: string;
  posted_at: string;
}

export function NewsAdmin() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [text, setText] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch('/api/vk-posts/')
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/api/news/', {
        method: 'POST',
        body: JSON.stringify({ text: text.trim(), photo_url: photoUrl.trim() }),
      });
      setText('');
      setPhotoUrl('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить новость?')) return;
    await apiFetch(`/api/news/${id}/`, { method: 'DELETE' });
    load();
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div className="secondary-card" style={{ display: 'grid', gap: '14px' }}>
        <h3 style={{ margin: 0 }}>Новая новость</h3>
        <textarea
          className="product-form-field"
          placeholder="Текст новости..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(56,74,50,0.4)', border: '1px solid var(--border)', color: 'var(--text-main)', resize: 'vertical' }}
        />
        <input
          type="url"
          placeholder="URL фото (необязательно)"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          style={{ padding: '10px', borderRadius: '10px', background: 'rgba(56,74,50,0.4)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
        />
        <button className="cta-button" onClick={handleCreate} disabled={saving || !text.trim()} style={{ justifySelf: 'start' }}>
          <Plus size={16} />
          Опубликовать
        </button>
      </div>

      <div className="secondary-card" style={{ padding: 0, overflow: 'hidden' }}>
        {posts.length === 0 ? (
          <p style={{ padding: '20px', color: 'var(--text-muted)' }}>Нет новостей</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Дата', 'Текст', 'Фото', ''].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {new Date(p.posted_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td style={{ padding: '12px 16px', maxWidth: '400px' }}>{p.text.slice(0, 120)}{p.text.length > 120 ? '…' : ''}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {p.photo_url ? <img src={p.photo_url} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6 }} /> : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button className="icon-button" title="Удалить" onClick={() => handleDelete(p.id)}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
