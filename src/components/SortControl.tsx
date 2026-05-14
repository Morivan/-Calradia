import { sortOptions } from '../data';
import type { SortMode } from '../types';

export function SortControl({
  sort,
  onChange,
}: {
  sort: SortMode;
  onChange: (value: SortMode) => void;
}) {
  return (
    <label className="sortbox">
      <span>Сортировка</span>
      <select value={sort} onChange={(event) => onChange(event.target.value as SortMode)}>
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
