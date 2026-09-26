import Reveal, { Eyebrow } from "@/components/Reveal";

const IMG =
  "https://images.unsplash.com/photo-1761255240689-f7864e34628e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwzfHxsZWF0aGVyJTIwY3JpY2tldCUyMGJhbGx8ZW58MHx8fHwxNzkwNDE2MjMwfDA&ixlib=rb-4.1.0&q=85";

const STEPS = [
  {
    n: "01",
    t: "Open Trials",
    d: "Trials for each age group are announced by the Association, open to eligible players from across District Pathankot.",
  },
  {
    n: "02",
    t: "Merit Selection",
    d: "Selectors assess skill, form and match temperament. Selections are made on merit — for both men's and women's wings.",
  },
  {
    n: "03",
    t: "Squad Formation",
    d: "Selected players are formalised into official district squads — the Pathankot teams for the season.",
  },
  {
    n: "04",
    t: "Inter-District",
    d: "Squads carry the district colours into inter-district matches under the Punjab Cricket Association.",
  },
];

export default function Process() {
  return (
    <section id="pathway" className="py-28 md:py-36" data-testid="pathway-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-12 gap-12">
        <div className="md:col-span-5">
          <Eyebrow>The Pathway</Eyebrow>
          <Reveal>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-ivory mt-6 leading-[1.05]">
              From trials to the <em className="italic text-gold font-light">district cap</em>.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative mt-12 hidden md:block max-w-sm">
              <div className="absolute -inset-0 border border-gold/25 rounded-lg -translate-x-4 translate-y-4" />
              <img
                src={IMG}
                alt="A seasoned leather cricket ball"
                className="relative rounded-lg object-cover w-full h-80"
                data-testid="pathway-image"
              />
            </div>
          </Reveal>
        </div>

        <div className="md:col-span-7">
          <div className="relative pl-8 md:pl-12">
            <span className="absolute left-0 top-2 bottom-2 w-px bg-gradient-to-b from-gold/50 via-gold/20 to-transparent" />
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08} className="relative pb-14 last:pb-0">
                <span className="absolute -left-8 md:-left-12 top-2 w-2 h-2 rotate-45 bg-gold" />
                <span className="font-display text-gold/60 text-xl italic">{s.n}</span>
                <h3 className="font-display text-2xl md:text-3xl text-ivory mt-1">{s.t}</h3>
                <p className="text-ivory/55 text-sm leading-relaxed mt-3 max-w-lg">{s.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
