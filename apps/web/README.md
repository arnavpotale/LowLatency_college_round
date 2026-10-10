# Second Opinion — Frontend Web Application

**Primary Owner:** Developer 1 — Frontend

## Technology Stack
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS with custom verdict palettes
- **Icons:** Lucide React
- **Contract:** Shared TypeScript types (`src/types/index.ts`) matching backend schemas

## Quick Start
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend will run at [http://localhost:5173](http://localhost:5173).

## Production Build & Typecheck
```bash
npm run build
```

## Directory Structure
```
apps/web/
├── src/
│   ├── components/         # Shared UI components (Navbar, VerdictBadge)
│   ├── features/
│   │   ├── audit/          # Audit form, summary cards, trust gauge
│   │   ├── claims/         # Claim cards, claim filtering, answer highlighter
│   │   ├── evidence/       # Evidence excerpt viewer with relevance scores
│   │   ├── reports/        # Executive audit report modal & markdown export
│   │   └── sources/        # Drag-and-drop file upload & text paste
│   ├── mocks/              # Mock findings for offline development & sample cases
│   ├── services/           # Backend API client with graceful fallbacks
│   ├── types/              # Shared data contract interfaces
│   ├── App.tsx             # Root application orchestrator
│   ├── index.css           # Tailwind design tokens
│   └── main.tsx            # Vite DOM entrypoint
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

## Developer 1 Responsibilities
- Application layout and responsive audit workspace.
- Audit input form and document drag-and-drop uploader.
- Interactive Unicode character offset highlighting in the original answer.
- Claim filtering by verdict category (`supported`, `contradicted`, `unsupported`, `ambiguous`, `inconclusive`).
- Evidence card drill-down and audit report export.
- Connecting to the live FastAPI backend via `src/services/api.ts` or utilizing simulated mocks during offline iteration.
