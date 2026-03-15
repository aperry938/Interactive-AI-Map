import type { ConceptNode, ConceptState } from '../types/index';
import { MASTERY_THRESHOLD } from '../types/index';
import { getDueForReview } from './spacedRepetition';

export interface RecommendationReason {
  conceptId: string;
  reason: string;
  priority: 1 | 2 | 3;
}

/**
 * Returns recommended concepts with human-readable explanations of WHY
 * each was recommended. This makes the adaptive system transparent to learners.
 */
export function getExplainedRecommendations(
  curriculum: Record<string, ConceptNode>,
  conceptStates: Record<string, ConceptState>,
): RecommendationReason[] {
  const results: RecommendationReason[] = [];
  const added = new Set<string>();

  const getMastery = (id: string): number =>
    conceptStates[id]?.masteryProbability ?? 0;

  const isMastered = (id: string): boolean =>
    getMastery(id) >= MASTERY_THRESHOLD;

  // Priority 1: Unmastered with all prereqs mastered (BFS frontier)
  const visited = new Set<string>();
  const queue: string[] = [];

  for (const node of Object.values(curriculum)) {
    if (node.prerequisites.length === 0) queue.push(node.id);
  }

  const readyToLearn: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = curriculum[id];
    if (!node) continue;
    const prereqsMet = node.prerequisites.every(pid => isMastered(pid));
    if (prereqsMet && !isMastered(id)) readyToLearn.push(id);
    if (isMastered(id)) {
      for (const other of Object.values(curriculum)) {
        if (other.prerequisites.includes(id) && !visited.has(other.id)) {
          queue.push(other.id);
        }
      }
    }
  }

  readyToLearn.sort((a, b) => getMastery(a) - getMastery(b));
  for (const id of readyToLearn) {
    if (results.length >= 5) break;
    if (!added.has(id)) {
      const mastery = getMastery(id);
      const node = curriculum[id];
      const prereqNames = node.prerequisites.map(p => curriculum[p]?.name).filter(Boolean);
      const reason = mastery > 0.1
        ? `In progress (${Math.round(mastery * 100)}% mastery). Continue to reach 85% threshold.`
        : prereqNames.length > 0
          ? `All prerequisites mastered (${prereqNames.join(', ')}). Ready to learn.`
          : 'Foundation concept with no prerequisites. Start here.';
      results.push({ conceptId: id, reason, priority: 1 });
      added.add(id);
    }
  }

  // Priority 2: Due for spaced repetition review
  const dueIds = getDueForReview(conceptStates);
  dueIds.sort((a, b) => {
    const tsA = conceptStates[a]?.nextReviewTimestamp ?? 0;
    const tsB = conceptStates[b]?.nextReviewTimestamp ?? 0;
    return tsA - tsB;
  });

  for (const id of dueIds) {
    if (results.length >= 5) break;
    if (!added.has(id)) {
      const state = conceptStates[id];
      const daysSince = state ? Math.floor((Date.now() - state.nextReviewTimestamp) / (24 * 60 * 60 * 1000)) : 0;
      results.push({
        conceptId: id,
        reason: `Due for spaced repetition review (${daysSince > 0 ? daysSince + ' days overdue' : 'due today'}). Review prevents forgetting.`,
        priority: 2,
      });
      added.add(id);
    }
  }

  // Priority 3: Unexplored interactive explorations
  for (const node of Object.values(curriculum)) {
    if (results.length >= 5) break;
    if (!node.explorationId) continue;
    const state = conceptStates[node.id];
    if (state && state.explored) continue;
    const prereqsMet = node.prerequisites.every(pid => isMastered(pid));
    if (prereqsMet && !added.has(node.id)) {
      results.push({
        conceptId: node.id,
        reason: 'Has an interactive exploration you haven\'t tried yet. Hands-on learning deepens understanding.',
        priority: 3,
      });
      added.add(node.id);
    }
  }

  return results;
}
