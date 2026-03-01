/**
 * Unit tests for utility functions
 * 
 * Tests for:
 * - createPageUrl: URL slug generation from page names
 */

import { describe, it, expect } from 'vitest';
import { createPageUrl } from '../index';

describe('createPageUrl', () => {
  it('should convert page name to URL slug with dashes', () => {
    expect(createPageUrl('About Us')).toBe('/About-Us');
    expect(createPageUrl('Contact Page')).toBe('/Contact-Page');
  });

  it('should handle single word page names', () => {
    expect(createPageUrl('Home')).toBe('/Home');
    expect(createPageUrl('Blog')).toBe('/Blog');
  });

  it('should replace all spaces with dashes', () => {
    expect(createPageUrl('Terms of Service')).toBe('/Terms-of-Service');
    expect(createPageUrl('Privacy Policy Page')).toBe('/Privacy-Policy-Page');
  });

  it('should handle empty string', () => {
    expect(createPageUrl('')).toBe('/');
  });

  it('should handle page names with multiple consecutive spaces', () => {
    expect(createPageUrl('About  Us')).toBe('/About--Us');
  });

  it('should handle page names with special characters', () => {
    expect(createPageUrl('FAQ & Help')).toBe('/FAQ-&-Help');
    expect(createPageUrl('User Guide (PDF)')).toBe('/User-Guide-(PDF)');
  });
});
