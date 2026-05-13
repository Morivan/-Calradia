import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { filterSections } from '../data';
import type { Filters } from '../types';

export function FiltersPanel({
  filters,
  onToggle,
  onReset,
}: {
  filters: Filters;
  onToggle: (section: keyof Filters, option: string) => void;
  onReset: () => void;
}) {
  const [expanded, setExpanded] = useState(filterSections.map((section) => section.title));

  return (
    <aside className="filters secondary-card">
      <div className="filters-head">
        <h3>Фильтры</h3>
        <button className="text-link" onClick={onReset}>
          Сбросить
        </button>
      </div>

      {filterSections.map((section) => {
        const isExpanded = expanded.includes(section.title);

        return (
          <section className="filter-section" key={section.title}>
            <button
              className="filter-trigger"
              onClick={() =>
                setExpanded((current) =>
                  current.includes(section.title)
                    ? current.filter((item) => item !== section.title)
                    : [...current, section.title],
                )
              }
            >
              <span>{section.title}</span>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isExpanded ? (
              <div className="filter-options">
                {section.options.map((option) => {
                  const selected = filters[section.key].includes(option);
                  return (
                    <label className="filter-option" key={option}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggle(section.key, option)}
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}

      <button className="cta-button cta-muted" onClick={onReset}>
        Очистить выбранное
      </button>
    </aside>
  );
}
