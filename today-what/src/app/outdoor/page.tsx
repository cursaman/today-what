const items = ["관광", "영화관", "축제/행사", "전시/공연", "산책/체험"];
export default function OutdoorPage() {
  return <main className="mx-auto max-w-6xl px-4 py-12 pb-24"><p className="text-sm font-bold text-neutral-500">OUTDOOR</p><h1 className="mt-1 text-4xl font-black">밖에서 뭐하지?</h1><p className="mt-3 text-neutral-600">날씨가 괜찮을 때 즐길 외부 활동을 모읍니다.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(x => <div key={x} className="rounded-3xl bg-white p-7 shadow-sm"><h2 className="text-xl font-black">{x}</h2><p className="mt-2 text-sm text-neutral-500">API 연결 예정</p></div>)}</div></main>;
}
