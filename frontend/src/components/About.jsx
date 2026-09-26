import { Check } from "lucide-react";
import Reveal, { Eyebrow } from "@/components/Reveal";

const IMG =
  "https://images.unsplash.com/photo-1593341646782-e0b495cff86d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODl8MHwxfHNlYXJjaHwxfHxjcmlja2V0JTIwYmF0c21hbiUyMGFjdGlvbnxlbnwwfHx8fDE3OTA0MTYyMzB8MA&ixlib=rb-4.1.0&q=85";

const POINTS = [
  "Official body for District Pathankot",
  "Affiliated to PCA, Mohali",
  "Trials & merit-based selections",
  "Squads from U-14 to Seniors — Men & Women",
];

export default function About() {
  return (
    <section id="about" className="py-28 md:py-36" data-testid="about-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-12 gap-12 md:gap-16">
        <div className="md:col-span-4">
          <div className="md:sticky md:top-32">
            <Eyebrow>The Association</Eyebrow>
            <Reveal>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-ivory tracking-tight mt-6 leading-[1.05]">
                One body for the game in <em className="italic text-gold font-light">Pathankot</em>.
              </h2>
            </Reveal>
          </div>
        </div>

        <div className="md:col-span-8">
          <Reveal>
            <div className="relative max-w-lg">
              <div className="absolute -inset-0 border border-gold/25 rounded-lg translate-x-4 translate-y-4" />
              <img
                src={IMG}
                alt="A Pathankot batsman driving on the leg side"
                className="relative rounded-lg object-cover w-full h-72 md:h-96"
                data-testid="about-image"
              />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-12 text-lg md:text-xl text-ivory/85 font-light leading-relaxed">
              The Cricket Association Pathankot (CAP) is the official cricketing body for District
              Pathankot, affiliated to the Punjab Cricket Association (PCA), Mohali.
            </p>
            <p className="mt-6 text-ivory/60 leading-relaxed font-light max-w-2xl">
              From identifying talent at open trials to formalising squads after selection, the
              Association administers every stage of the district game — conducting selections,
              making teams, and sending Pathankot's sides to inter-district competition.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <ul className="mt-10 grid sm:grid-cols-2 gap-4">
              {POINTS.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-3 text-sm text-ivory/80 border border-gold/15 bg-pavilion-mid/50 rounded-lg px-5 py-4"
                  data-testid="about-point"
                >
                  <Check size={16} className="text-gold mt-0.5 shrink-0" /> {p}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
