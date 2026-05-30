import { ArrowLeft } from 'lucide-react';
import { workshopServices } from '../data';
import type { ExternalLinks } from '../types';

export function ServicesPage({
  onBack,
  links,
}: {
  onBack: () => void;
  links: ExternalLinks;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="icon-button" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <ArrowLeft size={15} /> Назад
        </button>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem, 3vw, 1.9rem)' }}>Услуги мастерской</h1>
      </div>

      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7 }}>
        Помимо изготовления доспехов и снаряжения на заказ, Кузница Кальрадия оказывает
        ряд сопутствующих услуг — от ремонта и реставрации до исторических консультаций.
      </p>

      <div className="services-grid">
        {workshopServices.map((service) => (
          <article className="service-card" key={service.id}>
            <div className="service-image-wrap">
              <img src={service.image} alt={service.title} className="service-image" />
            </div>
            <div className="service-body">
              <h3 className="service-title">{service.title}</h3>
              <p className="service-text">{service.description}</p>
            </div>
          </article>
        ))}
      </div>

      {/* CTA */}
      <div className="secondary-card" style={{ padding: '28px 32px', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem' }}>Хотите заказать услугу?</h3>
        <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: 14 }}>
          Напишите нам — обсудим детали и подберём подходящий вариант.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {links.vkMessages && (
            <a
              href={links.vkMessages}
              target="_blank"
              rel="noreferrer"
              className="icon-button"
              style={{ padding: '10px 20px', fontSize: 14, textDecoration: 'none', display: 'inline-block' }}
            >
              Написать ВКонтакте
            </a>
          )}
        </div>
      </div>

    </div>
  );
}
