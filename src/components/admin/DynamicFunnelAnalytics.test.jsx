import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DynamicFunnelAnalytics from './DynamicFunnelAnalytics';

// Mock base44 API
const mockFilter = vi.fn();
const mockInvoke = vi.fn();
const mockTrack = vi.fn();

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      AppSettings: {
        filter: (...args) => mockFilter(...args),
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

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  TrendingUp: () => <span data-testid="trending-up-icon">📈</span>,
  Users: () => <span data-testid="users-icon">👥</span>,
  MousePointer: () => <span data-testid="mouse-icon">🖱️</span>,
  ExternalLink: () => <span data-testid="link-icon">🔗</span>,
  Target: () => <span data-testid="target-icon">🎯</span>,
  Clock: () => <span data-testid="clock-icon">⏰</span>,
  Award: () => <span data-testid="award-icon">🏆</span>,
  AlertCircle: () => <span data-testid="alert-icon">⚠️</span>,
  RefreshCw: () => <span data-testid="refresh-icon">🔄</span>,
  Download: () => <span data-testid="download-icon">📥</span>,
  Loader2: () => <span data-testid="loader-icon">⏳</span>,
  ArrowUpRight: () => <span>↗️</span>,
  ArrowDownRight: () => <span>↘️</span>,
  DollarSign: () => <span data-testid="dollar-icon">💲</span>,
  ShoppingCart: () => <span data-testid="cart-icon">🛒</span>,
  BarChart3: () => <span data-testid="chart-icon">📊</span>,
  PieChart: () => <span data-testid="pie-icon">🥧</span>,
  Calendar: () => <span data-testid="calendar-icon">📅</span>,
  Sparkles: () => <span data-testid="sparkles-icon">✨</span>,
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
    },
  },
});

