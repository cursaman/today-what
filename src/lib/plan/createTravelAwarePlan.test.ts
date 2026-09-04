import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@/types/activity";
import type { RecommendationCondition } from "@/types/recommendation";
import { timeToMinutes } from "./timeUtils";

vi.mock("@/lib/transport/getTravelInfo", () => ({
  getTravelInfo: vi.fn(),
}));

import { getTravelInfo } from "@/lib/transport/getTravelInfo";
import { scoreActivity } from "@/lib/recommendation/scoreActivity";
import { createTravelAwarePlan } from "./createTravelAwarePlan";
import { decodePlanDraft, encodePlanDraft } from "./draftCodec";

const mockedTravel = vi.mocked(getTravelInfo);
const origin = { latitude: 35, longitude: 129, region: "부산" };

function activity(overrides: Partial<Activity & { score: number }> & Pick<Activity, "id" | "title">): Activity & { score?: number } {
  return {
    type: "activity",
    durationMinutes: 60,
    fixedTime: false,
    indoor: true,
    cost: 0,
    location: "부산",
    coordinates: { latitude: 35, longitude: 129 },
    interests: ["activity"],
    source: "test",
    ...overrides,
  };
}

beforeEach(() => {
  mockedTravel.mockReset();
  mockedTravel.mockImplementation(async (from, to, mode = "car") => ({
    distanceKm: 10,
    durationMinutes: from.latitude === to.latitude && from.longitude === to.longitude ? 0 : 30,
    mode,
    source: "test",
  }));
});

