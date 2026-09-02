import FavoritesList from "./FavoritesList";

export default function FavoritesPage() {
  return <main className="mx-auto max-w-6xl px-4 py-12 pb-24"><p className="text-sm font-bold text-neutral-500">FAVORITES</p><h1 className="mt-1 text-4xl font-black">찜한 콘텐츠</h1><p className="mt-3 text-neutral-600">밖에서와 집에서 저장한 콘텐츠를 한곳에서 관리합니다.</p><FavoritesList /></main>;
}
