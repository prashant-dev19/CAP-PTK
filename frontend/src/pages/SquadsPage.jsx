import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SquadBlock from "@/components/SquadBlock";
import { api } from "@/lib/api";
import Reveal, { Eyebrow } from "@/components/Reveal";

const WINGS = [
  { wing: "Men", title: "Men's Squads", sub: "U-14 · U-16 · U-19 · U-23 · Seniors" },
  { wing: "Women", title: "Women's Squads", sub: "U-15 · U-19 · U-23 · Seniors" },
];

export default function SquadsPage() {
  const [squads, setSquads] = useState(null);

  useEffect(() => {
    api
      .get("/squads")
      .then(({ data }) => setSquads(data || []))
      .catch(() => setSquads([]));
  }, []);

  return (
    <div className="relative min-h-screen bg-pavilion text-ivory font-body" data-testid="squads-page">
      <div aria-hidden="true" className="grain" />
      <Navbar />
      <main className="pt-32 md:pt-44">
        <header className="max-w-7xl mx-auto px-6 md:px-12">
          <Eyebrow>Squads</Eyebrow>
          <Reveal>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight text-ivory mt-6 leading-[1.02]">
              The district <em className="italic text-gold font-light">squads</em>.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xl text-ivory/55 text-sm leading-relaxed">
              Every official Pathankot squad — men's and women's wings, age category by age
              category — as formalised by the Association after selection.
            </p>
          </Reveal>
        </header>

        {squads === null ? (
          <div className="flex items-center gap-3 text-ivory/50 text-sm py-24 justify-center">
            <Loader2 size={18} className="animate-spin text-gold" /> Loading squads…
          </div>
        ) : squads.length === 0 ? (
          <p className="text-ivory/40 text-sm py-24 text-center">Squads will be published here after selection.</p>
        ) : (
          WINGS.map(({ wing, title, sub }) => {
            const list = squads.filter((s) => (s.wing || "Men") === wing);
            if (!list.length) return null;
            return (
              <div key={wing} className="mt-20 md:mt-28" data-testid={`wing-${wing.toLowerCase()}`}>
                <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-end justify-between gap-6 border-b border-gold/15 pb-6">
                  <div>
                    <h2 className="font-display text-3xl md:text-5xl text-ivory tracking-tight">{title}</h2>
                    <p className="text-[0.6rem] tracking-[0.28em] uppercase text-gold/70 mt-2">{sub}</p>
                  </div>
                  <span className="font-display text-2xl text-gold/60 italic">{list.length}</span>
                </div>
                {list.map((s, i) => (
                  <SquadBlock key={s.id} squad={s} index={i} />
                ))}
              </div>
            );
          })
        )}
      </main>
      <Footer />
    </div>
  );
}
