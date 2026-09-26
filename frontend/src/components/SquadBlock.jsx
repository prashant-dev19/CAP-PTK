import { Users } from "lucide-react";
import { Reveal } from "@/components/Reveal";

export default function SquadBlock({ squad, index }) {
  const sid = `${(squad.wing || "Men").toLowerCase()}-${squad.age_group.toLowerCase().replace("-", "")}`;

  return (
    <section
      id={`squad-${sid}`}
      className="py-20 md:py-24 border-b border-gold/10"
      data-testid={`squad-block-${sid}`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="flex items-baseline gap-5">
            <span className="text-[0.6rem] text-gold/50 tracking-[0.3em]">0{index + 1}</span>
            <h2 className="font-display text-4xl md:text-6xl text-ivory tracking-tight">
              {squad.age_group}
              <span className="text-ivory/40 text-lg md:text-2xl ml-4">{squad.label}</span>
            </h2>
          </div>
          <p className="text-sm text-ivory/50 max-w-sm md:text-right leading-relaxed">{squad.description}</p>
        </div>

        <div className="grid md:grid-cols-12 gap-10 md:gap-14 items-start">
          <div className="md:col-span-5">
            <Reveal>
              <div className="relative max-w-md">
                <div className="absolute -inset-0 border border-gold/25 rounded-lg translate-x-4 translate-y-4" />
                {squad.group_photo ? (
                  <img
                    src={squad.group_photo}
                    alt={`${squad.label} squad group photograph`}
                    className="relative rounded-lg object-cover w-full aspect-[4/3]"
                    data-testid={`squad-photo-${sid}`}
                  />
                ) : (
                  <div
                    className="relative rounded-lg w-full aspect-[4/3] border border-dashed border-gold/25 bg-pavilion-mid/30 flex flex-col items-center justify-center text-center px-8"
                    data-testid={`squad-photo-placeholder-${sid}`}
                  >
                    <Users size={22} className="text-gold/50 mb-3" />
                    <p className="text-xs text-ivory/40 tracking-wide max-w-[230px] leading-relaxed">
                      Group photograph will be added by the Association after selection.
                    </p>
                  </div>
                )}
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-8 text-[0.6rem] tracking-[0.22em] uppercase text-ivory/35 flex items-center gap-2">
                <Users size={12} className="text-gold/60" />
                {squad.players.length} player{squad.players.length === 1 ? "" : "s"}
              </p>
            </Reveal>
          </div>

          <div className="md:col-span-7">
            {squad.players.length === 0 ? (
              <Reveal>
                <div
                  className="border border-dashed border-gold/25 rounded-xl px-8 py-14 text-center"
                  data-testid={`squad-empty-${sid}`}
                >
                  <p className="font-display text-2xl md:text-3xl text-ivory/70">
                    Squad to be formalised after the next selection round.
                  </p>
                </div>
              </Reveal>
            ) : (
              <Reveal>
                <ul className="border-t border-gold/15" data-testid={`squad-roster-${sid}`}>
                  {squad.players.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center gap-x-5 gap-y-2 py-5 border-b border-gold/10 last:border-0 group"
                      data-testid={`squad-player-${sid}`}
                    >
                      <span className="w-9 h-9 rounded-full border border-gold/40 text-gold font-display text-sm flex items-center justify-center shrink-0">
                        {p.jersey_number ?? "—"}
                      </span>
                      <div className="min-w-[140px]">
                        <p className="font-display text-xl text-ivory group-hover:text-gold transition-colors">
                          {p.name}
                        </p>
                        {p.role && (
                          <p className="text-[0.56rem] tracking-[0.22em] uppercase text-gold/70 mt-0.5">{p.role}</p>
                        )}
                      </div>
                      <p className="text-xs text-ivory/50 sm:ml-auto sm:text-right">
                        {[p.batting_style, p.bowling_style].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
