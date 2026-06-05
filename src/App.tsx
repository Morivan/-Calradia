import { useEffect, useMemo, useRef, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { apiFetch, defaultLinks } from './api';
import { fallbackProducts } from './data';
import { AdminModule } from './components/AdminModule';
import { FiltersPanel } from './components/FiltersPanel';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { PrivacyPage } from './components/PrivacyPage';
import { ProductCard } from './components/ProductCard';
import { ProductDetail } from './components/ProductDetail';
import { ReviewsPage } from './components/ReviewsPage';
import { ServicesPage } from './components/ServicesPage';
import { SetsPage } from './components/SetsPage';
import { VKGroupFeed } from './components/VKGroupFeed';
import type { AuthUser, BootstrapPayload, ExternalLinks, Filters, Product, Review, ViewMode } from './types';


export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [query, setQuery] = useState('');
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [openSetSlug, setOpenSetSlug] = useState<string | undefined>(undefined);
  const historyReady = useRef(false);

  const loadBootstrap = async () => {
    try {
      const response = await fetch('/api/bootstrap/');
      if (!response.ok) return;
      const payload: BootstrapPayload = await response.json();
      if (payload.products?.length) {
        setCatalogProducts(payload.products);
      }
      if (payload.links) {
        setExternalLinks({ ...defaultLinks, ...payload.links });
      }
      if (payload.reviews) {
        setReviews(payload.reviews);
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
    window.history.replaceState({ view: 'home', productId: null, setSlug: null }, '');
    historyReady.current = true;
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    const updated = catalogProducts.find((p) => p.id === selectedProduct.id);
    if (updated) setSelectedProduct(updated);
  }, [catalogProducts, selectedProduct]);

  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      const s = e.state as { view?: ViewMode; productId?: string | null; setSlug?: string | null } | null;
      setMobileFiltersOpen(false);
      window.scrollTo({ top: 0 });
      if (!s) { setCurrentView('home'); setSelectedProduct(null); setOpenSetSlug(undefined); return; }
      setCurrentView(s.view ?? 'home');
      setOpenSetSlug(s.setSlug ?? undefined);
      if (s.productId) {
        setSelectedProduct(catalogProducts.find((p) => p.id === s.productId) ?? null);
      } else {
        setSelectedProduct(null);
      }
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [catalogProducts]);

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

    return result;
  }, [catalogProducts, filters, query]);

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

  const pushNav = (view: ViewMode, productId: string | null = null, setSlug: string | null = null) => {
    if (historyReady.current) {
      window.history.pushState({ view, productId, setSlug }, '');
    }
  };

  const openProduct = (product: Product) => {
    pushNav('catalog', product.id);
    setCurrentView('catalog');
    setSelectedProduct(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProductBySlug = (slug: string) => {
    const p = catalogProducts.find(x => x.slug === slug);
    if (p) openProduct(p);
  };

  const goHome = () => {
    pushNav('home');
    setCurrentView('home');
    setSelectedProduct(null);
    setMobileFiltersOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goCatalog = () => {
    pushNav('catalog');
    setCurrentView('catalog');
    setSelectedProduct(null);
    setMobileFiltersOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openServices = () => {
    pushNav('services');
    setCurrentView('services');
    setSelectedProduct(null);
    setMobileFiltersOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openPrivacy = () => {
    pushNav('privacy');
    setCurrentView('privacy');
    setSelectedProduct(null);
    setMobileFiltersOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openSets = () => {
    pushNav('sets');
    setOpenSetSlug(undefined);
    setCurrentView('sets');
    setSelectedProduct(null);
    setMobileFiltersOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openSetBySlug = (slug: string) => {
    pushNav('sets', null, slug);
    setOpenSetSlug(slug);
    setCurrentView('sets');
    setSelectedProduct(null);
    setMobileFiltersOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openReviews = () => {
    pushNav('reviews');
    setCurrentView('reviews');
    setSelectedProduct(null);
    setMobileFiltersOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAdmin = () => {
    pushNav('admin');
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
        onOpenCatalog={goCatalog}
        onOpenSets={openSets}
        onOpenServices={openServices}
        onOpenReviews={openReviews}
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
        ) : currentView === 'privacy' ? (
          <PrivacyPage onBack={goHome} />
        ) : currentView === 'services' ? (
          <ServicesPage onBack={goHome} links={externalLinks} />
        ) : currentView === 'sets' ? (
          <SetsPage onBack={goHome} links={externalLinks} initialSlug={openSetSlug} onOpenProduct={openProductBySlug} />
        ) : currentView === 'reviews' ? (
          <ReviewsPage reviews={reviews} onBack={goHome} />
        ) : currentView === 'home' && !selectedProduct ? (
          <HomePage
            onOpenCatalog={goCatalog}
            onOpenSets={openSets}
            onOpenServices={openServices}
            onOpenReviews={openReviews}
            onOpenProduct={openProduct}
            featuredProducts={catalogProducts}
          />
        ) : selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            onBack={goCatalog}
            links={externalLinks}
            onOpenSet={openSetBySlug}
          />
        ) : (
          <section className="catalog-layout" id="catalog collections">
            <div className="catalog-side-column">
              <div className="desktop-only catalog-side-stack">
                <div className="catalog-side-meta">
                  <p className="catalog-count">Изделий: {filteredProducts.length}</p>
                </div>
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

            <VKGroupFeed />
          </section>
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

      <Footer onOpenPrivacy={openPrivacy} />
    </div>
  );
}
