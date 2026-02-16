import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import CountdownTimer from './CountdownTimer';

describe('CountdownTimer', () => {
  let sessionStorageMock: Storage;

  beforeEach(() => {
    // Clear sessionStorage mock
    const store: Record<string, string> = {};
    sessionStorageMock = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      length: 0,
      key: vi.fn(),
    };

    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true
    });

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders with default minutes', () => {
    render(<CountdownTimer />);
    expect(screen.getByText(/Remaining/)).toBeInTheDocument();
  });

  it('renders with custom minutes', () => {
    render(<CountdownTimer minutes={5} />);
    expect(screen.getByText(/Remaining/)).toBeInTheDocument();
  });

  it('displays correct initial time', () => {
    render(<CountdownTimer minutes={14} />);
    // 14 minutes = 14:00
    expect(screen.getByText(/14:00/)).toBeInTheDocument();
  });

  it('counts down correctly', () => {
    render(<CountdownTimer minutes={1} />);
    
    // Initial state: 1:00
    expect(screen.getByText(/1:00/)).toBeInTheDocument();
    
    // After 1 second: 0:59
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/0:59/)).toBeInTheDocument();
    
    // After 60 seconds: 0:00
    act(() => {
      vi.advanceTimersByTime(59000);
    });
    expect(screen.getByText(/0:00/)).toBeInTheDocument();
  });

  it('calls onExpire when timer reaches zero', () => {
    const onExpire = vi.fn();
    render(<CountdownTimer minutes={1} onExpire={onExpire} />);
    
    // Advance time past the timer duration
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    
    expect(onExpire).toHaveBeenCalled();
  });

  it('does not call onExpire before timer reaches zero', () => {
    const onExpire = vi.fn();
    render(<CountdownTimer minutes={1} onExpire={onExpire} />);
    
    // Advance time but not to zero
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('shows urgent styling when less than 5 minutes remain', () => {
    const { container } = render(<CountdownTimer minutes={4} />);
    
    // Should have red styling classes for urgent state
    const timerElement = container.querySelector('.bg-red-500\\/20');
    expect(timerElement).toBeTruthy();
  });

  it('shows normal styling when 5 or more minutes remain', () => {
    const { container } = render(<CountdownTimer minutes={5} />);
    
    // Should have green styling classes for normal state
    const timerElement = container.querySelector('.bg-\[\\#c8ff00\\]\\/10');
    expect(timerElement).toBeTruthy();
  });

  it('saves expiry time to sessionStorage', () => {
    render(<CountdownTimer minutes={14} />);
    
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      'countdownExpiry',
      expect.any(String)
    );
  });

  it('reads expiry time from sessionStorage if available', () => {
    const futureTime = Date.now() + 5 * 60 * 1000; // 5 minutes from now
    sessionStorageMock.getItem = vi.fn().mockReturnValue(futureTime.toString());
    
    render(<CountdownTimer minutes={14} />);
    
    expect(sessionStorageMock.getItem).toHaveBeenCalledWith('countdownExpiry');
  });

  it('resets timer when saved expiry is in the past', () => {
    const pastTime = Date.now() - 1000; // 1 second ago
    sessionStorageMock.getItem = vi.fn().mockReturnValue(pastTime.toString());
    
    render(<CountdownTimer minutes={14} />);
    
    // Should set a new expiry time
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      'countdownExpiry',
      expect.any(String)
    );
  });

  it('displays clock icon', () => {
    const { container } = render(<CountdownTimer />);
    
    // Check for clock icon (using Clock component from lucide-react)
    const icon = container.querySelector('svg');
    expect(icon).toBeTruthy();
  });

  it('formats seconds with leading zeros', () => {
    render(<CountdownTimer minutes={1} />);
    
    // Advance to a time with single digit seconds
    act(() => {
      vi.advanceTimersByTime(61000); // 1 minute + 1 second
    });
    
    // Should display 0:00 (timer expired)
    expect(screen.getByText(/0:00/)).toBeInTheDocument();
  });

  it('cleans up timer on unmount', () => {
    const { unmount } = render(<CountdownTimer />);
    
    // Unmount component
    unmount();
    
    // Verify no errors occur during cleanup
    expect(vi.getTimerCount()).toBe(0);
  });

  it('displays correct time when resuming from sessionStorage', () => {
    const remainingSeconds = 5 * 60 + 30; // 5 minutes 30 seconds
    const expiryTime = Date.now() + remainingSeconds * 1000;
    sessionStorageMock.getItem = vi.fn().mockReturnValue(expiryTime.toString());
    
    render(<CountdownTimer minutes={14} />);
    
    // Should display approximately 5:30
    expect(screen.getByText(/5:3/)).toBeInTheDocument();
  });
});
