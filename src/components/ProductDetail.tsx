import { useState } from 'react';
import { ArrowLeft, Clock3, ExternalLink, Hammer, Scale, Shield } from 'lucide-react';
import { OrderModal } from './OrderModal';
import type { ExternalLinks, Product, Review } from '../types';

export function ProductDetail({
  product,
  reviews,
  onBack,
  links,
}: {
  product: Product;
  reviews: Review[];
  onBack: () => void;
  links: ExternalLinks;
}) {
  const [activeImage, setActiveImage] = useState(product.gallery[0] ?? product.image);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  return (
    <section className="detail-page">
      <div className="detail-breadcrumbs">
        <button className="detail-back" onClick={onBack}>
          <ArrowLeft size={16} />
          Назад в каталог
        </button>
        <span>Каталог</span>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <div className="detail-layout">
        <div className="detail-gallery">
          <div className="detail-main-image">
            <img src={activeImage} alt={product.name} />
            <div className="detail-overlay-tag">FIG. {Math.max(product.gallery.indexOf(activeImage) + 1, 1)}</div>
            <div className="detail-overlay-code">ARCHIVE REF: {String(product.id).toUpperCase()}</div>
          </div>

          <div className="detail-thumbnails">
            {product.gallery.map((image, index) => (
              <button
                key={`${product.id}-${index}`}
                className={`detail-thumb ${activeImage === image ? 'detail-thumb-active' : ''}`}
                onClick={() => setActiveImage(image)}
              >
                <img src={image} alt={`${product.name} ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="detail-info">
          <div className="detail-title-block">
            <span className="detail-badge">{product.category}</span>
            <h1>{product.name}</h1>
            {product.subtitle && product.subtitle !== product.name ? <p>{product.subtitle}</p> : null}
          </div>

          <div className="detail-spec-grid">
            <div>
              <span><Hammer size={14} /> Материал</span>
              <strong>{product.material}</strong>
            </div>
            <div>
              <span><Scale size={14} /> Вес</span>
              <strong>{product.weight}</strong>
            </div>
            <div>
              <span><Clock3 size={14} /> Срок изготовления</span>
              <strong>{product.leadTime}</strong>
            </div>
            <div>
              <span><Shield size={14} /> Класс защиты</span>
              <strong>{product.protectionClass}</strong>
            </div>
          </div>

          <div className="detail-size-panel">
            <span>Доступные размеры</span>
            <div className="size-list">
              {product.sizes.map((size) => (
                <span className="size-chip" key={size}>{size}</span>
              ))}
            </div>
          </div>

          <div className="detail-history">
            <h3>Историческая справка</h3>
            <p>{product.history}</p>
          </div>

          <div className="detail-price-row">
            <div>
              <span>Базовая цена</span>
              <strong>{product.priceFrom.toLocaleString('ru-RU')} ₽</strong>
            </div>
            <div className="detail-actions">
              {links.yandexForm ? (
                <button className="cta-button detail-cta" onClick={() => setOrderModalOpen(true)}>
                  Оформить заказ
                </button>
              ) : (
                <a className="cta-button detail-cta" href={links.telegramOrder} target="_blank" rel="noreferrer">
                  Связаться для заказа
                </a>
              )}
              {links.vkMessages ? (
                <a className="ghost-button detail-secondary" href={links.vkMessages} target="_blank" rel="noreferrer">
                  Написать в ВКонтакте
                </a>
              ) : null}
              <a
                className="icon-button detail-icon-button"
                href={links.vkCommunity || links.telegramPublic}
                target="_blank"
                rel="noreferrer"
                aria-label="Перейти в сообщество"
              >
                <ExternalLink size={18} />
              </a>
            </div>
          </div>

          <div className="detail-description">
            <h2>Описание изделия</h2>
            {product.description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="review-section">
            <div className="review-section-head">
              <h2>Отзывы</h2>
              <span>{reviews.length} шт.</span>
            </div>
            {reviews.length > 0 ? (
              <div className="review-list">
                {reviews.map((review, index) => (
                  <article className="review-card" key={review.id ?? `${review.author}-${review.date}-${index}`}>
                    <div className="review-meta">
                      <strong>{review.author}</strong>
                      <span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    </div>
                    <p>{review.text}</p>
                    <small>{review.date}</small>
                  </article>
                ))}
              </div>
            ) : (
              <p className="review-empty">Пока нет отзывов об этом изделии.</p>
            )}
          </div>
        </div>
      </div>

      {orderModalOpen && links.yandexForm ? (
        <OrderModal yandexFormUrl={links.yandexForm} onClose={() => setOrderModalOpen(false)} />
      ) : null}

    </section>
  );
}
