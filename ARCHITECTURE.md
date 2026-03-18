# Architecture & Design Decisions

## Why App Router?

### Compared to Pages Router (Legacy)

| Feature | App Router | Pages Router |
|---------|-----------|--------------|
| Server Components | ✅ Default | Opt-in |
| Streaming | ✅ Native | Manual setup |
| Layouts | ✅ Nested | Global only |
| Loading States | ✅ Automatic | Manual |
| Error Handling | ✅ Error boundaries | Basic |
| API Routes | ✅ Simpler | File-based |
| TypeScript | ✅ Better inference | Good |
| Future Support | ✅ Active development | Maintenance mode |

### Key Advantages for SkillSync

1. **Real-Time AI Responses**
   - Server Components allow streaming AI responses directly from server
   - No JSON serialization overhead
   - Immediate to browser, no round-trips

2. **Layout System**
   - Route groups `(auth)`, `(student)`, `(faculty)` enable different layouts per section
   - Avoid prop-drilling between nested routes
   - Automatic layout persistence on navigation

3. **Built-in Loading & Error Handling**
   - `loading.tsx` for pending states during data fetching
   - `error.tsx` for graceful error boundaries
   - No need for third-party error handling

4. **Better TypeScript Support**
   - Automatic type inference for route parameters
   - Searchparams and params properly typed
   - Less boilerplate

---

## Dependency Architecture

### State Management: Zustand vs Redux

**Why Zustand**
- 2KB vs Redux's 50KB (25x smaller)
- No action/reducer boilerplate
- Direct mutations with Immer support
- Perfect for medium-scale apps like MVP
- DevTools support available

**Use Cases**
```typescript
// Global state: AI model selection, user preferences
// Per-feature state: Form data, modal visibility
// Cache: Recent interviews, resumes
```

**Not Recommended For**
- Heavy time-travel debugging (consider Redux DevTools)
- Extremely large state trees (consider MobX)

---

### Database: Drizzle ORM + Supabase PostgreSQL

**Why Drizzle Over Prisma/TypeORM**

| Aspect | Drizzle | Prisma | TypeORM |
|--------|---------|--------|---------|
| Bundle Size | 13KB | 40KB | 70KB |
| Generated SQL | Full control | Limited | Moderate |
| Raw Queries | ✅ Easy | Possible | ✅ Easy |
| Type Safety | Perfect | Good | Good |
| Migration Speed | ✅ Manual | Auto | ✅ Manual |
| Free Tier Friendly | ✅ Yes | Yes | Yes |

**Why Supabase**
- Open-source PostgreSQL (not vendor lock-in)
- Built-in Auth (eliminates Auth0 dependency)
- Real-time subscriptions (perfect for interviews/live notifications)
- Row-Level Security (RLS) for multi-tenant safety
- Free tier: 500MB, unlimited connections, serverless functions

---

### Forms: React Hook Form + Zod

**Why This Combo**
- Minimal re-renders (RHF only re-renders changed fields)
- Zod for runtime validation AND TypeScript definitions
- Zero external state serialization
- Perfect validation error handling
- 10KB combined vs Formik's 30KB

**Example Pattern**
```typescript
// Single source of truth: Zod schema
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// TypeScript automatically inferred from schema
type FormData = z.infer<typeof schema>;

// React Hook Form + Zod integration
const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

---

### UI Components: Tailwind CSS + Lucide React + CVA

**Why Tailwind (Not Bootstrap/Material-UI)**
- Utility-first: Only ship CSS you use (~2-3KB for typical app)
- No class naming debates
- Perfect control over styling
- Mobile-first responsive design
- Dark mode support built-in

**Why Lucide React (Not FontAwesome)**
- 600+ icons, all tree-shakeable
- Icon customization (size, color, stroke-width)
- Much smaller than icon fonts
- React components (not separate asset)

**Why CVA (Class Variance Authority)**
- Compose component variants without CSS-in-JS
- Type-safe style variants
- Smaller than styled-components (3KB vs 14KB)

**Example**
```typescript
const button = cva('px-4 py-2 rounded font-semibold', {
  variants: {
    intent: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-gray-200 text-gray-900',
    },
    size: {
      sm: 'text-sm px-2 py-1',
      lg: 'text-lg px-6 py-3',
    },
  },
});

<button className={button({ intent: 'primary', size: 'lg' })}>
  Click me
