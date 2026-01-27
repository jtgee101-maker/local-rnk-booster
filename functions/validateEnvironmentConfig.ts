import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Environment Configuration Validator
 * Checks all required secrets and environment variables
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const config = {
      timestamp: new Date().toISOString(),
      environment: Deno.env.get('ENVIRONMENT') || 'production',
      secrets: {
        configured: [],
        missing: [],
        warnings: []
      },
      domains: {
        primary: process.env.PRIMARY_DOMAIN || 'Not configured',
        customDomain: process.env.CUSTOM_DOMAIN || 'Not set'
      },
      apis: {
        stripe: { status: 'unknown', details: '' },
        resend: { status: 'unknown', details: '' },
        googleMaps: { status: 'unknown', details: '' }
      }
    };

    // CHECK 1: Required Secrets
    const requiredSecrets = [
      { name: 'RESEND_API_KEY', critical: true, service: 'Email delivery' },
      { name: 'RESEND_WEBHOOK_SECRET', critical: true, service: 'Email webhooks' },
      { name: 'GOOGLE_MAPS_API_KEY', critical: true, service: 'Business search' },
      { name: 'ADMIN_ACCESS_KEY', critical: true, service: 'Admin operations' },
      { name: 'STRIPE_SECRET_KEY', critical: false, service: 'Payments (optional for now)' },
      { name: 'STRIPE_WEBHOOK_SECRET', critical: false, service: 'Payment webhooks' }
    ];

    requiredSecrets.forEach(secret => {
      const value = Deno.env.get(secret.name);
      if (value) {
        config.secrets.configured.push({
          name: secret.name,
          service: secret.service,
          status: 'set',
          length: value.length,
          masked: `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
        });
      } else {
        if (secret.critical) {
          config.secrets.missing.push({
            name: secret.name,
            service: secret.service,
            critical: true
          });
        } else {
          config.secrets.warnings.push({
            name: secret.name,
            service: secret.service,
            reason: 'Payment processing disabled without this'
          });
        }
      }
    });

    // CHECK 2: API Integration Status
    if (Deno.env.get('RESEND_API_KEY')) {
      config.apis.resend = {
        status: 'configured',
        details: 'Email delivery via Resend enabled'
      };
    } else {
      config.apis.resend = {
        status: 'error',
        details: 'RESEND_API_KEY not set - email delivery disabled'
      };
    }

    if (Deno.env.get('GOOGLE_MAPS_API_KEY')) {
      config.apis.googleMaps = {
        status: 'configured',
        details: 'Google Maps/Places API enabled'
      };
    } else {
      config.apis.googleMaps = {
        status: 'error',
        details: 'GOOGLE_MAPS_API_KEY not set - business search disabled'
      };
    }

    if (Deno.env.get('STRIPE_SECRET_KEY')) {
      config.apis.stripe = {
        status: 'configured',
        details: 'Stripe payments enabled'
      };
    } else {
      config.apis.stripe = {
        status: 'warning',
        details: 'STRIPE_SECRET_KEY not set - payment processing disabled'
      };
    }

    // CHECK 3: Deployment Readiness
    const isReady = {
      canDeployBasicFunctionality: config.secrets.missing.length === 0,
      canProcessPayments: Deno.env.get('STRIPE_SECRET_KEY') !== undefined,
      canSendEmails: Deno.env.get('RESEND_API_KEY') !== undefined,
      canSearchBusinesses: Deno.env.get('GOOGLE_MAPS_API_KEY') !== undefined,
      fullProductionReady: config.secrets.missing.length === 0 && 
                          Deno.env.get('STRIPE_SECRET_KEY') !== undefined
    };

    config.readiness = isReady;

    // CHECK 4: Configuration Summary
    config.summary = {
      secretsConfigured: config.secrets.configured.length,
      secretsMissing: config.secrets.missing.length,
      secretsWarnings: config.secrets.warnings.length,
      apisConfigured: [
        config.apis.resend.status === 'configured',
        config.apis.googleMaps.status === 'configured',
        config.apis.stripe.status === 'configured'
      ].filter(Boolean).length,
      deploymentBlocked: config.secrets.missing.length > 0,
      paymentBlocked: !Deno.env.get('STRIPE_SECRET_KEY')
    };

    return Response.json(config);
  } catch (error) {
    console.error('Config validation error:', error);
    return Response.json({ 
      error: error.message,
      status: 'failed'
    }, { status: 500 });
  }
});