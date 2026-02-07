# LocalRnk PWA System

## Files Created

### Core PWA Files
1. **public/sw.js** - Service Worker with caching, background sync, and push notifications
2. **public/manifest.json** - Web App Manifest for PWA installation
3. **src/lib/registerSW.js** - Service Worker registration and update handling
4. **src/lib/cacheStrategies.js** - Reusable caching strategies
5. **src/lib/prefetch.js** - Intelligent route prefetching system

### Performance & Offline
6. **src/hooks/usePerformance.js** - Core Web Vitals tracking and performance hooks
7. **src/components/OfflineBanner.jsx** - Offline status indicator and sync UI

### Configuration
8. **vite.config.js** - Updated with VitePWA plugin configuration
9. **index.html** - Enhanced with PWA meta tags
10. **src/main.jsx** - Initialized SW and performance monitoring

## Caching Strategy Summary

| Resource Type | Strategy | Cache Name | Max Age |
|--------------|----------|------------|---------|
| Static Assets (JS, CSS) | Cache First | localrnk-static | 30 days |
| API Responses | Stale While Revalidate | localrnk-api | 5 minutes |
| Images | Stale While Revalidate | localrnk-images | 7 days |
| Fonts | Cache First | google-fonts | 1 year |
| Auth Endpoints | Network Only | - | - |

## Offline Capabilities

### 1. Offline Navigation
- All static assets cached for offline use
- Previously visited routes available offline
- Automatic fallback to cached content

### 2. Background Sync
- Form submissions queued when offline
- Automatic retry when connection restored
- Progress indication in UI

### 3. Push Notifications
- Service worker handles push events
- Notification click routing
- Rich notification actions

### 4. Periodic Sync
- Background data refresh for critical endpoints
- Dashboard stats pre-fetched
- Unread notifications checked

### 5. Smart Prefetching
- Route prefetch on hover (100ms delay)
- Viewport-based prefetching
- Behavior-based predictions
- Idle-time prefetching

## Performance Features

### Core Web Vitals Tracking
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **TTFB** (Time to First Byte)
- **FCP** (First Contentful Paint)

### React Hooks
- `useRenderTime` - Track component render performance
- `usePerformanceMetric` - Custom timing measurements
- `useNetworkTracking` - Monitor fetch requests
- `useMemoryTracking` - Heap size monitoring (Chrome)

### Bundle Optimization
- Code splitting with manual chunks
- Vendor separation (react, ui, charts, etc.)
- Lazy-loaded heavy libraries (3D, maps, editor)

## Installation

```bash
# Install PWA plugin (requires npm auth if private registry)
npm install vite-plugin-pwa --save-dev

# Generate icons (requires canvas)
npm install canvas --save-dev
node scripts/generate-icons.js
```

## Usage

### Basic Offline Banner
```jsx
import { OfflineBanner } from '@/components/OfflineBanner';

function App() {
  return (
    <>
      <YourApp />
      <OfflineBanner />
    </>
  );
}
```

### Prefetch on Hover
```jsx
import { usePrefetchOnHover } from '@/lib/prefetch';

function NavLink({ to, children }) {
  const prefetchProps = usePrefetchOnHover(to);
  
  return (
    <Link to={to} {...prefetchProps}>
      {children}
    </Link>
  );
}
```

### Track Performance
```jsx
import { useRenderTime, usePerformanceMetric } from '@/hooks/usePerformance';

function MyComponent() {
  useRenderTime('MyComponent', 16); // Alert if >16ms
  
  const { measure } = usePerformanceMetric('dataFetch');
  
  const handleClick = () => {
    measure(async () => {
      await fetchData();
    });
  };
}
```

### Offline-Aware Actions
```jsx
import { useOfflineAction } from '@/components/OfflineBanner';

function Form() {
  const { execute } = useOfflineAction();
  
  const onSubmit = async (data) => {
    await execute(
      () => api.submit(data),
      {
        onSuccess: () => toast.success('Saved!'),
        onQueued: () => toast.info('Will sync when online'),
        onError: (e) => toast.error(e.message)
      }
    );
  };
}
```

## Environment Variables

```bash
# Enable Service Worker in development
VITE_ENABLE_SW_IN_DEV=true

# Enable legacy SDK imports (if needed)
BASE44_LEGACY_SDK_IMPORTS=true
```

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 11.3+)
- Samsung Internet: ✅ Full support

## Testing

```bash
# Build and preview
npm run build
npm run preview

# Lighthouse audit
npx lighthouse http://localhost:4173 --output=html --output-path=./lighthouse-report.html
```

## Notes

- The npm registry access issue for `@vitejs/plugin-pwa` requires authentication
- Alternative: Install from npm public registry directly
- Workbox window included for better SW lifecycle management
- Service Worker uses module type (ES modules)
