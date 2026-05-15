import type { Product, Review, SortMode, ProductStatus } from './types';

export const fallbackProducts: Product[] = [];

export const fallbackReviews: Record<string, Review[]> = {};

export const sortOptions: { value: SortMode; label: string }[] = [
  { value: 'default', label: 'По умолчанию' },
  { value: 'newest', label: 'Сначала новые' },
  { value: 'popular', label: 'По популярности' },
  { value: 'duration', label: 'По сроку изготовления' },
];

export const statusStyles: Record<ProductStatus, string> = {
  'В наличии': 'status status-ready',
  'Изготовим на заказ': 'status status-order',
  'Снят с производства': 'status status-archive',
};

export const sidebarSections = [
  {
    title: 'Каталог доспехов',
    links: ['Готовые работы', 'Реконструкция по источникам', 'Турнирные комплекты', 'Отдельные элементы'],
  },
  {
    title: 'Услуги мастерской',
    links: ['Подгонка по меркам', 'Ремонт и реставрация', 'Историческая консультация', 'Финишная отделка'],
  },
];

export const filterSections = [
  { key: 'categories', title: 'Тип доспеха', options: ['Шлемы', 'Нагрудники', 'Полные комплекты', 'Аксессуары', 'Щиты', 'Рукавицы'] },
  { key: 'eras', title: 'Эпоха', options: ['XIII век', 'XIV век', 'XV век', 'XVI век'] },
  { key: 'materials', title: 'Материал', options: ['Сталь', 'Кожа', 'Комбинированный', 'Латунь и сталь'] },
  { key: 'sizes', title: 'Размер', options: ['XS', 'S', 'M', 'L', 'XL'] },
  { key: 'statuses', title: 'Статус', options: ['В наличии', 'Изготовим на заказ', 'Снят с производства'] },
] as const;
