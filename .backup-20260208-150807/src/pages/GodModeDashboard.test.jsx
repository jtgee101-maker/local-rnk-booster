import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GodModeDashboard from '@/pages/GodModeDashboard';

describe('GodModeDashboard', () => {
  it('renders without crashing', () => {
    render(<GodModeDashboard />);
    expect(screen.getByText(/God Mode/i)).toBeInTheDocument();
  });

  it('displays tenant stats', () => {
    render(<GodModeDashboard />);
    expect(screen.getByText(/Total Tenants/i)).toBeInTheDocument();
  });

  it('has working tabs', () => {
    render(<GodModeDashboard />);
    expect(screen.getByText(/Tenants/i)).toBeInTheDocument();
    expect(screen.getByText(/Features/i)).toBeInTheDocument();
    expect(screen.getByText(/Resources/i)).toBeInTheDocument();
    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
  });
});
