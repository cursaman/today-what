export default function MyPage() {
  return <main className="mx-auto max-w-6xl px-4 py-12 pb-24"><p className="text-sm font-bold text-neutral-500">MY</p><h1 className="mt-1 text-4xl font-black">나의 활동</h1><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["❤️","찜한 콘텐츠"],["📅","저장한 일정"],["⚽","관심 스포츠"],["📺","이용 OTT"]].map(([icon,label]) => <div key={label} className="rounded-3xl bg-white p-6 shadow-sm"><div className="text-2xl">{icon}</div><h2 className="mt-4 font-black">{label}</h2><p className="mt-1 text-sm text-neutral-400">로그인 기능 연결 예정</p></div>)}</div></main>;
}
