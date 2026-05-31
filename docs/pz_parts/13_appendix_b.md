# ПРИЛОЖЕНИЕ Б
## Листинги ключевых компонентов клиентской части

### Б.1 Типы данных (src/types.ts)

Листинг Б.1 — Типы и интерфейсы TypeScript

```typescript
export type ProductStatus =
  | 'В наличии'
  | 'Изготовим на заказ'
  | 'Снят с производства';

export type Category =
  | 'Шлемы' | 'Нагрудники' | 'Полные комплекты'
  | 'Аксессуары' | 'Щиты' | 'Рукавицы' | 'Обувь'
  | 'Одежда' | 'Предметы быта'
  | 'Стрелковое оружие' | 'Дробящее оружие'
  | 'Колющее оружие' | 'Режущее оружие';

export type Era     = 'XIII век' | 'XIV век' | 'XV век' | 'XVI век';
export type SortMode = 'default' | 'newest' | 'popular' | 'duration';
export type ViewMode =
  | 'home' | 'catalog' | 'sets' | 'services'
  | 'reviews' | 'privacy' | 'admin' | 'login';

export interface SetDiscount {
  slug:             string;
  name:             string;
  discount_percent: number;
}

export interface Product {
  id:              string;
  name:            string;
  subtitle:        string;
  status:          ProductStatus;
  slug?:           string;
  category:        Category;
  era:             Era;
  material:        string;
  sizes:           string[];
  priceFrom:       number;
  leadTime:        string;
  weight:          string;
  popularity:      number;
  protectionClass: string;
  history:         string;
  description:     string[];
  image:           string;
  gallery:         string[];
  badge?:          string;
  createdBy?:      string;
  updatedBy?:      string;
  created_at?:     string;
  updated_at?:     string;
  setDiscounts?:   SetDiscount[];
}

export interface Filters {
  categories: string[];
  eras:       string[];
  materials:  string[];
  sizes:      string[];
  statuses:   string[];
}

export interface ExternalLinks {
  telegramOrder:  string;
  telegramPublic: string;
  vkCommunity:    string;
  vkMessages:     string;
}

export interface BootstrapPayload {
  products: Product[];
  reviews:  Review[];
  links:    ExternalLinks;
}

export interface AuthUser {
  id:          number;
  username:    string;
  fullName:    string;
  isStaff:     boolean;
  isSuperuser: boolean;
}
```

### Б.2 Корневой компонент приложения (src/App.tsx)

Листинг Б.2 — Инициализация состояния и загрузка данных

```typescript
export default function App() {
  const [currentView,        setCurrentView]        = useState<ViewMode>('home');
  const [query,              setQuery]              = useState('');
  const [sort,               setSort]               = useState<SortMode>('default');
  const [selectedProduct,    setSelectedProduct]    = useState<Product | null>(null);
  const [catalogProducts,    setCatalogProducts]    = useState<Product[]>(fallbackProducts);
  const [externalLinks,      setExternalLinks]      = useState<ExternalLinks>(defaultLinks);
  const [filters,            setFilters]            = useState<Filters>({
    categories: [], eras: [], materials: [], sizes: [], statuses: [],
  });
  const [user,   setUser]   = useState<AuthUser | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  const loadBootstrap = async () => {
    try {
      const response = await fetch('/api/bootstrap/');
      if (!response.ok) return;
      const payload: BootstrapPayload = await response.json();
      if (payload.products?.length) setCatalogProducts(payload.products);
      if (payload.links)  setExternalLinks({ ...defaultLinks, ...payload.links });
      if (payload.reviews) setReviews(payload.reviews);
    } catch (error) {
      console.error('Не удалось загрузить bootstrap-данные', error);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me/');
      if (response.ok) setUser(await response.json());
    } catch { /* not authenticated */ }
  };

  useEffect(() => {
    void fetch('/api/csrf/');  // установить CSRF-cookie
    void loadBootstrap();
    void checkAuth();
  }, []);
```

Листинг Б.3 — Клиентская фильтрация каталога через useMemo

