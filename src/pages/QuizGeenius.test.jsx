import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuizGeenius from './QuizGeenius';

// Mock base44 API
const mockCreate = vi.fn();
const mockFilter = vi.fn();
const mockUpdate = vi.fn();
const mockTrack = vi.fn();
const mockInvoke = vi.fn();

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      CampaignClick: {
        create: (...args) => mockCreate(...args),
      },
      ConversionEvent: {
        create: (...args) => mockCreate(...args),
      },
      UserBehavior: {
        create: (...args) => mockCreate(...args),
        filter: (...args) => mockFilter(...args),
        update: (...args) => mockUpdate(...args),
      },
      Lead: {
        create: (...args) => mockCreate(...args),
      },
      ErrorLog: {
        create: (...args) => mockCreate(...args),
      },
    },
    analytics: {
      track: (...args) => mockTrack(...args),
    },
    functions: {
      invoke: (...args) => mockInvoke(...args),
    },
  },
}));

// Mock window.location
const mockHref = vi.fn();
Object.defineProperty(window, 'location', {
  writable: true,
  value: { href: '', search: '' },
});

// Mock components
vi.mock('@/components/geenius/GeeniusErrorBoundary', () => ({
  default: ({ children }) => <div data-testid="error-boundary">{children}</div>,
}));

vi.mock('@/components/tracking/CookieConsentTracker', () => ({
  default: ({ onConsent }) => (
    <div data-testid="cookie-tracker">
      <button onClick={() => onConsent(true)}>Accept Cookies</button>
    </div>
  ),
}));

vi.mock('@/components/quiz/CategoryStep', () => ({
  default: ({ onNext }) => (
    <div data-testid="category-step">
      <button onClick={() => onNext({ business_category: 'retail' })}>Next</button>
    </div>
  ),
}));

