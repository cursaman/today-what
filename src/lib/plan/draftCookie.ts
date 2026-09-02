export const LEGACY_PLAN_DRAFT_COOKIE_NAME = "today_what_outdoor_draft";
export const GUEST_PLAN_DRAFT_COOKIE_NAME = "today_what_plan_draft_guest";

export function getPlanDraftCookieName(userId?: string | null) {
  return userId ? `today_what_plan_draft_${userId}` : GUEST_PLAN_DRAFT_COOKIE_NAME;
}
