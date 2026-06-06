import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FiltersPanel } from './FiltersPanel';
import type { Filters } from '../types';

const emptyFilters: Filters = {
  categories: [],
  eras: [],
  materials: [],
  sizes: [],
  statuses: [],
};

describe('FiltersPanel', () => {
  it('calls onReset when reset button is clicked', async () => {
    const onReset = vi.fn();
    render(<FiltersPanel filters={emptyFilters} onToggle={vi.fn()} onReset={onReset} />);
    await userEvent.click(screen.getByText('Сбросить'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('expands a section when its header is clicked', async () => {
    render(<FiltersPanel filters={emptyFilters} onToggle={vi.fn()} onReset={vi.fn()} />);
    const sectionBtn = screen.getAllByRole('button')[1]; // first filter section header
    await userEvent.click(sectionBtn);
    // After click, options should become visible
    const checkboxes = screen.queryAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('calls onToggle when a filter option is clicked', async () => {
    const onToggle = vi.fn();
    render(<FiltersPanel filters={emptyFilters} onToggle={onToggle} onReset={vi.fn()} />);
    // Expand the first section
    const sectionBtn = screen.getAllByRole('button')[1];
    await userEvent.click(sectionBtn);
    // Click the first checkbox option
    const checkbox = screen.getAllByRole('checkbox')[0];
    await userEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalled();
  });
});
