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
        <button className="icon-button" onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
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
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {reviews.map((review, i) => (
            <ReviewCard key={review.id ?? i} review={review} />
          ))}
        </div>
      )}

    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="review-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {review.photo_url ? (
          <img
            src={review.photo_url}
            alt={review.author}
            style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(161,51,51,0.18)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--accent)',
          }}>
            {review.author.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{review.author}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{review.date}</div>
        </div>
        {review.vk_url && (
          <a
            href={review.vk_url}
            target="_blank"
            rel="noreferrer"
            style={{ marginLeft: 'auto', color: 'var(--text-muted)', flexShrink: 0 }}
            title="Страница ВКонтакте"
          >
            <ExternalLink size={15} />
          </a>
        )}
      </div>

      {/* Text */}
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--text-main)' }}>
        «{review.text}»
      </p>
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
