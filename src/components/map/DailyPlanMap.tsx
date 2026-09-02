"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PlanItem } from "@/types/plan";
import type { UserLocation } from "@/types/location";
import type { MapPlanItem } from "./types";

interface KakaoLatLng {}
interface KakaoMapInstance {
  setBounds(bounds: KakaoLatLngBounds): void;
}
interface KakaoLatLngBounds {
  extend(position: KakaoLatLng): void;
}
interface KakaoMaps {
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  LatLngBounds: new () => KakaoLatLngBounds;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMapInstance;
  Marker: new (options: { map: KakaoMapInstance; position: KakaoLatLng; title?: string }) => unknown;
  Polyline: new (options: { map: KakaoMapInstance; path: KakaoLatLng[]; strokeWeight?: number; strokeOpacity?: number; strokeStyle?: string }) => unknown;
  CustomOverlay: new (options: { map: KakaoMapInstance; position: KakaoLatLng; content: string; yAnchor?: number }) => unknown;
  load(callback: () => void): void;
}

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}

function toMapItems(items: PlanItem[]): MapPlanItem[] {
  return items
    .filter((item) => item.activity.coordinates && item.activity.location !== "집")
    .map((item, index) => ({
      id: item.activity.id,
      title: item.activity.title,
      latitude: item.activity.coordinates!.latitude,
      longitude: item.activity.coordinates!.longitude,
      startTime: item.startTime,
      endTime: item.endTime,
      order: index + 1,
    }));
}

export default function DailyPlanMap({ items, startLocation }: { items: PlanItem[]; startLocation: UserLocation }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing-key" | "error">("loading");
  const mapItems = useMemo(() => toMapItems(items), [items]);

  useEffect(() => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY;
    if (!appKey) {
      setStatus("missing-key");
      return;
    }
    if (!containerRef.current) return;

    const render = () => {
      try {
        const maps = window.kakao?.maps;
        const container = containerRef.current;
        if (!maps || !container) throw new Error("Kakao Maps SDK를 불러오지 못했습니다.");

        const start = new maps.LatLng(startLocation.latitude, startLocation.longitude);
        const map = new maps.Map(container, { center: start, level: 7 });
        const bounds = new maps.LatLngBounds();
        const path: KakaoLatLng[] = [start];
        bounds.extend(start);

        new maps.Marker({ map, position: start, title: "현재 위치" });
        new maps.CustomOverlay({
          map,
          position: start,
          yAnchor: 1.8,
          content: '<div style="background:#111;color:#fff;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:700">START</div>',
        });

        for (const item of mapItems) {
          const pos = new maps.LatLng(item.latitude, item.longitude);
          bounds.extend(pos);
          path.push(pos);
          new maps.Marker({ map, position: pos, title: item.title });
          new maps.CustomOverlay({
            map,
            position: pos,
            yAnchor: 1.8,
            content: `<div style="background:white;border:1px solid #ddd;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:800">${item.order}</div>`,
          });
        }

        if (path.length > 1) {
          new maps.Polyline({ map, path, strokeWeight: 4, strokeOpacity: 0.75, strokeStyle: "solid" });
          map.setBounds(bounds);
        }
        setStatus("ready");
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    };

    if (window.kakao?.maps) {
      window.kakao.maps.load(render);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-map="true"]');
    if (existing) {
      existing.addEventListener("load", () => window.kakao?.maps.load(render), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.dataset.kakaoMap = "true";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.onload = () => window.kakao?.maps.load(render);
    script.onerror = () => setStatus("error");
    document.head.appendChild(script);
  }, [mapItems, startLocation.latitude, startLocation.longitude]);

  if (status === "missing-key") {
    return <div className="rounded-3xl border border-dashed p-6 text-sm text-neutral-500">지도 사용 시 Vercel에 NEXT_PUBLIC_KAKAO_MAP_JS_KEY를 등록하세요.</div>;
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-white">
      <div ref={containerRef} className="h-[360px] w-full" />
      {status === "loading" && <div className="absolute inset-0 grid place-items-center bg-white/80 text-sm font-bold">지도를 불러오는 중...</div>}
      {status === "error" && <div className="absolute inset-x-0 bottom-0 bg-rose-50 p-3 text-sm text-rose-700">지도는 표시하지 못했지만 일정은 정상적으로 사용할 수 있습니다.</div>}
    </div>
  );
}
