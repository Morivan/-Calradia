import { X } from 'lucide-react';

export function OrderModal({
  yandexFormUrl,
  onClose,
}: {
  yandexFormUrl: string;
  onClose: () => void;
}) {
  return (
    <div className="contact-overlay" role="dialog" aria-modal="true">
      <div className="contact-dialog order-form-dialog">
        <div className="contact-header">
          <div>
            <h3>Оформить заказ</h3>
            <p>Заполните форму — мы свяжемся с вами для уточнения деталей.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Закрыть">
            <X size={16} />
          </button>
        </div>
        <iframe src={yandexFormUrl} className="order-form-iframe" title="Форма заказа" />
      </div>
    </div>
  );
}
