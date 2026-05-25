import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, X } from 'lucide-react';
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

// ── Review Card ───────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const photos = review.photos ?? [];
  const hasPhotos = photos.length > 0;
  const single = photos.length === 1;

  return (
    <div
      className="secondary-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: '20px 24px',
        borderRadius: 18,
      }}
    >
      {/* Галерея фото */}
      {hasPhotos && (
        single
          ? <SinglePhoto src={photos[0]} />
          : <PhotoGallery photos={photos} />
      )}

      {/* Текст отзыва */}
      <p style={{
        margin: 0,
        fontSize: '1rem',
        lineHeight: 1.75,
        color: 'var(--text-main)',
        fontStyle: 'italic',
      }}>
        «{review.text}»
      </p>

      {/* Мета: дата + ссылка ВК */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {review.date && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {review.date}
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
  );
}

// ── Single photo (click → lightbox) ──────────────────────────────────────────

function SinglePhoto({ src }: { src: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open]);

  return (
    <>
      <img
        src={src}
        alt=""
        onClick={() => setOpen(true)}
        style={{
          width: 96,
          height: 96,
          borderRadius: 12,
          objectFit: 'cover',
          cursor: 'zoom-in',
          border: '1px solid rgba(117,133,108,0.3)',
          flexShrink: 0,
        }}
      />
      {open && (
        <div className="lightbox-overlay" onClick={() => setOpen(false)}>
          <button className="lightbox-close icon-button" onClick={() => setOpen(false)} aria-label="Закрыть">
            <X size={20} />
          </button>
          <img src={src} alt="" className="lightbox-img" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

// ── Photo gallery (click any → lightbox with navigation) ─────────────────────

function PhotoGallery({ photos }: { photos: string[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null);
      if (e.key === 'ArrowRight') setLightboxIdx(i => i !== null ? (i + 1) % photos.length : null);
      if (e.key === 'ArrowLeft')  setLightboxIdx(i => i !== null ? (i - 1 + photos.length) % photos.length : null);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [lightboxIdx, photos.length]);

  return (
    <>
      {/* Thumbnail strip */}
      <div style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        {photos.map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt=""
            onClick={() => setLightboxIdx(idx)}
            style={{
              width: 88,
              height: 88,
              borderRadius: 10,
              objectFit: 'cover',
              cursor: 'zoom-in',
              border: '1px solid rgba(117,133,108,0.3)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          />
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxIdx(null)}
          style={{ flexDirection: 'column', gap: 16 }}
        >
          <button
            className="lightbox-close icon-button"
            onClick={() => setLightboxIdx(null)}
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>

          <img
            src={photos[lightboxIdx]}
            alt=""
            className="lightbox-img"
            onClick={e => e.stopPropagation()}
          />

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <button
              className="icon-button"
              style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 16px', color: '#fff', fontSize: 18 }}
              onClick={() => setLightboxIdx(i => i !== null ? (i - 1 + photos.length) % photos.length : null)}
              aria-label="Назад"
            >‹</button>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
              {lightboxIdx + 1} / {photos.length}
            </span>
            <button
              className="icon-button"
              style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 16px', color: '#fff', fontSize: 18 }}
              onClick={() => setLightboxIdx(i => i !== null ? (i + 1) % photos.length : null)}
              aria-label="Вперёд"
            >›</button>
          </div>

          {/* Thumbnail strip in lightbox */}
          <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
            {photos.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt=""
                onClick={() => setLightboxIdx(idx)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 6,
                  objectFit: 'cover',
                  cursor: 'pointer',
                  border: idx === lightboxIdx
                    ? '2px solid var(--accent)'
                    : '2px solid transparent',
                  opacity: idx === lightboxIdx ? 1 : 0.55,
                  transition: 'opacity 0.15s, border-color 0.15s',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
