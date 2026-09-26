const ITEMS = [
  "Affiliated to PCA Mohali",
  "U-14 · U-16 · U-19 · U-23 · Seniors",
  "Men's & Women's Cricket",
  "Open District Trials",
  "Inter-District Championships",
  "District Pathankot",
];

const List = ({ hidden = false }) => (
  <div className="flex items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
    {ITEMS.map((item) => (
      <span key={item} className="flex items-center gap-10">
        <span className="text-xs tracking-[0.28em] uppercase text-gold/90 whitespace-nowrap">{item}</span>
        <span className="w-1.5 h-1.5 rotate-45 bg-gold/50" />
      </span>
    ))}
  </div>
);

export default function Marquee() {
  return (
    <section className="border-y border-gold/15 bg-pavilion-deep/60 py-5 overflow-hidden" data-testid="marquee">
      <div className="marquee-track">
        <List />
        <List hidden />
      </div>
    </section>
  );
}
