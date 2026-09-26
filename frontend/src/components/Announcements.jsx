import { useEffect, useState } from "react";
import { Pin } from "lucide-react";
import { api } from "@/lib/api";
import Reveal, { Eyebrow } from "@/components/Reveal";

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
};

export default function Announcements() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api
      .get("/announcements")
      .then(({ data }) => setItems(data || []))
      .catch(() => setItems([]));
  }, []);

  if (!items.length) return null;

  return (
    <section
      id="announcements"
      className="py-28 md:py-36 bg-pavilion-deep/40 border-y border-gold/10"
      data-testid="announcements-section"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <Eyebrow>Notice Board</Eyebrow>
            <Reveal>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-ivory mt-6 leading-[1.05]">
                Announcements<em className="italic text-gold font-light">.</em>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-sm text-ivory/55 text-sm leading-relaxed">
              Notices from the Association — trials, selections and district matters, as posted by
              the officials.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid md:grid-cols-2 gap-6">
          {items.map((a, i) => (
            <Reveal key={a.id} delay={i * 0.06} className="h-full">
              <article
                className={`h-full border rounded-xl p-8 ${
                  a.pinned ? "border-gold/50 bg-gold/5" : "border-gold/15 bg-pavilion-mid/40"
                }`}
                data-testid={`announcement-card-${a.id}`}
              >
                {a.pinned && (
                  <span
                    className="inline-flex items-center gap-1.5 text-[0.58rem] tracking-[0.25em] uppercase text-gold border border-gold/40 rounded-full px-3 py-1 mb-5"
                    data-testid="announcement-pinned-badge"
                  >
                    <Pin size={10} /> Pinned
                  </span>
                )}
                <p className="text-[0.6rem] tracking-[0.25em] uppercase text-gold/70">{fmtDate(a.created_at)}</p>
                <h3 className="font-display text-2xl text-ivory mt-3">{a.title}</h3>
                <p className="text-sm text-ivory/60 leading-relaxed mt-3 whitespace-pre-line">{a.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
