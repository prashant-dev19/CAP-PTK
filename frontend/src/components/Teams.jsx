import { ArrowUpRight } from "lucide-react";
import Reveal, { Eyebrow } from "@/components/Reveal";

const TEAMS = [
  { group: "U-14", desc: "Foundation age-group cricket for the district's youngest talent.", wing: "Boys & Girls" },
  { group: "U-16", desc: "Developing players for state-level age-group competitions.", wing: "Boys & Girls" },
  { group: "U-19", desc: "The pathway squad bridging junior and senior cricket.", wing: "Boys & Girls" },
  { group: "U-23", desc: "Emerging talent on the edge of senior selection.", wing: "Men & Women" },
  { group: "Seniors", desc: "The flagship district side in PCA inter-district championships.", wing: "Men & Women" },
];

export default function Teams() {
  return (
    <section id="teams" className="py-28 md:py-36 bg-pavilion-deep/40 border-y border-gold/10" data-testid="teams-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <Eyebrow>Squads</Eyebrow>
            <Reveal>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-ivory mt-6 leading-[1.08]">
                Five age groups. Two wings.
                <br />
                <em className="italic text-gold font-light">One district.</em>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-sm text-ivory/55 text-sm leading-relaxed">
              Selections are held for every category, for men and women alike. Registered players
              are called to trials as squads are formalised.
            </p>
          </Reveal>
        </div>

        <div className="mt-16">
          {TEAMS.map((t, i) => (
            <Reveal key={t.group} delay={i * 0.05}>
              <a
                href="#register"
                data-testid={`team-row-${t.group.toLowerCase().replace("-", "")}`}
                className="group flex items-center justify-between gap-6 border-t border-gold/15 py-7 md:py-9 px-2 md:px-6 transition-colors duration-300 hover:bg-gold/5"
              >
                <div className="flex items-baseline gap-5 md:gap-10 min-w-0">
                  <span className="text-[0.6rem] text-gold/50 tracking-[0.3em]">0{i + 1}</span>
                  <span className="font-display text-3xl md:text-5xl text-ivory group-hover:text-gold transition-colors duration-300 tracking-tight">
                    {t.group}
                  </span>
                  <span className="hidden sm:block text-sm text-ivory/45 font-light max-w-xs">{t.desc}</span>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <span className="hidden md:block text-[0.6rem] tracking-[0.25em] uppercase text-ivory/40">
                    {t.wing}
                  </span>
                  <ArrowUpRight
                    size={20}
                    className="text-gold/40 group-hover:text-gold group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300"
                  />
                </div>
              </a>
            </Reveal>
          ))}
          <div className="border-t border-gold/15" />
        </div>

        <Reveal delay={0.2}>
          <p className="mt-8 text-xs text-ivory/40 tracking-wide">
            Carry proof of age and Pathankot district residence to trials.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
