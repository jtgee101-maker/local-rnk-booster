import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import SEOHead from './SEOHead';

// Mock react-helmet
vi.mock('react-helmet', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('SEOHead', () => {
  const defaultProps = {
    title: 'Test Title',
    description: 'Test Description',
    image: 'https://example.com/image.jpg',
    url: 'https://example.com/page',
    type: 'website',
  };

  it('renders with default props', () => {
    const { container } = render(<SEOHead {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('renders title tag', () => {
    const { container } = render(<SEOHead {...defaultProps} />);
    const title = container.querySelector('title');
    expect(title).toBeTruthy();
    expect(title?.textContent).toBe('Test Title');
  });

  it('renders meta title', () => {
    const { container } = render(<SEOHead {...defaultProps} />);
    const metaTitle = container.querySelector('meta[name="title"]');
    expect(metaTitle).toBeTruthy();
    expect(metaTitle?.getAttribute('content')).toBe('Test Title');
  });

  it('renders meta description', () => {
    const { container } = render(<SEOHead {...defaultProps} />);
    const metaDescription = container.querySelector('meta[name="description"]');
    expect(metaDescription).toBeTruthy();
    expect(metaDescription?.getAttribute('content')).toBe('Test Description');
  });

  it('renders canonical link', () => {
    const { container } = render(<SEOHead {...defaultProps} />);
    const canonical = container.querySelector('link[rel="canonical"]');
    expect(canonical).toBeTruthy();
    expect(canonical?.getAttribute('href')).toBe('https://example.com/page');
  });

  it('renders Open Graph meta tags', () => {
    const { container } = render(<SEOHead {...defaultProps} />);
    
    const ogType = container.querySelector('meta[property="og:type"]');
    expect(ogType).toBeTruthy();
    expect(ogType?.getAttribute('content')).toBe('website');

    const ogUrl = container.querySelector('meta[property="og:url"]');
    expect(ogUrl).toBeTruthy();
    expect(ogUrl?.getAttribute('content')).toBe('https://example.com/page');

    const ogTitle = container.querySelector('meta[property="og:title"]');
    expect(ogTitle).toBeTruthy();
    expect(ogTitle?.getAttribute('content')).toBe('Test Title');

    const ogDescription = container.querySelector('meta[property="og:description"]');
    expect(ogDescription).toBeTruthy();
    expect(ogDescription?.getAttribute('content')).toBe('Test Description');

    const ogImage = container.querySelector('meta[property="og:image"]');
    expect(ogImage).toBeTruthy();
    expect(ogImage?.getAttribute('content')).toBe('https://example.com/image.jpg');
  });

  it('renders Twitter meta tags', () => {
    const { container } = render(<SEOHead {...defaultProps} />);
    
    const twitterCard = container.querySelector('meta[property="twitter:card"]');
    expect(twitterCard).toBeTruthy();
    expect(twitterCard?.getAttribute('content')).toBe('summary_large_image');

    const twitterUrl = container.querySelector('meta[property="twitter:url"]');
    expect(twitterUrl).toBeTruthy();
    expect(twitterUrl?.getAttribute('content')).toBe('https://example.com/page');

    const twitterTitle = container.querySelector('meta[property="twitter:title"]');
    expect(twitterTitle).toBeTruthy();
    expect(twitterTitle?.getAttribute('content')).toBe('Test Title');

    const twitterDescription = container.querySelector('meta[property="twitter:description"]');
    expect(twitterDescription).toBeTruthy();
    expect(twitterDescription?.getAttribute('content')).toBe('Test Description');

    const twitterImage = container.querySelector('meta[property="twitter:image"]');
    expect(twitterImage).toBeTruthy();
    expect(twitterImage?.getAttribute('content')).toBe('https://example.com/image.jpg');
  });

  it('renders viewport meta tag', () => {
    const { container } = render(<SEOHead {...defaultProps} />);
    const viewport = container.querySelector('meta[name="viewport"]');
    expect(viewport).toBeTruthy();
    expect(viewport?.getAttribute('content')).toBe('width=device-width, initial-scale=1, maximum-scale=5');
  });

  it('renders theme-color meta tag', () => {
    const { container } = render(<SEOHead {...defaultProps} />);
    const themeColor = container.querySelector('meta[name="theme-color"]');
    expect(themeColor).toBeTruthy();
    expect(themeColor?.getAttribute('content')).toBe('#c8ff00');
  });

  it('renders noindex meta tag when noindex is true', () => {
    const { container } = render(<SEOHead {...defaultProps} noindex={true} />);
    const robots = container.querySelector('meta[name="robots"]');
    expect(robots).toBeTruthy();
    expect(robots?.getAttribute('content')).toBe('noindex, nofollow');
  });

  it('does not render noindex meta tag when noindex is false', () => {
    const { container } = render(<SEOHead {...defaultProps} noindex={false} />);
    const robots = container.querySelector('meta[name="robots"]');
    expect(robots).toBeFalsy();
  });

  it('uses default values when props are not provided', () => {
    const { container } = render(<SEOHead />);
    
    const title = container.querySelector('title');
    expect(title?.textContent).toContain('LocalRank.ai');

    const description = container.querySelector('meta[name="description"]');
    expect(description?.getAttribute('content')).toContain('AI-Powered Local SEO Audit');
  });

  it('renders with custom type', () => {
    const { container } = render(<SEOHead {...defaultProps} type="article" />);
    const ogType = container.querySelector('meta[property="og:type"]');
    expect(ogType?.getAttribute('content')).toBe('article');
  });

  it('does not render canonical link when url is empty', () => {
    const { container } = render(<SEOHead {...defaultProps} url="" />);
    const canonical = container.querySelector('link[rel="canonical"]');
    expect(canonical).toBeFalsy();
  });
});
