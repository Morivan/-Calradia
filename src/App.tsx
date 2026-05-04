import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock3,
  ExternalLink,
  Hammer,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Pencil,
  Plus,
  Scale,
  Search,
  Shield,
  SlidersHorizontal,
  Swords,
  Trash2,
  X,
} from 'lucide-react';

type ProductStatus = 'Готовый комплект' | 'Под заказ' | 'Реконструкция';
type Category = 'Шлемы' | 'Нагрудники' | 'Полные комплекты' | 'Аксессуары' | 'Щиты' | 'Рукавицы';
type Era = 'XIII век' | 'XIV век' | 'XV век' | 'XVI век';
type Material = 'Сталь' | 'Кожа' | 'Комбинированный' | 'Латунь и сталь';
type Size = 'XS' | 'S' | 'M' | 'L' | 'XL';
type SortMode = 'default' | 'newest' | 'popular' | 'duration';
type ViewMode = 'catalog' | 'admin' | 'login';

interface Review {
  author: string;
  text: string;
  rating: number;
  date: string;
}

interface Product {
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

interface Filters {
  categories: string[];
  eras: string[];
  materials: string[];
  sizes: string[];
  statuses: string[];
}

interface ExternalLinks {
  telegramOrder: string;
  telegramPublic: string;
  vkCommunity: string;
  vkMessages: string;
}

interface BootstrapPayload {
  products: Product[];
  reviewsByProduct: Record<string, Review[]>;
  links: ExternalLinks;
}

interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  isStaff: boolean;
}

const defaultLinks: ExternalLinks = {
  telegramOrder: 'https://web.telegram.org/k/#@kalradiaWarBand',
  telegramPublic: 'https://web.telegram.org/k/#@kalradiaWarBand',
  vkCommunity: 'https://vk.com/calradia_band',
  vkMessages: 'https://vk.com/im/convo/-234061306?entrypoint=community_page&tab=all',
};


