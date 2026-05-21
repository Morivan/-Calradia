import { Shield, Star, Wrench } from 'lucide-react';

export function HomePage({
  onOpenCatalog,
  onOpenServices,
  onOpenReviews,
}: {
  onOpenCatalog: () => void;
  onOpenServices: () => void;
  onOpenReviews: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Hero */}
      <div className="hero">
        <div className="hero-content">
          <p className="eyebrow">Кузница Кальрадия</p>
          <h1>Средневековые доспехи и снаряжение ручной работы</h1>
          <p className="hero-copy" style={{ marginTop: 12 }}>
            Изготавливаем турнирные комплекты, исторические реконструкции и предметы быта
            по источникам XIII–XVI веков. Работаем под заказ и на готовых размерах.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <button className="cta-button" onClick={onOpenCatalog}
              style={{ padding: '10px 24px', fontSize: 15 }}>
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
          icon={<Shield size={28} />}
          title="Каталог изделий"
          description="Шлемы, нагрудники, комплекты, оружие и предметы быта. Фильтрация по эпохе, материалу и размеру."
          onClick={onOpenCatalog}
        />
        <NavCard
          icon={<Wrench size={28} />}
          title="Услуги мастерской"
          description="Подгонка по меркам, ремонт, историческая консультация, финишная отделка."
          onClick={onOpenServices}
        />
        <NavCard
          icon={<Star size={28} />}
          title="Отзывы"
          description="Что говорят о наших работах рыцари, реконструкторы и участники турниров."
          onClick={onOpenReviews}
        />
      </div>

      {/* About block */}
      <div className="secondary-card" style={{ padding: '28px 32px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.4rem' }}>О мастерской</h2>
        <p style={{ margin: '0 0 12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Кузница Кальрадия — команда мастеров исторической реконструкции, которые делают настоящие
          средневековые доспехи и снаряжение для бугуртов, фестивалей и коллекций. Каждое изделие
          создаётся по историческим источникам: миниатюрам, музейным экспонатам и археологическим находкам.
        </p>
        <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Работаем с форматами HMB, WMFC и IFHEMA. Принимаем заказы на изготовление, подгонку
          и ремонт снаряжения. Консультируем по историческому соответствию.
        </p>
        <div style={{ display: 'flex', gap: 32, marginTop: 24, flexWrap: 'wrap' }}>
          {[
            { value: '10+', label: 'лет опыта' },
            { value: '500+', label: 'изделий изготовлено' },
            { value: '13–16', label: 'века, с которыми работаем' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-warm)' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function NavCard({ icon, title, description, onClick }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left', cursor: 'pointer', border: '1px solid var(--border)',
        borderRadius: 18, padding: '24px 20px', background: 'var(--bg-panel-soft)',
        display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <span style={{ color: 'var(--accent-warm)' }}>{icon}</span>
      <strong style={{ fontSize: 16 }}>{title}</strong>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{description}</span>
    </button>
  );
}
