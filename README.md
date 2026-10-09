# HIPPOCRATES — AI Clinical Copilot
> **AI for Accessible Health Awareness**

Hippocrates is a clinical-grade AI platform comprising two core components:
1. **Aegis** — Patient-facing health intelligence offering conversational triage, multimodal clinical report & medical photograph interpretation, context-aware follow-up questioning, emergency-stopping gates for red flags, and real-time voice interactions via ElevenLabs Conversational AI (**Aegis Pro**).
2. **Oracle** — Doctor-facing clinical copilot providing structured clinical case synthesis, differential diagnosis guidance, and professional clinical documentation support.

---

## 1. Prerequisites

- **Node.js**: `v20.x` or `v24.x` (LTS recommended)
- **Package Manager**: `npm` (v10+ or v11+)
- **Google AI Studio API Key**: For Google Gemini (Primary Clinical Engine)
- **Supabase Project** *(Optional for local mock mode; required for persistent cloud data)*
- **ElevenLabs Account** *(Optional; required only for Aegis Pro real-time voice)*

---

## 2. Environment Configuration

Copy the template `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Populate `.env.local` using your own secrets. **NEVER commit `.env.local` or active credentials to Git.**

```env
# 1. AI Engine: Google Gemini (Server-side only)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# 2. Voice AI: ElevenLabs (Server-side only)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
AEGIS_PRO_AGENT_ID=your_elevenlabs_agent_id_here

# 3. Supabase (Database & Storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_jwt_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# 4. Administrator Authentication & Session Security (Required in Production)
ADMIN_SESSION_SECRET=generate_a_random_min_32_character_secret_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_strong_admin_password_here
```

---

## 3. Local Development & Verification Commands

All standard scripts are managed through `package.json`:

```bash
# Install dependencies
npm install

# Run development server (accessible at http://localhost:3000)
npm run dev

# Run full automated regression test suite (Clinical safety, isolation, security)
npm run test

# Run strict TypeScript typechecking
npm run typecheck

# Run Next.js and ESLint code quality checks
npm run lint

# Compile optimized production build
npm run build
```

---

## 4. Architecture & Security Model

### A. Consultation Isolation & Patient Data Ownership
- **Consultation Tokens**: Every patient session generates an unguessable cryptographic consultation identifier (`hippocrates_client_session` signed cookie or `x-consultation-token` header).
- **Endpoint Scoping**: All clinical endpoints (`/api/cases`, `/api/cases/[id]`, `/api/cases/[id]/patient-info`, `/api/clinical/generate-pdf`) strictly verify ownership. User A cannot list, read, edit, delete, or generate PDFs for User B's consultations.
- **Quarantine**: New consultations are initialized with zero state carryover. Stale messages and previous assessments are completely quarantined from the AI prompt context.

### B. In-Memory Protection & Payload Scalability
- **Bounded Caches**: Authoritative memory structures (`BoundedCaseCache`, `BoundedDocCache`) enforce strict 100-entry capacity limits with 30-minute TTLs and LRU eviction, eliminating potential out-of-memory denial-of-service risks.
- **Base64 Sanitization**: Oversized raw Base64 data URLs (>50KB) are filtered out prior to persistence, preventing database JSONB bloat.

### C. Admin Authentication
- **Timing-Safe Constant Comparison**: Authentication uses `bcrypt.compare` for password verification and `timingSafeEqual` for session signature checks, preventing timing attacks.
- **No Password-Bypass Flaws**: Arbitrary length and prefix bypass vectors have been completely removed.
- **Brute-Force Throttling**: In-memory rate limiting enforces a maximum of 5 failed attempts per 5 minutes per username before returning `429 Too Many Requests`.

### D. AI Provider & Model Fallback Strategy
- **Primary Clinical Engine**: Google Gemini powers Aegis and Oracle. Requests execute server-side via `@google/genai`.
- **Controlled Fallback Sequence**: Aegis and Oracle support graceful fallback across standard models:
  1. Configured preference (`gemini-2.5-flash` by default)
  2. `gemini-2.0-flash`
  3. `gemini-1.5-flash`
- **Safety Boundaries**: Rigid blacklists on standard models have been removed while enforcing model parameter validation. Non-functional external providers (OpenAI) are categorized under planned future extensions in the Admin Console.

---

## 5. Supabase Database & RLS Migrations

The database schema and Row Level Security policies are located under `supabase/migrations/`:
- `001_initial_schema.sql`: Initial table schemas for sessions, messages, reports, and settings.
- `20260818_harden_rls_security.sql`: **Security hardening migration** that eliminates anonymous `user_id IS NULL` loopholes and restricts read/write policies to verified owners.

### Applying Migrations Safely
To apply migrations against your Supabase instance:
```bash
# Using Supabase CLI (Recommended)
supabase db push

# Or via the Supabase Dashboard:
# Paste and execute supabase/migrations/20260818_harden_rls_security.sql in the SQL Editor.
```
*Note: Service-role backend operations enforce ownership at the application boundary.*

---

## 6. Clinical Scope & Disclaimer

- **Hippocrates Aegis** is an informational AI health awareness and preliminary triage tool. It does **not** provide definitive diagnoses, establish a physician-patient relationship, or write binding medical prescriptions.
- Draft prescription outputs are explicitly watermarked **"Prescription Draft — Clinician Review Required"**.
- Emergency clinical presentations (chest pain, stroke signs, respiratory distress) immediately activate emergency stopping gates, prioritizing urgent in-person medical care over routine questioning.

---

## 7. Deployment Readiness Checklist

Before promoting to production:
- [ ] Ensure `ADMIN_SESSION_SECRET` is set to a strong 32+ character random string in production environment.
- [ ] Update `ADMIN_PASSWORD` from default to a strong, unique administrative password.
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is kept server-side and never exposed to client-side bundles.
- [ ] Run `supabase/migrations/20260818_harden_rls_security.sql` in your production Supabase database.
- [ ] Run `npm run test`, `npm run typecheck`, and `npm run lint` in your CI/CD pipeline.
- [ ] Ensure HTTPS termination is active so that `Secure; HttpOnly; SameSite=Lax` cookies function correctly.
- [ ] Complete jurisdiction-specific regulatory and legal reviews (e.g., HIPAA / GDPR / MDR) before storing real patient records.
