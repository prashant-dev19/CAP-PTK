import Reveal, { Eyebrow } from "@/components/Reveal";
import { useSiteContent } from "@/context/SiteContent";

const CAPTIONS = ["The appeal", "Timber", "Front foot", "Between the wickets", "In the nets", "The drive"];

const SPANS = ["col-span-2 row-span-2", "", "", "col-span-2", "", ""];

export default function Gallery() {
  const c = useSiteContent();
  const urls = (c.gallery_urls || []).filter(Boolean);

  return (
    <section id="gallery" className="py-28 md:py-36" data-testid="gallery-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <Eyebrow>Gallery</Eyebrow>
            <Reveal>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-ivory mt-6 leading-[1.05]">
                {c.gallery_heading}
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-sm text-ivory/55 text-sm leading-relaxed">
              Moments from the district game — match days, the nets, and everything in between.
            </p>
          </Reveal>
        </div>

        {urls.length === 0 ? (
          <Reveal delay={0.1}>
            <div
              className="mt-14 border border-dashed border-gold/25 rounded-xl py-20 text-center text-ivory/40 text-sm"
              data-testid="gallery-placeholder"
            >
              Gallery photographs will be added by the Association.
            </div>
          </Reveal>
        ) : (
          <Reveal delay={0.1}>
            <div
              className="mt-14 grid grid-cols-2 md:grid-cols-4 auto-rows-[150px] md:auto-rows-[200px] gap-3 md:gap-4"
              data-testid="gallery-grid"
            >
              {urls.slice(0, 6).map((src, i) => (
                <figure
                  key={src}
                  className={`relative overflow-hidden rounded-lg group ${SPANS[i] || ""}`}
                  data-testid="gallery-item"
                >
                  <img
                    src={src}
                    alt={CAPTIONS[i] || `District cricket ${i + 1}`}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <figcaption className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-pavilion/90 via-pavilion/40 to-transparent px-4 pb-3 pt-8 text-[0.62rem] tracking-[0.22em] uppercase text-ivory/85 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {CAPTIONS[i] || `District cricket ${i + 1}`}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Reveal>
        )}

        <Reveal delay={0.15}>
          <p className="mt-8 text-xs text-ivory/40 tracking-wide">
            Representative photographs of the district game. The Association's own match album will
            follow.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
