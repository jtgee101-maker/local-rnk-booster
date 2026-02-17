import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GuideQuizGeenius from './GuideQuizGeenius';

// Mock base44 API
const mockCreate = vi.fn();
const mockFilter = vi.fn();
const mockGet = vi.fn();

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      GuideLead: {
        create: (...args) => mockCreate(...args),
        filter: (...args) => mockFilter(...args),
        get: (...args) => mockGet(...args),
      },
      ConversionEvent: {
        create: (...args) => mockCreate(...args),
      },
    },
  },
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: { href: '', search: '' },
});

// Mock components
vi.mock('@/components/shared/SEOHead', () => ({
  default: ({ title }) => <title>{title}</title>,
}));

vi.mock('@/components/geenius/GeeniusErrorBoundary', () => ({
  default: ({ children }) => <div data-testid="error-boundary">{children}</div>,
}));

// Mock guide components
vi.mock('@/components/guide/BusinessInfoStep', () => ({
  default: ({ onNext }) => (
    <div data-testid="business-info-step">
      <h2>Business Information</h2>
      <button onClick={() => onNext({ 
        business_name: 'Test Business',
        business_category: 'retail',
        address: '123 Test St',
      })}>Next</button>
    </div>
  ),
}));

vi.mock('@/components/guide/CurrentPresenceStep', () => ({
  default: ({ onNext, onBack }) => (
    <div data-testid="presence-step">
      <h2>Current Online Presence</h2>
      <button onClick={() => onNext({ 
        has_website: true,
        has_gmb: true,
        gmb_rating: 4.2,
        gmb_reviews_count: 50,
      })}>Next</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/components/guide/GoalsStep', () => ({
  default: ({ onNext, onBack }) => (
    <div data-testid="goals-step">
      <h2>Your Goals</h2>
      <button onClick={() => onNext({ 
        primary_goal: 'more_customers',
        timeline: '3_months',
        budget_range: '1000-5000',
      })}>Next</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/components/guide/ChallengesStep', () => ({
  default: ({ onNext, onBack }) => (
    <div data-testid="challenges-step">
      <h2>Current Challenges</h2>
      <button onClick={() => onNext({ 
        challenges: ['low_visibility', 'bad_reviews'],
        pain_points: ['not_enough_calls', 'competitors_ranking_higher'],
      })}>Next</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/components/guide/ContactStep', () => ({
  default: ({ onNext, onBack }) => (
    <div data-testid="contact-step">
      <h2>Contact Information</h2>
      <button onClick={() => onNext({ 
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        preferred_contact: 'email',
      })}>Get My Guide</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/components/guide/GuideResults', () => ({
  default: ({ lead }) => (
    <div data-testid="guide-results">
      <h2>Your Custom Guide</h2>
      <p>Business: {lead?.business_name}</p>
    </div>
  ),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Sparkles: () => <span>✨</span>,
  BookOpen: () => <span>📖</span>,
  ChevronRight: () => <span>›</span>,
  ChevronLeft: () => <span>‹</span>,
  CheckCircle: () => <span>✓</span>,
  Download: () => <span>📥</span>,
  Mail: () => <span>📧</span>,
  Phone: () => <span>📞</span>,
  MapPin: () => <span>📍</span>,
  Star: () => <span>⭐</span>,
  TrendingUp: () => <span>📈</span>,
  Users: () => <span>👥</span>,
  Target: () => <span>🎯</span>,
  Clock: () => <span>⏰</span>,
  Award: () => <span>🏆</span>,
}));

// Mock Progress component
vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }) => <div data-testid="progress-bar" data-value={value}>{value}%</div>,
}));

// Mock Button
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

// Mock Card components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardContent: ({ children }) => <div>{children}</div>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardTitle: ({ children }) => <h3>{children}</h3>,
  CardDescription: ({ children }) => <p>{children}</p>,
}));

