import { statusStyles } from '../data';
import type { Product } from '../types';

export function ProductCard({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: (product: Product) => void;
}) {
  return (
    <article
      className="product-card"
      onClick={() => onOpen(product)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(product);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="product-image-wrap">
        <img
          className="product-image"
          src={product.image}
          alt={product.name}
          onError={(e) => {
            const img = e.currentTarget;
            img.onerror = null;
            img.src = `https://placehold.co/400x300/1a1a12/c1c8bc?text=${encodeURIComponent(product.category)}`;
          }}
        />
        {product.badge ? <span className="product-badge">{product.badge}</span> : null}
      </div>

      <div className="product-body">
        <div className="product-headline">
          <h3>{product.name}</h3>
          <p>{product.subtitle}</p>
        </div>

        <div className="product-meta">
          <span className={statusStyles[product.status]}>{product.status}</span>
          <strong>от {product.priceFrom.toLocaleString('ru-RU')} ₽</strong>
        </div>

        <button
          className="cta-button"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(product);
          }}
        >
          Подробнее
        </button>
      </div>
    </article>
  );
}
