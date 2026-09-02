const items = ["영화/OTT", "TV", "스포츠", "요리", "독서", "홈트/취미"];
export default function HomeActivityPage() {
  return <main className="mx-auto max-w-6xl px-4 py-12 pb-24"><p className="text-sm font-bold text-neutral-500">HOME</p><h1 className="mt-1 text-4xl font-black">집에서 뭐하지?</h1><p className="mt-3 text-neutral-600">비 오는 날이나 쉬고 싶은 날을 위한 내부 활동입니다.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(x => <div key={x} className="rounded-3xl bg-white p-7 shadow-sm"><h2 className="text-xl font-black">{x}</h2><p className="mt-2 text-sm text-neutral-500">API 연결 예정</p></div>)}</div></main>;
}