const renderWithQueryClient = (component) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('DynamicFunnelAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders loading state initially', () => {
    mockFilter.mockImplementation(() => new Promise(() => {}));
    
    renderWithQueryClient(<DynamicFunnelAnalytics />);
    
    expect(screen.getByText(/loading funnel analytics/i)).toBeInTheDocument();
  });

  it('displays error state when API fails', async () => {
    mockFilter.mockResolvedValue([{ setting_value: { mode: 'geenius' } }]);
    mockInvoke.mockRejectedValue(new Error('API Error'));
    
    renderWithQueryClient(<DynamicFunnelAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load analytics/i)).toBeInTheDocument();
    });
  });

  it('renders geenius mode analytics correctly', async () => {
    mockFilter.mockResolvedValue([{ setting_value: { mode: 'geenius' } }]);
    mockInvoke.mockResolvedValue({
      data: {
        metrics: {
          totalStarts: 1000,
          resultsViewed: 750,
          pathwaySelections: 500,
          totalConversions: 200,
          avgHealthScore: 65,
          avgSessionTime: '3m 45s',
          totalLeads: 150,
          pathway1Clicks: 80,
          pathway2Clicks: 70,
          pathway3Clicks: 50,
        },
        funnel: {
          overallConversion: 20,
        },
        trends: {
          starts: 15.5,
          results: 10.2,
          pathways: 8.3,
          conversions: 12.1,
        },
        sessions: {
          bounceRate: 25,
          uniqueSessions: 950,
        },
        exitPoints: [
          { step: 'category_step', percentage: '15', count: 150 },
          { step: 'contact_step', percentage: '10', count: 100 },
        ],
        painPoints: [
          { painPoint: 'low_visibility', label: 'Low Visibility', count: 300, percentage: '30' },
        ],
        categories: [
          { category: 'retail', label: 'Retail', count: 200, percentage: '20' },
        ],
        healthScoreDistribution: {
          critical: 50,
          poor: 100,
          fair: 200,
          good: 150,
        },
        generatedAt: new Date().toISOString(),
      },
    });
    
    renderWithQueryClient(<DynamicFunnelAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/quizgeenius.*analytics/i)).toBeInTheDocument();
    });

    // Check metrics are displayed
    expect(screen.getByText('1,000')).toBeInTheDocument(); // Quiz Starts
    expect(screen.getByText('750')).toBeInTheDocument(); // Results Viewed
    expect(screen.getByText('500')).toBeInTheDocument(); // Pathway Selections
    expect(screen.getByText('200')).toBeInTheDocument(); // Total Conversions
  });

  it('renders v2 mode analytics correctly', async () => {
    mockFilter.mockResolvedValue([{ setting_value: { mode: 'v2' } }]);
    mockInvoke.mockResolvedValue({
      data: {
        metrics: {
          totalStarts: 500,
          reachedPricing: 400,
          checkoutInitiated: 200,
          paidCustomers: 50,
          avgHealthScore: 70,
          avgSessionTime: '4m 30s',
          totalLeads: 50,
        },
        funnel: {
          overallConversion: 10,
        },
        trends: {
          starts: 5.0,
          pricing: 3.2,
          checkout: 1.5,
          customers: 0.8,
        },
        sessions: {
          bounceRate: 30,
          uniqueSessions: 480,
        },
        exitPoints: [],
        painPoints: [],
        categories: [],
        healthScoreDistribution: {},
        generatedAt: new Date().toISOString(),
      },
    });
    
    renderWithQueryClient(<DynamicFunnelAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/quiz v2.*stripe.*analytics/i)).toBeInTheDocument();
    });

    // Check v2 specific metrics
    expect(screen.getByText('400')).toBeInTheDocument(); // Reached Pricing
    expect(screen.getByText('200')).toBeInTheDocument(); // Checkout Initiated
    expect(screen.getByText('50')).toBeInTheDocument(); // Paid Customers
  });

  it('renders v3 mode analytics correctly', async () => {
    mockFilter.mockResolvedValue([{ setting_value: { mode: 'v3' } }]);
    mockInvoke.mockResolvedValue({
      data: {
        metrics: {
          totalStarts: 800,
          totalCompletions: 600,
          totalCTAClicks: 400,
          totalRedirects: 250,
          totalEmailCaptures: 350,
          avgHealthScore: 60,
          avgSessionTime: '3m 15s',
          totalLeads: 250,
        },
        funnel: {
          overallConversion: 31.25,
        },
        trends: {
          starts: 8.0,
          completions: 6.5,
          ctaClicks: 4.2,
          redirects: 3.1,
        },
        sessions: {
          bounceRate: 20,
          uniqueSessions: 780,
        },
        exitPoints: [],
        painPoints: [],
        categories: [],
        healthScoreDistribution: {},
        generatedAt: new Date().toISOString(),
      },
    });
    
    renderWithQueryClient(<DynamicFunnelAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/quiz v3.*affiliate.*analytics/i)).toBeInTheDocument();
    });

    // Check v3 specific metrics
    expect(screen.getByText('600')).toBeInTheDocument(); // Completed Audits
    expect(screen.getByText('400')).toBeInTheDocument(); // CTA Clicks
    expect(screen.getByText('250')).toBeInTheDocument(); // Affiliate Redirects
  });

  it('handles time range changes', async () => {
    mockFilter.mockResolvedValue([{ setting_value: { mode: 'geenius' } }]);
    mockInvoke.mockResolvedValue({
      data: {
        metrics: { totalStarts: 100 },
        funnel: { overallConversion: 10 },
        trends: {},
        sessions: {},
        exitPoints: [],
        painPoints: [],
        categories: [],
        healthScoreDistribution: {},
        generatedAt: new Date().toISOString(),
      },
    });
    
    renderWithQueryClient(<DynamicFunnelAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    // Click on 30d button
    const thirtyDayButton = screen.getByRole('button', { name: /last 30 days/i });
    fireEvent.click(thirtyDayButton);

    // Should trigger new API call
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('admin/getGeeniusAnalytics', { timeRange: '30d' });
    });
  });

  it('handles refresh button click', async () => {
    mockFilter.mockResolvedValue([{ setting_value: { mode: 'geenius' } }]);
    mockInvoke.mockResolvedValue({
      data: {
        metrics: { totalStarts: 100 },
        funnel: { overallConversion: 10 },
        trends: {},
        sessions: {},
        exitPoints: [],
        painPoints: [],
        categories: [],
        healthScoreDistribution: {},
        generatedAt: new Date().toISOString(),
      },
    });
    
    renderWithQueryClient(<DynamicFunnelAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    // Should trigger refetch
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledTimes(2);
    });
  });

  it('handles export functionality', async () => {
    mockFilter.mockResolvedValue([{ setting_value: { mode: 'geenius' } }]);
    mockInvoke.mockResolvedValue({
      data: {
        metrics: { totalStarts: 100 },
        funnel: { overallConversion: 10 },
        trends: {},
        sessions: {},
        exitPoints: [],
        painPoints: [],
        categories: [],
        healthScoreDistribution: {},
        generatedAt: new Date().toISOString(),
      },
    });
    
    renderWithQueryClient(<DynamicFunnelAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    // Should create blob and trigger download
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('displays trend indicators correctly', async () => {
    mockFilter.mockResolvedValue([{ setting_value: { mode: 'geenius' } }]);
    mockInvoke.mockResolvedValue({
      data: {
        metrics: { totalStarts: 1000 },
        funnel: { overallConversion: 10 },
        trends: {
          starts: 15.5,
          results: -5.2,
        },
        sessions: {},
        exitPoints: [],
        painPoints: [],
        categories: [],
        healthScoreDistribution: {},
        generatedAt: new Date().toISOString(),
      },
    });
    
    renderWithQueryClient(<DynamicFunnelAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    // Check for trend values
    expect(screen.getByText(/\+15.5%/)).toBeInTheDocument();
  });

  it('displays empty state for no data', async () => {
    mockFilter.mockResolvedValue([{ setting_value: { mode: 'geenius' } }]);
    mockInvoke.mockResolvedValue({
      data: {
        metrics: {},
        funnel: {},
        trends: {},
        sessions: {},
        exitPoints: [],
        painPoints: [],
        categories: [],
        healthScoreDistribution: {},
        generatedAt: new Date().toISOString(),
      },
    });
    
    renderWithQueryClient(<DynamicFunnelAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/quizgeenius.*analytics/i)).toBeInTheDocument();
    });

    // Should show 0 values for missing metrics
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('calculates conversion rates correctly', async () => {
    mockFilter.mockResolvedValue([{ setting_value: { mode: 'v2' } }]);
    mockInvoke.mockResolvedValue({
      data: {
        metrics: {
          totalStarts: 1000,
          reachedPricing: 500,
          checkoutInitiated: 200,
          paidCustomers: 50,
        },
        funnel: {
          overallConversion: 5,
        },
        trends: {},
        sessions: {},
        exitPoints: [],
        painPoints: [],
        categories: [],
        healthScoreDistribution: {},
        generatedAt: new Date().toISOString(),
      },
    });
    
    renderWithQueryClient(<DynamicFunnelAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/5%/)).toBeInTheDocument();
    });
  });
});
