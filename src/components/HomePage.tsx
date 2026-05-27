import { Layers, Shield, Star, Wrench } from 'lucide-react';
import type { Product } from '../types';

export function HomePage({
  onOpenCatalog,
  onOpenSets,
  onOpenServices,
  onOpenReviews,
  onOpenProduct,
  featuredProducts = [],
}: {
  onOpenCatalog: () => void;
  onOpenSets: () => void;
  onOpenServices: () => void;
  onOpenReviews: () => void;
  onOpenProduct?: (p: Product) => void;
  featuredProducts?: Product[];
}) {
  const featured = featuredProducts.filter(p => p.status !== 'Снят с производства').slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

      {/* ── Hero ── */}
      <div className="hero">
        <div className="hero-content" style={{ flex: 1 }}>
          <p className="eyebrow">Кузница Кальрадия</p>
          <h1 style={{ fontSize: 'clamp(1.4rem, 3.2vw, 2.2rem)', whiteSpace: 'normal', maxWidth: 540, lineHeight: 1.15 }}>
            Средневековые доспехи<br />и снаряжение ручной работы
          </h1>
          <p style={{ margin: '12px 0 0', color: '#e7e2d7', fontSize: 15, lineHeight: 1.7, maxWidth: 480 }}>
            Выполним заказ любой сложности в адекватные сроки. Мастера разных профилей —
            каждое изделие создаётся с учётом актуальных правил турниров и мероприятий.
          </p>

          <ul className="hero-list">
            <li>Заказы любой сложности в адекватные сроки</li>
            <li>Мастера разных профилей</li>
            <li>Скидки при заказе комплектами</li>
            <li>Ремонт, модификация и проверка снаряжения по правилам мероприятий</li>
            <li>Уникальные заказы</li>
          </ul>

          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="cta-button" onClick={onOpenCatalog}
              style={{ padding: '11px 30px', fontSize: 14 }}>
              Перейти в каталог
            </button>
            <button className="icon-button" onClick={onOpenServices}
              style={{ padding: '11px 22px', fontSize: 14 }}>
              Услуги мастерской
            </button>
          </div>
        </div>
        <img src="/club-emblem.png" alt="" className="hero-emblem" />
      </div>

      {/* ── Featured products ── */}
      {featured.length > 0 && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 className="home-section-label">Из мастерской</h2>
            <button onClick={onOpenCatalog}
              style={{ fontSize: 13, color: 'var(--accent-warm)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Весь каталог →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {featured.map(p => (
              <FeaturedCard key={p.id} product={p} onClick={() => onOpenProduct ? onOpenProduct(p) : onOpenCatalog()} />
            ))}
          </div>
        </section>
      )}

      {/* ── Navigation cards ── */}
      <section>
        <h2 className="home-section-label" style={{ marginBottom: 14 }}>Разделы</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          <NavCard
            icon={<Shield size={24} />}
            title="Каталог изделий"
            description="Шлемы, нагрудники, комплекты, оружие и предметы быта. Фильтрация по эпохе, материалу и размеру."
            onClick={onOpenCatalog}
            color="#6ea8e8"
          />
          <NavCard
            icon={<Layers size={24} />}
            title="Комплекты со скидкой"
            description="Готовые наборы из нескольких предметов с выгодой при заказе набором."
            onClick={onOpenSets}
            color="#f0b429"
            highlight
          />
          <NavCard
            icon={<Wrench size={24} />}
            title="Услуги мастерской"
            description="Подгонка по меркам, ремонт и реставрация, историческая консультация, финишная отделка."
            onClick={onOpenServices}
            color="#e07e3c"
          />
          <NavCard
            icon={<Star size={24} />}
            title="Отзывы"
            description="Что говорят о наших работах рыцари, реконструкторы и участники турниров."
            onClick={onOpenReviews}
            color="#86efac"
          />
        </div>
      </section>

    </div>
  );
}

// ── Featured product mini-card ────────────────────────────────────────────────

function FeaturedCard({ product, onClick }: { product: Product; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left', cursor: 'pointer', padding: 0,
        borderRadius: 16, overflow: 'hidden',
        background: 'var(--bg-panel-soft)',
        border: '1px solid var(--border)',
        transition: 'transform 0.15s, border-color 0.15s',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.borderColor = 'rgba(161,51,51,0.5)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: '#1a1a12' }}>
        <img
          src={product.image}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => {
            (e.currentTarget as HTMLImageElement).src =
              `https://placehold.co/400x300/1a1a12/c1c8bc?text=${encodeURIComponent(product.category)}`;
          }}
        />
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{product.name}</div>
        <div style={{ fontSize: 13, color: 'var(--accent-warm)', marginTop: 4, fontWeight: 600 }}>
          от {product.priceFrom.toLocaleString('ru-RU')} ₽
        </div>
        {product.setDiscounts && product.setDiscounts.length > 0 && (() => {
          const best = product.setDiscounts!.reduce((m, s) => Math.max(m, s.discount_percent), 0);
          return best > 0 ? (
            <div style={{ marginTop: 5 }}>
              <span className="product-set-badge" style={{ fontSize: '0.68rem' }}>−{best}% в комплекте</span>
            </div>
          ) : null;
        })()}
      </div>
    </button>
  );
}

// ── Nav card ──────────────────────────────────────────────────────────────────

function NavCard({ icon, title, description, onClick, color, highlight }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="home-nav-card"
      style={{
        '--card-color': color,
        borderColor: highlight ? `${color}55` : `${color}28`,
        background: highlight ? `${color}14` : `${color}09`,
      } as React.CSSProperties}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}88`;
        (e.currentTarget as HTMLButtonElement).style.background = `${color}1e`;
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = highlight ? `${color}55` : `${color}28`;
        (e.currentTarget as HTMLButtonElement).style.background = highlight ? `${color}14` : `${color}09`;
        (e.currentTarget as HTMLButtonElement).style.transform = '';
      }}
    >
      <span style={{ color }}>{icon}</span>
      <strong>{title}</strong>
      <span>{description}</span>
    </button>
  );
}
