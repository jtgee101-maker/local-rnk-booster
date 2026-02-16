import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SkeletonCard from './SkeletonCard';

// Mock the Card component
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
}));

describe('SkeletonCard', () => {
  it('renders with default variant', () => {
    const { container } = render(<SkeletonCard />);
    expect(container).toBeTruthy();
  });

  it('renders Card component with correct classes', () => {
    const { getByTestId } = render(<SkeletonCard />);
    const card = getByTestId('card');
    expect(card).toHaveClass('bg-gray-900');
    expect(card).toHaveClass('border-gray-800');
    expect(card).toHaveClass('p-6');
  });

  it('renders default variant with skeleton elements', () => {
    const { container } = render(<SkeletonCard />);
    
    // Check for animate-pulse class
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
    
    // Check for skeleton background color
    const skeletonElements = container.querySelectorAll('.bg-gray-800');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('renders default variant with title and content placeholders', () => {
    const { container } = render(<SkeletonCard />);
    
    // Should have title placeholder (larger)
    const titlePlaceholder = container.querySelector('.h-6');
    expect(titlePlaceholder).toBeTruthy();
    
    // Should have content placeholders
    const contentPlaceholders = container.querySelectorAll('.h-4');
    expect(contentPlaceholders.length).toBeGreaterThan(0);
  });

  it('renders testimonial variant', () => {
    const { container } = render(<SkeletonCard variant="testimonial" />);
    expect(container).toBeTruthy();
  });

  it('renders testimonial variant with avatar placeholder', () => {
    const { container } = render(<SkeletonCard variant="testimonial" />);
    
    // Check for avatar placeholder (rounded-full)
    const avatarPlaceholder = container.querySelector('.rounded-full');
    expect(avatarPlaceholder).toBeTruthy();
    
    // Avatar should have specific dimensions
    expect(avatarPlaceholder).toHaveClass('w-12');
    expect(avatarPlaceholder).toHaveClass('h-12');
  });

  it('renders testimonial variant with name and title placeholders', () => {
    const { container } = render(<SkeletonCard variant="testimonial" />);
    
    // Should have name placeholder (h-4)
    const namePlaceholders = container.querySelectorAll('.h-4');
    expect(namePlaceholders.length).toBeGreaterThan(0);
    
    // Should have title placeholder (h-3)
    const titlePlaceholders = container.querySelectorAll('.h-3');
    expect(titlePlaceholders.length).toBeGreaterThan(0);
  });

  it('renders testimonial variant with content placeholders', () => {
    const { container } = render(<SkeletonCard variant="testimonial" />);
    
    // Should have multiple content line placeholders
    const contentPlaceholders = container.querySelectorAll('.h-3');
    expect(contentPlaceholders.length).toBeGreaterThanOrEqual(3);
  });

  it('renders metric variant', () => {
    const { container } = render(<SkeletonCard variant="metric" />);
    expect(container).toBeTruthy();
  });

  it('renders metric variant with header and icon placeholder', () => {
    const { container } = render(<SkeletonCard variant="metric" />);
    
    // Should have header placeholder
    const headerPlaceholder = container.querySelector('.h-5');
    expect(headerPlaceholder).toBeTruthy();
    
    // Should have icon placeholder (rounded-lg)
    const iconPlaceholder = container.querySelector('.rounded-lg');
    expect(iconPlaceholder).toBeTruthy();
  });

  it('renders metric variant with value placeholder', () => {
    const { container } = render(<SkeletonCard variant="metric" />);
    
    // Should have large value placeholder (h-8)
    const valuePlaceholder = container.querySelector('.h-8');
    expect(valuePlaceholder).toBeTruthy();
  });

  it('renders metric variant with description placeholder', () => {
    const { container } = render(<SkeletonCard variant="metric" />);
    
    // Should have description placeholder (h-3)
    const descPlaceholder = container.querySelector('.h-3');
    expect(descPlaceholder).toBeTruthy();
  });

  it('applies animate-pulse to all variants', () => {
    const { container: defaultContainer } = render(<SkeletonCard />);
    const { container: testimonialContainer } = render(<SkeletonCard variant="testimonial" />);
    const { container: metricContainer } = render(<SkeletonCard variant="metric" />);
    
    // All variants should have animate-pulse
    expect(defaultContainer.querySelector('.animate-pulse')).toBeTruthy();
    expect(testimonialContainer.querySelector('.animate-pulse')).toBeTruthy();
    expect(metricContainer.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('uses correct background color for skeleton elements', () => {
    const { container } = render(<SkeletonCard />);
    
    const skeletonElements = container.querySelectorAll('.bg-gray-800');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('renders default variant with correct width classes', () => {
    const { container } = render(<SkeletonCard />);
    
    // Title should have 3/4 width
    const titleElement = container.querySelector('.w-3\\/4');
    expect(titleElement).toBeTruthy();
    
    // Content should have full width
    const fullWidthElements = container.querySelectorAll('.w-full');
    expect(fullWidthElements.length).toBeGreaterThan(0);
  });

  it('renders testimonial variant with correct structure', () => {
    const { container } = render(<SkeletonCard variant="testimonial" />);
    
    // Should have flex layout for header
    const flexElements = container.querySelectorAll('.flex');
    expect(flexElements.length).toBeGreaterThan(0);
    
    // Should have gap for spacing
    const gapElements = container.querySelectorAll('.gap-4');
    expect(gapElements.length).toBeGreaterThan(0);
  });

  it('renders metric variant with flex layout', () => {
    const { container } = render(<SkeletonCard variant="metric" />);
    
    // Should have flex layout for header
    const flexElements = container.querySelectorAll('.flex');
    expect(flexElements.length).toBeGreaterThan(0);
    
    // Should have justify-between for header alignment
    const justifyElements = container.querySelectorAll('.justify-between');
    expect(justifyElements.length).toBeGreaterThan(0);
  });
});
