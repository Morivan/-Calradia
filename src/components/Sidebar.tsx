import { useState } from 'react';
import { ChevronDown, ChevronUp, Hammer, Swords } from 'lucide-react';
import { sidebarSections } from '../data';

const icons: Record<string, React.ComponentType<{ size?: number }>> = {
  'Каталог доспехов': Swords,
  'Услуги мастерской': Hammer,
};

export function Sidebar() {
  const [open, setOpen] = useState<string[]>(['Каталог доспехов']);

  return (
    <aside className="sidebar secondary-card">
      {sidebarSections.map((section) => {
        const Icon = icons[section.title] ?? Swords;
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
