// TASK-33: tag every outbound share link with an anonymous source/medium/
// campaign so the dashboard can compute a real per-channel viral coefficient
// (TASK-41) instead of guessing. analytics.js's getAttribution() already
// reads utm_* from the current page URL on every trackEvent() call, so any
// event fired on a link built here (challenge_landing_viewed, result_viewed
// on a shared homepage visit, ...) is automatically attributed - no new
// identity and no challenge_token involved (that stays deliberately excluded
// from analytics, TASK-200, same as room_code/public_id).
const SAFE_VALUE = /^[A-Za-z0-9._+-]{1,120}$/;

export const withShareAttribution = (url, { source, campaign, medium = 'share', content }) => {
  if (!SAFE_VALUE.test(source) || !SAFE_VALUE.test(campaign) || !SAFE_VALUE.test(medium)) {
    return url;
  }
  if (content && !SAFE_VALUE.test(content)) return url;
  const target = new URL(url);
  target.searchParams.set('utm_source', source);
  target.searchParams.set('utm_medium', medium);
  target.searchParams.set('utm_campaign', campaign);
  if (content) target.searchParams.set('utm_content', content);
  return target.toString();
};

// TASK-33 AC#2 ("la variante resta persistente"): the Duel challenge-invite
// creative (which framing sells the invite - archetype reveal, the
// multi-dimension radar, or the archetype's own dark share phrase) is
// A/B tested by deterministically bucketing the sharer's own
// anonymousUserId, so the same person always sees and sends the same
// variant across sessions - no server round trip, no stored assignment.
export const SHARE_CREATIVE_VARIANTS = ['archetype', 'radar', 'provocative'];

const hashToIndex = (value, buckets) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(index)) >>> 0;
  }
  return hash % buckets;
};

export const getShareCreativeVariant = (anonymousUserId) => {
  if (!anonymousUserId) return SHARE_CREATIVE_VARIANTS[0];
  return SHARE_CREATIVE_VARIANTS[hashToIndex(anonymousUserId, SHARE_CREATIVE_VARIANTS.length)];
};
