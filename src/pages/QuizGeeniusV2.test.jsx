import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuizGeeniusV2 from './QuizGeeniusV2';

// Mock base44 API
const mockCreate = vi.fn();
const mockFilter = vi.fn();
const mockUpdate = vi.fn();
const mockInvoke = vi.fn();
const mockTrack = vi.fn();

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Lead: {
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
    },
    functions: {
      invoke: (...args) => mockInvoke(...args),
    },
    analytics: {
      track: (...args) => mockTrack(...args),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: { href: '', search: '' },
});

// Mock components
vi.mock('@/components/geenius/GeeniusErrorBoundary', () => ({
  default: ({ children }) => <div data-testid="error-boundary">{children}</div>,
}));

vi.mock('@/components/tracking/CookieConsentTracker', () => ({
  default: () => <div data-testid="cookie-tracker">Cookie Consent</div>,
}));

vi.mock('@/components/shared/SEOHead', () => ({
  default: () => null,
}));

vi.mock('@/components/shared/FoxyMascotImage', () => ({
  default: () => <div data-testid="foxy-mascot">🦊</div>,
}));

vi.mock('@/components/shared/ScrollTracker', () => ({
  default: () => null,
}));

// Quiz step mocks
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
      })}>Next</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('@/components/quiz/ContactInfoStep', () => ({
  default: ({ onNext, onBack }) => (
    <div data-testid="contact-step">
      <button onClick={() => onNext({ email: 'test@example.com', phone: '555-1234' })}>Next</button>
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

// Foxy V2 components mocks
vi.mock('@/components/foxyv2/FoxyHealthScore', () => ({
  default: ({ data }) => <div data-testid="foxy-health-score">Health: {data?.score}</div>,
}));

vi.mock('@/components/foxyv2/RevenueLeakCalculator', () => ({
  default: ({ data }) => <div data-testid="revenue-calculator">Revenue: {data?.leak}</div>,
}));

vi.mock('@/components/foxyv2/GeoHeatmapDisplay', () => ({
  default: ({ data }) => <div data-testid="geo-heatmap">Heatmap</div>,
}));

vi.mock('@/components/foxyv2/AIVisibilityReport', () => ({
  default: ({ data }) => <div data-testid="ai-visibility">AI Report</div>,
}));

vi.mock('@/components/foxyv2/CompetitorComparison', () => ({
  default: ({ data }) => <div data-testid="competitor-comparison">Competitors</div>,
}));

vi.mock('@/components/foxyv2/ActionRoadmap', () => ({
  default: ({ data }) => <div data-testid="action-roadmap">Roadmap</div>,
}));

vi.mock('@/components/foxyv2/InteractiveROICalculator', () => ({
  default: () => <div data-testid="roi-calculator">ROI Calc</div>,
}));

vi.mock('@/components/foxyv2/AuditSummaryCards', () => ({
  default: ({ data }) => <div data-testid="audit-summary">Summary</div>,
}));

vi.mock('@/components/foxyv2/ExpandableAuditSection', () => ({
  default: ({ title, children }) => (
    <div data-testid="expandable-section">
      <h3>{title}</h3>
      {children}
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
  TrendingUp: () => <span>📈</span>,
  TrendingDown: () => <span>📉</span>,
  MapPin: () => <span>📍</span>,
  Sparkles: () => <span>✨</span>,
  Users: () => <span>👥</span>,
  Calculator: () => <span>🧮</span>,
  Target: () => <span>🎯</span>,
}));

// Mock Progress component
vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }) => <div data-testid="progress-bar">{value}%</div>,
}));

// Mock Button
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

