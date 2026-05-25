import { Layers, Shield, Star, Wrench } from 'lucide-react';

export function HomePage({
  onOpenCatalog,
  onOpenSets,
  onOpenServices,
  onOpenReviews,
}: {
  onOpenCatalog: () => void;
  onOpenSets: () => void;
  onOpenServices: () => void;
  onOpenReviews: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Hero */}
      <div className="hero">
        <div className="hero-content" style={{ flex: 1 }}>
          <p className="eyebrow">Кузница Кальрадия</p>
          <h1>Средневековые доспехи и снаряжение ручной работы</h1>
          <p style={{ margin: '12px 0 0', color: '#e7e2d7', fontSize: 15, lineHeight: 1.65, maxWidth: 520 }}>
            Изготавливаем турнирные комплекты, исторические реконструкции и предметы быта
            по источникам XIII–XVI веков. Работаем под заказ и на готовых размерах.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="cta-button" onClick={onOpenCatalog}
              style={{ padding: '10px 28px', fontSize: 14 }}>
              Перейти в каталог
            </button>
            <button className="icon-button" onClick={onOpenServices}
              style={{ padding: '10px 20px', fontSize: 14 }}>
              Услуги мастерской
            </button>
          </div>
        </div>
        <img src="/club-emblem.png" alt="" className="hero-emblem" />
      </div>

      {/* Navigation cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <NavCard
          icon={<Shield size={26} />}
          title="Каталог изделий"
          description="Шлемы, нагрудники, комплекты, оружие и предметы быта. Фильтрация по эпохе, материалу и размеру."
          onClick={onOpenCatalog}
        />
        <NavCard
          icon={<Layers size={26} />}
          title="Комплекты со скидкой"
          description="Готовые наборы из нескольких предметов с выгодой 15% по сравнению с раздельной покупкой."
          onClick={onOpenSets}
          accent
        />
        <NavCard
          icon={<Wrench size={26} />}
          title="Услуги мастерской"
          description="Подгонка по меркам, ремонт и реставрация, историческая консультация, финишная отделка."
          onClick={onOpenServices}
        />
        <NavCard
          icon={<Star size={26} />}
          title="Отзывы"
          description="Что говорят о наших работах рыцари, реконструкторы и участники турниров."
          onClick={onOpenReviews}
        />
      </div>

    </div>
  );
}

function NavCard({ icon, title, description, onClick, accent }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left', cursor: 'pointer',
        border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 18,
        padding: '24px 20px',
        background: accent ? 'rgba(161,51,51,0.08)' : 'var(--bg-panel-soft)',
        display: 'flex', flexDirection: 'column', gap: 10,
        transition: 'border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.background = 'rgba(161,51,51,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = accent ? 'var(--accent)' : 'var(--border)';
        e.currentTarget.style.background = accent ? 'rgba(161,51,51,0.08)' : 'var(--bg-panel-soft)';
      }}
    >
      <span style={{ color: 'var(--accent-warm)' }}>{icon}</span>
      <strong style={{ fontSize: 15, color: 'var(--text-main)' }}>{title}</strong>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{description}</span>
    </button>
  );
}
