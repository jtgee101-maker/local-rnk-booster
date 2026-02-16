import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FAQAccordion from './FAQAccordion';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="chevron-down">▼</span>,
}));

// Mock Card component
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

describe('FAQAccordion', () => {
  const customFaqs = [
    {
      question: 'Custom Question 1?',
      answer: 'Custom Answer 1',
    },
    {
      question: 'Custom Question 2?',
      answer: 'Custom Answer 2',
    },
  ];

  it('renders with default title', () => {
    render(<FAQAccordion />);
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<FAQAccordion title="Custom FAQ Title" />);
    expect(screen.getByText('Custom FAQ Title')).toBeInTheDocument();
  });

  it('renders with default FAQs', () => {
    render(<FAQAccordion />);
    expect(screen.getByText('Is this really 100% free?')).toBeInTheDocument();
    expect(screen.getByText('How long does the audit take?')).toBeInTheDocument();
  });

  it('renders with custom FAQs', () => {
    render(<FAQAccordion faqs={customFaqs} />);
    expect(screen.getByText('Custom Question 1?')).toBeInTheDocument();
    expect(screen.getByText('Custom Question 2?')).toBeInTheDocument();
  });

  it('shows subtitle by default', () => {
    render(<FAQAccordion />);
    expect(screen.getByText(/Everything you need to know about your free Foxy audit/)).toBeInTheDocument();
  });

  it('renders all FAQ questions', () => {
    render(<FAQAccordion />);
    const defaultFaqs = [
      'Is this really 100% free?',
      'How long does the audit take?',
      'What makes Foxy different from other GMB tools?',
      'Will this work for my industry?',
      'Do I need technical knowledge?',
      'What happens after I get my audit?',
    ];

    defaultFaqs.forEach((faq) => {
      expect(screen.getByText(faq)).toBeInTheDocument();
    });
  });

  it('expands FAQ when clicked', () => {
    render(<FAQAccordion />);
    
    const firstQuestion = screen.getByText('Is this really 100% free?');
    fireEvent.click(firstQuestion);
    
    // Answer should be visible after click
    expect(screen.getByText(/Yes! The Foxy audit is completely free/)).toBeInTheDocument();
  });

  it('collapses expanded FAQ when clicked again', () => {
    render(<FAQAccordion />);
    
    const firstQuestion = screen.getByText('Is this really 100% free?');
    
    // Expand
    fireEvent.click(firstQuestion);
    expect(screen.getByText(/Yes! The Foxy audit is completely free/)).toBeInTheDocument();
    
    // Collapse
    fireEvent.click(firstQuestion);
    // The answer should no longer be in the document
    expect(screen.queryByText(/Yes! The Foxy audit is completely free/)).not.toBeInTheDocument();
  });

  it('allows only one FAQ to be expanded at a time', () => {
    render(<FAQAccordion />);
    
    const firstQuestion = screen.getByText('Is this really 100% free?');
    const secondQuestion = screen.getByText('How long does the audit take?');
    
    // Expand first
    fireEvent.click(firstQuestion);
    expect(screen.getByText(/Yes! The Foxy audit is completely free/)).toBeInTheDocument();
    
    // Expand second - first should collapse
    fireEvent.click(secondQuestion);
    expect(screen.getByText(/The entire process takes about 60 seconds/)).toBeInTheDocument();
    expect(screen.queryByText(/Yes! The Foxy audit is completely free/)).not.toBeInTheDocument();
  });

  it('renders chevron icon for each FAQ', () => {
    render(<FAQAccordion faqs={customFaqs} />);
    const chevrons = screen.getAllByTestId('chevron-down');
    expect(chevrons.length).toBe(customFaqs.length);
  });

  it('renders FAQ items with correct styling', () => {
    const { container } = render(<FAQAccordion />);
    
    // Check for container classes
    const wrapper = container.querySelector('.max-w-4xl');
    expect(wrapper).toBeTruthy();
  });

  it('renders FAQ buttons with full width', () => {
    const { container } = render(<FAQAccordion />);
    
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    buttons.forEach((button) => {
      expect(button).toHaveClass('w-full');
    });
  });

  it('renders answer text with correct styling', () => {
    render(<FAQAccordion />);
    
    const firstQuestion = screen.getByText('Is this really 100% free?');
    fireEvent.click(firstQuestion);
    
    const answer = screen.getByText(/Yes! The Foxy audit is completely free/);
    expect(answer).toHaveClass('text-gray-300');
  });

  it('renders question text with correct styling', () => {
    render(<FAQAccordion />);
    
    const question = screen.getByText('Is this really 100% free?');
    expect(question).toHaveClass('text-white');
    expect(question).toHaveClass('font-bold');
  });

  it('renders FAQ cards with hover effect', () => {
    const { container } = render(<FAQAccordion />);
    
    const cards = container.querySelectorAll('.hover\\:border-\[\\#c8ff00\\]\\/30');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('handles empty FAQ array', () => {
    render(<FAQAccordion faqs={[]} />);
    
    // Should still render title
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    
    // No FAQ items should be rendered
    const faqSection = screen.getByText('Frequently Asked Questions').parentElement?.parentElement;
    const buttons = faqSection?.querySelectorAll('button');
    expect(buttons?.length).toBe(0);
  });

  it('handles FAQ with special characters', () => {
    const specialFaqs = [
      {
        question: 'Special chars: !@#$%^&*()?',
        answer: 'Answer with <special> chars & more!',
      },
    ];
    
    render(<FAQAccordion faqs={specialFaqs} />);
    expect(screen.getByText('Special chars: !@#$%^&*()?')).toBeInTheDocument();
  });
});
