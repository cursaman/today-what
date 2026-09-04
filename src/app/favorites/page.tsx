import FavoritesList from "./FavoritesList";
import SubpageHero from "@/components/layout/SubpageHero";

export default function FavoritesPage() {
  return <main className="mx-auto max-w-6xl px-4 py-8 pb-24"><SubpageHero eyebrow="MY FAVORITES" title="찜한 콘텐츠" description="밖에서 발견한 장소와 집에서 보고 싶은 콘텐츠를 한곳에 모아두었어요." icon="♥" tone="rose" /><FavoritesList /></main>;
}