const products: Product[] = [
  {
    id: '1',
    name: 'Готический латный доспех',
    subtitle: 'Полный комплект для пешего боя, XV век',
    status: 'Под заказ',
    category: 'Полные комплекты',
    era: 'XV век',
    material: 'Сталь',
    sizes: ['M', 'L', 'XL'],
    priceFrom: 215000,
    leadTime: '6-8 недель',
    weight: '24 кг',
    popularity: 98,
    protectionClass: 'Высший',
    history:
      'Классический образец германской оружейной школы XV века с каннелюрами, усиливающими листы стали и подчёркивающими силуэт латника.',
    description: [
      'Комплект собран по мотивам музейных оригиналов конца XV века и адаптирован под реконструкторскую практику. В него входят саллет, бувигер, кираса с плакартом, наплечники, латная защита рук и ног.',
      'Конструкция опирается на систему скользящих заклёпок, чтобы сохранить подвижность бойца во время пешего строя и показательных поединков. Внутренняя сторона обрабатывается антикоррозийным составом.',
      'Ременная система выполняется из кожи растительного дубления. Каждое изделие куётся под заказ и подгоняется по индивидуальным меркам владельца.',
    ],
    image:
      'https://images.unsplash.com/photo-1732198678426-00f5ba98e5b5?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1732198678426-00f5ba98e5b5?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1596716148130-f95f2b735a92?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1755359494724-7d9f74874275?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1734122373993-36745ac6b688?auto=format&fit=crop&w=900&q=80',
    ],
    badge: 'Новинка',
  },
  {
    id: '2',
    name: 'Шлем-саллет с забралом',
    subtitle: 'Позднесредневековый шлем, XV век',
    status: 'Готовый комплект',
    category: 'Шлемы',
    era: 'XV век',
    material: 'Сталь',
    sizes: ['M', 'L'],
    priceFrom: 48000,
    leadTime: 'В наличии',
    weight: '3.8 кг',
    popularity: 85,
    protectionClass: 'Высокий',
    history:
      'Саллет распространился в германских и итальянских землях как универсальный шлем для пехоты и тяжёлой конницы.',
    description: [
      'Шлем выполнен с подвижным забралом и усиленным затылочным хвостом. Подходит для реконструкции позднего Средневековья и бугуртных тренировок.',
      'Внутри предусмотрена мягкая подвесная система и подбородочный ремень. Возможна настройка толщины стали под формат использования.',
    ],
    image:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Helmet%20(Sallet)%20MET%20DP160368.jpg',
    gallery: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Helmet%20(Sallet)%20MET%20DP160368.jpg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/GermanBascinet1400.jpg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/Barbute%20MET%2049.163.2%20005AA2015.jpg',
    ],
  },
  {
    id: '3',
    name: 'Миланский нагрудник',
    subtitle: 'Защита корпуса для турнирного строя, XV век',
    status: 'Готовый комплект',
    category: 'Нагрудники',
    era: 'XV век',
    material: 'Латунь и сталь',
    sizes: ['M', 'L'],
    priceFrom: 72000,
    leadTime: '10 дней',
    weight: '7.2 кг',
    popularity: 92,
    protectionClass: 'Высший',
    history:
      'Миланская традиция отличалась гладкими крупными плоскостями и визуальной цельностью силуэта.',
    description: [
      'Нагрудник рассчитан на турнирное и показательное применение, с усилением в верхней части груди и надёжной развесовкой по корпусу.',
      'Доступны декоративные латунные акценты и индивидуальная полировка для витринных комплектов.',
    ],
    image:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Cuirass%20and%20Tassets%20(Torso%20and%20Hip%20Defense)%20MET%20DP258634.jpg',
    gallery: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Cuirass%20and%20Tassets%20(Torso%20and%20Hip%20Defense)%20MET%20DP258634.jpg',
      'https://images.unsplash.com/photo-1732198678426-00f5ba98e5b5?auto=format&fit=crop&w=900&q=80',
      'https://commons.wikimedia.org/wiki/Special:FilePath/Helmet%20(Sallet)%20MET%20DP160368.jpg',
    ],
    badge: 'Полевые испытания',
  },
  {
    id: '4',
    name: 'Клёпаные рукавицы',
    subtitle: 'Защита кисти и предплечья, XIV век',
    status: 'Реконструкция',
    category: 'Рукавицы',
    era: 'XIV век',
    material: 'Комбинированный',
    sizes: ['S', 'M', 'L'],
    priceFrom: 39000,
    leadTime: '3-4 недели',
    weight: '2.1 кг',
    popularity: 74,
    protectionClass: 'Средний',
    history:
      'Клёпаные рукавицы встречались в позднесредневековых комплектах как компромисс между гибкостью и защитой.',
    description: [
      'Рукавицы собираются на кожаной основе с металлическими сегментами и могут комплектоваться внутренней варежкой.',
    ],
    image:
      'https://i2.storeland.net/1/4375/43746231/afacdb/varezhka-kolchuzhnaya-klpano-sechnaya.jpg',
    gallery: [
      'https://i2.storeland.net/1/4375/43746231/afacdb/varezhka-kolchuzhnaya-klpano-sechnaya.jpg',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    id: '5',
    name: 'Кольчужный хауберт',
    subtitle: 'Реконструкция походного доспеха, XIII век',
    status: 'Под заказ',
    category: 'Полные комплекты',
    era: 'XIII век',
    material: 'Сталь',
    sizes: ['M', 'L', 'XL'],
    priceFrom: 96000,
    leadTime: '5-6 недель',
    weight: '12 кг',
    popularity: 89,
    protectionClass: 'Средний',
    history:
      'Хауберт был основой рыцарского защитного комплекса до широкого распространения латных доспехов.',
    description: [
      'Плетение выполняется из клёпаных и сварных колец по историческим аналогам. Возможно изготовление с капюшоном и рукавицами.',
    ],
    image:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Italian%20-%20Mail%20-%20Walters%2051575.jpg',
    gallery: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Italian%20-%20Mail%20-%20Walters%2051575.jpg',
      'https://images.unsplash.com/photo-1732198678426-00f5ba98e5b5?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    id: '6',
    name: 'Турнирный щит павеза',
    subtitle: 'Крупный щит с кожаной обтяжкой, XV век',
    status: 'Под заказ',
    category: 'Щиты',
    era: 'XV век',
    material: 'Кожа',
    sizes: ['M', 'L'],
    priceFrom: 36000,
    leadTime: '2-3 недели',
    weight: '5.4 кг',
    popularity: 68,
    protectionClass: 'Высокий',
    history:
      'Павезы использовались как полевые укрытия и крупные строевые щиты в позднесредневековых кампаниях.',
    description: [
      'Щит формуется на деревянной основе, обтягивается кожей и подготавливается под роспись или геральдику заказчика.',
    ],
    image:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Royal%20Armouries%20-%20Up%20Close%20online%20exhibition%20-%20Detail%20of%20pavise,%2015th%20century,%20V.10%20(53528248681).jpg',
    gallery: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Royal%20Armouries%20-%20Up%20Close%20online%20exhibition%20-%20Detail%20of%20pavise,%2015th%20century,%20V.10%20(53528248681).jpg',
      'https://images.unsplash.com/photo-1732198678426-00f5ba98e5b5?auto=format&fit=crop&w=900&q=80',
    ],
    badge: 'Новинка',
  },
  {
    id: '7',
    name: 'Бацинет с бармицей',
    subtitle: 'Боевой шлем для XIV века, реконструкция под размер M',
    status: 'Под заказ',
    category: 'Шлемы',
    era: 'XIV век',
    material: 'Сталь',
    sizes: ['S', 'M'],
    priceFrom: 54000,
    leadTime: '4-5 недель',
    weight: '4.1 кг',
    popularity: 81,
    protectionClass: 'Высокий',
    history:
      'Бацинет стал одной из самых узнаваемых форм защиты головы в XIV веке, постепенно вытесняя более ранние формы шлемов.',
    description: [
      'Модель рассчитана на историческую реконструкцию с кольчужной бармицей и внутренней подвесной системой.',
      'Подходит для демонстрационных выходов и тренировочного формата с индивидуальной подгонкой по окружности головы.',
    ],
    image:
      'https://commons.wikimedia.org/wiki/Special:FilePath/GermanBascinet1400.jpg',
    gallery: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/GermanBascinet1400.jpg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/Helmet%20(Sallet)%20MET%20DP160368.jpg',
      'https://images.unsplash.com/photo-1732198678426-00f5ba98e5b5?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    id: '8',
    name: 'Барбута “Марсово поле”',
    subtitle: 'Открытый шлем итальянского типа, XV век',
    status: 'Готовый комплект',
    category: 'Шлемы',
    era: 'XV век',
    material: 'Сталь',
    sizes: ['M'],
    priceFrom: 51000,
    leadTime: '7 дней',
    weight: '3.5 кг',
    popularity: 79,
    protectionClass: 'Высокий',
    history:
      'Барбута отсылает к античным силуэтам и особенно характерна для итальянских мастерских XV века.',
    description: [
      'Шлем сохраняет открытое лицо и хороший обзор, поэтому удобен для показательных выступлений и фестивалей.',
      'Поверхность отполирована до мягкого сатинового блеска, возможна отделка латунной кромкой.',
    ],
    image:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Barbute%20MET%2049.163.2%20005AA2015.jpg',
    gallery: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Barbute%20MET%2049.163.2%20005AA2015.jpg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/Helmet%20(Sallet)%20MET%20DP160368.jpg',
      'https://images.unsplash.com/photo-1734122373993-36745ac6b688?auto=format&fit=crop&w=900&q=80',
    ],
    badge: 'Новинка',
  },
];