```typescript
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();

    let result = catalogProducts.filter((p) => {
      const matchesQuery =
        q.length === 0 ||
        `${p.name} ${p.subtitle}`.toLowerCase().includes(q);
      const matchesCategories =
        filters.categories.length === 0 ||
        filters.categories.includes(p.category);
      const matchesEras =
        filters.eras.length === 0 ||
        filters.eras.includes(p.era);
      const matchesMaterials =
        filters.materials.length === 0 ||
        filters.materials.includes(p.material);
      const matchesSizes =
        filters.sizes.length === 0 ||
        p.sizes.some((s) => filters.sizes.includes(s));
      const matchesStatuses =
        filters.statuses.length === 0 ||
        filters.statuses.includes(p.status);

      return (matchesQuery && matchesCategories && matchesEras
              && matchesMaterials && matchesSizes && matchesStatuses);
    });

    switch (sort) {
      case 'newest':
        result = result.sort((a, b) => {
          if (a.created_at && b.created_at)
            return (new Date(b.created_at).getTime()
                    - new Date(a.created_at).getTime());
          return Number(Boolean(b.created_at))
                 - Number(Boolean(a.created_at));
        });
        break;
      case 'popular':
        result = result.sort((a, b) => b.popularity - a.popularity);
        break;
      case 'duration':
        result = result.sort((a, b) =>
          a.leadTime.localeCompare(b.leadTime, 'ru'));
        break;
    }
    return result;
  }, [catalogProducts, filters, query, sort]);
```

### Б.3 Компонент карточки товара (src/components/ProductCard.tsx)

Листинг Б.4 — Компонент ProductCard

```typescript
import type { Product } from '../types';

interface Props {
  product:   Product;
  onSelect:  (product: Product) => void;
}

export function ProductCard({ product, onSelect }: Props) {
  const discount = product.setDiscounts?.[0];

  return (
    <article
      className="product-card"
      onClick={() => onSelect(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(product)}
    >
      <div className="product-card__image-wrapper">
        <img
          src={product.image}
          alt={product.name}
          className="product-card__image"
          loading="lazy"
        />
        {discount && (
          <span className="product-card__badge">
            −{discount.discount_percent}%
          </span>
        )}
        <span
          className={`product-card__status product-card__status--${
            product.status === 'В наличии' ? 'ready' : 'custom'
          }`}
        >
          {product.status}
        </span>
      </div>

      <div className="product-card__body">
        <p className="product-card__era">{product.era}</p>
        <h3 className="product-card__name">{product.name}</h3>
        {product.subtitle && (
          <p className="product-card__subtitle">{product.subtitle}</p>
        )}
        <p className="product-card__price">
          от {product.priceFrom.toLocaleString('ru-RU')} ₽
        </p>
      </div>
    </article>
  );
}
```

### Б.4 Тест интеграционный (workshop/tests/test_integration.py — фрагмент)

Листинг Б.5 — Тесты модуля допусков TaskApprovalIntegrationTests

```python
class TaskApprovalIntegrationTests(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.master = User.objects.create_user(
            username='master', password='pass', is_staff=True
        )
        cls.boss = User.objects.create_superuser(
            username='boss', password='pass'
        )
        cls.product = Product.objects.create(
            name='Топфхельм', slug='topfhelm',
            category='Шлемы', era='XIII век',
            material='Сталь', price_from=8000,
            lead_time='2 месяца', weight='2 кг',
            protection_class='Высокий',
            history='Шлем XIII века', status='В наличии',
        )
        cls.client_obj = Client.objects.create(name='Тест')
        cls.order = Order.objects.create(
            client_name='Тест',
            client=cls.client_obj,
            product=cls.product,
            product_name=cls.product.name,
        )
        cls.task = Task.objects.create(
            order=cls.order,
            product=cls.product,
            product_name=cls.product.name,
        )

    def test_master_without_approval_cannot_take_task(self):
        self.client.login(username='master', password='pass')
        response = self.client.patch(
            f'/api/workshop/tasks/{self.task.pk}/',
            data={'action': 'take'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 403)

    def test_master_with_approval_can_take_task(self):
        MasterApproval.objects.create(
            master=self.master, product=self.product
        )
        self.client.login(username='master', password='pass')
        response = self.client.patch(
            f'/api/workshop/tasks/{self.task.pk}/',
            data={'action': 'take'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, Task.Status.TAKEN)
        self.assertEqual(self.task.assigned_to, self.master)

    def test_superuser_can_take_task_without_approval(self):
        self.client.login(username='boss', password='pass')
        response = self.client.patch(
            f'/api/workshop/tasks/{self.task.pk}/',
            data={'action': 'take'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
```
