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
```bash
npm install
npm run dev
```

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
