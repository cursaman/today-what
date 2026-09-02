<<<<<<< HEAD
# 오늘 뭐하지? — Day 12

Next.js + Supabase + Vercel 기반 생활 일정 추천 MVP입니다.

## Day 12 포함 기능
- 추천 점수 기반 Activity 정렬
- 고정시간 우선 일정 생성
- A/B/C 3가지 일정 옵션
- Supabase 이메일 회원가입/로그인
- 선택 일정 `plans` / `plan_items` 저장
- MY에서 사용자 본인 일정 조회
- RLS 사용자별 데이터 보호

## 환경변수
Vercel Project > Settings > Environment Variables에 등록합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

## Supabase DB
`supabase/day12.sql` 전체를 Supabase SQL Editor에서 한 번 실행하세요.

## 실행
=======
# 오늘 뭐하지? — Day 20 Complete

Next.js App Router + TypeScript + Tailwind + Supabase + Vercel 기반 MVP입니다.

## 포함 범위

- DAY 5~12: Activity 공통모델, 추천 점수, 고정시간 우선 일정, A/B/C 일정, Supabase 로그인/저장/MY
- DAY 13: MY 일정 상세, 제목 수정, 일정 삭제, 가변 활동 1개 교체
- DAY 14: 사용자 취향 저장(지역/예산/동행/관심사/팀/OTT/스타일/이동수단)
- DAY 15: 실제 날씨(Open-Meteo), 한국관광공사 TourAPI Adapter
- DAY 16: TMDB 인기영화 + KR Watch Provider + 사용자 OTT 필터
- DAY 17: SportsProvider 인터페이스 + 샘플 KBO Provider + Sport Activity Adapter
- DAY 18: 좌표, 직선거리, 이동시간 추정, 스타일별 이동 제한
- DAY 19: Kakao Mobility 자동차 길찾기 Provider + 실패 시 estimate fallback
- DAY 20: Kakao Map 마커/순서/Polyline, 총 이동거리/시간, MY 저장 일정 지도 재표시

## 1. 설치

>>>>>>> 89392e5 (20일차 전체 기능 구현)
```bash
npm install
npm run dev
```

<<<<<<< HEAD
## 주요 화면
- `/` 메인
- `/recommend` 추천 결과
- `/plan` A/B/C 일정 및 저장
- `/signup` 회원가입
- `/login` 로그인
- `/my` 저장한 일정

## 배포
GitHub와 Vercel이 연결되어 있다면 아래 명령 후 자동 배포됩니다.

```bash
git add .
git commit -m "Day 12 Supabase auth and plan save"
git push
```
=======
## 2. Supabase

Supabase SQL Editor에서 순서대로 실행합니다.

1. `supabase/day12.sql`
2. `supabase/day20.sql`

## 3. Vercel 환경변수

`.env.example`을 참고해 등록합니다.

필수:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

선택(키가 없으면 fallback/sample 동작):

- `NEXT_PUBLIC_KAKAO_MAP_JS_KEY`
- `KAKAO_REST_API_KEY`
- `TOUR_API_KEY`
- `TMDB_ACCESS_TOKEN`

카카오 지도는 Kakao Developers 앱의 JavaScript 키와 사이트 도메인 등록이 필요합니다.
Kakao Mobility REST 키가 없거나 경로 조회가 실패하면 거리 기반 이동시간 추정값을 사용합니다.
TourAPI 키가 없으면 기존 샘플 관광 활동을 유지합니다.
TMDB 토큰이 없으면 기존 샘플 OTT 활동을 유지합니다.

## 4. 주요 URL

- `/` 오늘추천
- `/plan` A/B/C 일정 + 지도
- `/my` 저장 일정
- `/my/preferences` 개인 추천 설정
- `/my/plans/[id]` 일정 상세/수정/교체/삭제/지도
- `/login`, `/signup`

## 5. 현재 Provider 정책

`src/lib/api`, `src/lib/transport` 안에서 외부 API를 공통 Activity/Route 모델로 변환합니다. 추천 엔진과 일정 엔진은 공급자 응답 구조를 직접 참조하지 않습니다.

## 6. 중요

- TMDB Watch Provider 데이터 사용 시 화면에 JustWatch 출처 표시를 추가/유지하세요.
- `KAKAO_REST_API_KEY`, `TOUR_API_KEY`, `TMDB_ACCESS_TOKEN`은 브라우저에 노출하면 안 됩니다.
- 실제 영화관 상영시간과 범용 KBO 실시간 데이터는 별도 Provider 연결 대상으로 남겨두었습니다.
>>>>>>> 89392e5 (20일차 전체 기능 구현)
