import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CircleUserRound,
  ChevronDown,
  ChevronUp,
  Clock3,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Hammer,
  MessageSquare,
  Megaphone,
  Mail,
  Menu,
  Phone,
  ReceiptText,
  Scale,
  Search,
  Send,
  Shield,
  SlidersHorizontal,
  Swords,
  X,
} from 'lucide-react';

type ProductStatus = 'Готовый комплект' | 'Под заказ' | 'Реконструкция';
type Category = 'Шлемы' | 'Нагрудники' | 'Полные комплекты' | 'Аксессуары' | 'Щиты' | 'Рукавицы';
type Era = 'XIII век' | 'XIV век' | 'XV век' | 'XVI век';
type Material = 'Сталь' | 'Кожа' | 'Комбинированный' | 'Латунь и сталь';
type Size = 'XS' | 'S' | 'M' | 'L' | 'XL';
type SortMode = 'default' | 'newest' | 'popular' | 'duration';
type ViewMode = 'dashboard' | 'catalog' | 'finance' | 'marketing' | 'crm';

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
  badge?: 'Новинка' | 'Полевые испытания';
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
  googleSheets: string;
}

interface BootstrapPayload {
  products: Product[];
  reviewsByProduct: Record<string, Review[]>;
  materials: typeof materialReference;
  financeHistory: typeof financeHistory;
  marketingPosts: typeof marketingPosts;
  crmClients: typeof crmClients;
  links: ExternalLinks;
}

const telegramOrderLink = 'https://web.telegram.org/k/#@kalradiaWarBand';
const googleSheetsLink = 'https://docs.google.com/spreadsheets/u/0/?ec=wgc-sheets-[module]-goto';
const defaultLinks: ExternalLinks = {
  telegramOrder: telegramOrderLink,
  telegramPublic: telegramOrderLink,
  vkCommunity: 'https://vk.com/calradia_band',
  vkMessages: 'https://vk.com/im/convo/-234061306?entrypoint=community_page&tab=all',
  googleSheets: googleSheetsLink,
};

const materialReference = [
  { name: 'Сталь', unitPrice: '500 руб/кг', stock: '82 кг', note: 'Основной материал для шлемов и латных элементов' },
  { name: 'Кожа', unitPrice: '200 руб/м²', stock: '35 м²', note: 'Ремни, подвесы, внутренние элементы' },
  { name: 'Крепёж', unitPrice: '10 руб/шт', stock: '540 шт', note: 'Заклёпки, кольца, крепёжные элементы' },
];

const financeHistory = [
  { date: '10.03.2026', product: 'Кираса', material: 'Сталь', weight: '2 кг', hours: '20 ч', cost: '7 000 руб', markup: '300%', total: '28 000 руб' },
  { date: '08.03.2026', product: 'Шлем-саллет', material: 'Сталь', weight: '1.6 кг', hours: '14 ч', cost: '5 000 руб', markup: '280%', total: '19 000 руб' },
  { date: '05.03.2026', product: 'Клёпаные рукавицы', material: 'Комбинированный', weight: '0.9 кг', hours: '12 ч', cost: '4 150 руб', markup: '250%', total: '14 525 руб' },
];

