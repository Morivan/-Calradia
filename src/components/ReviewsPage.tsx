import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { Review } from '../types';

export function ReviewsPage({
  reviews,
  onBack,
}: {
  reviews: Review[];
  onBack: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          className="icon-button"
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
        >
          <ArrowLeft size={15} /> Назад
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem, 3vw, 1.9rem)' }}>Отзывы</h1>
          {reviews.length > 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {reviews.length} {plural(reviews.length, 'отзыв', 'отзыва', 'отзывов')}
            </span>
          )}
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="secondary-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Отзывов пока нет.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reviews.map((review, i) => (
            <ReviewCard key={review.id ?? i} review={review} />
          ))}
        </div>
      )}

    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const hasPhoto = Boolean(review.photo_url);

  return (
    <div
      className="secondary-card"
      style={{
        display: 'flex',
        gap: 20,
        alignItems: hasPhoto ? 'flex-start' : 'center',
        padding: '20px 24px',
        borderRadius: 18,
      }}
    >
      {/* Фото автора */}
      {hasPhoto && (
        <img
          src={review.photo_url}
          alt=""
          style={{
            width: 72,
            height: 72,
            borderRadius: 12,
            objectFit: 'cover',
            flexShrink: 0,
            border: '1px solid rgba(117,133,108,0.3)',
          }}
        />
      )}

      {/* Контент */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{
          margin: 0,
          fontSize: '1rem',
          lineHeight: 1.75,
          color: 'var(--text-main)',
          fontStyle: 'italic',
        }}>
          «{review.text}»
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {review.review_date && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {review.review_date}
            </span>
          )}
          {review.vk_url && (
            <a
              href={review.vk_url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                color: '#4a9eda',
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={12} />
              ВКонтакте
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
