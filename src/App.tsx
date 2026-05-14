import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { apiFetch, defaultLinks } from './api';
import { fallbackProducts, fallbackReviews } from './data';
import { AdminModule } from './components/AdminModule';
import { FiltersPanel } from './components/FiltersPanel';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { ProductCard } from './components/ProductCard';
import { ProductDetail } from './components/ProductDetail';
import { Sidebar } from './components/Sidebar';
import { SortControl } from './components/SortControl';
import type { AuthUser, BootstrapPayload, ExternalLinks, Filters, Product, Review, SortMode, ViewMode } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('catalog');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('default');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(fallbackProducts);
  const [externalLinks, setExternalLinks] = useState<ExternalLinks>(defaultLinks);
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    eras: [],
    materials: [],
    sizes: [],
    statuses: [],
  });
  const [reviewsByProduct, setReviewsByProduct] = useState<Record<string, Review[]>>(fallbackReviews);
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
    void fetch('/api/csrf/');
    void loadBootstrap();
    void checkAuth();
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    const updated = catalogProducts.find((p) => p.id === selectedProduct.id);
    if (updated) setSelectedProduct(updated);
  }, [catalogProducts, selectedProduct]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = catalogProducts.filter((p) => {
      const matchesQuery = q.length === 0 || `${p.name} ${p.subtitle}`.toLowerCase().includes(q);
      const matchesCategories = filters.categories.length === 0 || filters.categories.includes(p.category);
      const matchesEras = filters.eras.length === 0 || filters.eras.includes(p.era);
      const matchesMaterials = filters.materials.length === 0 || filters.materials.includes(p.material);
      const matchesSizes = filters.sizes.length === 0 || p.sizes.some((s) => filters.sizes.includes(s));
      const matchesStatuses = filters.statuses.length === 0 || filters.statuses.includes(p.status);
      return matchesQuery && matchesCategories && matchesEras && matchesMaterials && matchesSizes && matchesStatuses;
    });

    switch (sort) {
      case 'newest':
        result = result.sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return Number(Boolean(b.created_at)) - Number(Boolean(a.created_at));
        });
        break;
      case 'popular':
        result = result.sort((a, b) => b.popularity - a.popularity);
        break;
      case 'duration':
        result = result.sort((a, b) => a.leadTime.localeCompare(b.leadTime, 'ru'));
        break;
    }

    return result;
  }, [catalogProducts, filters, query, sort]);

  const activeFilterCount =
    filters.categories.length + filters.eras.length + filters.materials.length +
    filters.sizes.length + filters.statuses.length;

  const toggleFilter = (section: keyof Filters, option: string) => {
    setFilters((current) => {
      const list = current[section];
      const next = list.includes(option) ? list.filter((item) => item !== option) : [...list, option];
      return { ...current, [section]: next };
    });
  };

  const resetFilters = () =>
    setFilters({ categories: [], eras: [], materials: [], sizes: [], statuses: [] });

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
      await apiFetch(`/api/catalog/products/${productId}/reviews/`, {
        method: 'POST',
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
    await apiFetch('/api/auth/logout/', { method: 'POST' });
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
            links={externalLinks}
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
