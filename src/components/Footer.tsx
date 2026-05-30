export function Footer({ onOpenPrivacy }: { onOpenPrivacy: () => void }) {
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
          <h4>Контакты</h4>
          <p>Email: master@kalradia.ru</p>
          <p>Пн-Пт: 09:00-18:00</p>
        </div>
        <div>
          <h4>Новости мастерской</h4>
          <p>Следите за обновлениями в нашем <a href="https://vk.com/calradia_band" target="_blank" rel="noreferrer">ВКонтакте</a>.</p>
        </div>
        <div>
          <h4>Документы</h4>
          <button
            onClick={onOpenPrivacy}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', fontSize: 'inherit', textAlign: 'left', display: 'block', marginBottom: 10 }}
          >
            Политика конфиденциальности
          </button>
        </div>
      </div>
    </footer>
  );
}
