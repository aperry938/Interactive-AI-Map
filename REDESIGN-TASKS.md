# Redesign Tasks — Agent Handoff Document

## Project
Interactive AI/ML Learning Platform → "Her" movie aesthetic redesign

## Reference Files
- **Plan**: `~/.claude/plans/eager-rolling-petal.md`
- **Changelog**: `./REDESIGN-CHANGELOG.md`
- **Design reference project**: `/Users/aperry938/Desktop/apps/her-os-v1`
- **Pattern reference** (already redesigned): `src/pages/LearnView.tsx`

## Key Design Rules
1. **Dark-only**: No light mode. Background `#0A0707`. All text is `white/` at varying opacity.
2. **Monochrome**: No colored tiers. White/cream at opacity. Only accent: `her-red #D94436` for links/attribution.
3. **Typography**: Inter, `font-light` (300), labels `text-[10px] uppercase tracking-[0.2em]`.
4. **Glass**: `bg-white/[0.06]` + `backdrop-blur-[12px]` + `border rgba(255,255,255,0.08)`.
5. **Interactions**: Scale 1.01-1.02 hover, 0.98 tap, 300ms transitions.
6. **Cream for mastery**: `rgba(242,232,220,opacity)` for mastery indicators.
7. **No font-serif**: Remove all `font-serif` usage, use Inter everywhere.

---

## Task Queue — ALL COMPLETE

### PHASE 1 — FOUNDATION ✓
- [x] Task 1.1: `src/index.css` — Dark-only glass, her-label, 4px scrollbar, grain 0.02
- [x] Task 1.2: `tailwind.config.js` — Removed tier/learn, slowed drift, removed font-serif
- [x] Task 1.3: `src/types/index.ts` — TIER_CONFIG monochrome (T1=0.40 → T5=0.75)

### PHASE 2 — UI PRIMITIVES ✓
- [x] Task 2.1: Button.tsx — Glass pills, removed tier prop
- [x] Task 2.2: Card.tsx — Removed tier borders, glass hover
- [x] Task 2.3: Badge.tsx — Monochrome glass pills
- [x] Task 2.4: ProgressBar.tsx — Cream fill, thin h-1
- [x] Task 2.5: Toast.tsx — Neutral glass, no emerald/amber
- [x] Task 2.6: SliderControl.tsx — Monochrome, no text-her-red

### PHASE 3 — MAIN VIEWS ✓
- [x] Task 3.1: NodeDetailModal.tsx — Full reimagine (dark panel, cream gauge, monochrome quiz)
- [x] Task 3.2: ProgressDashboard.tsx — Cream charts, font-light stats
- [x] Task 3.3: ReviewQueue.tsx — Row-based, cream gauge, monochrome

### PHASE 4 — SECONDARY VIEWS ✓
- [x] Task 4.1: OnboardingQuestionnaire.tsx — Glass selections, cream progress
- [x] Task 4.2: AIPioneers.tsx — Monochrome tabs/cards/timeline
- [x] Task 4.3: AboutPage.tsx — Her-label, removed font-serif
- [x] Task 4.4: CompletionView.tsx — Monochrome, glass pill
- [x] Task 4.5: SettingsModal.tsx — Dark panel, monochrome

### PHASE 5 — VISUALIZATIONS ✓
- [x] Task 5.1: KnowledgeGraph.tsx — Dark canvas, cream checkmarks
- [x] Task 5.2: AITreeDiagram.tsx — Monochrome, cream glow, Inter font

### PHASE 6 — POLISH ✓
- [x] Task 6.1: Removed all `dark:` prefixes (AppRouter, ErrorBoundary, etc.)
- [x] Task 6.2: Removed all `text-her-dark` / `bg-her-dark/` references
- [x] Task 6.3: Simplified useTheme.ts to always-dark
- [x] Task 6.4: `dark` class always applied via useTheme hook
- [x] Task 6.5: Grep verified zero stragglers (emerald, amber, blue, purple, pink, font-serif)
- [x] Task 6.6: Build passes cleanly, no TypeScript errors

---

## Status

All 6 phases complete. The entire platform has been redesigned to match the "Her" aesthetic — warm monotone, dark-first, glassmorphic, monochrome tiers, cream mastery indicators, Inter font-light throughout.
