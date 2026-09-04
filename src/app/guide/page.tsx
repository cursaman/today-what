import Link from "next/link";
import SubpageHero from "@/components/layout/SubpageHero";

const steps = [
  {
    no: "1",
    title: "처음이라면 회원가입부터 해요",
    desc: "이메일과 비밀번호만 입력하면 시작할 수 있어요. 가입이 끝나면 바로 내 지역과 취향을 설정하는 화면으로 이어집니다.",
    tip: "이미 계정이 있다면 로그인하면 됩니다.",
    href: "/signup",
    button: "회원가입하고 시작하기",
  },
  {
    no: "2",
    title: "내 취향을 저장해요",
    desc: "자주 활동하는 지역, 예산, 함께하는 사람, 관심사, 사용하는 OTT, 좋아하는 스포츠팀, 실내·실외 선호, 이동수단을 선택하세요.",
    tip: "한 번 저장해 두면 다음 추천부터 자동으로 반영됩니다.",
    href: "/my/preferences",
    button: "내 취향 설정하기",
  },
  {
    no: "3",
    title: "밖에서 할 일을 찾아요",
    desc: "‘밖에서’ 메뉴에서 지역과 종류를 고르면 관광지·문화시설·축제·레저 후보를 볼 수 있어요. 마음에 드는 곳은 ‘일정에 추가’를 누르세요.",
    tip: "비가 오면 실내 활동을 우선해서 보는 것이 편합니다.",
    href: "/outdoor",
    button: "밖에서 찾기",
  },
  {
    no: "4",
    title: "집에서 할 일을 찾아요",
    desc: "‘집에서’ 메뉴에서는 영화와 OTT 콘텐츠를 찾아볼 수 있어요. Netflix, TVING, Disney+, Wavve, Watcha 중 내가 쓰는 서비스를 선택해 보세요.",
    tip: "포스터와 평점을 보고 마음에 들면 ‘일정에 추가’를 누르면 됩니다.",
    href: "/home",
    button: "집에서 찾기",
  },
  {
    no: "5",
    title: "A/B/C 하루 일정을 만들어요",
    desc: "관광지나 영화를 골랐다면 ‘일정만들기’로 이동하세요. 선택한 활동과 추천 후보를 조합해 서로 다른 A/B/C 하루 일정을 보여줍니다.",
    tip: "비용, 이동시간, 이동거리까지 함께 보고 가장 현실적인 일정을 고르세요.",
    href: "/plan",
    button: "일정 만들기",
  },
  {
    no: "6",
    title: "완성한 일정은 MY에 저장해요",
    desc: "마음에 드는 A/B/C 일정의 ‘이 일정 저장’을 누르면 MY에서 다시 볼 수 있어요. 저장한 일정은 제목 변경, 활동 교체, 삭제도 가능합니다.",
    tip: "나중에 다시 보고 싶은 일정은 저장해 두세요.",
    href: "/my",
    button: "MY 일정 보기",
  },
];

export default function GuidePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-28 pt-8 md:pb-16">
      <SubpageHero eyebrow="QUICK START GUIDE" title="오늘 뭐하지? 사용법" description="회원가입 → 취향 설정 → 활동 찾기 → 일정 만들기 → 저장. 이 순서만 기억하면 누구나 쉽게 시작할 수 있어요." icon="?" tone="violet" actions={<><Link href="/signup" className="rounded-2xl bg-[#18210f] px-5 py-3 text-sm font-black text-white">회원가입부터 시작하기</Link><Link href="/plan" className="rounded-2xl border border-black/10 bg-white/60 px-5 py-3 text-sm font-bold">바로 일정 만들기</Link></>} />

      <section className="mt-8 rounded-3xl border bg-white p-6 md:p-8">
        <p className="text-sm font-bold text-black/50">한 줄로 보는 사용 순서</p>
        <div className="mt-4 grid gap-3 text-sm font-bold md:grid-cols-6">
          {["회원가입", "취향 설정", "밖에서 찾기", "집에서 찾기", "A/B/C 생성", "MY 저장"].map((item, index) => (
            <div key={item} className="rounded-2xl bg-black/[0.04] p-4 text-center">
              <span className="mr-1 text-black/40">{index + 1}.</span>{item}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-5">
          <p className="text-sm font-bold text-black/45">STEP BY STEP</p>
          <h2 className="mt-1 text-2xl font-black md:text-3xl">그대로 따라 해보세요</h2>
        </div>
        <div className="space-y-4">
          {steps.map((step) => (
            <article key={step.no} className="grid gap-5 rounded-3xl border border-black/5 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,.035)] md:grid-cols-[72px_1fr_auto] md:items-center md:p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dff36b] text-xl font-black text-[#18210f]">{step.no}</div>
              <div>
                <h3 className="text-xl font-black">{step.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-black/65 md:text-base">{step.desc}</p>
                <p className="mt-3 rounded-xl bg-black/[0.04] px-4 py-3 text-sm font-semibold">💡 {step.tip}</p>
              </div>
              <Link href={step.href} className="rounded-2xl bg-black px-5 py-3 text-center text-sm font-black text-white md:min-w-40">{step.button}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-3xl border bg-white p-6 md:p-8">
        <p className="text-sm font-bold text-black/45">실제 예시</p>
        <h2 className="mt-1 text-2xl font-black">“부산에서 오늘 오후에 친구와 뭐 하지?”</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-black/[0.04] p-5">
            <p className="font-black">내 조건</p>
            <p className="mt-2 text-sm leading-6 text-black/65">부산 · 오늘 오후 · 친구와 함께 · 예산 5만원 · 관광과 영화 관심 · 대중교통 이용</p>
          </div>
          <div className="rounded-2xl bg-black/[0.04] p-5">
            <p className="font-black">오늘 뭐하지?가 하는 일</p>
            <p className="mt-2 text-sm leading-6 text-black/65">관광/영화 후보를 모으고 → 이동시간과 예산을 확인하고 → 서로 다른 A/B/C 일정으로 조합합니다.</p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-dashed p-5 text-sm leading-7">
          <strong>예)</strong> 14:00 전시 관람 → 이동 25분 → 16:30 카페/산책 → 18:30 영화 또는 집에서 OTT<br />
          마음에 들지 않는 항목은 바꾸고, 최종 일정은 MY에 저장하면 됩니다.
        </div>
      </section>

      <section className="mt-10 rounded-3xl bg-white p-6 text-center shadow-sm md:p-10">
        <h2 className="text-2xl font-black">가장 쉬운 시작 방법</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-black/60 md:text-base">처음이라면 모든 기능을 한 번에 보려고 하지 마세요. 먼저 회원가입과 취향 설정을 끝내고, 밖에서 또는 집에서 활동 하나만 골라 일정에 추가해 보세요.</p>
        <Link href="/signup" className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-sm font-black text-white">1단계 회원가입부터 시작</Link>
      </section>
    </main>
  );
}
