import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SquadBlock from "@/components/SquadBlock";
import { api } from "@/lib/api";
import Reveal, { Eyebrow } from "@/components/Reveal";

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
      <main className="pt-32 md:pt-44 pb-4">
        <header className="max-w-7xl mx-auto px-6 md:px-12">
          <Eyebrow>Squads</Eyebrow>
          <Reveal>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight text-ivory mt-6 leading-[1.02]">
              The district <em className="italic text-gold font-light">squads</em>.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xl text-ivory/55 text-sm leading-relaxed">
              Every official Pathankot squad, age category by age category — group photographs and
              player details, as formalised after selection.
            </p>
          </Reveal>
        </header>

        <div className="mt-16 md:mt-24 border-t border-gold/10">
          {squads === null ? (
            <div className="flex items-center gap-3 text-ivory/50 text-sm py-24 justify-center">
              <Loader2 size={18} className="animate-spin text-gold" /> Loading squads…
            </div>
          ) : squads.length === 0 ? (
            <p className="text-ivory/40 text-sm py-24 text-center">Squads will be published here shortly.</p>
          ) : (
            squads.map((s, i) => <SquadBlock key={s.id} squad={s} index={i} />)
          )}
        </div>

        {squads !== null && squads.length > 0 && (
          <Reveal>
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="text-ivory/50 text-sm max-w-md leading-relaxed">
                Think you belong in one of these squads? Register with the Association and attend the
                next trial round.
              </p>
              <Link
                to="/#register"
                data-testid="squades-cta"
                className="btn-gold bg-gold text-pavilion text-xs tracking-[0.22em] uppercase font-semibold px-9 py-4 rounded-full"
              >
                Register as a Player
              </Link>
            </div>
          </Reveal>
        )}
      </main>
      <Footer />
    </div>
  );
}
