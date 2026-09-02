import type { Coordinates } from "@/types/activity";
import type { WeatherInfo } from "./types";

interface OpenMeteoResponse {
  current?: { temperature_2m?: number; precipitation?: number; weather_code?: number };
  hourly?: { time?: string[]; precipitation_probability?: number[] };
}

function describeWeather(code = 0) {
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "비";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "눈";
  if ([1, 2, 3].includes(code)) return "구름";
  return "맑음";
}

function precipitationForWindow(data: OpenMeteoResponse, startTime?: string, endTime?: string) {
  const times = data.hourly?.time ?? [];
  const values = data.hourly?.precipitation_probability ?? [];
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const nowHour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul", hour: "2-digit", hourCycle: "h23",
  }).format(new Date());
  const from = startTime ?? `${nowHour}:00`;
  const to = endTime ?? "23:59";
  const selected = values.filter((_, index) => {
    const value = times[index];
    if (!value?.startsWith(`${today}T`)) return false;
    const time = value.slice(11, 16);
    return time >= from && time <= to;
  });
  return selected.length ? Math.max(...selected) : 0;
}

export async function getWeather(region: string, coordinates: Coordinates, startTime?: string, endTime?: string): Promise<WeatherInfo> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(coordinates.latitude));
    url.searchParams.set("longitude", String(coordinates.longitude));
    url.searchParams.set("current", "temperature_2m,precipitation,weather_code");
    url.searchParams.set("hourly", "precipitation_probability");
    url.searchParams.set("timezone", "Asia/Seoul");
    const response = await fetch(url, { next: { revalidate: 900 } });
    if (!response.ok) throw new Error(String(response.status));
    const data = (await response.json()) as OpenMeteoResponse;
    const precipitationProbability = precipitationForWindow(data, startTime, endTime);
    const precipitation = data.current?.precipitation ?? 0;
    const code = data.current?.weather_code ?? 0;
    return {
      region,
      temperature: data.current?.temperature_2m ?? 20,
      condition: describeWeather(code),
      precipitationProbability,
      raining: precipitation > 0 || precipitationProbability >= 60,
    };
  } catch {
    return { region, temperature: 20, condition: "정보 없음", precipitationProbability: 0, raining: false };
  }
}