const marketingPosts = [
  {
    id: 'm1',
    day: '25',
    monthLabel: 'декабря',
    title: 'Новая кираса из стали — готово!',
    text: 'Завершили кирасу для строевой реконструкции. Ручная подгонка, полировка и крепёж под индивидуальные мерки.',
    product: 'Кираса',
    channels: ['VK', 'Telegram'],
    time: '14:00',
    status: 'Запланирован',
    colorClass: 'marketing-status-scheduled',
  },
  {
    id: 'm2',
    day: '21',
    monthLabel: 'декабря',
    title: 'Шлем-саллет в наличии',
    text: 'Открыли запись на готовый шлем-саллет размера M. Возможна отправка сразу после примерки.',
    product: 'Шлем-саллет',
    channels: ['Telegram'],
    time: '11:30',
    status: 'Опубликован',
    colorClass: 'marketing-status-published',
  },
  {
    id: 'm3',
    day: '18',
    monthLabel: 'декабря',
    title: 'Подборка рукавиц',
    text: 'Собрали подборку рукавиц для XIV века. Показываем варианты под фестиваль и тренировочный формат.',
    product: 'Клёпаные рукавицы',
    channels: ['VK'],
    time: '16:00',
    status: 'Ошибка',
    colorClass: 'marketing-status-error',
  },
  {
    id: 'm4',
    day: '28',
    monthLabel: 'декабря',
    title: 'Чек-лист снятия мерок',
    text: 'Готовим пост с памяткой по меркам для шлемов и нагрудников.',
    product: 'Каталог',
    channels: ['VK', 'Telegram'],
    time: '10:00',
    status: 'Черновик',
    colorClass: 'marketing-status-draft',
  },
];

const crmClients = [
  {
    id: 'c1',
    name: 'Илья Романов',
    source: 'Telegram',
    handle: '@ilya_romanov',
    contact: '+7 (999) 123-45-67',
    lastMessage: 'Интересует кираса из стали, размер L.',
    lastTime: '10:42',
    unread: 2,
    orderHistory: ['Шлем-саллет, январь 2026'],
    messages: [
      { from: 'client', text: 'Здравствуйте, интересует кираса из стали, размер L.', time: '10:35' },
      { from: 'manager', text: 'Добрый день. Подскажите, интересует строевая или турнирная версия?', time: '10:38' },
      { from: 'client', text: 'Скорее строевая, с акцентом на реконструкцию XV века.', time: '10:42' },
    ],
  },
  {
    id: 'c2',
    name: 'Мария Волкова',
    source: 'VK',
    handle: 'vk.com/maria.volkova',
    contact: 'Личные сообщения VK',
    lastMessage: 'Есть ли готовый шлем размера M?',
    lastTime: '09:15',
    unread: 1,
    orderHistory: [],
    messages: [
      { from: 'client', text: 'Есть ли готовый шлем размера M?', time: '09:15' },
    ],
  },
  {
    id: 'c3',
    name: 'Алексей Миронов',
    source: 'Telegram',
    handle: '@mironov_reenact',
    contact: '+7 (921) 555-21-90',
    lastMessage: 'Можно ли ускорить изготовление к фестивалю?',
    lastTime: 'Вчера',
    unread: 0,
    orderHistory: ['Клёпаные рукавицы, февраль 2026', 'Павеза, декабрь 2025'],
    messages: [
      { from: 'manager', text: 'По рукавицам всё готово, можем отправить в пятницу.', time: 'Вчера 11:20' },
      { from: 'client', text: 'Можно ли ускорить изготовление к фестивалю?', time: 'Вчера 11:34' },
    ],
  },
];

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
  onOpenFinance,
  onOpenMarketing,
  onOpenCrm,
  onOpenDashboard,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  detailOpen: boolean;
  currentView: ViewMode;
  onHome: () => void;
  onOpenFinance: () => void;
  onOpenMarketing: () => void;
  onOpenCrm: () => void;
  onOpenDashboard: () => void;
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
            <button className={`nav-button ${currentView === 'dashboard' ? 'nav-button-active' : ''}`} onClick={onOpenDashboard}>
              Главная
            </button>
            <button className={`nav-button ${currentView === 'catalog' ? 'nav-button-active' : ''}`} onClick={onHome}>
              Каталог
            </button>
            <button className={`nav-button ${currentView === 'finance' ? 'nav-button-active' : ''}`} onClick={onOpenFinance}>
              Финансы
            </button>
            <button className={`nav-button ${currentView === 'marketing' ? 'nav-button-active' : ''}`} onClick={onOpenMarketing}>
              Маркетинг
            </button>
            <button className={`nav-button ${currentView === 'crm' ? 'nav-button-active' : ''}`} onClick={onOpenCrm}>
              CRM
            </button>
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

          <button className="icon-button mobile-only" onClick={() => setMenuOpen((value) => !value)} aria-label="Открыть меню">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="mobile-nav shell">
          <button onClick={onOpenDashboard}>Главная</button>
          <button onClick={onHome}>Каталог</button>
          <button onClick={onOpenFinance}>Финансы</button>
          <button onClick={onOpenMarketing}>Маркетинг</button>
          <button onClick={onOpenCrm}>CRM</button>
          <a href="#collections">Коллекции</a>
          <a href="#workshop">Мастерская</a>
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

