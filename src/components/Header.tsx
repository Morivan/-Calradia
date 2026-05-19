import { useState } from 'react';
import { ArrowLeft, LogIn, LogOut, Menu, Search, X } from 'lucide-react';
import type { AuthUser, ViewMode } from '../types';

export function Header({
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
            <img src="/club-emblem.png" alt="" className="topbar-emblem" />
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
            <a href="#services">Услуги мастерской</a>
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

          <button className="icon-button mobile-only" onClick={() => setMenuOpen((v) => !v)} aria-label="Открыть меню">
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
