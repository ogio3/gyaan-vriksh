# The Eternal Tree — Gyaan Vriksh (ज्ञान वृक्ष)

An AI-powered knowledge tree that transforms textbook passages into interactive exploration branches — career paths, deeper topics, cross-disciplinary connections, and thought-provoking questions.

Built for students aged 10-17. Compliant with COPPA 2025, UAE Federal Decree-Law No. 26/2025, EU AI Act, and Japan APPI.

## Philosophy

**"Build the complete product, but only ship the demo."**

The public deployment is a frictionless demo — one click to experience the core AHA moment. The full platform (classes, dashboard, parental controls, compliance) lives in this repository for schools to self-host.

## Live Demo

The public URL is a **demo-only** experience. No sign-up. No login. One click.

A dry textbook paragraph transforms into a knowledge tree with career paths, deeper topics, and connections you never expected. Click any node to explore deeper — infinitely.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                    Demo (Public)                 │
│  Landing → Typewriter → "Grow" → Streaming Tree │
│  Click node → Expand (infinite depth)            │
│  No auth, no DB, IP rate-limited                 │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────┐
│               Full Platform (Self-Host)          │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Students  │  │ Teachers │  │ Parents  │      │
│  │ Join code │  │Dashboard │  │Controls  │      │
│  │ Age gate  │  │Analytics │  │Time limit│      │
│  │ Explore   │  │Reports   │  │Pause/Del │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │           Safety Pipeline                 │   │
│  │  Input Filter → Claude API → Output Filter│   │
│  │  PII Detection │ UAE Standards │ Persp.API│   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │         Supabase (PostgreSQL)             │   │
│  │  10 tables │ RLS policies │ Auth (3 roles)│   │
│  └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

### Core UX: The Infinite Tree

- **Bottom-to-Top**: Root (textbook) at bottom, branches grow upward toward the sky
- **Streaming**: Nodes appear in real-time as Claude generates them — no fake loading
- **Rabbit Hole**: Click any node to expand deeper. Infinite depth. No dead ends
- **Focus & Peripheral**: Clicked node = 100% opacity, neighbors = 70%, rest = 35%
- **Grid**: Dot grid background for spatial awareness of how deep you've explored

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 + React 19 + TypeScript |
| AI | Anthropic Claude Sonnet 4 (Vercel AI SDK, streaming) |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Tree Layout | d3-hierarchy (bottom-to-top) |
| i18n | next-intl (English, Hindi, Punjabi, Japanese) |
| Offline | Serwist (Service Worker + IndexedDB) |
| Schema | Zod 4 (AI structured output validation) |

## Quick Start (Demo Only)

To run just the demo locally (no database needed):

```bash
git clone https://github.com/gyaan-vriksh/gyaan-vriksh.git
cd gyaan-vriksh
pnpm install
echo "ANTHROPIC_API_KEY=your-key-here" > .env.local
pnpm dev
# Open http://localhost:3000/demo
```

## Full Platform Setup

For the complete platform with student/teacher/parent roles:

### Prerequisites

- Node.js 20+
- Docker (for local Supabase)
- Anthropic API key
- Google Perspective API key (optional, recommended)

### Steps

```bash
# 1. Clone and install
git clone https://github.com/gyaan-vriksh/gyaan-vriksh.git
cd gyaan-vriksh
pnpm install

# 2. Start local Supabase (applies migrations automatically)
supabase start

# 3. Configure environment
cp .env.example .env.local
# Fill in the keys from `supabase status -o env` output

# 4. Run
pnpm dev
```

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Supabase (from `supabase status -o env`)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional
PERSPECTIVE_API_KEY=AIza...        # Content safety (fail-safe if missing)
CONTENT_STANDARDS=international    # international | uae | eu | us
```

### Database Schema

10 tables with Row Level Security:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (extends Supabase Auth) |
| `classes` | Teacher-created classes with join codes |
| `class_memberships` | Student-class links |
| `exploration_sessions` | Exploration metadata (passage hash, bloom level) |
| `exploration_branches` | Tree branches (recursive, typed, bloom-classified) |
| `content_reports` | Student/teacher/parent content reports |
| `parent_child_links` | Parent-child relationships with consent tracking |
| `parent_settings` | Parental controls (time limits, scope, pause) |
| `daily_usage` | Age-tiered daily exploration limits |
| `consent_audit_log` | COPPA-compliant consent audit trail |

See [supabase/migrations/00001_v2_foundation.sql](supabase/migrations/00001_v2_foundation.sql) for the complete schema.

## Compliance Documentation

| Document | Purpose |
|----------|---------|
| [SECURITY.md](SECURITY.md) | Information Security Program (COPPA 2025) |
| [docs/RISK_REGISTER.md](docs/RISK_REGISTER.md) | AI Risk Register (EU AI Act Art. 9) |
| [docs/AI_MODELS.md](docs/AI_MODELS.md) | AI Model Governance (EU AI Act Art. 10) |
| [docs/TECHNICAL_DOC.md](docs/TECHNICAL_DOC.md) | Technical Documentation (EU AI Act Art. 11) |
| [docs/HUMAN_OVERSIGHT.md](docs/HUMAN_OVERSIGHT.md) | Human Oversight Design (EU AI Act Art. 14) |
| [docs/INCIDENT_RESPONSE.md](docs/INCIDENT_RESPONSE.md) | Incident Response Protocol |
| [docs/REGULATORY_TRACKER.md](docs/REGULATORY_TRACKER.md) | Phase 5 Regulatory Monitoring |
| [docs/FRIA_TEMPLATE.md](docs/FRIA_TEMPLATE.md) | Fundamental Rights Impact Assessment Template |
| [docs/SELF_HOST.md](docs/SELF_HOST.md) | Self-Hosting Guide (including UAE school deployment) |
| [docs/VIRTUAL_WORLD_POLICY.md](docs/VIRTUAL_WORLD_POLICY.md) | Virtual World Policy Statement |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── demo/explore/       # Demo API (no auth, IP rate-limited)
│   │   ├── demo/expand/        # Demo expand API (Rabbit Hole)
│   │   ├── explore/start/      # Full: start exploration (auth required)
│   │   ├── explore/expand/     # Full: expand branch (auth required)
│   │   ├── auth/               # Supabase auth callbacks
│   │   ├── classes/            # Class CRUD
│   │   ├── dashboard/          # Teacher analytics
│   │   ├── reports/            # Content reports
│   │   ├── parent/             # Parent APIs
│   │   └── compliance/         # Compliance reports + ISP traffic
│   └── [locale]/
│       ├── (public)/demo/      # Demo page (the AHA experience)
│       ├── (public)/privacy/   # Privacy notice + data retention
│       ├── (public)/join/      # Student + parent join flows
│       ├── (protected)/explore/ # Full exploration (auth)
│       ├── (protected)/dashboard/ # Teacher dashboard
│       └── (protected)/parent/ # Parent controls
├── components/
│   ├── TreeCanvas.tsx          # The Infinite Tree (d3 + Framer Motion)
│   ├── layout/AppShell.tsx     # Role-aware navigation
│   └── safety/ShareGuard.tsx   # Anti-sharentism protections
├── lib/
│   ├── safety/                 # 4-layer content safety pipeline
│   ├── supabase/               # Supabase SSR client
│   ├── compliance/             # Compliance report generator
│   └── auth.ts                 # Auth guards
├── types/
│   ├── tree.ts                 # TreeNode (recursive, typed)
│   └── database.ts             # Database types (10 tables)
└── i18n/                       # 4-language routing
```

## License

MIT License.