describe("createTravelAwarePlan", () => {
  it("고정시간 전에 가능한 자유 활동을 배치한다", async () => {
    const flexible = activity({ id: "morning", title: "오전 활동", score: 100 });
    const fixed = activity({ id: "fixed", title: "10시 영화", type: "movie", fixedTime: true, startAt: "10:00", durationMinutes: 120, score: 90 });

    const { plan } = await createTravelAwarePlan([fixed, flexible], "06:00", "23:00", 100000, "balanced", origin, "car");

    expect(plan.items.map((item) => item.activity.id)).toEqual(["morning", "fixed"]);
    expect(plan.items[0].startTime).toBe("06:00");
    expect(plan.items[1].startTime).toBe("10:00");
  });

  it("직접 선택 후보를 자동 추천보다 먼저 반영한다", async () => {
    const selected = activity({ id: "selected", title: "내 선택", metadata: { manuallySelected: true } });
    const automatic = activity({ id: "automatic", title: "자동 추천", score: 999 });

    const { plan } = await createTravelAwarePlan([automatic, selected], "06:00", "09:00", 100000, "balanced", origin, "car");

    expect(plan.items[0].activity.id).toBe("selected");
  });

  it("예산을 넘는 직접 선택 후보는 이유와 함께 제외한다", async () => {
    const first = activity({ id: "first", title: "첫 활동", cost: 40000, metadata: { manuallySelected: true } });
    const second = activity({ id: "second", title: "두 번째 활동", cost: 40000, metadata: { manuallySelected: true } });

    const result = await createTravelAwarePlan([first, second], "06:00", "12:00", 50000, "balanced", origin, "car");

    expect(result.plan.totalCost).toBe(40000);
    expect(result.plan.items).toHaveLength(1);
    expect(result.draftFailures).toContainEqual({ id: "second", title: "두 번째 활동", reason: "예산 초과" });
  });

  it("귀가하면 종료시간을 넘는 활동을 제외한다", async () => {
    const far = activity({
      id: "far",
      title: "먼 활동",
      durationMinutes: 90,
      coordinates: { latitude: 36, longitude: 129 },
      metadata: { manuallySelected: true },
    });

    const result = await createTravelAwarePlan([far], "20:00", "22:00", 100000, "balanced", origin, "car");

    expect(result.plan.items).toHaveLength(0);
    expect(result.draftFailures[0]?.reason).toContain("종료 시간");
  });

  it("외부활동 뒤 집 활동까지 실제 귀가 이동을 계산한다", async () => {
    const outside = activity({ id: "outside", title: "외부활동", coordinates: { latitude: 36, longitude: 129 }, metadata: { manuallySelected: true } });
    const home = activity({ id: "home", title: "집 활동", type: "ott", location: "집", coordinates: undefined, metadata: { manuallySelected: true } });

    const { plan } = await createTravelAwarePlan([outside, home], "06:00", "12:00", 100000, "balanced", origin, "car");

    expect(plan.items[0].travelFromPreviousMinutes).toBe(30);
    expect(plan.items[1].travelFromPreviousMinutes).toBe(30);
    expect(plan.items[1].startTime).toBe("08:20");
    expect(plan.totalTravelMinutes).toBe(60);
    expect(plan.returnTravelMinutes).toBe(0);
    expect(plan.estimatedReturnTime).toBe("09:20");
  });

  it("마지막 외부활동의 귀가 구간과 예상 도착시각을 별도로 반환한다", async () => {
    const outside = activity({
      id: "return-home",
      title: "외부활동",
      coordinates: { latitude: 36, longitude: 129 },
      metadata: { manuallySelected: true },
    });

    const { plan } = await createTravelAwarePlan([outside], "06:00", "12:00", 100000, "balanced", origin, "car");

    expect(plan.returnTravelMinutes).toBe(30);
    expect(plan.returnDistanceKm).toBe(10);
    expect(plan.returnTransportMode).toBe("car");
    expect(plan.estimatedReturnTime).toBe("08:00");
  });

  it("일정 유형에 맞는 휴식시간을 직접 선택 활동 사이에도 둔다", async () => {
    const first = activity({ id: "rest-first", title: "첫 활동", metadata: { manuallySelected: true } });
    const second = activity({ id: "rest-second", title: "두 번째 활동", metadata: { manuallySelected: true } });

    const { plan } = await createTravelAwarePlan([first, second], "06:00", "12:00", 100000, "balanced", origin, "car");

    expect(plan.items[0].endTime).toBe("07:00");
    expect(plan.items[1].startTime).toBe("07:20");
  });

  it("점심 활동을 권장 시간대 안에 배치한다", async () => {
    const morning = activity({ id: "morning-long", title: "오전 활동", durationMinutes: 120, score: 100 });
    const lunch = activity({
      id: "lunch", title: "점심 식사", interests: ["food"], score: 90,
      metadata: { mealType: "lunch", preferredStart: "11:30", preferredEnd: "14:00" },
    });

    const { plan } = await createTravelAwarePlan([lunch, morning], "06:00", "18:00", 100000, "balanced", origin, "car");
    const meal = plan.items.find((item) => item.activity.id === "lunch");

    expect(meal).toBeDefined();
    expect(timeToMinutes(meal!.startTime)).toBeGreaterThanOrEqual(timeToMinutes("11:30"));
    expect(timeToMinutes(meal!.endTime)).toBeLessThanOrEqual(timeToMinutes("14:00"));
  });

  it("점심·카페·저녁을 각각 알맞은 시간대에 배치한다", async () => {
    const lunch = activity({ id: "lunch", title: "점심", cost: 12000, metadata: { mealType: "lunch", preferredStart: "11:30", preferredEnd: "14:00" } });
    const cafe = activity({ id: "cafe", title: "카페", cost: 8000, metadata: { breakType: "cafe", preferredStart: "14:00", preferredEnd: "17:30" } });
    const dinner = activity({ id: "dinner", title: "저녁", cost: 15000, metadata: { mealType: "dinner", preferredStart: "17:30", preferredEnd: "20:30" } });

    const { plan } = await createTravelAwarePlan([cafe, dinner, lunch], "06:00", "23:00", 50000, "balanced", origin, "car");

    expect(plan.items.map((item) => item.activity.id)).toEqual(["lunch", "cafe", "dinner"]);
    expect(plan.items.map((item) => item.startTime)).toEqual(["11:30", "14:00", "17:30"]);
    expect(plan.totalCost).toBe(35000);
  });

  it("예산이 빠듯하면 카페보다 남은 식사 예산을 먼저 확보한다", async () => {
    const lunch = activity({ id: "budget-lunch", title: "점심", cost: 12000, metadata: { mealType: "lunch", preferredStart: "11:30", preferredEnd: "14:00" } });
    const cafe = activity({ id: "budget-cafe", title: "카페", cost: 8000, metadata: { breakType: "cafe", preferredStart: "14:00", preferredEnd: "17:30" } });
    const dinner = activity({ id: "budget-dinner", title: "저녁", cost: 15000, metadata: { mealType: "dinner", preferredStart: "17:30", preferredEnd: "20:30" } });

    const { plan } = await createTravelAwarePlan([lunch, cafe, dinner], "06:00", "23:00", 30000, "balanced", origin, "car");

    expect(plan.items.map((item) => item.activity.id)).toEqual(["budget-lunch", "budget-dinner"]);
    expect(plan.totalCost).toBe(27000);
  });

  it("자동 일정에는 필드와 스크린골프를 합쳐 한 개만 배치한다", async () => {
    const field = activity({ id: "field", title: "필드 골프", durationMinutes: 120, indoor: false, interests: ["golf"], score: 100 });
    const screen = activity({ id: "screen", title: "스크린골프", durationMinutes: 120, interests: ["golf"], score: 90 });

    const { plan } = await createTravelAwarePlan([field, screen], "06:00", "18:00", 500000, "outdoor", origin, "car");

    expect(plan.items.filter((item) => item.activity.interests.includes("golf"))).toHaveLength(1);
  });

  it("생성된 활동 사이 시간이 겹치지 않는다", async () => {
    const candidates = [1, 2, 3].map((number) => activity({ id: String(number), title: `활동 ${number}`, score: 100 - number }));
    const { plan } = await createTravelAwarePlan(candidates, "06:00", "18:00", 100000, "outdoor", origin, "car");

    for (let index = 1; index < plan.items.length; index += 1) {
      expect(timeToMinutes(plan.items[index].startTime)).toBeGreaterThanOrEqual(timeToMinutes(plan.items[index - 1].endTime));
    }
  });

  it("필드 골프 고정시간에는 45분 도착 여유를 적용한다", async () => {
    const field = activity({
      id: "reserved-field", title: "예약 필드 골프", fixedTime: true, startAt: "07:00",
      coordinates: { latitude: 36, longitude: 129 }, interests: ["golf", "golf-field"],
      metadata: { manuallySelected: true, golfType: "field", arrivalBufferMinutes: 45 },
    });

    const result = await createTravelAwarePlan([field], "06:00", "12:00", 500000, "outdoor", origin, "car");

    expect(result.plan.items).toHaveLength(0);
    expect(result.draftFailures[0]?.reason).toContain("도착");
  });
});

