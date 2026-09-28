import { ArrowUpRight } from "lucide-react";
import Reveal, { Eyebrow } from "@/components/Reveal";
import { useSiteContent } from "@/context/SiteContent";

const WINGS = [
  {
    wing: "Men's Wing",
    prefix: "men",
    offset: 0,
    teams: [
      { group: "U-14", desc: "Foundation age-group cricket for the district's youngest talent." },
      { group: "U-16", desc: "Developing players for state-level age-group competitions." },
      { group: "U-19", desc: "The pathway squad bridging junior and senior cricket." },
      { group: "U-23", desc: "Emerging talent on the edge of senior selection." },
      { group: "Seniors", desc: "The flagship men's district side in PCA inter-district championships." },
    ],
  },
  {
    wing: "Women's Wing",
    prefix: "women",
    offset: 5,
    teams: [
      { group: "U-15", desc: "The youngest wing of Pathankot women's cricket." },
      { group: "U-19", desc: "Developing young women cricketers for state-level competition." },
      { group: "U-23", desc: "Emerging women's talent on the edge of senior selection." },
      { group: "Seniors", desc: "The flagship women's district side in PCA inter-district championships." },
    ],
  },
];

export default function Teams() {
  const c = useSiteContent();
  return (
    <section id="teams" className="py-28 md:py-36 bg-pavilion-deep/40 border-y border-gold/10" data-testid="teams-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <Eyebrow>Squads</Eyebrow>
            <Reveal>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-ivory mt-6 leading-[1.08]">
                {c.teams_heading}
                <br />
                <em className="italic text-gold font-light">{c.teams_accent}</em>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-sm text-ivory/55 text-sm leading-relaxed">{c.teams_sub}</p>
          </Reveal>
        </div>

        {WINGS.map((w) => (
          <div key={w.prefix} className="mt-14" data-testid={`teams-wing-${w.prefix}`}>
            <Reveal>
              <p className="font-display text-2xl md:text-3xl text-gold italic mb-2">{w.wing}</p>
            </Reveal>
            {w.teams.map((t, i) => (
              <Reveal key={`${w.prefix}-${t.group}`} delay={i * 0.05}>
                <a
                  href="/squads"
                  data-testid={`team-row-${w.prefix}-${t.group.toLowerCase().replace("-", "")}`}
                  className="group flex items-center justify-between gap-6 border-t border-gold/15 py-6 md:py-7 px-2 md:px-6 transition-colors duration-300 hover:bg-gold/5"
                >
                  <div className="flex items-baseline gap-5 md:gap-10 min-w-0">
                    <span className="text-[0.6rem] text-gold/50 tracking-[0.3em]">
                      0{w.offset + i + 1}
                    </span>
                    <span className="font-display text-2xl md:text-4xl text-ivory group-hover:text-gold transition-colors duration-300 tracking-tight">
                      {t.group}
                    </span>
                    <span className="hidden sm:block text-sm text-ivory/45 font-light max-w-xs">{t.desc}</span>
                  </div>
                  <ArrowUpRight
                    size={18}
                    className="text-gold/40 group-hover:text-gold group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 shrink-0"
                  />
                </a>
              </Reveal>
            ))}
            <div className="border-t border-gold/15" />
          </div>
        ))}

        <Reveal delay={0.2}>
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <p className="text-xs text-ivory/40 tracking-wide">
              Carry proof of age and Pathankot district residence to trials.
            </p>
            <a
              href="/squads"
              data-testid="teams-view-details"
              className="link-underline text-xs tracking-[0.22em] uppercase text-gold inline-flex items-center gap-2 w-fit"
            >
              View squad details <ArrowUpRight size={13} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