vi.mock('@/components/quiz/PainPointStep', () => ({
  default: ({ onNext, onBack }) => (
    <div data-testid="pain-point-step">
      <button onClick={() => onNext({ pain_point: 'low_visibility' })}>Next</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/components/quiz/GoalsStep', () => ({
  default: ({ onNext, onBack }) => (
    <div data-testid="goals-step">
      <button onClick={() => onNext({ goals: ['more_customers'] })}>Next</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/components/quiz/TimelineStep', () => ({
  default: ({ onNext, onBack }) => (
    <div data-testid="timeline-step">
      <button onClick={() => onNext({ timeline: '1_month' })}>Next</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/components/quiz/BusinessSearchStep', () => ({
  default: ({ onNext, onBack }) => (
    <div data-testid="business-step">
      <button onClick={() => onNext({ 
        business_name: 'Test Business', 
        place_id: 'test_place_123',
        address: '123 Test St',
        gmb_rating: 4.5,
        gmb_reviews_count: 100,
        gmb_photos_count: 50,
      })}>Next</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/components/quiz/ContactInfoStep', () => ({
  default: ({ onNext, onBack }) => (
    <div data-testid="contact-step">
      <button onClick={() => onNext({ 
        email: 'test@example.com', 
        phone: '555-1234',
      })}>Next</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/components/quiz/ProcessingStepEnhanced', () => ({
  default: ({ onComplete }) => (
    <div data-testid="processing-step">
      <button onClick={() => onComplete({})}>Complete</button>
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
}));

// Mock Progress component
vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }) => <div data-testid="progress-bar" data-value={value}>Progress: {value}%</div>,
}));

// Mock utils
vi.mock('@/utils', () => ({
  createPageUrl: (page) => `/${page.toLowerCase()}`,
}));

describe('QuizGeenius', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = '';
    window.location.search = '';
    
    // Mock navigator
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
      configurable: true,
    });
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      configurable: true,
    });
    
    // Mock screen
    Object.defineProperty(window, 'screen', {
      value: { width: 1920, height: 1080 },
      writable: true,
    });
  });

  it('renders quiz header and progress', () => {
    render(<QuizGeenius />);
    
    expect(screen.getByText(/geeniuspath/i)).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    expect(screen.getByText(/step 1 of 7/i)).toBeInTheDocument();
  });

  it('starts with category step', () => {
    render(<QuizGeenius />);
    
    expect(screen.getByTestId('category-step')).toBeInTheDocument();
  });

  it('tracks quiz start on mount', async () => {
    mockCreate.mockResolvedValue({});
    
    render(<QuizGeenius />);
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          funnel_version: 'geenius',
          event_name: 'quiz_started',
        })
      );
    });
  });

  it('advances to next step when clicking next', async () => {
    mockCreate.mockResolvedValue({});
    
    render(<QuizGeenius />);
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('pain-point-step')).toBeInTheDocument();
    });
  });

  it('goes back to previous step when clicking back', async () => {
    mockCreate.mockResolvedValue({});
    
    render(<QuizGeenius />);
    
    // Go to step 2
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('pain-point-step')).toBeInTheDocument();
    });
    
    // Go back to step 1
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('category-step')).toBeInTheDocument();
    });
  });

  it('updates progress bar as steps advance', async () => {
    mockCreate.mockResolvedValue({});
    
    render(<QuizGeenius />);
    
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveAttribute('data-value', '14.285714285714286');
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('progress-bar')).toHaveAttribute('data-value', '28.571428571428573');
    });
  });

  it('completes quiz and creates lead', async () => {
    mockCreate.mockResolvedValue({ id: 'lead_123' });
    mockInvoke.mockResolvedValue({ data: { success: true } });
    mockFilter.mockResolvedValue([{ id: 'behavior_1', interactions: [] }]);
    
    render(<QuizGeenius />);
    
    // Navigate through all steps
    const steps = ['category-step', 'pain-point-step', 'goals-step', 'timeline-step', 'business-step', 'contact-step'];
    
    for (let i = 0; i < steps.length; i++) {
      const nextButton = screen.getAllByRole('button', { name: /next/i })[0];
      fireEvent.click(nextButton);
      
      if (i < steps.length - 1) {
        await waitFor(() => {
          expect(screen.getByTestId(steps[i + 1])).toBeInTheDocument();
        });
      }
    }
    
    // Complete processing step
    await waitFor(() => {
      expect(screen.getByTestId('processing-step')).toBeInTheDocument();
    });
    
    const completeButton = screen.getByRole('button', { name: /complete/i });
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'new',
          health_score: expect.any(Number),
          critical_issues: expect.any(Array),
        })
      );
    });
  });

  it('handles campaign tracking with UTM params', async () => {
    window.location.search = '?utm_source=facebook&utm_campaign=summer_sale&cid=camp_123';
    mockCreate.mockResolvedValue({});
    
    render(<QuizGeenius />);
    
    await waitFor(() => {
      // Should track campaign click
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          campaign_id: 'camp_123',
        })
      );
    });
  });

  it('calculates health score correctly', async () => {
    mockCreate.mockResolvedValue({ id: 'lead_123' });
    mockInvoke.mockResolvedValue({ data: { success: true } });
    mockFilter.mockResolvedValue([{ id: 'behavior_1', interactions: [] }]);
    
    render(<QuizGeenius />);
    
    // Navigate to completion
    for (let i = 0; i < 6; i++) {
      const nextButton = screen.getAllByRole('button', { name: /next/i })[0] || 
                         screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      await waitFor(() => {}, { timeout: 100 });
    }
    
    await waitFor(() => {
      expect(screen.getByTestId('processing-step')).toBeInTheDocument();
    });
    
    const completeButton = screen.getByRole('button', { name: /complete/i });
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      const leadCall = mockCreate.mock.calls.find(call => call[0].status === 'new');
      expect(leadCall).toBeDefined();
      expect(leadCall[0].health_score).toBeGreaterThanOrEqual(25);
      expect(leadCall[0].health_score).toBeLessThanOrEqual(85);
    });
  });

  it('handles cookie consent', async () => {
    mockCreate.mockResolvedValue({});
    mockFilter.mockResolvedValue([{ id: 'behavior_1' }]);
    
    render(<QuizGeenius />);
    
    const acceptButton = screen.getByRole('button', { name: /accept cookies/i });
    fireEvent.click(acceptButton);
    
    await waitFor(() => {
      expect(mockFilter).toHaveBeenCalledWith({ session_id: expect.any(String) });
    });
  });

  it('handles quiz completion error gracefully', async () => {
    mockCreate.mockRejectedValue(new Error('Network error'));
    
    // Mock alert
    const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<QuizGeenius />);
    
    // Navigate through all steps
    for (let i = 0; i < 6; i++) {
      const buttons = screen.getAllByRole('button', { name: /next/i });
      fireEvent.click(buttons[0] || buttons);
      await waitFor(() => {}, { timeout: 100 });
    }
    
    await waitFor(() => {
      expect(screen.getByTestId('processing-step')).toBeInTheDocument();
    });
    
    const completeButton = screen.getByRole('button', { name: /complete/i });
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('unable to complete'));
    });
    
    mockAlert.mockRestore();
  });

  it('generates critical issues based on business data', async () => {
    mockCreate.mockResolvedValue({ id: 'lead_123' });
    mockInvoke.mockResolvedValue({ data: { success: true } });
    mockFilter.mockResolvedValue([{ id: 'behavior_1', interactions: [] }]);
    
    render(<QuizGeenius />);
    
    // Navigate to completion
    for (let i = 0; i < 6; i++) {
      const buttons = screen.getAllByRole('button', { name: /next/i });
      fireEvent.click(buttons[0] || buttons);
      await waitFor(() => {}, { timeout: 100 });
    }
    
    await waitFor(() => {
      expect(screen.getByTestId('processing-step')).toBeInTheDocument();
    });
    
    const completeButton = screen.getByRole('button', { name: /complete/i });
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      const leadCall = mockCreate.mock.calls.find(call => call[0].status === 'new');
      expect(leadCall[0].critical_issues).toBeInstanceOf(Array);
      expect(leadCall[0].critical_issues.length).toBeGreaterThan(0);
    });
  });
});
