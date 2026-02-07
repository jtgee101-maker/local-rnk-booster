// Embed Widget System for White-Label Partners
// Allows customers to embed LocalRnk features on their own sites

(function() {
  'use strict';

  // Widget Configuration
  const CONFIG = {
    baseUrl: 'https://harmonious-frangipane-ef2a99.netlify.app',
    apiUrl: 'https://localrnk.com/api',
    version: '1.0.0'
  };

  // Widget Styles
  const STYLES = `
    .localrnk-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-sizing: border-box;
    }
    .localrnk-widget * {
      box-sizing: inherit;
    }
    .localrnk-widget-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
    }
    .localrnk-widget-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f4f6;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: localrnk-spin 1s linear infinite;
    }
    @keyframes localrnk-spin {
      to { transform: rotate(360deg); }
    }
  `;

  // Widget Registry
  const WIDGETS = {
    'audit-widget': {
      title: 'Free Local SEO Audit',
      height: '600px',
      path: '/embed/audit'
    },
    'ranking-widget': {
      title: 'Google Ranking Checker',
      height: '400px',
      path: '/embed/ranking'
    },
    'reviews-widget': {
      title: 'Review Showcase',
      height: '300px',
      path: '/embed/reviews'
    },
    'appointment-widget': {
      title: 'Book Appointment',
      height: '500px',
      path: '/embed/appointment'
    }
  };

  // Main Widget Class
  class LocalRnkWidget {
    constructor(containerId, options = {}) {
      this.container = document.getElementById(containerId);
      this.options = {
        clientId: options.clientId,
        widget: options.widget || 'audit-widget',
        theme: options.theme || 'light',
        primaryColor: options.primaryColor || '#3b82f6',
        ...options
      };
      
      if (!this.container) {
        console.error(`LocalRnk Widget: Container #${containerId} not found`);
        return;
      }
      
      this.init();
    }

    init() {
      this.injectStyles();
      this.render();
      this.loadWidget();
    }

    injectStyles() {
      if (!document.getElementById('localrnk-widget-styles')) {
        const style = document.createElement('style');
        style.id = 'localrnk-widget-styles';
        style.textContent = STYLES;
        document.head.appendChild(style);
      }
    }

    render() {
      const widget = WIDGETS[this.options.widget];
      if (!widget) {
        console.error(`LocalRnk Widget: Unknown widget type "${this.options.widget}"`);
        return;
      }

      this.container.className = 'localrnk-widget';
      this.container.innerHTML = `
        <div class="localrnk-widget-loading">
          <div class="localrnk-widget-spinner"></div>
        </div>
      `;
    }

    loadWidget() {
      const widget = WIDGETS[this.options.widget];
      const params = new URLSearchParams({
        clientId: this.options.clientId,
        theme: this.options.theme,
        primaryColor: this.options.primaryColor,
        parentUrl: window.location.href
      });

      const iframe = document.createElement('iframe');
      iframe.src = `${CONFIG.baseUrl}${widget.path}?${params}`;
      iframe.style.cssText = `
        width: 100%;
        height: ${widget.height};
        border: none;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      `;
      iframe.title = widget.title;

      iframe.onload = () => {
        this.container.innerHTML = '';
        this.container.appendChild(iframe);
      };
    }
  }

  // Auto-initialize widgets from data attributes
  function autoInit() {
    const containers = document.querySelectorAll('[data-localrnk-widget]');
    containers.forEach(container => {
      const options = {
        clientId: container.dataset.clientId,
        widget: container.dataset.localrnkWidget,
        theme: container.dataset.theme,
        primaryColor: container.dataset.primaryColor
      };
      
      new LocalRnkWidget(container.id, options);
    });
  }

  // Expose to global scope
  window.LocalRnkWidget = LocalRnkWidget;

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

})();
