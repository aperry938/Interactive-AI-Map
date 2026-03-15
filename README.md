# Interactive AI/ML Learning Map

An adaptive educational platform for learning artificial intelligence and machine learning concepts through a knowledge-graph-driven interface with Bayesian mastery tracking, spaced repetition, and interactive explorations.

**Live Demo:** [aperry938.github.io/Interactive-AI-Map](https://aperry938.github.io/Interactive-AI-Map/)

## Using the App

1. Visit the [live demo](https://aperry938.github.io/Interactive-AI-Map/)
2. Complete the onboarding questionnaire (or skip it) to set your starting level
3. Navigate the **knowledge graph** -- click any concept node to open its detail panel
4. Study concepts through descriptions, math notation, code examples, and interactive explorations
5. Test yourself with quizzes at three difficulty levels (Easy, Medium, Hard)
6. Track your progress on the **Dashboard** -- mastery heatmap, accuracy by difficulty, Bloom's distribution
7. Return regularly -- the **spaced repetition** system schedules optimal review times

### Navigation

- **Map** -- Force-directed knowledge graph (primary interface). Click nodes, zoom/pan, search with Cmd+K
- **List** -- Flat concept list organized by tier, with search
- **Dashboard** -- Learning analytics: tier mastery rings, activity heatmap, difficulty breakdown
- **Review** -- Concepts due for spaced repetition review
- **Encyclopedia** -- AI pioneers timeline
- **Methodology** -- Research positioning, theoretical framework, BKT methodology, related work

### Interactive Explorations

Click "Try It" on any concept with an interactive module:

| Exploration | Concept | What You Do |
|------------|---------|-------------|
| Gradient Descent | Optimization | Adjust learning rate, watch 3D cost surface, compare SGD vs momentum |
| Neural Network Builder | ANNs | Build/train networks on XOR, circle, linear datasets |
| Attention Visualizer | Transformers | Manipulate Q/K/V matrices, see multi-head attention weights |
| Decision Boundary | SVMs | Compare classifiers on different data distributions |
| Data Preprocessing | Preprocessing | Normalize, standardize, handle missing values interactively |
| RL Gridworld | Reinforcement Learning | Set rewards, watch Q-learning agent navigate a grid |
| K-Means Clustering | Clustering | Place points, step through centroid assignments, watch convergence |

## What Makes This Different

Most interactive ML education tools focus on one dimension. This platform integrates four:

- **Bayesian Knowledge Tracing (BKT)** -- Probabilistic mastery estimation updated after every quiz attempt, with difficulty conditioning and hint penalties
- **Spaced Repetition** -- Ebbinghaus-calibrated review scheduling with mastery-scaled intervals
- **Knowledge Graph Navigation** -- Prerequisite-gated curriculum (42 concepts, 5 tiers) with progressive reveal
- **Open Learner Model** -- BKT parameters, forgetting curves, mastery trajectories, and recommendation rationale are visible to learners, promoting metacognitive awareness

See the [Methodology page](https://aperry938.github.io/Interactive-AI-Map/#/methodology) for the full theoretical framework and related work comparison.

## Tech Stack

- **React 19** + **TypeScript**
- **D3.js v7** -- Force-directed graph, canvas-based explorations
- **Vite** -- Build tool
- **Tailwind CSS** -- Styling (dark-only glassmorphic design)
- **Framer Motion** -- Animations
- **KaTeX** -- Mathematical notation rendering
- **Vitest** -- Unit testing (44 tests across 6 test files)

## Development

```bash
# Install dependencies
npm install

# Start dev server (localhost:3000)
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type check
npm run typecheck

# Deploy to GitHub Pages
npm run deploy
```

### Optional: Gemini API Key

The "AI Insight" feature in concept detail panels uses the Google Gemini API. To enable it:
1. Click the Settings (gear) icon
2. Enter your Gemini API key
3. The key is stored locally in your browser

The platform is fully functional without an API key.

## Project Structure

```
src/
  components/
    explorations/     # 7 interactive visualizations (canvas-based)
    features/         # Core views: KnowledgeGraph, NodeDetailModal, ProgressDashboard, etc.
    layout/           # MainLayout with navigation
    ui/               # Design system primitives (glassmorphic)
  data/
    curriculum.ts     # 42 concepts with quizzes, prerequisites, connections
    aiConcepts.ts     # Legacy tree structure
  engine/
    bkt.ts            # Bayesian Knowledge Tracing with forgetting + transfer
    spacedRepetition.ts
    recommender.ts    # BFS-based concept recommendation
    difficultyAdjuster.ts
    onboarding.ts     # Cold-start mastery initialization
    recommendationExplainer.ts  # Human-readable recommendation reasons
  pages/
    MapView.tsx       # Full-screen knowledge graph (primary interface)
    LearnView.tsx     # Flat concept list (secondary)
    LandingPage.tsx   # Entry with graph preview + learning science cards
  stores/
    learnerStore.ts   # React Context + localStorage persistence
  router/
    AppRouter.tsx     # Hash-based routing with lazy loading
```

## Author

**Anthony C. Perry** -- [aperry938.github.io](https://aperry938.github.io)

## License

MIT