describe("골프 후보 저장", () => {
  it("예약 시작시간과 도착 여유시간을 쿠키 데이터에 보존한다", () => {
    const reserved = activity({
      id: "reserved-screen", title: "예약 스크린골프", fixedTime: true, startAt: "19:00",
      interests: ["golf", "golf-screen"], metadata: { golfType: "screen", reservationStatus: "scheduled", arrivalBufferMinutes: 15 },
    });

    const encoded = encodePlanDraft([reserved]);
    const decoded = decodePlanDraft(encoded.encoded)[0];

    expect(decoded.startAt).toBe("19:00");
    expect(decoded.fixedTime).toBe(true);
    expect(decoded.metadata).toMatchObject({ golfType: "screen", reservationStatus: "scheduled", arrivalBufferMinutes: 15 });
  });
});

describe("scoreActivity", () => {
  const condition: RecommendationCondition = {
    region: "부산", startTime: "06:00", endTime: "23:00", budget: 100000,
    raining: false, companion: "alone", interests: [], favoriteTeams: ["롯데"], preferredActivityMode: "balanced",
  };

  it("팀 정보가 없는 활동에 선호팀 점수를 주지 않는다", () => {
    const ordinary = activity({ id: "ordinary", title: "일반 활동", metadata: {} });
    const matchingGame = activity({ id: "game", title: "롯데 경기", type: "sport", metadata: { homeTeam: "롯데 자이언츠", awayTeam: "LG" } });

    expect(scoreActivity(matchingGame, condition) - scoreActivity(ordinary, condition)).toBe(40);
  });

  it("선택한 골프 세부 유형을 다른 골프 유형보다 우선한다", () => {
    const golfCondition = { ...condition, interests: ["golf", "golf-field"] };
    const field = activity({ id: "field-score", title: "필드", indoor: false, interests: ["golf", "golf-field"], metadata: { golfType: "field" } });
    const screen = activity({ id: "screen-score", title: "스크린", interests: ["golf", "golf-screen"], metadata: { golfType: "screen" } });

    expect(scoreActivity(field, golfCondition)).toBeGreaterThan(scoreActivity(screen, golfCondition));
  });
});
