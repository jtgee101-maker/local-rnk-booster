import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TrustBadges from './TrustBadges';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Shield: () => <span data-testid="shield-icon">Shield</span>,
  Zap: () => <span data-testid="zap-icon">Zap</span>,
  Award: () => <span data-testid="award-icon">Award</span>,
  Users: () => <span data-testid="users-icon">Users</span>,
  Star: () => <span data-testid="star-icon">Star</span>,
  Lock: () => <span data-testid="lock-icon">Lock</span>,
}));

describe('TrustBadges', () => {
  it('renders with default horizontal variant', () => {
    render(<TrustBadges />);
    expect(screen.getByText('SSL Secure')).toBeInTheDocument();
    expect(screen.getByText('60 Sec Results')).toBeInTheDocument();
    expect(screen.getByText('Trusted by 5000+')).toBeInTheDocument();
    expect(screen.getByText('No Credit Card')).toBeInTheDocument();
  });

  it('renders 4 badges by default (showAll=false)', () => {
    render(<TrustBadges />);
    
    // Should show first 4 badges
    expect(screen.getByText('SSL Secure')).toBeInTheDocument();
    expect(screen.getByText('60 Sec Results')).toBeInTheDocument();
    expect(screen.getByText('Trusted by 5000+')).toBeInTheDocument();
    expect(screen.getByText('No Credit Card')).toBeInTheDocument();
    
    // Should NOT show last 2 badges
    expect(screen.queryByText('4.9/5 Rating')).not.toBeInTheDocument();
    expect(screen.queryByText('GDPR Compliant')).not.toBeInTheDocument();
  });

  it('renders all 6 badges when showAll is true', () => {
    render(<TrustBadges showAll={true} />);
    
    // Should show all badges
    expect(screen.getByText('SSL Secure')).toBeInTheDocument();
    expect(screen.getByText('60 Sec Results')).toBeInTheDocument();
    expect(screen.getByText('Trusted by 5000+')).toBeInTheDocument();
    expect(screen.getByText('No Credit Card')).toBeInTheDocument();
    expect(screen.getByText('4.9/5 Rating')).toBeInTheDocument();
    expect(screen.getByText('GDPR Compliant')).toBeInTheDocument();
  });

  it('renders with horizontal variant (default)', () => {
    const { container } = render(<TrustBadges />);
    
    // Check for horizontal layout classes
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('flex-wrap');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('justify-center');
  });

  it('renders with grid variant', () => {
    const { container } = render(<TrustBadges variant="grid" />);
    
    // Check for grid layout classes
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('grid');
    expect(wrapper).toHaveClass('grid-cols-2');
  });

  it('renders badges with correct icons in horizontal layout', () => {
    render(<TrustBadges />);
    
    // Each badge should have an icon
    const badges = screen.getAllByText(/SSL Secure|60 Sec Results|Trusted by|No Credit Card/);
    expect(badges.length).toBe(4);
  });

  it('renders badges with correct styling in horizontal layout', () => {
    const { container } = render(<TrustBadges />);
    
    // Check for pill/badge styling
    const badgeElements = container.querySelectorAll('.rounded-full');
    expect(badgeElements.length).toBeGreaterThan(0);
  });

  it('renders badges with correct styling in grid layout', () => {
    const { container } = render(<TrustBadges variant="grid" />);
    
    // Check for card styling in grid
    const cardElements = container.querySelectorAll('.rounded-lg');
    expect(cardElements.length).toBe(4); // 4 default badges
  });

  it('renders each badge with correct color classes in horizontal layout', () => {
    const { container } = render(<TrustBadges />);
    
    // Check for color classes on icons
    const colorClasses = ['text-green-400', 'text-blue-400', 'text-purple-400', 'text-orange-400'];
    colorClasses.forEach(colorClass => {
      const elements = container.querySelectorAll(`.${colorClass}`);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('renders each badge with correct color classes in grid layout', () => {
    const { container } = render(<TrustBadges variant="grid" />);
    
    // Check for color classes on icons
    const colorClasses = ['text-green-400', 'text-blue-400', 'text-purple-400', 'text-orange-400'];
    colorClasses.forEach(colorClass => {
      const elements = container.querySelectorAll(`.${colorClass}`);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('applies hover effects in grid variant', () => {
    const { container } = render(<TrustBadges variant="grid" />);
    
    // Check for hover transition classes
    const hoverElements = container.querySelectorAll('.hover\\:border-\[\\#c8ff00\\]\\/30');
    expect(hoverElements.length).toBeGreaterThan(0);
  });

  it('renders with proper backdrop blur in horizontal layout', () => {
    const { container } = render(<TrustBadges />);
    
    const backdropElements = container.querySelectorAll('.backdrop-blur-sm');
    expect(backdropElements.length).toBeGreaterThan(0);
  });

  it('renders with proper backdrop blur in grid layout', () => {
    const { container } = render(<TrustBadges variant="grid" />);
    
    const backdropElements = container.querySelectorAll('.backdrop-blur-sm');
    expect(backdropElements.length).toBeGreaterThan(0);
  });
});
