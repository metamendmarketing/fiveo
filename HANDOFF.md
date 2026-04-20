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
- **Components**: `/app/components/` contains reusable UI elements like `MobileNav.tsx`.
- **Global Styles**: `/app/globals.css` manages fluid typography and cross-browser normalization.
- **Glassmorphism**: UI uses a consistent frosted-glass aesthetic defined in CSS variables and utility classes.

### 2. The Data Pipeline (`/scripts`)
- All raw data processing occurs in this directory.
- Refer to [scripts/README.md](file:///Users/kevin/Documents/FiveO/scripts/README.md) for execution sequence.
- Data flows from `data/raw/` -> `data/normalized/` -> **Supabase**.

### 3. The Database
- Supabase is used primarily as a read-heavy catalog for the Oracle's vehicle fitment engine.
- Tables: `makes`, `models`, `years`, `engines`, `products`, `product_fitment`.

## 🛠 Next Steps for Development

- [ ] **Wizard Logic**: Implement the client-side state machine for the Fuel Injector Oracle wizard on the home page.
- [ ] **Data Fetching**: Hook up the wizard to Supabase RPCs or API routes to fetch real-time matching injectors.
- [ ] **Calculations**: Port the technical flow rate and horse-power calculation logic (refer to `FiveO_Project_Oracle_Update.docx` in `data/docs/` for specs).

## 🔑 Environment Setup

1. Copy `.env.example` to `.env`.
2. Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are populated.
3. Run `npm install` and `npm run dev`.

## ⚠️ Notes for Success
- **Zero Regression**: The layout is pixel-perfect to FiveO's brand guidelines. Be very careful with layout shifts when adding new components.
- **Fluid Typography**: Use the `--text-` variables (e.g., `var(--text-hero)`) instead of hardcoded font sizes.
- **Touch Targets**: All interactive elements MUST meet the 44px minimum touch target requirement (defined in `globals.css`).