</button>
```

---

### AI/NLP: Multi-Provider Strategy

**Why Multiple AI Providers**

| Provider | Model | Speed | Cost | Use Case |
|----------|-------|-------|------|----------|
| Google Gemini | Gemini 1.5  | Fast | Free tier | Interview Q&A |
| Groq | Llama 3.1 | ⚡ Ultra-fast | Free tier | Real-time chat |
| Mistral | Mistral 7B | Fast | Free tier | Fallback |
| Google Gemini | text-embedding-004 | Fast | Free | Embeddings (768-dim) |

**Fallback Strategy**
```typescript
// Try Groq first (fastest), fallback to Google, then Mistral
const providers = [
  // { name: 'groq', apiKey: process.env.GROQ_API_KEY },
  // { name: 'google', apiKey: process.env.GOOGLE_API_KEY },
  // { name: 'mistral', apiKey: process.env.MISTRAL_API_KEY },
  // Local fallback (no API key needed)
  { name: 'local', model: 'Xenova/distilbert-base-uncased' },
];
```

**Why Google Gemini Embeddings**
- Industry-standard embeddings with 768-dimensional context
- Seamless integration with the SkillSync multi-provider strategy
- High quality and performance for semantic matching
- Centralized management via Antigravity Router

---

### Why NOT These Common Choices

#### ❌ Redux instead of Zustand
- Extra boilerplate (actions, reducers, selectors)
- Slower for small-to-medium apps
- Larger bundle size

#### ❌ Prisma instead of Drizzle
- Limited control over generated SQL
- Heavier bundle impact
- Migration auto-generation (nice but adds magic)

#### ❌ Firebase instead of Supabase
- Vendor lock-in (can't migrate easily)
- Less SQL flexibility
- More expensive long-term

#### ❌ NextAuth.js instead of Supabase Auth
- More setup and customization needed
- Heavier maintenance
- Supabase integrates perfectly with Next.js

#### ❌ Shadcn/ui instead of rolling custom
- Over-engineered for MVP
- Extra CSS imports
- Tailor UI more easily with vanilla Tailwind

---

## Free-Tier Optimization Principles

### 1. Minimize Bundle Size
- All libraries chosen for small footprints
- Tree-shaking friendly (ES modules)
- No unused code in production

### 2. Minimize API Calls
- Cache intelligently (SWR, React Query not needed yet)
- Batch requests
- Use local inference where possible

### 3. Minimize Database Queries
- Optimize Drizzle queries (no N+1)
- Use database views for complex queries
- Pagination from day 1

### 4. Minimize Deployment Size
- No source maps in production
- Automatic Next.js compression
- Optimized static generation

### 5. Choose Free-Tier Services
- Vercel (Next.js creator, best integration)
- Supabase (5$ credit, $25 if exceeded)
- Free AI APIs (Google, Groq, Mistral)
- No paid Stripe until revenue

---

## Scalability Path

### Millions of Free Users
1. ✅ Use database indexes intelligently
2. ✅ Implement caching (Redis, Cloudflare KV)
3. ✅ Real-time features via Supabase subscriptions
4. ✅ Offload heavy processing to background jobs
5. ✅ CDN for static assets (Vercel auto-includes)

### Transitioning to Paid
1. Keep free tier as onboarding → paid conversion
2. Add Stripe payments (no monthly costs until needed)
3. Upgrade Supabase to Pro ($10/month)
4. Scale AI calls via batching or preprocessing

---

## Testing Strategy

### Unit Testing (Vitest)
- API utilities
- Validation functions (Zod)
- State mutations (Zustand)

### Integration Testing (@testing-library/react)
- Form submissions
- Component interactions
- API mocking

### E2E Testing (Future: Playwright/Cypress)
- User flows
- Authentication
- Payment processing

### Why Not Included Yet
- MVP stage: Manual testing during development
- Can be added in Phase 2 with higher confidence in requirements

---

## Security Considerations

### Authentication
- NextAuth JWT session strategy with role claims (student, faculty, admin)
- Microsoft OAuth (tenantId=common) for student login and existing staff OAuth login
- Staff credentials provider for faculty/admin email + password login

#### Auth Flow (Phase 1)
- Student flow: Microsoft OAuth -> if email domain matches student domain and user does not exist, auto-create user + student profile -> role=student.
- Existing user OAuth flow: any email domain is allowed if user already exists in database; preserves faculty/admin login via Microsoft.
- Staff credentials flow: faculty/admin can log in with email/password; password is bcrypt-hashed.
- Redirect callback: only performs safe URL validation (relative or same-origin) and does not override role routing.
- Home routing: app/page.tsx performs role-based destination routing to student dashboard, faculty dashboard, or admin health.

#### Password Management
- Admin create faculty: password optional; system auto-generates strong password when omitted and returns plaintext once in response.
- Admin reset password: admin can reset faculty/admin passwords without current-password verification.
- Self-service change password: faculty/admin must provide current password and a strong new password.
- Students do not have local passwords and continue to authenticate through Microsoft OAuth.

#### Migration Safety Guard
- Drizzle schema push/generate is blocked by default via DRIZZLE_MIGRATIONS_ENABLED guard in drizzle.config.ts.
- Schema changes are expected to be applied manually via Supabase SQL Editor in controlled environments.

### Data Protection
- PostgreSQL Row-Level Security (RLS)
- Environment variables for secrets
- HTTPS enforced on deployment

### API Security
- Rate limiting (via Supabase functions)
- Input validation (Zod)
- CORS configured
- No secrets in client code

---

## Developer Experience (DX)

### TypeScript Everywhere
- Catch errors during development
- Better IDE autocompletion
- Refactoring confidence

### Hot Module Replacement (HMR)
- Edit code, see changes instantly
- State preserved when possible
- Fast feedback loop

### Error Messages
- Next.js overlay during dev
- Stack traces in console
- Helpful TypeScript errors

---

## Conclusion

This architecture prioritizes:
1. **Simplicity**: Understand all moving parts
2. **Scalability**: Foundation supports growth
3. **Cost**: Free or cheap long-term
4. **Developer Experience**: Happy developers = fast shipping
5. **Type Safety**: TypeScript everywhere

The MVP is intentionally minimal: no unnecessary abstractions, no premature optimization. Features and complexity can be added incrementally based on user needs.
