export type ProductStatus = 'В наличии' | 'Изготовим на заказ' | 'Снят с производства';
export type Category = 'Шлемы' | 'Нагрудники' | 'Полные комплекты' | 'Аксессуары' | 'Щиты' | 'Рукавицы' | 'Обувь' | 'Одежда' | 'Предметы быта' | 'Стрелковое оружие' | 'Дробящее оружие' | 'Колющее оружие' | 'Режущее оружие';
export type Era = 'XIII век' | 'XIV век' | 'XV век' | 'XVI век';
export type Material = 'Сталь' | 'Кожа' | 'Комбинированный' | 'Латунь и сталь' | 'Шерсть и лён' | 'Дерево';
export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL';
export type SortMode = 'default' | 'newest' | 'popular' | 'duration';
export type ViewMode = 'home' | 'catalog' | 'sets' | 'services' | 'reviews' | 'privacy' | 'admin' | 'login';

export interface SetProduct {
  id: number;
  name: string;
  slug: string;
  price_from: number;
  image: string;
}

export interface ProductSet {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  image: string;
  gallery: string[];
  badge: string;
  price_from: number;       // со скидкой 15%
  price_individual: number; // без скидки (сумма предметов)
  discount: number;         // размер скидки в рублях
  discount_percent: number; // 15
  products: SetProduct[];
}

export interface SetDiscount {
  slug: string;
  name: string;
  discount_percent: number;
}

export interface Review {
  id?: number;
  text: string;
  date: string;
  review_date?: string;
  vk_url?: string;
  photos?: string[];
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
  setDiscounts?: SetDiscount[];
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
}

export interface BootstrapPayload {
  products: Product[];
  reviews: Review[];
  links: ExternalLinks;
}

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  isStaff: boolean;
}
