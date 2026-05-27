import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortControl } from './SortControl';

describe('SortControl', () => {
  it('renders with current sort value selected', () => {
    render(<SortControl sort="popular" onChange={vi.fn()} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('popular');
  });

  it('calls onChange when user picks a new option', async () => {
    const onChange = vi.fn();
    render(<SortControl sort="default" onChange={onChange} />);
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'newest');
    expect(onChange).toHaveBeenCalledWith('newest');
  });

  it('renders all sort options', () => {
    render(<SortControl sort="default" onChange={vi.fn()} />);
    const options = screen.getAllByRole('option');
    // default + newest + popular + duration
    expect(options.length).toBeGreaterThanOrEqual(4);
  });
});
