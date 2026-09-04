import type { ReactNode } from "react";

const TONES = {
  lime: "from-[#eff9b9] to-[#dff36b]",
  coral: "from-[#fff0e9] to-[#ffd8c7]",
  sky: "from-[#edf8ff] to-[#cde9ff]",
  violet: "from-[#f5f0ff] to-[#ded1ff]",
  rose: "from-[#fff0f3] to-[#ffd6df]",
} as const;

export default function SubpageHero({ eyebrow, title, description, icon, tone = "lime", actions }: {
  eyebrow: string; title: string; description: string; icon: string; tone?: keyof typeof TONES; actions?: ReactNode;
}) {
  return (
    <section className={`relative overflow-hidden rounded-[2rem] border border-black/5 bg-gradient-to-br ${TONES[tone]} px-6 py-8 md:rounded-[2.5rem] md:px-10 md:py-11`}>
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full border-[26px] border-white/35" />
      <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
        <div className="max-w-3xl">
          <p className="text-[11px] font-black tracking-[0.2em] text-black/45">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black leading-tight tracking-[-0.04em] text-[#18210f] md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-black/55 md:text-base md:leading-7">{description}</p>
          {actions ? <div className="mt-6 flex flex-wrap gap-2">{actions}</div> : null}
        </div>
        <span aria-hidden="true" className="grid h-20 w-20 shrink-0 rotate-3 place-items-center rounded-[1.7rem] bg-white/65 text-4xl shadow-sm backdrop-blur md:h-24 md:w-24 md:text-5xl">{icon}</span>
      </div>
    </section>
  );
}
