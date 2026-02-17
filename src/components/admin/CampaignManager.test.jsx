import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CampaignManager from './CampaignManager';

// Mock base44 API
const mockFilter = vi.fn();
const mockList = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Campaign: {
        filter: (...args) => mockFilter(...args),
        list: (...args) => mockList(...args),
        create: (...args) => mockCreate(...args),
        update: (...args) => mockUpdate(...args),
      },
    },
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
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

describe('CampaignManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders campaign manager title', () => {
    mockFilter.mockResolvedValue([]);
    mockList.mockResolvedValue([]);
    
    renderWithQueryClient(<CampaignManager />);
    expect(screen.getByText(/Campaigns/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    mockFilter.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderWithQueryClient(<CampaignManager />);
    // Should show loading indicator or skeleton
    expect(document.querySelector('.animate-spin, [role="status"], .skeleton')).toBeTruthy();
  });

  it('displays campaigns when loaded', async () => {
    const mockCampaigns = [
      { id: '1', name: 'Summer Sale', status: 'active', type: 'email' },
      { id: '2', name: 'Winter Promo', status: 'draft', type: 'sms' },
    ];
    mockFilter.mockResolvedValue(mockCampaigns);
    mockList.mockResolvedValue(mockCampaigns);
    
    renderWithQueryClient(<CampaignManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Summer Sale')).toBeInTheDocument();
    });
  });

  it('handles create campaign button click', async () => {
    mockFilter.mockResolvedValue([]);
    mockList.mockResolvedValue([]);
    
    renderWithQueryClient(<CampaignManager />);
    
    const createButton = screen.getByRole('button', { name: /create|new|add/i });
    fireEvent.click(createButton);
    
    // Should open create modal or navigate
    await waitFor(() => {
      expect(screen.getByText(/create campaign|new campaign/i) || document.querySelector('[role="dialog"]')).toBeTruthy();
    });
  });
});
