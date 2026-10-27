# AGENTS.md — AI Agent Architecture & Navigation Manual

Welcome to **Soul Bites** — a high-performance, modular Cloud Kitchen food ordering web application built with **React 18**, **TypeScript**, **Vite**, and **Vanilla CSS Modules**.

This document is the permanent instruction guide for AI coding assistants. Read this before planning or making any modifications to the codebase.

---

## 1. Core Architectural Principles

1. **Feature-Driven Modularity**:
   Code is organized by business domain/feature (`src/features/`), not purely by technical category. Each feature folder owns its components, hooks, services, validation, and types.

2. **Strict Brand Identity & Color Palette**:
   Always use the defined design tokens located in `src/styles/tokens.css`:
   - **Charcoal Black**: `#1C1C1C` (Primary background, deep cards, high contrast surfaces)
   - **Golden Yellow**: `#F5B700` (Brand accent, primary CTAs, active highlights)
   - **Cream White**: `#FFF8E6` (Text, headlines, soft borders, warm accents)
   *Never hardcode arbitrary hex colors.* Always reference CSS variables such as `var(--color-charcoal-black)`, `var(--color-golden-yellow)`, and `var(--color-cream-white)`.

3. **Loose Coupling & Single Responsibility**:
   - UI primitives (`src/components/ui/`) have zero domain knowledge.
   - Domain logic lives in services (`*Service.ts`) or pure validation modules (`*Validation.ts`).
   - State management is localized: Cart state lives in `CartContext.tsx`; page-level UI state is in parent controllers.

---

## 2. Directory Structure Map

```text
soul-bites/
├── AGENTS.md                                # Root AI manual & navigation rules (this file)
├── docs/
│   └── PROJECT_MAP.md                       # Feature-to-file path mapping & changelog
├── public/                                  # Static public assets & favicons
├── src/
│   ├── assets/                              # Static media, icons, and illustrations
│   ├── components/                          # Shared UI & layout components
│   │   ├── layout/                          # Global chrome (Navbar, Footer)
│   │   │   ├── Navbar/                      # Header navigation, brand badge, cart toggle
│   │   │   └── Footer/                      # Kitchen standards, operational info, legal
│   │   └── ui/                              # Dumb, reusable design system primitives
│   │       ├── Badge/                       # Dietary & highlight badges
│   │       ├── Button/                      # Buttons (primary, secondary, outline, ghost)
│   │       └── Modal/                       # Accessible dialog wrapper
│   ├── constants/                           # App configurations & theme constants
│   │   ├── config.ts                        # Kitchen operating hours, delivery fees, taxes
│   │   └── theme.ts                         # Hex values & brand palette constants
│   ├── features/                            # Domain-specific feature modules
│   │   ├── cart/                            # Shopping cart state, drawer & item rows
│   │   │   ├── components/                  # CartDrawer.tsx & CartDrawer.module.css
│   │   │   ├── context/                     # CartContext.tsx (useCart hook)
│   │   │   └── types/                       # cartTypes.ts
│   │   ├── checkout/                        # Delivery input, payment choice, validation
│   │   │   ├── components/                  # CheckoutModal.tsx & CheckoutModal.module.css
│   │   │   ├── types/                       # checkoutTypes.ts
│   │   │   └── validation/                  # checkoutValidation.ts
│   │   ├── menu/                            # Menu catalog, dietary filter & items
│   │   │   ├── components/                  # MenuItemCard.tsx, MenuCategoryFilter.tsx
│   │   │   ├── services/                    # menuService.ts
│   │   │   └── types/                       # menuTypes.ts
│   │   └── tracking/                        # Live order progress & kitchen simulation
│   │       ├── components/                  # OrderTracker.tsx & OrderTracker.module.css
│   │       └── types/                       # trackingTypes.ts
│   ├── styles/                              # Global stylesheets & design tokens
│   │   ├── tokens.css                       # Color palette, spacing, typography, shadows
│   │   └── globals.css                      # CSS reset, body, scrollbars, containers
│   ├── types/                               # Global TypeScript definitions
│   │   └── index.ts                         # DietaryTag, SpiceLevel, BaseEntity
│   ├── utils/                               # Helper utilities
│   │   ├── formatters.ts                    # formatCurrency, formatTimeEstimate, capitalize
│   │   └── storage.ts                       # Safe localStorage wrapper
│   ├── App.module.css                       # Application layout & Hero styling
│   ├── App.tsx                              # App root orchestrator & state wireup
│   └── main.tsx                             # Vite entry point
├── index.html                               # HTML document with SEO meta & fonts
├── package.json                             # Dependencies and npm scripts
├── tsconfig.json                            # TypeScript root config
└── vite.config.ts                           # Vite configuration
```

---

## 3. Strict File-Naming Conventions

| Role / Entity | Naming Rule | Example |
| :--- | :--- | :--- |
| **React Component** | PascalCase `.tsx` | `MenuItemCard.tsx`, `CartDrawer.tsx` |
| **CSS Module** | PascalCase `.module.css` (matches component) | `MenuItemCard.module.css` |
| **Global Styles** | lowercase `.css` | `tokens.css`, `globals.css` |
| **Domain Types** | camelCase `Types.ts` | `menuTypes.ts`, `cartTypes.ts` |
| **Domain Service** | camelCase `Service.ts` | `menuService.ts` |
| **Validation Module** | camelCase `Validation.ts` | `checkoutValidation.ts` |
| **Custom Hook** | camelCase `use*.ts` or `.tsx` | `useCart.ts`, `useMenu.ts` |
| **Utilities** | lowercase / camelCase `.ts` | `formatters.ts`, `storage.ts` |

---

## 4. Where Do New Additions Belong?

- **New reusable UI widget** (e.g. Tooltip, Dropdown, Accordion) -> `src/components/ui/[WidgetName]/[WidgetName].tsx`
- **New kitchen / order feature** (e.g. Promo codes, Kitchen reviews, Chef special details) -> `src/features/[feature-name]/`
- **New API or data fetching function** -> `src/features/[feature]/services/[feature]Service.ts`
- **New form validation rule** -> `src/features/[feature]/validation/[feature]Validation.ts`
- **Global business rule or pricing constant** -> `src/constants/config.ts`

---

## 5. Development Commands

```bash
# Start development server
npm run dev

# Build production bundle with TypeScript check
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint
```

---

## 6. Agent Rules for Targeted Codebase Exploration

1. **Check `docs/PROJECT_MAP.md` First**: Before reading multiple files, find the exact file paths mapped to the requested feature.
2. **Read Only Direct Dependencies**: For example, when asked to "Edit the cart pricing calculation", open `src/features/cart/context/CartContext.tsx` and `src/features/cart/types/cartTypes.ts` only.
3. **Never Duplicate Existing Helpers**: Always check `src/utils/formatters.ts` and `src/utils/storage.ts` before creating ad-hoc formatters or storage calls.
4. **Preserve Design System Integrity**: Any new colors or styles must reference `src/styles/tokens.css`.