function FinanceModule({
  materials,
  history,
  googleSheetsUrl,
  onFinanceSync,
}: {
  materials: typeof materialReference;
  history: typeof financeHistory;
  googleSheetsUrl: string;
  onFinanceSync: (payload: { materials: typeof materialReference; financeHistory: typeof financeHistory; googleSheets: string }) => void;
}) {
  const [sheetUrl, setSheetUrl] = useState(googleSheetsUrl);
  const [materialsSheet, setMaterialsSheet] = useState('Справочник материалов');
  const [historySheet, setHistorySheet] = useState('История расчётов');
  const [syncState, setSyncState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState(
    'Подключите публичную Google Sheets таблицу, чтобы синхронизировать расчёты и справочник материалов.',
  );

  useEffect(() => {
    setSheetUrl(googleSheetsUrl);
  }, [googleSheetsUrl]);

  const exportHistory = () => {
    const rows = [
      ['Дата', 'Товар', 'Материал', 'Вес', 'Часы', 'Себестоимость', 'Наценка', 'Итог'],
      ...history.map((row) => [row.date, row.product, row.material, row.weight, row.hours, row.cost, row.markup, row.total]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'finance-history.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const syncGoogleSheets = async () => {
    if (!sheetUrl.trim()) {
      setSyncState('error');
      setSyncMessage('Добавьте ссылку на Google Sheets перед синхронизацией.');
      return;
    }

    setSyncState('loading');
    setSyncMessage('Синхронизация с Google Sheets выполняется...');

    try {
      const response = await fetch('/api/finance/sync-google-sheets/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetUrl: sheetUrl.trim(),
          materialsSheet,
          historySheet,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.detail || 'Не удалось синхронизировать Google Sheets.');
      }

      onFinanceSync({
        materials: payload.materials,
        financeHistory: payload.financeHistory,
        googleSheets: sheetUrl.trim(),
      });
      setSyncState('success');
      setSyncMessage('Данные успешно загружены из Google Sheets и сохранены в базе.');
    } catch (error) {
      setSyncState('error');
      setSyncMessage(error instanceof Error ? error.message : 'Ошибка синхронизации с Google Sheets.');
    }
  };

  return (
    <section className="finance-page">
      <div className="finance-hero">
        <div>
          <p className="eyebrow">Модуль финансов</p>
          <h1>Расчёты материалов и себестоимости</h1>
        </div>
        <div className="finance-hero-actions">
          <a className="cta-button finance-primary-link" href={sheetUrl || googleSheetsUrl} target="_blank" rel="noreferrer">
            <FileSpreadsheet size={18} />
            Открыть Google Sheets
          </a>
          <button className="ghost-button finance-secondary-button" type="button" onClick={exportHistory}>
            <Download size={18} />
            Экспорт всей истории в CSV
          </button>
        </div>
      </div>

      <div className="finance-layout">
        <section className="finance-reference secondary-card">
          <div className="finance-section-head">
            <h3>Интеграция Google Sheets</h3>
            <span>{syncState === 'success' ? 'Подключено' : syncState === 'loading' ? 'Синхронизация' : 'Настройка'}</span>
          </div>
          <div className="finance-sync-grid">
            <label>
              <span>Ссылка на таблицу</span>
              <input type="url" value={sheetUrl} onChange={(event) => setSheetUrl(event.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." />
            </label>
            <label>
              <span>Лист материалов</span>
              <input type="text" value={materialsSheet} onChange={(event) => setMaterialsSheet(event.target.value)} />
            </label>
            <label>
              <span>Лист истории</span>
              <input type="text" value={historySheet} onChange={(event) => setHistorySheet(event.target.value)} />
            </label>
          </div>
          <div className="finance-sync-actions">
            <button className="cta-button" type="button" onClick={syncGoogleSheets}>
              <FileSpreadsheet size={18} />
              Синхронизировать
            </button>
          </div>
          <p className={`finance-sync-message finance-sync-${syncState}`}>{syncMessage}</p>

          <div className="finance-section-head finance-subsection-head">
            <h3>Справочник материалов</h3>
            <span>Актуальные цены</span>
          </div>
          <div className="finance-reference-list">
            {materials.map((item) => (
              <article key={item.name} className="finance-reference-card">
                <div className="finance-reference-top">
                  <strong>{item.name}</strong>
                  <span>{item.unitPrice}</span>
                </div>
                <p>{item.note}</p>
                <small>Остаток: {item.stock}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="finance-workspace">
          <div className="finance-iframe-card">
            <div className="finance-section-head">
              <h3>Рабочая таблица Google Sheets</h3>
              <span>Вкладка «Расчёты»</span>
            </div>
            <div className="finance-sheet-frame" aria-label="Предпросмотр Google Sheets">
              <div className="finance-sheet-toolbar">
                <span>Google Form: Новый расчёт</span>
                <a href={sheetUrl || googleSheetsUrl} target="_blank" rel="noreferrer">
                  Открыть в полном окне
                </a>
              </div>
              <div className="finance-sheet-body">
                <div className="finance-form-mock">
                  <div>
                    <span>Товар</span>
                    <strong>{history[0]?.product || 'Кираса'}</strong>
                  </div>
                  <div>
                    <span>Материал</span>
                    <strong>{history[0]?.material || 'Сталь'}</strong>
                  </div>
                  <div>
                    <span>Вес</span>
                    <strong>{history[0]?.weight || '2 кг'}</strong>
                  </div>
                  <div>
                    <span>Трудозатраты</span>
                    <strong>{history[0]?.hours || '20 часов'}</strong>
                  </div>
                </div>
                <div className="finance-calc-grid">
                  <article>
                    <span><Banknote size={14} /> Стоимость материала</span>
                    <strong>1 000 руб</strong>
                    <p>По данным подключённой таблицы</p>
                  </article>
                  <article>
                    <span><Hammer size={14} /> Стоимость работы</span>
                    <strong>6 000 руб</strong>
                    <p>По данным подключённой таблицы</p>
                  </article>
                  <article className="finance-calc-accent finance-calc-cost">
                    <span>Себестоимость</span>
                    <strong>{history[0]?.cost || '7 000 руб'}</strong>
                    <p>Материал + работа</p>
                  </article>
                  <article className="finance-calc-accent finance-calc-total">
                    <span>Итоговая цена</span>
                    <strong>{history[0]?.total || '28 000 руб'}</strong>
                    <p>С учётом наценки {history[0]?.markup || '300%'}</p>
                  </article>
                </div>
              </div>
            </div>
          </div>

          <div className="finance-history-card secondary-card">
            <div className="finance-section-head">
              <h3>История расчётов</h3>
              <span>Обновляется по данным Sheets</span>
            </div>
            <div className="finance-table-wrap">
              <table className="finance-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Товар</th>
                    <th>Материал</th>
                    <th>Вес</th>
                    <th>Часы</th>
                    <th>Себестоимость</th>
                    <th>Наценка</th>
                    <th>Итог</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={`${row.date}-${row.product}`}>
                      <td>{row.date}</td>
                      <td>{row.product}</td>
                      <td>{row.material}</td>
                      <td>{row.weight}</td>
                      <td>{row.hours}</td>
                      <td className="finance-cost-cell">{row.cost}</td>
                      <td>{row.markup}</td>
                      <td className="finance-total-cell">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function MarketingModule({
  posts,
  onRefresh,
}: {
  posts: typeof marketingPosts;
  onRefresh: () => Promise<void>;
}) {
  const [selectedPostId, setSelectedPostId] = useState(posts[0]?.id ?? '');
  const [publishMessage, setPublishMessage] = useState('');
  const [publishLoading, setPublishLoading] = useState(false);
  const selectedPost = posts.find((post) => post.id === selectedPostId) ?? posts[0];

  useEffect(() => {
    if (posts[0] && !posts.some((post) => post.id === selectedPostId)) {
      setSelectedPostId(posts[0].id);
    }
  }, [posts, selectedPostId]);

  if (!selectedPost) {
    return null;
  }

  const publishNow = async () => {
    setPublishLoading(true);
    setPublishMessage('');
    try {
      const response = await fetch(`/api/marketing/publications/${selectedPost.id}/publish/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.detail || 'Не удалось опубликовать пост.');
      }
      setPublishMessage(payload.publishedUrl ? `Пост опубликован: ${payload.publishedUrl}` : 'Пост успешно отправлен в Telegram.');
      await onRefresh();
    } catch (error) {
      setPublishMessage(error instanceof Error ? error.message : 'Ошибка публикации.');
    } finally {
      setPublishLoading(false);
    }
  };

  return (
    <section className="marketing-page">
      <div className="marketing-hero">
        <div>
          <p className="eyebrow">Модуль маркетинга</p>
          <h1>Планирование публикаций в VK и Telegram</h1>
        </div>
        <div className="marketing-hero-actions">
          <button className="cta-button marketing-primary-button" type="button">
            <Send size={18} />
            Запланировать публикацию
          </button>
          <button className="ghost-button marketing-secondary-button" type="button">
            <CalendarDays size={18} />
            Открыть календарь
          </button>
        </div>
      </div>

      <div className="marketing-layout">
        <section className="marketing-calendar secondary-card">
          <div className="finance-section-head">
            <h3>Календарь публикаций</h3>
            <span>Декабрь 2026</span>
          </div>
          <div className="marketing-calendar-grid">
            {posts.map((post) => (
              <button
                key={post.id}
                className={`marketing-day-card ${selectedPostId === post.id ? 'marketing-day-card-active' : ''}`}
                onClick={() => setSelectedPostId(post.id)}
              >
                <div className="marketing-day-header">
                  <strong>{post.day}</strong>
                  <span>{post.monthLabel}</span>
                </div>
                <p>{post.title}</p>
                <small className={post.colorClass}>{post.status}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="marketing-workspace">
          <div className="marketing-editor secondary-card">
            <div className="finance-section-head">
              <h3>Редактор поста</h3>
              <span>{selectedPost.status}</span>
            </div>
            <div className="marketing-editor-grid">
              <label>
                <span>Заголовок</span>
                <input type="text" value={selectedPost.title} readOnly />
              </label>
              <label>
                <span>Связанный товар</span>
                <input type="text" value={selectedPost.product} readOnly />
              </label>
              <label className="marketing-editor-wide">
                <span>Описание</span>
                <textarea value={selectedPost.text} rows={5} readOnly />
              </label>
              <label>
                <span>Социальные сети</span>
                <div className="marketing-channel-list">
                  {selectedPost.channels.map((channel) => (
                    <span className="size-chip" key={channel}>{channel}</span>
                  ))}
                </div>
              </label>
              <label>
                <span>Время публикации</span>
                <input type="text" value={`${selectedPost.day} ${selectedPost.monthLabel}, ${selectedPost.time}`} readOnly />
              </label>
            </div>
          </div>

          <div className="marketing-preview-grid">
            <article className="marketing-preview-card secondary-card">
              <div className="finance-section-head">
                <h3>Предпросмотр</h3>
                <span>VK</span>
              </div>
              <div className="marketing-preview-body">
                <div className="marketing-preview-image">
                  <span>Фото товара из каталога</span>
                </div>
                <strong>{selectedPost.title}</strong>
                <p>{selectedPost.text}</p>
                <small>Ссылка на товар: /catalog/{selectedPost.product.toLowerCase()}</small>
              </div>
            </article>

            <article className="marketing-status-card secondary-card">
              <div className="finance-section-head">
                <h3>Статус публикации</h3>
                <span className={selectedPost.colorClass}>{selectedPost.status}</span>
              </div>
              <div className="marketing-status-list">
                <div>
                  <span>Площадки</span>
                  <strong>{selectedPost.channels.join(', ')}</strong>
                </div>
                <div>
                  <span>Время</span>
                  <strong>{selectedPost.time}</strong>
                </div>
                <div>
                  <span>Товар</span>
                  <strong>{selectedPost.product}</strong>
                </div>
              </div>
              <div className="marketing-status-actions">
                <button className="cta-button" type="button">Сохранить как черновик</button>
                <button className="ghost-button" type="button" onClick={publishNow} disabled={publishLoading}>
                  {publishLoading ? 'Публикация...' : 'Опубликовать сейчас'}
                </button>
              </div>
              {publishMessage ? <p className="marketing-inline-message">{publishMessage}</p> : null}
            </article>
          </div>
        </section>
      </div>
    </section>
  );
}

function CrmModule({
  clients,
  onReplySent,
}: {
  clients: typeof crmClients;
  onReplySent: () => Promise<void>;
}) {
  const [selectedSource, setSelectedSource] = useState<'Все' | 'Telegram' | 'VK'>('Все');
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? '');
  const [replyText, setReplyText] = useState('');
  const [crmMessage, setCrmMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const visibleClients = clients.filter((client) => selectedSource === 'Все' || client.source === selectedSource);
  const selectedClient = visibleClients.find((client) => client.id === selectedClientId) ?? visibleClients[0] ?? clients[0];

  useEffect(() => {
    if (visibleClients[0] && !visibleClients.some((client) => client.id === selectedClientId)) {
      setSelectedClientId(visibleClients[0].id);
    }
  }, [selectedClientId, visibleClients]);

  if (!selectedClient) {
    return null;
  }

  const sendReply = async () => {
    if (!replyText.trim()) {
      setCrmMessage('Введите текст сообщения перед отправкой.');
      return;
    }

    setReplyLoading(true);
    setCrmMessage('');
    try {
      const response = await fetch(`/api/crm/clients/${selectedClient.id}/reply/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.detail || 'Не удалось отправить сообщение.');
      }
      setReplyText('');
      setCrmMessage('Ответ отправлен и сохранён в CRM.');
      await onReplySent();
    } catch (error) {
      setCrmMessage(error instanceof Error ? error.message : 'Ошибка отправки сообщения.');
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <section className="crm-page">
      <div className="crm-hero">
        <div>
          <p className="eyebrow">CRM-модуль</p>
          <h1>Клиенты из VK и Telegram в одном окне</h1>
        </div>
        <div className="crm-hero-actions">
          <button className="cta-button crm-primary-button" type="button">
            <ReceiptText size={18} />
            Создать заказ из чата
          </button>
          <button className="ghost-button crm-secondary-button" type="button">
            <MessageSquare size={18} />
            Отправить ответ
          </button>
        </div>
      </div>

      <div className="crm-layout">
        <section className="crm-sidebar secondary-card">
          <div className="finance-section-head">
            <h3>Входящие обращения</h3>
            <span>{visibleClients.length} чатов</span>
          </div>

          <div className="crm-source-tabs">
            {(['Все', 'Telegram', 'VK'] as const).map((source) => (
              <button
                key={source}
                className={`crm-source-tab ${selectedSource === source ? 'crm-source-tab-active' : ''}`}
                onClick={() => {
                  setSelectedSource(source);
                  const nextClient = clients.find((client) => source === 'Все' || client.source === source);
                  if (nextClient) {
                    setSelectedClientId(nextClient.id);
                  }
                }}
              >
                {source}
              </button>
            ))}
          </div>

          <div className="crm-chat-list">
            {visibleClients.map((client) => (
              <button
                key={client.id}
                className={`crm-chat-card ${selectedClient.id === client.id ? 'crm-chat-card-active' : ''}`}
                onClick={() => setSelectedClientId(client.id)}
              >
                <div className="crm-chat-top">
                  <strong>{client.name}</strong>
                  <span>{client.lastTime}</span>
                </div>
                <div className="crm-chat-badges">
                  <span className="size-chip">{client.source}</span>
                  {client.unread > 0 ? <span className="crm-unread-badge">{client.unread}</span> : null}
                </div>
                <p>{client.lastMessage}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="crm-main">
          <div className="crm-conversation secondary-card">
            <div className="finance-section-head">
              <h3>Диалог с клиентом</h3>
              <span>{selectedClient.source}</span>
            </div>
            <div className="crm-message-list">
              {selectedClient.messages.map((message, index) => (
                <div
                  key={`${selectedClient.id}-${index}`}
                  className={`crm-message ${message.from === 'manager' ? 'crm-message-manager' : 'crm-message-client'}`}
                >
                  <p>{message.text}</p>
                  <small>{message.time}</small>
                </div>
              ))}
            </div>
            <div className="crm-compose">
              <input type="text" placeholder="Введите сообщение клиенту..." value={replyText} onChange={(event) => setReplyText(event.target.value)} />
              <button className="cta-button" type="button" onClick={sendReply} disabled={replyLoading}>
                {replyLoading ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
            {crmMessage ? <p className="crm-inline-message">{crmMessage}</p> : null}
          </div>

          <div className="crm-client-card secondary-card">
            <div className="finance-section-head">
              <h3>Карточка клиента</h3>
              <span>{selectedClient.name}</span>
            </div>
            <div className="crm-client-grid">
              <div>
                <span><CircleUserRound size={14} /> Имя</span>
                <strong>{selectedClient.name}</strong>
              </div>
              <div>
                <span><MessageSquare size={14} /> Профиль</span>
                <strong>{selectedClient.handle}</strong>
              </div>
              <div>
                <span><Phone size={14} /> Контакт</span>
                <strong>{selectedClient.contact}</strong>
              </div>
              <div>
                <span><ReceiptText size={14} /> История заказов</span>
                <strong>{selectedClient.orderHistory.length > 0 ? `${selectedClient.orderHistory.length} заказа` : 'Нет заказов'}</strong>
              </div>
            </div>

            <div className="crm-order-history">
              <h4>Ранее оформленные заказы</h4>
              {selectedClient.orderHistory.length > 0 ? (
                <ul>
                  {selectedClient.orderHistory.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>У клиента ещё нет завершённых заказов.</p>
              )}
            </div>

            <div className="crm-order-actions">
              <button className="cta-button" type="button">Создать заказ из чата</button>
              <button className="ghost-button" type="button">Сменить статус заказа</button>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function Dashboard({
  onOpenCatalog,
  onOpenFinance,
  onOpenMarketing,
  onOpenCrm,
}: {
  onOpenCatalog: () => void;
  onOpenFinance: () => void;
  onOpenMarketing: () => void;
  onOpenCrm: () => void;
}) {
  const quickLinks = [
    {
      title: 'Каталог',
      description: 'Управление товарами, просмотр карточек и сценарий клиентского заказа.',
      icon: Shield,
      action: onOpenCatalog,
    },
    {
      title: 'CRM',
      description: 'Обращения из Telegram и VK, история чатов и создание заказов.',
      icon: MessageSquare,
      action: onOpenCrm,
    },
    {
      title: 'Финансы',
      description: 'Справочник материалов, расчёты себестоимости и история операций.',
      icon: Banknote,
      action: onOpenFinance,
    },
    {
      title: 'Маркетинг',
      description: 'Календарь публикаций, редактор постов и статусы размещения.',
      icon: Megaphone,
      action: onOpenMarketing,
    },
  ];

  return (
    <section className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">Главная панель</p>
          <h1>
            Панель управления мастерской
            <br />
            «Кузница Кальрадия»
          </h1>
        </div>
      </div>

      <div className="dashboard-content-grid">
        <section className="dashboard-links secondary-card">
          <div className="finance-section-head">
            <h3>Быстрый доступ</h3>
            <span>Основные модули</span>
          </div>
          <div className="dashboard-link-grid">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button className="dashboard-link-card" key={item.title} onClick={item.action}>
                  <span className="dashboard-link-icon">
                    <Icon size={20} />
                  </span>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </button>
              );
            })}
          </div>
        </section>
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
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('default');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(products);
  const [financeMaterials, setFinanceMaterials] = useState(materialReference);
  const [financeRows, setFinanceRows] = useState(financeHistory);
  const [marketingRows, setMarketingRows] = useState(marketingPosts);
  const [crmRows, setCrmRows] = useState(crmClients);
  const [externalLinks, setExternalLinks] = useState<ExternalLinks>(defaultLinks);
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    eras: [],
    materials: [],
    sizes: [],
    statuses: [],
  });
  const [reviewsByProduct, setReviewsByProduct] = useState<Record<string, Review[]>>(initialReviews);

  const loadBootstrap = async () => {
    try {
      const response = await fetch('/api/bootstrap/');
      if (!response.ok) {
        return;
      }
      const payload: BootstrapPayload = await response.json();
      if (payload.products?.length) {
        setCatalogProducts(payload.products);
      }
      if (payload.reviewsByProduct) {
        setReviewsByProduct(payload.reviewsByProduct);
      }
      if (payload.materials?.length) {
        setFinanceMaterials(payload.materials);
      }
      if (payload.financeHistory?.length) {
        setFinanceRows(payload.financeHistory);
      }
      if (payload.marketingPosts?.length) {
        setMarketingRows(payload.marketingPosts);
      }
      if (payload.crmClients?.length) {
        setCrmRows(payload.crmClients);
      }
      if (payload.links) {
        setExternalLinks({ ...defaultLinks, ...payload.links });
      }
    } catch (error) {
      console.error('Не удалось загрузить bootstrap-данные', error);
    }
  };

  useEffect(() => {
    void loadBootstrap();
  }, []);

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }
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

  const handleFinanceSync = (payload: { materials: typeof materialReference; financeHistory: typeof financeHistory; googleSheets: string }) => {
    setFinanceMaterials(payload.materials);
    setFinanceRows(payload.financeHistory);
    setExternalLinks((current) => ({ ...current, googleSheets: payload.googleSheets }));
  };

  const goHome = () => {
    setCurrentView('catalog');
    setSelectedProduct(null);
    setMobileFiltersOpen(false);
  };

  const openDashboard = () => {
    setCurrentView('dashboard');
    setSelectedProduct(null);
    setMobileFiltersOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openFinance = () => {
    setCurrentView('finance');
    setSelectedProduct(null);
    setMobileFiltersOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openMarketing = () => {
    setCurrentView('marketing');
    setSelectedProduct(null);
    setMobileFiltersOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCrm = () => {
    setCurrentView('crm');
    setSelectedProduct(null);
    setMobileFiltersOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page">
      <Header
        query={query}
        onQueryChange={setQuery}
        detailOpen={Boolean(selectedProduct)}
        currentView={currentView}
        onHome={goHome}
        onOpenFinance={openFinance}
        onOpenMarketing={openMarketing}
        onOpenCrm={openCrm}
        onOpenDashboard={openDashboard}
      />

      <main className="shell page-content">
        {currentView === 'dashboard' ? (
          <Dashboard
            onOpenCatalog={goHome}
            onOpenFinance={openFinance}
            onOpenMarketing={openMarketing}
            onOpenCrm={openCrm}
          />
        ) : currentView === 'finance' ? (
          <FinanceModule
            materials={financeMaterials}
            history={financeRows}
            googleSheetsUrl={externalLinks.googleSheets}
            onFinanceSync={handleFinanceSync}
          />
        ) : currentView === 'marketing' ? (
          <MarketingModule posts={marketingRows} onRefresh={loadBootstrap} />
        ) : currentView === 'crm' ? (
          <CrmModule clients={crmRows} onReplySent={loadBootstrap} />
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
