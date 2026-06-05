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
          <p style={{ marginBottom: 8 }}>Следите за обновлениями и новыми работами:</p>
          <a
            href="https://vk.com/calradia_band"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 16px',
              background: 'rgba(74,133,200,0.18)',
              border: '1px solid rgba(74,133,200,0.35)',
              borderRadius: 8,
              color: '#6baee8',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            ВКонтакте →
          </a>
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
