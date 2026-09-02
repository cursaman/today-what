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

```bash
npm install
npm run dev
```

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

## /outdoor 실제 TourAPI 연동

`/outdoor` 페이지는 한국관광공사 국문 관광정보 서비스 `KorService2/areaBasedList2`를 서버에서 호출합니다.

필수 Vercel 환경변수:

```env
TOUR_API_KEY=공공데이터포털_일반인증키
```

적용 후 Vercel에서 Redeploy 하세요. API 키는 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다.

기능:
- 전국 17개 시도 지역 선택
- 관광지 / 문화·전시 / 축제·행사 / 레저·체험 필터
- 현재 날씨(Open-Meteo) 표시
- 실제 TourAPI 이미지/주소/좌표 표시
- 날씨와 지역 중심 거리 기반 추천 이유 표시
- `일정에 추가` 클릭 시 최대 5개를 임시 일정 후보로 저장
- `/plan`에서 직접 선택한 활동에 추천 우선순위를 부여하여 A/B/C 일정에 반영

테스트 순서:
1. `/outdoor` 접속
2. 부산 등 지역 변경
3. 카테고리 변경
4. 관광 카드 출력 확인
5. `일정에 추가` 클릭
6. 상단 `일정 후보 N개 보기` 클릭
7. `/plan` 상단에 `밖에서 선택한 활동 N개` 문구 확인
8. A/B/C 일정에 선택 활동이 반영되는지 확인

## HOME / TMDB + OTT
- `/home` uses TMDB movie metadata and the KR watch-provider data.
- Set `TMDB_ACCESS_TOKEN` in Vercel (server-only, do not prefix with NEXT_PUBLIC_).
- Supported UI filters: Netflix, TVING, Disney+, Wavve, Watcha.
- Streaming availability is sourced through TMDB's JustWatch partnership; keep the JustWatch attribution visible.
- Movies added from `/home` use the same plan-draft cookie as `/outdoor` and are prioritized on `/plan`.

## MY 일정 관리 점검

- `/my`: 최신순 일정 목록, 날짜 필터, A/B/C 스타일, 개별/다중 선택 삭제
- `/my/plans/[id]`: 상세보기, 제목 수정, 활동 교체, 비용/거리/이동시간 재계산, 삭제
- RLS 재점검: Supabase SQL Editor에서 `supabase/day-my-rls-check.sql` 실행

테스트 순서:
1. 서로 다른 날짜/스타일의 일정 2개 이상 저장
2. `/my`에서 최신순/날짜 필터/스타일 배지 확인
3. 체크박스로 여러 일정 선택 후 선택 삭제
4. 상세보기에서 제목 수정
5. 유동 활동 교체 후 비용/거리/이동시간 합계 변경 확인
6. 다른 계정으로 로그인해 첫 계정 일정이 노출되지 않는지 확인

## MY Preferences 개인화
- `/my/preferences`: 지역, 예산, 동행, 관심사, OTT, 스포츠팀, 실내/실외, 이동수단 저장
- `/outdoor`: 저장한 기본 지역을 첫 지역으로 사용
- `/home`: 저장한 OTT 서비스를 기본 필터로 사용
- `/plan`: 예산/관심사/동행/팀/실내외/이동수단을 추천 점수와 이동 허용 범위에 반영
- Supabase: `supabase/day-preferences-rls.sql` 실행으로 사용자별 RLS 재점검

## 사용법 페이지
- PC 상단 메뉴: `사용법` → `/guide`
- 모바일 상단: `사용법` 버튼 제공
- `/guide`에서 초보자용 6단계 사용 흐름과 각 페이지 바로가기 제공

## Beginner onboarding update
- Guide begins with signup instead of protected preferences page.
- Signup fields use explicit labels and explain the next step.
- New users with an immediate Supabase session move directly to `/my/preferences`.
- Email-confirmation users are guided to `/login?next=/my/preferences`.
- Login safely honors an internal `next` path.
- Header and mobile account navigation show `로그인` while signed out and `MY` while signed in.
- Preferences save screen exposes clear next actions for `/outdoor` and `/home`.


## Supabase 이메일 인증 리다이렉트

Vercel 운영 환경에서는 다음 환경변수를 추가하세요.

```env
NEXT_PUBLIC_SITE_URL=https://today-what-pi.vercel.app
```

회원가입 시 `emailRedirectTo`가 `${NEXT_PUBLIC_SITE_URL}/my/preferences`로 설정됩니다.
Supabase Dashboard의 **Authentication → URL Configuration**에서도 아래 주소를 허용해야 합니다.

- Site URL: `https://today-what-pi.vercel.app`
- Redirect URLs: `https://today-what-pi.vercel.app/**`
- 로컬 개발이 필요하면 `http://localhost:3000/**`도 추가


## 일정 후보 계정 분리
- 일정 후보 쿠키는 로그인 사용자별로 분리됩니다.
- 신규 회원가입 시 게스트/구버전 후보 쿠키를 초기화합니다.
- /plan에서 선택 후보 목록과 A/B/C별 반영 개수를 확인할 수 있습니다.
