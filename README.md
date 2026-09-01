# 오늘 뭐하지? (today-what)

날씨·시간·지역·취향을 기준으로 외부/내부 활동을 추천하고 하루 일정을 만드는 Next.js 프로젝트입니다.

## 현재 포함
- Next.js App Router + TypeScript + Tailwind CSS
- 메인 / 밖에서 / 집에서 / 일정만들기 / MY
- Supabase `activities` 서버 조회
- Supabase 초기 SQL (`supabase/schema.sql`)
- Vercel 환경변수 연결 전에도 첫 배포 가능

## Vercel 중심 시작 순서
1. 이 폴더를 GitHub 저장소에 업로드합니다.
2. Vercel에서 GitHub 저장소를 Import합니다.
3. 우선 환경변수 없이 첫 배포하여 기본 화면을 확인합니다.
4. Supabase 프로젝트를 생성합니다.
5. Supabase SQL Editor에서 `supabase/schema.sql`을 실행합니다.
6. Vercel Project > Settings > Environment Variables에 아래 값을 등록합니다.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Vercel에서 Redeploy합니다.
8. 메인 화면의 '추천 활동'에 Supabase 샘플 데이터가 표시되면 연결 성공입니다.

## 환경변수
`.env.example` 참고. 실제 키는 GitHub에 커밋하지 마세요.

## 다음 개발 순서
- Supabase Auth
- activities CRUD
- favorites CRUD
- plans / plan_items CRUD
- 날씨 API
- 관광 / 영화 / OTT / 스포츠 / 요리 / 도서 API
- 추천 일정 엔진
