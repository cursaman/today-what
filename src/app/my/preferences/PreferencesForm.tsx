"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { savePreferences } from "./actions";

interface InitialPreferences {
  default_region?: string | null;
  budget_level?: number | null;
  companion_type?: string | null;
  interests?: string[] | null;
  favorite_teams?: string[] | null;
  ott_services?: string[] | null;
  activity_mode?: string | null;
  transport_mode?: string | null;
}

const REGIONS = ["부산","서울","인천","대전","대구","광주","울산","세종","경기","강원","충북","충남","경북","경남","전북","전남","제주"];
const INTEREST_GROUPS = [
  { label: "나들이·문화", items: [["travel","관광"],["culture","전시·문화"],["cafe","카페"]] },
  { label: "콘텐츠", items: [["movie","영화"],["ott","OTT"]] },
  { label: "스포츠·레저", items: [["sports","스포츠 관람"],["activity","체험·레저"],["golf","골프(필드·스크린)"]] },
] as const;
const OTT = ["Netflix", "TVING", "Disney+", "Wavve", "Watcha"];
const BUDGETS = [[30000,"3만원"],[50000,"5만원"],[100000,"10만원"],[200000,"20만원"]] as const;

export default function PreferencesForm({ initialData }: { initialData: InitialPreferences | null }) {
  const normalizedMode = initialData?.activity_mode === "relaxed" ? "indoor" : (initialData?.activity_mode ?? "balanced");
  const [region, setRegion] = useState(initialData?.default_region ?? "부산");
  const [budget, setBudget] = useState(initialData?.budget_level ?? 50000);
  const [companion, setCompanion] = useState(initialData?.companion_type ?? "alone");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialData?.interests ?? ["movie", "travel"]);
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>(initialData?.favorite_teams ?? []);
  const [ottServices, setOttServices] = useState<string[]>(initialData?.ott_services ?? ["Netflix"]);
  const [activityMode, setActivityMode] = useState(normalizedMode);
  const [transportMode, setTransportMode] = useState(initialData?.transport_mode ?? "car");
  const [teamInput, setTeamInput] = useState("");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const toggle = (value: string, values: string[], setter: (value: string[]) => void) => setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);

  function submit() {
    startTransition(async () => {
      const result = await savePreferences({ defaultRegion: region, budgetLevel: Number(budget), companionType: companion, interests: selectedInterests, favoriteTeams, ottServices, activityMode, transportMode });
      setMessage(result.message);
      setSaved(result.success);
    });
  }

  return <div className="mt-8 space-y-7 rounded-3xl bg-white p-6 shadow-sm">
    <label className="block"><span className="font-black">기본 지역</span><select className="mt-2 w-full rounded-2xl border p-3" value={region} onChange={(e)=>setRegion(e.target.value)}>{REGIONS.map(v=><option key={v}>{v}</option>)}</select></label>
    <section><h2 className="font-black">하루 예산 수준</h2><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{BUDGETS.map(([value,label])=><button key={value} type="button" onClick={()=>setBudget(value)} className={`rounded-2xl border p-3 font-bold ${budget===value?"bg-neutral-900 text-white":""}`}>{label}</button>)}</div></section>
    <label className="block"><span className="font-black">누구와 함께?</span><select className="mt-2 w-full rounded-2xl border p-3" value={companion} onChange={(e)=>setCompanion(e.target.value)}><option value="alone">혼자</option><option value="friend">친구</option><option value="couple">연인</option><option value="family">가족</option></select></label>
    <section><h2 className="font-black">관심사 · 복수 선택</h2><div className="mt-3 space-y-3">{INTEREST_GROUPS.map((group)=><div key={group.label}><p className="mb-2 text-xs font-black text-neutral-400">{group.label}</p><div className="flex flex-wrap gap-2">{group.items.map(([value,label])=><button type="button" key={value} onClick={()=>toggle(value,selectedInterests,setSelectedInterests)} className={`rounded-full border px-4 py-2 text-sm font-bold ${selectedInterests.includes(value)?"bg-neutral-900 text-white":""}`}>{label}</button>)}</div></div>)}</div></section>
    <section><h2 className="font-black">사용 OTT</h2><div className="mt-2 flex flex-wrap gap-2">{OTT.map(value=><button type="button" key={value} onClick={()=>toggle(value,ottServices,setOttServices)} className={`rounded-full border px-4 py-2 text-sm font-bold ${ottServices.includes(value)?"bg-neutral-900 text-white":""}`}>{value}</button>)}</div></section>
    <section><h2 className="font-black">좋아하는 스포츠팀</h2><div className="mt-2 flex gap-2"><input className="min-w-0 flex-1 rounded-2xl border p-3" value={teamInput} onChange={(e)=>setTeamInput(e.target.value)} placeholder="예: 롯데 자이언츠"/><button type="button" className="rounded-2xl bg-neutral-900 px-4 font-bold text-white" onClick={()=>{const v=teamInput.trim();if(v&&!favoriteTeams.includes(v))setFavoriteTeams([...favoriteTeams,v]);setTeamInput("");}}>추가</button></div><div className="mt-2 flex flex-wrap gap-2">{favoriteTeams.map(team=><button type="button" key={team} onClick={()=>setFavoriteTeams(favoriteTeams.filter(v=>v!==team))} className="rounded-full bg-neutral-100 px-3 py-2 text-sm">{team} ×</button>)}</div></section>
    <section><h2 className="font-black">실내 / 실외 선호</h2><div className="mt-2 grid grid-cols-3 gap-2">{[["indoor","실내"],["balanced","균형"],["outdoor","실외"]].map(([v,l])=><button key={v} type="button" onClick={()=>setActivityMode(v)} className={`rounded-2xl border p-3 font-bold ${activityMode===v?"bg-neutral-900 text-white":""}`}>{l}</button>)}</div></section>
    <label className="block"><span className="font-black">주 이동수단</span><select className="mt-2 w-full rounded-2xl border p-3" value={transportMode} onChange={(e)=>setTransportMode(e.target.value)}><option value="car">자동차</option><option value="transit">대중교통</option><option value="walk">도보</option></select></label>
    <button type="button" disabled={pending} onClick={submit} className="w-full rounded-2xl bg-neutral-900 p-4 font-black text-white disabled:opacity-50">{pending?"저장 중...":"내 취향 저장하고 활동 찾기"}</button>
    {message&&<p className="text-center text-sm font-bold text-neutral-600">{message}</p>}
    {saved&&<div className="grid grid-cols-2 gap-2"><Link href="/outdoor" className="rounded-2xl border p-3 text-center text-sm font-black">밖에서 찾기</Link><Link href="/home" className="rounded-2xl border p-3 text-center text-sm font-black">집에서 찾기</Link></div>}
  </div>;
}
