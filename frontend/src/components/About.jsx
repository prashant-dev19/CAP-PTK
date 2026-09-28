import { Check } from "lucide-react";
import Reveal, { Eyebrow } from "@/components/Reveal";
import { useSiteContent } from "@/context/SiteContent";

export default function About() {
  const c = useSiteContent();
  const points = (c.about_points || []).filter(Boolean);

  return (
    <section id="about" className="py-28 md:py-36" data-testid="about-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-12 gap-12 md:gap-16">
        <div className="md:col-span-4">
          <div className="md:sticky md:top-32">
            <Eyebrow>The Association</Eyebrow>
            <Reveal>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-ivory tracking-tight mt-6 leading-[1.05]">
                {c.about_heading}
              </h2>
            </Reveal>
          </div>
        </div>

        <div className="md:col-span-8">
          <Reveal>
            <div className="relative max-w-lg">
              <div className="absolute -inset-0 border border-gold/25 rounded-lg translate-x-4 translate-y-4" />
              <img
                src={c.about_image}
                alt="A Pathankot batsman driving on the leg side"
                className="relative rounded-lg object-cover w-full h-72 md:h-96"
                data-testid="about-image"
              />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-12 text-lg md:text-xl text-ivory/85 font-light leading-relaxed">{c.about_p1}</p>
            <p className="mt-6 text-ivory/60 leading-relaxed font-light max-w-2xl">{c.about_p2}</p>
          </Reveal>

          {points.length > 0 && (
            <Reveal delay={0.15}>
              <ul className="mt-10 grid sm:grid-cols-2 gap-4">
                {points.map((p) => (
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
          )}
        </div>
      </div>
    </section>
  );
}
