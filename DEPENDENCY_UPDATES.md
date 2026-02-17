# Dependency Update Script for 200X Performance

## Safe Updates (Non-Breaking)

```bash
# Run these first - should be safe
npm update @base44/sdk @base44/vite-plugin
npm update @tanstack/react-query
npm update framer-motion
npm update react-hook-form
npm update lucide-react
npm update autoprefixer
npm update @eslint/js eslint-plugin-*
```

## Major Version Updates (Test Required)

```bash
# React 19 - Check for Concurrent Mode compatibility
npm install react@19 react-dom@19
npm install -D @types/react@19 @types/react-dom@19 @types/node

# ESLint 10
npm install eslint@10

# Zod 4
npm install zod@4

# TailwindCSS 4 (may require config migration)
npm install tailwindcss@4

# Vite 7
npm install vite@7

# Stripe (critical for payments - test thoroughly!)
npm install @stripe/react-stripe-js@5 @stripe/stripe-js@8

# React Router 7
npm install react-router-dom@7
```

## Post-Update Checklist

- [ ] Run `npm run build` - no errors
- [ ] Run `npm run test:run` - all tests pass
- [ ] Run `npm run typecheck` - no type errors
- [ ] Run `npm run lint` - no lint errors
- [ ] Manual smoke test - critical user flows work
- [ ] Payment flow tested (Stripe upgrade)
- [ ] Admin dashboard loads correctly
