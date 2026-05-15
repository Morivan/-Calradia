import { useState } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '../api';
import type { Category, Era, Material, Product, ProductStatus, Size } from '../types';

const STATUSES: ProductStatus[] = ['В наличии', 'Изготовим на заказ', 'Снят с производства'];
const CATEGORIES: Category[] = ['Шлемы', 'Нагрудники', 'Полные комплекты', 'Аксессуары', 'Щиты', 'Рукавицы'];
const ERAS: Era[] = ['XIII век', 'XIV век', 'XV век', 'XVI век'];
const MATERIALS: Material[] = ['Сталь', 'Кожа', 'Комбинированный', 'Латунь и сталь'];
const SIZES: Size[] = ['XS', 'S', 'M', 'L', 'XL'];

type ProductFormData = {
  name: string; subtitle: string; status: ProductStatus; category: Category;
  era: Era; material: Material; sizes: Size[]; priceFrom: string;
  leadTime: string; weight: string; history: string;
  description: string; image: string; gallery: string; badge: string;
};

const EMPTY_FORM: ProductFormData = {
  name: '', subtitle: '', status: 'Изготовим на заказ', category: 'Шлемы',
  era: 'XV век', material: 'Сталь', sizes: ['M'], priceFrom: '',
  leadTime: '', weight: '', history: '',
  description: '', image: '', gallery: '', badge: '',
};

function productToForm(p: Product): ProductFormData {
  return {
    name: p.name, subtitle: p.subtitle, status: p.status as ProductStatus,
    category: p.category as Category, era: p.era as Era,
    material: p.material as Material, sizes: p.sizes,
    priceFrom: String(p.priceFrom), leadTime: p.leadTime, weight: p.weight,
    history: p.history,
    description: p.description.join('\n\n'),
    image: p.image, gallery: p.gallery.join('\n'), badge: p.badge ?? '',
  };
}

export function ProductFormModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ProductFormData>(product ? productToForm(product) : EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field: keyof ProductFormData, value: string | Size[]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const toggleSize = (size: Size) =>
    set('sizes', form.sizes.includes(size) ? form.sizes.filter((s) => s !== size) : [...form.sizes, size]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    const body = {
      name: form.name.trim(),
      subtitle: form.subtitle.trim(),
      status: form.status,
      category: form.category,
      era: form.era,
      material: form.material,
      sizes: form.sizes,
      priceFrom: Number(form.priceFrom),
      leadTime: form.leadTime.trim(),
      weight: form.weight.trim(),
      history: form.history.trim(),
      description: form.description.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
      image: form.image.trim(),
      gallery: form.gallery.split('\n').map((u) => u.trim()).filter(Boolean),
      badge: form.badge.trim(),
    };
    try {
      const url = product ? `/api/catalog/products/${product.id}/` : '/api/catalog/products/';
      const method = product ? 'PATCH' : 'POST';
      const resp = await apiFetch(url, { method, body: JSON.stringify(body) });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.detail ?? JSON.stringify(data));
      } else {
        onSaved();
        onClose();
      }
    } catch {
      setError('Нет связи с сервером.');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof ProductFormData, type: 'text' | 'number' | 'url' = 'text') => (
    <label className="product-form-field">
      <span>{label}</span>
      <input type={type} value={form[key] as string} onChange={(e) => set(key, e.target.value)} />
    </label>
  );

  return (
    <div className="contact-overlay" role="dialog" aria-modal="true">
      <div className="contact-dialog product-form-dialog">
        <div className="contact-header">
          <div>
            <h3>{product ? 'Редактировать товар' : 'Добавить товар'}</h3>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Закрыть">
            <X size={16} />
          </button>
        </div>
        <form className="contact-form product-form" onSubmit={submit}>
          {field('Название', 'name')}
          {field('Подзаголовок', 'subtitle')}

          <label className="product-form-field">
            <span>Статус</span>
            <select value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>

          <label className="product-form-field">
            <span>Категория</span>
            <select value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>

          <label className="product-form-field">
            <span>Эпоха</span>
            <select value={form.era} onChange={(e) => set('era', e.target.value)}>
              {ERAS.map((e) => <option key={e}>{e}</option>)}
            </select>
          </label>

          <label className="product-form-field">
            <span>Материал</span>
            <select value={form.material} onChange={(e) => set('material', e.target.value)}>
              {MATERIALS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </label>

          <div className="product-form-field">
            <span>Размеры</span>
            <div className="product-form-sizes">
              {SIZES.map((s) => (
                <label key={s} className="filter-option">
                  <input type="checkbox" checked={form.sizes.includes(s)} onChange={() => toggleSize(s)} />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </div>

          {field('Цена от (₽)', 'priceFrom', 'number')}
          {field('Срок изготовления', 'leadTime')}
          {field('Вес', 'weight')}
          {field('Значок (Новинка / Полевые испытания)', 'badge')}
          {field('Фото (URL)', 'image', 'url')}

          <label className="product-form-field contact-form-wide">
            <span>Историческая справка</span>
            <textarea rows={3} value={form.history} onChange={(e) => set('history', e.target.value)} />
          </label>

          <label className="product-form-field contact-form-wide">
            <span>Описание (параграфы — пустая строка между ними)</span>
            <textarea rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </label>

          <label className="product-form-field contact-form-wide">
            <span>Галерея (по одному URL на строку)</span>
            <textarea rows={3} value={form.gallery} onChange={(e) => set('gallery', e.target.value)} />
          </label>

          {error ? <p className="form-error contact-form-wide">{error}</p> : null}

          <div className="contact-form-actions contact-form-wide">
            <button type="button" className="cta-button cta-muted" onClick={onClose}>Отмена</button>
            <button type="submit" className="cta-button" disabled={saving}>
              {saving ? 'Сохранение...' : product ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
