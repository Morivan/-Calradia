import { Mail } from 'lucide-react';

export function Footer() {
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
