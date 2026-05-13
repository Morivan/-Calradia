import { useState } from 'react';
import { ArrowLeft, Clock3, ExternalLink, Hammer, Scale, Shield, X } from 'lucide-react';
import { OrderModal } from './OrderModal';
import type { ExternalLinks, Product, Review } from '../types';

export function ProductDetail({
  product,
  reviews,
  onBack,
  onAddReview,
  links,
}: {
  product: Product;
  reviews: Review[];
  onBack: () => void;
  onAddReview: (productId: string, review: Review) => void;
  links: ExternalLinks;
}) {
  const [activeImage, setActiveImage] = useState(product.gallery[0]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ author: '', text: '', rating: '5' });

  const submitReview = () => {
    if (!reviewForm.author.trim() || !reviewForm.text.trim()) return;
    onAddReview(product.id, {
      author: reviewForm.author.trim(),
      text: reviewForm.text.trim(),
      rating: Number(reviewForm.rating),
      date: new Intl.DateTimeFormat('ru-RU').format(new Date()),
    });
    setReviewForm({ author: '', text: '', rating: '5' });
    setReviewOpen(false);
  };

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
            <div className="detail-overlay-tag">FIG. {product.gallery.indexOf(activeImage) + 1}</div>
            <div className="detail-overlay-code">ARCHIVE REF: {product.id.toUpperCase()}</div>
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
            <p>{product.subtitle}</p>
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
              <button className="ghost-button detail-secondary" onClick={() => setReviewOpen(true)}>
                Оставить отзыв
              </button>
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
                {reviews.map((review) => (
                  <article className="review-card" key={`${review.author}-${review.date}-${review.text}`}>
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
              <p className="review-empty">Пока нет отзывов. Станьте первым, кто оставит впечатления о работе мастерской.</p>
            )}
          </div>
        </div>
      </div>

      {orderModalOpen && links.yandexForm ? (
        <OrderModal yandexFormUrl={links.yandexForm} onClose={() => setOrderModalOpen(false)} />
      ) : null}

      {reviewOpen ? (
        <div className="contact-overlay" role="dialog" aria-modal="true">
          <div className="contact-dialog">
            <div className="contact-header">
              <div>
                <h3>Новый отзыв</h3>
                <p>Поделитесь впечатлениями о качестве изделия и взаимодействии с мастерской.</p>
              </div>
              <button className="icon-button" onClick={() => setReviewOpen(false)} aria-label="Закрыть форму">
                <X size={16} />
              </button>
            </div>
            <form
              className="contact-form"
              onSubmit={(event) => { event.preventDefault(); submitReview(); }}
            >
              <label>
                <span>Имя</span>
                <input
                  type="text"
                  placeholder="Ваше имя"
                  value={reviewForm.author}
                  onChange={(event) => setReviewForm((c) => ({ ...c, author: event.target.value }))}
                />
              </label>
              <label>
                <span>Оценка</span>
                <select
                  value={reviewForm.rating}
                  onChange={(event) => setReviewForm((c) => ({ ...c, rating: event.target.value }))}
                >
                  <option value="5">5 - отлично</option>
                  <option value="4">4 - хорошо</option>
                  <option value="3">3 - нормально</option>
                  <option value="2">2 - с замечаниями</option>
                  <option value="1">1 - требуется доработка</option>
                </select>
              </label>
              <label className="contact-form-wide">
                <span>Текст отзыва</span>
                <textarea
                  placeholder="Например: удобная посадка, хорошая подгонка, аккуратная отделка..."
                  rows={4}
                  value={reviewForm.text}
                  onChange={(event) => setReviewForm((c) => ({ ...c, text: event.target.value }))}
                />
              </label>
              <div className="contact-form-actions contact-form-wide">
                <button type="button" className="cta-button cta-muted" onClick={() => setReviewOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className="cta-button">
                  Сохранить отзыв
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
