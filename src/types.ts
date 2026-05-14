export type ProductStatus = 'Готовый комплект' | 'Под заказ' | 'Реконструкция';
export type Category = 'Шлемы' | 'Нагрудники' | 'Полные комплекты' | 'Аксессуары' | 'Щиты' | 'Рукавицы';
export type Era = 'XIII век' | 'XIV век' | 'XV век' | 'XVI век';
export type Material = 'Сталь' | 'Кожа' | 'Комбинированный' | 'Латунь и сталь';
export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL';
export type SortMode = 'default' | 'newest' | 'popular' | 'duration';
export type ViewMode = 'catalog' | 'admin' | 'login';

export interface Review {
  id?: number;
  author: string;
  text: string;
  rating: number;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  status: ProductStatus;
  slug?: string;
  category: Category;
  era: Era;
  material: Material;
  sizes: Size[];
  priceFrom: number;
  leadTime: string;
  weight: string;
  popularity: number;
  protectionClass: string;
  history: string;
  description: string[];
  image: string;
  gallery: string[];
  badge?: string;
  createdBy?: string;
  updatedBy?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Filters {
  categories: string[];
  eras: string[];
  materials: string[];
  sizes: string[];
  statuses: string[];
}

export interface ExternalLinks {
  telegramOrder: string;
  telegramPublic: string;
  vkCommunity: string;
  vkMessages: string;
  yandexForm: string;
}

export interface BootstrapPayload {
  products: Product[];
  reviewsByProduct: Record<string, Review[]>;
  links: ExternalLinks;
}

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  isStaff: boolean;
}
