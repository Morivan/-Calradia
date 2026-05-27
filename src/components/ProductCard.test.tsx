import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from './ProductCard';
import type { Product } from '../types';

const base: Product = {
  id: '1',
  slug: 'test-helm',
  name: 'Тестовый шлем',
  subtitle: 'Для рыцаря',
  status: 'В наличии',
  category: 'Шлемы',
  era: 'XV век',
  material: 'Сталь',
  sizes: ['M', 'L'],
  priceFrom: 15000,
  leadTime: '3 недели',
  weight: '3 кг',
  popularity: 80,
  protectionClass: 'Высокий',
  history: 'История',
  description: ['Описание'],
  image: 'https://example.com/helm.jpg',
  gallery: ['https://example.com/helm.jpg'],
  badge: '',
  setDiscounts: [],
};

describe('ProductCard', () => {
  it('renders product name and price', () => {
    render(<ProductCard product={base} onOpen={vi.fn()} />);
    expect(screen.getByText('Тестовый шлем')).toBeInTheDocument();
    expect(screen.getByText(/15\s*000/)).toBeInTheDocument();
  });

  it('calls onOpen when clicked', async () => {
    const onOpen = vi.fn();
    render(<ProductCard product={base} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledWith(base);
  });

  it('does NOT show set badge when setDiscounts is empty', () => {
    render(<ProductCard product={{ ...base, setDiscounts: [] }} onOpen={vi.fn()} />);
    expect(screen.queryByText(/в комплекте/)).not.toBeInTheDocument();
  });

  it('does NOT show set badge when best discount is 0%', () => {
    render(<ProductCard product={{ ...base, setDiscounts: [{ slug: 's', name: 'S', discount_percent: 0 }] }} onOpen={vi.fn()} />);
    expect(screen.queryByText(/в комплекте/)).not.toBeInTheDocument();
  });

  it('shows set badge with correct discount when discount > 0', () => {
    render(<ProductCard product={{ ...base, setDiscounts: [{ slug: 's', name: 'S', discount_percent: 15 }] }} onOpen={vi.fn()} />);
    expect(screen.getByText(/−15%/)).toBeInTheDocument();
    expect(screen.getByText(/в комплекте/)).toBeInTheDocument();
  });

  it('shows highest discount when multiple sets', () => {
    render(<ProductCard product={{
      ...base,
      setDiscounts: [
        { slug: 'a', name: 'A', discount_percent: 10 },
        { slug: 'b', name: 'B', discount_percent: 20 },
      ],
    }} onOpen={vi.fn()} />);
    expect(screen.getByText(/−20%/)).toBeInTheDocument();
  });

  it('shows badge when product has badge text', () => {
    render(<ProductCard product={{ ...base, badge: 'Новинка' }} onOpen={vi.fn()} />);
    expect(screen.getByText('Новинка')).toBeInTheDocument();
  });

  it('triggers onOpen on Enter keypress', async () => {
    const onOpen = vi.fn();
    render(<ProductCard product={base} onOpen={onOpen} />);
    const card = screen.getByRole('button');
    card.focus();
    await userEvent.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalled();
  });
});
