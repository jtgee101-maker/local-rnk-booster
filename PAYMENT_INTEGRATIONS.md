# Payment Gateway Integration Guide

## 🎯 Current Configuration (DEMO MODE)

**Status:** All gateways in DEMO/MOCK mode - NO REAL CHARGES

### Gateway Priority Order

| Priority | Gateway | Type | Status | Live Keys Needed |
|----------|---------|------|--------|------------------|
| 1 | **GeeniusPay** | Card | ✅ Demo Ready | GEENIUSPAY_API_KEY |
| 2 | **NMI** | Card | ✅ Demo Ready | NMI_SECURITY_KEY |
| 3 | **Payra** | Card | ✅ Demo Ready | PAYRA_API_KEY |
| 4 | **CryptoProcessing** | Crypto | ✅ Demo Ready | CRYPTOPROCESSING_API_KEY |
| 5 | Stripe | Card | ⏸️ Disabled | KYC Required |
| 6 | Whop | Card/Crypto | ⏸️ Disabled | WHOP_API_KEY |
| 7 | Authorize.net | Card | ⏸️ Disabled | AUTHORIZE_API_KEY |
| 8 | PayPal | Card/PayPal | ⏸️ Disabled | PAYPAL_CLIENT_ID |

---

## 💳 CARD PROCESSING

### 1. GeeniusPay (Primary)
**Website:** https://scan.geeniuspay.com

**Features:**
- Credit/Debit card processing
- Crypto payment support
- Scan-to-pay feature
- Subscription billing
- Multi-currency support

**To Go Live:**
1. Sign up at https://scan.geeniuspay.com
2. Complete business verification
3. Get API credentials
4. Update `.env`:
   ```
   GEENIUSPAY_API_KEY=your_live_key
   GEENIUSPAY_API_SECRET=your_live_secret
   ```

**Test Cards (Demo Mode):**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

---

### 2. NMI (Secondary)
**Website:** https://secure.nmi.com

**Features:**
- Direct payment processing
- Hosted payment pages
- Subscription management
- Customer vault
- Advanced fraud protection

**To Go Live:**
1. Sign up at https://secure.nmi.com
2. Get security key
3. Update `.env`:
   ```
   NMI_SECURITY_KEY=your_security_key
   NMI_USERNAME=your_username
   NMI_PASSWORD=your_password
   ```

---

### 3. Payra (Tertiary)
**Website:** https://payra.com

**Features:**
- Modern card processing
- Bank transfer support
- Subscription pause/resume
- Multi-currency
- Advanced analytics

**To Go Live:**
1. Sign up at https://payra.com
2. Complete onboarding
3. Update `.env`:
   ```
   PAYRA_API_KEY=your_api_key
   PAYRA_API_SECRET=your_api_secret
   ```

---

## ₿ CRYPTO PROCESSING

### CryptoProcessing.com (Exclusive)
**Website:** https://cryptoprocessing.com  
**Docs:** https://docs.cryptoprocessing.com

**Features:**
- **Supported Coins:** BTC, ETH, USDT, USDC, LTC, BCH
- **Fixed Exchange Rate:** 15-minute lock
- **Multi-Currency:** Crypto + Fiat checkout
- **Global Coverage:** Worldwide support
- **Low Fees:** 1% processing fee
- **Webhooks:** Real-time payment notifications

**Supported Cryptocurrencies:**
- Bitcoin (BTC)
- Ethereum (ETH)
- Tether (USDT) - ERC20, TRC20
- USD Coin (USDC)
- Litecoin (LTC)
- Bitcoin Cash (BCH)

**Demo Mode Behavior:**
- Shows mock crypto addresses
- Simulates payment flow
- No real blockchain transactions
- Test any wallet format

**To Go Live:**
1. Sign up at https://cryptoprocessing.com
2. Complete KYC verification
3. Generate API keys
4. Update `.env`:
   ```
   CRYPTOPROCESSING_API_KEY=your_api_key
   CRYPTOPROCESSING_API_SECRET=your_api_secret
   ```
5. Configure webhook URL in dashboard:
   ```
   https://yourdomain.com/api/webhooks/cryptoprocessing
   ```

**Exchange Rates (Demo):**
- BTC/USD: $65,000
- ETH/USD: $3,500
- USDT/USD: $1.00
- USDC/USD: $1.00

