"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FavoriteItem } from "@/types/favorite";

export default function FavoritesList() {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/favorites", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setItems(Array.isArray(data.items) ? data.items : []))
      .finally(() => setLoading(false));
  }, []);

  async function remove(item: FavoriteItem) {
    const response = await fetch(`/api/favorites?contentType=${encodeURIComponent(item.contentType)}&contentId=${encodeURIComponent(item.contentId)}`, { method: "DELETE" });
    if (response.ok) setItems((current) => current.filter((value) => value.contentType !== item.contentType || value.contentId !== item.contentId));
  }

  if (loading) return <div className="mt-8 rounded-3xl bg-white p-8 text-center font-bold text-neutral-500">찜 목록을 불러오는 중입니다...</div>;
  if (!items.length) return <div className="mt-8 rounded-3xl border border-dashed bg-white p-10 text-center"><p className="font-black">아직 찜한 콘텐츠가 없습니다.</p><div className="mt-5 flex justify-center gap-2"><Link href="/outdoor" className="rounded-full border px-4 py-2 text-sm font-bold">밖에서 찾기</Link><Link href="/home" className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-bold text-white">집에서 찾기</Link></div></div>;

  return <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => (
    <article key={`${item.contentType}:${item.contentId}`} className="overflow-hidden rounded-3xl bg-white shadow-sm">
      {item.imageUrl ? <div className="aspect-[16/10] bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(item.imageUrl).slice(1, -1)})` }} /> : <div className="grid aspect-[16/10] place-items-center bg-neutral-100 text-sm font-bold text-neutral-400">이미지 없음</div>}
      <div className="p-5"><p className="text-xs font-black uppercase text-neutral-400">{item.contentType} · {item.source ?? "content"}</p><h2 className="mt-2 text-xl font-black">{item.title}</h2><button type="button" onClick={() => void remove(item)} className="mt-5 w-full rounded-2xl border border-rose-200 px-4 py-3 text-sm font-black text-rose-600">찜 취소</button></div>
    </article>
  ))}</div>;
}
