import type { ConceptNode, ConceptState } from '../types/index';
import { MASTERY_THRESHOLD } from '../types/index';
import { getDueForReview } from './spacedRepetition';

/**
 * Recommend the next concepts for the learner to study.
 *
 * Priority order:
 *   1. Unmastered concepts whose prerequisites are ALL mastered
 *   2. Concepts due for spaced-repetition review
 *   3. Concepts with unexplored explorations
 *
 * Returns up to 5 concept IDs.
 */
export function getRecommendedNext(
  curriculum: Record<string, ConceptNode>,
  conceptStates: Record<string, ConceptState>,
): string[] {
  const results: string[] = [];
  const added = new Set<string>();

  const getMastery = (id: string): number =>
    conceptStates[id]?.masteryProbability ?? 0;

  const isMastered = (id: string): boolean =>
    getMastery(id) >= MASTERY_THRESHOLD;

  // --- Priority 1: Unmastered with all prereqs mastered (BFS order) ---
  // BFS from concepts with no prerequisites outward
  const visited = new Set<string>();
  const queue: string[] = [];

  // Seed BFS with root concepts (no prerequisites)
  for (const node of Object.values(curriculum)) {
    if (node.prerequisites.length === 0) {
      queue.push(node.id);
    }
  }

  const readyToLearn: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = curriculum[id];
    if (!node) continue;

    const prereqsMet = node.prerequisites.every((pid) => isMastered(pid));

    if (prereqsMet && !isMastered(id)) {
      readyToLearn.push(id);
    }

    // If this concept is mastered, continue BFS to its dependents
    if (isMastered(id)) {
      for (const other of Object.values(curriculum)) {
        if (other.prerequisites.includes(id) && !visited.has(other.id)) {
          queue.push(other.id);
        }
      }
    }
  }

  // Sort ready-to-learn by mastery ascending (focus on least-known first)
  readyToLearn.sort((a, b) => getMastery(a) - getMastery(b));

  for (const id of readyToLearn) {
    if (results.length >= 5) return results;
    if (!added.has(id)) {
      results.push(id);
      added.add(id);
    }
  }

  // --- Priority 2: Due for review ---
  const dueIds = getDueForReview(conceptStates);
  // Sort by how overdue (oldest nextReviewTimestamp first)
  dueIds.sort((a, b) => {
    const tsA = conceptStates[a]?.nextReviewTimestamp ?? 0;
    const tsB = conceptStates[b]?.nextReviewTimestamp ?? 0;
    return tsA - tsB;
  });

  for (const id of dueIds) {
    if (results.length >= 5) return results;
    if (!added.has(id)) {
      results.push(id);
      added.add(id);
    }
  }

  // --- Priority 3: Concepts with unexplored explorations ---
  const unexplored: string[] = [];
  for (const node of Object.values(curriculum)) {
    if (!node.explorationId) continue;
    const state = conceptStates[node.id];
    if (!state || !state.explored) {
      // Only recommend if prereqs are met
      const prereqsMet = node.prerequisites.every((pid) => isMastered(pid));
      if (prereqsMet) {
        unexplored.push(node.id);
      }
    }
  }

  // Sort by tier ascending so learner explores foundational explorations first
  unexplored.sort((a, b) => {
    const tierA = curriculum[a]?.tier ?? 5;
    const tierB = curriculum[b]?.tier ?? 5;
    return tierA - tierB;
  });

  for (const id of unexplored) {
    if (results.length >= 5) return results;
    if (!added.has(id)) {
      results.push(id);
      added.add(id);
    }
  }

  return results;
}
