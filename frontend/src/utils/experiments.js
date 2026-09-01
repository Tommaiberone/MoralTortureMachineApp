// Shared deterministic A/B bucketing for same-identity exposure->conversion
// experiments (login prompt copy, home CTA copy, challenge button copy,
// party create copy). One hash function instead of one per experiment
// (CLAUDE.md: reuse over duplicating) - namespaced by experiment name so two
// different experiments never correlate for the same person (one always
// landing in variant index 0 across every test would silently bias results).
//
// This is a sibling to attribution.js's getShareCreativeVariant, which keeps
// its own already-live hash format unchanged on purpose: that experiment
// shipped in production first, and reusing this namespaced hash for it would
// silently reassign already-bucketed users to a different variant.
const hashToIndex = (value, buckets) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(index)) >>> 0;
  }
  return hash % buckets;
};

export const getExperimentVariant = (experimentName, variants, anonymousUserId) => {
  if (!anonymousUserId || variants.length === 0) return variants[0];
  return variants[hashToIndex(`${experimentName}:${anonymousUserId}`, variants.length)];
};

// TASK-219: same "value"/"urgency"/"curiosity" framing tested consistently
// across every hard-gate login prompt (ResultsScreen/ChallengeLandingScreen/
// ChallengeCompareScreen) - one shared list so the three screens can't drift
// out of sync with each other.
export const AUTH_PROMPT_COPY_VARIANTS = ['value', 'urgency', 'curiosity'];
