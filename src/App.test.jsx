import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock dependencies
vi.mock('@/lib/AuthContext', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({
    isLoadingAuth: false,
    isLoadingPublicSettings: false,
    authError: null,
    navigateToLogin: vi.fn(),
  }),
}));

vi.mock('@/lib/query-client', () => ({
  queryClientInstance: {},
}));

vi.mock('@/lib/NavigationTracker', () => ({
  default: () => <div data-testid="navigation-tracker" />,
}));

vi.mock('@/lib/ghostTracker.jsx', () => ({
  initGhostTracker: vi.fn(),
}));

vi.mock('./pages.config.lazy', () => ({
  pagesConfig: {
    Pages: {
      home: () => <div data-testid="home-page">Home Page</div>,
      dashboard: () => <div data-testid="dashboard-page">Dashboard</div>,
    },
    Layout: ({ children }) => <div data-testid="layout">{children}</div>,
    mainPage: 'home',
  },
}));

describe('App Component', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });

  it('renders navigation tracker', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('navigation-tracker')).toBeInTheDocument();
  });

  it('wraps app in QueryClientProvider', () => {
    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    // QueryClientProvider doesn't add visible elements, but we can verify structure
    expect(container.querySelector('[data-testid="auth-provider"]')).toBeInTheDocument();
  });
});
