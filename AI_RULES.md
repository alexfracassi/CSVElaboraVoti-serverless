# AI Rules for CSV Elabora Voti

## Tech Stack Overview

- **Framework**: Next.js 15 with App Router (React 19)
- **Language**: TypeScript 5.x with strict type checking
- **Styling**: Tailwind CSS 3.4 with CSS variables for theming (HSL color system)
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Icons**: Lucide React for consistent iconography
- **File Parsing**: PapaParse for CSV files, xlsx for Excel files
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **Notifications**: Sonner for toast notifications
- **Date Handling**: date-fns for date manipulation

---

## Library Usage Rules

### UI Components
- **ALWAYS** use shadcn/ui components from `@/components/ui/*` for buttons, cards, dialogs, forms, tables, etc.
- **NEVER** create custom implementations of components that already exist in shadcn/ui
- Import components like: `import { Button } from "@/components/ui/button"`

### Styling
- **ALWAYS** use Tailwind CSS utility classes for styling
- **ALWAYS** use the theme CSS variables (e.g., `bg-primary`, `text-muted-foreground`, `border-border`)
- **NEVER** use inline styles or create separate CSS files for component styling
- **NEVER** use arbitrary color values; use the defined color palette

### Icons
- **ALWAYS** use Lucide React for icons: `import { IconName } from "lucide-react"`
- **NEVER** use other icon libraries or inline SVGs

### File Parsing
- **ALWAYS** use PapaParse for CSV file parsing
- **ALWAYS** use xlsx library for Excel (.xlsx, .xls) file parsing
- Import as: `import Papa from "papaparse"` and `import * as XLSX from "xlsx"`

### Charts & Data Visualization
- **ALWAYS** use Recharts for charts and graphs
- Use components like `BarChart`, `LineChart`, `PieChart` from recharts

### Forms & Validation
- **ALWAYS** use React Hook Form for form state management
- **ALWAYS** use Zod for schema validation
- Use `@hookform/resolvers` to connect Zod with React Hook Form

### Notifications
- **ALWAYS** use Sonner for toast notifications
- Import as: `import { toast } from "sonner"`
- Use `toast.success()`, `toast.error()`, `toast.info()`, etc.

### Date Handling
- **ALWAYS** use date-fns for date formatting and manipulation
- **NEVER** use native Date methods for formatting

---

## Project Structure Rules

### File Organization
```
src/
├── app/           # Next.js App Router pages and layouts
├── components/    # React components
│   └── ui/        # shadcn/ui components (DO NOT EDIT)
├── hooks/         # Custom React hooks
└── lib/           # Utility functions and business logic
```

### Naming Conventions
- Components: PascalCase (e.g., `FileUploadZone.tsx`)
- Utilities/libs: kebab-case (e.g., `file-parser.ts`)
- Hooks: camelCase with `use` prefix (e.g., `use-mobile.tsx`)

### Component Guidelines
- Keep components under 100 lines when possible
- Create new files for new components (never add to existing files)
- Use `"use client"` directive only when client-side features are needed

---

## Code Style Rules

### TypeScript
- **ALWAYS** define proper types and interfaces
- **NEVER** use `any` type
- Export types when they may be reused

### Imports
- Use path aliases: `@/components/*`, `@/lib/*`, `@/hooks/*`
- Group imports: React, third-party, local components, utilities

### Error Handling
- Let errors bubble up naturally (don't catch unless specifically needed)
- Use toast notifications to inform users of errors

---

## Language
- The application is in **Italian** (lang="it")
- UI text, labels, and messages should be in Italian