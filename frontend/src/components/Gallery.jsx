import Reveal, { Eyebrow } from "@/components/Reveal";

const U = "https://images.unsplash.com";
const Q = "?crop=entropy&cs=srgb&fm=jpg&q=85";

const PHOTOS = [
  { src: `${U}/photo-1565787154274-c8d076ad34e7${Q}`, caption: "The appeal", cls: "col-span-2 row-span-2" },
  { src: `${U}/photo-1593766827228-8737b4534aa6${Q}`, caption: "Timber", cls: "" },
  { src: `${U}/photo-1595210382051-4d2c31fcc2f4${Q}`, caption: "Front foot", cls: "" },
  { src: `${U}/photo-1624193757636-b829dfa06a1b${Q}`, caption: "Between the wickets", cls: "col-span-2" },
  { src: `${U}/photo-1729027696167-0f3aa8e92e64${Q}`, caption: "In the nets", cls: "" },
  { src: `${U}/photo-1595210382266-2d0077c1f541${Q}`, caption: "The drive", cls: "" },
];

export default function Gallery() {
  return (
    <section id="gallery" className="py-28 md:py-36" data-testid="gallery-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <Eyebrow>Gallery</Eyebrow>
            <Reveal>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-ivory mt-6 leading-[1.05]">
                District cricket, <em className="italic text-gold font-light">in pictures</em>.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-sm text-ivory/55 text-sm leading-relaxed">
              Moments from the district game — match days, the nets, and everything in between.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div
            className="mt-14 grid grid-cols-2 md:grid-cols-4 auto-rows-[150px] md:auto-rows-[200px] gap-3 md:gap-4"
            data-testid="gallery-grid"
          >
            {PHOTOS.map((p) => (
              <figure
                key={p.src}
                className={`relative overflow-hidden rounded-lg group ${p.cls}`}
                data-testid="gallery-item"
              >
                <img
                  src={p.src}
                  alt={p.caption}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <figcaption className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-pavilion/90 via-pavilion/40 to-transparent px-4 pb-3 pt-8 text-[0.62rem] tracking-[0.22em] uppercase text-ivory/85 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  {p.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>

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
