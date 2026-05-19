import { workshopServices } from '../data';

export function WorkshopServices() {
  return (
    <section className="workshop-services" id="services">
      <h2 className="services-heading">Услуги мастерской</h2>
      <div className="services-grid">
        {workshopServices.map((service) => (
          <article className="service-card" key={service.id}>
            <div className="service-image-wrap">
              <img src={service.image} alt={service.title} className="service-image" />
            </div>
            <div className="service-body">
              <h3 className="service-title">{service.title}</h3>
              <p className="service-text">{service.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