const initialReviews: Record<string, Review[]> = {
  '2': [
    {
      author: 'Илья, клуб “Северный гарнизон”',
      text: 'Шлем сел точно по мерке, обзор хороший, внутренняя подвеска выдержала весь фестивальный сезон.',
      rating: 5,
      date: '12.01.2026',
    },
  ],
  '8': [
    {
      author: 'Алексей',
      text: 'Очень аккуратная полировка и комфортная посадка. Для формата фестиваля оказался отличным вариантом.',
      rating: 4,
      date: '03.02.2026',
    },
  ],
};

const sortOptions: { value: SortMode; label: string }[] = [
  { value: 'default', label: 'По умолчанию' },
  { value: 'newest', label: 'Сначала новые' },
  { value: 'popular', label: 'По популярности' },
  { value: 'duration', label: 'По сроку изготовления' },
];

const statusStyles: Record<ProductStatus, string> = {
  'Готовый комплект': 'status status-ready',
  'Под заказ': 'status status-order',
  'Реконструкция': 'status status-reconstruction',
};

const sidebarSections = [
  {
    title: 'Каталог доспехов',
    icon: Swords,
    links: ['Готовые работы', 'Реконструкция по источникам', 'Турнирные комплекты', 'Отдельные элементы'],
  },
  {
    title: 'Услуги мастерской',
    icon: Hammer,
    links: ['Подгонка по меркам', 'Ремонт и реставрация', 'Историческая консультация', 'Финишная отделка'],
  },
];

const filterSections = [
  { key: 'categories', title: 'Тип доспеха', options: ['Шлемы', 'Нагрудники', 'Полные комплекты', 'Аксессуары', 'Щиты', 'Рукавицы'] },
  { key: 'eras', title: 'Эпоха', options: ['XIII век', 'XIV век', 'XV век', 'XVI век'] },
  { key: 'materials', title: 'Материал', options: ['Сталь', 'Кожа', 'Комбинированный', 'Латунь и сталь'] },
  { key: 'sizes', title: 'Размер', options: ['XS', 'S', 'M', 'L', 'XL'] },
  { key: 'statuses', title: 'Статус', options: ['Готовый комплект', 'Под заказ', 'Реконструкция'] },
] as const;

function Header({
  query,
  onQueryChange,
  detailOpen,
  currentView,
  onHome,
  onOpenAdmin,
  onOpenLogin,
  onLogout,
  user,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  detailOpen: boolean;
  currentView: ViewMode;
  onHome: () => void;
  onOpenAdmin: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  user: AuthUser | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <div className="topbar-left">
          <button className="brand brand-button" onClick={onHome}>
            <span>
              <strong>Кузница</strong>
              <small>Кальрадия</small>
            </span>
          </button>
        </div>

        <nav className="topnav">
          <div className="topnav-primary">
            <button className={`nav-button ${currentView === 'catalog' ? 'nav-button-active' : ''}`} onClick={onHome}>
              Каталог
            </button>
            {user?.isStaff ? (
              <button className={`nav-button ${currentView === 'admin' ? 'nav-button-active' : ''}`} onClick={onOpenAdmin}>
                Управление каталогом
              </button>
            ) : null}
          </div>
          <div className="topnav-secondary">
            <a href="#contacts">Контакты</a>
          </div>
        </nav>

        <div className="topbar-actions">
          {!detailOpen ? (
            <label className="searchbox" aria-label="Поиск по каталогу">
              <Search size={16} />
              <input
                type="search"
                placeholder="Поиск доспехов..."
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
              />
            </label>
          ) : (
            <button className="detail-back-inline" onClick={onHome}>
              <ArrowLeft size={16} />
              Назад в каталог
            </button>
          )}

          {user ? (
            <button className="icon-button" onClick={onLogout} aria-label="Выйти" title={`Выйти (${user.fullName})`}>
              <LogOut size={18} />
            </button>
          ) : (
            <button className="icon-button" onClick={onOpenLogin} aria-label="Войти">
              <LogIn size={18} />
            </button>
          )}

          <button className="icon-button mobile-only" onClick={() => setMenuOpen((value) => !value)} aria-label="Открыть меню">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="mobile-nav shell">
          <button onClick={onHome}>Каталог</button>
          {user?.isStaff ? <button onClick={onOpenAdmin}>Управление каталогом</button> : null}
          <a href="#collections">Коллекции</a>
          <a href="#contacts">Контакты</a>
        </div>
      ) : null}
    </header>
  );
}

