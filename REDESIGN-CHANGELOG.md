# Redesign Changelog — "Her" Aesthetic

## Design Source
- Movie: "Her" (2013, Spike Jonze)
- Reference project: `/Users/aperry938/Desktop/apps/her-os-v1`
- Design principles: Warm monotone, minimalist, glassmorphic, dark-first, futuristic-yet-human

---

## Session 1 — Partial Redesign (Incomplete)

### Files Modified
| File | Change | Status |
|------|--------|--------|
| `src/pages/LearnView.tsx` | Grid cards → row-based list, monochrome white opacity, minimal borders | DONE |
| `src/pages/LandingPage.tsx` | Simplified hero, glass pill CTA, removed tier cards | DONE |
| `src/components/layout/MainLayout.tsx` | Removed glass nav pill, text-only nav, mobile hamburger, removed progress bar | DONE |
| `src/components/ui/AmbientBackground.tsx` | Deep `#0A0707` base, reduced orb opacity, added radial gradient | DONE |

### Design Patterns Established (Use As Reference)
- Text hierarchy: `white/85` → `white/70` → `white/50` → `white/30` → `white/20` → `white/15`
- Labels: `text-[10px] uppercase tracking-[0.25em] text-white/30`
- Stats: `text-4xl font-light text-white/80 tabular-nums`
- Borders: `border-white/[0.06]` (thin dividers)
- Hover: `bg-white/[0.03]` background shift + `x: 4` translate
- Buttons: `bg-white/[0.08] border-white/[0.08] text-white/70 rounded-full uppercase tracking-[0.25em]`
- Search: transparent bg, border-bottom only, placeholder `white/20`
- Empty state: `text-white/25` with `text-[10px] uppercase` clear link

---

## Session 2 — Complete

### Phase 1: Foundation
- [x] `src/index.css` — Dark-only glass, remove colored glows/tier borders, `.her-label` utility, 4px scrollbar, grain 0.02
- [x] `tailwind.config.js` — Remove tier/learn colors, slow animations (35s/45s), remove font-serif
- [x] `src/types/index.ts` — TIER_CONFIG → monochrome white opacity (T1=0.40 through T5=0.75)

### Phase 2: UI Primitives
- [x] `src/components/ui/Button.tsx` — Glass pill variants, removed tier prop, font-light
- [x] `src/components/ui/Card.tsx` — Removed tier prop and colored inset border, glass hover
- [x] `src/components/ui/Badge.tsx` — Monochrome glass pills `bg-white/[0.06] text-white/50`
- [x] `src/components/ui/ProgressBar.tsx` — Cream fill `bg-her-cream/30`, thin `h-1`
- [x] `src/components/ui/Toast.tsx` — Neutral glass, removed emerald/amber
- [x] `src/components/ui/SliderControl.tsx` — Monochrome track/thumb, removed text-her-red

### Phase 3: Main Views
- [x] `src/components/features/NodeDetailModal.tsx` — Full reimagine: dark panel, cream mastery gauge, monochrome quiz, her-label accordions
- [x] `src/components/features/ProgressDashboard.tsx` — Monochrome cream charts, font-light stats, cream heatmap
- [x] `src/components/features/ReviewQueue.tsx` — Row-based with border-b, cream gauge, monochrome badges

### Phase 4: Secondary Views
- [x] `src/components/features/OnboardingQuestionnaire.tsx` — Glass selections, thin cream progress bar, glass pill nav
- [x] `src/components/features/AIPioneers.tsx` — Monochrome era tabs/cards/timeline
- [x] `src/components/features/AboutPage.tsx` — Her-label sections, removed font-serif, monochrome
- [x] `src/components/features/CompletionView.tsx` — Subtle monochrome icon, glass pill button
- [x] `src/components/features/SettingsModal.tsx` — Dark panel `bg-[#0A0707]/95`, monochrome inputs

### Phase 5: Visualizations
- [x] `src/components/features/KnowledgeGraph.tsx` — Dark canvas colors, cream checkmarks, dark label bg
- [x] `src/components/features/AITreeDiagram.tsx` — Monochrome tree, cream glow, Inter font

### Phase 6: Polish
- [x] Remove all `dark:` prefixes (permanently dark) — AppRouter, ErrorBoundary, etc.
- [x] Remove all `text-her-dark` / light-mode patterns
- [x] Simplified `useTheme.ts` to always-dark (no localStorage)
- [x] Updated Controls.tsx, CodeBlock.tsx, Quiz.tsx, KeyboardShortcuts.tsx
- [x] Final grep verified zero straggler colors (emerald, amber, blue, purple, pink, font-serif)
- [x] Build passes cleanly with no TypeScript errors
