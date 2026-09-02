import type { Activity } from "@/types/activity";

export const sampleActivities: Activity[] = [
  {
<<<<<<< HEAD
    id: "tour-1",
    type: "tour",
    title: "해운대 산책",
    description: "맑은 날 해운대 해변을 따라 걷는 가벼운 외출 활동입니다.",
=======
    id: "tour-haeundae",
    type: "tour",
    title: "해운대 해변 산책",
    description: "바다를 보며 가볍게 걷는 부산 대표 야외 활동입니다.",
>>>>>>> 89392e5 (20일차 전체 기능 구현)
    durationMinutes: 90,
    fixedTime: false,
    indoor: false,
    cost: 0,
<<<<<<< HEAD
    location: "부산 해운대",
=======
    location: "부산 해운대구 해운대해변로",
    coordinates: { latitude: 35.1587, longitude: 129.1604 },
>>>>>>> 89392e5 (20일차 전체 기능 구현)
    interests: ["travel", "walk"],
    source: "sample",
  },
  {
<<<<<<< HEAD
    id: "activity-1",
    type: "activity",
    title: "실내 전시 관람",
    description: "비가 오는 날에도 이용하기 좋은 실내 문화 활동입니다.",
    durationMinutes: 90,
    fixedTime: false,
    indoor: true,
    cost: 10000,
    location: "부산",
=======
    id: "tour-museum",
    type: "activity",
    title: "부산박물관 관람",
    description: "비가 오는 날에도 즐길 수 있는 실내 문화 활동입니다.",
    durationMinutes: 90,
    fixedTime: false,
    indoor: true,
    cost: 0,
    location: "부산 남구 유엔평화로 63",
    coordinates: { latitude: 35.1296, longitude: 129.0929 },
>>>>>>> 89392e5 (20일차 전체 기능 구현)
    interests: ["travel", "culture"],
    source: "sample",
  },
  {
<<<<<<< HEAD
    id: "movie-1",
    type: "movie",
    title: "영화관 영화 관람",
    description: "오후 상영시간에 맞춰 영화관에서 영화를 관람합니다.",
=======
    id: "movie-centum",
    type: "movie",
    title: "센텀시티 영화 관람",
    description: "고정 상영시간을 하루 일정의 기준점으로 사용합니다.",
>>>>>>> 89392e5 (20일차 전체 기능 구현)
    startAt: "15:00",
    endAt: "17:00",
    durationMinutes: 120,
    fixedTime: true,
    indoor: true,
    cost: 15000,
<<<<<<< HEAD
    location: "부산",
=======
    location: "부산 해운대구 센텀남대로",
    coordinates: { latitude: 35.1699, longitude: 129.1294 },
>>>>>>> 89392e5 (20일차 전체 기능 구현)
    interests: ["movie"],
    source: "sample",
  },
  {
<<<<<<< HEAD
    id: "sport-1",
    type: "sport",
    title: "롯데 vs LG",
    description: "관심팀 경기를 저녁 일정의 기준점으로 배치합니다.",
=======
    id: "sport-sajik",
    type: "sport",
    title: "롯데 vs LG",
    description: "좋아하는 팀의 경기라면 추천 점수를 높여 고정시간 일정으로 배치합니다.",
>>>>>>> 89392e5 (20일차 전체 기능 구현)
    startAt: "18:30",
    endAt: "21:30",
    durationMinutes: 180,
    fixedTime: true,
    indoor: false,
    cost: 20000,
<<<<<<< HEAD
    location: "사직야구장",
    interests: ["sports", "baseball"],
    source: "sample",
    metadata: { homeTeam: "롯데", awayTeam: "LG", league: "KBO" },
  },
  {
    id: "ott-1",
    type: "ott",
    title: "OTT 영화 한 편",
    description: "귀가 후 집에서 편하게 볼 수 있는 영화 한 편을 추천합니다.",
=======
    location: "부산 사직야구장",
    coordinates: { latitude: 35.1940, longitude: 129.0616 },
    interests: ["sports", "baseball"],
    source: "sample",
    metadata: { homeTeam: "롯데", awayTeam: "LG", league: "KBO", mode: "stadium" },
  },
  {
    id: "ott-home",
    type: "ott",
    title: "OTT 영화 한 편",
    description: "귀가 후 집에서 편하게 볼 수 있는 가변시간 활동입니다.",
>>>>>>> 89392e5 (20일차 전체 기능 구현)
    durationMinutes: 90,
    fixedTime: false,
    indoor: true,
    cost: 0,
    location: "집",
    interests: ["movie", "ott"],
    source: "sample",
<<<<<<< HEAD
  },
  {
    id: "activity-2",
    type: "activity",
    title: "카페에서 쉬기",
    description: "다음 일정 전 1시간 정도 쉬면서 이동 동선을 조절합니다.",
=======
    metadata: { provider: "Netflix" },
  },
  {
    id: "cafe-seomyeon",
    type: "activity",
    title: "서면 카페에서 쉬기",
    description: "다음 일정 전 잠시 쉬면서 동선을 조절합니다.",
>>>>>>> 89392e5 (20일차 전체 기능 구현)
    durationMinutes: 60,
    fixedTime: false,
    indoor: true,
    cost: 8000,
<<<<<<< HEAD
    location: "부산",
=======
    location: "부산 부산진구 서면",
    coordinates: { latitude: 35.1578, longitude: 129.0592 },
>>>>>>> 89392e5 (20일차 전체 기능 구현)
    interests: ["cafe"],
    source: "sample",
  },
];
