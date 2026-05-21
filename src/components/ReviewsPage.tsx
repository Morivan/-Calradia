import { ArrowLeft } from 'lucide-react';
import type { Product, Review } from '../types';

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#fbbf24', fontSize: 14, letterSpacing: 1 }}>
      {'★'.repeat(Math.max(0, Math.min(5, rating)))}{'☆'.repeat(Math.max(0, 5 - rating))}
    </span>
  );
}

export function ReviewsPage({
  reviewsByProduct,
  products,
  onBack,
}: {
  reviewsByProduct: Record<string, Review[]>;
  products: Product[];
  onBack: () => void;
}) {
  const productMap = Object.fromEntries(products.map(p => [p.id, p.name]));

  const allReviews: Array<{ review: Review; productId: string; productName: string }> = [];
  for (const [productId, reviews] of Object.entries(reviewsByProduct)) {
    for (const review of reviews) {
      allReviews.push({
        review,
        productId,
        productName: productMap[productId] ?? 'Изделие',
      });
    }
  }

  allReviews.sort((a, b) => {
    const da = a.review.date ? new Date(a.review.date.split('.').reverse().join('-')).getTime() : 0;
    const db = b.review.date ? new Date(b.review.date.split('.').reverse().join('-')).getTime() : 0;
    return db - da;
  });

  const avgRating = allReviews.length
    ? (allReviews.reduce((s, r) => s + r.review.rating, 0) / allReviews.length).toFixed(1)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="icon-button" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <ArrowLeft size={15} /> Назад
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem, 3vw, 1.9rem)' }}>Отзывы</h1>
          {avgRating && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Средняя оценка: <Stars rating={Math.round(Number(avgRating))} /> {avgRating} · {allReviews.length} {plural(allReviews.length, 'отзыв', 'отзыва', 'отзывов')}
            </span>
          )}
        </div>
      </div>

      {allReviews.length === 0 ? (
        <div className="secondary-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Отзывов пока нет. Будьте первым!</p>
        </div>
      ) : (
        <div className="review-list">
          {allReviews.map(({ review, productId, productName }, i) => (
            <div key={review.id ?? `${productId}-${i}`} className="review-card">
              <div className="review-meta">
                <strong style={{ fontSize: 14 }}>{review.author}</strong>
                <Stars rating={review.rating} />
              </div>
              <p style={{ margin: '8px 0', lineHeight: 1.65 }}>{review.text}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--accent-warm)', fontWeight: 600 }}>{productName}</span>
                <small>{review.date}</small>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