function Sidebar() {
  const [open, setOpen] = useState<string[]>(['Каталог доспехов']);

  return (
    <aside className="sidebar secondary-card">
      {sidebarSections.map((section) => {
        const Icon = section.icon;
        const expanded = open.includes(section.title);

        return (
          <section className="sidebar-section" key={section.title}>
            <button
              className="sidebar-trigger"
              onClick={() =>
                setOpen((current) =>
                  current.includes(section.title)
                    ? current.filter((item) => item !== section.title)
                    : [...current, section.title],
                )
              }
            >
              <span>
                <Icon size={16} />
                {section.title}
              </span>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expanded ? (
              <div className="sidebar-links">
                {section.links.map((link) => (
                  <a href="#catalog" key={link}>
                    {link}
                  </a>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </aside>
  );
}

function FiltersPanel({
  filters,
  onToggle,
  onReset,
}: {
  filters: Filters;
  onToggle: (section: keyof Filters, option: string) => void;
  onReset: () => void;
}) {
  const [expanded, setExpanded] = useState(filterSections.map((section) => section.title));

  return (
    <aside className="filters secondary-card">
      <div className="filters-head">
        <h3>Фильтры</h3>
        <button className="text-link" onClick={onReset}>
          Сбросить
        </button>
      </div>

      {filterSections.map((section) => {
        const isExpanded = expanded.includes(section.title);

        return (
          <section className="filter-section" key={section.title}>
            <button
              className="filter-trigger"
              onClick={() =>
                setExpanded((current) =>
                  current.includes(section.title)
                    ? current.filter((item) => item !== section.title)
                    : [...current, section.title],
                )
              }
            >
              <span>{section.title}</span>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isExpanded ? (
              <div className="filter-options">
                {section.options.map((option) => {
                  const selected = filters[section.key].includes(option);

                  return (
                    <label className="filter-option" key={option}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggle(section.key, option)}
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}

      <button className="cta-button cta-muted" onClick={onReset}>
        Очистить выбранное
      </button>
    </aside>
  );
}

function SortControl({
  sort,
  onChange,
}: {
  sort: SortMode;
  onChange: (value: SortMode) => void;
}) {
  return (
    <label className="sortbox">
      <span>Сортировка</span>
      <select value={sort} onChange={(event) => onChange(event.target.value as SortMode)}>
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProductCard({
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
        <img className="product-image" src={product.image} alt={product.name} />
        {product.badge ? <span className="product-badge">{product.badge}</span> : null}
      </div>

      <div className="product-body">
        <div className="product-headline">
          <h3>{product.name}</h3>
          <p>{product.subtitle}</p>
        </div>

        <div className="product-highlights">
          <span>{product.category}</span>
          <span>{product.material}</span>
          <span>Размеры: {product.sizes.join(', ')}</span>
        </div>

        <div className="product-meta">
          <span className={statusStyles[product.status]}>{product.status}</span>
          <strong>от {product.priceFrom.toLocaleString('ru-RU')} ₽</strong>
        </div>

        <dl className="product-specs">
          <div>
            <dt>Материал</dt>
            <dd>{product.material}</dd>
          </div>
          <div>
            <dt>Срок</dt>
            <dd>{product.leadTime}</dd>
          </div>
        </dl>

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

function ProductDetail({
  product,
  reviews,
  onBack,
  onAddReview,
  orderLink,
}: {
  product: Product;
  reviews: Review[];
  onBack: () => void;
  onAddReview: (productId: string, review: Review) => void;
  orderLink: string;
}) {
  const [activeImage, setActiveImage] = useState(product.gallery[0]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    author: '',
    text: '',
    rating: '5',
  });

  const submitReview = () => {
    if (!reviewForm.author.trim() || !reviewForm.text.trim()) {
      return;
    }

    onAddReview(product.id, {
      author: reviewForm.author.trim(),
      text: reviewForm.text.trim(),
      rating: Number(reviewForm.rating),
      date: new Intl.DateTimeFormat('ru-RU').format(new Date()),
    });

    setReviewForm({ author: '', text: '', rating: '5' });
    setReviewOpen(false);
  };

  return (
    <section className="detail-page">
      <div className="detail-breadcrumbs">
        <button className="detail-back" onClick={onBack}>
          <ArrowLeft size={16} />
          Назад в каталог
        </button>
        <span>Каталог</span>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <div className="detail-layout">
        <div className="detail-gallery">
          <div className="detail-main-image">
            <img src={activeImage} alt={product.name} />
            <div className="detail-overlay-tag">FIG. {product.gallery.indexOf(activeImage) + 1}</div>
            <div className="detail-overlay-code">ARCHIVE REF: {product.id.toUpperCase()}</div>
          </div>

          <div className="detail-thumbnails">
            {product.gallery.map((image, index) => (
              <button
                key={`${product.id}-${index}`}
                className={`detail-thumb ${activeImage === image ? 'detail-thumb-active' : ''}`}
                onClick={() => setActiveImage(image)}
              >
                <img src={image} alt={`${product.name} ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="detail-info">
          <div className="detail-title-block">
            <span className="detail-badge">{product.category}</span>
            <h1>{product.name}</h1>
            <p>{product.subtitle}</p>
          </div>

          <div className="detail-spec-grid">
            <div>
              <span><Hammer size={14} /> Материал</span>
              <strong>{product.material}</strong>
            </div>
            <div>
              <span><Scale size={14} /> Вес</span>
              <strong>{product.weight}</strong>
            </div>
            <div>
              <span><Clock3 size={14} /> Срок изготовления</span>
              <strong>{product.leadTime}</strong>
            </div>
            <div>
              <span><Shield size={14} /> Класс защиты</span>
              <strong>{product.protectionClass}</strong>
            </div>
          </div>

          <div className="detail-size-panel">
            <span>Доступные размеры</span>
            <div className="size-list">
              {product.sizes.map((size) => (
                <span className="size-chip" key={size}>
                  {size}
                </span>
              ))}
            </div>
          </div>

          <div className="detail-history">
            <h3>Историческая справка</h3>
            <p>{product.history}</p>
          </div>

          <div className="detail-price-row">
            <div>
              <span>Базовая цена</span>
              <strong>{product.priceFrom.toLocaleString('ru-RU')} ₽</strong>
            </div>
            <div className="detail-actions">
              <a
                className="cta-button detail-cta"
                href={orderLink}
                target="_blank"
                rel="noreferrer"
              >
                Связаться для заказа
              </a>
              <button className="ghost-button detail-secondary" onClick={() => setReviewOpen(true)}>
                Оставить отзыв
              </button>
              <a
                className="icon-button detail-icon-button"
                href={orderLink}
                target="_blank"
                rel="noreferrer"
                aria-label="Открыть Telegram"
              >
                <ExternalLink size={18} />
              </a>
            </div>
          </div>

          <div className="detail-description">
            <h2>Описание изделия</h2>
            {product.description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="review-section">
            <div className="review-section-head">
              <h2>Отзывы</h2>
              <span>{reviews.length} шт.</span>
            </div>
            {reviews.length > 0 ? (
              <div className="review-list">
                {reviews.map((review) => (
                  <article className="review-card" key={`${review.author}-${review.date}-${review.text}`}>
                    <div className="review-meta">
                      <strong>{review.author}</strong>
                      <span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    </div>
                    <p>{review.text}</p>
                    <small>{review.date}</small>
                  </article>
                ))}
              </div>
            ) : (
              <p className="review-empty">Пока нет отзывов. Станьте первым, кто оставит впечатления о работе мастерской.</p>
            )}
          </div>
        </div>
      </div>

      {reviewOpen ? (
        <div className="contact-overlay" role="dialog" aria-modal="true">
          <div className="contact-dialog">
            <div className="contact-header">
              <div>
                <h3>Новый отзыв</h3>
                <p>Поделитесь впечатлениями о качестве изделия и взаимодействии с мастерской.</p>
              </div>
              <button className="icon-button" onClick={() => setReviewOpen(false)} aria-label="Закрыть форму">
                <X size={16} />
              </button>
            </div>
            <form
              className="contact-form"
              onSubmit={(event) => {
                event.preventDefault();
                submitReview();
              }}
            >
              <label>
                <span>Имя</span>
                <input
                  type="text"
                  placeholder="Ваше имя"
                  value={reviewForm.author}
                  onChange={(event) => setReviewForm((current) => ({ ...current, author: event.target.value }))}
                />
              </label>
              <label>
                <span>Оценка</span>
                <select
                  value={reviewForm.rating}
                  onChange={(event) => setReviewForm((current) => ({ ...current, rating: event.target.value }))}
                >
                  <option value="5">5 - отлично</option>
                  <option value="4">4 - хорошо</option>
                  <option value="3">3 - нормально</option>
                  <option value="2">2 - с замечаниями</option>
                  <option value="1">1 - требуется доработка</option>
                </select>
              </label>
              <label className="contact-form-wide">
                <span>Текст отзыва</span>
                <textarea
                  placeholder="Например: удобная посадка, хорошая подгонка, аккуратная отделка..."
                  rows={4}
                  value={reviewForm.text}
                  onChange={(event) => setReviewForm((current) => ({ ...current, text: event.target.value }))}
                />
              </label>
              <div className="contact-form-actions contact-form-wide">
                <button type="button" className="cta-button cta-muted" onClick={() => setReviewOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className="cta-button">
                  Сохранить отзыв
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function LoginPage({
  onLogin,
  onCancel,
}: {
  onLogin: (user: AuthUser) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || 'Ошибка входа.');
      } else {
        onLogin(data as AuthUser);
      }
    } catch {
      setError('Нет связи с сервером.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-overlay" role="dialog" aria-modal="true">
      <div className="contact-dialog">
        <div className="contact-header">
          <div>
            <h3>Вход</h3>
            <p>Доступ к управлению каталогом</p>
          </div>
          <button className="icon-button" onClick={onCancel} aria-label="Закрыть">
            <X size={16} />
          </button>
        </div>
        <form className="contact-form" onSubmit={submit}>
          <label>
            <span>Логин</span>
            <input
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            />
          </label>
          <label>
            <span>Пароль</span>
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="contact-form-actions contact-form-wide">
            <button type="button" className="cta-button cta-muted" onClick={onCancel}>
              Отмена
            </button>
            <button type="submit" className="cta-button" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STATUSES: ProductStatus[] = ['Готовый комплект', 'Под заказ', 'Реконструкция'];
const CATEGORIES: Category[] = ['Шлемы', 'Нагрудники', 'Полные комплекты', 'Аксессуары', 'Щиты', 'Рукавицы'];
const ERAS: Era[] = ['XIII век', 'XIV век', 'XV век', 'XVI век'];
const MATERIALS: Material[] = ['Сталь', 'Кожа', 'Комбинированный', 'Латунь и сталь'];
const SIZES: Size[] = ['XS', 'S', 'M', 'L', 'XL'];

type ProductFormData = {
  name: string; subtitle: string; status: ProductStatus; category: Category;
  era: Era; material: Material; sizes: Size[]; priceFrom: string;
  leadTime: string; weight: string; protectionClass: string; history: string;
  description: string; image: string; gallery: string; badge: string;
};

const EMPTY_FORM: ProductFormData = {
  name: '', subtitle: '', status: 'Под заказ', category: 'Шлемы',
  era: 'XV век', material: 'Сталь', sizes: ['M'], priceFrom: '',
  leadTime: '', weight: '', protectionClass: '', history: '',
  description: '', image: '', gallery: '', badge: '',
};

function productToForm(p: Product): ProductFormData {
  return {
    name: p.name, subtitle: p.subtitle, status: p.status as ProductStatus,
    category: p.category as Category, era: p.era as Era,
    material: p.material as Material, sizes: p.sizes,
    priceFrom: String(p.priceFrom), leadTime: p.leadTime, weight: p.weight,
    protectionClass: p.protectionClass, history: p.history,
    description: p.description.join('\n\n'),
    image: p.image, gallery: p.gallery.join('\n'), badge: p.badge ?? '',
  };
}

function ProductFormModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ProductFormData>(product ? productToForm(product) : EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field: keyof ProductFormData, value: string | Size[]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const toggleSize = (size: Size) =>
    set('sizes', form.sizes.includes(size) ? form.sizes.filter((s) => s !== size) : [...form.sizes, size]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    const body = {
      name: form.name.trim(),
      subtitle: form.subtitle.trim(),
      status: form.status,
      category: form.category,
      era: form.era,
      material: form.material,
      sizes: form.sizes,
      priceFrom: Number(form.priceFrom),
      leadTime: form.leadTime.trim(),
      weight: form.weight.trim(),
      protectionClass: form.protectionClass.trim(),
      history: form.history.trim(),
      description: form.description.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
      image: form.image.trim(),
      gallery: form.gallery.split('\n').map((u) => u.trim()).filter(Boolean),
      badge: form.badge.trim(),
    };
    try {
      const url = product ? `/api/catalog/products/${product.id}/` : '/api/catalog/products/';
      const method = product ? 'PATCH' : 'POST';
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.detail ?? JSON.stringify(data));
      } else {
        onSaved();
        onClose();
      }
    } catch {
      setError('Нет связи с сервером.');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof ProductFormData, type: 'text' | 'number' | 'url' = 'text') => (
    <label className="product-form-field">
      <span>{label}</span>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => set(key, e.target.value)}
      />
    </label>
  );

  return (
    <div className="contact-overlay" role="dialog" aria-modal="true">
      <div className="contact-dialog product-form-dialog">
        <div className="contact-header">
          <div>
            <h3>{product ? 'Редактировать товар' : 'Добавить товар'}</h3>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Закрыть">
            <X size={16} />
          </button>
        </div>
        <form className="contact-form product-form" onSubmit={submit}>
          {field('Название', 'name')}
          {field('Подзаголовок', 'subtitle')}

          <label className="product-form-field">
            <span>Статус</span>
            <select value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>

          <label className="product-form-field">
            <span>Категория</span>
            <select value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>

          <label className="product-form-field">
            <span>Эпоха</span>
            <select value={form.era} onChange={(e) => set('era', e.target.value)}>
              {ERAS.map((e) => <option key={e}>{e}</option>)}
            </select>
          </label>

          <label className="product-form-field">
            <span>Материал</span>
            <select value={form.material} onChange={(e) => set('material', e.target.value)}>
              {MATERIALS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </label>

          <div className="product-form-field">
            <span>Размеры</span>
            <div className="product-form-sizes">
              {SIZES.map((s) => (
                <label key={s} className="filter-option">
                  <input type="checkbox" checked={form.sizes.includes(s)} onChange={() => toggleSize(s)} />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </div>

          {field('Цена от (₽)', 'priceFrom', 'number')}
          {field('Срок изготовления', 'leadTime')}
          {field('Вес', 'weight')}
          {field('Класс защиты', 'protectionClass')}
          {field('Значок (Новинка / Полевые испытания)', 'badge')}
          {field('Фото (URL)', 'image', 'url')}

          <label className="product-form-field contact-form-wide">
            <span>Историческая справка</span>
            <textarea rows={3} value={form.history} onChange={(e) => set('history', e.target.value)} />
          </label>

          <label className="product-form-field contact-form-wide">
            <span>Описание (параграфы — пустая строка между ними)</span>
            <textarea rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </label>

          <label className="product-form-field contact-form-wide">
            <span>Галерея (по одному URL на строку)</span>
            <textarea rows={3} value={form.gallery} onChange={(e) => set('gallery', e.target.value)} />
          </label>

          {error ? <p className="form-error contact-form-wide">{error}</p> : null}

          <div className="contact-form-actions contact-form-wide">
            <button type="button" className="cta-button cta-muted" onClick={onClose}>Отмена</button>
            <button type="submit" className="cta-button" disabled={saving}>
              {saving ? 'Сохранение...' : product ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminModule({
  products,
  onRefresh,
}: {
  products: Product[];
  onRefresh: () => void;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<Product | null | 'new'>(undefined as unknown as null);
  const formOpen = formTarget !== (undefined as unknown as null);

  const handleDelete = async (productId: string) => {
    if (!confirm('Удалить товар из каталога?')) return;
    setDeleting(productId);
    try {
      await fetch(`/api/catalog/products/${productId}/`, { method: 'DELETE' });
      onRefresh();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <section className="admin-page">
      {formOpen ? (
        <ProductFormModal
          product={formTarget === 'new' ? null : formTarget}
          onClose={() => setFormTarget(undefined as unknown as null)}
          onSaved={() => { onRefresh(); setFormTarget(undefined as unknown as null); }}
        />
      ) : null}

      <div className="admin-hero">
        <div>
          <p className="eyebrow">Управление</p>
          <h1>Каталог товаров</h1>
        </div>
        <button className="cta-button" onClick={() => setFormTarget('new')}>
          <Plus size={16} />
          Добавить товар
        </button>
      </div>

      <div className="secondary-card" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Название', 'Категория', 'Статус', 'Цена от', 'Создал', 'Изменил', ''].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <strong>{p.name}</strong>
                  <br />
                  <small style={{ color: 'var(--muted)' }}>{p.subtitle}</small>
                </td>
                <td style={{ padding: '12px 16px' }}>{p.category}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span className={statusStyles[p.status]}>{p.status}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>{p.priceFrom.toLocaleString('ru-RU')} ₽</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--muted)' }}>
                  {p.createdBy ?? '—'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--muted)' }}>
                  {p.updatedBy ?? '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="icon-button" title="Редактировать" onClick={() => setFormTarget(p)}>
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button"
                      title="Удалить"
                      onClick={() => handleDelete(p.id)}
                      disabled={deleting === p.id}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


function Footer() {
  return (
    <footer className="site-footer" id="contacts">
      <div className="shell footer-grid">
        <div>
          <h4>О мастерской</h4>
          <p>
            Кузница создаёт средневековые доспехи, элементы реконструкторского снаряжения и турнирные комплекты
            с опорой на исторические источники.
          </p>
        </div>
        <div>
          <h4>Каталог</h4>
          <a href="#catalog">Полные комплекты</a>
          <a href="#catalog">Шлемы и защита головы</a>
          <a href="#catalog">Щиты и аксессуары</a>
        </div>
        <div>
          <h4>Контакты</h4>
          <p>Telegram: @kalradia_forge</p>
          <p>Email: master@kalradia.ru</p>
          <p>Пн-Пт: 09:00-18:00</p>
        </div>
        <div>
          <h4>Новости мастерской</h4>
          <form className="subscribe-form">
            <input type="email" placeholder="Ваш email" />
            <button className="icon-button" type="button" aria-label="Подписаться">
              <Mail size={16} />
            </button>
          </form>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('catalog');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('default');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(products);
  const [externalLinks, setExternalLinks] = useState<ExternalLinks>(defaultLinks);
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    eras: [],
    materials: [],
    sizes: [],
    statuses: [],
  });
  const [reviewsByProduct, setReviewsByProduct] = useState<Record<string, Review[]>>(initialReviews);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  const loadBootstrap = async () => {
    try {
      const response = await fetch('/api/bootstrap/');
      if (!response.ok) return;
      const payload: BootstrapPayload = await response.json();
      if (payload.products?.length) {
        setCatalogProducts(payload.products);
      }
      if (payload.reviewsByProduct) {
        setReviewsByProduct(payload.reviewsByProduct);
      }
      if (payload.links) {
        setExternalLinks({ ...defaultLinks, ...payload.links });
      }
    } catch (error) {
      console.error('Не удалось загрузить bootstrap-данные', error);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me/');
      if (response.ok) {
        setUser(await response.json());
      }
    } catch {
      // not authenticated
    }
  };

  useEffect(() => {
    void loadBootstrap();
    void checkAuth();
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    const updatedProduct = catalogProducts.find((product) => product.id === selectedProduct.id);
    if (updatedProduct) {
      setSelectedProduct(updatedProduct);
    }
  }, [catalogProducts, selectedProduct]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let result = [...catalogProducts].filter((product) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${product.name} ${product.subtitle}`.toLowerCase().includes(normalizedQuery);
      const matchesCategories =
        filters.categories.length === 0 || filters.categories.includes(product.category);
      const matchesEras = filters.eras.length === 0 || filters.eras.includes(product.era);
      const matchesMaterials =
        filters.materials.length === 0 || filters.materials.includes(product.material);
      const matchesSizes =
        filters.sizes.length === 0 || product.sizes.some((size) => filters.sizes.includes(size));
      const matchesStatuses =
        filters.statuses.length === 0 || filters.statuses.includes(product.status);

      return (
        matchesQuery &&
        matchesCategories &&
        matchesEras &&
        matchesMaterials &&
        matchesSizes &&
        matchesStatuses
      );
    });

    switch (sort) {
      case 'newest':
        result = result.sort((a, b) => Number(Boolean(b.badge)) - Number(Boolean(a.badge)));
        break;
      case 'popular':
        result = result.sort((a, b) => b.popularity - a.popularity);
        break;
      case 'duration':
        result = result.sort((a, b) => a.leadTime.localeCompare(b.leadTime, 'ru'));
        break;
      default:
        break;
    }

    return result;
  }, [catalogProducts, filters, query, sort]);

  const activeFilterCount =
    filters.categories.length +
    filters.eras.length +
    filters.materials.length +
    filters.sizes.length +
    filters.statuses.length;

  const toggleFilter = (section: keyof Filters, option: string) => {
    setFilters((current) => {
      const list = current[section];
      const next = list.includes(option)
        ? list.filter((item) => item !== option)
        : [...list, option];

      return { ...current, [section]: next };
    });
  };

  const resetFilters = () => {
    setFilters({
      categories: [],
      eras: [],
      materials: [],
      sizes: [],
      statuses: [],
    });
  };

  const openProduct = (product: Product) => {
    setCurrentView('catalog');
    setSelectedProduct(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addReview = async (productId: string, review: Review) => {
    setReviewsByProduct((current) => ({
      ...current,
      [productId]: [review, ...(current[productId] ?? [])],
    }));

    try {
      await fetch(`/api/catalog/products/${productId}/reviews/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review),
      });
    } catch (error) {
      console.error('Не удалось сохранить отзыв в backend', error);
    }
  };

  const goHome = () => {
    setCurrentView('catalog');
    setSelectedProduct(null);
    setMobileFiltersOpen(false);
  };

  const openAdmin = () => {
    setCurrentView('admin');
    setSelectedProduct(null);
    setMobileFiltersOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = (loggedIn: AuthUser) => {
    setUser(loggedIn);
    setLoginOpen(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout/', { method: 'POST' });
    setUser(null);
    goHome();
  };

  return (
    <div className="page">
      <Header
        query={query}
        onQueryChange={setQuery}
        detailOpen={Boolean(selectedProduct)}
        currentView={currentView}
        onHome={goHome}
        onOpenAdmin={openAdmin}
        onOpenLogin={() => setLoginOpen(true)}
        onLogout={handleLogout}
        user={user}
      />

      {loginOpen ? (
        <LoginPage onLogin={handleLogin} onCancel={() => setLoginOpen(false)} />
      ) : null}

      <main className="shell page-content">
        {currentView === 'admin' && user?.isStaff ? (
          <AdminModule products={catalogProducts} onRefresh={loadBootstrap} />
        ) : selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            reviews={reviewsByProduct[selectedProduct.id] ?? []}
            onBack={goHome}
            onAddReview={addReview}
            orderLink={externalLinks.telegramOrder}
          />
        ) : (
          <>
            <section className="hero" id="catalog">
              <p className="eyebrow">Средневековая мастерская полного цикла</p>
              <h1>Каталог доспехов и реконструкторского снаряжения</h1>
            </section>

            <section className="catalog-layout" id="collections">
              <div className="catalog-side-column">
                <div className="desktop-only catalog-side-stack">
                  <Sidebar />
                  <FiltersPanel filters={filters} onToggle={toggleFilter} onReset={resetFilters} />
                </div>

                <div className="mobile-filter-bar mobile-only">
                  <button className="icon-button" onClick={() => setMobileFiltersOpen(true)}>
                    <SlidersHorizontal size={16} />
                    Фильтры {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
                  </button>
                </div>
              </div>

              <section className="catalog-column">
                <div className="catalog-toolbar">
                  <p>Показано изделий: {filteredProducts.length}</p>
                  <SortControl sort={sort} onChange={setSort} />
                </div>

                <div className="product-grid">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onOpen={openProduct} />
                  ))}
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="empty-state secondary-card">
                    <h3>Ничего не найдено</h3>
                    <p>Попробуй сбросить фильтры или изменить поисковый запрос.</p>
                    <button className="cta-button" onClick={resetFilters}>
                      Сбросить фильтры
                    </button>
                  </div>
                ) : null}
              </section>
            </section>
          </>
        )}
      </main>

      {mobileFiltersOpen && !selectedProduct ? (
        <div className="mobile-overlay" role="dialog" aria-modal="true">
          <div className="mobile-panel">
            <div className="mobile-panel-head">
              <h3>Фильтры</h3>
              <button className="icon-button" onClick={() => setMobileFiltersOpen(false)} aria-label="Закрыть фильтры">
                <X size={16} />
              </button>
            </div>
            <FiltersPanel filters={filters} onToggle={toggleFilter} onReset={resetFilters} />
          </div>
        </div>
      ) : null}

      <Footer />
    </div>
  );
}