describe('QuizGeeniusV2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = '';
  });

  it('renders quiz header with Foxy mascot', () => {
    render(<QuizGeeniusV2 />);
    
    expect(screen.getByText(/geeniuspath/i)).toBeInTheDocument();
    expect(screen.getByTestId('foxy-mascot')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
  });

  it('starts with category step', () => {
    render(<QuizGeeniusV2 />);
    
    expect(screen.getByTestId('category-step')).toBeInTheDocument();
  });

  it('advances through quiz steps', async () => {
    render(<QuizGeeniusV2 />);
    
    const steps = [
      'category-step',
      'pain-point-step', 
      'goals-step',
      'timeline-step',
      'business-step',
      'contact-step',
    ];
    
    for (let i = 0; i < steps.length; i++) {
      expect(screen.getByTestId(steps[i])).toBeInTheDocument();
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      
      if (i < steps.length - 1) {
        await waitFor(() => {
          expect(screen.getByTestId(steps[i + 1])).toBeInTheDocument();
        });
      }
    }
  });

  it('handles going back to previous steps', async () => {
    render(<QuizGeeniusV2 />);
    
    // Advance to step 2
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByTestId('pain-point-step')).toBeInTheDocument();
    });
    
    // Go back
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    await waitFor(() => {
      expect(screen.getByTestId('category-step')).toBeInTheDocument();
    });
  });

  it('creates lead on completion', async () => {
    mockCreate.mockResolvedValue({ id: 'lead_123' });
    mockInvoke.mockResolvedValue({ 
      data: { 
        success: true,
        healthScore: 75,
        weakZones: [],
      } 
    });
    
    render(<QuizGeeniusV2 />);
    
    // Navigate through all steps
    for (let i = 0; i < 6; i++) {
      const nextButton = screen.getAllByRole('button', { name: /next/i })[0];
      fireEvent.click(nextButton);
      await waitFor(() => {}, { timeout: 50 });
    }
    
    // Complete the quiz
    await waitFor(() => {
      expect(screen.getByTestId('processing-step')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: /complete/i }));
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          business_name: 'Test Business',
          status: 'new',
        })
      );
    });
  });

  it('shows audit stages after completion', async () => {
    mockCreate.mockResolvedValue({ id: 'lead_123' });
    mockInvoke.mockResolvedValue({ 
      data: { 
        success: true,
        healthScore: 75,
        weakZones: [],
      } 
    });
    
    render(<QuizGeeniusV2 />);
    
    // Navigate to completion
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getAllByRole('button', { name: /next/i })[0]);
      await waitFor(() => {}, { timeout: 50 });
    }
    
    await waitFor(() => {
      expect(screen.getByTestId('processing-step')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: /complete/i }));
    
    // After completion, should show Foxy audit components
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('calculateHealthScore', expect.any(Object));
    });
  });

  it('handles missing required data error', async () => {
    render(<QuizGeeniusV2 />);
    
    // Navigate through without completing business info
    for (let i = 0; i < 5; i++) {
      const buttons = screen.getAllByRole('button', { name: /next/i });
      fireEvent.click(buttons[0]);
      await waitFor(() => {}, { timeout: 50 });
    }
    
    // Try to complete with missing data
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    await waitFor(() => {
      expect(screen.getByTestId('contact-step')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /complete/i }));
    
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('error'));
    });
    
    alertMock.mockRestore();
  });

  it('tracks conversion events', async () => {
    mockCreate.mockResolvedValue({ id: 'lead_123' });
    mockInvoke.mockResolvedValue({ data: { success: true } });
    
    render(<QuizGeeniusV2 />);
    
    // Navigate to completion
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getAllByRole('button', { name: /next/i })[0]);
      await waitFor(() => {}, { timeout: 50 });
    }
    
    await waitFor(() => {
      expect(screen.getByTestId('processing-step')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: /complete/i }));
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          event_name: 'quiz_completed',
          funnel_version: 'geenius_v2',
        })
      );
    });
  });

  it('handles lead creation failure', async () => {
    mockCreate.mockRejectedValue(new Error('Database error'));
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<QuizGeeniusV2 />);
    
    // Navigate to completion
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getAllByRole('button', { name: /next/i })[0]);
      await waitFor(() => {}, { timeout: 50 });
    }
    
    await waitFor(() => {
      expect(screen.getByTestId('processing-step')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: /complete/i }));
    
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalled();
    });
    
    alertMock.mockRestore();
  });

  it('expands audit sections correctly', async () => {
    mockCreate.mockResolvedValue({ id: 'lead_123' });
    mockInvoke.mockResolvedValue({ 
      data: { 
        success: true,
        healthScore: 75,
        weakZones: [],
      } 
    });
    
    render(<QuizGeeniusV2 />);
    
    // Navigate to completion
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getAllByRole('button', { name: /next/i })[0]);
      await waitFor(() => {}, { timeout: 50 });
    }
    
    await waitFor(() => {
      expect(screen.getByTestId('processing-step')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: /complete/i }));
    
    // Should have audit sections
    await waitFor(() => {
      const sections = screen.getAllByTestId('expandable-section');
      expect(sections.length).toBeGreaterThan(0);
    });
  });
});
