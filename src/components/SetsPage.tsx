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
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const allImages = [set.image, ...(set.gallery ?? [])].filter(Boolean);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null);
      if (e.key === 'ArrowRight') setLightboxIdx(i => i !== null ? (i + 1) % allImages.length : null);
      if (e.key === 'ArrowLeft')  setLightboxIdx(i => i !== null ? (i - 1 + allImages.length) % allImages.length : null);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [lightboxIdx, allImages.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Back */}
      <button
        className="icon-button"
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, alignSelf: 'flex-start' }}
      >
        <ArrowLeft size={15} /> Все комплекты
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,420px)', gap: 32, alignItems: 'start' }}>

        {/* Left: gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Main image */}
          {allImages.length > 0 && (
            <div
              style={{ aspectRatio: '4/3', borderRadius: 16, overflow: 'hidden', cursor: 'zoom-in', background: 'var(--bg-panel-soft)' }}
              onClick={() => setLightboxIdx(0)}
            >
              <img src={allImages[0]} alt={set.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {allImages.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt=""
                  onClick={() => setLightboxIdx(idx)}
                  style={{
                    width: 72, height: 72, borderRadius: 10, objectFit: 'cover',
                    cursor: 'pointer',
                    border: '2px solid transparent',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Title */}
          <div>
            {set.badge && (
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--accent)', textTransform: 'uppercase' }}>
                {set.badge}
              </span>
            )}
            <h1 style={{ margin: '6px 0 4px', fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>{set.name}</h1>
            {set.subtitle && <p style={{ margin: 0, color: 'var(--text-muted)' }}>{set.subtitle}</p>}
          </div>

          {/* Price block */}
          <div className="secondary-card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Discount badge */}
            {set.discount_percent > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  background: 'var(--accent)', color: '#fff',
                  fontWeight: 700, fontSize: 13,
                  padding: '3px 10px', borderRadius: 8,
                }}>
                  −{set.discount_percent}% при заказе набором
                </span>
              </div>
            )}

            {/* Price line */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>
                {fmtMoney(set.price_from)}
              </span>
              {set.discount > 0 && (
                <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  {fmtMoney(set.price_individual)}
                </span>
              )}
            </div>

            {set.discount > 0 && (
              <p style={{ margin: 0, fontSize: 13, color: '#86efac', fontWeight: 600 }}>
                Экономия {fmtMoney(set.discount)} по сравнению с раздельной покупкой
              </p>
            )}

            {/* CTA */}
            <a
              href={links.vkMessages}
              target="_blank"
              rel="noreferrer"
              className="cta-button"
              style={{ textAlign: 'center', textDecoration: 'none', marginTop: 6 }}
            >
              Заказать комплект
            </a>
          </div>

          {/* Items in set */}
          {set.products.length > 0 && (
            <div className="secondary-card" style={{ padding: '16px 20px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Состав комплекта ({set.products.length} предмета)
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {set.products.map(p => (
                  <SetProductRow key={p.id} product={p} onOpen={onOpenProduct} />
                ))}
              </div>
              {/* Total row */}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Итого по отдельности</span>
                <span style={{ fontWeight: 700 }}>{fmtMoney(set.price_individual)}</span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxIdx(null)}
          style={{ flexDirection: 'column', gap: 16 }}
        >
          <button className="lightbox-close icon-button" onClick={() => setLightboxIdx(null)} aria-label="Закрыть">
            <X size={20} />
          </button>
          <img
            src={allImages[lightboxIdx]}
            alt=""
            className="lightbox-img"
            onClick={e => e.stopPropagation()}
          />
          {allImages.length > 1 && (
            <>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                <button
                  className="icon-button"
                  style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 16px', color: '#fff', fontSize: 18 }}
                  onClick={() => setLightboxIdx(i => i !== null ? (i - 1 + allImages.length) % allImages.length : null)}
                >‹</button>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                  {lightboxIdx + 1} / {allImages.length}
                </span>
                <button
                  className="icon-button"
                  style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 16px', color: '#fff', fontSize: 18 }}
                  onClick={() => setLightboxIdx(i => i !== null ? (i + 1) % allImages.length : null)}
                >›</button>
              </div>
              <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                {allImages.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt=""
                    onClick={() => setLightboxIdx(idx)}
                    style={{
                      width: 48, height: 48, borderRadius: 6, objectFit: 'cover', cursor: 'pointer',
                      border: idx === lightboxIdx ? '2px solid var(--accent)' : '2px solid transparent',
                      opacity: idx === lightboxIdx ? 1 : 0.55,
                      transition: 'opacity 0.15s, border-color 0.15s',
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
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
