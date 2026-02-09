import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config.lazy'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { initGhostTracker } from '@/lib/ghostTracker.jsx';
import ErrorBoundary from '@/components/ErrorBoundary';
import { DashboardSkeleton, PageSkeleton } from '@/components/ui/skeleton-enhanced';
import '@/styles/design-tokens.css';

// Enhanced loading fallback with skeleton
const PageLoader = ({ isDashboard = false }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  >
    {isDashboard ? <DashboardSkeleton /> : <PageSkeleton showNav={false} />}
  </motion.div>
);

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading skeleton while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <PageLoader />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  const location = useLocation();

  // Render the main app with error boundary and page transitions
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader isDashboard={location.pathname.includes('Dashboard')} />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <PageTransition>
                <LayoutWrapper currentPageName={mainPageKey}>
                  <MainPage />
                </LayoutWrapper>
              </PageTransition>
            } />
            {Object.entries(Pages).map(([path, Page]) => (
              <Route
                key={path}
                path={`/${path}`}
                element={
                  <PageTransition>
                    <LayoutWrapper currentPageName={path}>
                      <Page />
                    </LayoutWrapper>
                  </PageTransition>
                }
              />
            ))}
            <Route path="*" element={
              <PageTransition>
                <PageNotFound />
              </PageTransition>
            } />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </ErrorBoundary>
  );
};


// Page transition wrapper
const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      {children}
    </motion.div>
  );
};

function App() {
  // Initialize UTM Ghost Tracker on app load
  useEffect(() => {
    initGhostTracker();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
