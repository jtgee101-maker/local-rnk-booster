import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initServiceWorker } from '@/lib/registerSW.js'
import { initPerformanceMonitoring } from '@/hooks/usePerformance.js'

// Initialize Service Worker
initServiceWorker();

// Initialize Performance Monitoring
initPerformanceMonitoring();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
