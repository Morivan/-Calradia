import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomePage } from './HomePage';
import type { Product } from '../types';

const mockHandlers = {
  onOpenCatalog: vi.fn(),
  onOpenSets: vi.fn(),
  onOpenServices: vi.fn(),
  onOpenReviews: vi.fn(),
};

const makeProduct = (id: string, name: string, status: Product['status'] = 'В наличии'): Product => ({
  id,
  slug: `slug-${id}`,
  name,
  subtitle: '',
  status,
  category: 'Шлемы',
  era: 'XV век',
  material: 'Сталь',
  sizes: ['M'],
  priceFrom: 10000,
  leadTime: '3 недели',
  weight: '2 кг',
  popularity: 50,
  protectionClass: 'Высокий',
  history: '',
  description: [],
  image: 'https://example.com/img.jpg',
  gallery: [],
  badge: '',
  setDiscounts: [],
});

describe('HomePage', () => {
  it('renders hero title', () => {
    render(<HomePage {...mockHandlers} />);
    expect(screen.getByText(/средневековые доспехи/i)).toBeInTheDocument();
  });

  it('renders "Перейти в каталог" CTA button', () => {
    render(<HomePage {...mockHandlers} />);
    expect(screen.getByText('Перейти в каталог')).toBeInTheDocument();
  });

  it('calls onOpenCatalog when CTA button is clicked', async () => {
    const onOpenCatalog = vi.fn();
    render(<HomePage {...mockHandlers} onOpenCatalog={onOpenCatalog} />);
    await userEvent.click(screen.getByText('Перейти в каталог'));
    expect(onOpenCatalog).toHaveBeenCalled();
  });

  it('renders 4 navigation section cards', () => {
    render(<HomePage {...mockHandlers} />);
    expect(screen.getByText('Каталог изделий')).toBeInTheDocument();
    expect(screen.getByText('Комплекты со скидкой')).toBeInTheDocument();
    // "Услуги мастерской" appears both in the hero button and the nav card
    expect(screen.getAllByText('Услуги мастерской').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Отзывы')).toBeInTheDocument();
  });

  it('calls onOpenSets when sets card is clicked', async () => {
    const onOpenSets = vi.fn();
    render(<HomePage {...mockHandlers} onOpenSets={onOpenSets} />);
    await userEvent.click(screen.getByText('Комплекты со скидкой'));
    expect(onOpenSets).toHaveBeenCalled();
  });

  it('does NOT show "Из мастерской" when featuredProducts is empty', () => {
    render(<HomePage {...mockHandlers} featuredProducts={[]} />);
    expect(screen.queryByText('Из мастерской')).not.toBeInTheDocument();
  });

  it('shows up to 3 featured products, skipping discontinued ones', () => {
    const products = [
      makeProduct('1', 'Шлем 1'),
      makeProduct('2', 'Шлем 2'),
      makeProduct('3', 'Снятый шлем', 'Снят с производства'),
      makeProduct('4', 'Шлем 4'),
      makeProduct('5', 'Шлем 5'),
    ];
    render(<HomePage {...mockHandlers} featuredProducts={products} />);
    expect(screen.getByText('Шлем 1')).toBeInTheDocument();
    expect(screen.getByText('Шлем 2')).toBeInTheDocument();
    expect(screen.queryByText('Снятый шлем')).not.toBeInTheDocument();
    expect(screen.getByText('Шлем 4')).toBeInTheDocument();
    // Only 3 shown maximum
    expect(screen.queryByText('Шлем 5')).not.toBeInTheDocument();
  });
});
