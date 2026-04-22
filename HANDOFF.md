# FiveO Fuel Injector Oracle — Developer Handoff

Welcome to the FiveO project. This application is a technical sizing assistant for high-performance fuel injectors, powered by a sophisticated data pipeline and a bleeding-edge Next.js frontend.

## 🚀 Tech Stack Overview

> [!IMPORTANT]
> This project uses an advanced, unconventional tech stack. Please adhere to these versions to avoid breaking the layout or build.

- **Frontend**: Next.js 16.2.3 (App Router)
- **React**: 19.2.4
- **Styling**: Tailwind CSS 4 & PostCSS 4
- **Database**: Supabase (PostgreSQL)
- **Pipeline**: Python 3 & Ruby

## 📂 Architecture

### 1. The Frontend (`/app`)
- **App Router**: Standard Next.js arrangement.
- **Oracle Wizard**: Located in `/app/components/oracle/`. Orchestrates the multi-step build profile capture.
- **Global Types**: `/app/lib/types.ts` centralizes all core domain interfaces (`Product`, `ScoredProduct`, `BuildProfile`, etc.).
- **Global Styles**: `/app/globals.css` manages fluid typography and cross-browser normalization.
- **Glassmorphism**: UI uses a consistent frosted-glass aesthetic defined in CSS variables and utility classes.

### 2. The Oracle Engine (`/app/lib`)
- **Heuristic Scoring**: `scoring.ts` contains the weighted ranking engine that pre-filters the catalog based on vehicle fitment and user priorities.
- **Rules Engine**: `scoring-rules.json` allows for tuning the heuristic weights without touching code.
- **Constants**: `constants.ts` defines technical formulas for flow rate (CC/min) and HP calculations.

### 3. AI Refinement (`/app/api/oracle`)
- **Pipeline**: Heuristic → Pool Expansion → AI Synthesis (Gemini 2.5 Flash) → Final Selection.
- **Persona**: The AI acts as a "Senior Fuel Injection Consultant", providing conversational narratives and technical "Pro Tips".

### 4. The Data Pipeline (`/scripts`)
- All raw data processing occurs in this directory.
- Refer to [scripts/README.md](file:///Users/kevin/Documents/FiveO/scripts/README.md) for execution sequence.
- Data flows from `data/raw/` -> `data/normalized/` -> **Supabase**.

### 5. The Database
- Supabase is used primarily as a read-heavy catalog for the Oracle's vehicle fitment engine.
- Tables: `makes`, `models`, `years`, `engines`, `products`, `product_fitment`.

## ✅ Completed Milestones

- [x] **Wizard Logic**: Fully implemented state machine with cascading vehicle lookups and logical branching.
- [x] **Type Safety**: Centralized interfaces in `types.ts` with 0% 'any' usage in core logic.
- [x] **AI Synthesis**: Integrated Gemini 2.5 Flash for high-fidelity personalized recommendations.
- [x] **Scoring Engine**: Refactored heuristic engine with documented rules and weighted priorities.

## 🛠 Next Steps for Development

- [ ] **E2E Testing**: Conduct full integration tests of the vehicle cascading dropdowns.
- [ ] **Performance Tuning**: Monitor AI response latency and consider streaming responses for the "selectionStrategy".
- [ ] **Data Expansion**: Continue normalizing motorcycle and marine fitment data in `/scripts`.

## 🔑 Environment Setup

1. Copy `.env.example` to `.env`.
2. Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are populated.
3. For AI features, provide `VERTEX_CREDENTIALS_JSON` (Vercel) or `vertex-key.json` (Local).
4. Run `npm install` and `npm run dev`.

## ⚠️ Notes for Success
- **Zero Regression**: The layout is pixel-perfect to FiveO's brand guidelines. Be very careful with layout shifts when adding new components.
- **Fluid Typography**: Use the `--text-` variables (e.g., `var(--text-hero)`) instead of hardcoded font sizes.
- **Touch Targets**: All interactive elements MUST meet the 44px minimum touch target requirement (defined in `globals.css`).
- **ESLint**: Always run `npm run lint` before committing; the project enforces strict type checking.
