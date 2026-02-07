# Payment Configuration - DEMO MODE

## ⚠️ IMPORTANT: NO REAL CHARGES

This platform is configured for **DEMO/TEST MODE ONLY**.
- No real money will be charged
- All transactions are simulated
- Test card numbers only

## Current Settings

```
VITE_PAYMENT_TEST_MODE=true
VITE_PAYMENT_DEMO_MODE=true
```

## Test Card Numbers

Use these for testing:
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0000 0000 3220

## Demo Keys

The system uses mock keys:
```
VITE_STRIPE_PUBLIC_KEY=pk_test_demo_mock_key_do_not_use_live
STRIPE_SECRET_KEY=sk_test_demo_mock_key_do_not_use_live
```

## To Enable Live Payments (Future)

Only when you're ready to charge real customers:

1. Get live keys from Stripe dashboard
2. Update environment variables:
   ```
   VITE_PAYMENT_TEST_MODE=false
   VITE_PAYMENT_DEMO_MODE=false
   VITE_STRIPE_PUBLIC_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```
3. Deploy with new env vars

## All Payment Gateways (Demo Mode)

- ✅ Stripe (Mock mode)
- ⏸️ Whop (Disabled - needs API key)
- ⏸️ GeeniusPay (Disabled - needs API key)
- ⏸️ NMI (Disabled - needs API key)
- ⏸️ Payra (Disabled - needs API key)
- ⏸️ Authorize.net (Disabled - needs API key)

**Default gateway:** Stripe (Mock/Demo)

---
**Configured by:** Deploy Bot  
**Date:** February 7, 2026  
**Mode:** DEMO/TEST ONLY