describe('GuideQuizGeenius', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = '';
    window.location.search = '';
  });

  it('renders guide quiz header', () => {
    render(
      <MemoryRouter>
        <GuideQuizGeenius />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/local business growth guide/i)).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
  });

  it('starts with business info step', () => {
    render(
      <MemoryRouter>
        <GuideQuizGeenius />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('business-info-step')).toBeInTheDocument();
    expect(screen.getByText(/business information/i)).toBeInTheDocument();
  });

  it('advances through guide steps', async () => {
    render(
      <MemoryRouter>
        <GuideQuizGeenius />
      </MemoryRouter>
    );
    
    const steps = [
      'business-info-step',
      'presence-step',
      'goals-step',
      'challenges-step',
      'contact-step',
    ];
    
    for (let i = 0; i < steps.length; i++) {
      expect(screen.getByTestId(steps[i])).toBeInTheDocument();
      
      const nextButton = screen.getByRole('button', { name: /next|get my guide/i });
      fireEvent.click(nextButton);
      
      if (i < steps.length - 1) {
        await waitFor(() => {
          expect(screen.getByTestId(steps[i + 1])).toBeInTheDocument();
        });
      }
    }
  });

  it('allows going back to previous steps', async () => {
    render(
      <MemoryRouter>
        <GuideQuizGeenius />
      </MemoryRouter>
    );
    
    // Advance to step 2
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByTestId('presence-step')).toBeInTheDocument();
    });
    
    // Go back
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    await waitFor(() => {
      expect(screen.getByTestId('business-info-step')).toBeInTheDocument();
    });
  });

  it('creates guide lead on completion', async () => {
    mockCreate.mockResolvedValue({ id: 'guide_lead_123' });
    
    render(
      <MemoryRouter>
        <GuideQuizGeenius />
      </MemoryRouter>
    );
    
    // Navigate through all steps
    for (let i = 0; i < 5; i++) {
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(b => 
        b.textContent.toLowerCase().includes('next') ||
        b.textContent.toLowerCase().includes('get my guide')
      );
      fireEvent.click(nextButton);
      await waitFor(() => {}, { timeout: 50 });
    }
    
    // Verify lead creation
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          business_name: 'Test Business',
          email: 'john@example.com',
          name: 'John Doe',
          guide_type: 'growth_strategy',
        })
      );
    });
  });

  it('shows guide results after completion', async () => {
    mockCreate.mockResolvedValue({ 
      id: 'guide_lead_123',
      business_name: 'Test Business',
    });
    
    render(
      <MemoryRouter>
        <GuideQuizGeenius />
      </MemoryRouter>
    );
    
    // Navigate through all steps
    for (let i = 0; i < 5; i++) {
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(b => 
        b.textContent.toLowerCase().includes('next') ||
        b.textContent.toLowerCase().includes('get my guide')
      );
      fireEvent.click(nextButton);
      await waitFor(() => {}, { timeout: 50 });
    }
    
    await waitFor(() => {
      expect(screen.getByTestId('guide-results')).toBeInTheDocument();
      expect(screen.getByText(/your custom guide/i)).toBeInTheDocument();
    });
  });

  it('handles lead creation errors', async () => {
    mockCreate.mockRejectedValue(new Error('Database error'));
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(
      <MemoryRouter>
        <GuideQuizGeenius />
      </MemoryRouter>
    );
    
    // Navigate through all steps
    for (let i = 0; i < 5; i++) {
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(b => 
        b.textContent.toLowerCase().includes('next') ||
        b.textContent.toLowerCase().includes('get my guide')
      );
      fireEvent.click(nextButton);
      await waitFor(() => {}, { timeout: 50 });
    }
    
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('error'));
    });
    
    alertMock.mockRestore();
  });

  it('tracks guide download events', async () => {
    mockCreate.mockResolvedValue({ id: 'guide_lead_123' });
    
    render(
      <MemoryRouter>
        <GuideQuizGeenius />
      </MemoryRouter>
    );
    
    // Navigate through all steps
    for (let i = 0; i < 5; i++) {
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(b => 
        b.textContent.toLowerCase().includes('next') ||
        b.textContent.toLowerCase().includes('get my guide')
      );
      fireEvent.click(nextButton);
      await waitFor(() => {}, { timeout: 50 });
    }
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          event_name: 'guide_downloaded',
        })
      );
    });
  });

  it('updates progress bar correctly', async () => {
    render(
      <MemoryRouter>
        <GuideQuizGeenius />
      </MemoryRouter>
    );
    
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveAttribute('data-value', '20');
    
    // Advance one step
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByTestId('progress-bar')).toHaveAttribute('data-value', '40');
    });
  });

  it('validates required fields before advancing', async () => {
    // Re-mock with validation
    vi.doMock('@/components/guide/BusinessInfoStep', () => ({
      default: ({ onNext, validationErrors }) => (
        <div data-testid="business-info-step">
          {validationErrors?.business_name && (
            <span data-testid="error">Business name is required</span>
          )}
          <button onClick={() => onNext({})}>Next</button>
        </div>
      ),
    }));
    
    render(
      <MemoryRouter>
        <GuideQuizGeenius />
      </MemoryRouter>
    );
    
    // Try to advance without data
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    // Should still be on same step
    expect(screen.getByTestId('business-info-step')).toBeInTheDocument();
  });

  it('handles UTM parameters from URL', async () => {
    window.location.search = '?utm_source=google&utm_campaign=guide_promo';
    mockCreate.mockResolvedValue({ id: 'guide_lead_123' });
    
    render(
      <MemoryRouter>
        <GuideQuizGeenius />
      </MemoryRouter>
    );
    
    // Navigate through all steps
    for (let i = 0; i < 5; i++) {
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(b => 
        b.textContent.toLowerCase().includes('next') ||
        b.textContent.toLowerCase().includes('get my guide')
      );
      fireEvent.click(nextButton);
      await waitFor(() => {}, { timeout: 50 });
    }
    
    await waitFor(() => {
      const leadCall = mockCreate.mock.calls.find(call => call[0].business_name);
      expect(leadCall[0]).toMatchObject({
        utm_source: 'google',
        utm_campaign: 'guide_promo',
      });
    });
  });

  it('displays step indicators', () => {
    render(
      <MemoryRouter>
        <GuideQuizGeenius />
      </MemoryRouter>
    );
    
    // Should show step indicators
    expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument();
  });

  it('generates personalized guide content', async () => {
    mockCreate.mockResolvedValue({ 
      id: 'guide_lead_123',
      business_name: 'Test Business',
      business_category: 'retail',
      primary_goal: 'more_customers',
    });
    
    render(
      <MemoryRouter>
        <GuideQuizGeenius />
      </MemoryRouter>
    );
    
    // Navigate through all steps
    for (let i = 0; i < 5; i++) {
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(b => 
        b.textContent.toLowerCase().includes('next') ||
        b.textContent.toLowerCase().includes('get my guide')
      );
      fireEvent.click(nextButton);
      await waitFor(() => {}, { timeout: 50 });
    }
    
    await waitFor(() => {
      expect(screen.getByTestId('guide-results')).toBeInTheDocument();
      expect(screen.getByText(/test business/i)).toBeInTheDocument();
    });
  });
});
