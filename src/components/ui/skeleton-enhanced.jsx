import React from 'react';

/**
 * 200X Builder - Enhanced Skeleton Components
 * Beautiful loading states for better UX
 * 
 * @version 3.0.0
 * @status ENHANCED
 */

/**
 * Base Skeleton component
 */
export const Skeleton = ({ 
  className = '', 
  width = '100%', 
  height = '1rem',
  variant = 'default',
  animate = true 
}) => {
  const baseStyles = {
    width,
    height,
    borderRadius: variant === 'circle' ? '50%' : 'var(--radius-md)',
    background: 'linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%)',
    backgroundSize: '200% 100%',
    animation: animate ? 'shimmer 1.5s infinite' : 'none'
  };

  return (
    <div 
      className={`skeleton ${className}`}
      style={baseStyles}
    />
  );
};

/**
 * Card Skeleton
 */
export const CardSkeleton = ({ 
  hasImage = true, 
  lines = 3,
  className = ''
}) => {
  return (
    <div 
      className={`rounded-xl p-6 ${className}`}
      style={{ 
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-default)'
      }}
    >
      {hasImage && (
        <Skeleton 
          width="100%" 
          height="160px" 
          variant="default"
          className="mb-4"
        />
      )}
      <Skeleton width="70%" height="1.5rem" className="mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i}
          width={i === lines - 1 ? '60%' : '100%'} 
          height="1rem" 
          className="mb-2"
        />
      ))}
    </div>
  );
};

/**
 * List Item Skeleton
 */
export const ListItemSkeleton = ({ 
  hasAvatar = true,
  hasAction = true,
  lines = 2
}) => {
  return (
    <div 
      className="flex items-center gap-4 p-4 rounded-lg"
      style={{ background: 'var(--bg-glass-subtle)' }}
    >
      {hasAvatar && (
        <Skeleton width="48px" height="48px" variant="circle" />
      )}
      <div className="flex-1">
        <Skeleton width="40%" height="1.25rem" className="mb-2" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i}
            width={i === lines - 1 ? '70%' : '90%'} 
            height="0.875rem" 
            className="mb-1"
          />
        ))}
      </div>
      {hasAction && (
        <Skeleton width="32px" height="32px" variant="circle" />
      )}
    </div>
  );
};

/**
 * Table Row Skeleton
 */
export const TableRowSkeleton = ({ columns = 4 }) => {
  return (
    <div 
      className="flex items-center gap-4 py-4 px-6"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className={i === 0 ? 'flex-[2]' : 'flex-1'}>
          <Skeleton 
            width={i === 0 ? '80%' : '60%'} 
            height="1rem"
          />
        </div>
      ))}
    </div>
  );
};

/**
 * Stat Card Skeleton
 */
export const StatCardSkeleton = () => {
  return (
    <div 
      className="rounded-xl p-6"
      style={{ 
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-default)'
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <Skeleton width="40%" height="0.875rem" />
        <Skeleton width="40px" height="40px" variant="circle" />
      </div>
      <Skeleton width="60%" height="2.5rem" className="mb-2" />
      <Skeleton width="30%" height="1rem" />
    </div>
  );
};

/**
 * Chart Skeleton
 */
export const ChartSkeleton = ({ height = '300px' }) => {
  return (
    <div 
      className="rounded-xl p-6"
      style={{ 
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-default)'
      }}
    >
      <Skeleton width="40%" height="1.5rem" className="mb-6" />
      <Skeleton width="100%" height={height} />
    </div>
  );
};

/**
 * Form Skeleton
 */
export const FormSkeleton = ({ fields = 4 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton width="30%" height="0.875rem" className="mb-2" />
          <Skeleton width="100%" height="44px" />
        </div>
      ))}
      <Skeleton width="100%" height="48px" className="mt-6" />
    </div>
  );
};

/**
 * Dashboard Skeleton (Full page)
 */
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width="300px" height="2rem" />
        <Skeleton width="120px" height="40px" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton height="250px" />
        <ChartSkeleton height="250px" />
      </div>

      {/* Table */}
      <div 
        className="rounded-xl overflow-hidden"
        style={{ 
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-default)'
        }}
      >
        <div 
          className="py-4 px-6"
          style={{ borderBottom: '1px solid var(--border-default)' }}
        >
          <Skeleton width="200px" height="1.25rem" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRowSkeleton key={i} columns={4} />
        ))}
      </div>
    </div>
  );
};

/**
 * Quiz Skeleton
 */
export const QuizSkeleton = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Progress */}
      <Skeleton width="100%" height="8px" variant="default" />
      
      {/* Question */}
      <Skeleton width="90%" height="2rem" className="mb-8" />
      
      {/* Options */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i}
            className="p-4 rounded-lg flex items-center gap-4"
            style={{ 
              background: 'var(--bg-glass-subtle)',
              border: '1px solid var(--border-default)'
            }}
          >
            <Skeleton width="24px" height="24px" variant="circle" />
            <Skeleton width="70%" height="1.25rem" />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Skeleton width="100px" height="44px" />
        <Skeleton width="100px" height="44px" />
      </div>
    </div>
  );
};

/**
 * Page Skeleton with navigation
 */
export const PageSkeleton = ({ 
  showNav = true,
  showFooter = false,
  children
}) => {
  return (
    <div 
      className="min-h-screen"
      style={{ background: 'var(--bg-primary)' }}
    >
      {showNav && (
        <nav 
          className="h-16 px-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-default)' }}
        >
          <Skeleton width="150px" height="2rem" />
          <div className="flex items-center gap-4">
            <Skeleton width="80px" height="2rem" />
            <Skeleton width="80px" height="2rem" />
            <Skeleton width="100px" height="40px" />
          </div>
        </nav>
      )}
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children || <DashboardSkeleton />}
      </main>

      {showFooter && (
        <footer 
          className="py-12 px-4 mt-20"
          style={{ borderTop: '1px solid var(--border-default)' }}
        >
          <div className="max-w-7xl mx-auto grid grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton width="80%" height="1.25rem" className="mb-4" />
                <Skeleton width="60%" height="0.875rem" className="mb-2" />
                <Skeleton width="70%" height="0.875rem" className="mb-2" />
                <Skeleton width="50%" height="0.875rem" />
              </div>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
};

export default {
  Skeleton,
  CardSkeleton,
  ListItemSkeleton,
  TableRowSkeleton,
  StatCardSkeleton,
  ChartSkeleton,
  FormSkeleton,
  DashboardSkeleton,
  QuizSkeleton,
  PageSkeleton
};
