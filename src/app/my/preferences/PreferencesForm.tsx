"use client";

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

const interests = ["movie", "sports", "travel", "ott", "cafe", "culture"];
const ott = ["Netflix", "Disney+", "TVING", "Wavve", "Watcha"];

export default function PreferencesForm({ initialData }: { initialData: InitialPreferences | null }) {
  const [region, setRegion] = useState(initialData?.default_region ?? "부산");
  const [budget, setBudget] = useState(initialData?.budget_level ?? 50000);
  const [companion, setCompanion] = useState(initialData?.companion_type ?? "alone");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialData?.interests ?? ["movie", "travel"]);
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>(initialData?.favorite_teams ?? ["롯데"]);
  const [ottServices, setOttServices] = useState<string[]>(initialData?.ott_services ?? ["Netflix"]);
  const [activityMode, setActivityMode] = useState(initialData?.activity_mode ?? "balanced");
  const [transportMode, setTransportMode] = useState(initialData?.transport_mode ?? "car");
  const [teamInput, setTeamInput] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const toggle = (value: string, values: string[], setter: (value: string[]) => void) => {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  function submit() {
    startTransition(async () => {
      const result = await savePreferences({
        defaultRegion: region,
        budgetLevel: Number(budget),
        companionType: companion,
        interests: selectedInterests,
        favoriteTeams,
        ottServices,
        activityMode,
        transportMode,
      });
      setMessage(result.message);
    });
  }

  return (
    <div className="mt-8 space-y-7 rounded-3xl bg-white p-6 shadow-sm">
      <label className="block"><span className="font-black">기본 지역</span><input className="mt-2 w-full rounded-2xl border p-3" value={region} onChange={(e) => setRegion(e.target.value)} /></label>
      <label className="block"><span className="font-black">하루 예산</span><input type="number" className="mt-2 w-full rounded-2xl border p-3" value={budget} onChange={(e) => setBudget(Number(e.target.value))} /></label>
      <label className="block"><span className="font-black">동행</span><select className="mt-2 w-full rounded-2xl border p-3" value={companion} onChange={(e) => setCompanion(e.target.value)}><option value="alone">혼자</option><option value="couple">연인</option><option value="family">가족</option><option value="friend">친구</option></select></label>
      <section><h2 className="font-black">관심분야</h2><div className="mt-2 flex flex-wrap gap-2">{interests.map((value) => <button type="button" key={value} onClick={() => toggle(value, selectedInterests, setSelectedInterests)} className={`rounded-full border px-4 py-2 text-sm font-bold ${selectedInterests.includes(value) ? "bg-neutral-900 text-white" : ""}`}>{value}</button>)}</div></section>
      <section><h2 className="font-black">좋아하는 팀</h2><div className="mt-2 flex gap-2"><input className="min-w-0 flex-1 rounded-2xl border p-3" value={teamInput} onChange={(e) => setTeamInput(e.target.value)} placeholder="예: 롯데" /><button type="button" className="rounded-2xl bg-neutral-900 px-4 font-bold text-white" onClick={() => { const v = teamInput.trim(); if (v && !favoriteTeams.includes(v)) setFavoriteTeams([...favoriteTeams, v]); setTeamInput(""); }}>추가</button></div><div className="mt-2 flex flex-wrap gap-2">{favoriteTeams.map((team) => <button type="button" key={team} onClick={() => setFavoriteTeams(favoriteTeams.filter((v) => v !== team))} className="rounded-full bg-neutral-100 px-3 py-2 text-sm">{team} ×</button>)}</div></section>
      <section><h2 className="font-black">사용 OTT</h2><div className="mt-2 flex flex-wrap gap-2">{ott.map((value) => <button type="button" key={value} onClick={() => toggle(value, ottServices, setOttServices)} className={`rounded-full border px-4 py-2 text-sm font-bold ${ottServices.includes(value) ? "bg-neutral-900 text-white" : ""}`}>{value}</button>)}</div></section>
      <div className="grid gap-4 sm:grid-cols-2"><label><span className="font-black">추천 스타일</span><select className="mt-2 w-full rounded-2xl border p-3" value={activityMode} onChange={(e) => setActivityMode(e.target.value)}><option value="outdoor">외출형</option><option value="balanced">균형형</option><option value="relaxed">여유형</option></select></label><label><span className="font-black">이동수단</span><select className="mt-2 w-full rounded-2xl border p-3" value={transportMode} onChange={(e) => setTransportMode(e.target.value)}><option value="car">자동차</option><option value="transit">대중교통</option><option value="walk">도보</option></select></label></div>
      <button type="button" disabled={pending} onClick={submit} className="w-full rounded-2xl bg-neutral-900 p-4 font-black text-white disabled:opacity-50">{pending ? "저장 중..." : "설정 저장"}</button>
      {message && <p className="text-center text-sm text-neutral-600">{message}</p>}
    </div>
  );
}
