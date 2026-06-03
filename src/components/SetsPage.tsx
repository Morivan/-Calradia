import { useEffect, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import type { ExternalLinks, ProductSet, SetProduct } from '../types';

// ── Public Sets Catalog ───────────────────────────────────────────────────────

export function SetsPage({
  onBack,
  links,
  initialSlug,
  onOpenProduct,
}: {
  onBack: () => void;
  links: ExternalLinks;
  initialSlug?: string;
  onOpenProduct?: (slug: string) => void;
}) {
  const [sets, setSets] = useState<ProductSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProductSet | null>(null);

  useEffect(() => {
    fetch('/api/catalog/sets/')
      .then(r => r.ok ? r.json() : [])
      .then((data: ProductSet[]) => {
        setSets(data);
        setLoading(false);
        if (initialSlug) {
          const match = data.find((s: ProductSet) => s.slug === initialSlug);
          if (match) setSelected(match);
        }
      })
      .catch(() => {
        setSets([]);
        setLoading(false);
      });
  }, [initialSlug]);

  if (selected) {
    return (
      <SetDetail
        set={selected}
        onBack={() => setSelected(null)}
        links={links}
        onOpenProduct={onOpenProduct}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          className="icon-button"
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
        >
          <ArrowLeft size={15} /> Назад
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem, 3vw, 1.9rem)' }}>Комплекты</h1>
          {sets.length > 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {sets.length} {plural(sets.length, 'комплект', 'комплекта', 'комплектов')} · скидки при заказе набором
            </span>
          )}
        </div>
      </div>

      {loading && (
        <p style={{ color: 'var(--text-muted)' }}>Загрузка...</p>
      )}

      {!loading && sets.length === 0 && (
        <div className="secondary-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Комплекты пока не добавлены.</p>
        </div>
      )}

      {/* Grid of set cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 20,
      }}>
        {sets.map(s => (
          <SetCard key={s.id} set={s} onClick={() => setSelected(s)} />
        ))}
      </div>
    </div>
  );
}

// ── Set card ──────────────────────────────────────────────────────────────────

function SetCard({ set, onClick }: { set: ProductSet; onClick: () => void }) {
  return (
    <article className="product-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      <div className="product-image-wrap">
        {set.image
          ? <img className="product-image" src={set.image} alt={set.name} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Фото не добавлено</div>
        }
        {set.badge && <span className="product-badge">{set.badge}</span>}
        {set.discount_percent > 0 && (
          <span className="product-badge product-badge--right">−{set.discount_percent}%</span>
        )}
      </div>

      <div className="product-body">
        <div className="product-headline">
          <h3>{set.name}</h3>
          {set.subtitle && <p>{set.subtitle}</p>}
        </div>

        {set.products.length > 0 && (
          <div className="product-highlights">
            {set.products.map(p => <span key={p.id}>{p.name}</span>)}
          </div>
        )}

        <div className="product-meta">
          <strong>от {fmtMoney(set.price_from)}</strong>
          {set.discount > 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              {fmtMoney(set.price_individual)}
            </span>
          )}
        </div>

        {set.discount > 0 && (
          <div className="product-set-hint">
            <span className="product-set-badge">экономия {fmtMoney(set.discount)}</span>
          </div>
        )}
      </div>
    </article>
  );
}

// ── Set Detail ────────────────────────────────────────────────────────────────

function SetDetail({
  set,
  onBack,
  links,
  onOpenProduct,
}: {
  set: ProductSet;
  onBack: () => void;
  links: ExternalLinks;
  onOpenProduct?: (slug: string) => void;
}) {
  const allImages = [set.image, ...(set.gallery ?? [])].filter(Boolean);
  const [activeImage, setActiveImage] = useState(allImages[0] ?? '');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  return (
    <section className="detail-page">
      {lightboxOpen && activeImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <button className="lightbox-close icon-button" aria-label="Закрыть" onClick={() => setLightboxOpen(false)}>
            <X size={22} />
          </button>
          <img
            src={activeImage}
            alt={set.name}
            className="lightbox-img"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <div className="detail-breadcrumbs">
        <button className="detail-back" onClick={onBack}>
          <ArrowLeft size={16} />
          Все комплекты
        </button>
        <span>Комплекты</span>
        <span>/</span>
        <span>{set.name}</span>
      </div>

      <div className="detail-layout">
        <div className="detail-gallery">
          {allImages.length > 0 && (
            <div className="detail-main-image" style={{ cursor: 'zoom-in' }} onClick={() => setLightboxOpen(true)}>
              <img src={activeImage || allImages[0]} alt={set.name} />
            </div>
          )}
          {allImages.length > 1 && (
            <div className="detail-thumbnails">
              {allImages.map((src, idx) => (
                <button
                  key={idx}
                  className={`detail-thumb ${activeImage === src ? 'detail-thumb-active' : ''}`}
                  onClick={() => setActiveImage(src)}
                >
                  <img src={src} alt={`${set.name} ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <div className="detail-title-block">
            {set.badge
              ? <span className="detail-badge">{set.badge}</span>
              : set.discount_percent > 0
                ? <span className="detail-badge">−{set.discount_percent}% набором</span>
                : null
            }
            <h1>{set.name}</h1>
            {set.subtitle && <p>{set.subtitle}</p>}
          </div>

          <div className="detail-spec-grid">
            <div>
              <span>Предметов в наборе</span>
              <strong>{set.products.length}</strong>
            </div>
            {set.discount_percent > 0 && (
              <div>
                <span>Скидка набором</span>
                <strong>−{set.discount_percent}%</strong>
              </div>
            )}
            {set.discount > 0 && (
              <div>
                <span>Экономия</span>
                <strong>{fmtMoney(set.discount)}</strong>
              </div>
            )}
          </div>

          <div className="detail-price-row">
            <div>
              <span>Цена комплекта</span>
              <strong>{fmtMoney(set.price_from)}</strong>
              {set.discount > 0 && (
                <s style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>
                  {fmtMoney(set.price_individual)}
                </s>
              )}
            </div>
            <div className="detail-actions">
              <a
                className="cta-button detail-cta"
                href={links.vkMessages}
                target="_blank"
                rel="noreferrer"
              >
                Заказать комплект
              </a>
            </div>
          </div>

          {set.products.length > 0 && (
            <div className="detail-history">
              <h3>Состав комплекта</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {set.products.map(p => (
                  <SetProductRow key={p.id} product={p} onOpen={onOpenProduct} />
                ))}
              </div>
              {set.discount > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Итого по отдельности</span>
                  <span style={{ fontWeight: 700 }}>{fmtMoney(set.price_individual)}</span>
                </div>
              )}
            </div>
          )}

          {set.description && (
            <div className="detail-description">
              <h2>Описание</h2>
              <p>{set.description}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Set product row ───────────────────────────────────────────────────────────

function SetProductRow({ product, onOpen }: { product: SetProduct; onOpen?: (slug: string) => void }) {
  const clickable = Boolean(onOpen && product.slug);
  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onOpen!(product.slug) : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen!(product.slug); } } : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        borderRadius: 10,
        padding: '4px 6px',
        margin: '0 -6px',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'background 0.13s',
      }}
      onMouseEnter={clickable ? e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)' : undefined}
      onMouseLeave={clickable ? e => (e.currentTarget as HTMLDivElement).style.background = 'transparent' : undefined}
    >
      {product.image
        ? <img src={product.image} alt={product.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
        : <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-panel-soft)', flexShrink: 0 }} />
      }
      <span style={{ flex: 1, fontSize: 13, color: clickable ? 'var(--text-main)' : undefined }}>{product.name}</span>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
        {fmtMoney(product.price_from)}
      </span>
      {clickable && <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 2 }}>›</span>}
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
  if (!n) return '—';
  return n.toLocaleString('ru-RU') + ' ₽';
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