---

## 🔄 ROUTING LOGIC

### Automatic Gateway Selection

```
IF payment_method = 'crypto':
  → CryptoProcessing (Primary)
  → GeeniusPay (Fallback - supports crypto)

IF payment_method = 'card':
  → GeeniusPay (Priority #1)
  → NMI (Priority #2)
  → Payra (Priority #3)
  → Stripe (Fallback - if enabled)

IF country = EU:
  → GeeniusPay (Optimized for EU)
  → Payra (Fallback)

IF country = UK:
  → Payra (Optimized for UK)
  → GeeniusPay (Fallback)
```

### Manual Gateway Selection

Users can manually select at checkout:
- **"Pay with Card"** → Routes to GeeniusPay/NMI/Payra
- **"Pay with Crypto"** → Routes to CryptoProcessing
- **"Other Options"** → Shows all available gateways

---

## 🛠️ GOING LIVE CHECKLIST

### Phase 1: GeeniusPay (Quickest)
- [ ] Sign up at scan.geeniuspay.com
- [ ] Submit business documents
- [ ] Get API key
- [ ] Update `.env` with live keys
- [ ] Test $1 transaction
- [ ] Monitor dashboard

### Phase 2: NMI (Backup)
- [ ] Sign up at secure.nmi.com
- [ ] Complete application
- [ ] Get security key
- [ ] Update `.env`
- [ ] Test transaction

### Phase 3: Payra (EU/UK Focus)
- [ ] Sign up at payra.com
- [ ] Complete verification
- [ ] Get API credentials
- [ ] Update `.env`
- [ ] Test transaction

### Phase 4: CryptoProcessing (Crypto)
- [ ] Sign up at cryptoprocessing.com
- [ ] Complete KYC
- [ ] Get API keys
- [ ] Configure webhook URL
- [ ] Test with small crypto amount
- [ ] Verify wallet receives funds

### Phase 5: Stripe (When KYC Ready)
- [ ] Complete Stripe KYC
- [ ] Get live keys
- [ ] Enable in config
- [ ] Update `.env`
- [ ] Test thoroughly

---

## 📊 FEE COMPARISON

| Gateway | Card Fee | Crypto Fee | Setup Fee | Monthly |
|---------|----------|------------|-----------|---------|
| GeeniusPay | 2.5% + $0.25 | Variable | Free | None |
| NMI | 2.2% + $0.20 | N/A | Variable | Variable |
| Payra | 2.4% + $0.25 | N/A | Free | None |
| CryptoProcessing | N/A | 1.0% | Free | None |
| Stripe | 2.9% + $0.30 | N/A | Free | None |

---

## 🔒 SECURITY NOTES

### Demo Mode Safety
- All transactions are simulated
- No real money moves
- Test cards only
- Mock crypto addresses

### Going Live Safety
- Use environment variables for keys
- Never commit live keys to git
- Enable webhook signature verification
- Monitor transactions closely
- Set up alerts for failed payments

---

## 🆘 TROUBLESHOOTING

### "No API key found"
→ Gateway running in demo mode. Add live keys to `.env`

### "Payment failed"
→ Check gateway status in dashboard
→ Verify API keys are correct
→ Check webhook configuration

### "Crypto payment not confirming"
→ Demo mode doesn't use real blockchain
→ Live mode requires blockchain confirmations

### "Gateway not showing"
→ Check if enabled in gateway config
→ Verify API keys are set
→ Check routing rules

---

## 📞 SUPPORT CONTACTS

| Gateway | Support URL |
|---------|-------------|
| GeeniusPay | https://scan.geeniuspay.com/support |
| NMI | https://secure.nmi.com/support |
| Payra | https://payra.com/support |
| CryptoProcessing | https://cryptoprocessing.com/support |

---

## 📁 RELATED FILES

- `functions/payments/geeniuspay/checkout.ts`
- `functions/payments/nmi/checkout.ts`
- `functions/payments/payra/checkout.ts`
- `functions/payments/cryptoprocessing/checkout.ts`
- `functions/payments/gatewayRouter.ts`
- `.env` - Environment variables

---

**Last Updated:** February 7, 2026  
**Status:** DEMO MODE - Ready for live activation
